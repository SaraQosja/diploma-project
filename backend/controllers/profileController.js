// backend/controllers/profileController.js 
const { executeQuery } = require('../config/database');
const { validationResult } = require('express-validator');

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Nuk jeni i autentifikuar'
      });
    }
    
    console.log('👤 Getting profile for user:', userId);

    const sql = `
      SELECT 
        u.ID,
        u.EMRI,
        u.SURNAME,
        u.EMAILI,
        u.ROLI,
        u.IS_VERIFIED,
        u.CREATED_AT as USER_CREATED,
        up.PROFILE_ID,
        up.EDUCATION_LEVEL,
        up.CURRENT_SCHOOL,
        up.INTERESTS,
        up.GOALS,
        up.STRENGTHS,
        up.SKILLS,
        up.PERSONALITY_TYPE,
        up.COMPLETED_AT,
        up.CREATED_AT as PROFILE_CREATED,
        up.UPDATED_AT as PROFILE_UPDATED
      FROM USERS u
      LEFT JOIN USER_PROFILES up ON u.ID = up.USER_ACCOUNT_ID
      WHERE u.ID = :1
    `;

    const result = await executeQuery(sql, [userId]);
    
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profili nuk u gjet'
      });
    }

   
    const row = result.rows[0];
    
    const extractClob = async (clobField) => {
      if (!clobField) return '';
      try {
        if (typeof clobField === 'string') return clobField;
        if (clobField.getData) return await clobField.getData();
        return String(clobField || '');
      } catch (error) {
        console.log('Error extracting CLOB:', error);
        return '';
      }
    };

    const safeData = {
      id: Number(row.ID) || 0,
      emri: String(row.EMRI || ''),
      mbiemri: String(row.SURNAME || ''),
      email: String(row.EMAILI || ''),
      roli: String(row.ROLI || 'nxenes'),
      statusi: row.IS_VERIFIED ? 'ACTIVE' : 'PENDING',
      created_at: row.USER_CREATED ? new Date(row.USER_CREATED).toISOString() : null,
      updated_at: row.PROFILE_UPDATED ? new Date(row.PROFILE_UPDATED).toISOString() : null,
      profile: {
        education_level: String(row.EDUCATION_LEVEL || ''),
        current_school: String(row.CURRENT_SCHOOL || ''),
     
        interests: await extractClob(row.INTERESTS),
        goals: await extractClob(row.GOALS),
        strengths: await extractClob(row.STRENGTHS),
        skills: await extractClob(row.SKILLS),
        personality_type: String(row.PERSONALITY_TYPE || ''),
        completed_at: row.COMPLETED_AT ? new Date(row.COMPLETED_AT).toISOString() : null
      }
    };

    const requiredFields = [safeData.emri, safeData.mbiemri, safeData.email];
    const optionalFields = [
      safeData.profile.education_level, 
      safeData.profile.current_school, 
      safeData.profile.interests, 
      safeData.profile.goals
    ];
    
    const filledRequired = requiredFields.filter(field => field && field.trim() !== '').length;
    const filledOptional = optionalFields.filter(field => field && field.trim() !== '').length;
    
    const requiredCompletion = (filledRequired / requiredFields.length) * 70;
    const optionalCompletion = (filledOptional / optionalFields.length) * 30;
    const completion = Math.round(requiredCompletion + optionalCompletion);

 
    safeData.completion = completion;

    console.log('✅ Profile retrieved successfully');

    res.json({
      success: true,
      data: safeData
    });

  } catch (error) {
    console.error('❌ Error getting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në marrjen e profilit'
    });
  }
};

const updateBasicProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Nuk jeni i autentifikuar'
      });
    }
    
    const { emri, mbiemri, email } = req.body;
    
    if (!emri || !mbiemri || !email) {
      return res.status(400).json({
        success: false,
        message: 'Të gjitha fushat janë të detyrueshme'
      });
    }
    
    console.log('👤 Updating basic profile for user:', userId);

    const updateSql = `
      UPDATE USERS 
      SET EMRI = :1, SURNAME = :2, EMAILI = :3, UPDATED_AT = CURRENT_TIMESTAMP 
      WHERE ID = :4
    `;

    await executeQuery(updateSql, [emri, mbiemri, email, userId]);

    console.log('✅ Basic profile updated successfully');
    res.json({
      success: true,
      message: 'Profili u përditësua me sukses'
    });

  } catch (error) {
    console.error('❌ Error updating basic profile:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në përditësimin e profilit'
    });
  }
};


const updateExtendedProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Nuk jeni i autentifikuar'
      });
    }
    
    const {
      education_level,
      current_school,
      interests,
      goals,
      strengths,
      skills,
      personality_type
    } = req.body;
    
    console.log('👤 Updating extended profile for user:', userId);

    const checkSql = `SELECT PROFILE_ID FROM USER_PROFILES WHERE USER_ACCOUNT_ID = :1`;
    const checkResult = await executeQuery(checkSql, [userId]);
    
    const hasProfile = checkResult.rows && checkResult.rows.length > 0;

    let sql;
    let params;

    if (hasProfile) {
   
      sql = `
        UPDATE USER_PROFILES 
        SET 
          EDUCATION_LEVEL = :1,
          CURRENT_SCHOOL = :2,
          INTERESTS = :3,
          GOALS = :4,
          STRENGTHS = :5,
          SKILLS = :6,
          PERSONALITY_TYPE = :7,
          UPDATED_AT = CURRENT_TIMESTAMP
        WHERE USER_ACCOUNT_ID = :8
      `;
      params = [
        education_level || null,
        current_school || null,
        interests || null,
        goals || null,
        strengths || null,
        skills || null,
        personality_type || null,
        userId
      ];
    } else {
      
      sql = `
        INSERT INTO USER_PROFILES (
          USER_ACCOUNT_ID,
          EDUCATION_LEVEL,
          CURRENT_SCHOOL,
          INTERESTS,
          GOALS,
          STRENGTHS,
          SKILLS,
          PERSONALITY_TYPE,
          CREATED_AT,
          UPDATED_AT
        ) VALUES (:1, :2, :3, :4, :5, :6, :7, :8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
      params = [
        userId,
        education_level || null,
        current_school || null,
        interests || null,
        goals || null,
        strengths || null,
        skills || null,
        personality_type || null
      ];
    }

    await executeQuery(sql, params);

    console.log('✅ Extended profile updated successfully');
    res.json({
      success: true,
      message: 'Profili i zgjeruar u përditësua me sukses'
    });

  } catch (error) {
    console.error('❌ Error updating extended profile:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në përditësimin e profilit të zgjeruar'
    });
  }
};

// CHANGE PASSWORD
const changePassword = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Nuk jeni i autentifikuar'
      });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Fjalëkalimi aktual dhe i ri janë të detyrueshëm'
      });
    }
    
    console.log('🔒 Changing password for user:', userId);

    
    const getCurrentPasswordSql = `SELECT PASSWORDI FROM USERS WHERE ID = :1`;
    const currentResult = await executeQuery(getCurrentPasswordSql, [userId]);
    
    if (!currentResult.rows || currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Përdoruesi nuk u gjet'
      });
    }

    const currentPasswordHash = currentResult.rows[0].PASSWORDI;
    
    // Verify current password
    const bcrypt = require('bcryptjs');
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentPasswordHash);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Fjalëkalimi aktual është i gabuar'
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    const updatePasswordSql = `
      UPDATE USERS 
      SET PASSWORDI = :1, UPDATED_AT = CURRENT_TIMESTAMP 
      WHERE ID = :2
    `;
    await executeQuery(updatePasswordSql, [newPasswordHash, userId]);

    console.log('✅ Password changed successfully');
    res.json({
      success: true,
      message: 'Fjalëkalimi u ndryshua me sukses'
    });

  } catch (error) {
    console.error('❌ Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në ndryshimin e fjalëkalimit'
    });
  }
};

// GET PROFILE COMPLETION
const getProfileCompletion = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Nuk jeni i autentifikuar'
      });
    }
    
    const sql = `
      SELECT 
        u.EMRI,
        u.SURNAME,
        u.EMAILI,
        up.EDUCATION_LEVEL,
        up.CURRENT_SCHOOL,
        up.INTERESTS,
        up.GOALS
      FROM USERS u
      LEFT JOIN USER_PROFILES up ON u.ID = up.USER_ACCOUNT_ID
      WHERE u.ID = :1
    `;

    const result = await executeQuery(sql, [userId]);
    
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Përdoruesi nuk u gjet'
      });
    }

    const row = result.rows[0];
    
    
    const extractClobSync = (clobField) => {
      if (!clobField) return '';
      try {
        if (typeof clobField === 'string') return clobField;
        return String(clobField || '');
      } catch (error) {
        return '';
      }
    };
    
    const requiredFields = [row.EMRI, row.SURNAME, row.EMAILI];
    const optionalFields = [
      row.EDUCATION_LEVEL, 
      row.CURRENT_SCHOOL, 
      extractClobSync(row.INTERESTS), 
      extractClobSync(row.GOALS)
    ];
    
    const filledRequired = requiredFields.filter(field => field && String(field).trim() !== '').length;
    const filledOptional = optionalFields.filter(field => field && String(field).trim() !== '').length;
    
    const requiredCompletion = (filledRequired / requiredFields.length) * 70;
    const optionalCompletion = (filledOptional / optionalFields.length) * 30;
    const completion = Math.round(requiredCompletion + optionalCompletion);

    res.json({
      success: true,
      data: { completion }
    });

  } catch (error) {
    console.error('❌ Error getting profile completion:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në marrjen e plotësimit të profilit'
    });
  }
};

const markProfileCompleted = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Nuk jeni i autentifikuar'
      });
    }
    
    console.log('✅ Marking profile as completed for user:', userId);

    const checkSql = `SELECT PROFILE_ID FROM USER_PROFILES WHERE USER_ACCOUNT_ID = :1`;
    const checkResult = await executeQuery(checkSql, [userId]);
    
    if (checkResult.rows && checkResult.rows.length > 0) {
      const sql = `
        UPDATE USER_PROFILES 
        SET COMPLETED_AT = CURRENT_TIMESTAMP, UPDATED_AT = CURRENT_TIMESTAMP 
        WHERE USER_ACCOUNT_ID = :1
      `;
      await executeQuery(sql, [userId]);
    } else {
      const sql = `
        INSERT INTO USER_PROFILES (
          USER_ACCOUNT_ID,
          COMPLETED_AT,
          CREATED_AT,
          UPDATED_AT
        ) VALUES (:1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
      await executeQuery(sql, [userId]);
    }

    res.json({
      success: true,
      message: 'Profili u shënua si i kompletuar'
    });

  } catch (error) {
    console.error('❌ Error marking profile as completed:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në shënimin e profilit'
    });
  }
};

module.exports = {
  getUserProfile,
  updateBasicProfile,
  updateExtendedProfile,
  changePassword,
  getProfileCompletion,
  markProfileCompleted
};