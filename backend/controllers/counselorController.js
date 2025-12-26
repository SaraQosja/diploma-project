// backend/controllers/counselorController.js
const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');


const createPrivateRoom = async (req, res) => {
  try {
    const { counselorId } = req.params;
    const studentId = req.user.userId;
    const { executeQuery } = require('../config/database');

    console.log('🏗️ Creating private room:', { studentId, counselorId });

   
    const existingRoomSql = `
      SELECT r.ROOM_ID, r.ROOM_NAME 
      FROM CHAT_ROOMS r
      JOIN ROOM_MEMBERS rm1 ON r.ROOM_ID = rm1.ROOM_ID AND rm1.USER_ID = :studentId
      JOIN ROOM_MEMBERS rm2 ON r.ROOM_ID = rm2.ROOM_ID AND rm2.USER_ID = :counselorId
      WHERE r.ROOM_TYPE = 'counselor_session'
      AND r.IS_ACTIVE = 1
    `;

    const existingRoom = await executeQuery(existingRoomSql, { studentId, counselorId });

    if (existingRoom.rows.length > 0) {
      return res.json({
        success: true,
        data: {
          roomId: existingRoom.rows[0].ROOM_ID,
          roomName: existingRoom.rows[0].ROOM_NAME,
          existed: true
        }
      });
    }

    // Get user names
    const studentSql = `SELECT EMRI || ' ' || SURNAME as FULL_NAME FROM USERS WHERE ID = :studentId`;
    const counselorSql = `SELECT EMRI || ' ' || SURNAME as FULL_NAME FROM USERS WHERE ID = :counselorId`;
    
    const [studentResult, counselorResult] = await Promise.all([
      executeQuery(studentSql, { studentId }),
      executeQuery(counselorSql, { counselorId })
    ]);

    const studentName = studentResult.rows[0]?.FULL_NAME || 'Student';
    const counselorName = counselorResult.rows[0]?.FULL_NAME || 'Counselor';
    const roomName = `Chat: ${studentName} & ${counselorName}`;

    // Create new private room
    const createRoomSql = `
      INSERT INTO CHAT_ROOMS (
        ROOM_NAME, DESCRIPTION, ROOM_TYPE, IS_PRIVATE, IS_ACTIVE, 
        CREATED_BY, CREATED_AT, UPDATED_AT
      ) VALUES (
        :roomName, :description, 'counselor_session', 1, 1, 
        :studentId, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `;

    await executeQuery(createRoomSql, {
      roomName,
      description: `Private chat between ${studentName} and ${counselorName}`,
      studentId
    });

    // Get the created room ID
    const roomIdSql = `
      SELECT ROOM_ID FROM CHAT_ROOMS 
      WHERE ROOM_NAME = :roomName AND CREATED_BY = :studentId 
      ORDER BY CREATED_AT DESC FETCH FIRST 1 ROWS ONLY
    `;
    
    const roomIdResult = await executeQuery(roomIdSql, { roomName, studentId });
    const roomId = roomIdResult.rows[0]?.ROOM_ID;

    if (!roomId) {
      throw new Error('Failed to create room');
    }

    // Add both student and counselor as members
    const addMembersSql = `
      INSERT ALL
        INTO ROOM_MEMBERS (ROOM_ID, USER_ID, ROLE, JOINED_AT) VALUES (:roomId, :studentId, 'student', CURRENT_TIMESTAMP)
        INTO ROOM_MEMBERS (ROOM_ID, USER_ID, ROLE, JOINED_AT) VALUES (:roomId, :counselorId, 'counselor', CURRENT_TIMESTAMP)
      SELECT * FROM DUAL
    `;

    await executeQuery(addMembersSql, { roomId, studentId, counselorId });

    // Send welcome message
    const welcomeMessageSql = `
      INSERT INTO CHAT_MESSAGES (
        ROOM_ID, USER_ID, SENDER_NAME, MESSAGE_TEXT, MESSAGE_TYPE,
        CREATED_AT, UPDATED_AT, IS_DELETED, IS_EDITED
      ) VALUES (
        :roomId, 'system', 'System', :message, 'system',
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0
      )
    `;

    await executeQuery(welcomeMessageSql, {
      roomId,
      message: `Përshëndetje! Kjo është një bisedë private mes ${studentName} dhe ${counselorName}. Filloni bisedën tuaj këtu.`
    });

    console.log('✅ Private room created successfully:', roomId);

    res.json({
      success: true,
      data: {
        roomId,
        roomName,
        studentName,
        counselorName,
        created: true
      }
    });

  } catch (error) {
    console.error('❌ Error creating private room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create private room',
      error: error.message
    });
  }
};

// GET MESSAGES FOR COUNSELOR-STUDENT ROOM
const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;
    const { limit = 50, offset = 0 } = req.query;

    console.log('📥 Getting room messages:', { roomId, userId, limit });

    const memberCheckSql = `
      SELECT ROLE FROM ROOM_MEMBERS 
      WHERE ROOM_ID = :roomId AND USER_ID = :userId
    `;
    
    const memberCheck = await executeQuery(memberCheckSql, { roomId, userId });
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this room'
      });
    }

    // Get messages
    const messagesSql = `
      SELECT 
        m.MESSAGE_ID,
        m.USER_ID as SENDER_ID,
        m.SENDER_NAME,
        m.MESSAGE_TEXT,
        m.MESSAGE_TYPE,
        m.CREATED_AT as SENT_AT,
        m.PARENT_MESSAGE_ID,
        m.MESSAGE_REACTIONS,
        u.EMRI || ' ' || u.SURNAME as FULL_NAME,
        CASE 
          WHEN m.USER_ID = :userId THEN 1 
          ELSE 0 
        END as IS_OWN_MESSAGE
      FROM CHAT_MESSAGES m
      LEFT JOIN USERS u ON m.USER_ID = u.ID
      WHERE m.ROOM_ID = :roomId 
      AND (m.IS_DELETED = 0 OR m.IS_DELETED IS NULL)
      ORDER BY m.CREATED_AT ASC
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;

    const result = await executeQuery(messagesSql, {
      roomId: parseInt(roomId),
      userId,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const messages = result.rows.map(row => ({
      messageId: row.MESSAGE_ID,
      text: row.MESSAGE_TEXT,
      type: row.MESSAGE_TYPE || 'text',
      sentAt: row.SENT_AT,
      isOwn: row.IS_OWN_MESSAGE === 1,
      sender: {
        userId: row.SENDER_ID,
        username: row.SENDER_NAME,
        fullName: row.FULL_NAME || row.SENDER_NAME || 'User'
      },
      replyTo: row.PARENT_MESSAGE_ID,
      reactions: row.MESSAGE_REACTIONS ? JSON.parse(row.MESSAGE_REACTIONS) : []
    }));

    console.log(`📨 Retrieved ${messages.length} messages for room ${roomId}`);

    res.json({
      success: true,
      data: messages,
      meta: {
        roomId: parseInt(roomId),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: messages.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ Error getting room messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages',
      error: error.message
    });
  }
};

const sendRoomMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { message_text, message_type = 'text' } = req.body;
    const userId = req.user.userId;

    console.log('📤 Sending room message:', { roomId, userId, messageLength: message_text?.length });

    if (!message_text || message_text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    const memberCheckSql = `
      SELECT rm.ROLE, u.EMRI || ' ' || u.SURNAME as FULL_NAME
      FROM ROOM_MEMBERS rm
      JOIN USERS u ON rm.USER_ID = u.ID
      WHERE rm.ROOM_ID = :roomId AND rm.USER_ID = :userId
    `;
    
    const memberCheck = await executeQuery(memberCheckSql, { roomId, userId });
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this room'
      });
    }

    const senderName = memberCheck.rows[0].FULL_NAME;

    const insertMessageSql = `
      INSERT INTO CHAT_MESSAGES (
        ROOM_ID, USER_ID, SENDER_NAME, MESSAGE_TEXT, MESSAGE_TYPE,
        CREATED_AT, UPDATED_AT, IS_DELETED, IS_EDITED
      ) VALUES (
        :roomId, :userId, :senderName, :messageText, :messageType,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0
      )
    `;

    await executeQuery(insertMessageSql, {
      roomId: parseInt(roomId),
      userId,
      senderName,
      messageText: message_text.trim(),
      messageType: message_type
    });

   
    const getMessageSql = `
      SELECT MESSAGE_ID, CREATED_AT 
      FROM CHAT_MESSAGES 
      WHERE ROOM_ID = :roomId AND USER_ID = :userId AND MESSAGE_TEXT = :messageText
      ORDER BY CREATED_AT DESC FETCH FIRST 1 ROWS ONLY
    `;

    const messageResult = await executeQuery(getMessageSql, {
      roomId: parseInt(roomId),
      userId,
      messageText: message_text.trim()
    });

    const newMessage = {
      messageId: messageResult.rows[0]?.MESSAGE_ID || Date.now(),
      text: message_text.trim(),
      type: message_type,
      sentAt: messageResult.rows[0]?.CREATED_AT || new Date().toISOString(),
      isOwn: true,
      sender: {
        userId: userId,
        username: senderName,
        fullName: senderName
      },
      replyTo: null,
      reactions: []
    };

    console.log(`💾 Message saved to room ${roomId} by user ${userId}`);

    
    const updateRoomSql = `
      UPDATE CHAT_ROOMS 
      SET UPDATED_AT = CURRENT_TIMESTAMP 
      WHERE ROOM_ID = :roomId
    `;
    
    await executeQuery(updateRoomSql, { roomId: parseInt(roomId) });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });

  } catch (error) {
    console.error('❌ Error sending room message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

const getCounselorChats = async (req, res) => {
  try {
    const counselorId = req.user.userId;

    console.log('💬 Getting counselor chats for user:', counselorId);

    const chatsSql = `
      SELECT 
        r.ROOM_ID,
        r.ROOM_NAME,
        r.CREATED_AT,
        r.UPDATED_AT,
        student.EMRI || ' ' || student.SURNAME as STUDENT_NAME,
        student.ID as STUDENT_ID,
        (
          SELECT MESSAGE_TEXT 
          FROM CHAT_MESSAGES 
          WHERE ROOM_ID = r.ROOM_ID 
          ORDER BY CREATED_AT DESC 
          FETCH FIRST 1 ROWS ONLY
        ) as LAST_MESSAGE,
        (
          SELECT CREATED_AT 
          FROM CHAT_MESSAGES 
          WHERE ROOM_ID = r.ROOM_ID 
          ORDER BY CREATED_AT DESC 
          FETCH FIRST 1 ROWS ONLY
        ) as LAST_MESSAGE_TIME,
        (
          SELECT COUNT(*) 
          FROM CHAT_MESSAGES 
          WHERE ROOM_ID = r.ROOM_ID 
          AND USER_ID != :counselorId
          AND CREATED_AT > NVL((
            SELECT MAX(CREATED_AT) 
            FROM CHAT_MESSAGES 
            WHERE ROOM_ID = r.ROOM_ID 
            AND USER_ID = :counselorId
          ), TO_TIMESTAMP('1970-01-01', 'YYYY-MM-DD'))
        ) as UNREAD_COUNT
      FROM CHAT_ROOMS r
      JOIN ROOM_MEMBERS rm_counselor ON r.ROOM_ID = rm_counselor.ROOM_ID AND rm_counselor.USER_ID = :counselorId
      JOIN ROOM_MEMBERS rm_student ON r.ROOM_ID = rm_student.ROOM_ID AND rm_student.ROLE = 'student'
      JOIN USERS student ON rm_student.USER_ID = student.ID
      WHERE r.ROOM_TYPE = 'counselor_session'
      AND r.IS_ACTIVE = 1
      ORDER BY r.UPDATED_AT DESC
    `;

    const result = await executeQuery(chatsSql, { counselorId });

    const chats = result.rows.map(row => ({
      roomId: row.ROOM_ID,
      roomName: row.ROOM_NAME,
      studentName: row.STUDENT_NAME,
      studentId: row.STUDENT_ID,
      lastMessage: row.LAST_MESSAGE || 'No messages yet',
      lastMessageTime: row.LAST_MESSAGE_TIME,
      unreadCount: row.UNREAD_COUNT || 0,
      createdAt: row.CREATED_AT,
      updatedAt: row.UPDATED_AT
    }));

    console.log(`💬 Found ${chats.length} active chats for counselor ${counselorId}`);

    res.json({
      success: true,
      data: chats,
      meta: {
        totalChats: chats.length,
        unreadTotal: chats.reduce((sum, chat) => sum + chat.unreadCount, 0)
      }
    });

  } catch (error) {
    console.error('❌ Error getting counselor chats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chats',
      error: error.message
    });
  }
};

const getStudentChats = async (req, res) => {
  try {
    const studentId = req.user.userId;

    console.log('💬 Getting student chats for user:', studentId);

    const chatsSql = `
      SELECT 
        r.ROOM_ID,
        r.ROOM_NAME,
        r.CREATED_AT,
        r.UPDATED_AT,
        counselor.EMRI || ' ' || counselor.SURNAME as COUNSELOR_NAME,
        counselor.ID as COUNSELOR_ID,
        (
          SELECT MESSAGE_TEXT 
          FROM CHAT_MESSAGES 
          WHERE ROOM_ID = r.ROOM_ID 
          ORDER BY CREATED_AT DESC 
          FETCH FIRST 1 ROWS ONLY
        ) as LAST_MESSAGE,
        (
          SELECT CREATED_AT 
          FROM CHAT_MESSAGES 
          WHERE ROOM_ID = r.ROOM_ID 
          ORDER BY CREATED_AT DESC 
          FETCH FIRST 1 ROWS ONLY
        ) as LAST_MESSAGE_TIME,
        (
          SELECT COUNT(*) 
          FROM CHAT_MESSAGES 
          WHERE ROOM_ID = r.ROOM_ID 
          AND USER_ID != :studentId
          AND CREATED_AT > NVL((
            SELECT MAX(CREATED_AT) 
            FROM CHAT_MESSAGES 
            WHERE ROOM_ID = r.ROOM_ID 
            AND USER_ID = :studentId
          ), TO_TIMESTAMP('1970-01-01', 'YYYY-MM-DD'))
        ) as UNREAD_COUNT
      FROM CHAT_ROOMS r
      JOIN ROOM_MEMBERS rm_student ON r.ROOM_ID = rm_student.ROOM_ID AND rm_student.USER_ID = :studentId
      JOIN ROOM_MEMBERS rm_counselor ON r.ROOM_ID = rm_counselor.ROOM_ID AND rm_counselor.ROLE = 'counselor'
      JOIN USERS counselor ON rm_counselor.USER_ID = counselor.ID
      WHERE r.ROOM_TYPE = 'counselor_session'
      AND r.IS_ACTIVE = 1
      ORDER BY r.UPDATED_AT DESC
    `;

    const result = await executeQuery(chatsSql, { studentId });

    const chats = result.rows.map(row => ({
      roomId: row.ROOM_ID,
      roomName: row.ROOM_NAME,
      counselorName: row.COUNSELOR_NAME,
      counselorId: row.COUNSELOR_ID,
      lastMessage: row.LAST_MESSAGE || 'No messages yet',
      lastMessageTime: row.LAST_MESSAGE_TIME,
      unreadCount: row.UNREAD_COUNT || 0,
      createdAt: row.CREATED_AT,
      updatedAt: row.UPDATED_AT
    }));

    console.log(`💬 Found ${chats.length} active chats for student ${studentId}`);

    res.json({
      success: true,
      data: chats,
      meta: {
        totalChats: chats.length,
        unreadTotal: chats.reduce((sum, chat) => sum + chat.unreadCount, 0)
      }
    });

  } catch (error) {
    console.error('❌ Error getting student chats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chats',
      error: error.message
    });
  }
};

const getCounselorProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const userSql = `
      SELECT ID, EMRI, SURNAME, EMAILI, ROLI, IS_VERIFIED, CREATED_AT
      FROM USERS WHERE ID = :userId
    `;
    const userResult = await executeQuery(userSql, { userId });
    const user = userResult.rows[0];

    const profileSql = `
      SELECT SPECIALIZATION, EXPERIENCE_YEARS, PROFESSIONAL_BIO, IS_AVAILABLE
      FROM USER_PROFILES WHERE USER_ACCOUNT_ID = :userId
    `;
    const profileResult = await executeQuery(profileSql, { userId });
    const profile = profileResult.rows[0] || {};

    res.json({
      success: true,
      data: {
        id: user.ID,
        firstName: user.EMRI,
        lastName: user.SURNAME,
        email: user.EMAILI,
        specialization: profile.SPECIALIZATION || '',
        experience: profile.EXPERIENCE_YEARS || 0,
        education: profile.PROFESSIONAL_BIO || '',
        certifications: '',
        isApproved: true,
        isActive: profile.IS_AVAILABLE === 1,
        isVerified: user.IS_VERIFIED === 1,
        createdAt: user.CREATED_AT
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
};

const updateCounselorProfile = async (req, res) => {
  try {
    console.log('Updating profile for user ID:', req.user.userId);
    console.log('Update data:', req.body);
    
    const userId = req.user.userId;
    const { firstName, lastName, specialization, experience, education, certifications } = req.body;

    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'First name and last name are required'
      });
    }

    const updateUserSql = `
      UPDATE USERS 
      SET EMRI = :firstName, SURNAME = :lastName, UPDATED_AT = CURRENT_TIMESTAMP
      WHERE ID = :userId
    `;
    
    await executeQuery(updateUserSql, { 
      firstName: firstName.trim(), 
      lastName: lastName.trim(), 
      userId 
    });

    const checkProfileSql = `
      SELECT USER_ACCOUNT_ID FROM USER_PROFILES WHERE USER_ACCOUNT_ID = :userId
    `;
    
    const profileExists = await executeQuery(checkProfileSql, { userId });

    const professionalBio = [education, certifications].filter(Boolean).join(' ').trim();

    if (profileExists.rows.length > 0) {
      const updateProfileSql = `
        UPDATE USER_PROFILES 
        SET SPECIALIZATION = :specialization,
            EXPERIENCE_YEARS = :experience,
            PROFESSIONAL_BIO = :bio,
            UPDATED_AT = CURRENT_TIMESTAMP
        WHERE USER_ACCOUNT_ID = :userId
      `;
      
      await executeQuery(updateProfileSql, {
        specialization: specialization || null,
        experience: parseInt(experience) || 0,
        bio: professionalBio || null,
        userId
      });
    } else {
      const insertProfileSql = `
        INSERT INTO USER_PROFILES (
          USER_ACCOUNT_ID, SPECIALIZATION, EXPERIENCE_YEARS, 
          PROFESSIONAL_BIO, IS_AVAILABLE, CREATED_AT, UPDATED_AT
        ) VALUES (
          :userId, :specialization, :experience, 
          :bio, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `;
      
      await executeQuery(insertProfileSql, {
        userId,
        specialization: specialization || null,
        experience: parseInt(experience) || 0,
        bio: professionalBio || null
      });
    }

    const updatedUserSql = `
      SELECT u.ID, u.EMRI, u.SURNAME, u.EMAILI, u.IS_VERIFIED, u.CREATED_AT,
             p.SPECIALIZATION, p.EXPERIENCE_YEARS, p.PROFESSIONAL_BIO, p.IS_AVAILABLE
      FROM USERS u
      LEFT JOIN USER_PROFILES p ON u.ID = p.USER_ACCOUNT_ID
      WHERE u.ID = :userId
    `;
    
    const updatedResult = await executeQuery(updatedUserSql, { userId });
    const updated = updatedResult.rows[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updated.ID,
        firstName: updated.EMRI,
        lastName: updated.SURNAME,
        email: updated.EMAILI,
        specialization: updated.SPECIALIZATION || '',
        experience: updated.EXPERIENCE_YEARS || 0,
        education: '',
        certifications: '',
        isApproved: true,
        isActive: updated.IS_AVAILABLE === 1,
        isVerified: updated.IS_VERIFIED === 1,
        createdAt: updated.CREATED_AT
      }
    });
  } catch (error) {
    console.error('Update counselor profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile' 
    });
  }
};

const getCounselorStats = async (req, res) => {
  try {
    const counselorId = req.user.userId;
    
    
    const statsSql = `
      SELECT 
        COUNT(DISTINCT r.ROOM_ID) as TOTAL_CHATS,
        COUNT(DISTINCT rm_student.USER_ID) as STUDENTS_HELPED,
        COUNT(m.MESSAGE_ID) as TOTAL_MESSAGES,
        ROUND(AVG(CASE WHEN m.USER_ID = :counselorId THEN 1 ELSE 0 END), 2) as RESPONSE_RATE
      FROM CHAT_ROOMS r
      JOIN ROOM_MEMBERS rm_counselor ON r.ROOM_ID = rm_counselor.ROOM_ID AND rm_counselor.USER_ID = :counselorId
      JOIN ROOM_MEMBERS rm_student ON r.ROOM_ID = rm_student.ROOM_ID AND rm_student.ROLE = 'student'
      LEFT JOIN CHAT_MESSAGES m ON r.ROOM_ID = m.ROOM_ID
      WHERE r.ROOM_TYPE = 'counselor_session'
    `;

    const statsResult = await executeQuery(statsSql, { counselorId });
    const stats = statsResult.rows[0] || {};

    res.json({ 
      success: true, 
      data: {
        studentsHelped: stats.STUDENTS_HELPED || 0,
        sessionsCompleted: stats.TOTAL_CHATS || 0,
        averageRating: 4.8,
        totalHours: Math.floor((stats.TOTAL_MESSAGES || 0) / 10),
        activeChats: 0,
        pendingAppointments: 0,
        totalMessages: stats.TOTAL_MESSAGES || 0,
        responseRate: stats.RESPONSE_RATE || 0
      }
    });
  } catch (error) {
    console.error('Counselor stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get statistics' 
    });
  }
};

const getActiveChats = async (req, res) => {
 
  return getCounselorChats(req, res);
};

const updateAvailability = async (req, res) => {
  try {
    console.log('Updating availability for user ID:', req.user.userId);
    console.log('Request body:', req.body);
    
    const userId = req.user.userId;
    const { isAvailable } = req.body;

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isAvailable must be true or false'
      });
    }

    const checkProfileSql = `
      SELECT USER_ACCOUNT_ID FROM USER_PROFILES WHERE USER_ACCOUNT_ID = :userId
    `;
    
    const profileExists = await executeQuery(checkProfileSql, { userId });

    if (profileExists.rows.length > 0) {
      const updateSql = `
        UPDATE USER_PROFILES 
        SET IS_AVAILABLE = :isAvailable, UPDATED_AT = CURRENT_TIMESTAMP
        WHERE USER_ACCOUNT_ID = :userId
      `;
      
      await executeQuery(updateSql, { 
        isAvailable: isAvailable ? 1 : 0, 
        userId 
      });
    } else {
      const insertSql = `
        INSERT INTO USER_PROFILES (
          USER_ACCOUNT_ID, IS_AVAILABLE, CREATED_AT, UPDATED_AT
        ) VALUES (
          :userId, :isAvailable, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `;
      
      await executeQuery(insertSql, {
        userId,
        isAvailable: isAvailable ? 1 : 0
      });
    }

    res.json({
      success: true,
      message: `Status updated to ${isAvailable ? 'available' : 'unavailable'}`,
      data: { isAvailable }
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

module.exports = {
 
  getCounselorProfile,
  updateCounselorProfile,
  getCounselorStats,
  getActiveChats,
  updateAvailability,
  
  createPrivateRoom,
  getRoomMessages,
  sendRoomMessage,
  getCounselorChats,
  getStudentChats
};