import api from './api';

export const counselorService = {
  // Get counselor profile
  getProfile: async () => {
    try {
      const response = await api.get('/api/counselor/profile');
      return response.data;
    } catch (error) {
      console.error('Get counselor profile error:', error);
      throw error;
    }
  },

  // Update counselor profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/api/counselor/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Update counselor profile error:', error);
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/api/counselor/profile/password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },

  // Get counselor statistics
  getStats: async () => {
    try {
      const response = await api.get('/api/counselor/stats');
      return response.data;
    } catch (error) {
      console.error('Get counselor stats error:', error);
      throw error;
    }
  },

  // Get active chats
  getActiveChats: async () => {
    try {
      const response = await api.get('/api/counselor/active-chats');
      return response.data;
    } catch (error) {
      console.error('Get active chats error:', error);
      throw error;
    }
  },

  
  updateAvailability: async (isAvailable) => {
    try {
      const response = await api.put('/api/counselor/availability', {
        isAvailable
      });
      return response.data;
    } catch (error) {
      console.error('Update availability error:', error);
      throw error;
    }
  },

  getSpecializationOptions: () => [
    { value: 'Career Counseling', label: 'Career Counseling' },
    { value: 'Academic Counseling', label: 'Academic Counseling' },
    { value: 'Personal Development', label: 'Personal Development' },
    { value: 'University Admissions', label: 'University Admissions' },
    { value: 'Skills Development', label: 'Skills Development' },
    { value: 'Employment Services', label: 'Employment Services' },
    { value: 'Educational Psychology', label: 'Educational Psychology' },
    { value: 'Vocational Training', label: 'Vocational Training' },
    { value: 'General Career Counseling', label: 'General Career Counseling' }
  ],

  
  validateProfile: (profileData) => {
    const errors = {};

    if (!profileData.firstName || !profileData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (profileData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    if (!profileData.lastName || !profileData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (profileData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    if (profileData.experience < 0 || profileData.experience > 50) {
      errors.experience = 'Experience must be between 0 and 50 years';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

 
  formatCounselorData: (rawData) => {
    if (!rawData) return null;

    return {
      id: rawData.id,
      firstName: rawData.firstName || '',
      lastName: rawData.lastName || '',
      email: rawData.email || '',
      specialization: rawData.specialization || 'General Career Counseling',
      experience: rawData.experience || 0,
      education: rawData.education || '',
      certifications: rawData.certifications || '',
      isApproved: rawData.isApproved || false,
      isActive: rawData.isActive || false,
      isVerified: rawData.isVerified || false,
      createdAt: rawData.createdAt
    };
  },

  
  getFullName: (counselor) => {
    if (!counselor) return '';
    return `${counselor.firstName || ''} ${counselor.lastName || ''}`.trim();
  },


  getInitials: (counselor) => {
    if (!counselor) return 'CC';
    const firstName = counselor.firstName || '';
    const lastName = counselor.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'CC';
  },

  getStatusDisplay: (counselor) => {
    if (!counselor) return 'Unknown';

    if (!counselor.isVerified) return 'Pending Verification';
    if (!counselor.isApproved) return 'Pending Approval';
    if (!counselor.isActive) return 'Unavailable';
    return 'Available';
  },


  getStatusColor: (counselor) => {
    if (!counselor) return 'gray';

    if (!counselor.isVerified || !counselor.isApproved) return 'orange';
    if (!counselor.isActive) return 'red';
    return 'green';
  },

  
  calculateCompletion: (counselor) => {
    if (!counselor) return 0;

    let completed = 0;
    let total = 6;

    if (counselor.firstName && counselor.firstName.trim()) completed++;
    if (counselor.lastName && counselor.lastName.trim()) completed++;
    if (counselor.specialization && counselor.specialization.trim()) completed++;
    if (counselor.experience >= 0) completed++;
    if (counselor.education && counselor.education.trim()) completed++;
    if (counselor.certifications && counselor.certifications.trim()) completed++;

    return Math.round((completed / total) * 100);
  },

  
  getCompletionColor: (completion) => {
    if (completion >= 80) return '#10b981';
    if (completion >= 60) return '#f59e0b';
    return '#ef4444';
  },

  
  formatDate: (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  },

  formatExperience: (years) => {
    if (!years || years === 0) return 'No experience';
    return `${years} year${years !== 1 ? 's' : ''} of experience`;
  }
};