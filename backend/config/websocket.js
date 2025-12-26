
// backend/config/websocket.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class WebSocketConfig {
    constructor(server) {
        this.server = server;
        this.connectedUsers = new Map(); 
        this.userSockets = new Map(); 
        this.initializeSocketServer();
        
        console.log('🚀 WebSocket server initialized for real-time chat');
    }

    initializeSocketServer() {
        this.io = new Server(this.server, {
            cors: {
                origin: [
                    "http://localhost:3000",
                    "http://localhost:3001",
                    process.env.FRONTEND_URL || "http://localhost:3000"
                ],
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            pingInterval: 25000
        });

        this.setupMiddleware();
        this.setupEventHandlers();
        
        this.io.use((socket, next) => {
            socket.request.io = this.io;
            next();
        });
    }

    setupMiddleware() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || 
                            socket.handshake.headers.authorization?.split(' ')[1];
                
                if (!token) {
                    socket.userId = 'anonymous';
                    socket.user = { id: 'anonymous', username: 'Guest', role: 'guest' };
                    return next();
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                
                const user = await this.validateUser(decoded.userId || decoded.id);
                if (!user) {
                    return next(new Error('Invalid user'));
                }

                socket.userId = user.id;
                socket.user = user;
                next();
            } catch (error) {
                console.log('WebSocket auth error:', error.message);
                socket.userId = 'anonymous';
                socket.user = { id: 'anonymous', username: 'Guest', role: 'guest' };
                next();
            }
        });
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }

    async handleConnection(socket) {
        const userId = socket.userId;
        const user = socket.user;
        
        try {
            console.log(`✅ User connected: ${user.username || userId} (${socket.id})`);

    
            if (!this.connectedUsers.has(userId)) {
                this.connectedUsers.set(userId, new Set());
            }
            this.connectedUsers.get(userId).add(socket.id);
            
            this.userSockets.set(socket.id, { 
                userId, 
                user, 
                connectedAt: Date.now(),
                rooms: new Set()
            });

            socket.join(`user_${userId}`);
            
           
            this.setupSocketEventHandlers(socket);

            socket.emit('connection_established', {
                userId,
                serverTime: Date.now(),
                onlineUsers: this.connectedUsers.size
            });

        } catch (error) {
            console.error('Error handling connection:', error);
            socket.disconnect();
        }
    }

    setupSocketEventHandlers(socket) {
        const userId = socket.userId;
        const user = socket.user;

      
        socket.on('join_room', async (data) => {
            try {
                const { roomId } = data;
                socket.join(`room_${roomId}`);
                
                const socketInfo = this.userSockets.get(socket.id);
                if (socketInfo) {
                    socketInfo.rooms.add(roomId);
                }

                socket.to(`room_${roomId}`).emit('user_joined_room', {
                    roomId,
                    user: user,
                    timestamp: Date.now()
                });

                console.log(`👥 User ${user.username} joined room ${roomId}`);
            } catch (error) {
                console.error('Error joining room:', error);
            }
        });

       
        socket.on('send_message', async (data) => {
            try {
                const { roomId, text, messageType = 'text' } = data;
                
                socket.to(`room_${roomId}`).emit('new_message', {
                    roomId,
                    message: {
                        text,
                        type: messageType,
                        sender: {
                            userId: userId,
                            username: user.username,
                            fullName: user.fullName || user.username
                        },
                        sentAt: new Date().toISOString(),
                        messageId: Date.now() 
                    },
                    timestamp: Date.now()
                });

                console.log(`📨 Message broadcasted in room ${roomId}`);
            } catch (error) {
                console.error('Error broadcasting message:', error);
            }
        });

        socket.on('typing_start', (data) => {
            const { roomId } = data;
            socket.to(`room_${roomId}`).emit('user_typing', {
                roomId,
                userId: userId,
                username: user.username,
                isTyping: true
            });
        });

        socket.on('typing_stop', (data) => {
            const { roomId } = data;
            socket.to(`room_${roomId}`).emit('user_typing', {
                roomId,
                userId: userId,
                username: user.username,
                isTyping: false
            });
        });

 
        if (user.role === 'COUNSELOR' || user.role === 'counselor') {
            socket.join('counselors');

            socket.on('counselor_status', async (data) => {
                const { isAvailable } = data;
                
                try {
                    const { executeQuery } = require('./database');
                    await executeQuery(
                        'UPDATE USER_PROFILES SET IS_AVAILABLE = ? WHERE USER_ACCOUNT_ID = ?',
                        [isAvailable ? 1 : 0, userId]
                    );
                    
                
                    this.io.emit('counselor_availability_changed', {
                        counselorId: userId,
                        isAvailable,
                        timestamp: Date.now()
                    });
                } catch (error) {
                    console.error('Error updating counselor status:', error);
                }
            });
        }

        
        socket.on('disconnect', async (reason) => {
            await this.handleDisconnect(socket, reason);
        });
    }

    async handleDisconnect(socket, reason) {
        const userId = socket.userId;
        const user = socket.user;

        if (userId && user) {
            try {
              
                const userSockets = this.connectedUsers.get(userId);
                if (userSockets) {
                    userSockets.delete(socket.id);
                    if (userSockets.size === 0) {
                        this.connectedUsers.delete(userId);
                    }
                }

             
                const socketInfo = this.userSockets.get(socket.id);
                if (socketInfo) {
                 
                    for (const roomId of socketInfo.rooms) {
                        socket.to(`room_${roomId}`).emit('user_left_room', {
                            roomId,
                            user,
                            timestamp: Date.now()
                        });
                    }
                }

                this.userSockets.delete(socket.id);

                console.log(`👋 User ${user.username} disconnected (${reason})`);

            } catch (error) {
                console.error('Error handling disconnect:', error);
            }
        }
    }

    async validateUser(userId) {
        try {
            const { executeQuery } = require('./database');
            
            const result = await executeQuery(
                `SELECT ID, EMRI || ' ' || SURNAME as FULL_NAME, EMAILI, ROLI 
                 FROM USERS WHERE ID = ? AND IS_VERIFIED = 1`,
                [userId]
            );

            if (result.rows && result.rows.length > 0) {
                const row = result.rows[0];
                return {
                    id: row.ID,
                    username: row.FULL_NAME,
                    fullName: row.FULL_NAME,
                    email: row.EMAILI,
                    role: row.ROLI
                };
            }
            return null;
        } catch (error) {
            console.error('Error validating user:', error);
            return null;
        }
    }

  
    sendToUser(userId, event, data) {
        const userSockets = this.connectedUsers.get(userId);
        if (userSockets) {
            for (const socketId of userSockets) {
                this.io.to(socketId).emit(event, data);
            }
            return true;
        }
        return false;
    }

    sendToRoom(roomId, event, data) {
        this.io.to(`room_${roomId}`).emit(event, data);
    }

    broadcast(event, data) {
        this.io.emit(event, data);
    }

   
    getMiddleware() {
        return (req, res, next) => {
            req.io = this.io;
            next();
        };
    }

    getStats() {
        return {
            connectedUsers: this.connectedUsers.size,
            totalSockets: this.userSockets.size,
            uptime: Date.now() - (this.startTime || Date.now())
        };
    }
}

module.exports = WebSocketConfig;