//frontend/src/hooks/useAuth.js

import { useState, useEffect, useContext, createContext } from 'react';
import { authAPI, tokenUtils } from '../services/api';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = tokenUtils.getToken();
        const savedUser = tokenUtils.getUserData();

        if (token && savedUser) {
          
          try {
            const response = await authAPI.getProfile();
            if (response.success) {
              setUser(savedUser);
              setIsAuthenticated(true);
            } else {
              throw new Error('Invalid token');
            }
          } catch (error) {
           
            tokenUtils.removeToken();
            tokenUtils.removeUserData();
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const clearError = () => {
    setError(null);
  };

  const login = async (email, password, rememberMe = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.login({
        email,
        password,
        rememberMe
      });

      if (response.success && response.data.token) {
        const { token, user: userData } = response.data;
      
        tokenUtils.setToken(token);
        tokenUtils.setUserData(userData);
       
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, user: userData };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.register(userData);

      if (response.success) {
    
        if (userData.role === 'counselor') {
          return { 
            success: true, 
            message: response.message,
            requiresApproval: true 
          };
        }
        
        if (response.data && response.data.token) {
          const { token, user: newUser } = response.data;
          
          tokenUtils.setToken(token);
          tokenUtils.setUserData(newUser);
          
          setUser(newUser);
          setIsAuthenticated(true);
        }
        
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  
  const logout = async () => {
    try {
     
      try {
        await authAPI.logout();
      } catch (error) {
       
        console.warn('Logout endpoint error:', error);
      }
    } finally {
    
      tokenUtils.removeToken();
      tokenUtils.removeUserData();
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    }
  };

  const updateProfile = async (updatedData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.updateProfile(updatedData);

      if (response.success && response.data.user) {
        const updatedUser = response.data.user;
        
     
        tokenUtils.setUserData(updatedUser);
        
        
        setUser(updatedUser);
        
        return { success: true, user: updatedUser };
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Profile update failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.changePassword({
        currentPassword,
        newPassword
      });

      if (response.success) {
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error) {
      console.error('Password change error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Password change failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.forgotPassword({ email });

      if (response.success) {
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message || 'Password reset request failed');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Password reset request failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.resetPassword({
        token,
        newPassword
      });

      if (response.success) {
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message || 'Password reset failed');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Password reset failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  const hasRole = (role) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  const isCounselor = () => {
    return user?.role === 'counselor' || user?.isCounselor === true;
  };

  const isStudent = () => {
    return user?.role === 'nxenes';
  };


  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const getUserName = () => {
    if (!user) return '';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  };

 
  const getUserInitials = () => {
    if (!user) return '';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  const getUserId = () => {
    return user?.id;
  };


  const getCounselorSpecialization = () => {
    return user?.specialization || '';
  };

  const isCounselorAvailable = () => {
    return isCounselor() && user?.isAvailable === true;
  };


  const getCounselorBio = () => {
    return user?.counselorBio || '';
  };

  const value = {
  
    user,
    loading,
    isAuthenticated,
    error,
    

    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    clearError,
    hasRole,
    hasAnyRole,
    isCounselor,
    isStudent,
    isAdmin,
    getUserName,
    getUserInitials,
    getUserId,
    getCounselorSpecialization,
    isCounselorAvailable,
    getCounselorBio
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};