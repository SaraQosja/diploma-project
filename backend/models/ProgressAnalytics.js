const { executeQuery } = require('../config/database');

class ProgressAnalytics {

  static async getUserProgress(userId) {
    const sql = `
      SELECT 
        u.ID as USER_ID,
        u.EMRI as FIRST_NAME,
        u.SURNAME as LAST_NAME,
        u.CREATED_AT as REGISTERED_DATE,
        
        -- Test Statistics
        COUNT(DISTINCT tr.ID) as TOTAL_TESTS_TAKEN,
        COUNT(DISTINCT CASE WHEN tr.COMPLETED_AT IS NOT NULL THEN tr.ID END) as COMPLETED_TESTS,
        AVG(CASE WHEN tr.COMPLETED_AT IS NOT NULL THEN tr.TOTAL_SCORE END) as AVERAGE_SCORE,
        MAX(tr.COMPLETED_AT) as LAST_TEST_DATE,
        
        -- Chat Statistics
        COUNT(DISTINCT cs.ID) as TOTAL_CHAT_SESSIONS,
        COUNT(DISTINCT CASE WHEN cs.SESSION_STATUS = 'active' THEN cs.ID END) as ACTIVE_CHAT_SESSIONS,
        COUNT(DISTINCT cm.ID) as TOTAL_MESSAGES_SENT,
        MAX(cm.SENT_AT) as LAST_MESSAGE_DATE,
        
        -- Recommendation Statistics
        COUNT(DISTINCT r.ID) as TOTAL_RECOMMENDATIONS,
        COUNT(DISTINCT CASE WHEN r.IS_SAVED = 1 THEN r.ID END) as SAVED_RECOMMENDATIONS,
        MAX(r.CREATED_AT) as LAST_RECOMMENDATION_DATE
        
      FROM users u
      LEFT JOIN test_results tr ON u.ID = tr.USER_ID
      LEFT JOIN chat_sessions cs ON u.ID = cs.USER_ID
      LEFT JOIN chat_messages cm ON cs.ID = cm.SESSION_ID AND cm.SENDER_ID = u.ID
      LEFT JOIN recommendations r ON u.ID = r.USER_ID
      WHERE u.ID = :userId
      GROUP BY u.ID, u.EMRI, u.SURNAME, u.CREATED_AT
    `;

    const result = await executeQuery(sql, { userId });
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        userId: row.USER_ID,
        firstName: row.FIRST_NAME,
        lastName: row.LAST_NAME,
        registeredDate: row.REGISTERED_DATE,
        testStats: {
          totalTaken: row.TOTAL_TESTS_TAKEN,
          completed: row.COMPLETED_TESTS,
          averageScore: row.AVERAGE_SCORE ? parseFloat(row.AVERAGE_SCORE.toFixed(2)) : 0,
          lastTestDate: row.LAST_TEST_DATE,
          completionRate: row.TOTAL_TESTS_TAKEN > 0 ? 
            ((row.COMPLETED_TESTS / row.TOTAL_TESTS_TAKEN) * 100).toFixed(1) : 0
        },
        chatStats: {
          totalSessions: row.TOTAL_CHAT_SESSIONS,
          activeSessions: row.ACTIVE_CHAT_SESSIONS,
          totalMessages: row.TOTAL_MESSAGES_SENT,
          lastMessageDate: row.LAST_MESSAGE_DATE
        },
        recommendationStats: {
          total: row.TOTAL_RECOMMENDATIONS,
          saved: row.SAVED_RECOMMENDATIONS,
          lastDate: row.LAST_RECOMMENDATION_DATE,
          saveRate: row.TOTAL_RECOMMENDATIONS > 0 ? 
            ((row.SAVED_RECOMMENDATIONS / row.TOTAL_RECOMMENDATIONS) * 100).toFixed(1) : 0
        }
      };
    }
    
    return null;
  }


  static async getTestProgress(userId, limit = 10) {
    const sql = `
      SELECT 
        tr.ID,
        t.TITLE as TEST_NAME,
        t.CATEGORY,
        tr.STARTED_AT,
        tr.COMPLETED_AT,
        tr.TOTAL_SCORE,
        tr.MAX_POSSIBLE_SCORE,
        tr.PERCENTAGE_SCORE,
        tr.STATUS,
        (tr.TOTAL_SCORE / tr.MAX_POSSIBLE_SCORE * 100) as CALCULATED_PERCENTAGE
      FROM test_results tr
      JOIN tests t ON tr.TEST_ID = t.ID
      WHERE tr.USER_ID = :userId
      ORDER BY tr.STARTED_AT DESC
      FETCH FIRST :limit ROWS ONLY
    `;

    const result = await executeQuery(sql, { userId, limit });
    
    return result.rows.map(row => ({
      id: row.ID,
      testName: row.TEST_NAME,
      category: row.CATEGORY,
      startedAt: row.STARTED_AT,
      completedAt: row.COMPLETED_AT,
      score: row.TOTAL_SCORE,
      maxScore: row.MAX_POSSIBLE_SCORE,
      percentage: row.PERCENTAGE_SCORE || row.CALCULATED_PERCENTAGE,
      status: row.STATUS,
      duration: row.COMPLETED_AT && row.STARTED_AT ? 
        Math.round((new Date(row.COMPLETED_AT) - new Date(row.STARTED_AT)) / (1000 * 60)) : null
    }));
  }

  static async getLearningPathProgress(userId) {
    const sql = `
      SELECT 
        t.CATEGORY,
        COUNT(*) as TOTAL_TESTS,
        COUNT(CASE WHEN tr.COMPLETED_AT IS NOT NULL THEN 1 END) as COMPLETED_TESTS,
        AVG(CASE WHEN tr.COMPLETED_AT IS NOT NULL THEN tr.TOTAL_SCORE END) as AVG_SCORE,
        MAX(tr.COMPLETED_AT) as LAST_ACTIVITY
      FROM tests t
      LEFT JOIN test_results tr ON t.ID = tr.TEST_ID AND tr.USER_ID = :userId
      GROUP BY t.CATEGORY
      ORDER BY t.CATEGORY
    `;

    const result = await executeQuery(sql, { userId });
    
    return result.rows.map(row => ({
      category: row.CATEGORY,
      totalTests: row.TOTAL_TESTS,
      completedTests: row.COMPLETED_TESTS,
      averageScore: row.AVG_SCORE ? parseFloat(row.AVG_SCORE.toFixed(2)) : 0,
      completionRate: row.TOTAL_TESTS > 0 ? 
        ((row.COMPLETED_TESTS / row.TOTAL_TESTS) * 100).toFixed(1) : 0,
      lastActivity: row.LAST_ACTIVITY,
      status: this.getPathStatus(row.COMPLETED_TESTS, row.TOTAL_TESTS)
    }));
  }

  static async getActivityTimeline(userId, days = 30) {
    const sql = `
      SELECT 
        activity_date,
        activity_type,
        COUNT(*) as activity_count,
        details
      FROM (
        SELECT 
          TO_CHAR(tr.STARTED_AT, 'YYYY-MM-DD') as activity_date,
          'test' as activity_type,
          t.TITLE as details
        FROM test_results tr
        JOIN tests t ON tr.TEST_ID = t.ID
        WHERE tr.USER_ID = :userId
          AND tr.STARTED_AT >= CURRENT_DATE - :days
        
        UNION ALL
        
        SELECT 
          TO_CHAR(cm.SENT_AT, 'YYYY-MM-DD') as activity_date,
          'message' as activity_type,
          'Chat Message' as details
        FROM chat_messages cm
        JOIN chat_sessions cs ON cm.SESSION_ID = cs.ID
        WHERE cs.USER_ID = :userId
          AND cm.SENT_AT >= CURRENT_DATE - :days
        
        UNION ALL
        
        SELECT 
          TO_CHAR(r.CREATED_AT, 'YYYY-MM-DD') as activity_date,
          'recommendation' as activity_type,
          'New Recommendation' as details
        FROM recommendations r
        WHERE r.USER_ID = :userId
          AND r.CREATED_AT >= CURRENT_DATE - :days
      )
      GROUP BY activity_date, activity_type, details
      ORDER BY activity_date DESC
    `;

    const result = await executeQuery(sql, { userId, days });
    
    const timelineMap = {};
    result.rows.forEach(row => {
      const date = row.ACTIVITY_DATE;
      if (!timelineMap[date]) {
        timelineMap[date] = {
          date,
          activities: []
        };
      }
      timelineMap[date].activities.push({
        type: row.ACTIVITY_TYPE,
        count: row.ACTIVITY_COUNT,
        details: row.DETAILS
      });
    });

    return Object.values(timelineMap).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  static async getPerformanceTrends(userId, months = 6) {
    const sql = `
      SELECT 
        TO_CHAR(tr.COMPLETED_AT, 'YYYY-MM') as month,
        COUNT(*) as tests_completed,
        AVG(tr.TOTAL_SCORE) as avg_score,
        AVG(tr.PERCENTAGE_SCORE) as avg_percentage
      FROM test_results tr
      WHERE tr.USER_ID = :userId
        AND tr.COMPLETED_AT IS NOT NULL
        AND tr.COMPLETED_AT >= ADD_MONTHS(CURRENT_DATE, -:months)
      GROUP BY TO_CHAR(tr.COMPLETED_AT, 'YYYY-MM')
      ORDER BY month
    `;

    const result = await executeQuery(sql, { userId, months });
    
    return result.rows.map(row => ({
      month: row.MONTH,
      testsCompleted: row.TESTS_COMPLETED,
      averageScore: row.AVG_SCORE ? parseFloat(row.AVG_SCORE.toFixed(2)) : 0,
      averagePercentage: row.AVG_PERCENTAGE ? parseFloat(row.AVG_PERCENTAGE.toFixed(1)) : 0
    }));
  }


  static async getAchievements(userId) {
    const achievements = [];
    
 
    const statsResult = await this.getUserProgress(userId);
    if (!statsResult) return achievements;

    const { testStats, chatStats, recommendationStats } = statsResult;

    if (testStats.completed >= 1) {
      achievements.push({
        id: 'first_test',
        title: 'Testi i Parë',
        description: 'Keni përfunduar testin tuaj të parë!',
        type: 'test',
        earnedAt: statsResult.testStats.lastTestDate,
        icon: '🎯'
      });
    }

    if (testStats.completed >= 5) {
      achievements.push({
        id: 'test_explorer',
        title: 'Eksplorues Testesh',
        description: 'Keni përfunduar 5 teste!',
        type: 'test',
        earnedAt: statsResult.testStats.lastTestDate,
        icon: '🔍'
      });
    }

    if (testStats.averageScore >= 80) {
      achievements.push({
        id: 'high_performer',
        title: 'Performues i Lartë',
        description: 'Mesatarja juaj është mbi 80%!',
        type: 'performance',
        earnedAt: statsResult.testStats.lastTestDate,
        icon: '⭐'
      });
    }

  
    if (chatStats.totalSessions >= 1) {
      achievements.push({
        id: 'first_chat',
        title: 'Biseda e Parë',
        description: 'Keni filluar bisedën tuaj të parë!',
        type: 'communication',
        earnedAt: statsResult.chatStats.lastMessageDate,
        icon: '💬'
      });
    }

    if (chatStats.totalMessages >= 50) {
      achievements.push({
        id: 'communicator',
        title: 'Komunikues Aktiv',
        description: 'Keni dërguar 50 mesazhe!',
        type: 'communication',
        earnedAt: statsResult.chatStats.lastMessageDate,
        icon: '🗣️'
      });
    }

   
    if (recommendationStats.total >= 1) {
      achievements.push({
        id: 'first_recommendation',
        title: 'Rekomandimi i Parë',
        description: 'Keni marrë rekomandimin tuaj të parë!',
        type: 'guidance',
        earnedAt: statsResult.recommendationStats.lastDate,
        icon: '🎓'
      });
    }

    return achievements.sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt));
  }

  static async getPeerComparison(userId) {
    const sql = `
      WITH user_stats AS (
        SELECT 
          u.ID,
          COUNT(DISTINCT tr.ID) as tests_taken,
          AVG(CASE WHEN tr.COMPLETED_AT IS NOT NULL THEN tr.TOTAL_SCORE END) as avg_score,
          COUNT(DISTINCT cs.ID) as chat_sessions
        FROM users u
        LEFT JOIN test_results tr ON u.ID = tr.USER_ID
        LEFT JOIN chat_sessions cs ON u.ID = cs.USER_ID
        WHERE u.ROLI = 'nxenes'
        GROUP BY u.ID
      ),
      percentiles AS (
        SELECT 
          PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY tests_taken) as tests_q1,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY tests_taken) as tests_median,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY tests_taken) as tests_q3,
          PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY avg_score) as score_q1,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY avg_score) as score_median,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY avg_score) as score_q3
        FROM user_stats
        WHERE tests_taken > 0
      )
      SELECT 
        us.tests_taken as user_tests,
        us.avg_score as user_avg_score,
        p.tests_median,
        p.tests_q1,
        p.tests_q3,
        p.score_median,
        p.score_q1,
        p.score_q3,
        (SELECT COUNT(*) FROM user_stats WHERE tests_taken < us.tests_taken) as better_than_count,
        (SELECT COUNT(*) FROM user_stats WHERE tests_taken > 0) as total_active_users
      FROM user_stats us
      CROSS JOIN percentiles p
      WHERE us.ID = :userId
    `;

    const result = await executeQuery(sql, { userId });
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        userTests: row.USER_TESTS,
        userAvgScore: row.USER_AVG_SCORE ? parseFloat(row.USER_AVG_SCORE.toFixed(2)) : 0,
        benchmarks: {
          testsMedian: row.TESTS_MEDIAN,
          testsQ1: row.TESTS_Q1,
          testsQ3: row.TESTS_Q3,
          scoreMedian: row.SCORE_MEDIAN ? parseFloat(row.SCORE_MEDIAN.toFixed(2)) : 0,
          scoreQ1: row.SCORE_Q1 ? parseFloat(row.SCORE_Q1.toFixed(2)) : 0,
          scoreQ3: row.SCORE_Q3 ? parseFloat(row.SCORE_Q3.toFixed(2)) : 0
        },
        ranking: {
          betterThan: row.BETTER_THAN_COUNT,
          totalUsers: row.TOTAL_ACTIVE_USERS,
          percentile: row.TOTAL_ACTIVE_USERS > 0 ? 
            Math.round((row.BETTER_THAN_COUNT / row.TOTAL_ACTIVE_USERS) * 100) : 0
        }
      };
    }
    
    return null;
  }

  static getPathStatus(completed, total) {
    if (total === 0) return 'not_started';
    const percentage = (completed / total) * 100;
    
    if (percentage === 0) return 'not_started';
    if (percentage < 30) return 'beginner';
    if (percentage < 70) return 'intermediate';
    if (percentage < 100) return 'advanced';
    return 'completed';
  }


  static async getWeeklyActivity(userId) {
    const sql = `
      SELECT 
        TO_CHAR(CURRENT_DATE - LEVEL + 1, 'Day') as day_name,
        TO_CHAR(CURRENT_DATE - LEVEL + 1, 'YYYY-MM-DD') as date,
        COALESCE(activity.test_count, 0) as tests,
        COALESCE(activity.message_count, 0) as messages
      FROM dual
      CONNECT BY LEVEL <= 7
      LEFT JOIN (
        SELECT 
          TO_CHAR(activity_date, 'YYYY-MM-DD') as date,
          SUM(CASE WHEN activity_type = 'test' THEN 1 ELSE 0 END) as test_count,
          SUM(CASE WHEN activity_type = 'message' THEN 1 ELSE 0 END) as message_count
        FROM (
          SELECT TO_DATE(TO_CHAR(tr.STARTED_AT, 'YYYY-MM-DD'), 'YYYY-MM-DD') as activity_date, 'test' as activity_type
          FROM test_results tr WHERE tr.USER_ID = :userId AND tr.STARTED_AT >= CURRENT_DATE - 6
          UNION ALL
          SELECT TO_DATE(TO_CHAR(cm.SENT_AT, 'YYYY-MM-DD'), 'YYYY-MM-DD') as activity_date, 'message' as activity_type
          FROM chat_messages cm JOIN chat_sessions cs ON cm.SESSION_ID = cs.ID 
          WHERE cs.USER_ID = :userId AND cm.SENT_AT >= CURRENT_DATE - 6
        )
        GROUP BY activity_date
      ) activity ON activity.date = TO_CHAR(CURRENT_DATE - LEVEL + 1, 'YYYY-MM-DD')
      ORDER BY CURRENT_DATE - LEVEL + 1
    `;

    const result = await executeQuery(sql, { userId });
    
    return result.rows.map(row => ({
      day: row.DAY_NAME.trim(),
      date: row.DATE,
      tests: row.TESTS,
      messages: row.MESSAGES,
      totalActivity: row.TESTS + row.MESSAGES
    }));
  }
}

module.exports = ProgressAnalytics;