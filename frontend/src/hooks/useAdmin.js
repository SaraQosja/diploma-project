// frontend/src/hooks/useAdmin.js
import { useState, useEffect, useCallback } from 'react';
import adminService from '../services/adminService';

export const useAdmin = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dashboardStats, setDashboardStats] = useState(null);

    const handleRequest = useCallback(async (requestFn, onSuccess = null) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await requestFn();
            if (onSuccess) onSuccess(result);
            return result;
        } catch (err) {
            const errorMessage = err.message || 'An error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDashboardStats = useCallback(async () => {
        return handleRequest(
            () => adminService.getDashboardStats(),
            (data) => setDashboardStats(data.data)
        );
    }, [handleRequest]);

    return {
        loading,
        error,
        dashboardStats,
        fetchDashboardStats,
        handleRequest,
        clearError: () => setError(null)
    };
};

export const useUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleRequest = useCallback(async (requestFn, onSuccess = null) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await requestFn();
            if (onSuccess) onSuccess(result);
            return result;
        } catch (err) {
            const errorMessage = err.message || 'An error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUsers = useCallback(async (params = {}) => {
        return handleRequest(
            () => adminService.getAllUsers(params),
            (data) => {
                setUsers(data.data.users);
                setPagination(data.data.pagination);
            }
        );
    }, [handleRequest]);

    const createUser = useCallback(async (userData) => {
        return handleRequest(() => adminService.createUser(userData));
    }, [handleRequest]);

    const updateUser = useCallback(async (id, userData) => {
        return handleRequest(() => adminService.updateUser(id, userData));
    }, [handleRequest]);

    const deleteUser = useCallback(async (id) => {
        return handleRequest(() => adminService.deleteUser(id));
    }, [handleRequest]);

    const bulkDeleteUsers = useCallback(async (userIds) => {
        return handleRequest(() => adminService.bulkDeleteUsers(userIds));
    }, [handleRequest]);

    return {
        users,
        pagination,
        loading,
        error,
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
        bulkDeleteUsers,
        clearError: () => setError(null)
    };
};

export const useTestManagement = () => {
    const [tests, setTests] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleRequest = useCallback(async (requestFn, onSuccess = null) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await requestFn();
            if (onSuccess) onSuccess(result);
            return result;
        } catch (err) {
            const errorMessage = err.message || 'An error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTests = useCallback(async (params = {}) => {
        return handleRequest(
            () => adminService.getAllTests(params),
            (data) => {
                setTests(data.data.tests);
                setPagination(data.data.pagination);
            }
        );
    }, [handleRequest]);

    const createTest = useCallback(async (testData) => {
        return handleRequest(() => adminService.createTest(testData));
    }, [handleRequest]);

    const updateTest = useCallback(async (id, testData) => {
        return handleRequest(() => adminService.updateTest(id, testData));
    }, [handleRequest]);

    const deleteTest = useCallback(async (id) => {
        return handleRequest(() => adminService.deleteTest(id));
    }, [handleRequest]);

    return {
        tests,
        pagination,
        loading,
        error,
        fetchTests,
        createTest,
        updateTest,
        deleteTest,
        clearError: () => setError(null)
    };
};

export const useUniversityManagement = () => {
    const [universities, setUniversities] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleRequest = useCallback(async (requestFn, onSuccess = null) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await requestFn();
            if (onSuccess) onSuccess(result);
            return result;
        } catch (err) {
            const errorMessage = err.message || 'An error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUniversities = useCallback(async (params = {}) => {
        return handleRequest(
            () => adminService.getAllUniversities(params),
            (data) => {
                setUniversities(data.data.universities);
                setPagination(data.data.pagination);
            }
        );
    }, [handleRequest]);

    const createUniversity = useCallback(async (universityData) => {
        return handleRequest(() => adminService.createUniversity(universityData));
    }, [handleRequest]);

    const updateUniversity = useCallback(async (id, universityData) => {
        return handleRequest(() => adminService.updateUniversity(id, universityData));
    }, [handleRequest]);

    const deleteUniversity = useCallback(async (id) => {
        return handleRequest(() => adminService.deleteUniversity(id));
    }, [handleRequest]);

    return {
        universities,
        pagination,
        loading,
        error,
        fetchUniversities,
        createUniversity,
        updateUniversity,
        deleteUniversity,
        clearError: () => setError(null)
    };
};

export const useCareerManagement = () => {
    const [careers, setCareers] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleRequest = useCallback(async (requestFn, onSuccess = null) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await requestFn();
            if (onSuccess) onSuccess(result);
            return result;
        } catch (err) {
            const errorMessage = err.message || 'An error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCareers = useCallback(async (params = {}) => {
        return handleRequest(
            () => adminService.getAllCareers(params),
            (data) => {
                setCareers(data.data.careers);
                setPagination(data.data.pagination);
            }
        );
    }, [handleRequest]);

    const createCareer = useCallback(async (careerData) => {
        return handleRequest(() => adminService.createCareer(careerData));
    }, [handleRequest]);

    const updateCareer = useCallback(async (id, careerData) => {
        return handleRequest(() => adminService.updateCareer(id, careerData));
    }, [handleRequest]);

    const deleteCareer = useCallback(async (id) => {
        return handleRequest(() => adminService.deleteCareer(id));
    }, [handleRequest]);

    return {
        careers,
        pagination,
        loading,
        error,
        fetchCareers,
        createCareer,
        updateCareer,
        deleteCareer,
        clearError: () => setError(null)
    };
};

export const useChatManagement = () => {
    const [chatRooms, setChatRooms] = useState([]);
    const [messages, setMessages] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleRequest = useCallback(async (requestFn, onSuccess = null) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await requestFn();
            if (onSuccess) onSuccess(result);
            return result;
        } catch (err) {
            const errorMessage = err.message || 'An error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchChatRooms = useCallback(async (params = {}) => {
        return handleRequest(
            () => adminService.getAllChatRooms(params),
            (data) => {
                setChatRooms(data.data.chatRooms);
                setPagination(data.data.pagination);
            }
        );
    }, [handleRequest]);

    const fetchChatMessages = useCallback(async (roomId, params = {}) => {
        return handleRequest(
            () => adminService.getChatMessages(roomId, params),
            (data) => setMessages(data.data.messages)
        );
    }, [handleRequest]);

    const deleteChatRoom = useCallback(async (id) => {
        return handleRequest(() => adminService.deleteChatRoom(id));
    }, [handleRequest]);

    const deleteMessage = useCallback(async (messageId) => {
        return handleRequest(() => adminService.deleteMessage(messageId));
    }, [handleRequest]);

    return {
        chatRooms,
        messages,
        pagination,
        loading,
        error,
        fetchChatRooms,
        fetchChatMessages,
        deleteChatRoom,
        deleteMessage,
        clearError: () => setError(null)
    };
};

export const useAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleRequest = useCallback(async (requestFn, onSuccess = null) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await requestFn();
            if (onSuccess) onSuccess(result);
            return result;
        } catch (err) {
            const errorMessage = err.message || 'An error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAnalytics = useCallback(async (period = 30) => {
        return handleRequest(
            () => adminService.getAnalytics(period),
            (data) => setAnalytics(data.data)
        );
    }, [handleRequest]);

    return {
        analytics,
        loading,
        error,
        fetchAnalytics,
        clearError: () => setError(null)
    };
};

export const useSystemSettings = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleRequest = useCallback(async (requestFn, onSuccess = null) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await requestFn();
            if (onSuccess) onSuccess(result);
            return result;
        } catch (err) {
            const errorMessage = err.message || 'An error occurred';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSettings = useCallback(async () => {
        return handleRequest(
            () => adminService.getSystemSettings(),
            (data) => setSettings(data.data)
        );
    }, [handleRequest]);

    const updateSettings = useCallback(async (settingsData) => {
        return handleRequest(
            () => adminService.updateSystemSettings(settingsData),
            (data) => setSettings(data.data)
        );
    }, [handleRequest]);

    return {
        settings,
        loading,
        error,
        fetchSettings,
        updateSettings,
        clearError: () => setError(null)
    };
};