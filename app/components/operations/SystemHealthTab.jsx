import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '@/config/api';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { 
  RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock, 
  Download, Database, Server, Globe, Activity, Shield,
  ExternalLink, AlertOctagon
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = API_BASE_URL;

const SystemHealthTab = () => {
  const { isDarkMode } = useAdminTheme();
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef(null);

  const fetchHealthCheck = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/health-check`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Health check failed');
      
      const data = await response.json();
      setHealthData(data);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Health check error:', error);
      toast.error('Failed to fetch health check data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthCheck();
  }, [fetchHealthCheck]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchHealthCheck, 30000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, fetchHealthCheck]);

  const exportJSON = () => {
    if (!healthData) return;
    const dataStr = JSON.stringify(healthData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `health-check-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'healthy':
      case 'ok':
      case 'pass':
      case 'connected':
      case 'active':
      case 'configured':
      case 'accessible':
      case 'running':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
            <CheckCircle className="w-3 h-3" /> {status.toUpperCase()}
          </span>
        );
      case 'degraded':
      case 'slow':
      case 'warning':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
            <AlertTriangle className="w-3 h-3" /> {status.toUpperCase()}
          </span>
        );
      case 'critical':
      case 'error':
      case 'fail':
      case 'disconnected':
      case 'missing':
      case 'not_configured':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
            <XCircle className="w-3 h-3" /> {status.toUpperCase()}
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 text-xs font-medium">
            {status?.toUpperCase() || 'UNKNOWN'}
          </span>
        );
    }
  };

  const getOverallStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-emerald-500';
      case 'degraded': return 'bg-amber-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  if (loading && !healthData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
        <span className="ml-3 text-slate-400">Running health checks...</span>
      </div>
    );
  }

  const isPreviewUrl = healthData?.deployment?.backend_url?.includes('preview') || 
                       !healthData?.deployment?.backend_url?.includes('oyebark.com');

  return (
    <div className="space-y-6">
      {/* Critical Warning Banner */}
      {isPreviewUrl && healthData?.deployment?.backend_url !== 'not_set' && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertOctagon className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-400 font-bold text-lg">CRITICAL: Backend URL is pointing to preview environment</h3>
              <p className="text-red-300 text-sm mt-1">
                Current URL: <code className="bg-red-500/30 px-2 py-0.5 rounded">{healthData?.deployment?.backend_url}</code>
              </p>
              <p className="text-red-300 text-sm mt-1">
                All API calls will fail on production. Fix immediately in deployment settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className={`rounded-2xl border p-4 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              System Health Monitor
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Real-time monitoring of system components
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Overall Status */}
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${getOverallStatusColor(healthData?.overall_status)}`} />
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {healthData?.overall_status?.toUpperCase() || 'CHECKING'}
              </span>
            </div>
            
            {/* Last Checked */}
            <div className="flex items-center gap-1 text-sm text-slate-400">
              <Clock className="w-4 h-4" />
              <span>
                {lastChecked ? lastChecked.toLocaleTimeString() : '--:--:--'}
              </span>
            </div>
            
            {/* Auto Refresh Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-teal-500 focus:ring-teal-500"
              />
              <span className="text-sm text-slate-400">Auto-refresh</span>
            </label>
            
            {/* Refresh Button */}
            <button
              onClick={fetchHealthCheck}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Deployment Info */}
      <div className={`rounded-2xl border p-4 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <Server className="w-5 h-5 text-teal-400" /> Deployment Info
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
            <p className="text-xs text-slate-400 mb-1">Environment</p>
            <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {healthData?.deployment?.environment?.toUpperCase() || '--'}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${healthData?.deployment?.backend_url_status === 'error' ? 'bg-red-500/20 border border-red-500/50' : isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
            <p className="text-xs text-slate-400 mb-1">Backend URL</p>
            <p className={`font-mono text-xs break-all ${healthData?.deployment?.backend_url_status === 'error' ? 'text-red-400' : isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {healthData?.deployment?.backend_url || '--'}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
            <p className="text-xs text-slate-400 mb-1">Last Deploy</p>
            <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {healthData?.deployment?.last_deploy ? new Date(healthData.deployment.last_deploy).toLocaleString() : '--'}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
            <p className="text-xs text-slate-400 mb-1">Python Version</p>
            <p className={`font-mono ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {healthData?.deployment?.python_version || '--'}
            </p>
          </div>
        </div>
      </div>

      {/* Database Statistics */}
      <div className={`rounded-2xl border p-4 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <Database className="w-5 h-5 text-teal-400" /> Database Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
            <p className="text-xs text-slate-400 mb-1">Status</p>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${healthData?.database?.status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {healthData?.database?.status?.toUpperCase() || '--'}
              </p>
            </div>
          </div>
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
            <p className="text-xs text-slate-400 mb-1">Response Time</p>
            <p className={`font-mono ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {healthData?.database?.response_time_ms || 0} ms
            </p>
          </div>
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
            <p className="text-xs text-slate-400 mb-1">Collections</p>
            <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {healthData?.database?.collections_count?.toLocaleString() || 0}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
            <p className="text-xs text-slate-400 mb-1">Total Documents</p>
            <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {healthData?.database?.documents_count?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      </div>

      {/* API Endpoints */}
      <div className={`rounded-2xl border p-4 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <Globe className="w-5 h-5 text-teal-400" /> API Endpoints
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`text-left text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                <th className="pb-3 font-medium">Endpoint</th>
                <th className="pb-3 font-medium">Response Time</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {healthData?.api_endpoints?.map((endpoint, index) => (
                <tr key={index} className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{endpoint.name}</span>
                      <code className="text-xs text-slate-400 hidden md:inline">{endpoint.endpoint}</code>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`font-mono text-sm ${endpoint.response_time_ms > 2000 ? 'text-amber-400' : ''}`}>
                      {endpoint.response_time_ms} ms
                    </span>
                  </td>
                  <td className="py-3">
                    {endpoint.status_code === 200 ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium w-fit">
                        <CheckCircle className="w-3 h-3" /> 200 OK
                      </span>
                    ) : endpoint.status === 'slow' ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium w-fit">
                        <Clock className="w-3 h-3" /> SLOW
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium w-fit">
                        <XCircle className="w-3 h-3" /> ERR {endpoint.status_code || ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Services Grid */}
      <div className={`rounded-2xl border p-4 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <Activity className="w-5 h-5 text-teal-400" /> Services
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {healthData?.external_services && Object.entries(healthData.external_services).map(([name, data]) => (
            <div key={name} className={`p-3 rounded-xl text-center ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
              <p className="text-xs text-slate-400 mb-2 capitalize">{name.replace('_', ' ')}</p>
              {getStatusBadge(data.status)}
            </div>
          ))}
        </div>
      </div>

      {/* SEO Health */}
      <div className={`rounded-2xl border p-4 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <Shield className="w-5 h-5 text-teal-400" /> SEO Health
        </h3>
        <div className="space-y-3">
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
            <p className="text-sm text-slate-400">Sitemap URL Count: <span className="text-white font-semibold">{healthData?.seo_health?.sitemap_url_count || 0}</span></p>
          </div>
          {healthData?.seo_health?.checks?.map((check, index) => (
            <div key={index} className={`flex items-center justify-between p-3 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
              <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{check.name}</span>
              {getStatusBadge(check.status)}
            </div>
          ))}
        </div>
      </div>

      {/* Warnings and Errors */}
      {(healthData?.warnings?.length > 0 || healthData?.errors?.length > 0) && (
        <div className={`rounded-2xl border p-4 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <AlertTriangle className="w-5 h-5 text-amber-400" /> Issues
          </h3>
          <div className="space-y-2">
            {healthData?.errors?.map((error, index) => (
              <div key={`err-${index}`} className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-red-300">{error}</span>
              </div>
            ))}
            {healthData?.warnings?.map((warning, index) => (
              <div key={`warn-${index}`} className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-amber-300">{warning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={fetchHealthCheck}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 rounded-lg text-sm font-medium transition-colors border border-teal-500/30"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Test Endpoints
        </button>
        <button
          onClick={exportJSON}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-600"
        >
          <Download className="w-4 h-4" />
          Export JSON
        </button>
        <button
          onClick={() => window.open('/api/admin/health-check', '_blank')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-600"
        >
          <ExternalLink className="w-4 h-4" />
          View Raw API
        </button>
      </div>
    </div>
  );
};

export default SystemHealthTab;
