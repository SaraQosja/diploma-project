
// frontend/src/services/testService.js
import api from './api';

class TestService {

  async getAllTests() {
    try {
      console.log('🔄 Fetching all tests from database...');
      const response = await api.get('/tests');
      
      console.log('📊 Database response:', response.data);
      
      if (response.data.success) {
        const tests = response.data.data || [];
        console.log('✅ Tests loaded from database:', tests.length);
        return {
          success: true,
          data: tests
        };
      } else {
        throw new Error(response.data.message || 'Failed to load tests');
      }
    } catch (error) {
      console.error('❌ Error fetching tests from database:', error);
      
    
      return {
        success: false,
        data: [],
        message: error.message || 'Gabim në ngarkimin e testeve nga databaza'
      };
    }
  }

  
  async getTest(testId) {
    try {
      console.log('🔄 Fetching test from database:', testId);
      const response = await api.get(`/tests/${testId}`);
      
      console.log('📊 Test response:', response.data);
      
      if (response.data.success) {
        const test = response.data.data;
        
     
        if (!test.questions || test.questions.length === 0) {
          console.warn('⚠️ Test has no questions:', testId);
          throw new Error('Ky test nuk ka pyetje të disponueshme');
        }
        
        console.log('✅ Test loaded with questions:', test.questions.length);
        return {
          success: true,
          data: test
        };
      } else {
        throw new Error(response.data.message || 'Testi nuk u gjet');
      }
    } catch (error) {
      console.error('❌ Error fetching test from database:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Testi nuk u gjet në bazën e të dhënave');
      } else if (error.response?.status === 500) {
        throw new Error('Gabim në server - kontaktoni administratorin');
      } else {
        throw new Error(error.message || 'Gabim në ngarkimin e testit');
      }
    }
  }


  async submitTest(testId, submissionData) {
    try {
      console.log('🚀 Submitting test to database:', testId, submissionData);
      
     
      if (!submissionData.answers || typeof submissionData.answers !== 'object') {
        throw new Error('Invalid answers data');
      }
      
      const response = await api.post(`/tests/${testId}/submit`, submissionData);
      
      console.log('✅ Test submission response:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Error submitting test:', error);
      
      if (error.response) {
        throw new Error(error.response.data?.message || 'Gabim në server gjatë dorëzimit');
      } else if (error.request) {
        throw new Error('Gabim në rrjet - nuk mund të arrihet serveri');
      } else {
        throw new Error(error.message || 'Gabim i panjohur gjatë dorëzimit');
      }
    }
  }
  
  async getUserResults() {
    try {
      console.log('🔄 Fetching user results from database...');
      
      const response = await api.get('/tests/results', {
        params: {
          _t: Date.now() // Prevent caching
        }
      });
      
      console.log('📊 User results response:', response.data);
      
      if (response.data.success) {
        const results = response.data.data || [];
        console.log('✅ User results loaded:', results.length);
        return {
          success: true,
          data: results
        };
      } else {
        return {
          success: true,
          data: [],
          message: 'No results found'
        };
      }
    } catch (error) {
      console.error('❌ Error fetching user results:', error);
      
    
      return {
        success: true,
        data: [],
        message: 'Gabim në ngarkimin e rezultateve'
      };
    }
  }


  async getRecommendations() {
    try {
      console.log('🔄 Fetching recommendations from database...');
      const response = await api.get('/recommendations');
      
      if (response.data.success) {
        console.log('✅ Recommendations loaded:', response.data.data?.length || 0);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to load recommendations');
      }
    } catch (error) {
      console.error('❌ Error fetching recommendations:', error);
      throw new Error('Gabim në ngarkimin e rekomandimeve');
    }
  }

  clearAllCache() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('test_progress_')) {
          localStorage.removeItem(key);
        }
      });
      console.log('🧹 Cleared all test cache');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  saveTestProgress(testId, answers, currentQuestion) {
    try {
      const progressData = {
        testId,
        answers,
        currentQuestion,
        timeSpent: 0,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(`test_progress_${testId}`, JSON.stringify(progressData));
    } catch (error) {
      console.error('Error saving test progress:', error);
    }
  }

  
  loadTestProgress(testId) {
    try {
      const saved = localStorage.getItem(`test_progress_${testId}`);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error loading test progress:', error);
      return null;
    }
  }

 
  clearTestProgress(testId) {
    try {
      localStorage.removeItem(`test_progress_${testId}`);
    } catch (error) {
      console.error('Error clearing test progress:', error);
    }
  }

  getCategoryDisplayName(category) {
    const categoryMap = {
      'personality': 'Personalitet',
      'aptitude': 'Aftësi',
      'interest': 'Interesa',
      'logical': 'Logjikë',
      'creative': 'Kreativitet',
      'communication': 'Komunikim',
      'comprehensive': 'I plotë'
    };
    
    return categoryMap[category?.toLowerCase()] || category || 'Tjetër';
  }

  formatDuration(minutes) {
    if (!minutes) return '15 min';
    if (minutes < 60) return `${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) return `${hours} orë`;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')} orë`;
  }

  validateAnswers(questions, answers) {
    const errors = [];
    
    if (!questions || !Array.isArray(questions)) {
      errors.push('Invalid questions data');
      return errors;
    }
    
    questions.forEach((question, index) => {
      const questionId = question.id || question.QUESTION_ID;
      if (!answers.hasOwnProperty(questionId)) {
        errors.push(`Pyetja ${index + 1}: ${question.text || question.QUESTION_TEXT || 'Pyetje pa përgjigje'}`);
      }
    });
    
    return errors;
  }
async resetTestResult(testId) {
  try {
    console.log('🔄 Resetting test result for test:', testId);
    const response = await api.delete(`/tests/${testId}/reset`);
    
    console.log('✅ Test result reset response:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('❌ Error resetting test result:', error);
    
    if (error.response) {
      throw new Error(error.response.data?.message || 'Gabim në rivendosjen e testit');
    } else if (error.request) {
      throw new Error('Gabim në rrjet - nuk mund të arrihet serveri');
    } else {
      throw new Error(error.message || 'Gabim i panjohur');
    }
  }
}
}

export const testService = new TestService();