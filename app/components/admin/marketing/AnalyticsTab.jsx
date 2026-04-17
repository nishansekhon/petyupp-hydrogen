/**
 * AnalyticsTab Component
 * 
 * Handles the Analytics & Performance tab in Marketing Hub including:
 * - Platform cards (Instagram, Facebook, LinkedIn, Twitter, YouTube)
 * - Growth metrics and trends
 * - Engagement rates
 * - Top performing content
 * - Content performance breakdown
 * 
 * @component
 */

import React from 'react';
import { 
  BarChart3, TrendingUp, Users, Heart, DollarSign, 
  RefreshCw, Loader2, Eye
} from 'lucide-react';
import { FaInstagram, FaFacebookF, FaLinkedinIn, FaTwitter, FaYoutube } from 'react-icons/fa';

const AnalyticsTab = ({
  isDarkMode,
  trendsData,
  loadingTrends,
  fetchTrends
}) => {
  // Platform configuration
  const platforms = [
    { key: 'instagram', Icon: FaInstagram, color: 'text-pink-400', bg: 'bg-pink-500/20', border: 'border-pink-500/30', label: 'Instagram' },
    { key: 'facebook', Icon: FaFacebookF, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', label: 'Facebook' },
    { key: 'linkedin', Icon: FaLinkedinIn, color: 'text-blue-500', bg: 'bg-blue-600/20', border: 'border-blue-600/30', label: 'LinkedIn' },
    { key: 'twitter', Icon: FaTwitter, color: 'text-sky-400', bg: 'bg-sky-500/20', border: 'border-sky-500/30', label: 'Twitter' },
    { key: 'youtube', Icon: FaYoutube, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', label: 'YouTube' }
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Analytics & Performance</h2>
            <p className="text-xs text-gray-400">
              30-day analysis • {trendsData?.data_source === 'live' ? <span className="text-green-400">● Live Data</span> : '⚪ Loading...'}
            </p>
          </div>
        </div>
        <button 
          onClick={fetchTrends}
          disabled={loadingTrends}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loadingTrends ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loadingTrends ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        </div>
      ) : (
        <>
          {/* Platform Cards Row - Compact 5 columns */}
          <div className="grid grid-cols-5 gap-3">
            {platforms.map(platform => {
              const platformData = trendsData?.current_metrics?.platforms?.[platform.key] || {};
              const isConnected = platformData.followers > 0;
              
              return (
                <div 
                  key={platform.key}
                  className={`rounded-xl p-3 border ${platform.border} ${isDarkMode ? 'bg-slate-800/50' : 'bg-white'} ${!isConnected ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg ${platform.bg} flex items-center justify-center`}>
                        <platform.Icon className={`w-3.5 h-3.5 ${platform.color}`} />
                      </div>
                      <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{platform.label}</span>
                    </div>
                    {isConnected ? (
                      <span className="text-[9px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded uppercase">Active</span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 bg-slate-500/20 text-slate-400 rounded">—</span>
                    )}
                  </div>
                  
                  {isConnected ? (
                    <div className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {platformData.followers?.toLocaleString() || 0}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">Followers</p>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <span className="text-xs text-slate-500">Not connected</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary Stats Row */}
          <div className="grid grid-cols-4 gap-4">
            <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3 h-3 text-teal-400" />
                <span className="text-xs text-slate-400">Growth Rate</span>
              </div>
              <p className={`text-2xl font-bold ${trendsData?.growth_rate?.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                {trendsData?.growth_rate || '0%'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {trendsData?.growth_rate?.startsWith('+') ? '↑ Trending' : '↓ Declining'}
              </p>
            </div>
            
            <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-slate-400">Total Followers</span>
              </div>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {trendsData?.current_metrics?.total_followers?.toLocaleString() || 0}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Across all platforms</p>
            </div>
            
            <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-3 h-3 text-pink-400" />
                <span className="text-xs text-slate-400">Avg Engagement</span>
              </div>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {trendsData?.current_metrics?.avg_engagement_rate || '0%'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Likes + Comments rate</p>
            </div>
            
            <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-3 h-3 text-green-400" />
                <span className="text-xs text-slate-400">Est. Value</span>
              </div>
              <p className={`text-2xl font-bold text-green-400`}>
                ₹{trendsData?.current_metrics?.estimated_reach_value?.toLocaleString() || 0}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Organic reach value</p>
            </div>
          </div>

          {/* Top Content & Performance */}
          <div className="grid grid-cols-2 gap-4">
            {/* Top Performing Content */}
            <div className={`rounded-xl p-5 border ${isDarkMode ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Top Performing Content
              </h3>
              <div className="space-y-3">
                {(trendsData?.top_content || []).slice(0, 5).map((content, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                      idx === 2 ? 'bg-amber-600/20 text-amber-500' :
                      'bg-slate-700/50 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {content.title || content.caption?.substring(0, 50) || 'Post'}
                      </p>
                      <p className="text-[10px] text-slate-500">{content.platform}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {content.engagement?.toLocaleString() || 0}
                      </p>
                      <p className="text-[10px] text-slate-500">engagements</p>
                    </div>
                  </div>
                ))}
                {(!trendsData?.top_content || trendsData.top_content.length === 0) && (
                  <p className="text-sm text-slate-500 text-center py-4">No content data available</p>
                )}
              </div>
            </div>

            {/* Content Performance Breakdown */}
            <div className={`rounded-xl p-5 border ${isDarkMode ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Content Performance
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Reels/Videos', value: trendsData?.content_breakdown?.reels || 0, total: 100, color: 'bg-pink-500' },
                  { label: 'Images', value: trendsData?.content_breakdown?.images || 0, total: 100, color: 'bg-blue-500' },
                  { label: 'Carousels', value: trendsData?.content_breakdown?.carousels || 0, total: 100, color: 'bg-purple-500' },
                  { label: 'Stories', value: trendsData?.content_breakdown?.stories || 0, total: 100, color: 'bg-amber-500' }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>{item.label}</span>
                      <span className="text-slate-400">{item.value}%</span>
                    </div>
                    <div className={`h-2 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                      <div 
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Best Posting Times */}
          <div className={`rounded-xl p-5 border ${isDarkMode ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Best Posting Times
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                const bestTime = trendsData?.best_times?.[day.toLowerCase()] || '---';
                const isHighEngagement = trendsData?.high_engagement_days?.includes(day.toLowerCase());
                
                return (
                  <div 
                    key={day}
                    className={`p-3 rounded-lg text-center ${
                      isHighEngagement 
                        ? 'bg-teal-500/20 border border-teal-500/30' 
                        : isDarkMode ? 'bg-slate-700/30' : 'bg-gray-100'
                    }`}
                  >
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{day}</p>
                    <p className={`text-sm font-bold mt-1 ${
                      isHighEngagement ? 'text-teal-400' : isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {bestTime}
                    </p>
                    {isHighEngagement && (
                      <p className="text-[9px] text-teal-400 mt-0.5">Peak</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsTab;
