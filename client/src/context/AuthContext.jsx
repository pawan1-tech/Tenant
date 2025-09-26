import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await authService.login(email, password);
      authService.saveAuthData(response.token, response.user);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  const register = useCallback(async (email, password, role = 'member') => {
    try {
      const response = await authService.register(email, password, role);
      return response;
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const isAuthenticated = useCallback(() => {
    return authService.isAuthenticated();
  }, []);

  const isAdmin = useCallback(() => {
    return user?.role === 'admin';
  }, [user?.role]);

  const refreshUser = useCallback(async () => {
    try {
      const freshUserData = await authService.refreshUserData();
      if (freshUserData) {
        setUser(freshUserData);
        return freshUserData;
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
    return null;
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    isAdmin,
    refreshUser
  }), [user, loading, login, register, logout, isAuthenticated, isAdmin, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
