import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { motion } from 'framer-motion';
import { ExternalLink, Calendar, BarChart3, RefreshCw, Zap, CheckCircle, XCircle, Instagram, Facebook, Twitter, Youtube, Clock, FileText, TrendingUp } from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import axios from 'axios';

const API_URL = API_BASE_URL + '/api';

const QuickActionsPanel = () => {
  const { isDarkMode } = useAdminTheme();
  const [actionsData, setActionsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState(null);

  useEffect(() => {
    fetchActionsData();
  }, []);

  const fetchActionsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/social-media/quick-actions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setActionsData(response.data);
        setDataSource(response.data.data_source || 'unknown');
        setError(null);
      } else {
        setError(response.data.error || 'Failed to fetch quick actions data');
      }
    } catch (err) {
      console.error('Error fetching quick actions data:', err);
      setError('Failed to load quick actions');
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
    if (name.includes('instagram')) return 'text-pink-400';
    if (name.includes('facebook')) return 'text-blue-400';
    if (name.includes('twitter')) return 'text-sky-400';
    if (name.includes('youtube')) return 'text-red-400';
    return 'text-gray-400';
  };

  const handleActionClick = (action) => {
    if (action.url) {
      // External link
      window.open(action.url, '_blank', 'noopener,noreferrer');
    } else if (action.action === 'scroll' && action.target) {
      // Scroll to section
      const element = document.getElementById(action.target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Fallback: scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.round((date - now) / (1000 * 60 * 60));
    
    if (diffHours < 0) {
      const diffDays = Math.abs(Math.round(diffHours / 24));
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays} days ago`;
    } else {
      if (diffHours < 1) return 'In less than 1 hour';
      if (diffHours < 24) return `In ${diffHours} hours`;
      const diffDays = Math.round(diffHours / 24);
      if (diffDays === 1) return 'Tomorrow';
      return `In ${diffDays} days`;
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className={`mt-4 text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
            Loading quick actions...
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
          onClick={fetchActionsData}
          className="mt-4 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!actionsData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
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
              <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                <Zap size={20} className="text-yellow-400" />
                🚀 Quick Actions
              </h3>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                Manage your social media presence
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
            onClick={fetchActionsData}
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

        {/* Action Buttons */}
        {actionsData.actions && actionsData.actions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {actionsData.actions.map((action, index) => (
              <button
                key={action.name}
                onClick={() => handleActionClick(action)}
                className={`group relative p-4 rounded-xl border transition-all ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:border-purple-500/40 hover:from-purple-500/15 hover:to-pink-500/15'
                    : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                    isDarkMode ? 'bg-white/10' : 'bg-white/70'
                  }`}>
                    {index === 0 && <ExternalLink size={24} className="text-purple-400" />}
                    {index === 1 && <Calendar size={24} className="text-pink-400" />}
                    {index === 2 && <BarChart3 size={24} className="text-blue-400" />}
                  </div>
                  <span className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                    {action.button_text || action.name}
                  </span>
                  <span className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                    {action.description}
                  </span>
                </div>
                {action.url && (
                  <ExternalLink 
                    size={12} 
                    className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity ${
                      isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'
                    }`}
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {actionsData.quick_stats && (
          <div className={`p-4 rounded-xl mb-6 ${isDarkMode ? 'bg-white/5' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
            <h4 className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
              <TrendingUp size={16} className="text-blue-400" />
              At A Glance
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <div className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'} mb-1`}>
                  Total Followers
                </div>
                <div className={`text-lg font-black ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  {actionsData.quick_stats.total_followers?.toLocaleString() || 0}
                </div>
              </div>
              <div>
                <div className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'} mb-1`}>
                  Posts This Week
                </div>
                <div className={`text-lg font-black ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  {actionsData.quick_stats.posts_this_week || 0}
                </div>
              </div>
              <div>
                <div className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'} mb-1`}>
                  Pending Drafts
                </div>
                <div className={`text-lg font-black ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  {actionsData.quick_stats.pending_drafts || 0}
                </div>
              </div>
              <div>
                <div className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'} mb-1`}>
                  Next Post
                </div>
                <div className={`text-xs font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  {formatDateTime(actionsData.quick_stats.next_scheduled)}
                </div>
              </div>
              <div>
                <div className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'} mb-1`}>
                  Last Posted
                </div>
                <div className={`text-xs font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  {formatDateTime(actionsData.quick_stats.last_posted)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Platform Status */}
        {actionsData.platforms && actionsData.platforms.length > 0 && (
          <div>
            <h4 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
              <CheckCircle size={16} className="text-green-400" />
              Platform Connection Status
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {actionsData.platforms.map((platform) => {
                const PlatformIcon = getPlatformIcon(platform.name);
                const colorClass = getPlatformColor(platform.name);
                const isConnected = platform.status === 'connected';
                
                return (
                  <div
                    key={platform.name}
                    className={`p-4 rounded-xl border transition-all ${
                      isConnected
                        ? isDarkMode
                          ? 'bg-green-500/10 border-green-500/20'
                          : 'bg-green-50 border-green-200'
                        : isDarkMode
                        ? 'bg-gray-500/10 border-gray-500/20'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <PlatformIcon size={20} className={colorClass} />
                      {isConnected ? (
                        <CheckCircle size={16} className="text-green-400" />
                      ) : (
                        <XCircle size={16} className="text-gray-400" />
                      )}
                    </div>
                    <div className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      {platform.name}
                    </div>
                    <div className={`text-xs ${
                      isConnected
                        ? 'text-green-400'
                        : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {isConnected ? '✅ Connected' : '❌ Not Connected'}
                    </div>
                    {isConnected && platform.followers && (
                      <div className={`text-xs mt-2 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                        {platform.followers.toLocaleString()} followers
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default QuickActionsPanel;
