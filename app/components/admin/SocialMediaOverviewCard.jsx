import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, MessageCircle, DollarSign, BarChart3, RefreshCw } from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import axios from 'axios';
import apiConfigService from '../../services/apiConfigService';

const API_URL = API_BASE_URL + '/api';

const SocialMediaOverviewCard = () => {
  const { isDarkMode } = useAdminTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState(null);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      // First, fetch Metricool configuration from Admin API Settings
      console.log('🔧 Fetching Metricool configuration from Admin API Settings...');
      const metricoolConfig = await apiConfigService.getMetricoolConfig();
      
      if (metricoolConfig) {
        console.log('✅ Metricool config loaded:', {
          endpoint: metricoolConfig.endpoint,
          status: metricoolConfig.status,
          hasApiKey: !!metricoolConfig.apiKey
        });
      } else {
        console.warn('⚠️ No Metricool configuration found, using fallback');
      }

      // Fetch overview data from backend (which now uses the config from database)
      const response = await axios.get(`${API_URL}/social-media/overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setData(response.data.data);
        setDataSource(response.data.data_source || 'unknown');
        setError(null);
        
        // Log data source for debugging
        if (response.data.data_source) {
          console.log(`📊 Data source: ${response.data.data_source}`);
        }
      } else {
        // Handle mock data fallback
        if (response.data.data_source) {
          setData(response.data.data);
          setDataSource(response.data.data_source);
          setError(null);
        } else {
          setError(response.data.error || 'Failed to fetch data');
        }
      }
    } catch (err) {
      console.error('Error fetching social media overview:', err);
      setError('Failed to load social media data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/10 border-white/10' 
          : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'
      }`}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className={`mt-4 text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
            Loading social media data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
        isDarkMode 
          ? 'bg-red-500/10 border-red-500/20' 
          : 'bg-red-50 border-red-200'
      }`}>
        <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
          {error}
        </p>
        <button
          onClick={fetchOverviewData}
          className="mt-4 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      label: 'Total Followers',
      value: data.total_followers?.toLocaleString() || '0',
      icon: Users,
      change: data.month_over_month_change || 0,
      color: 'text-blue-400'
    },
    {
      label: 'Posts This Month',
      value: data.posts_this_month || 0,
      icon: MessageCircle,
      change: null,
      color: 'text-purple-400'
    },
    {
      label: 'Total Engagement',
      value: data.total_engagement?.toLocaleString() || '0',
      icon: BarChart3,
      change: data.engagement_rate || 0,
      color: 'text-green-400',
      suffix: `${data.engagement_rate || 0}% rate`
    },
    {
      label: 'Revenue Attributed',
      value: `₹${(data.revenue_attributed || 0).toLocaleString()}`,
      icon: DollarSign,
      change: null,
      color: 'text-yellow-400'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/10 border-white/10' 
          : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                📱 Social Media Overview
              </h3>
              {dataSource && (
                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                  dataSource === 'live'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : dataSource === 'mock'
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}>
                  {dataSource === 'live' ? '🟢 Live Data' : '⚠️ Mock Data'}
                </span>
              )}
            </div>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
              Last 30 days performance
            </p>
          </div>
          <button
            onClick={fetchOverviewData}
            disabled={loading}
            className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
              isDarkMode
                ? 'bg-white/10 text-pearl-white hover:bg-white/20'
                : 'bg-white text-gray-900 hover:bg-gray-100'
            } disabled:opacity-50`}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl ${
                isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <stat.icon size={20} className={stat.color} />
                {stat.change !== null && stat.change !== 0 && (
                  <div className={`flex items-center gap-1 text-xs font-semibold ${
                    stat.change > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {stat.change > 0 ? (
                      <TrendingUp size={12} />
                    ) : (
                      <TrendingDown size={12} />
                    )}
                    {Math.abs(stat.change)}%
                  </div>
                )}
              </div>
              <div className={`text-2xl font-black mb-1 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                {stat.value}
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                {stat.label}
              </div>
              {stat.suffix && (
                <div className={`text-xs mt-1 ${isDarkMode ? 'text-pearl-white/40' : 'text-gray-500'}`}>
                  {stat.suffix}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Platform Breakdown (Quick Summary) */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(data.platforms || {}).slice(0, 4).map(([platform, metrics]) => (
              <div key={platform} className={`text-center p-2 rounded-lg ${
                isDarkMode ? 'bg-white/5' : 'bg-white/50'
              }`}>
                <div className={`text-xs font-semibold capitalize ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  {platform}
                </div>
                <div className={`text-lg font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  {(metrics.followers || 0).toLocaleString()}
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                  {metrics.engagement_rate || 0}% rate
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Website Clicks & Revenue */}
        {(data.website_clicks || data.revenue_attributed) && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className={isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}>
                  Website Clicks from Social:
                </span>
                <span className={`ml-2 font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  {data.website_clicks || 0}
                </span>
              </div>
              <div>
                <span className={isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}>
                  Revenue:
                </span>
                <span className={`ml-2 font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  ₹{(data.revenue_attributed || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SocialMediaOverviewCard;
