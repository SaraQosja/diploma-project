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

            console.log('📥 ChatController.getRoomMessages called with:', { roomId, userId, limit });

            const sql = `
                SELECT 
                  m.MESSAGE_ID,
                  m.USER_ID as SENDER_ID,
                  m.SENDER_NAME,
                  m.MESSAGE_TEXT,
                  m.MESSAGE_TYPE,
                  m.CREATED_AT as SENT_AT,
                  m.PARENT_MESSAGE_ID,
                  m.MESSAGE_REACTIONS,
                  u.EMRI || ' ' || u.SURNAME as FULL_NAME
                FROM CHAT_MESSAGES m
                LEFT JOIN USERS u ON m.USER_ID = u.ID
                WHERE m.ROOM_ID = :roomId 
                AND (m.IS_DELETED = 0 OR m.IS_DELETED IS NULL)
                ORDER BY m.CREATED_AT ASC
                FETCH FIRST :limit ROWS ONLY
            `;

            const result = await executeQuery(sql, { roomId: roomId, limit: parseInt(limit) });

            const messages = result.rows.map(row => ({
                messageId: row.MESSAGE_ID,
                text: row.MESSAGE_TEXT,
                type: row.MESSAGE_TYPE || 'text',
                sentAt: row.SENT_AT,
                sender: {
                    userId: row.SENDER_ID,
                    username: row.SENDER_NAME,
                    fullName: row.FULL_NAME || row.SENDER_NAME || 'User'
                },
                replyTo: row.PARENT_MESSAGE_ID,
                reactions: row.MESSAGE_REACTIONS ? JSON.parse(row.MESSAGE_REACTIONS) : []
            }));

            console.log(`📨 NGARKOVA ${messages.length} mesazhe për room ${roomId}`);

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
            console.error('Chat Error (getRoomMessages):', error);
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

            console.log('📤 ChatController.sendMessage called:', { roomId, userId, message_text: message_text?.substring(0, 50) + '...' });

            if (!message_text || message_text.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Mesazhi nuk mund të jetë bosh'
                });
            }

            let senderName = sender_name || 'User';
            if (userId !== 'anonymous') {
                const userInfo = await executeQuery(
                    'SELECT EMRI || \' \' || SURNAME as FULL_NAME FROM USERS WHERE ID = ?',
                    [userId]
                );
                senderName = userInfo.rows[0]?.FULL_NAME || senderName;
            }

            await executeQuery(
                `INSERT INTO CHAT_MESSAGES (ROOM_ID, USER_ID, SENDER_NAME, MESSAGE_TEXT, MESSAGE_TYPE, PARENT_MESSAGE_ID, CREATED_AT, UPDATED_AT, IS_DELETED, IS_EDITED) 
                 VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0)`,
                [roomId, userId, senderName, message_text.trim(), message_type, reply_to_message_id || null]
            );

           
            const messageResult = await executeQuery(
                `SELECT MESSAGE_ID, CREATED_AT FROM CHAT_MESSAGES 
                 WHERE ROOM_ID = ? AND USER_ID = ? AND MESSAGE_TEXT = ?
                 ORDER BY CREATED_AT DESC FETCH FIRST 1 ROWS ONLY`,
                [roomId, userId, message_text.trim()]
            );

            const newMessage = {
                messageId: messageResult.rows[0]?.MESSAGE_ID || Date.now(),
                text: message_text.trim(),
                type: message_type,
                sentAt: new Date().toISOString(),
                sender: {
                    userId: userId,
                    username: senderName,
                    fullName: senderName
                },
                replyTo: reply_to_message_id || null,
                reactions: []
            };

            console.log(`💾 MESAZHI U RUAJT: Room ${roomId}, User ${userId}`);

            res.status(201).json({
                success: true,
                message: 'Mesazhi u dërgua dhe u ruajt',
                data: newMessage
            });

        } catch (error) {
            console.error('Chat Error (sendMessage):', error);
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
                    u.EMRI || ' ' || u.SURNAME as CREATED_BY_NAME,
                    COUNT(rm.USER_ID) as MEMBER_COUNT
                FROM CHAT_ROOMS cr
                LEFT JOIN USERS u ON cr.CREATED_BY = u.ID
                LEFT JOIN ROOM_MEMBERS rm ON cr.ROOM_ID = rm.ROOM_ID
                WHERE cr.IS_ACTIVE = 1
                GROUP BY cr.ROOM_ID, cr.ROOM_NAME, cr.DESCRIPTION, cr.ROOM_TYPE, cr.IS_PRIVATE,
                         cr.CREATED_AT, cr.IS_ACTIVE, u.EMRI, u.SURNAME
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
                createdByName: row.CREATED_BY_NAME,
                memberCount: row.MEMBER_COUNT || 0
            }));

            res.json({
                success: true,
                data: rooms
            });

        } catch (error) {
            console.error('Chat Error (getChatRooms):', error);
            res.status(500).json({
                success: false,
                message: 'Gabim në marrjen e dhomave të chat-it',
                error: error.message
            });
        }
    }

    static async createChatRoom(req, res) {
        try {
            const { name, description, type = 'public', is_private = false } = req.body;
            const userId = req.user?.userId || 'anonymous';
            const { executeQuery } = require('../config/database');

            if (!name || name.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Emri i dhomës është i detyrueshëm'
                });
            }

            await executeQuery(
                `INSERT INTO CHAT_ROOMS (ROOM_NAME, DESCRIPTION, ROOM_TYPE, IS_PRIVATE, IS_ACTIVE, CREATED_BY, CREATED_AT, UPDATED_AT) 
                 VALUES (?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [name.trim(), description?.trim(), type, is_private ? 1 : 0, userId]
            );

            // Get room ID
            const roomResult = await executeQuery(
                `SELECT ROOM_ID FROM CHAT_ROOMS WHERE ROOM_NAME = ? AND CREATED_BY = ? ORDER BY CREATED_AT DESC FETCH FIRST 1 ROWS ONLY`,
                [name.trim(), userId]
            );

            const roomId = roomResult.rows[0]?.ROOM_ID;

            if (roomId) {
             
                await executeQuery(
                    `INSERT INTO ROOM_MEMBERS (ROOM_ID, USER_ID, ROLE, JOINED_AT) VALUES (?, ?, 'admin', CURRENT_TIMESTAMP)`,
                    [roomId, userId]
                );
            }

            res.status(201).json({
                success: true,
                message: 'Dhoma e chat-it u krijua me sukses',
                data: {
                    roomId,
                    name: name.trim(),
                    description: description?.trim(),
                    type,
                    isPrivate: is_private
                }
            });

        } catch (error) {
            console.error('Chat Error (createChatRoom):', error);
            res.status(500).json({
                success: false,
                message: 'Gabim në krijimin e dhomës së chat-it',
                error: error.message
            });
        }
    }

    static async getAvailableCounselors(req, res) {
        try {
            const { executeQuery } = require('../config/database');

            console.log('👨‍🏫 ChatController.getAvailableCounselors called');

            const sql = `
                SELECT 
                  ID,
                  EMRI || ' ' || SURNAME as FULL_NAME,
                  EMAILI,
                  COUNSELOR_BIO,
                  IS_AVAILABLE,
                  CREATED_AT
                FROM USERS 
                WHERE IS_COUNSELOR = 1 
                AND IS_VERIFIED = 1
                ORDER BY IS_AVAILABLE DESC, CREATED_AT DESC
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
            console.error('Chat Error (getAvailableCounselors):', error);
            res.status(500).json({
                success: false,
                message: 'Gabim në marrjen e këshilluesve',
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

            console.log('👍 ChatController.addMessageReaction called:', { messageId, userId, reaction, userName });

            const messageResult = await executeQuery(
                `SELECT MESSAGE_REACTIONS FROM CHAT_MESSAGES WHERE MESSAGE_ID = ?`,
                [messageId]
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

            await executeQuery(
                `UPDATE CHAT_MESSAGES 
                 SET MESSAGE_REACTIONS = ?, UPDATED_AT = CURRENT_TIMESTAMP
                 WHERE MESSAGE_ID = ?`,
                [JSON.stringify(reactions), messageId]
            );

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
            console.error('Chat Error (addMessageReaction):', error);
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
                    websocket: !!req.io
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

   
    static async createSession(req, res) {
        req.body.type = 'private_session';
        return this.createChatRoom(req, res);
    }

    static async getSessions(req, res) {
        req.query.type = 'private_session';
        return this.getChatRooms(req, res);
    }

    static async sendSessionMessage(req, res) {
        return this.sendMessage(req, res);
    }

    static async getSessionMessages(req, res) {
        return this.getRoomMessages(req, res);
    }

    static async closeSession(req, res) {
        try {
            const { sessionId } = req.params;
            const { executeQuery } = require('../config/database');

            await executeQuery(
                'UPDATE CHAT_ROOMS SET IS_ACTIVE = 0, UPDATED_AT = CURRENT_TIMESTAMP WHERE ROOM_ID = ?',
                [sessionId]
            );

            res.json({
                success: true,
                message: 'Sesioni u mbyll me sukses'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Gabim në mbylljen e sesionit',
                error: error.message
            });
        }
    }
}

module.exports = ChatController;
