import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminThemeContext = createContext();

export function AdminThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved preference
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('adminTheme');
        // Default to dark mode if no preference saved
        return saved === null ? true : saved === 'dark';
      } catch (e) {
        console.error('Error reading theme from localStorage:', e);
        return true; // Default to dark
      }
    }
    return true; // Default to dark for SSR
  });

  useEffect(() => {
    // Save preference to localStorage
    try {
      localStorage.setItem('adminTheme', isDarkMode ? 'dark' : 'light');
    } catch (e) {
      console.error('Error saving theme to localStorage:', e);
    }
    
    // Apply theme class to document element
    if (isDarkMode) {
      document.documentElement.classList.add('admin-dark');
      document.documentElement.classList.remove('admin-light');
      document.body.style.backgroundColor = '#0f172a'; // Dark background
    } else {
      document.documentElement.classList.add('admin-light');
      document.documentElement.classList.remove('admin-dark');
      document.body.style.backgroundColor = '#f9fafb'; // Light background
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <AdminThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export const useAdminTheme = () => {
  const context = useContext(AdminThemeContext);
  if (!context) {
    throw new Error('useAdminTheme must be used within AdminThemeProvider');
  }
  return context;
};
