import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, impersonate as apiImpersonate, exitImpersonation as apiExitImpersonation } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedImpersonatedUser = localStorage.getItem('impersonatedUser');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);

      if (storedImpersonatedUser) {
        setImpersonatedUser(JSON.parse(storedImpersonatedUser));
        setIsImpersonating(true);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiLogin(email, password);
      const { token: newToken, user: newUser } = response.data;

      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, password, roleId) => {
    try {
      await apiRegister(name, email, password, roleId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setIsImpersonating(false);
    setImpersonatedUser(null);

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('impersonatedUser');
  };

  const impersonate = async (targetUserId) => {
    try {
      const response = await apiImpersonate(targetUserId, token);
      const { token: newToken, impersonatedUser: newImpersonatedUser } = response.data;

      setToken(newToken);
      setImpersonatedUser(newImpersonatedUser);
      setIsImpersonating(true);

      localStorage.setItem('token', newToken);
      localStorage.setItem('impersonatedUser', JSON.stringify(newImpersonatedUser));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const exitImpersonation = async () => {
    try {
      const response = await apiExitImpersonation(token);
      const { token: newToken } = response.data;

      setToken(newToken);
      setImpersonatedUser(null);
      setIsImpersonating(false);

      localStorage.setItem('token', newToken);
      localStorage.removeItem('impersonatedUser');

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    token,
    isAuthenticated,
    isImpersonating,
    impersonatedUser,
    loading,
    login,
    register,
    logout,
    impersonate,
    exitImpersonation
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
