import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';

const AdminAuthContext = createContext();

const API_URL = API_BASE_URL;

export function AdminAuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is logged in (from localStorage)
    const adminToken = localStorage.getItem('adminToken');
    console.log('🔍 Checking admin session, token:', adminToken ? 'FOUND' : 'NOT FOUND');
    if (adminToken) {
      setIsAdmin(true);
    }
    setLoading(false);
  }, []);

  const login = async (password) => {
    try {
      console.log('🔐 Attempting admin login...');
      
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      });

      console.log('📡 Login response status:', response.status);
      
      const data = await response.json();
      console.log('📊 Login response data:', data);

      if (data.success && data.token) {
        console.log('✅ Login successful');
        console.log('🔑 Token received:', data.token);
        
        // Store token in localStorage with correct key
        localStorage.setItem('adminToken', data.token);
        console.log('💾 Token stored as "adminToken"');
        
        // Verify storage
        const storedToken = localStorage.getItem('adminToken');
        console.log('✅ Verification - stored token:', storedToken);
        
        setIsAdmin(true);
        return true;
      } else {
        console.error('❌ Login failed:', data.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('🚪 Logging out admin');
    localStorage.removeItem('adminToken');
    setIsAdmin(false);
  };

  const getToken = () => {
    const token = localStorage.getItem('adminToken');
    console.log('🔑 Getting admin token:', token ? 'FOUND' : 'NOT FOUND');
    return token;
  };

  return (
    <AdminAuthContext.Provider value={{ isAdmin, loading, login, logout, getToken }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdmin = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminAuthProvider');
  }
  return context;
};
