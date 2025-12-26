// backend/routes/counselor.js 
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth').auth;
const counselorController = require('../controllers/counselorController');


router.get('/profile', auth, counselorController.getCounselorProfile);
router.put('/profile', auth, counselorController.updateCounselorProfile);
router.get('/stats', auth, counselorController.getCounselorStats);
router.put('/availability', auth, counselorController.updateAvailability);




router.post('/chat/:counselorId/create-room', auth, counselorController.createPrivateRoom);

router.get('/chat/room/:roomId/messages', auth, counselorController.getRoomMessages);

router.post('/chat/room/:roomId/messages', auth, counselorController.sendRoomMessage);

router.get('/chats', auth, counselorController.getCounselorChats);

router.get('/student-chats', auth, counselorController.getStudentChats);

router.get('/active-chats', auth, counselorController.getActiveChats);


router.get('/available', async (req, res) => {
  try {
    const { executeQuery } = require('../config/database');

    console.log('👨‍🏫 Getting available counselors from USERS table...');

    const sql = `
      SELECT 
        u.ID,
        u.EMRI || ' ' || u.SURNAME as FULL_NAME,
        u.EMAILI,
        p.SPECIALIZATION as COUNSELOR_BIO,
        p.IS_AVAILABLE,
        u.CREATED_AT,
        p.EXPERIENCE_YEARS,
        p.PROFESSIONAL_BIO
      FROM USERS u
      LEFT JOIN USER_PROFILES p ON u.ID = p.USER_ACCOUNT_ID
      WHERE u.ROLI = 'COUNSELOR' 
      AND u.IS_VERIFIED = 1
      ORDER BY p.IS_AVAILABLE DESC, u.CREATED_AT DESC
    `;

    const result = await executeQuery(sql);

    const counselors = result.rows.map(row => ({
      id: row.ID,
      fullName: row.FULL_NAME,
      email: row.EMAILI,
      bio: row.COUNSELOR_BIO || 'Specialist në orientim karriere',
      isAvailable: row.IS_AVAILABLE === 1,
      initials: row.FULL_NAME?.split(' ').map(n => n[0]).join('').toUpperCase() || 'C',
      experience: row.EXPERIENCE_YEARS || 0,
      professionalBio: row.PROFESSIONAL_BIO || ''
    }));

    console.log(`✅ Found ${counselors.length} counselors, ${counselors.filter(c => c.isAvailable).length} available`);

    res.json({
      success: true,
      data: counselors,
      availableCount: counselors.filter(c => c.isAvailable).length,
      totalCount: counselors.length
    });

  } catch (error) {
    console.error('❌ Error getting available counselors:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në marrjen e këshilluesve',
      error: error.message
    });
  }
});

router.post('/chat/:counselorId/create-room', auth, async (req, res) => {
  try {
    const { counselorId } = req.params;
    const userId = req.user.userId;
    const { executeQuery } = require('../config/database');

    console.log('🏗️ Creating chat room - User:', userId, 'Counselor:', counselorId);

    const existingRoom = await executeQuery(
      `SELECT cr.ROOM_ID FROM CHAT_ROOMS cr
       INNER JOIN ROOM_MEMBERS rm1 ON cr.ROOM_ID = rm1.ROOM_ID AND rm1.USER_ID = ?
       INNER JOIN ROOM_MEMBERS rm2 ON cr.ROOM_ID = rm2.ROOM_ID AND rm2.USER_ID = ?
       WHERE cr.ROOM_TYPE = 'counselor_session' AND cr.IS_ACTIVE = 1
       AND ROWNUM = 1`,
      [userId, counselorId]
    );

    let roomId;

    if (existingRoom.rows && existingRoom.rows.length > 0) {
      roomId = existingRoom.rows[0].ROOM_ID;
      console.log('✅ Using existing room:', roomId);
    } else {
   
      const roomName = `Counselor Session - ${Date.now()}`;
      
      await executeQuery(
        `INSERT INTO CHAT_ROOMS (ROOM_NAME, DESCRIPTION, ROOM_TYPE, IS_PRIVATE, IS_ACTIVE, CREATED_BY, CREATED_AT, UPDATED_AT)
         VALUES (?, 'Private counselor session', 'counselor_session', 1, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [roomName, userId]
      );

      
      const roomResult = await executeQuery(
        `SELECT ROOM_ID FROM CHAT_ROOMS WHERE ROOM_NAME = ? AND CREATED_BY = ? AND ROWNUM = 1 ORDER BY CREATED_AT DESC`,
        [roomName, userId]
      );

      roomId = roomResult.rows[0]?.ROOM_ID;

      if (roomId) {
       
        await executeQuery(
          'INSERT INTO ROOM_MEMBERS (ROOM_ID, USER_ID, ROLE, JOINED_AT) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
          [roomId, userId, 'member']
        );

        await executeQuery(
          'INSERT INTO ROOM_MEMBERS (ROOM_ID, USER_ID, ROLE, JOINED_AT) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
          [roomId, counselorId, 'counselor']
        );

        console.log('✅ Created new room:', roomId);
      }
    }

    res.json({
      success: true,
      data: { roomId },
      message: 'Chat room ready'
    });

  } catch (error) {
    console.error('❌ Error creating chat room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat room',
      error: error.message
    });
  }
});


router.get('/chat/room/:roomId/messages', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, after } = req.query;
    const userId = req.user.userId;
    const { executeQuery } = require('../config/database');

    console.log('📥 Loading messages from room:', roomId, 'for user:', userId);

    const access = await executeQuery(
      'SELECT 1 FROM ROOM_MEMBERS WHERE ROOM_ID = ? AND USER_ID = ?',
      [roomId, userId]
    );

    if (!access.rows || access.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this room'
      });
    }

    
    let sql = `
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
      WHERE m.ROOM_ID = ? 
      AND (m.IS_DELETED = 0 OR m.IS_DELETED IS NULL)
    `;

    const params = [roomId];

    if (after) {
      sql += ' AND m.MESSAGE_ID > ?';
      params.push(after);
    }

    sql += ' ORDER BY m.CREATED_AT ASC';

    if (limit) {
      sql = `SELECT * FROM (${sql}) WHERE ROWNUM <= ?`;
      params.push(parseInt(limit));
    }

    const result = await executeQuery(sql, params);

    const messages = result.rows.map(row => ({
      messageId: row.MESSAGE_ID,
      text: row.MESSAGE_TEXT,
      messageText: row.MESSAGE_TEXT,
      type: row.MESSAGE_TYPE || 'text',
      messageType: row.MESSAGE_TYPE || 'text',
      sentAt: row.SENT_AT,
      sender: {
        userId: row.SENDER_ID,
        username: row.SENDER_NAME,
        fullName: row.FULL_NAME || row.SENDER_NAME || 'User'
      },
      senderId: row.SENDER_ID,
      senderName: row.SENDER_NAME,
      replyTo: row.PARENT_MESSAGE_ID,
      reactions: row.MESSAGE_REACTIONS ? JSON.parse(row.MESSAGE_REACTIONS) : []
    }));

    console.log(`📨 Loaded ${messages.length} messages from room ${roomId}`);

    res.json({
      success: true,
      data: messages
    });

  } catch (error) {
    console.error('❌ Error loading room messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load messages',
      error: error.message
    });
  }
});

router.post('/chat/room/:roomId/messages', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { message_text, message_type = 'text' } = req.body;
    const userId = req.user.userId;
    const { executeQuery } = require('../config/database');

    console.log('📤 Sending message to room:', roomId, 'from user:', userId);

    const access = await executeQuery(
      'SELECT 1 FROM ROOM_MEMBERS WHERE ROOM_ID = ? AND USER_ID = ?',
      [roomId, userId]
    );

    if (!access.rows || access.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this room'
      });
    }

    if (!message_text || message_text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    
    const userInfo = await executeQuery(
      'SELECT EMRI || \' \' || SURNAME as FULL_NAME FROM USERS WHERE ID = ?',
      [userId]
    );
    const senderName = userInfo.rows[0]?.FULL_NAME || 'User';

    await executeQuery(
      `INSERT INTO CHAT_MESSAGES (ROOM_ID, USER_ID, SENDER_NAME, MESSAGE_TEXT, MESSAGE_TYPE, CREATED_AT, UPDATED_AT, IS_DELETED, IS_EDITED)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0)`,
      [roomId, userId, senderName, message_text.trim(), message_type]
    );

    const messageResult = await executeQuery(
      `SELECT MESSAGE_ID, CREATED_AT FROM CHAT_MESSAGES 
       WHERE ROOM_ID = ? AND USER_ID = ? AND MESSAGE_TEXT = ?
       AND ROWNUM = 1 ORDER BY CREATED_AT DESC`,
      [roomId, userId, message_text.trim()]
    );

    const newMessage = {
      messageId: messageResult.rows[0]?.MESSAGE_ID || Date.now(),
      text: message_text.trim(),
      messageText: message_text.trim(),
      type: message_type,
      messageType: message_type,
      sentAt: messageResult.rows[0]?.CREATED_AT || new Date().toISOString(),
      sender: {
        userId: userId,
        username: senderName,
        fullName: senderName
      },
      senderId: userId,
      senderName: senderName,
      reactions: []
    };

   
    if (req.io && req.io.to) {
      req.io.to(`room_${roomId}`).emit('new_message', {
        roomId: parseInt(roomId),
        message: newMessage,
        timestamp: Date.now()
      });
    }

    console.log('✅ Message sent successfully to room:', roomId);

    res.status(201).json({
      success: true,
      data: newMessage,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

module.exports = router;