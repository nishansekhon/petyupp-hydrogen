import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './CachePerformanceDashboard.css';

const BACKEND_URL = API_BASE_URL;

export const CachePerformanceDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadDashboardData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use comprehensive endpoint for one optimized call
      const response = await fetch(`${BACKEND_URL}/api/cache/dashboard`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setDashboardData(data);
      setLastRefresh(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleExport = () => {
    // Export to JSON (can be enhanced to PDF)
    const dataStr = JSON.stringify(dashboardData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cache-performance-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    // Copy metrics summary to clipboard
    const summary = `
Cache Performance Dashboard - ${new Date().toLocaleDateString()}

Hit Rate: ${dashboardData?.cache_stats?.hit_rate}%
Monthly Savings: ₹${dashboardData?.cost_savings?.this_month}
Speed Boost: ${dashboardData?.performance?.speedup}x
API Calls Prevented: ${dashboardData?.api_calls_reduction?.prevented_calls}
    `.trim();

    navigator.clipboard.writeText(summary).then(() => {
      alert('Metrics copied to clipboard!');
    });
  };

  if (loading && !dashboardData) {
    return (
      <div className="cache-dashboard loading-container">
        <div className="loading-spinner"></div>
        <p>Loading cache performance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cache-dashboard error-container">
        <h2>❌ Error Loading Dashboard</h2>
        <p>{error}</p>
        <button onClick={loadDashboardData} className="retry-button">
          🔄 Retry
        </button>
      </div>
    );
  }

  const stats = dashboardData?.cache_stats || {};
  const savings = dashboardData?.cost_savings || {};
  const performance = dashboardData?.performance || {};
  const trends = dashboardData?.trends_7days || {};
  const reduction = dashboardData?.api_calls_reduction || {};

  return (
    <div className="cache-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>💾 Cache Performance Dashboard</h1>
          <p className="subtitle">Real-time cache analytics and cost savings</p>
        </div>
        <div className="header-right">
          <span className="last-refresh">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <KPICard
          title="Cache Hit Rate"
          value={`${stats.hit_rate || 0}%`}
          subtitle={`Target: 75% | ${stats.status || 'Loading...'}`}
          trend={stats.trend || '+0%'}
          icon="⚡"
          color="blue"
        />
        <KPICard
          title="Monthly Savings"
          value={`₹${savings.this_month || 0}`}
          subtitle={`Projected: ₹${savings.projected || 0}`}
          trend={`Annual: ₹${savings.annual || 0}`}
          icon="💰"
          color="green"
        />
        <KPICard
          title="Speed Boost"
          value={`${performance.speedup || 0}x`}
          subtitle={performance.improvement || 'faster'}
          trend={`${performance.avg_cache_time || 0}ms cache`}
          icon="🚀"
          color="purple"
        />
        <KPICard
          title="API Calls Prevented"
          value={reduction.prevented_calls || 0}
          subtitle={`${reduction.reduction_percent || 0}% reduction`}
          trend={`₹${reduction.cost_saved || 0} saved`}
          icon="🎯"
          color="coral"
        />
      </div>

      {/* Trend Chart */}
      <div className="chart-container">
        <h2>📈 7-Day Hit Rate Trend</h2>
        <div className="chart-info">
          <span>Average: {trends.average || 0}%</span>
          <span className={`trend ${trends.trend?.startsWith('+') ? 'positive' : 'negative'}`}>
            Trend: {trends.trend || '+0%'}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trends.daily || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="date" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #444' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="hit_rate" 
              stroke="#60a5fa" 
              strokeWidth={2}
              name="Hit Rate %" 
              dot={{ fill: '#60a5fa', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Metrics Table */}
      <div className="table-container">
        <h2>📊 Detailed Metrics</h2>
        <table className="metrics-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
              <th>Impact</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Searches</td>
              <td>{stats.total_searches || 0}</td>
              <td>📊 Baseline</td>
            </tr>
            <tr>
              <td>Cache Hits</td>
              <td>{stats.cache_hits || 0}</td>
              <td>✅ Reused</td>
            </tr>
            <tr>
              <td>Cache Misses</td>
              <td>{stats.cache_misses || 0}</td>
              <td>🔌 API calls</td>
            </tr>
            <tr>
              <td>API Response Time</td>
              <td>{performance.avg_api_time || 0}ms</td>
              <td>🐢 Slow</td>
            </tr>
            <tr>
              <td>Cache Response Time</td>
              <td>{performance.avg_cache_time || 0}ms</td>
              <td>⚡ Fast</td>
            </tr>
            <tr>
              <td>Cost Saved Today</td>
              <td>₹{savings.today || 0}</td>
              <td>💚 Daily savings</td>
            </tr>
            <tr>
              <td>Cost Per Query</td>
              <td>₹{savings.cost_per_query || 0}</td>
              <td>💵 Unit cost</td>
            </tr>
            <tr>
              <td>Queries Prevented (Month)</td>
              <td>{savings.queries_prevented_month || 0}</td>
              <td>🎯 Optimization</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="actions">
        <button onClick={handleRefresh} className="action-button refresh">
          🔄 Refresh Now
        </button>
        <button onClick={handleExport} className="action-button export">
          📥 Export Data
        </button>
        <button onClick={handleShare} className="action-button share">
          📤 Share Metrics
        </button>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, subtitle, trend, icon, color }) => (
  <div className={`kpi-card ${color}`}>
    <div className="kpi-icon">{icon}</div>
    <div className="kpi-content">
      <h3>{title}</h3>
      <p className="kpi-value">{value}</p>
      {subtitle && <p className="kpi-subtitle">{subtitle}</p>}
      {trend && <p className="kpi-trend">{trend}</p>}
    </div>
  </div>
);

export default CachePerformanceDashboard;
