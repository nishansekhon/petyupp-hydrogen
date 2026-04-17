import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { motion } from 'framer-motion';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, Award, Clock, RefreshCw, Target, Zap } from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import axios from 'axios';

const API_URL = API_BASE_URL + '/api';

const COLORS = {
  reel: '#FF6384',
  image: '#36A2EB',
  carousel: '#FFCE56',
  video: '#4BC0C0'
};

const EngagementTrendsWidget = () => {
  const { isDarkMode } = useAdminTheme();
  const [trendsData, setTrendsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState(null);

  useEffect(() => {
    fetchTrendsData();
  }, []);

  const fetchTrendsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/social-media/trends?days=30`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setTrendsData(response.data);
        setDataSource(response.data.data_source || 'unknown');
        setError(null);
      } else {
        setError(response.data.error || 'Failed to fetch trends data');
      }
    } catch (err) {
      console.error('Error fetching trends data:', err);
      setError('Failed to load trends data');
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = (trendData) => {
    if (!trendData || !Array.isArray(trendData)) return [];
    return trendData.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
  };

  const formatContentPerformanceData = (contentPerf) => {
    if (!contentPerf || !contentPerf.by_type) return [];
    return Object.entries(contentPerf.by_type).map(([type, data]) => ({
      name: type,
      value: data.percentage,
      engagement: data.avg_engagement,
      count: data.count
    }));
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
            Loading engagement trends...
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
          onClick={fetchTrendsData}
          className="mt-4 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!trendsData) return null;

  const chartData = formatChartData(trendsData.trend_data);
  const contentPerfData = formatContentPerformanceData(trendsData.content_performance);
  const metrics = trendsData.metrics || {};
  const contentPerf = trendsData.content_performance || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
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
                <BarChart3 size={20} className="text-purple-400" />
                📈 Engagement Trends & Analytics
              </h3>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                30-day performance analysis and insights
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
            onClick={fetchTrendsData}
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

        {/* Growth Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-green-400" />
              <span className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                Growth Rate
              </span>
            </div>
            <div className={`text-2xl font-black ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
              +{metrics.current_growth_percentage}%
            </div>
            <div className="text-xs text-green-400 font-semibold mt-1">
              Trending {metrics.trending_direction === 'up' ? '↑' : '↓'}
            </div>
          </div>

          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gradient-to-br from-green-50 to-emerald-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-blue-400" />
              <span className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                Avg Engagement
              </span>
            </div>
            <div className={`text-2xl font-black ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
              {metrics.avg_engagement_rate}%
            </div>
            <div className={`text-xs ${isDarkMode ? 'text-pearl-white/40' : 'text-gray-500'} mt-1`}>
              30-day average
            </div>
          </div>

          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gradient-to-br from-yellow-50 to-orange-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Award size={16} className="text-yellow-400" />
              <span className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                Best Day
              </span>
            </div>
            <div className={`text-sm font-black ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
              {new Date(metrics.best_day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <div className={`text-xs ${isDarkMode ? 'text-pearl-white/40' : 'text-gray-500'} mt-1`}>
              {metrics.best_day_engagement} engagement
            </div>
          </div>

          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gradient-to-br from-pink-50 to-purple-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-purple-400" />
              <span className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                WoW Growth
              </span>
            </div>
            <div className={`text-2xl font-black ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
              +{metrics.week_over_week_change}%
            </div>
            <div className={`text-xs ${isDarkMode ? 'text-pearl-white/40' : 'text-gray-500'} mt-1`}>
              Week over week
            </div>
          </div>
        </div>

        {/* 30-Day Trends Chart */}
        <div className="mb-6">
          <h4 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
            <TrendingUp size={16} className="text-blue-400" />
            30-Day Follower & Engagement Trends
          </h4>
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#ffffff20' : '#00000020'} />
                <XAxis 
                  dataKey="date" 
                  stroke={isDarkMode ? '#ffffff60' : '#00000060'}
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  yAxisId="left"
                  stroke={isDarkMode ? '#ffffff60' : '#00000060'}
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke={isDarkMode ? '#ffffff60' : '#00000060'}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#ffffff20' : '#00000020'}`,
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="followers" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8', r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="engagement" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  dot={{ fill: '#82ca9d', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Content Performance Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Pie Chart */}
          <div>
            <h4 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
              <Award size={16} className="text-yellow-400" />
              Content Type Performance
            </h4>
            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={contentPerfData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {contentPerfData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase()] || '#999999'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Stats */}
          <div>
            <h4 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
              <Target size={16} className="text-blue-400" />
              Content Rankings
            </h4>
            <div className="space-y-3">
              {/* Best Performer */}
              <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Award size={16} className="text-green-400" />
                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      🥇 Best: {contentPerf.best_type}
                    </span>
                  </div>
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                  Avg: {contentPerf.by_type?.[contentPerf.best_type]?.avg_engagement || 0} engagement
                </div>
              </div>

              {/* Worst Performer */}
              <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingDown size={16} className="text-red-400" />
                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      🥉 Needs Work: {contentPerf.worst_type}
                    </span>
                  </div>
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                  Avg: {contentPerf.by_type?.[contentPerf.worst_type]?.avg_engagement || 0} engagement
                </div>
              </div>

              {/* All Types Breakdown */}
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                <div className={`text-xs font-semibold mb-3 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                  Performance by Type:
                </div>
                {Object.entries(contentPerf.by_type || {})
                  .sort((a, b) => b[1].avg_engagement - a[1].avg_engagement)
                  .map(([type, data], index) => (
                    <div key={type} className="flex items-center justify-between mb-2">
                      <span className={`text-xs ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                        {type}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            style={{ width: `${(data.avg_engagement / 450) * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                          {data.avg_engagement}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Optimal Posting Times */}
        <div>
          <h4 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
            <Clock size={16} className="text-purple-400" />
            Optimal Posting Times
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trendsData.optimal_times && Object.entries(trendsData.optimal_times).map(([platform, data]) => (
              <div key={platform} className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                    {platform}
                  </span>
                  <span className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                    Peak: {data.peak_hours || data}
                  </span>
                </div>
                {data.by_day && (
                  <div className="space-y-1">
                    {Object.entries(data.by_day).slice(0, 3).map(([day, times]) => {
                      const maxTime = Math.max(...Object.values(times));
                      const bestPeriod = Object.entries(times).reduce((a, b) => times[a[0]] > times[b[0]] ? a : b);
                      return (
                        <div key={day} className="flex items-center justify-between text-xs">
                          <span className={isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}>
                            {day.slice(0, 3)}
                          </span>
                          <span className={`font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                            {bestPeriod[0]}: {bestPeriod[1]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Comparative Analysis */}
        {trendsData.comparative_analysis && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <h4 className={`text-sm font-bold mb-4 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
              Comparative Growth
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-blue-50'}`}>
                <div className={`text-xs mb-2 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                  Week over Week
                </div>
                <div className="space-y-1">
                  {Object.entries(trendsData.comparative_analysis.week_over_week).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className={isDarkMode ? 'text-pearl-white' : 'text-gray-900'}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </span>
                      <span className={`font-semibold ${value > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {value > 0 ? '+' : ''}{value}% {value > 0 ? '↑' : '↓'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-purple-50'}`}>
                <div className={`text-xs mb-2 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                  Month over Month
                </div>
                <div className="space-y-1">
                  {Object.entries(trendsData.comparative_analysis.month_over_month).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className={isDarkMode ? 'text-pearl-white' : 'text-gray-900'}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </span>
                      <span className={`font-semibold ${value > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {value > 0 ? '+' : ''}{value}% {value > 0 ? '↑' : '↓'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EngagementTrendsWidget;
