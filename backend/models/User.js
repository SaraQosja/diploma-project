//backend/models/User.js 

const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {

  static async create(userData) {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      role = 'nxenes',
      specialization = null,
      counselorBio = null 
    } = userData;
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const sql = `
      INSERT INTO users (
        EMRI, SURNAME, EMAILI, PASSWORDI, ROLI,
        CREATED_AT, UPDATED_AT, IS_VERIFIED, LAST_ACTIVE
      ) VALUES (
        :firstName, :lastName, :email, :password, :role,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, CURRENT_TIMESTAMP
      )
    `;
    
    try {
      await executeQuery(sql, {
        firstName, lastName, email: email.toLowerCase(), password: hashedPassword, role
      });
      
      const newUser = await this.findByEmail(email);
      return {
        userId: newUser.ID,
        firstName: newUser.EMRI,
        lastName: newUser.SURNAME,
        email: newUser.EMAILI,
        role: newUser.ROLI
      };
    } catch (error) {
      if (error.errorNum === 1) throw new Error('Email already exists');
      throw new Error('Failed to create user');
    }
  }
  

  static async findByEmail(email) {
    const sql = `
      SELECT ID, EMRI, SURNAME, EMAILI, PASSWORDI, ROLI,
             REMEMBER_TOKEN, VERIFICATION_TOKEN, IS_VERIFIED,
             CREATED_AT, UPDATED_AT, LAST_ACTIVE
      FROM users WHERE EMAILI = :email
    `;
    const result = await executeQuery(sql, { email: email.toLowerCase() });
    return result.rows[0] || null;
  }

  static async findById(userId) {
    const sql = `
      SELECT ID, EMRI, SURNAME, EMAILI, ROLI,
             REMEMBER_TOKEN, IS_VERIFIED, CREATED_AT, UPDATED_AT, LAST_ACTIVE
      FROM users WHERE ID = :userId
    `;
    const result = await executeQuery(sql, { userId });
    return result.rows[0] || null;
  }
  
  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
  
  // Update user profile 
  static async updateProfile(userId, updateData) {
    const { firstName, lastName, specialization, counselorBio } = updateData;
    
    // Update basic user info
    const updateUserSql = `
      UPDATE users 
      SET EMRI = :firstName, SURNAME = :lastName, UPDATED_AT = CURRENT_TIMESTAMP
      WHERE ID = :userId
    `;
    await executeQuery(updateUserSql, { firstName, lastName, userId });
    
    // Update profile data if user is counselor
    if (specialization || counselorBio) {
      const checkProfileSql = `SELECT USER_ACCOUNT_ID FROM USER_PROFILES WHERE USER_ACCOUNT_ID = :userId`;
      const profileExists = await executeQuery(checkProfileSql, { userId });
      
      if (profileExists.rows.length > 0) {
        const updateProfileSql = `
          UPDATE USER_PROFILES 
          SET SPECIALIZATION = :specialization, PROFESSIONAL_BIO = :counselorBio, UPDATED_AT = CURRENT_TIMESTAMP
          WHERE USER_ACCOUNT_ID = :userId
        `;
        await executeQuery(updateProfileSql, { specialization, counselorBio, userId });
      } else {
        const insertProfileSql = `
          INSERT INTO USER_PROFILES (USER_ACCOUNT_ID, SPECIALIZATION, PROFESSIONAL_BIO, CREATED_AT, UPDATED_AT)
          VALUES (:userId, :specialization, :counselorBio, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
        await executeQuery(insertProfileSql, { userId, specialization, counselorBio });
      }
    }
    
    return await this.findById(userId);
  }
  
  // Update password - UNCHANGED
  static async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const sql = `UPDATE users SET PASSWORDI = :password, UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = :userId`;
    await executeQuery(sql, { password: hashedPassword, userId });
    return true;
  }
  
  
  static async setRememberToken(userId, token) {
    const sql = `UPDATE users SET REMEMBER_TOKEN = :token, UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = :userId`;
    await executeQuery(sql, { token, userId });
  }
  
  static async clearRememberToken(userId) {
    const sql = `UPDATE users SET REMEMBER_TOKEN = NULL, UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = :userId`;
    await executeQuery(sql, { userId });
  }
  
  static async setVerificationToken(userId, token) {
    const sql = `UPDATE users SET VERIFICATION_TOKEN = :token, UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = :userId`;
    await executeQuery(sql, { token, userId });
  }
  
  static async verifyAccount(verificationToken) {
    const sql = `UPDATE users SET IS_VERIFIED = 1, VERIFICATION_TOKEN = NULL, UPDATED_AT = CURRENT_TIMESTAMP WHERE VERIFICATION_TOKEN = :token`;
    const result = await executeQuery(sql, { token: verificationToken });
    return result.rowsAffected > 0;
  }
  
  static async updateAvailability(userId, isAvailable) {
  
    const checkProfileSql = `SELECT USER_ACCOUNT_ID FROM USER_PROFILES WHERE USER_ACCOUNT_ID = :userId`;
    const profileExists = await executeQuery(checkProfileSql, { userId });
    
    if (profileExists.rows.length > 0) {
      const sql = `
        UPDATE USER_PROFILES 
        SET IS_AVAILABLE = :isAvailable, UPDATED_AT = CURRENT_TIMESTAMP
        WHERE USER_ACCOUNT_ID = :userId
      `;
      const result = await executeQuery(sql, { isAvailable: isAvailable ? 1 : 0, userId });
      return result.rowsAffected > 0;
    } else {
      // Create profile if doesn't exist
      const sql = `
        INSERT INTO USER_PROFILES (USER_ACCOUNT_ID, IS_AVAILABLE, CREATED_AT, UPDATED_AT)
        VALUES (:userId, :isAvailable, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
      await executeQuery(sql, { userId, isAvailable: isAvailable ? 1 : 0 });
      return true;
    }
  }
  
  static async getCounselors(filters = {}) {
    let sql = `
      SELECT u.ID, u.EMRI, u.SURNAME, u.EMAILI, u.CREATED_AT, u.LAST_ACTIVE,
             p.SPECIALIZATION, p.PROFESSIONAL_BIO as COUNSELOR_BIO, p.IS_AVAILABLE, u.IS_VERIFIED
      FROM users u
      LEFT JOIN USER_PROFILES p ON u.ID = p.USER_ACCOUNT_ID
      WHERE u.ROLI = 'counselor'
    `;
    const binds = {};
    
    if (filters.isAvailable !== undefined) {
      sql += ` AND p.IS_AVAILABLE = :isAvailable`;
      binds.isAvailable = filters.isAvailable ? 1 : 0;
    }
    
    sql += ` ORDER BY p.IS_AVAILABLE DESC, u.LAST_ACTIVE DESC`;
    const result = await executeQuery(sql, binds);
    return result.rows;
  }
  
  static async countUsersByRole(role) {
    const sql = `SELECT COUNT(*) as TOTAL FROM users WHERE ROLI = :role`;
    const result = await executeQuery(sql, { role });
    return result.rows[0]?.TOTAL || 0;
  }
  
  static async countCounselors(filters = {}) {
    let sql = `
      SELECT COUNT(*) as TOTAL 
      FROM users u 
      LEFT JOIN USER_PROFILES p ON u.ID = p.USER_ACCOUNT_ID 
      WHERE u.ROLI = 'counselor'
    `;
    const binds = {};
    
    if (filters.isAvailable !== undefined) {
      sql += ` AND p.IS_AVAILABLE = :isAvailable`;
      binds.isAvailable = filters.isAvailable ? 1 : 0;
    }
    
    const result = await executeQuery(sql, binds);
    return result.rows[0]?.TOTAL || 0;
  }
  
  static async getCounselorStats(counselorId) {
    const queries = {
      totalStudents: `SELECT COUNT(DISTINCT USER_ID) as TOTAL FROM chats WHERE COUNSELOR_ID = :counselorId`,
      activeChats: `SELECT COUNT(*) as TOTAL FROM chats WHERE COUNSELOR_ID = :counselorId AND STATUS = 'active'`,
      todaySessions: `SELECT COUNT(*) as TOTAL FROM chats WHERE COUNSELOR_ID = :counselorId AND DATE(CREATED_AT) = DATE(CURRENT_TIMESTAMP)`,
      totalMessages: `SELECT COUNT(*) as TOTAL FROM chat_messages cm JOIN chats c ON cm.CHAT_ID = c.ID WHERE c.COUNSELOR_ID = :counselorId AND cm.SENDER_TYPE = 'counselor'`
    };
    
    try {
      const results = await Promise.all([
        executeQuery(queries.totalStudents, { counselorId }).catch(() => ({ rows: [{ TOTAL: 0 }] })),
        executeQuery(queries.activeChats, { counselorId }).catch(() => ({ rows: [{ TOTAL: 0 }] })),
        executeQuery(queries.todaySessions, { counselorId }).catch(() => ({ rows: [{ TOTAL: 0 }] })),
        executeQuery(queries.totalMessages, { counselorId }).catch(() => ({ rows: [{ TOTAL: 0 }] }))
      ]);
      
      return {
        totalStudentsHelped: results[0].rows[0]?.TOTAL || 0,
        activeChats: results[1].rows[0]?.TOTAL || 0,
        sessionsToday: results[2].rows[0]?.TOTAL || 0,
        messagesSent: results[3].rows[0]?.TOTAL || 0
      };
    } catch (error) {
      return { totalStudentsHelped: 0, activeChats: 0, sessionsToday: 0, messagesSent: 0 };
    }
  }
  
  static async getCounselorChats(counselorId) {
    const sql = `
      SELECT c.ID, c.STATUS, c.UPDATED_AT,
             u.EMRI || ' ' || u.SURNAME as STUDENT_NAME,
             u.ID as STUDENT_ID,
             (SELECT MESSAGE_TEXT FROM chat_messages cm 
              WHERE cm.CHAT_ID = c.ID ORDER BY cm.CREATED_AT DESC 
              FETCH FIRST 1 ROWS ONLY) as LAST_MESSAGE,
             (SELECT COUNT(*) FROM chat_messages cm 
              WHERE cm.CHAT_ID = c.ID AND cm.IS_READ = 0 AND cm.SENDER_TYPE = 'student') as UNREAD_COUNT
      FROM chats c
      JOIN users u ON c.USER_ID = u.ID
      WHERE c.COUNSELOR_ID = :counselorId AND c.STATUS IN ('active', 'waiting')
      ORDER BY c.UPDATED_AT DESC
    `;
    
    try {
      const result = await executeQuery(sql, { counselorId });
      return result.rows.map(chat => ({
        id: chat.ID,
        studentId: chat.STUDENT_ID,
        studentName: chat.STUDENT_NAME,
        lastMessage: chat.LAST_MESSAGE || 'No messages yet',
        timestamp: this.formatTimeAgo(chat.UPDATED_AT),
        unreadCount: chat.UNREAD_COUNT || 0,
        status: chat.STATUS
      }));
    } catch (error) {
      return [];
    }
  }
  
  static formatTimeAgo(date) {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const chatDate = new Date(date);
    const diffMs = now - chatDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
}

module.exports = User;