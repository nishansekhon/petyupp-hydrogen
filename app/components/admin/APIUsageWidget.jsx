import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API_URL = API_BASE_URL + '/api';

function APIUsageWidget() {
  const { isDarkMode } = useAdminTheme();
  const [stats, setStats] = useState({});
  const [cacheMetrics, setCacheMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsageStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken'); // Changed from 'admin_token' to 'adminToken'
      
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      // Fetch both API usage stats and cache performance metrics
      const [usageResponse, cacheResponse] = await Promise.all([
        axios.get(`${API_URL}/admin/api-usage/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/admin/cache/performance`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (usageResponse.data.success) {
        setStats(usageResponse.data.stats);
        setError(null);
      } else {
        setError(usageResponse.data.error || 'Failed to fetch usage stats');
      }

      if (cacheResponse.data.success) {
        setCacheMetrics(cacheResponse.data.metrics);
      }
    } catch (err) {
      console.error('Error fetching API usage stats:', err);
      // Don't show error to user if it's an auth issue
      if (err.response?.status === 403) {
        setError('Not authorized');
      } else {
        setError('Failed to load API usage statistics');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageStats();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchUsageStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ok':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'exceeded':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok':
        return <CheckCircle size={16} />;
      case 'warning':
        return <AlertTriangle size={16} />;
      case 'exceeded':
        return <AlertTriangle size={16} />;
      default:
        return <TrendingUp size={16} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ok':
        return 'Healthy';
      case 'warning':
        return 'Warning: 80% Used';
      case 'exceeded':
        return 'Budget Exceeded!';
      default:
        return 'Unknown';
    }
  };

  if (loading && Object.keys(stats).length === 0) {
    return (
      <div className={`p-6 rounded-2xl border backdrop-blur-sm ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-white/10' 
          : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-2xl border backdrop-blur-sm ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-white/10' 
        : 'bg-white border-gray-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-lg font-bold flex items-center gap-2 ${
            isDarkMode ? 'text-pearl-white' : 'text-gray-900'
          }`}>
            <DollarSign size={20} className="text-green-400" />
            💰 API Usage & Budget
          </h3>
          <p className={`text-xs mt-1 ${
            isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'
          }`}>
            Real-time usage tracking and budget monitoring
          </p>
        </div>
        <button
          onClick={fetchUsageStats}
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

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* API Usage Cards */}
      <div className="space-y-4">
        {/* Google Places API */}
        {stats.google_places && (
          <div className={`p-4 rounded-xl border ${
            isDarkMode 
              ? 'bg-white/5 border-white/10' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className={`font-semibold ${
                  isDarkMode ? 'text-pearl-white' : 'text-gray-900'
                }`}>
                  {stats.google_places.api_name}
                </h4>
                <p className={`text-xs mt-0.5 ${
                  isDarkMode ? 'text-pearl-white/50' : 'text-gray-500'
                }`}>
                  Store search API
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 border ${
                getStatusColor(stats.google_places.status)
              }`}>
                {getStatusIcon(stats.google_places.status)}
                {getStatusText(stats.google_places.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className={`text-xs ${isDarkMode ? 'text-pearl-white/50' : 'text-gray-500'}`}>
                  Calls Today
                </p>
                <p className={`text-xl font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  {stats.google_places.calls_today}
                </p>
              </div>
              <div>
                <p className={`text-xs ${isDarkMode ? 'text-pearl-white/50' : 'text-gray-500'}`}>
                  This Month
                </p>
                <p className={`text-xl font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  {stats.google_places.calls_this_month}
                </p>
              </div>
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className={isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}>
                  Budget Used
                </span>
                <span className={`font-semibold ${
                  stats.google_places.budget_used_percent >= 100 ? 'text-red-400' :
                  stats.google_places.budget_used_percent >= 80 ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {stats.google_places.budget_used_percent}%
                </span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-200'
              }`}>
                <div
                  className={`h-full transition-all ${
                    stats.google_places.budget_used_percent >= 100 ? 'bg-red-500' :
                    stats.google_places.budget_used_percent >= 80 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(stats.google_places.budget_used_percent, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className={isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}>
                ₹{stats.google_places.cost_this_month_inr.toFixed(2)} / ₹{stats.google_places.budget_monthly_inr}
              </span>
              <span className={`font-semibold ${
                stats.google_places.budget_remaining_inr > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {stats.google_places.budget_remaining_inr > 0 ? '₹' : '-₹'}
                {Math.abs(stats.google_places.budget_remaining_inr).toFixed(2)} remaining
              </span>
            </div>
          </div>
        )}

        {/* Metricool API */}
        {stats.metricool && (
          <div className={`p-4 rounded-xl border ${
            isDarkMode 
              ? 'bg-white/5 border-white/10' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className={`font-semibold ${
                  isDarkMode ? 'text-pearl-white' : 'text-gray-900'
                }`}>
                  {stats.metricool.api_name}
                </h4>
                <p className={`text-xs mt-0.5 ${
                  isDarkMode ? 'text-pearl-white/50' : 'text-gray-500'
                }`}>
                  Social media analytics
                </p>
              </div>
              <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Free Tier
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className={`text-xs ${isDarkMode ? 'text-pearl-white/50' : 'text-gray-500'}`}>
                  Calls Today
                </p>
                <p className={`text-xl font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  {stats.metricool.calls_today}
                </p>
              </div>
              <div>
                <p className={`text-xs ${isDarkMode ? 'text-pearl-white/50' : 'text-gray-500'}`}>
                  This Month
                </p>
                <p className={`text-xl font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  {stats.metricool.calls_this_month}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* COMPACT: Cache Performance & Cost Savings in 2-column grid */}
        {cacheMetrics && cacheMetrics.cache_performance && cacheMetrics.cost_savings && (
          <div className="grid grid-cols-2 gap-3">
            {/* SECTION 1: Cache Performance (Compact) */}
            <div className={`p-3 rounded-lg border ${
              isDarkMode 
                ? 'bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30' 
                : 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200'
            }`}>
              <div className="flex items-center gap-1 mb-2">
                <span className="text-lg">📊</span>
                <h4 className={`text-xs font-bold ${
                  isDarkMode ? 'text-pearl-white' : 'text-gray-900'
                }`}>
                  CACHE PERFORMANCE
                </h4>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                    Hit Rate
                  </span>
                  <span className={`text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {cacheMetrics.cache_performance.cache_hit_rate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                    Calls Reduced
                  </span>
                  <span className={`text-lg font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {cacheMetrics.cache_performance.api_calls_reduced_percent}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                    Speed
                  </span>
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    {cacheMetrics.cache_performance.response_time_speedup}x ⚡
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 2: Cost Savings (Compact) */}
            <div className={`p-3 rounded-lg border ${
              isDarkMode 
                ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30' 
                : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
            }`}>
              <div className="flex items-center gap-1 mb-2">
                <span className="text-lg">💰</span>
                <h4 className={`text-xs font-bold ${
                  isDarkMode ? 'text-pearl-white' : 'text-gray-900'
                }`}>
                  COST SAVINGS
                </h4>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                    Today
                  </span>
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    ₹{cacheMetrics.cost_savings.today_savings_inr.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                    This Month
                  </span>
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    ₹{cacheMetrics.cost_savings.monthly_savings_inr.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                    Projected
                  </span>
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                    ₹{cacheMetrics.cost_savings.projected_monthly_savings_inr.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: Comparison (Full width, more compact) */}
        {cacheMetrics && cacheMetrics.comparison && (
          <div className={`p-3 rounded-lg border ${
            isDarkMode 
              ? 'bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30' 
              : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'
          }`}>
            <div className="flex items-center gap-1 mb-2">
              <span className="text-lg">⚖️</span>
              <h4 className={`text-xs font-bold ${
                isDarkMode ? 'text-pearl-white' : 'text-gray-900'
              }`}>
                WITHOUT vs WITH CACHE
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Without Cache */}
              <div className={`p-2 rounded ${
                isDarkMode ? 'bg-red-500/10' : 'bg-red-50'
              }`}>
                <p className={`text-xs font-semibold mb-1 ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                  WITHOUT
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-pearl-white/70' : 'text-gray-700'}`}>
                  {cacheMetrics.comparison.without_cache.total_calls} calls
                </p>
                <p className={`text-lg font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  ₹{cacheMetrics.comparison.without_cache.cost_inr.toFixed(2)}
                </p>
              </div>

              {/* With Cache */}
              <div className={`p-2 rounded ${
                isDarkMode ? 'bg-green-500/10' : 'bg-green-50'
              }`}>
                <p className={`text-xs font-semibold mb-1 ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                  WITH ✅
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-pearl-white/70' : 'text-gray-700'}`}>
                  {cacheMetrics.comparison.with_cache.api_calls} API + {cacheMetrics.comparison.with_cache.cache_hits} cache
                </p>
                <p className={`text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  ₹{cacheMetrics.comparison.with_cache.cost_inr.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Savings Summary */}
            <div className={`mt-2 p-2 rounded border ${
              isDarkMode 
                ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-400/50' 
                : 'bg-gradient-to-r from-green-100 to-blue-100 border-green-400'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                  SAVINGS: {cacheMetrics.comparison.savings_percent.toFixed(1)}%
                </span>
                <span className={`text-lg font-bold ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                  ₹{cacheMetrics.comparison.savings_inr.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default APIUsageWidget;
