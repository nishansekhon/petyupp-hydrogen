import React, { useState } from 'react';
import { API_BASE_URL } from '@/config/api';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import axios from 'axios';

const API_URL = API_BASE_URL + '/api';

const MetricoolDiagnostics = () => {
  const { isDarkMode } = useAdminTheme();
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runDiagnostics = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('adminToken');
      
      const response = await axios.get(`${API_URL}/social-media/diagnostics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setDiagnostics(response.data);
    } catch (err) {
      console.error('Error running diagnostics:', err);
      setError(err.message || 'Failed to run diagnostics');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'success') return <CheckCircle className="text-green-400" size={20} />;
    if (status === 'error' || status === 'failed') return <XCircle className="text-red-400" size={20} />;
    return <AlertCircle className="text-yellow-400" size={20} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`backdrop-blur-lg border rounded-2xl p-6 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-orange-500/20 to-red-500/10 border-white/10' 
          : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
            🔧 Metricool API Diagnostics
          </h3>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
            Check API configuration and connectivity
          </p>
        </div>
        <button
          onClick={runDiagnostics}
          disabled={loading}
          className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
            isDarkMode
              ? 'bg-white/10 text-pearl-white hover:bg-white/20'
              : 'bg-white text-gray-900 hover:bg-gray-100'
          } disabled:opacity-50`}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {diagnostics ? 'Re-run' : 'Run Diagnostics'}
        </button>
      </div>

      {/* Initial State */}
      {!diagnostics && !loading && !error && (
        <div className="text-center py-8">
          <p className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
            Click "Run Diagnostics" to check Metricool API configuration
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className={`mt-4 text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
            Running diagnostics...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
          <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            {error}
          </p>
        </div>
      )}

      {/* Diagnostics Results */}
      {diagnostics && !loading && (
        <div className="space-y-4">
          {/* Timestamp */}
          <div className={`text-xs ${isDarkMode ? 'text-pearl-white/40' : 'text-gray-500'}`}>
            Last checked: {new Date(diagnostics.timestamp).toLocaleString()}
          </div>

          {/* Status Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Environment */}
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                  Environment
                </span>
              </div>
              <p className={`text-sm font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                {diagnostics.environment}
              </p>
            </div>

            {/* Token Status */}
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}>
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(diagnostics.token_present ? 'success' : 'failed')}
                <span className={`text-xs font-semibold ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                  Token Status
                </span>
              </div>
              <p className={`text-sm font-bold ${
                diagnostics.token_present 
                  ? isDarkMode ? 'text-green-400' : 'text-green-600'
                  : isDarkMode ? 'text-red-400' : 'text-red-600'
              }`}>
                {diagnostics.token_present ? `Configured (${diagnostics.token_prefix})` : 'Not Set'}
              </p>
            </div>

            {/* API Configuration */}
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}>
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(diagnostics.metricool_configured ? 'success' : 'failed')}
                <span className={`text-xs font-semibold ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                  Metricool Configured
                </span>
              </div>
              <p className={`text-sm font-bold ${
                diagnostics.metricool_configured 
                  ? isDarkMode ? 'text-green-400' : 'text-green-600'
                  : isDarkMode ? 'text-red-400' : 'text-red-600'
              }`}>
                {diagnostics.metricool_configured ? 'Yes' : 'No'}
              </p>
            </div>

            {/* API Connectivity */}
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}>
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(diagnostics.api_connectivity)}
                <span className={`text-xs font-semibold ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                  API Connectivity
                </span>
              </div>
              <p className={`text-sm font-bold ${
                diagnostics.api_connectivity === 'success'
                  ? isDarkMode ? 'text-green-400' : 'text-green-600'
                  : isDarkMode ? 'text-red-400' : 'text-red-600'
              }`}>
                {diagnostics.api_connectivity.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Error Details */}
          {diagnostics.error && (
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
              <h4 className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                ⚠️ Error Details
              </h4>
              <p className={`text-xs font-mono ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>
                {diagnostics.error}
              </p>
            </div>
          )}

          {/* User Info (if successful) */}
          {diagnostics.user_info && (
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
              <h4 className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                ✅ Connected Successfully
              </h4>
              <pre className={`text-xs font-mono ${isDarkMode ? 'text-green-300' : 'text-green-600'} overflow-x-auto`}>
                {JSON.stringify(diagnostics.user_info, null, 2)}
              </pre>
            </div>
          )}

          {/* Recommendations */}
          <div className={`p-4 rounded-lg border ${
            isDarkMode 
              ? 'bg-blue-500/10 border-blue-500/20' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <h4 className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
              💡 Troubleshooting Guide
            </h4>
            <ul className={`text-xs space-y-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
              {!diagnostics.token_present && (
                <li>• Set <code className="font-mono bg-black/20 px-1 rounded">METRICOOL_API_TOKEN</code> in your backend .env file</li>
              )}
              {diagnostics.token_present && diagnostics.api_connectivity !== 'success' && (
                <>
                  <li>• Verify your Metricool API token is valid and active</li>
                  <li>• Check if your server can access external APIs (firewall/network restrictions)</li>
                  <li>• Confirm the token has proper permissions in Metricool dashboard</li>
                  <li>• Restart your backend service after updating environment variables</li>
                </>
              )}
              {diagnostics.api_connectivity === 'success' && (
                <li>✅ Everything is configured correctly! Your dashboard should show live data.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MetricoolDiagnostics;
