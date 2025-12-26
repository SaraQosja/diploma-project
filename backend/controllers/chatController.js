
// backend/controllers/chatController.js
const { validationResult } = require('express-validator');
const AIService = require('../services/aiService');

class ChatController {

    static async sendAIMessage(req, res) {
        try {
            const { message, conversation_history } = req.body;
            
            console.log('🤖 AI Request received:', message);

            if (!message || message.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Mesazhi nuk mund të jetë bosh'
                });
            }

            const botResponse = await AIService.generateResponse(
                message.trim(), 
                conversation_history || []
            );

            console.log('🤖 AI Response generated:', botResponse);

            res.json({
                success: true,
                data: {
                    userMessage: message.trim(),
                    botResponse: botResponse,
                    responseType: 'text',
                    timestamp: new Date(),
                    isAI: true
                }
            });

        } catch (error) {
            console.error('❌ Error in AI chat:', error);
            
            const fallbackResponse = "Më fal, kam një problem teknik momentalisht. Mund të provoni përsëri.";
            
            res.json({
                success: true,
                data: {
                    userMessage: req.body.message || 'Test',
                    botResponse: fallbackResponse,
                    responseType: 'text',
                    timestamp: new Date(),
                    isAI: true,
                    fallback: true
                }
            });
        }
    }

    
    static async getRoomMessages(req, res) {
        try {
            const { roomId } = req.params;
            const userId = req.user?.userId || 'anonymous';
            const { limit = 50 } = req.query;
            const { executeQuery } = require('../config/database');

            console.log('📥 getRoomMessages called:', { roomId, userId, limit });

            const sql = `
                SELECT 
                  m.MESSAGE_ID,
                  m.USER_ID as SENDER_ID,
                  m.SENDER_NAME,
                  m.MESSAGE_TEXT,
                  m.MESSAGE_TYPE,
                  m.CREATED_AT as SENT_AT,
                  m.PARENT_MESSAGE_ID,
                  m.MESSAGE_REACTIONS
                FROM CHAT_MESSAGES m
                WHERE m.ROOM_ID = ${parseInt(roomId)}
                AND (m.IS_DELETED = 0 OR m.IS_DELETED IS NULL)
                ORDER BY m.CREATED_AT ASC
            `;

            const limitedSql = `SELECT * FROM (${sql}) WHERE ROWNUM <= ${parseInt(limit)}`;
            
            const result = await executeQuery(limitedSql);

            const messages = result.rows.map(row => ({
                messageId: row.MESSAGE_ID,
                text: row.MESSAGE_TEXT,
                type: row.MESSAGE_TYPE || 'text',
                sentAt: row.SENT_AT,
                sender: {
                    userId: row.SENDER_ID,
                    username: row.SENDER_NAME,
                    fullName: row.SENDER_NAME || 'User'
                },
                replyTo: row.PARENT_MESSAGE_ID,
                reactions: row.MESSAGE_REACTIONS ? JSON.parse(row.MESSAGE_REACTIONS) : []
            }));

            console.log(`📨 Loaded ${messages.length} messages for room ${roomId}`);

            res.json({
                success: true,
                data: messages,
                meta: {
                    roomId: parseInt(roomId),
                    limit: parseInt(limit),
                    hasMore: messages.length === parseInt(limit)
                }
            });

        } catch (error) {
            console.error('❌ getRoomMessages error:', error);
            res.status(500).json({
                success: false,
                message: 'Gabim në marrjen e mesazheve',
                error: error.message
            });
        }
    }

    static async sendMessage(req, res) {
        try {
            const { roomId } = req.params;
            const { message_text, sender_name, message_type = 'text', reply_to_message_id } = req.body;
            const userId = req.user?.userId || 'anonymous';
            const { executeQuery } = require('../config/database');

            console.log('📤 sendMessage called:', { roomId, userId, text: message_text?.substring(0, 30) });

            if (!message_text || message_text.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Mesazhi nuk mund të jetë bosh'
                });
            }

            
            const validMessageTypes = ['USER', 'BOT', 'SYSTEM', 'FILE'];
            let validatedMessageType = 'USER'; 
            
            if (message_type) {
                const upperMessageType = message_type.toString().toUpperCase();
                if (validMessageTypes.includes(upperMessageType)) {
                    validatedMessageType = upperMessageType;
                } else {
                    console.log(`⚠️ Invalid message_type '${message_type}', using 'USER' instead`);
                }
            }

            console.log('✅ Validated MESSAGE_TYPE:', validatedMessageType);

            
            let senderName = sender_name || 'User';
            if (userId !== 'anonymous') {
                try {
                    const userInfo = await executeQuery(
                        `SELECT EMRI || ' ' || SURNAME as FULL_NAME FROM USERS WHERE ID = ${userId}`
                    );
                    senderName = userInfo.rows[0]?.FULL_NAME || senderName;
                } catch (userError) {
                    console.log('Could not get user name, using fallback');
                }
            }

         
            const cleanText = message_text.trim().replace(/'/g, "''"); 
            const cleanSender = senderName.replace(/'/g, "''");
            const replyToValue = reply_to_message_id ? reply_to_message_id : 'NULL';

            await executeQuery(`
                INSERT INTO CHAT_MESSAGES (
                    ROOM_ID, USER_ID, SENDER_NAME, MESSAGE_TEXT, MESSAGE_TYPE,
                    PARENT_MESSAGE_ID, CREATED_AT, UPDATED_AT, IS_DELETED, IS_EDITED
                ) VALUES (
                    ${parseInt(roomId)}, 
                    '${userId}', 
                    '${cleanSender}', 
                    '${cleanText}', 
                    '${validatedMessageType}',
                    ${replyToValue},
                    CURRENT_TIMESTAMP, 
                    CURRENT_TIMESTAMP, 
                    0, 
                    0
                )
            `);

         
            const messageResult = await executeQuery(`
                SELECT MESSAGE_ID, CREATED_AT FROM CHAT_MESSAGES 
                WHERE ROOM_ID = ${parseInt(roomId)} 
                AND USER_ID = '${userId}' 
                AND MESSAGE_TEXT = '${cleanText}'
                AND ROWNUM = 1 
                ORDER BY CREATED_AT DESC
            `);

            const newMessage = {
                messageId: messageResult.rows[0]?.MESSAGE_ID || Date.now(),
                text: message_text.trim(),
                type: validatedMessageType.toLowerCase(), 
                sentAt: messageResult.rows[0]?.CREATED_AT || new Date().toISOString(),
                sender: {
                    userId: userId,
                    username: senderName,
                    fullName: senderName
                },
                replyTo: reply_to_message_id || null,
                reactions: []
            };

            // WebSocket broadcast
            if (req.io && req.io.to) {
                req.io.to(`room_${roomId}`).emit('new_message', {
                    roomId: parseInt(roomId),
                    message: newMessage,
                    timestamp: Date.now()
                });
                console.log(`📡 WebSocket broadcast: Room ${roomId}`);
            }

            console.log(`💾 Message saved: Room ${roomId}, User ${userId}`);

            res.status(201).json({
                success: true,
                message: 'Mesazhi u dërgua dhe u ruajt',
                data: newMessage
            });

        } catch (error) {
            console.error('❌ sendMessage error:', error);
            res.status(500).json({
                success: false,
                message: 'Gabim në ruajtjen e mesazhit',
                error: error.message
            });
        }
    }

    static async getChatRooms(req, res) {
        try {
            const { executeQuery } = require('../config/database');

            const sql = `
                SELECT 
                    cr.ROOM_ID, cr.ROOM_NAME, cr.DESCRIPTION, cr.ROOM_TYPE, cr.IS_PRIVATE,
                    cr.CREATED_AT, cr.IS_ACTIVE,
                    COUNT(rm.USER_ID) as MEMBER_COUNT
                FROM CHAT_ROOMS cr
                LEFT JOIN ROOM_MEMBERS rm ON cr.ROOM_ID = rm.ROOM_ID
                WHERE cr.IS_ACTIVE = 1
                GROUP BY cr.ROOM_ID, cr.ROOM_NAME, cr.DESCRIPTION, cr.ROOM_TYPE, cr.IS_PRIVATE,
                         cr.CREATED_AT, cr.IS_ACTIVE
                ORDER BY cr.CREATED_AT DESC
            `;

            const result = await executeQuery(sql);

            const rooms = result.rows.map(row => ({
                roomId: row.ROOM_ID,
                name: row.ROOM_NAME,
                description: row.DESCRIPTION,
                type: row.ROOM_TYPE,
                isPrivate: row.IS_PRIVATE === 1,
                createdAt: row.CREATED_AT,
                isActive: row.IS_ACTIVE === 1,
                memberCount: row.MEMBER_COUNT || 0
            }));

            res.json({
                success: true,
                data: rooms
            });

        } catch (error) {
            console.error('❌ getChatRooms error:', error);
            res.status(500).json({
                success: false,
                message: 'Gabim në marrjen e dhomave të chat-it',
                error: error.message
            });
        }
    }

    static async getAvailableCounselors(req, res) {
        try {
            const { executeQuery } = require('../config/database');

            console.log('👨‍🏫 getAvailableCounselors called');

            const sql = `
                SELECT 
                  u.ID,
                  u.EMRI || ' ' || u.SURNAME as FULL_NAME,
                  u.EMAILI,
                  'Specialist në orientim karriere' as COUNSELOR_BIO,
                  1 as IS_AVAILABLE,
                  u.CREATED_AT
                FROM USERS u
                WHERE u.ROLI = 'COUNSELOR' 
                AND u.IS_VERIFIED = 1
                ORDER BY u.CREATED_AT DESC
            `;

            const result = await executeQuery(sql);

            const counselors = result.rows.map(row => ({
                id: row.ID,
                fullName: row.FULL_NAME,
                bio: row.COUNSELOR_BIO || 'Specialist në orientim karriere',
                isAvailable: row.IS_AVAILABLE === 1,
                initials: row.FULL_NAME?.split(' ').map(n => n[0]).join('').toUpperCase() || 'C'
            }));

            console.log('✅ Found counselors:', counselors.length);

            res.json({
                success: true,
                data: counselors,
                availableCount: counselors.filter(c => c.isAvailable).length,
                totalCount: counselors.length
            });

        } catch (error) {
            console.error('❌ getAvailableCounselors error:', error);
            res.status(500).json({
                success: false,
                message: 'Gabim në marrjen e këshilluesve',
                error: error.message
            });
        }
    }

    static async createCounselorSession(req, res) {
        try {
            const { counselorId, subject, message } = req.body;
            const userId = req.user?.userId || 'anonymous';
            const { executeQuery } = require('../config/database');

            if (!counselorId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID e këshilluesit është e detyrueshme'
                });
            }

            const roomName = `Sesion me Këshillues - ${Date.now()}`;
            const cleanRoomName = roomName.replace(/'/g, "''");
            const cleanSubject = (subject || 'Sesion këshillimi').replace(/'/g, "''");
            
            await executeQuery(`
                INSERT INTO CHAT_ROOMS (
                    ROOM_NAME, DESCRIPTION, ROOM_TYPE, IS_PRIVATE, IS_ACTIVE, 
                    CREATED_BY, CREATED_AT, UPDATED_AT
                ) VALUES (
                    '${cleanRoomName}', 
                    '${cleanSubject}', 
                    'counselor_session', 
                    1, 
                    1, 
                    '${userId}', 
                    CURRENT_TIMESTAMP, 
                    CURRENT_TIMESTAMP
                )
            `);

            const roomResult = await executeQuery(`
                SELECT ROOM_ID FROM CHAT_ROOMS 
                WHERE ROOM_NAME = '${cleanRoomName}' 
                AND CREATED_BY = '${userId}'
                AND ROWNUM = 1 
                ORDER BY CREATED_AT DESC
            `);

            const roomId = roomResult.rows[0]?.ROOM_ID;

            if (roomId) {
                await executeQuery(`
                    INSERT INTO ROOM_MEMBERS (ROOM_ID, USER_ID, ROLE, JOINED_AT) 
                    VALUES (${roomId}, '${userId}', 'member', CURRENT_TIMESTAMP)
                `);

                await executeQuery(`
                    INSERT INTO ROOM_MEMBERS (ROOM_ID, USER_ID, ROLE, JOINED_AT) 
                    VALUES (${roomId}, '${counselorId}', 'counselor', CURRENT_TIMESTAMP)
                `);

                if (message && message.trim()) {
                    const cleanMessage = message.trim().replace(/'/g, "''");
                    const senderName = req.user?.username || 'Student';
                    const cleanSenderName = senderName.replace(/'/g, "''");

                    await executeQuery(`
                        INSERT INTO CHAT_MESSAGES (
                            ROOM_ID, USER_ID, SENDER_NAME, MESSAGE_TEXT, MESSAGE_TYPE,
                            CREATED_AT, UPDATED_AT, IS_DELETED, IS_EDITED
                        ) VALUES (
                            ${roomId}, 
                            '${userId}', 
                            '${cleanSenderName}', 
                            '${cleanMessage}', 
                            'USER', 
                            CURRENT_TIMESTAMP, 
                            CURRENT_TIMESTAMP, 
                            0, 
                            0
                        )
                    `);
                }

                if (req.io && req.io.to) {
                    req.io.to(`user_${counselorId}`).emit('new_counselor_request', {
                        roomId,
                        studentId: userId,
                        subject,
                        message,
                        timestamp: Date.now()
                    });
                    console.log(`📡 Counselor notified: ${counselorId}`);
                }
            }

            res.status(201).json({
                success: true,
                message: 'Sesioni me këshilluesin u krijua me sukses',
                data: {
                    roomId,
                    counselorId,
                    subject,
                    createdAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('❌ createCounselorSession error:', error);
            res.status(500).json({
                success: false,
                message: 'Gabim në krijimin e sesionit me këshilluesin',
                error: error.message
            });
        }
    }

    static async getCounselorSessions(req, res) {
        try {
            const userId = req.user?.userId;
            const { executeQuery } = require('../config/database');

            const sql = `
                SELECT 
                    cr.ROOM_ID, cr.ROOM_NAME, cr.DESCRIPTION, cr.CREATED_AT, cr.IS_ACTIVE,
                    c.EMRI || ' ' || c.SURNAME as COUNSELOR_NAME,
                    rm_counselor.USER_ID as COUNSELOR_ID
                FROM CHAT_ROOMS cr
                INNER JOIN ROOM_MEMBERS rm_user ON cr.ROOM_ID = rm_user.ROOM_ID
                INNER JOIN ROOM_MEMBERS rm_counselor ON cr.ROOM_ID = rm_counselor.ROOM_ID
                INNER JOIN USERS c ON rm_counselor.USER_ID = c.ID
                WHERE cr.ROOM_TYPE = 'counselor_session'
                AND rm_user.USER_ID = '${userId}'
                AND rm_counselor.ROLE = 'counselor'
                AND rm_user.ROLE = 'member'
                ORDER BY cr.CREATED_AT DESC
            `;

            const result = await executeQuery(sql);

            const sessions = result.rows.map(row => ({
                roomId: row.ROOM_ID,
                name: row.ROOM_NAME,
                description: row.DESCRIPTION,
                createdAt: row.CREATED_AT,
                isActive: row.IS_ACTIVE === 1,
                counselor: {
                    id: row.COUNSELOR_ID,
                    name: row.COUNSELOR_NAME
                }
            }));

            res.json({
                success: true,
                data: sessions
            });

        } catch (error) {
            console.error('❌ getCounselorSessions error:', error);
            res.status(500).json({
                success: false,
                message: 'Gabim në marrjen e sesioneve të këshillimit',
                error: error.message
            });
        }
    }

    static async addMessageReaction(req, res) {
        try {
            const { messageId } = req.params;
            const { reaction, user_id, user_name } = req.body;
            const userId = user_id || req.user?.userId || 'anonymous';
            const userName = user_name || req.user?.username || 'User';
            const { executeQuery } = require('../config/database');

            console.log('👍 addMessageReaction called:', { messageId, userId, reaction });

            const messageResult = await executeQuery(
                `SELECT MESSAGE_REACTIONS FROM CHAT_MESSAGES WHERE MESSAGE_ID = ${parseInt(messageId)}`
            );

            if (!messageResult.rows || messageResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Mesazhi nuk u gjet'
                });
            }

            let reactions = [];
            if (messageResult.rows[0].MESSAGE_REACTIONS) {
                try {
                    reactions = JSON.parse(messageResult.rows[0].MESSAGE_REACTIONS);
                } catch (e) {
                    reactions = [];
                }
            }

            const existingReactionIndex = reactions.findIndex(r => r.userId === userId);

            if (existingReactionIndex >= 0) {
                reactions[existingReactionIndex] = {
                    userId,
                    userName,
                    reaction: reaction,
                    timestamp: new Date().toISOString()
                };
            } else {
                reactions.push({
                    userId,
                    userName,
                    reaction: reaction,
                    timestamp: new Date().toISOString()
                });
            }

            const cleanReactions = JSON.stringify(reactions).replace(/'/g, "''");

            await executeQuery(`
                UPDATE CHAT_MESSAGES 
                SET MESSAGE_REACTIONS = '${cleanReactions}', UPDATED_AT = CURRENT_TIMESTAMP
                WHERE MESSAGE_ID = ${parseInt(messageId)}
            `);

            console.log('✅ Reaction added successfully');

            res.json({
                success: true,
                message: 'Reaction u shtua me sukses',
                data: {
                    messageId: parseInt(messageId),
                    reactions
                }
            });

        } catch (error) {
            console.error('❌ addMessageReaction error:', error);
            res.status(500).json({
                success: false,
                message: 'Gabim në shtimin e reaction-it',
                error: error.message
            });
        }
    }

    static async healthCheck(req, res) {
        try {
            res.json({
                success: true,
                message: 'Chat service is healthy',
                timestamp: new Date(),
                version: '1.0.0',
                features: {
                    rooms: true,
                    aiBot: true,
                    counselors: true,
                    reactions: true,
                    websocket: !!req.io,
                    counselorSessions: true
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Chat service unhealthy',
                error: error.message
            });
        }
    }
}

module.exports = ChatController;