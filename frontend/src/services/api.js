import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
   
      Cookies.remove('authToken');
      Cookies.remove('userData');
      
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);


export const authAPI = {

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  },

  // Forgot password
  forgotPassword: async (emailData) => {
    const response = await api.post('/auth/forgot-password', emailData);
    return response.data;
  },

  // Reset password
  resetPassword: async (resetData) => {
    const response = await api.post('/auth/reset-password', resetData);
    return response.data;
  },

  // Logout user
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};


export const tokenUtils = {
  setToken: (token) => {
    Cookies.set('authToken', token, { expires: 7, secure: true });
  },

  getToken: () => {
    return Cookies.get('authToken');
  },

  removeToken: () => {
    Cookies.remove('authToken');
  },

  setUserData: (userData) => {
    Cookies.set('userData', JSON.stringify(userData), { expires: 7, secure: true });
  },

  getUserData: () => {
    const userData = Cookies.get('userData');
    return userData ? JSON.parse(userData) : null;
  },

  removeUserData: () => {
    Cookies.remove('userData');
  },

  isLoggedIn: () => {
    return !!Cookies.get('authToken');
  }
};

export const progressAPI = {
 
  getUserProgress: async () => {
    const response = await api.get('/progress/overview');
    return response.data;
  },


  getTestProgress: async (limit = 10) => {
    const response = await api.get('/progress/tests', {
      params: { limit }
    });
    return response.data;
  },

 
  getLearningPathProgress: async () => {
    const response = await api.get('/progress/learning-paths');
    return response.data;
  },

  getActivityTimeline: async (days = 30) => {
    const response = await api.get('/progress/timeline', {
      params: { days }
    });
    return response.data;
  },

  getPerformanceTrends: async (months = 6) => {
    const response = await api.get('/progress/trends', {
      params: { months }
    });
    return response.data;
  },

  getAchievements: async () => {
    const response = await api.get('/progress/achievements');
    return response.data;
  },

  getPeerComparison: async () => {
    const response = await api.get('/progress/peer-comparison');
    return response.data;
  },

  getWeeklyActivity: async () => {
    const response = await api.get('/progress/weekly-activity');
    return response.data;
  },


  getDashboardSummary: async () => {
    const response = await api.get('/progress/dashboard');
    return response.data;
  }
};

export const counselorAPI = {
 
  getCounselorStats: async () => {
    const response = await api.get('/counselor/stats');
    return response.data;
  },

  getDailyStats: async () => {
    const response = await api.get('/counselor/daily-stats');
    return response.data;
  },

  getWeeklyInsights: async () => {
    const response = await api.get('/counselor/weekly-insights');
    return response.data;
  },


  updateAvailability: async (isAvailable) => {
    const response = await api.put('/counselor/availability', {
      isAvailable
    });
    return response.data;
  },

  getRecommendationTemplates: async () => {
    const response = await api.get('/counselor/recommendation-templates');
    return response.data;
  },


  createRecommendation: async (recommendationData) => {
    const response = await api.post('/counselor/recommendations', recommendationData);
    return response.data;
  },

  searchCareers: async (query) => {
    const response = await api.get('/counselor/search/careers', {
      params: { q: query }
    });
    return response.data;
  },

 
  searchUniversities: async (query) => {
    const response = await api.get('/counselor/search/universities', {
      params: { q: query }
    });
    return response.data;
  },

  getCareerCategories: async () => {
    const response = await api.get('/counselor/career-categories');
    return response.data;
  },

  getPerformanceMetrics: async (period = 'week') => {
    const response = await api.get('/counselor/performance-metrics', {
      params: { period }
    });
    return response.data;
  },

  markSessionAttended: async (sessionId) => {
    const response = await api.put(`/counselor/sessions/${sessionId}/mark-attended`);
    return response.data;
  },

 
  getRecentInteractions: async (limit = 10) => {
    const response = await api.get('/counselor/recent-interactions', {
      params: { limit }
    });
    return response.data;
  }
};


export const adminAPI = {
 
  getSystemStats: async () => {
    const response = await api.get('/admin/system-stats');
    return response.data;
  },

  getUserStats: async () => {
    const response = await api.get('/admin/user-stats');
    return response.data;
  },

  getTestStats: async () => {
    const response = await api.get('/admin/test-stats');
    return response.data;
  },

  getChatStats: async () => {
    const response = await api.get('/admin/chat-stats');
    return response.data;
  },

  getRecentActivity: async () => {
    const response = await api.get('/admin/recent-activity');
    return response.data;
  },

  getSystemHealth: async () => {
    const response = await api.get('/admin/system-health');
    return response.data;
  },

  
  getUsers: async (filters = {}) => {
    const response = await api.get('/admin/users', { params: filters });
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },


  getTests: async (filters = {}) => {
    const response = await api.get('/admin/tests', { params: filters });
    return response.data;
  },

  createTest: async (testData) => {
    const response = await api.post('/admin/tests', testData);
    return response.data;
  },

  updateTest: async (testId, testData) => {
    const response = await api.put(`/admin/tests/${testId}`, testData);
    return response.data;
  },

  deleteTest: async (testId) => {
    const response = await api.delete(`/admin/tests/${testId}`);
    return response.data;
  },

  
  getCareers: async (filters = {}) => {
    const response = await api.get('/admin/careers', { params: filters });
    return response.data;
  },

  createCareer: async (careerData) => {
    const response = await api.post('/admin/careers', careerData);
    return response.data;
  },

  updateCareer: async (careerId, careerData) => {
    const response = await api.put(`/admin/careers/${careerId}`, careerData);
    return response.data;
  },

  deleteCareer: async (careerId) => {
    const response = await api.delete(`/admin/careers/${careerId}`);
    return response.data;
  },

  getUniversities: async (filters = {}) => {
    const response = await api.get('/admin/universities', { params: filters });
    return response.data;
  },

  createUniversity: async (universityData) => {
    const response = await api.post('/admin/universities', universityData);
    return response.data;
  },

  updateUniversity: async (universityId, universityData) => {
    const response = await api.put(`/admin/universities/${universityId}`, universityData);
    return response.data;
  },

  deleteUniversity: async (universityId) => {
    const response = await api.delete(`/admin/universities/${universityId}`);
    return response.data;
  },

 
  getSystemSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  updateSystemSettings: async (settings) => {
    const response = await api.put('/admin/settings', settings);
    return response.data;
  },

  getAuditLogs: async (filters = {}) => {
    const response = await api.get('/admin/audit-logs', { params: filters });
    return response.data;
  }
};

export const counselorService = {
 
  getCounselorStats: async () => {
    return await counselorAPI.getCounselorStats();
  },

  getDailyStats: async () => {
    return await counselorAPI.getDailyStats();
  },

  
  getWeeklyInsights: async () => {
    return await counselorAPI.getWeeklyInsights();
  },

  updateAvailability: async (isAvailable) => {
    return await counselorAPI.updateAvailability(isAvailable);
  },

  getRecommendationTemplates: async () => {
    return await counselorAPI.getRecommendationTemplates();
  },

  createRecommendation: async (recommendationData) => {
    return await counselorAPI.createRecommendation(recommendationData);
  },

  sendRecommendationToStudent: async (sessionId, recommendation) => {
   
    const response = await api.post(`/chat/sessions/${sessionId}/messages`, {
      messageText: `📋 **Rekomandim nga Këshilluesi:**\n\n**${recommendation.title}**\n\n${recommendation.content}`,
      messageType: 'recommendation'
    });
    return response.data;
  },

  searchCareers: async (query) => {
    return await counselorAPI.searchCareers(query);
  },

  searchUniversities: async (query) => {
    return await counselorAPI.searchUniversities(query);
  },

  
  getCareerCategories: async () => {
    return await counselorAPI.getCareerCategories();
  },

  getPerformanceMetrics: async (period = 'week') => {
    return await counselorAPI.getPerformanceMetrics(period);
  },

  markSessionAttended: async (sessionId) => {
    return await counselorAPI.markSessionAttended(sessionId);
  },

  getRecentInteractions: async (limit = 10) => {
    return await counselorAPI.getRecentInteractions(limit);
  },

 
  formatRecommendation: (recommendation) => {
    return {
      ...recommendation,
      formattedCreatedAt: new Date(recommendation.createdAt).toLocaleDateString('sq-AL'),
      typeText: {
        'career': 'Rekomandim Karriere',
        'university': 'Rekomandim Universiteti',
        'general': 'Këshillë e Përgjithshme'
      }[recommendation.type] || recommendation.type
    };
  },

  formatInsight: (insight) => {
    return {
      ...insight,
      formattedDate: new Date(insight.date).toLocaleDateString('sq-AL'),
      trendIcon: insight.trend === 'up' ? '📈' : insight.trend === 'down' ? '📉' : '➖',
      trendColor: insight.trend === 'up' ? 'text-green-600' : insight.trend === 'down' ? 'text-red-600' : 'text-gray-600'
    };
  },

  validateRecommendation: (recommendation) => {
    const errors = [];
    
    if (!recommendation.title || recommendation.title.trim().length === 0) {
      errors.push('Titulli është i detyrueshëm');
    }
    
    if (!recommendation.content || recommendation.content.trim().length === 0) {
      errors.push('Përmbajtja është e detyrueshme');
    }
    
    if (!recommendation.type) {
      errors.push('Lloji i rekomandimit është i detyrueshëm');
    }
    
    if (recommendation.content && recommendation.content.length > 1000) {
      errors.push('Përmbajtja nuk mund të jetë më e gjatë se 1000 karaktere');
    }
    
    return errors;
  },

  generateRecommendationSuggestions: (context) => {
    const suggestions = [];
    
  
    suggestions.push({
      type: 'career',
      title: 'Eksploroni opsionet tuaja',
      content: 'Bazuar në interesat tuaja, rekomandoj të eksploroni...'
    });
    
    suggestions.push({
      type: 'university',
      title: 'Universitete të rekomanduara',
      content: 'Bazuar në profilin tuaj akademik, këto universitete mund të jenë të përshtatshme...'
    });
    
    suggestions.push({
      type: 'general',
      title: 'Këshilla e përgjithshme',
      content: 'Për të përmirësuar shkathtësitë tuaja, sugjeroj...'
    });
    
    return suggestions;
  },

  
  getResponseTemplates: () => {
    return [
      {
        id: 'greeting',
        title: 'Përshëndetje',
        content: 'Përshëndetje! Unë jam {counselorName} dhe do t\'ju ndihmoj sot. Si mund t\'ju asistoj?'
      },
      {
        id: 'career_exploration',
        title: 'Eksplorimi i Karrierës',
        content: 'Për të eksploruar opsionet e karrierës, fillimisht duhet të kuptojmë interesat dhe aftësitë tuaja. Mund të më tregoni më shumë për...'
      },
      {
        id: 'university_advice',
        title: 'Këshilla për Universitet',
        content: 'Për zgjedhjen e universitetit, duhet të konsiderojmë disa faktorë kyçë: fushat e studimit, vendndodhjen, kostot, dhe mundësitë e karrierës...'
      },
      {
        id: 'skills_development',
        title: 'Zhvillimi i Aftësive',
        content: 'Për të zhvilluar aftësitë tuaja, rekomandoj të fokusoheni në: {skills}. Këto mund të arrihen përmes...'
      },
      {
        id: 'next_steps',
        title: 'Hapat e Ardhshëm',
        content: 'Bazuar në diskutimin tonë, hapat e ardhshëm do të ishin: 1) {step1}, 2) {step2}, 3) {step3}. A keni ndonjë pyetje?'
      },
      {
        id: 'followup',
        title: 'Ndjekje',
        content: 'Shpresoj që informacioni ishte i dobishëm. Nëse keni pyetje të tjera ose dëshironi të diskutojmë më tej, mos hezitoni të më kontaktoni.'
      }
    ];
  },

 
  replaceTemplateVariables: (template, variables = {}) => {
    let content = template.content;
    
    Object.keys(variables).forEach(key => {
      const placeholder = `{${key}}`;
      content = content.replace(new RegExp(placeholder, 'g'), variables[key]);
    });
    
    return {
      ...template,
      content
    };
  }
};
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.message);
    
    if (error.response?.status === 400) {
      error.message = error.response.data?.message || 'Të dhëna të pavlefshme';
    } else if (error.response?.status === 500) {
      error.message = 'Gabim në server. Riprovoni pas disa sekondash.';
    } else if (!error.response) {
      error.message = 'Probleme me lidhjen. Kontrolloni internetin.';
    }
    
    return Promise.reject(error);
  }
);
export default api;