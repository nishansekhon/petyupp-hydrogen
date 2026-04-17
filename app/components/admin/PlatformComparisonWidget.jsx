import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { motion } from 'framer-motion';
import { Instagram, Facebook, Twitter, Youtube, TrendingUp, Eye, BarChart3, RefreshCw, Award } from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import axios from 'axios';

const API_URL = API_BASE_URL + '/api';

const PlatformComparisonWidget = () => {
  const { isDarkMode } = useAdminTheme();
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState(null);

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const fetchPlatformData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/social-media/platforms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setPlatforms(response.data.platforms);
        setDataSource(response.data.data_source || 'unknown');
        setError(null);
      } else {
        setError(response.data.error || 'Failed to fetch platform data');
      }
    } catch (err) {
      console.error('Error fetching platform data:', err);
      setError('Failed to load platform data');
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platformName) => {
    const name = platformName.toLowerCase();
    if (name.includes('instagram')) return Instagram;
    if (name.includes('facebook')) return Facebook;
    if (name.includes('twitter')) return Twitter;
    if (name.includes('youtube')) return Youtube;
    return BarChart3;
  };

  const getPlatformColor = (platformName) => {
    const name = platformName.toLowerCase();
    if (name.includes('instagram')) return {
      bg: 'from-pink-500/20 to-purple-500/20',
      border: 'border-pink-500/30',
      text: 'text-pink-400',
      badge: 'bg-pink-500/20 text-pink-400'
    };
    if (name.includes('facebook')) return {
      bg: 'from-blue-500/20 to-blue-600/20',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-400'
    };
    if (name.includes('twitter')) return {
      bg: 'from-sky-500/20 to-cyan-500/20',
      border: 'border-sky-500/30',
      text: 'text-sky-400',
      badge: 'bg-sky-500/20 text-sky-400'
    };
    if (name.includes('youtube')) return {
      bg: 'from-red-500/20 to-red-600/20',
      border: 'border-red-500/30',
      text: 'text-red-400',
      badge: 'bg-red-500/20 text-red-400'
    };
    return {
      bg: 'from-gray-500/20 to-gray-600/20',
      border: 'border-gray-500/30',
      text: 'text-gray-400',
      badge: 'bg-gray-500/20 text-gray-400'
    };
  };

  const getPerformanceBadge = (engagementRate) => {
    if (engagementRate >= 5) {
      return { label: 'LEADING', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
    } else if (engagementRate >= 3) {
      return { label: 'GOOD', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    } else {
      return { label: 'NEEDS IMPROVEMENT', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
    }
  };

  if (loading) {
    return (
      <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
        isDarkMode 
          ? 'bg-white/5 border-white/10' 
          : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className={`mt-4 text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
            Loading platform data...
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
          onClick={fetchPlatformData}
          className="mt-4 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-4"
    >
      <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
        isDarkMode 
          ? 'bg-white/5 border-white/10' 
          : 'bg-white border-gray-200 shadow-sm'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                📊 Platform Performance Comparison
              </h3>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                Compare metrics across all platforms
              </p>
            </div>
            {dataSource && (
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                dataSource === 'live' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}>
                {dataSource === 'live' ? '🟢 Live Data' : '⚠️ Mock Data'}
              </span>
            )}
          </div>
          <button
            onClick={fetchPlatformData}
            disabled={loading}
            className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
              isDarkMode
                ? 'bg-white/10 text-pearl-white hover:bg-white/20'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            } disabled:opacity-50`}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Platform Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((platform, index) => {
            const PlatformIcon = getPlatformIcon(platform.platform);
            const colors = getPlatformColor(platform.platform);
            const performanceBadge = getPerformanceBadge(platform.engagement_rate);

            return (
              <motion.div
                key={platform.platform}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
                className={`backdrop-blur-lg border rounded-xl p-5 transition-all hover:scale-105 hover:shadow-lg ${
                  isDarkMode 
                    ? `bg-gradient-to-br ${colors.bg} ${colors.border}` 
                    : `bg-gradient-to-br ${colors.bg} ${colors.border}`
                }`}
              >
                {/* Platform Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colors.badge}`}>
                      <PlatformIcon size={20} />
                    </div>
                    <div>
                      <h4 className={`font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                        {platform.platform}
                      </h4>
                      <p className={`text-xs ${colors.text}`}>
                        Social Media
                      </p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold border ${performanceBadge.color}`}>
                    {performanceBadge.label}
                  </div>
                </div>

                {/* Main Metrics */}
                <div className="mb-4">
                  <div className={`text-3xl font-black mb-1 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                    {platform.followers?.toLocaleString() || 0}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                    Total Followers
                  </div>
                </div>

                {/* Engagement Rate */}
                <div className={`flex items-center gap-2 mb-3 p-2 rounded-lg ${
                  isDarkMode ? 'bg-white/5' : 'bg-white/50'
                }`}>
                  <TrendingUp size={16} className={colors.text} />
                  <div className="flex-1">
                    <div className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                      Engagement Rate
                    </div>
                    <div className={`text-lg font-bold ${colors.text}`}>
                      {platform.engagement_rate || 0}%
                    </div>
                  </div>
                </div>

                {/* Secondary Metrics */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-white/50'}`}>
                    <div className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                      Reach
                    </div>
                    <div className={`text-sm font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      {platform.reach?.toLocaleString() || 0}
                    </div>
                  </div>
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-white/50'}`}>
                    <div className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                      Impressions
                    </div>
                    <div className={`text-sm font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      {platform.impressions?.toLocaleString() || 0}
                    </div>
                  </div>
                </div>

                {/* Top Post */}
                {platform.top_post && (
                  <div className={`p-3 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      <Award size={14} className={`${colors.text} mt-1 flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'} mb-1`}>
                          Top Performing Post
                        </div>
                        <div className={`text-xs font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'} truncate`}>
                          {typeof platform.top_post === 'string' 
                            ? platform.top_post 
                            : platform.top_post.title || 'N/A'}
                        </div>
                        {platform.top_post.engagement && (
                          <div className={`text-xs ${colors.text} mt-1`}>
                            {platform.top_post.engagement} engagements
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Posts Count */}
                <div className={`mt-3 text-xs text-center ${isDarkMode ? 'text-pearl-white/40' : 'text-gray-500'}`}>
                  {platform.posts || 0} posts this month
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Summary Footer */}
        {platforms.length > 0 && (
          <div className={`mt-6 pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between text-sm">
              <div className={isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}>
                <span className="font-semibold">Total Reach:</span> {platforms.reduce((sum, p) => sum + (p.reach || 0), 0).toLocaleString()}
              </div>
              <div className={isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}>
                <span className="font-semibold">Total Impressions:</span> {platforms.reduce((sum, p) => sum + (p.impressions || 0), 0).toLocaleString()}
              </div>
              <div className={isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}>
                <span className="font-semibold">Avg Engagement:</span> {(platforms.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) / platforms.length).toFixed(1)}%
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PlatformComparisonWidget;
