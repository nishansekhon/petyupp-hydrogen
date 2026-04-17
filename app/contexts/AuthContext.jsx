import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved user session
    const savedUser = localStorage.getItem('petyupp_user');
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      const userData = response.data;
      setUser(userData);
      localStorage.setItem('petyupp_user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      // For development - allow login with any credentials
      const mockUser = { email, name: email.split('@')[0], id: 'mock-user' };
      setUser(mockUser);
      localStorage.setItem('petyupp_user', JSON.stringify(mockUser));
      return mockUser;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('petyupp_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
