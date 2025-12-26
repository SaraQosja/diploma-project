// frontend/src/services/profileService.js 
import api from './api';

export const profileService = {

  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  getProfileCompletion: async () => {
    const response = await api.get('/profile/completion');
    return response.data;
  },

  updateBasicProfile: async (profileData) => {
    const response = await api.put('/profile/basic', profileData);
    return response.data;
  },

  updateExtendedProfile: async (profileData) => {
    const response = await api.put('/profile/extended', profileData);
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.put('/profile/password', passwordData);
    return response.data;
  },

  
  markProfileCompleted: async () => {
    const response = await api.post('/profile/complete');
    return response.data;
  },

  calculateCompletion: (profileData) => {
    if (!profileData) return 0;

    let completed = 0;
    let total = 0;

    const requiredFields = ['emri', 'mbiemri', 'email'];
    requiredFields.forEach(field => {
      total += 2; 
      if (profileData[field] && profileData[field].trim()) completed += 2;
    });

    const extendedFields = ['education_level', 'current_school'];
    extendedFields.forEach(field => {
      total += 2;
      if (profileData.profile?.[field] && profileData.profile[field].trim()) completed += 2;
    });

    const optionalFields = ['interests', 'goals', 'strengths', 'skills'];
    optionalFields.forEach(field => {
      total += 1;
      if (profileData.profile?.[field] && profileData.profile[field].trim()) completed += 1;
    });

    return Math.min(100, Math.round((completed / total) * 100));
  },


  formatProfileData: (rawData) => {
    if (!rawData) return null;

    return {
      id: rawData.id,
      emri: rawData.emri || '',
      mbiemri: rawData.mbiemri || '',
      email: rawData.email || '',
      roli: rawData.roli || 'STUDENT',
      statusi: rawData.statusi || 'ACTIVE',
      created_at: rawData.created_at,
      updated_at: rawData.updated_at,
      profile: {
        education_level: rawData.profile?.education_level || '',
        current_school: rawData.profile?.current_school || '',
        interests: rawData.profile?.interests || '',
        goals: rawData.profile?.goals || '',
        strengths: rawData.profile?.strengths || '',
        skills: rawData.profile?.skills || '',
        personality_type: rawData.profile?.personality_type || '',
        completed_at: rawData.profile?.completed_at
      },
      completion: rawData.completion || 0
    };
  },

  getProfileInitials: (profile) => {
    if (!profile) return 'US';
    const firstName = profile.emri || '';
    const lastName = profile.mbiemri || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  },

  getProfileCompletionColor: (completion) => {
    if (completion >= 80) return 'text-green-600';
    if (completion >= 60) return 'text-yellow-600';
    if (completion >= 40) return 'text-orange-600';
    return 'text-red-600';
  },

  getProfileCompletionBgColor: (completion) => {
    if (completion >= 80) return 'bg-green-500';
    if (completion >= 60) return 'bg-yellow-500';
    if (completion >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  },

  getCompletionColor: (completion) => {
    if (completion >= 80) return '#10b981';
    if (completion >= 50) return '#f59e0b';
    return '#ef4444';
  },

  getProfileCompletionMessage: (completion) => {
    if (completion >= 90) return 'Profili juaj është pothuajse i plotë!';
    if (completion >= 70) return 'Profil i mirë! Shtoni më shumë detaje.';
    if (completion >= 50) return 'Vazhdoni të plotësoni profilin tuaj.';
    return 'Plotësoni profilin për përvojë më të mirë.';
  },

  getMissingFields: (profile) => {
    if (!profile) return [];

    const missingFields = [];
    
    if (!profile.emri || !profile.emri.trim()) missingFields.push('Emri');
    if (!profile.mbiemri || !profile.mbiemri.trim()) missingFields.push('Mbiemri');
    if (!profile.email || !profile.email.trim()) missingFields.push('Email-i');
    
    
    if (!profile.profile?.education_level) missingFields.push('Niveli arsimor');
    if (!profile.profile?.current_school) missingFields.push('Shkolla aktuale');
    if (!profile.profile?.interests) missingFields.push('Interesat');
    if (!profile.profile?.goals) missingFields.push('Qëllimet');

    return missingFields;
  },

  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validateName: (name) => {
    const nameRegex = /^[a-zA-ZÀ-ÿëçËÇ\s]{2,50}$/;
    return nameRegex.test(name);
  },

  validatePassword: (password) => {
 
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/;
    return passwordRegex.test(password);
  },

  getEducationLevels: () => [
    { value: 'Shkolla e Mesme', label: 'Shkolla e Mesme' },
    { value: 'Universiteti', label: 'Universiteti' },
    { value: 'Master', label: 'Master' },
    { value: 'Doktoraturë', label: 'Doktoraturë' },
    { value: 'Tjetër', label: 'Tjetër' }
  ],


  getRoleDisplayName: (role) => {
    const roles = {
      'ADMIN': 'Administrator',
      'COUNSELOR': 'Këshillues',
      'STUDENT': 'Nxënës'
    };
    return roles[role] || 'Nxënës';
  },

  getStatusDisplayName: (status) => {
    const statuses = {
      'ACTIVE': 'Aktiv',
      'INACTIVE': 'Jo aktiv',
      'PENDING': 'Në pritje të verifikimit'
    };
    return statuses[status] || 'I papërcaktuar';
  },


  formatDate: (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('sq-AL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  },

  canGetRecommendations: (profile) => {
    if (!profile) return false;
    
    const hasBasicInfo = profile.emri && profile.mbiemri && profile.email;
    const hasEducationInfo = profile.profile?.education_level && profile.profile?.current_school;
    const completion = profile.completion || 0;
    
    return hasBasicInfo && hasEducationInfo && completion >= 50;
  }
};