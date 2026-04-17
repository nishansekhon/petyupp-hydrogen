import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { 
  Package, 
  ShoppingBag, 
  Video, 
  DollarSign, 
  Archive,
  ArrowRight,
  Zap,
  X
} from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import axios from 'axios';
import SocialMediaOverviewCard from '@/components/admin/SocialMediaOverviewCard';
import PlatformComparisonWidget from '@/components/admin/PlatformComparisonWidget';
import ContentCalendarWidget from '@/components/admin/ContentCalendarWidget';
import EngagementTrendsWidget from '@/components/admin/EngagementTrendsWidget';
import QuickActionsPanel from '@/components/admin/QuickActionsPanel';
import DraftsCounterCard from '@/components/admin/DraftsCounterCard';
import NextScheduledPostCard from '@/components/admin/NextScheduledPostCard';
import APIUsageWidget from '@/components/admin/APIUsageWidget';

const API_URL = API_BASE_URL + '/api';

// External Links Configuration (Easy to update)
const EXTERNAL_LINKS = {
  googleAnalytics: 'https://analytics.google.com',
  growthAI: 'https://app.growthbar.com',  // Placeholder - update with actual SEO tool
  zuperbook: 'https://www.zuperbooks.com/',  // Zuperbooks - Inventory Management
  instagram: 'https://www.instagram.com/accounts/login/?next=/accounts/insights/',
  facebook: 'https://www.facebook.com/business/insights',
  youtube: 'https://studio.youtube.com/channel/analytics',
  twitter: 'https://analytics.twitter.com'
};

function AdminDashboardPage() {
  const { isDarkMode } = useAdminTheme();
  const [showAPIUsageModal, setShowAPIUsageModal] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    videoReviews: 0,
    todayRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch products count
      const productsRes = await axios.get(`${API_URL}/products`);
      
      // Fetch orders stats
      const ordersRes = await axios.get(`${API_URL}/admin/orders/stats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });

      setStats({
        totalProducts: productsRes.data.length || 0,
        totalOrders: ordersRes.data.total_orders?.all_time || 0,
        videoReviews: 0, // Will be implemented later
        todayRevenue: ordersRes.data.revenue?.today || 0
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickStats = [
    { 
      label: 'Total Products', 
      value: stats.totalProducts, 
      icon: Package, 
      color: 'purple', 
      bgColor: 'bg-purple-500/20',
      textColor: 'text-purple-400',
      link: '/admin/products' 
    },
    { 
      label: 'Total Orders', 
      value: stats.totalOrders, 
      icon: ShoppingBag, 
      color: 'blue', 
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-400',
      link: '/admin/orders' 
    },
    { 
      label: 'Video Reviews', 
      value: stats.videoReviews, 
      icon: Video, 
      color: 'green', 
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-400',
      link: '/admin/videos' 
    },
    { 
      label: 'Today\'s Revenue', 
      value: `₹${stats.todayRevenue.toLocaleString()}`, 
      icon: DollarSign, 
      color: 'yellow', 
      bgColor: 'bg-yellow-500/20',
      textColor: 'text-yellow-400',
      link: '/admin/orders' 
    }
  ];

  const analyticsCards = [
    {
      title: 'Inventory System',
      description: 'Click to manage inventory',
      icon: Archive,
      link: EXTERNAL_LINKS.zuperbook,
      color: 'indigo',
      bgColor: 'bg-indigo-500/20',
      textColor: 'text-indigo-400',
      buttonText: 'Open Zuperbook'
    },
    {
      title: 'API Configuration',
      description: 'Manage external APIs',
      icon: Zap,
      link: '/admin/marketing?tab=settings',
      color: 'pink',
      bgColor: 'bg-pink-500/20',
      textColor: 'text-pink-400',
      buttonText: '🔒 API Settings',
      adminOnly: true
    },
    {
      title: 'API Usage & Budget',
      description: 'Monitor API costs',
      icon: DollarSign,
      link: '#',
      color: 'green',
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-400',
      buttonText: '💰 View Usage',
      adminOnly: true,
      isModal: true
    }
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
          Dashboard
        </h1>
        <p className={isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}>
          Welcome to PetYupp Admin Panel
        </p>
      </div>

      {/* Phase 1: Business Overview */}
      <div className="mb-8">
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
          Business Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => {
            const isModal = stat.isModal;
            const CardWrapper = isModal ? 'div' : Link;
            const wrapperProps = isModal 
              ? { onClick: () => setShowAPIUsageModal(true), style: { cursor: 'pointer' } }
              : { to: stat.link };
            
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CardWrapper {...wrapperProps}>
                  <div className={`backdrop-blur-lg border rounded-2xl p-6 transition-all group cursor-pointer ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 hover:border-white/20' 
                      : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                  }${stat.adminOnly ? (isDarkMode ? ' border-pink-500/30' : ' border-pink-200') : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bgColor}`}>
                        <stat.icon size={24} className={stat.textColor} />
                      </div>
                      <ArrowRight size={20} className={`transition-colors ${
                        isDarkMode 
                          ? 'text-pearl-white/40 group-hover:text-pearl-white' 
                          : 'text-gray-400 group-hover:text-gray-700'
                      }`} />
                    </div>
                    <div className={`text-xl font-bold mb-1 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      {loading ? '...' : stat.value}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                      {stat.label}
                    </div>
                  </div>
                </CardWrapper>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1: 🎯 TODAY'S PRIORITIES (Action Items) */}
      {/* ============================================================ */}
      <div className="mb-8" id="social-media-section">
        <div className="mb-6">
          <h2 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
            🎯 1️⃣ TODAY'S PRIORITIES
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
            What to do right now
          </p>
        </div>

        {/* Widget 5: Quick Actions Panel - MOVED TO TOP */}
        <QuickActionsPanel />

        {/* New: Drafts Counter Card */}
        <DraftsCounterCard 
          draftsCount={5} 
          onShowDrafts={() => {
            const calendarWidget = document.querySelector('[id*="calendar"]');
            if (calendarWidget) calendarWidget.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* New: Next Scheduled Post Card */}
        <NextScheduledPostCard 
          nextPost={{
            platform: "Instagram",
            scheduled_date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
            content_preview: "New product launch - Chewster Premium Treats now available! 🎉",
            content_type: "Image"
          }}
        />
      </div>

      {/* ============================================================ */}
      {/* SECTION 2: 📊 PERFORMANCE INSIGHTS (Understanding) */}
      {/* ============================================================ */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
            📊 2️⃣ PERFORMANCE INSIGHTS
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
            What's working?
          </p>
        </div>

        {/* Widget 1: Social Media Overview Card - MOVED HERE */}
        <SocialMediaOverviewCard />

        {/* Widget 2: Platform Performance Comparison - MOVED HERE */}
        <PlatformComparisonWidget />

        {/* Widget 4: Engagement Trends & Analytics - MOVED HERE */}
        <EngagementTrendsWidget />
      </div>

      {/* ============================================================ */}
      {/* SECTION 3: 📅 CONTENT PLANNING (Planning) */}
      {/* ============================================================ */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
            📅 3️⃣ CONTENT PLANNING
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
            What's next?
          </p>
        </div>

        {/* Widget 3: Content Calendar - MOVED HERE */}
        <ContentCalendarWidget />
      </div>

      {/* ============================================================ */}
      {/* SECTION 4: 🔍 OPTIMIZATION INSIGHTS (Improvement - PLACEHOLDER) */}
      {/* ============================================================ */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
            🔍 4️⃣ OPTIMIZATION INSIGHTS
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
            What to do better?
          </p>
        </div>

        {/* Placeholder for future optimization cards */}
        <div className={`p-6 rounded-2xl border ${
          isDarkMode
            ? 'bg-white/5 border-white/10'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <p className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
            📈 Content Optimization Recommendations and Growth Trajectory coming soon...
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 5: 📈 SEO & BUSINESS (Moved to Marketing Hub) */}
      {/* ============================================================ */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
            📈 5️⃣ SEO & BUSINESS
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
            Reference & technical metrics
          </p>
        </div>

        {/* SEO & Insights moved to Marketing Hub */}
        <Link
          to="/admin/marketing"
          className={`block p-6 rounded-2xl border transition-all group ${
            isDarkMode
              ? 'bg-gradient-to-br from-purple-500/10 to-teal-500/10 border-white/10 hover:border-white/20'
              : 'bg-gradient-to-br from-purple-50 to-teal-50 border-purple-200 hover:border-purple-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                📊 SEO, Analytics & API Insights
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                View SEO scores, Google Search Console data, AI recommendations, and API usage in the Marketing Hub
              </p>
            </div>
            <ArrowRight size={24} className={`transition-transform group-hover:translate-x-1 ${
              isDarkMode ? 'text-teal-400' : 'text-teal-600'
            }`} />
          </div>
        </Link>
      </div>

      {/* Phase 2: Analytics & Insights */}
      <div className="mb-8">
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
          Analytics & Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Inventory System (Full Box - Keep as is) */}
          {analyticsCards.map((card, index) => {
            if (card.title === 'Inventory System') {
              const isExternal = card.link.startsWith('http');
              const CardWrapper = isExternal ? 'a' : Link;
              const linkProps = isExternal 
                ? { href: card.link, target: "_blank", rel: "noopener noreferrer" }
                : { to: card.link };

              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <CardWrapper {...linkProps} className="block">
                    <div className={`p-6 rounded-2xl border backdrop-blur-sm transition-all group ${
                      isDarkMode 
                        ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-white/10 hover:border-white/20' 
                        : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${card.bgColor}`}>
                          <card.icon size={24} className={card.textColor} />
                        </div>
                        <ArrowRight size={20} className={`transition-transform group-hover:translate-x-1 ${
                          isDarkMode ? 'text-pearl-white/40' : 'text-gray-400'
                        }`} />
                      </div>
                      <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                        {card.title}
                      </h3>
                      <p className={`text-sm mb-4 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                        {card.description}
                      </p>
                      <div className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
                        isDarkMode 
                          ? 'bg-white/10 text-pearl-white group-hover:bg-white/20' 
                          : 'bg-gray-100 text-gray-900 group-hover:bg-gray-200'
                      }`}>
                        {card.buttonText}
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </CardWrapper>
                </motion.div>
              );
            }
            return null;
          })}

          {/* Card 2: API Configuration (Compact) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Link to="/admin/marketing?tab=settings">
              <div className={`backdrop-blur-lg border rounded-2xl p-6 transition-all group cursor-pointer ${
                isDarkMode 
                  ? 'bg-white/5 border-white/10 hover:border-white/20 border-pink-500/30' 
                  : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm border-pink-200'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-pink-500/20">
                    <Zap size={24} className="text-pink-400" />
                  </div>
                  <ArrowRight size={20} className={`transition-colors ${
                    isDarkMode 
                      ? 'text-pearl-white/40 group-hover:text-pearl-white' 
                      : 'text-gray-400 group-hover:text-gray-700'
                  }`} />
                </div>
                <div className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  API Configuration
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                  Manage APIs
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Card 3: API Usage & Budget (Compact with Modal) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div 
              onClick={() => setShowAPIUsageModal(true)}
              className={`backdrop-blur-lg border rounded-2xl p-6 transition-all group cursor-pointer ${
                isDarkMode 
                  ? 'bg-white/5 border-white/10 hover:border-white/20 border-green-500/30' 
                  : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm border-green-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-500/20">
                  <DollarSign size={24} className="text-green-400" />
                </div>
                <ArrowRight size={20} className={`transition-colors ${
                  isDarkMode 
                    ? 'text-pearl-white/40 group-hover:text-pearl-white' 
                    : 'text-gray-400 group-hover:text-gray-700'
                }`} />
              </div>
              <div className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                API Usage & Budget
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                Monitor costs
              </div>
            </div>
          </motion.div>
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
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
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

export default AdminDashboardPage;
