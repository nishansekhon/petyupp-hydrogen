import React from 'react';
import { Link } from 'react-router';
import { 
  Archive, Settings, Key, DollarSign, RefreshCw, Zap, 
  ChevronRight, ExternalLink, BarChart3, Loader2
} from 'lucide-react';

const EXTERNAL_LINKS = {
  zuperbook: 'https://app.zuper.co/login',
  metricool: 'https://app.metricool.com/app/planning/list#instagram'
};

const InsightsTab = ({ 
  isDarkMode, 
  apis, 
  loadingApis, 
  fetchAPIs,
  usageStats,
  loadingUsage,
  fetchUsageStats
}) => {
  return (
    <div className="space-y-6">
      {/* Top Row - 4 Simple Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Inventory System Card */}
        <a href={EXTERNAL_LINKS.zuperbook} target="_blank" rel="noopener noreferrer"
          className={`block backdrop-blur-lg border rounded-2xl p-5 transition-all group ${
            isDarkMode 
              ? 'bg-gradient-to-br from-indigo-500/20 to-slate-500/10 border-slate-700 hover:border-indigo-500/50' 
              : 'bg-gradient-to-br from-indigo-50 to-slate-50 border-indigo-200 hover:border-indigo-400'
          }`}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-500/20 mb-4">
            <Archive size={24} className="text-indigo-400" />
          </div>
          <h3 className={`text-base font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Inventory System
          </h3>
          <p className={`text-xs mb-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Manage stock, purchase orders & suppliers
          </p>
          <div className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg ${
            isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700'
          }`}>
            Open Zuperbook
            <ExternalLink size={12} />
          </div>
        </a>

        {/* API Settings Card - Direct Link - PROMINENT */}
        <Link
          to="/admin/marketing?tab=settings"
          className={`block backdrop-blur-lg border-2 rounded-2xl p-6 transition-all group hover:scale-[1.02] ${
            isDarkMode 
              ? 'bg-gradient-to-br from-teal-500/30 to-cyan-500/20 border-teal-500/50 hover:border-teal-400' 
              : 'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-300 hover:border-teal-500'
          }`}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-teal-500/30">
              <Settings size={28} className="text-teal-400" />
            </div>
            <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
              isDarkMode ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-100 text-teal-700'
            }`}>
              8 APIs Active
            </span>
          </div>
          <h3 className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            API Settings
          </h3>
          <p className={`text-xs mb-1 font-medium ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
            Google, Metricool, Razorpay keys
          </p>
          <p className={`text-xs mb-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Configure & test all external integrations
          </p>
          <div className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white transition-colors shadow-lg shadow-teal-500/20">
            Open Settings
            <ChevronRight size={14} />
          </div>
        </Link>

        {/* Team Credentials Card - Direct Link - PROMINENT */}
        <Link
          to="/admin/marketing?tab=settings#credentials"
          className={`block backdrop-blur-lg border-2 rounded-2xl p-6 transition-all group hover:scale-[1.02] ${
            isDarkMode 
              ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/20 border-purple-500/50 hover:border-purple-400' 
              : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300 hover:border-purple-500'
          }`}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-purple-500/30">
              <Key size={28} className="text-purple-400" />
            </div>
            <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
              isDarkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
            }`}>
              18 Logins Saved
            </span>
          </div>
          <h3 className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Team Credentials
          </h3>
          <p className={`text-xs mb-1 font-medium ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
            Platform logins & passwords
          </p>
          <p className={`text-xs mb-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Instagram, Cloudinary, Amazon & more
          </p>
          <div className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors shadow-lg shadow-purple-500/20">
            View Credentials
            <ChevronRight size={14} />
          </div>
        </Link>

        {/* API Usage & Budget Card - Inline Stats */}
        <div className={`backdrop-blur-lg border rounded-2xl p-5 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-green-500/20 to-teal-500/10 border-slate-700' 
            : 'bg-gradient-to-br from-green-50 to-teal-50 border-green-200'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-500/20">
              <DollarSign size={24} className="text-green-400" />
            </div>
            <button onClick={fetchUsageStats} disabled={loadingUsage}
              className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
              <RefreshCw size={14} className={`${loadingUsage ? 'animate-spin' : ''} ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} />
            </button>
          </div>
          <h3 className={`text-base font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            API Usage & Budget
          </h3>
          <p className={`text-xs mb-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Monitor API costs & token usage
          </p>
          
          {loadingUsage ? (
            <div className="text-center py-2">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-green-400" />
            </div>
          ) : usageStats ? (
            <div className={`space-y-1.5 text-xs p-2 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white'}`}>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>This Week</span>
                <span className="font-bold text-green-400">₹{usageStats.weekly?.total_cost_inr?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-slate-500' : 'text-gray-500'}>Tokens Used</span>
                <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                  {((usageStats.weekly?.total_tokens_in || 0) + (usageStats.weekly?.total_tokens_out || 0)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-slate-500' : 'text-gray-500'}>Requests</span>
                <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                  {usageStats.weekly?.request_count || 0}
                </span>
              </div>
            </div>
          ) : (
            <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>No usage data yet</p>
          )}
        </div>
      </div>

      {/* Connected APIs Status Table */}
      <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <Zap size={20} className="text-yellow-400" />
            Connected APIs Status
          </h3>
          <button onClick={fetchAPIs} disabled={loadingApis}
            className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 ${
              isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            <RefreshCw size={12} className={loadingApis ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {loadingApis ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-400" />
          </div>
        ) : apis.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {apis.slice(0, 9).map((api, idx) => {
              const apiName = api.api_name || api.name || 'Unknown API';
              const apiType = api.api_type || api.category || 'service';
              const apiStatus = api.status || 'unknown';
              
              return (
                <div key={idx} className={`p-3 rounded-lg border ${
                  isDarkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {apiName}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      apiStatus === 'active' 
                        ? 'bg-green-500/20 text-green-400' 
                        : apiStatus === 'error'
                          ? 'bg-red-500/20 text-red-400'
                          : apiStatus === 'configured'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {apiStatus === 'active' ? 'success' : apiStatus}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 capitalize ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {apiType.replace(/_/g, ' ')}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`text-center py-8 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            <Settings className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No APIs configured yet</p>
            <Link 
              to="/admin/marketing?tab=settings"
              className="text-teal-400 text-sm hover:underline mt-2 inline-block"
            >
              Configure APIs →
            </Link>
          </div>
        )}
      </div>

      {/* Usage Breakdown by Feature */}
      {usageStats && usageStats.by_feature && Object.keys(usageStats.by_feature).length > 0 && (
        <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
          isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <BarChart3 size={20} className="text-blue-400" />
            Usage Breakdown by Feature
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(usageStats.by_feature).map(([feature, data]) => (
              <div key={feature} className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
                <p className={`text-xs font-medium mb-1 capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {feature.replace(/_/g, ' ')}
                </p>
                <p className={`text-lg font-bold ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                  {data.request_count}
                </p>
                <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                  requests
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightsTab;
