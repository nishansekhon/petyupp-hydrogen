import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { motion } from 'framer-motion';
import { Store, MapPin, Users, TrendingUp, Search, Plus, Filter, RefreshCw, DollarSign, X } from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { useNavigate } from 'react-router';
import axios from 'axios';
import APIUsageWidget from '@/components/admin/APIUsageWidget';

const API_URL = API_BASE_URL + '/api';

function RetailDashboardPage() {
  const { isDarkMode } = useAdminTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStores: 0,
    qualifiedCount: 0,
    allStores: 0,
    hasTiers: false,
    pendingVisits: 0,
    activeAgents: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [showAPIUsageModal, setShowAPIUsageModal] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/retail/stores`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Filter only qualified stores (TIER 1-4)
      const allStores = response.data.stores || [];
      const qualifiedStores = allStores.filter(store => 
        store.tier && ['TIER 1', 'TIER 2', 'TIER 3', 'TIER 4'].includes(store.tier)
      );
      
      // If no stores have tier assigned yet, count all as pending qualification
      const hasAnyTiers = allStores.some(s => s.tier);
      
      setStats({
        totalStores: hasAnyTiers ? qualifiedStores.length : allStores.length, // Qualified or all if no tiers
        qualifiedCount: qualifiedStores.length,
        allStores: response.data.total_stores || 0, // Total in database
        hasTiers: hasAnyTiers,
        pendingVisits: response.data.stores?.filter(s => s.visit_status === 'not_visited').length || 0,
        activeAgents: 0, // Will be implemented in Phase 2
        conversionRate: 0 // Will be calculated in Phase 2
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      title: stats.hasTiers ? 'Qualified Stores' : 'Total Stores',
      subtitle: stats.hasTiers ? `${stats.qualifiedCount} / ${stats.allStores}` : null,
      value: stats.totalStores,
      note: !stats.hasTiers ? 'Pending Qualification' : 'TIER 1-4 only',
      icon: Store,
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50',
      textColor: 'text-blue-500',
      onClick: () => navigate('/admin/retail-visits/stores')
    },
    {
      title: 'Pending Visits',
      value: stats.pendingVisits,
      icon: MapPin,
      gradient: 'from-orange-500 to-red-500',
      bgColor: isDarkMode ? 'bg-orange-500/10' : 'bg-orange-50',
      textColor: 'text-orange-500',
      onClick: () => navigate('/admin/retail-visits/stores')
    },
    {
      title: 'Active Agents',
      value: stats.activeAgents,
      icon: Users,
      gradient: 'from-purple-500 to-pink-500',
      bgColor: isDarkMode ? 'bg-purple-500/10' : 'bg-purple-50',
      textColor: 'text-purple-500',
      onClick: () => navigate('/admin/retail-visits/agents')
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-500',
      bgColor: isDarkMode ? 'bg-green-500/10' : 'bg-green-50',
      textColor: 'text-green-500',
      onClick: () => navigate('/admin/retail-visits/agents')
    }
  ];

  const quickActions = [
    {
      title: 'Search Stores',
      description: 'Find and add stores from Google Places',
      icon: Search,
      route: '/admin/retail-visits/search',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'View All Stores',
      description: 'Manage existing stores in database',
      icon: Store,
      route: '/admin/retail-visits/stores',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Sales Intelligence',
      description: 'E-commerce & Retail analytics dashboard',
      icon: TrendingUp,
      route: '/admin/sales-intelligence',
      gradient: 'from-cyan-500 to-blue-500'
    },
    {
      title: 'Sales Forecast',
      description: 'Revenue projections and store intelligence',
      icon: TrendingUp,
      route: '/admin/retail-visits/forecast',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      title: 'Manage Routes',
      description: 'Create and assign daily routes',
      icon: MapPin,
      route: '/admin/retail-visits/routes',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Agent Performance',
      description: 'View agent metrics and rankings',
      icon: Users,
      route: '/admin/retail-visits/agents',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      title: 'API Usage & Budget',
      description: 'Monitor costs',
      icon: DollarSign,
      route: null,
      gradient: 'from-green-500 to-emerald-500',
      isModal: true
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className={`text-lg ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
          <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
          🏪 Retail Visit Management
        </h1>
        <p className={`mt-2 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
          Manage retail stores, routes, and agent performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={card.onClick}
            className={`${
              isDarkMode
                ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                : 'bg-white border border-gray-200 hover:bg-gray-50'
            } rounded-2xl p-6 backdrop-blur-xl hover:shadow-lg transition-all cursor-pointer group`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bgColor}`}>
                <card.icon className={card.textColor} size={24} />
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${card.bgColor} ${card.textColor} font-semibold`}>
                Phase 1
              </span>
            </div>
            <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
              {card.title}
            </h3>
            <p className={`text-xl font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
              {card.value}
            </p>
            {card.note && (
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-pearl-white/50' : 'text-gray-500'}`}>
                ({card.note})
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className={`text-xl font-black mb-4 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => {
                if (action.disabled) return;
                if (action.isModal) {
                  setShowAPIUsageModal(true);
                } else {
                  navigate(action.route);
                }
              }}
              disabled={action.disabled}
              whileHover={action.disabled ? {} : { scale: 1.02 }}
              whileTap={action.disabled ? {} : { scale: 0.98 }}
              className={`${
                isDarkMode
                  ? 'bg-gradient-to-br from-white/10 to-white/5 border border-white/10 hover:from-white/15 hover:to-white/10'
                  : 'bg-white border border-gray-200 hover:shadow-lg'
              } rounded-2xl p-6 text-left transition-all ${
                action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${action.gradient} mb-4`}>
                <action.icon className="text-white" size={24} />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                {action.title}
                {action.disabled && (
                  <span className="ml-2 text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500">
                    Phase 2
                  </span>
                )}
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                {action.description}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Recent Activity - Placeholder for Phase 2 */}
      <div className={`${
        isDarkMode
          ? 'bg-white/5 border border-white/10'
          : 'bg-white border border-gray-200'
      } rounded-2xl p-6`}>
        <h2 className={`text-xl font-black mb-4 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
          Recent Activity
        </h2>
        <div className="text-center py-8">
          <p className={`${isDarkMode ? 'text-pearl-white/40' : 'text-gray-400'}`}>
            Visit and route activity will appear here in Phase 2
          </p>
        </div>
      </div>

      {/* API Usage Modal */}
      {showAPIUsageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
             onClick={() => setShowAPIUsageModal(false)}>
          <div className={`max-w-2xl w-full rounded-2xl shadow-2xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`} onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  API Usage & Budget
                </h2>
                <button
                  onClick={() => setShowAPIUsageModal(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                  }`}
                >
                  <X size={20} className={isDarkMode ? 'text-pearl-white' : 'text-gray-900'} />
                </button>
              </div>
              <APIUsageWidget />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RetailDashboardPage;
