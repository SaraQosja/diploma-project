// backend/models/Profile.js
const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

class Profile {
 
  static async getUserProfile(userId) {
    const sql = `
      SELECT 
        u.ID,
        u.EMRI,
        u.MBIEMRI,
        u.EMAIL,
        u.TELEFONI,
        u.DITELINDJA,
        u.ROLI,
        u.STATUSI,
        u.CREATED_AT,
        u.UPDATED_AT,
        up.BIO,
        up.PHOTO_URL,
        up.GJINIA,
        up.QYTETI,
        up.ADRESA,
        up.SHKOLLA_AKTUALE,
        up.KLASA,
        up.INTERESA,
        up.AFTESI,
        up.QELLIMET_KARRIERES,
        up.LINKEDIN_URL,
        up.GITHUB_URL,
        up.PORTFOLIO_URL
      FROM USERS u
      LEFT JOIN USER_PROFILES up ON u.ID = up.USER_ID
      WHERE u.ID = :1
    `;

    const result = await executeQuery(sql, [userId]);
    return result.rows[0];
  }


  static async updateBasicProfile(userId, profileData) {
    const { emri, mbiemri, email, telefoni, ditelindja } = profileData;
    
    const sql = `
      UPDATE USERS 
      SET EMRI = :1, 
          MBIEMRI = :2, 
          EMAIL = :3, 
          TELEFONI = :4, 
          DITELINDJA = :5,
          UPDATED_AT = SYSDATE
      WHERE ID = :6
    `;

    const params = [emri, mbiemri, email, telefoni || null, ditelindja || null, userId];
    await executeQuery(sql, params);
    
    return true;
  }


  static async updateExtendedProfile(userId, profileData) {
    const { 
      bio, gjinia, qyteti, adresa, shkolla_aktuale, klasa, 
      interesa, aftesi, qellimet_karrieres, linkedin_url, 
      github_url, portfolio_url 
    } = profileData;

    const checkSql = 'SELECT USER_ID FROM USER_PROFILES WHERE USER_ID = :1';
    const existingProfile = await executeQuery(checkSql, [userId]);

    if (existingProfile.rows.length > 0) {
      
      const updateSql = `
        UPDATE USER_PROFILES 
        SET BIO = :1,
            GJINIA = :2,
            QYTETI = :3,
            ADRESA = :4,
            SHKOLLA_AKTUALE = :5,
            KLASA = :6,
            INTERESA = :7,
            AFTESI = :8,
            QELLIMET_KARRIERES = :9,
            LINKEDIN_URL = :10,
            GITHUB_URL = :11,
            PORTFOLIO_URL = :12,
            UPDATED_AT = SYSDATE
        WHERE USER_ID = :13
      `;

      const params = [
        bio || null, gjinia || null, qyteti || null, adresa || null,
        shkolla_aktuale || null, klasa || null, 
        typeof interesa === 'object' ? JSON.stringify(interesa) : interesa || null,
        typeof aftesi === 'object' ? JSON.stringify(aftesi) : aftesi || null,
        qellimet_karrieres || null, linkedin_url || null, 
        github_url || null, portfolio_url || null, userId
      ];

      await executeQuery(updateSql, params);
    } else {
      
      const insertSql = `
        INSERT INTO USER_PROFILES (
          USER_ID, BIO, GJINIA, QYTETI, ADRESA, SHKOLLA_AKTUALE, 
          KLASA, INTERESA, AFTESI, QELLIMET_KARRIERES, 
          LINKEDIN_URL, GITHUB_URL, PORTFOLIO_URL, CREATED_AT
        ) VALUES (
          :1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13, SYSDATE
        )
      `;

      const params = [
        userId, bio || null, gjinia || null, qyteti || null, adresa || null,
        shkolla_aktuale || null, klasa || null,
        typeof interesa === 'object' ? JSON.stringify(interesa) : interesa || null,
        typeof aftesi === 'object' ? JSON.stringify(aftesi) : aftesi || null,
        qellimet_karrieres || null, linkedin_url || null, 
        github_url || null, portfolio_url || null
      ];

      await executeQuery(insertSql, params);
    }

    return true;
  }


  static async changePassword(userId, currentPassword, newPassword) {

    const getUserSql = 'SELECT PASSWORD_HASH FROM USERS WHERE ID = :1';
    const userResult = await executeQuery(getUserSql, [userId]);
    
    if (userResult.rows.length === 0) {
      throw new Error('Përdoruesi nuk u gjet');
    }

    const currentHash = userResult.rows[0].PASSWORD_HASH;
    
 
    const isValidPassword = await bcrypt.compare(currentPassword, currentHash);
    if (!isValidPassword) {
      throw new Error('Fjalëkalimi aktual është i gabuar');
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    const updateSql = `
      UPDATE USERS 
      SET PASSWORD_HASH = :1, 
          UPDATED_AT = SYSDATE 
      WHERE ID = :2
    `;

    await executeQuery(updateSql, [newHash, userId]);
    return true;
  }

 
  static async updateProfilePhoto(userId, photoUrl) {

    const checkSql = 'SELECT USER_ID FROM USER_PROFILES WHERE USER_ID = :1';
    const existingProfile = await executeQuery(checkSql, [userId]);

    if (existingProfile.rows.length > 0) {
      
      const updateSql = `
        UPDATE USER_PROFILES 
        SET PHOTO_URL = :1, 
            UPDATED_AT = SYSDATE 
        WHERE USER_ID = :2
      `;
      await executeQuery(updateSql, [photoUrl, userId]);
    } else {
     
      const insertSql = `
        INSERT INTO USER_PROFILES (USER_ID, PHOTO_URL, CREATED_AT) 
        VALUES (:1, :2, SYSDATE)
      `;
      await executeQuery(insertSql, [userId, photoUrl]);
    }

    return true;
  }

  static async deleteProfilePhoto(userId) {
    const sql = `
      UPDATE USER_PROFILES 
      SET PHOTO_URL = NULL, 
          UPDATED_AT = SYSDATE 
      WHERE USER_ID = :1
    `;

    await executeQuery(sql, [userId]);
    return true;
  }

 
  static async getProfileCompletion(userId) {
    const profile = await this.getUserProfile(userId);
    if (!profile) return 0;

    const fields = [
      profile.EMRI, profile.MBIEMRI, profile.EMAIL, // Required fields
      profile.TELEFONI, profile.DITELINDJA, profile.BIO,
      profile.GJINIA, profile.QYTETI, profile.SHKOLLA_AKTUALE,
      profile.INTERESA, profile.AFTESI, profile.QELLIMET_KARRIERES
    ];

    const filledFields = fields.filter(field => field && field.trim() !== '').length;
    const totalFields = fields.length;
    
    return Math.round((filledFields / totalFields) * 100);
  }
}

module.exports = Profile;

