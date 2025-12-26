// backend/controllers/userController.js
const { validationResult } = require('express-validator');
const { executeQuery } = require('../config/database');


const getAllUsers = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Të dhëna të pavlefshme',
        errors: errors.array()
      });
    }

    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      role = 'all', 
      status = 'all' 
    } = req.query;

    console.log('👥 Getting all users with filters:', { search, role, status, page, limit });

    let sql = `
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
        COUNT(tr.ID) as TESTS_COMPLETED,
        COUNT(DISTINCT cs.ID) as CHAT_SESSIONS,
        MAX(tr.COMPLETED_AT) as LAST_TEST_DATE
      FROM USERS u
      LEFT JOIN TEST_RESULTS tr ON u.ID = tr.USER_ID
      LEFT JOIN CHAT_SESSIONS cs ON (u.ID = cs.STUDENT_ID OR u.ID = cs.COUNSELOR_ID)
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    
    if (search) {
      sql += ` AND (LOWER(u.EMRI) LIKE :${paramIndex} OR LOWER(u.MBIEMRI) LIKE :${paramIndex} OR LOWER(u.EMAIL) LIKE :${paramIndex})`;
      params[paramIndex - 1] = `%${search.toLowerCase()}%`;
      paramIndex++;
    }


    if (role && role !== 'all') {
      sql += ` AND u.ROLI = :${paramIndex}`;
      params[paramIndex - 1] = role;
      paramIndex++;
    }

  
    if (status && status !== 'all') {
      sql += ` AND u.STATUSI = :${paramIndex}`;
      params[paramIndex - 1] = status;
      paramIndex++;
    }

    sql += `
      GROUP BY u.ID, u.EMRI, u.MBIEMRI, u.EMAIL, u.TELEFONI, u.DITELINDJA, u.ROLI, u.STATUSI, u.CREATED_AT, u.UPDATED_AT
      ORDER BY u.CREATED_AT DESC
    `;

    const result = await executeQuery(sql, params);

 
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = result.rows.slice(startIndex, endIndex);

    const response = {
      success: true,
      data: {
        users: paginatedUsers.map(user => ({
          id: user.ID,
          emri: user.EMRI,
          mbiemri: user.MBIEMRI,
          email: user.EMAIL,
          telefoni: user.TELEFONI,
          ditelindja: user.DITELINDJA,
          roli: user.ROLI,
          statusi: user.STATUSI,
          created_at: user.CREATED_AT,
          updated_at: user.UPDATED_AT,
          stats: {
            testsCompleted: user.TESTS_COMPLETED || 0,
            chatSessions: user.CHAT_SESSIONS || 0,
            lastTestDate: user.LAST_TEST_DATE
          }
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(result.rows.length / limit),
          totalUsers: result.rows.length,
          limit: parseInt(limit)
        }
      }
    };

    console.log(`✅ Retrieved ${paginatedUsers.length} users (${result.rows.length} total)`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në marrjen e përdoruesve',
      error: error.message
    });
  }
};


const getUserById = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'ID e pavlefshme',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    console.log('👤 Getting user by ID:', userId);

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
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Përdoruesi nuk u gjet'
      });
    }

    const user = result.rows[0];

    const response = {
      success: true,
      data: {
        id: user.ID,
        emri: user.EMRI,
        mbiemri: user.MBIEMRI,
        email: user.EMAIL,
        telefoni: user.TELEFONI,
        ditelindja: user.DITELINDJA,
        roli: user.ROLI,
        statusi: user.STATUSI,
        created_at: user.CREATED_AT,
        updated_at: user.UPDATED_AT,
        profile: {
          bio: user.BIO,
          photo_url: user.PHOTO_URL,
          gjinia: user.GJINIA,
          qyteti: user.QYTETI,
          adresa: user.ADRESA,
          shkolla_aktuale: user.SHKOLLA_AKTUALE,
          klasa: user.KLASA,
          interesa: user.INTERESA ? JSON.parse(user.INTERESA) : [],
          aftesi: user.AFTESI ? JSON.parse(user.AFTESI) : [],
          qellimet_karrieres: user.QELLIMET_KARRIERES,
          linkedin_url: user.LINKEDIN_URL,
          github_url: user.GITHUB_URL,
          portfolio_url: user.PORTFOLIO_URL
        }
      }
    };

    console.log('✅ User retrieved successfully');
    res.json(response);

  } catch (error) {
    console.error('❌ Error getting user:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në marrjen e përdoruesit',
      error: error.message
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Të dhëna të pavlefshme',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const updateData = req.body;
    
    console.log('👤 Updating user:', userId);

    // Check if user exists
    const existingUser = await executeQuery('SELECT ID FROM USERS WHERE ID = :1', [userId]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Përdoruesi nuk u gjet'
      });
    }

    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    if (updateData.emri) {
      updateFields.push(`EMRI = :${paramIndex}`);
      params[paramIndex - 1] = updateData.emri;
      paramIndex++;
    }

    if (updateData.mbiemri) {
      updateFields.push(`MBIEMRI = :${paramIndex}`);
      params[paramIndex - 1] = updateData.mbiemri;
      paramIndex++;
    }

    if (updateData.email) {
      
      const emailCheck = await executeQuery(
        'SELECT ID FROM USERS WHERE EMAIL = :1 AND ID != :2',
        [updateData.email, userId]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email-i është në përdorim nga një përdorues tjetër'
        });
      }

      updateFields.push(`EMAIL = :${paramIndex}`);
      params[paramIndex - 1] = updateData.email;
      paramIndex++;
    }

    if (updateData.telefoni !== undefined) {
      updateFields.push(`TELEFONI = :${paramIndex}`);
      params[paramIndex - 1] = updateData.telefoni || null;
      paramIndex++;
    }

    if (updateData.roli) {
      updateFields.push(`ROLI = :${paramIndex}`);
      params[paramIndex - 1] = updateData.roli;
      paramIndex++;
    }

    if (updateData.statusi) {
      updateFields.push(`STATUSI = :${paramIndex}`);
      params[paramIndex - 1] = updateData.statusi;
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Asnjë fushë për përditësim nuk u specifikua'
      });
    }

   
    updateFields.push(`UPDATED_AT = SYSDATE`);
    params[paramIndex - 1] = userId;

    const updateSql = `
      UPDATE USERS 
      SET ${updateFields.join(', ')}
      WHERE ID = :${paramIndex}
    `;

    await executeQuery(updateSql, params);

    const response = {
      success: true,
      message: 'Përdoruesi u përditësua me sukses'
    };

    console.log('✅ User updated successfully');
    res.json(response);

  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në përditësimin e përdoruesit',
      error: error.message
    });
  }
};


const deleteUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'ID e pavlefshme',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    console.log('👤 Deleting user:', userId);

    const existingUser = await executeQuery('SELECT ID FROM USERS WHERE ID = :1', [userId]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Përdoruesi nuk u gjet'
      });
    }

    if (req.user.userId === parseInt(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Nuk mund të fshini llogarinë tuaj'
      });
    }

    const deleteRelatedSql = [
      'DELETE FROM CHAT_MESSAGES WHERE SESSION_ID IN (SELECT ID FROM CHAT_SESSIONS WHERE STUDENT_ID = :1 OR COUNSELOR_ID = :1)',
      'DELETE FROM CHAT_SESSIONS WHERE STUDENT_ID = :1 OR COUNSELOR_ID = :1',
      'DELETE FROM TEST_RESULTS WHERE USER_ID = :1',
      'DELETE FROM RECOMMENDATIONS WHERE USER_ID = :1',
      'DELETE FROM SAVED_RECOMMENDATIONS WHERE USER_ID = :1',
      'DELETE FROM USER_PROFILES WHERE USER_ID = :1'
    ];

    for (const sql of deleteRelatedSql) {
      await executeQuery(sql, [userId]);
    }

   
    await executeQuery('DELETE FROM USERS WHERE ID = :1', [userId]);

    const response = {
      success: true,
      message: 'Përdoruesi u fshi me sukses'
    };

    console.log('✅ User deleted successfully');
    res.json(response);

  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në fshirjen e përdoruesit',
      error: error.message
    });
  }
};


const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📊 Getting user stats for:', userId);

    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM TEST_RESULTS WHERE USER_ID = :1) as TESTS_COMPLETED,
        (SELECT COUNT(*) FROM CHAT_SESSIONS WHERE STUDENT_ID = :1 OR COUNSELOR_ID = :1) as CHAT_SESSIONS,
        (SELECT COUNT(*) FROM RECOMMENDATIONS WHERE USER_ID = :1) as RECOMMENDATIONS_RECEIVED,
        (SELECT COUNT(*) FROM SAVED_RECOMMENDATIONS sr JOIN RECOMMENDATIONS r ON sr.RECOMMENDATION_ID = r.ID WHERE r.USER_ID = :1) as SAVED_RECOMMENDATIONS,
        (SELECT AVG(SCORE) FROM TEST_RESULTS WHERE USER_ID = :1 AND SCORE IS NOT NULL) as AVG_TEST_SCORE,
        (SELECT MAX(COMPLETED_AT) FROM TEST_RESULTS WHERE USER_ID = :1) as LAST_TEST_DATE,
        (SELECT MAX(CREATED_AT) FROM CHAT_MESSAGES cm JOIN CHAT_SESSIONS cs ON cm.SESSION_ID = cs.ID WHERE cs.STUDENT_ID = :1 OR cs.COUNSELOR_ID = :1) as LAST_CHAT_DATE
      FROM DUAL
    `;

    const result = await executeQuery(sql, [userId, userId, userId, userId, userId, userId, userId]);
    const stats = result.rows[0];

    const response = {
      success: true,
      data: {
        testsCompleted: stats.TESTS_COMPLETED || 0,
        chatSessions: stats.CHAT_SESSIONS || 0,
        recommendationsReceived: stats.RECOMMENDATIONS_RECEIVED || 0,
        savedRecommendations: stats.SAVED_RECOMMENDATIONS || 0,
        avgTestScore: stats.AVG_TEST_SCORE ? parseFloat(stats.AVG_TEST_SCORE).toFixed(2) : null,
        lastTestDate: stats.LAST_TEST_DATE,
        lastChatDate: stats.LAST_CHAT_DATE
      }
    };

    console.log('✅ User stats retrieved successfully');
    res.json(response);

  } catch (error) {
    console.error('❌ Error getting user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në marrjen e statistikave të përdoruesit',
      error: error.message
    });
  }
};


const getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    
    console.log('📅 Getting user activity for:', userId, 'days:', days);

    const sql = `
      SELECT 
        activity_date,
        activity_type,
        COUNT(*) as count,
        MAX(details) as sample_details
      FROM (
        SELECT 
          TRUNC(tr.COMPLETED_AT) as activity_date,
          'test_completion' as activity_type,
          t.TITLE as details
        FROM TEST_RESULTS tr
        JOIN TESTS t ON tr.TEST_ID = t.ID
        WHERE tr.USER_ID = :1 AND tr.COMPLETED_AT >= SYSDATE - :2
        
        UNION ALL
        
        SELECT 
          TRUNC(cm.CREATED_AT) as activity_date,
          'chat_message' as activity_type,
          'Chat message' as details
        FROM CHAT_MESSAGES cm
        JOIN CHAT_SESSIONS cs ON cm.SESSION_ID = cs.ID
        WHERE (cs.STUDENT_ID = :1 OR cs.COUNSELOR_ID = :1) 
          AND cm.CREATED_AT >= SYSDATE - :2
        
        UNION ALL
        
        SELECT 
          TRUNC(r.CREATED_AT) as activity_date,
          'recommendation_received' as activity_type,
          r.TITLE as details
        FROM RECOMMENDATIONS r
        WHERE r.USER_ID = :1 AND r.CREATED_AT >= SYSDATE - :2
      )
      GROUP BY activity_date, activity_type
      ORDER BY activity_date DESC, activity_type
    `;

    const result = await executeQuery(sql, [userId, days, userId, days, userId, days]);

    const response = {
      success: true,
      data: {
        activities: result.rows.map(row => ({
          date: row.ACTIVITY_DATE,
          type: row.ACTIVITY_TYPE,
          count: row.COUNT,
          sampleDetails: row.SAMPLE_DETAILS
        })),
        summary: calculateActivitySummary(result.rows)
      }
    };

    console.log(`✅ Retrieved ${result.rows.length} activity records`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error getting user activity:', error);
    res.status(500).json({
      success: false,
      message: 'Gabim në marrjen e aktivitetit të përdoruesit',
      error: error.message
    });
  }
};

const calculateActivitySummary = (activities) => {
  const summary = {
    totalActivities: 0,
    testCompletions: 0,
    chatMessages: 0,
    recommendationsReceived: 0,
    mostActiveDay: null,
    activeDays: 0
  };

  const dailyTotals = {};

  activities.forEach(activity => {
    summary.totalActivities += activity.COUNT;
    
    switch (activity.ACTIVITY_TYPE) {
      case 'test_completion':
        summary.testCompletions += activity.COUNT;
        break;
      case 'chat_message':
        summary.chatMessages += activity.COUNT;
        break;
      case 'recommendation_received':
        summary.recommendationsReceived += activity.COUNT;
        break;
    }

    const dateKey = activity.ACTIVITY_DATE.toISOString().split('T')[0];
    if (!dailyTotals[dateKey]) {
      dailyTotals[dateKey] = 0;
    }
    dailyTotals[dateKey] += activity.COUNT;
  });

  
  summary.activeDays = Object.keys(dailyTotals).length;
  if (summary.activeDays > 0) {
    const mostActiveEntry = Object.entries(dailyTotals)
      .sort(([,a], [,b]) => b - a)[0];
    summary.mostActiveDay = {
      date: mostActiveEntry[0],
      activities: mostActiveEntry[1]
    };
  }

  return summary;
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  getUserActivity
};