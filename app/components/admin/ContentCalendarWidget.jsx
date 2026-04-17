import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { motion } from 'framer-motion';
import { Calendar, Clock, Instagram, Facebook, Twitter, Youtube, Linkedin, TrendingUp, TrendingDown, Eye, Heart, MessageCircle, Share2, RefreshCw, Edit, FileText, ExternalLink } from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import axios from 'axios';

const API_URL = API_BASE_URL + '/api';

const ContentCalendarWidget = () => {
  const { isDarkMode } = useAdminTheme();
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDrafts, setShowDrafts] = useState(false);

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/social-media/calendar?days=7`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setCalendarData(response.data);
        setError(null);
      } else {
        setError(response.data.error || 'Failed to fetch calendar data');
      }
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platformName) => {
    const name = platformName?.toLowerCase() || '';
    if (name.includes('instagram')) return Instagram;
    if (name.includes('facebook')) return Facebook;
    if (name.includes('twitter') || name.includes('x')) return Twitter;
    if (name.includes('youtube')) return Youtube;
    if (name.includes('linkedin')) return Linkedin;
    return Calendar;
  };

  const getPlatformColor = (platformName) => {
    const name = platformName?.toLowerCase() || '';
    if (name.includes('instagram')) return {
      bg: 'bg-teal-500/20',
      border: 'border-teal-500/30',
      text: 'text-teal-400',
      dot: 'bg-teal-500'
    };
    if (name.includes('facebook')) return {
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      dot: 'bg-blue-500'
    };
    if (name.includes('twitter') || name.includes('x')) return {
      bg: 'bg-sky-500/20',
      border: 'border-sky-500/30',
      text: 'text-sky-400',
      dot: 'bg-sky-500'
    };
    if (name.includes('youtube')) return {
      bg: 'bg-red-500/20',
      border: 'border-red-500/30',
      text: 'text-red-400',
      dot: 'bg-red-500'
    };
    if (name.includes('linkedin')) return {
      bg: 'bg-blue-600/20',
      border: 'border-blue-600/30',
      text: 'text-blue-300',
      dot: 'bg-blue-600'
    };
    return {
      bg: 'bg-gray-500/20',
      border: 'border-gray-500/30',
      text: 'text-gray-400',
      dot: 'bg-gray-500'
    };
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.round((date - now) / (1000 * 60 * 60));
    
    if (diffHours < 0) {
      const diffDays = Math.abs(Math.round(diffHours / 24));
      return {
        relative: diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`,
        absolute: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      };
    } else if (diffHours < 1) {
      return {
        relative: 'In less than 1 hour',
        absolute: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
    } else if (diffHours < 24) {
      return {
        relative: `In ${diffHours} hours`,
        absolute: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
    } else {
      const diffDays = Math.round(diffHours / 24);
      return {
        relative: diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`,
        absolute: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      };
    }
  };

  const getContentTypeIcon = (contentType) => {
    const type = contentType?.toLowerCase() || '';
    if (type.includes('video') || type.includes('reel')) return '🎬';
    if (type.includes('image') || type.includes('carousel')) return '📷';
    return '📝';
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
            Loading calendar...
          </p>
        </div>
      </div>
    );
  }

  if (error || (calendarData && !calendarData.success && calendarData.error)) {
    const errorMessage = error || calendarData?.error;
    const isConnected = calendarData?.connected;
    
    // Graceful fallback - Show link to Metricool instead of error
    return (
      <div className={`backdrop-blur-lg border rounded-2xl p-5 ${
        isDarkMode 
          ? 'bg-slate-800/50 border-slate-700' 
          : 'bg-white border-gray-200 shadow-sm'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${isDarkMode ? 'bg-teal-500/20' : 'bg-teal-50'} flex items-center justify-center`}>
              <Calendar size={20} className="text-teal-500" />
            </div>
            <div>
              <h3 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Content Calendar</h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>View scheduled posts in Metricool</p>
            </div>
          </div>
          <button
            onClick={fetchCalendarData}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Content - Link to Metricool */}
        <div className="text-center py-6">
          <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-teal-500/20`}>
            <Calendar size={28} className="text-white" />
          </div>
          <p className={`text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
            {isConnected ? 'View your content calendar' : 'Connect to Metricool'}
          </p>
          <p className={`text-xs mb-4 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
            {isConnected ? 'Manage scheduled posts directly in Metricool' : 'Add your API credentials to see posts'}
          </p>
          
          <div className="flex flex-col gap-2">
            <a
              href="https://app.metricool.com/planner/calendar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl transition-colors text-sm font-medium"
            >
              <Calendar size={16} />
              Open Metricool Calendar
            </a>
            {!isConnected && (
              <a
                href="/admin/marketing?tab=settings"
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-colors text-sm font-medium ${
                  isDarkMode 
                    ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Configure API
              </a>
            )}
          </div>
        </div>

        {/* Quick Stats Preview */}
        <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className={`rounded-xl p-3 ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
              <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>—</p>
              <p className={`text-[10px] uppercase tracking-wide ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Scheduled</p>
            </div>
            <div className={`rounded-xl p-3 ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
              <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>—</p>
              <p className={`text-[10px] uppercase tracking-wide ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>This Week</p>
            </div>
            <div className={`rounded-xl p-3 ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
              <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>—</p>
              <p className={`text-[10px] uppercase tracking-wide ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Published</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!calendarData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-4"
    >
      <div className={`backdrop-blur-lg border rounded-xl p-4 ${
        isDarkMode 
          ? 'bg-slate-800/30 border-slate-700/50' 
          : 'bg-white border-gray-200 shadow-sm'
      }`}>
        {/* Header - Compact */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-teal-400" />
            <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Content Calendar
            </h3>
          </div>
          <button
            onClick={fetchCalendarData}
            disabled={loading}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all ${
              isDarkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            } disabled:opacity-50`}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Upcoming Posts Section - Compact (NOT clickable - no URL yet) */}
        {calendarData.upcoming_posts && calendarData.upcoming_posts.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={12} className="text-teal-400" />
              <span className={`text-[11px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Upcoming
              </span>
              <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                ({calendarData.upcoming_posts.length})
              </span>
            </div>
            
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
              {calendarData.upcoming_posts.slice(0, 8).map((post) => {
                const PlatformIcon = getPlatformIcon(post.platform);
                const colors = getPlatformColor(post.platform);
                const dateInfo = formatDateTime(post.scheduled_date);
                
                return (
                  <div
                    key={post.id}
                    className={`p-2.5 rounded-lg border-l-2 ${colors.border} ${isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded ${colors.bg} flex items-center justify-center`}>
                          <PlatformIcon size={12} className={colors.text} />
                        </div>
                        <span className={`text-[10px] uppercase tracking-wide ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                          {post.content_type || 'post'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-teal-400">
                          {dateInfo.relative}
                        </span>
                        <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                          {dateInfo.absolute}
                        </span>
                      </div>
                    </div>
                    <p className={`text-xs mt-1.5 truncate leading-tight ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      {post.content_preview}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recently Published Section - Compact */}
        {calendarData.recent_posts && calendarData.recent_posts.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={12} className="text-green-400" />
              <span className={`text-[11px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Published
              </span>
              <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                ({calendarData.recent_posts.length})
              </span>
            </div>
            
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
              {calendarData.recent_posts.slice(0, 5).map((post) => {
                const PlatformIcon = getPlatformIcon(post.platform);
                const colors = getPlatformColor(post.platform);
                const dateInfo = formatDateTime(post.published_date);
                
                const handleViewPost = (e) => {
                  e.stopPropagation();
                  if (post.url) {
                    window.open(post.url, '_blank', 'noopener,noreferrer');
                  }
                };
                
                return (
                  <div
                    key={post.id}
                    className={`p-2.5 rounded-lg border-l-2 ${colors.border} ${isDarkMode ? 'bg-slate-800/40 hover:bg-slate-800/60' : 'bg-gray-50 hover:bg-gray-100'} transition-colors group`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded ${colors.bg} flex items-center justify-center`}>
                          <PlatformIcon size={12} className={colors.text} />
                        </div>
                        <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                          {dateInfo.relative}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* View Post Link - appears on hover */}
                        {post.url && (
                          <button
                            onClick={handleViewPost}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-teal-400 hover:text-teal-300"
                            title="View live post"
                          >
                            <ExternalLink size={10} />
                            <span className="hidden sm:inline">View</span>
                          </button>
                        )}
                        {post.engagement_rate !== null && post.engagement_rate !== undefined ? (
                          <div className="flex items-center gap-1">
                            <TrendingUp size={10} className="text-green-400" />
                            <span className="text-[10px] font-medium text-green-400">
                              {post.engagement_rate}%
                            </span>
                          </div>
                        ) : (
                          <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                            —
                          </span>
                        )}
                      </div>
                    </div>
                    <p 
                      className={`text-xs mt-1.5 truncate leading-tight ${isDarkMode ? 'text-slate-400' : 'text-gray-600'} ${post.url ? 'cursor-pointer hover:text-slate-300' : ''}`}
                      onClick={post.url ? handleViewPost : undefined}
                    >
                      {post.content_title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Drafts Section - Compact */}
        {calendarData.drafts_count > 0 && (
          <div>
            <button
              onClick={() => setShowDrafts(!showDrafts)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                isDarkMode
                  ? 'bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/15'
                  : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText size={12} className="text-yellow-400" />
                <span className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Drafts ({calendarData.drafts_count})
                </span>
              </div>
              <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                {showDrafts ? 'Hide' : 'Show'}
              </span>
            </button>
            
            {showDrafts && calendarData.drafts && (
              <div className="mt-2 space-y-1.5">
                {calendarData.drafts.slice(0, 5).map((draft) => {
                  const PlatformIcon = getPlatformIcon(draft.platform);
                  const colors = getPlatformColor(draft.platform);
                  
                  return (
                    <div
                      key={draft.id}
                      className={`p-2 rounded-lg border ${isDarkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <PlatformIcon size={12} className={colors.text} />
                          <span className={`text-[11px] truncate ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            {draft.title}
                          </span>
                        </div>
                        <button className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0">
                          <Edit size={10} className="text-blue-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {/* Empty State - Compact */}
        {(!calendarData.upcoming_posts || calendarData.upcoming_posts.length === 0) &&
         (!calendarData.recent_posts || calendarData.recent_posts.length === 0) &&
         calendarData.drafts_count === 0 && (
          <div className="text-center py-6">
            <Calendar size={32} className={`mx-auto mb-2 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`} />
            <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
              No scheduled posts or recent activity
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ContentCalendarWidget;
