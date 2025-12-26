// frontend/src/services/recommendationService.js 
import api from './api';
import BackendResponseHandler from '../utils/backendResponseHandler';

class RecommendationService {
  
  async getSmartRecommendations(type = 'all', source = 'auto') {
    try {
      console.log('Calling getSmartRecommendations with:', { type, source });
      
      const response = await api.get('/recommendations', {
        params: { type, source }
      });
      
      console.log('Raw API response:', response);
      console.log('Response data:', response.data);
      
      if (response.data && response.data.success) {
        console.log('API success, processing data...');
        
        const transformed = BackendResponseHandler.transformRecommendationsResponse(response.data);
        console.log('Transformed data:', transformed);
        return transformed;
      } else {
        console.warn('API returned unsuccessful response:', response.data);
        
        return {
          success: false,
          data: {
            career: [],
            university: []
          },
          meta: {
            totalCareer: 0,
            totalUniversity: 0,
            message: response.data?.message || 'No recommendations available'
          },
          career: [],
          university: []
        };
      }
    } catch (error) {
      console.error('Error fetching smart recommendations:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      throw new Error(error.response?.data?.message || error.message || 'Gabim në marrjen e rekomandimeve');
    }
  }

  async getCareerRecommendations() {
    try {
      console.log('Fetching career recommendations...');
      
      const response = await api.get('/recommendations/career');
      console.log('Career response:', response.data);
      
      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data.map(career => BackendResponseHandler.transformCareerRecommendation(career))
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching career recommendations:', error);
      throw new Error(error.response?.data?.message || 'Gabim në marrjen e rekomandimeve të karrierës');
    }
  }

  async getUniversityRecommendations(source = 'both', preferences = {}) {
    try {
      console.log('Fetching university recommendations with:', { source, preferences });
      
      let response;
      
      if (Object.keys(preferences).length > 0) {
        response = await api.post('/recommendations/university', {
          source,
          ...preferences
        });
      } else {
        response = await api.get('/recommendations/university', {
          params: { source }
        });
      }
      
      console.log('University response:', response.data);
      
      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data.map(university => BackendResponseHandler.transformUniversityRecommendation(university))
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching university recommendations:', error);
      throw new Error(error.response?.data?.message || 'Gabim në marrjen e rekomandimeve të universiteteve');
    }
  }

  async regenerateAllRecommendations() {
    try {
      console.log('Regenerating all recommendations...');
      
      const response = await api.post('/recommendations/regenerate');
      console.log('Regenerate response:', response.data);
      
      return BackendResponseHandler.transformRecommendationsResponse(response.data);
    } catch (error) {
      console.error('Error regenerating recommendations:', error);
      throw new Error(error.response?.data?.message || 'Gabim në gjenerimin e rekomandimeve të reja');
    }
  }

  async getRecommendationStats() {
    try {
      console.log('Fetching recommendation stats...');
      
      const response = await api.get('/recommendations/stats');
      console.log('Stats response:', response.data);
      
      if (response.data) {
        return BackendResponseHandler.transformRecommendationStats(response.data);
      } else {
        console.warn('No stats data received');
        return null;
      }
    } catch (error) {
      console.error('Error fetching recommendation stats:', error);
      
      try {
        console.log('Trying main recommendations endpoint as fallback...');
        const mainResponse = await api.get('/recommendations?type=all&source=auto');
        
        if (mainResponse.data && mainResponse.data.success) {
          return {
            success: true,
            data: {
              capabilities: {
                careerRecommendations: (mainResponse.data.meta?.totalCareer || 0) > 0,
                universityRecommendations: (mainResponse.data.meta?.totalUniversity || 0) > 0,
                fullRecommendations: (mainResponse.data.meta?.totalRecommendations || 0) > 0
              },
              testResults: {
                completed: mainResponse.data.meta?.testResultsCount || 0
              },
              grades: {
                entered: mainResponse.data.meta?.gradesCount || 0
              }
            }
          };
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
      
      return null;
    }
  }

  async checkUserReadiness() {
    try {
      console.log('Checking user readiness...');
      
      const stats = await this.getRecommendationStats();
      console.log('Stats received:', stats);
      
      if (stats && stats.success) {
        return {
          ready: stats.data?.capabilities?.careerRecommendations || false,
          readyForUniversity: stats.data?.capabilities?.universityRecommendations || false,
          readyForComplete: stats.data?.capabilities?.fullRecommendations || false,
          completedTests: stats.data?.testResults?.completed || 0,
          hasGrades: stats.data?.grades?.entered > 0 || false,
          stats: stats.data
        };
      } else {
        console.warn('Stats not available, trying alternative check...');
        
        try {
          const testRecs = await this.getSmartRecommendations('all', 'auto');
          const hasData = testRecs && testRecs.success && (
            (testRecs.data?.career && testRecs.data.career.length > 0) ||
            (testRecs.data?.university && testRecs.data.university.length > 0)
          );
          
          return {
            ready: hasData,
            readyForUniversity: hasData,
            readyForComplete: hasData,
            completedTests: hasData ? 3 : 0,
            hasGrades: hasData,
            stats: null
          };
        } catch (recError) {
          console.error('Alternative check failed:', recError);
          return {
            ready: false,
            readyForUniversity: false,
            readyForComplete: false,
            completedTests: 0,
            hasGrades: false
          };
        }
      }
    } catch (error) {
      console.error('Error checking user readiness:', error);
      return {
        ready: false,
        readyForUniversity: false,
        readyForComplete: false,
        completedTests: 0,
        hasGrades: false
      };
    }
  }

  async getUserGrades() {
    try {
      const response = await api.get('/grades');
      return response.data;
    } catch (error) {
      console.error('Error fetching user grades:', error);
      return { success: false, data: [] };
    }
  }

  async saveUserGrades(grades) {
    try {
      const response = await api.post('/grades', { grades });
      return response.data;
    } catch (error) {
      console.error('Error saving user grades:', error);
      throw new Error(error.response?.data?.message || 'Gabim në ruajtjen e notave');
    }
  }

  getMatchScoreInterpretation(score) {
    return BackendResponseHandler.getMatchScoreInterpretation(score);
  }

  formatRecommendation(recommendation) {
    const matchInfo = this.getMatchScoreInterpretation(recommendation.matchScore || 0);
    
    return {
      ...recommendation,
      matchInfo,
      formattedMatchScore: `${recommendation.matchScore || 0}%`,
      displayType: recommendation.type === 'career' ? 'Karrierë' : 'Universitet',
      icon: recommendation.type === 'career' ? '💼' : '🎓'
    };
  }

  filterRecommendations(recommendations, filters = {}) {
    let filtered = [...recommendations];

    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(rec => rec.type === filters.type);
    }

    if (filters.minMatchScore) {
      filtered = filtered.filter(rec => (rec.matchScore || 0) >= filters.minMatchScore);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(rec => 
        rec.title?.toLowerCase().includes(term) ||
        rec.description?.toLowerCase().includes(term) ||
        rec.category?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  sortRecommendations(recommendations, sortBy = 'match') {
    const sorted = [...recommendations];

    switch (sortBy) {
      case 'match':
        return sorted.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      
      case 'title':
        return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      
      case 'type':
        return sorted.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
      
      default:
        return sorted;
    }
  }

  formatCurrency(amount, currency = 'EUR') {
    return BackendResponseHandler.formatSalaryRange(amount);
  }

  getRecommendationAnalytics(recommendations) {
    try {
      if (!recommendations || !Array.isArray(recommendations)) {
        return {
          total: 0,
          byType: { career: 0, university: 0 },
          averageMatchScore: 0
        };
      }

      if (recommendations.length === 0) {
        return {
          total: 0,
          byType: { career: 0, university: 0 },
          averageMatchScore: 0
        };
      }

      const careerCount = recommendations.filter(r => r.type === 'career').length;
      const universityCount = recommendations.filter(r => r.type === 'university').length;
      
      const totalScore = recommendations.reduce((sum, r) => sum + (r.matchScore || 0), 0);
      const averageScore = Math.round(totalScore / recommendations.length);

      return {
        total: recommendations.length,
        byType: {
          career: careerCount,
          university: universityCount
        },
        averageMatchScore: averageScore
      };
    } catch (error) {
      console.error('Error calculating analytics:', error);
      return {
        total: 0,
        byType: { career: 0, university: 0 },
        averageMatchScore: 0
      };
    }
  }

  getTopCategories(recommendations, limit = 5) {
    const categoryCount = {};
    
    recommendations.forEach(rec => {
      if (rec.category) {
        categoryCount[rec.category] = (categoryCount[rec.category] || 0) + 1;
      }
    });
    
    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([category, count]) => ({ category, count }));
  }

  getScoreDistribution(recommendations) {
    const distribution = {
      excellent: 0, // 90+
      good: 0,      // 80-89
      fair: 0,      // 70-79
      average: 0,   // 60-69
      poor: 0       // <60
    };
    
    recommendations.forEach(rec => {
      const score = rec.matchScore || 0;
      if (score >= 90) distribution.excellent++;
      else if (score >= 80) distribution.good++;
      else if (score >= 70) distribution.fair++;
      else if (score >= 60) distribution.average++;
      else distribution.poor++;
    });
    
    return distribution;
  }

  async generateCareerRecommendations() {
    try {
      console.log('Generating career recommendations...');
      
      const response = await api.get('/recommendations/career');
      console.log('Career generation response:', response.data);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data || [],
          message: response.data.message
        };
      } else {
        throw new Error(response.data?.message || 'Failed to generate career recommendations');
      }
    } catch (error) {
      console.error('Error generating career recommendations:', error);
      throw new Error(error.response?.data?.message || error.message || 'Gabim në gjenerimin e rekomandimeve të karrierës');
    }
  }

  async generateUniversityRecommendations(source = 'both', programs = [], minGrade = 6.0, preferences = {}) {
    try {
      console.log('Generating university recommendations with:', { source, programs, minGrade, preferences });
      
      const response = await api.post('/recommendations/university', {
        source,
        programs,
        minGrade,
        preferences
      });
      
      console.log('University generation response:', response.data);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data || [],
          message: response.data.message
        };
      } else {
        throw new Error(response.data?.message || 'Failed to generate university recommendations');
      }
    } catch (error) {
      console.error('Error generating university recommendations:', error);
      throw new Error(error.response?.data?.message || error.message || 'Gabim në gjenerimin e rekomandimeve të universiteteve');
    }
  }

  async getRecommendation(recommendationId) {
    try {
      const response = await api.get(`/recommendations/${recommendationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendation:', error);
      if (error.response?.status === 404) {
        throw new Error('Rekomandimi nuk u gjet');
      }
      throw new Error('Gabim në ngarkimin e rekomandimit');
    }
  }

  async updateRecommendationStatus(recommendationId, status) {
    try {
      const response = await api.put(`/recommendations/${recommendationId}/status`, {
        status
      });
      return response.data;
    } catch (error) {
      console.error('Error updating recommendation status:', error);
      throw new Error('Gabim në përditësimin e statusit të rekomandimit');
    }
  }

  async likeRecommendation(recommendationId) {
    return this.updateRecommendationStatus(recommendationId, 'liked');
  }

  async dismissRecommendation(recommendationId) {
    return this.updateRecommendationStatus(recommendationId, 'dismissed');
  }

  async markAsViewed(recommendationId) {
    return this.updateRecommendationStatus(recommendationId, 'viewed');
  }

  exportRecommendations(recommendations) {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalRecommendations: recommendations.length,
      careerRecommendations: recommendations.filter(r => r.type === 'career').length,
      universityRecommendations: recommendations.filter(r => r.type === 'university').length,
      averageMatchScore: recommendations.reduce((sum, r) => sum + (r.matchScore || 0), 0) / (recommendations.length || 1),
      recommendations: recommendations.map(rec => ({
        id: rec.id,
        type: rec.type,
        title: rec.title,
        description: rec.description,
        matchScore: rec.matchScore,
        matchReason: rec.matchReason,
        category: rec.category,
        createdAt: rec.createdAt
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  clearRecommendationCache() {
    try {
      localStorage.removeItem('cached_recommendations');
      localStorage.removeItem('recommendation_cache_timestamp');
    } catch (error) {
      console.error('Error clearing recommendation cache:', error);
    }
  }


  async fetchServerAnalytics() {
    try {
      console.log('Getting server recommendation analytics...');
      
      const smartRecs = await this.getSmartRecommendations('all', 'auto');
      console.log('Smart recommendations for analytics:', smartRecs);
      
      let careerRecs = [];
      let universityRecs = [];
      
      if (smartRecs && smartRecs.success && smartRecs.data) {
        careerRecs = smartRecs.data.career || [];
        universityRecs = smartRecs.data.university || [];
      } else if (smartRecs && smartRecs.career && smartRecs.university) {
        careerRecs = smartRecs.career || [];
        universityRecs = smartRecs.university || [];
      } else if (Array.isArray(smartRecs)) {
        careerRecs = smartRecs.filter(r => r.type === 'career') || [];
        universityRecs = smartRecs.filter(r => r.type === 'university') || [];
      }
      
      const allRecommendations = [...careerRecs, ...universityRecs];
      
      if (allRecommendations.length === 0) {
        return {
          totalRecommendations: 0,
          byType: { career: 0, university: 0 },
          byMatchScore: {
            excellent: 0, veryGood: 0, good: 0, fair: 0, poor: 0
          },
          averageMatchScore: 0,
          message: 'No recommendations available yet'
        };
      }
      
      const totalScore = allRecommendations.reduce((sum, r) => sum + (r.matchScore || 0), 0);
      const averageScore = Math.round(totalScore / allRecommendations.length);
      
      return {
        totalRecommendations: allRecommendations.length,
        byType: {
          career: careerRecs.length,
          university: universityRecs.length
        },
        byMatchScore: {
          excellent: allRecommendations.filter(r => (r.matchScore || 0) >= 90).length,
          veryGood: allRecommendations.filter(r => (r.matchScore || 0) >= 80 && (r.matchScore || 0) < 90).length,
          good: allRecommendations.filter(r => (r.matchScore || 0) >= 70 && (r.matchScore || 0) < 80).length,
          fair: allRecommendations.filter(r => (r.matchScore || 0) >= 60 && (r.matchScore || 0) < 70).length,
          poor: allRecommendations.filter(r => (r.matchScore || 0) < 60).length
        },
        averageMatchScore: averageScore
      };
      
    } catch (error) {
      console.error('Error getting server recommendation analytics:', error);
      
      return {
        totalRecommendations: 0,
        byType: { career: 0, university: 0 },
        byMatchScore: {
          excellent: 0, veryGood: 0, good: 0, fair: 0, poor: 0
        },
        averageMatchScore: 0,
        error: error.message
      };
    }
  }

  async searchRecommendations(query, filters = {}) {
    try {
      const response = await api.get('/recommendations/search', {
        params: { 
          q: query,
          ...filters
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching recommendations:', error);
      throw new Error('Gabim në kërkimin e rekomandimeve');
    }
  }

  async getRecommendationHistory() {
    try {
      const response = await api.get('/recommendations/history');
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendation history:', error);
      throw new Error('Gabim në marrjen e historikut të rekomandimeve');
    }
  }

  async getSimilarRecommendations(recommendationId, limit = 5) {
    try {
      const response = await api.get(`/recommendations/${recommendationId}/similar`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching similar recommendations:', error);
      throw new Error('Gabim në marrjen e rekomandimeve të ngjashme');
    }
  }

  async submitRecommendationFeedback(recommendationId, feedback) {
    try {
      const response = await api.post(`/recommendations/${recommendationId}/feedback`, {
        feedback
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting recommendation feedback:', error);
      throw new Error('Gabim në dërgimin e feedback-ut');
    }
  }
}

export const recommendationService = new RecommendationService();
export default recommendationService;