// backend/models/Recommendation.js
const { executeQuery } = require('../config/database');
const RecommendationAlgorithm = require('../utils/recommendationAlgorithm');

class Recommendation {
  

  static async generateCareerRecommendations(userId, testResults) {
    try {
      console.log('🤖 Generating recommendations for user:', userId);
      
      if (!testResults || testResults.length === 0) {
        return this.getDefaultRecommendations();
      }

      const userProfile = RecommendationAlgorithm.analyzeUserProfile(testResults);
      
      const careers = await this.getAllCareers();
    
      const recommendations = RecommendationAlgorithm.calculateCareerMatches(userProfile, careers);
      
      const topRecommendations = recommendations
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 12);

      console.log(`✅ Generated ${topRecommendations.length} recommendations`);
      return topRecommendations;

    } catch (error) {
      console.error('❌ Error generating recommendations:', error);
      return this.getDefaultRecommendations();
    }
  }

  static async getAllCareers() {
    try {
      const sql = `
        SELECT 
          CAREER_ID,
          CAREER_NAME,
          CAREER_DESCRIPTION,
          CATEGORY,
          REQUIRED_EDUCATION,
          AVERAGE_SALARY,
          JOB_OUTLOOK,
          SKILLS_REQUIRED,
          CREATED_AT
        FROM CAREERS
        WHERE IS_ACTIVE = 1
        ORDER BY CAREER_NAME
      `;

      const result = await executeQuery(sql);
      
      if (result.rows && result.rows.length > 0) {
        
        const processedCareers = [];
        for (const career of result.rows) {
          const processedCareer = {
            CAREER_ID: career.CAREER_ID,
            CAREER_NAME: String(career.CAREER_NAME || 'Unknown Career'),
            DESCRIPTION: String(career.CAREER_DESCRIPTION || 'No description available'),
            CATEGORY: String(career.CATEGORY || 'General'),
            EDUCATION_REQUIRED: String(career.REQUIRED_EDUCATION || 'Not specified'),
            SALARY_RANGE: career.AVERAGE_SALARY ? `${career.AVERAGE_SALARY}` : 'Not specified',
            GROWTH_OUTLOOK: String(career.JOB_OUTLOOK || 'Average'),
            WORK_ENVIRONMENT: 'Office', 
            KEY_SKILLS: String(career.SKILLS_REQUIRED || 'Various skills required'),
            CREATED_AT: career.CREATED_AT
          };
          processedCareers.push(processedCareer);
        }
        return processedCareers;
      } else {
        console.log('📝 No careers in database, using defaults');
        return this.getDefaultCareers();
      }
    } catch (error) {
      console.error('Error fetching careers:', error);
      return this.getDefaultCareers();
    }
  }


  static getDefaultCareers() {
    return RecommendationAlgorithm.getDefaultCareers();
  }

  static getDefaultRecommendations() {
    return [
      {
        id: 1,
        title: 'Complete Career Assessment',
        description: 'Take our comprehensive career assessment to get personalized recommendations',
        category: 'Getting Started',
        matchScore: 100,
        matchReason: 'Start your career discovery journey',
        type: 'action'
      },
      {
        id: 2,
        title: 'Explore Career Categories',
        description: 'Browse different career fields to discover what interests you',
        category: 'Exploration',
        matchScore: 90,
        matchReason: 'Learn about various career options',
        type: 'action'
      }
    ];
  }

  static async saveRecommendation(userId, recommendationData) {
    try {
      const sql = `
        INSERT INTO RECOMMENDATIONS (
          USER_ACCOUNT_ID, RECOMMENDATION_TYPE, ITEM_ID, 
          MATCH_SCORE, MATCH_REASON, RANKING, 
          IS_BOOKMARKED, GENERATED_AT
        ) VALUES (:1, :2, :3, :4, :5, :6, 1, SYSTIMESTAMP)
      `;

      const params = [
        userId,
        recommendationData.type,
        recommendationData.itemId,
        recommendationData.matchScore,
        recommendationData.matchReason,
        recommendationData.ranking
      ];

      await executeQuery(sql, params);
      return true;
    } catch (error) {
      console.error('Error saving recommendation:', error);
      throw error;
    }
  }


  static async getUserRecommendations(userId, type = null) {
    try {
      let sql = `
        SELECT 
          r.RECOMMENDATION_ID,
          r.RECOMMENDATION_TYPE,
          r.ITEM_ID,
          r.MATCH_SCORE,
          r.MATCH_REASON,
          r.RANKING,
          r.IS_BOOKMARKED,
          r.VIEW_COUNT,
          r.GENERATED_AT,
          c.CAREER_NAME as TITLE,
          c.DESCRIPTION
        FROM RECOMMENDATIONS r
        LEFT JOIN CAREERS c ON r.ITEM_ID = c.CAREER_ID
        WHERE r.USER_ACCOUNT_ID = :1
      `;

      const params = [userId];

      if (type) {
        sql += ` AND r.RECOMMENDATION_TYPE = :2`;
        params.push(type);
      }

      sql += ` ORDER BY r.MATCH_SCORE DESC, r.GENERATED_AT DESC`;

      const result = await executeQuery(sql, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting user recommendations:', error);
      return [];
    }
  }
}

module.exports = Recommendation;