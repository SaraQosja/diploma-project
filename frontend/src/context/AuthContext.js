import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authAPI, tokenUtils } from '../services/api';
import toast from 'react-hot-toast';

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER'
};

const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case ActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case ActionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case ActionTypes.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };

    default:
      return state;
  }
};

const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = tokenUtils.getToken();
      const userData = tokenUtils.getUserData();

      if (token && userData) {
        try {
          const response = await authAPI.getProfile();
          dispatch({
            type: ActionTypes.LOGIN_SUCCESS,
            payload: response.data
          });
        } catch (error) {
          tokenUtils.removeToken();
          tokenUtils.removeUserData();
          dispatch({ type: ActionTypes.LOGOUT });
        }
      } else {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    };

    checkAuthStatus();
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      const response = await authAPI.login(credentials);

      if (response.success) {
        tokenUtils.setToken(response.data.token);
        tokenUtils.setUserData(response.data.user);

        dispatch({
          type: ActionTypes.LOGIN_SUCCESS,
          payload: response.data
        });

        toast.success('Login successful!');
        return { success: true };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({
        type: ActionTypes.SET_ERROR,
        payload: errorMessage
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      const response = await authAPI.register(userData);

      if (response.success) {
        tokenUtils.setToken(response.data.token);
        tokenUtils.setUserData(response.data.user);

        dispatch({
          type: ActionTypes.LOGIN_SUCCESS,
          payload: response.data
        });

        toast.success('Registration successful!');
        return { success: true };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({
        type: ActionTypes.SET_ERROR,
        payload: errorMessage
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenUtils.removeToken();
      tokenUtils.removeUserData();
      dispatch({ type: ActionTypes.LOGOUT });
      toast.success('Logged out successfully');
    }
  }, []);

  const updateUser = useCallback((userData) => {
    dispatch({
      type: ActionTypes.UPDATE_USER,
      payload: userData
    });
    tokenUtils.setUserData({ ...state.user, ...userData });
  }, [state.user]);

  const clearError = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  }, []);

  
  const isAdmin = useCallback(() => {
    const role = state.user?.role || state.user?.userType || state.user?.ROLI;
    return role === 'admin';
  }, [state.user]);

  const isCounselor = useCallback(() => {
    const role = state.user?.role || state.user?.userType || state.user?.ROLI;
    return role === 'counselor' || role === 'keshillues';
  }, [state.user]);

  const isStudent = useCallback(() => {
    const role = state.user?.role || state.user?.userType || state.user?.ROLI;
    return role === 'student' || role === 'nxenes';
  }, [state.user]);

  const getUserRole = useCallback(() => {
    return state.user?.role || state.user?.userType || state.user?.ROLI;
  }, [state.user]);

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    isAdmin,
    isCounselor,
    isStudent,
    getUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;