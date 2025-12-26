// frontend/src/services/adminService.js
import api from './api';

class AdminService {
    // Dashboard
    async getDashboardStats() {
        try {
            const response = await api.get('/admin/dashboard/stats');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error fetching dashboard stats' };
        }
    }

    async getAnalytics(period = 30) {
        try {
            const response = await api.get(`/admin/analytics?period=${period}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error fetching analytics' };
        }
    }

    // User Management
    async getAllUsers(params = {}) {
        try {
            const { page = 1, limit = 20, search = '', role = '' } = params;
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search,
                role
            }).toString();
            
            const response = await api.get(`/admin/users?${queryParams}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error fetching users' };
        }
    }

    async createUser(userData) {
        try {
            const response = await api.post('/admin/users', userData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error creating user' };
        }
    }

    async updateUser(id, userData) {
        try {
            const response = await api.put(`/admin/users/${id}`, userData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error updating user' };
        }
    }

    async deleteUser(id) {
        try {
            const response = await api.delete(`/admin/users/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error deleting user' };
        }
    }

    async bulkDeleteUsers(userIds) {
        try {
            const response = await api.post('/admin/users/bulk-delete', { userIds });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error deleting users' };
        }
    }

    // Test Management
    async getAllTests(params = {}) {
        try {
            const { page = 1, limit = 20, search = '' } = params;
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search
            }).toString();
            
            const response = await api.get(`/admin/tests?${queryParams}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error fetching tests' };
        }
    }

    async createTest(testData) {
        try {
            const response = await api.post('/admin/tests', testData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error creating test' };
        }
    }

    async updateTest(id, testData) {
        try {
            const response = await api.put(`/admin/tests/${id}`, testData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error updating test' };
        }
    }

    async deleteTest(id) {
        try {
            const response = await api.delete(`/admin/tests/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error deleting test' };
        }
    }

    // University Management
    async getAllUniversities(params = {}) {
        try {
            const { page = 1, limit = 20, search = '', country = '' } = params;
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search,
                country
            }).toString();
            
            const response = await api.get(`/admin/universities?${queryParams}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error fetching universities' };
        }
    }

    async createUniversity(universityData) {
        try {
            const response = await api.post('/admin/universities', universityData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error creating university' };
        }
    }

    async updateUniversity(id, universityData) {
        try {
            const response = await api.put(`/admin/universities/${id}`, universityData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error updating university' };
        }
    }

    async deleteUniversity(id) {
        try {
            const response = await api.delete(`/admin/universities/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error deleting university' };
        }
    }

    // Career Management
    async getAllCareers(params = {}) {
        try {
            const { page = 1, limit = 20, search = '', category = '' } = params;
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search,
                category
            }).toString();
            
            const response = await api.get(`/admin/careers?${queryParams}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error fetching careers' };
        }
    }

    async createCareer(careerData) {
        try {
            const response = await api.post('/admin/careers', careerData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error creating career' };
        }
    }

    async updateCareer(id, careerData) {
        try {
            const response = await api.put(`/admin/careers/${id}`, careerData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error updating career' };
        }
    }

    async deleteCareer(id) {
        try {
            const response = await api.delete(`/admin/careers/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error deleting career' };
        }
    }

    // Chat Management
    async getAllChatRooms(params = {}) {
        try {
            const { page = 1, limit = 20, search = '', type = '' } = params;
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search,
                type
            }).toString();
            
            const response = await api.get(`/admin/chat-rooms?${queryParams}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error fetching chat rooms' };
        }
    }

    async deleteChatRoom(id) {
        try {
            const response = await api.delete(`/admin/chat-rooms/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error deleting chat room' };
        }
    }

    async getChatMessages(roomId, params = {}) {
        try {
            const { page = 1, limit = 50 } = params;
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString()
            }).toString();
            
            const response = await api.get(`/admin/chat-rooms/${roomId}/messages?${queryParams}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error fetching chat messages' };
        }
    }

    async deleteMessage(messageId) {
        try {
            const response = await api.delete(`/admin/messages/${messageId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error deleting message' };
        }
    }

    // System Settings
    async getSystemSettings() {
        try {
            const response = await api.get('/admin/settings');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error fetching system settings' };
        }
    }

    async updateSystemSettings(settings) {
        try {
            const response = await api.put('/admin/settings', settings);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error updating system settings' };
        }
    }

    // Admin Logs
    async getAdminLogs(params = {}) {
        try {
            const { page = 1, limit = 50, adminId = '', actionType = '' } = params;
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                adminId,
                actionType
            }).toString();
            
            const response = await api.get(`/admin/logs?${queryParams}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error fetching admin logs' };
        }
    }

    // Export Data
    async exportData(type, format = 'json') {
        try {
            const response = await api.get(`/admin/export?type=${type}&format=${format}`, {
                responseType: format === 'csv' ? 'blob' : 'json'
            });
            
            if (format === 'csv') {
                // Handle CSV blob download
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${type}_export.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return { success: true, message: 'Export downloaded' };
            } else {
                // Handle JSON download
                const dataStr = JSON.stringify(response.data, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${type}_export.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return response.data;
            }
        } catch (error) {
            throw error.response?.data || { message: 'Error exporting data' };
        }
    }

    // Utility methods
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatCurrency(amount) {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    getStatusBadgeClass(isActive) {
        return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    }

    getRoleBadgeClass(role) {
        switch (role) {
            case 'admin':
                return 'bg-purple-100 text-purple-800';
            case 'counselor':
                return 'bg-blue-100 text-blue-800';
            case 'user':
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }
}

export default new AdminService();