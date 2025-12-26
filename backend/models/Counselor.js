//backend/models/Counselor.js
const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

class Counselor {
  

  static async findById(counselorId) {
    const sql = `
      SELECT 
        c.ID, c.EMRI, c.SURNAME, c.EMAILI, c.ROLI, 
        c.IS_APPROVED, c.IS_ACTIVE, c.IS_VERIFIED, c.CREATED_AT,
        p.SPECIALIZATION, p.EXPERIENCE_YEARS, p.PROFESSIONAL_BIO, p.IS_AVAILABLE
      FROM counselors c
      LEFT JOIN USER_PROFILES p ON c.ID = p.USER_ACCOUNT_ID
      WHERE c.ID = :counselorId
    `;
    
    const result = await executeQuery(sql, { counselorId });
    return result.rows[0] || null;
  }
  
  
  static async updateProfile(counselorId, updateData) {
    const { 
      firstName, 
      lastName, 
      specialization, 
      experience, 
      education,
      certifications 
    } = updateData;
    
   
    const updateCounselorSql = `
      UPDATE counselors 
      SET EMRI = :firstName, SURNAME = :lastName, UPDATED_AT = CURRENT_TIMESTAMP
      WHERE ID = :counselorId
    `;
    
    await executeQuery(updateCounselorSql, { 
      firstName: firstName.trim(), 
      lastName: lastName.trim(), 
      counselorId 
    });
    
 
    const checkProfileSql = `
      SELECT USER_ACCOUNT_ID FROM USER_PROFILES WHERE USER_ACCOUNT_ID = :counselorId
    `;
    
    const profileExists = await executeQuery(checkProfileSql, { counselorId });
    
    if (profileExists.rows.length > 0) {
    
      const updateProfileSql = `
        UPDATE USER_PROFILES 
        SET SPECIALIZATION = :specialization,
            EXPERIENCE_YEARS = :experience,
            PROFESSIONAL_BIO = :bio,
            UPDATED_AT = CURRENT_TIMESTAMP
        WHERE USER_ACCOUNT_ID = :counselorId
      `;
      
      await executeQuery(updateProfileSql, {
        specialization: specialization || null,
        experience: parseInt(experience) || 0,
        bio: (education + ' ' + certifications).trim() || null,
        counselorId
      });
    } else {
      
      const insertProfileSql = `
        INSERT INTO USER_PROFILES (
          USER_ACCOUNT_ID, SPECIALIZATION, EXPERIENCE_YEARS, 
          PROFESSIONAL_BIO, CREATED_AT, UPDATED_AT
        ) VALUES (
          :counselorId, :specialization, :experience, 
          :bio, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `;
      
      await executeQuery(insertProfileSql, {
        counselorId,
        specialization: specialization || null,
        experience: parseInt(experience) || 0,
        bio: (education + ' ' + certifications).trim() || null
      });
    }
    

    return await this.findById(counselorId);
  }
  
  static async updateAvailability(counselorId, isAvailable) {
   
    const updateProfileSql = `
      UPDATE USER_PROFILES 
      SET IS_AVAILABLE = :isAvailable, UPDATED_AT = CURRENT_TIMESTAMP
      WHERE USER_ACCOUNT_ID = :counselorId
    `;
    
    await executeQuery(updateProfileSql, { 
      isAvailable: isAvailable ? 1 : 0, 
      counselorId 
    });
  
    const updateCounselorSql = `
      UPDATE counselors 
      SET IS_ACTIVE = :isAvailable, UPDATED_AT = CURRENT_TIMESTAMP
      WHERE ID = :counselorId
    `;
    
    const result = await executeQuery(updateCounselorSql, { 
      isAvailable: isAvailable ? 1 : 0, 
      counselorId 
    });
    
    return result.rowsAffected > 0;
  }
  

  static async findByEmail(email) {
    const sql = `
      SELECT 
        ID, EMRI, SURNAME, EMAILI, PASSWORDI, ROLI,
        IS_APPROVED, IS_ACTIVE, IS_VERIFIED, CREATED_AT
      FROM counselors 
      WHERE EMAILI = :email
    `;
    
    const result = await executeQuery(sql, { email: email.toLowerCase() });
    return result.rows[0] || null;
  }
  
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }
  
  static async updatePassword(counselorId, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      const sql = `
        UPDATE counselors 
        SET PASSWORDI = :password, UPDATED_AT = CURRENT_TIMESTAMP
        WHERE ID = :counselorId
      `;
      
      const result = await executeQuery(sql, { password: hashedPassword, counselorId });
      return result.rowsAffected > 0;
    } catch (error) {
      console.error('Update password error:', error);
      return false;
    }
  }
}

module.exports = Counselor;