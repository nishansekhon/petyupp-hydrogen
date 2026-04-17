import React, { useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router';
import { useAdmin } from '@/contexts/AdminAuthContext';
import { AdminThemeProvider, useAdminTheme } from '@/contexts/AdminThemeContext';
import { motion } from 'framer-motion';
import { Package, ShoppingBag, Video, Sun, Moon, BookOpen, Store, Image, MapPin, Share2, Film, Bot, Megaphone, DollarSign, TrendingUp, Settings } from 'lucide-react';
import { LOGO } from '@/constants/brand';
import SeasonalLogo from '@/components/SeasonalLogo';

// Import Admin Theme CSS
import '@/styles/admin-theme.css';

function AdminLayoutContent() {
  const { isAdmin, loading, logout } = useAdmin();
  const { isDarkMode, toggleTheme } = useAdminTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/admin/login');
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <SeasonalLogo 
            logoSrc={LOGO.white} 
            alt={LOGO.alt}
            logoHeight={48}
            className="animate-pulse"
          />
          <div className="text-slate-400 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`admin-layout-wrapper min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Admin Navbar - Slimmer & Modern */}
      <nav className={`admin-navbar ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border-b px-4 py-2 sticky top-0 z-50 backdrop-blur-xl`} style={{height: '56px'}}>
        <div className="max-w-7xl mx-auto flex items-center justify-between h-full">
          {/* Logo + Nav Links Container */}
          <div className="flex items-center gap-6">
            {/* Logo - Compact - Clickable to Marketing Hub */}
            <Link to="/admin/marketing" className="flex items-center gap-3 shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
              <SeasonalLogo 
                logoSrc={LOGO.white} 
                alt={LOGO.alt}
                logoHeight={32}
              />
              <div>
                <h1 className={`font-black text-sm leading-tight ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Admin</h1>
              </div>
            </Link>

            {/* Nav Links - Compact with Teal accent - Reordered with Marketing first */}
            <div className="hidden md:flex items-center gap-1">
            <Link 
              to="/admin/marketing" 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                location.pathname === '/admin/marketing'
                  ? 'bg-teal-500/20 text-teal-500'
                  : isDarkMode 
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Megaphone size={16} />
              Marketing
            </Link>
            <Link 
              to="/admin/sales" 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                location.pathname === '/admin/sales' || location.pathname.startsWith('/admin/sales?')
                  ? 'bg-teal-500/20 text-teal-500'
                  : isDarkMode 
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <DollarSign size={16} />
              Sales
            </Link>
            <Link 
              to="/admin/profitability" 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                location.pathname === '/admin/profitability' || location.pathname.startsWith('/admin/profitability?')
                  ? 'bg-teal-500/20 text-teal-500'
                  : isDarkMode 
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <TrendingUp size={16} />
              Profitability
            </Link>
            <Link 
              to="/admin/operations" 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                location.pathname === '/admin/operations' || location.pathname.startsWith('/admin/operations?')
                  ? 'bg-teal-500/20 text-teal-500'
                  : isDarkMode 
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Package size={16} />
              Operations
            </Link>
            <Link 
              to="/admin/ai-content-hub" 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                location.pathname.startsWith('/admin/ai-content-hub')
                  ? 'bg-teal-500/20 text-teal-500'
                  : isDarkMode 
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              data-testid="nav-ai-content-hub"
            >
              <Bot size={16} />
              AI Hub
            </Link>
            {/* Retail link hidden - functionality in Sales Hub */}
            {/* <Link 
              to="/admin/retail-visits" 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                location.pathname.startsWith('/admin/retail-visits')
                  ? 'bg-teal-500/20 text-teal-500'
                  : isDarkMode 
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Store size={16} />
              Retail
            </Link> */}
            {/* Syndication link hidden - moved to Marketing Hub */}
            {/* <Link 
              to="/admin/syndication" 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive('/admin/syndication')
                  ? 'bg-teal-500/20 text-teal-500'
                  : isDarkMode 
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Share2 size={16} />
              Syndication
            </Link> */}
            {/* Videos link hidden - moved to Marketing Hub */}
            {/* <Link 
              to="/admin/videos" 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive('/admin/videos')
                  ? 'bg-teal-500/20 text-teal-500'
                  : isDarkMode 
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Video size={16} />
              Videos
            </Link> */}
            {/* Reels link hidden - moved to Marketing Hub */}
            {/* <Link 
              to="/admin/bark-reels" 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive('/admin/bark-reels')
                  ? 'bg-teal-500/20 text-teal-500'
                  : isDarkMode 
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Film size={16} />
              Reels
            </Link> */}
            {/* Blog link hidden - now in Marketing Hub as AI Blog tab */}
            {/* <Link 
              to="/admin/blog" 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive('/admin/blog')
                  ? 'bg-teal-500/20 text-teal-500'
                  : isDarkMode 
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <BookOpen size={16} />
              Blog
            </Link> */}
            {/* Orders link hidden - moved to Operations Hub */}
            {/* <Link 
              to="/admin/orders" 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive('/admin/orders')
                  ? 'bg-teal-500/20 text-teal-500'
                  : isDarkMode 
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ShoppingBag size={16} />
              Orders
            </Link> */}
            {/* Bundles link hidden - moved to Operations Hub */}
            {/* <Link 
              to="/admin/bundles" 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive('/admin/bundles')
                  ? 'bg-teal-500/20 text-teal-500'
                  : isDarkMode 
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Package size={16} />
              Bundles
            </Link> */}
            <Link 
              to="/admin/settings" 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive('/admin/settings')
                  ? 'bg-teal-500/20 text-teal-500'
                  : isDarkMode 
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Settings size={16} />
              Settings
            </Link>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              className={`p-1.5 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-slate-100'
                  : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </motion.button>

            <a 
              href="/" 
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs transition-colors ${
                isDarkMode 
                  ? 'text-slate-400 hover:text-teal-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              View Site →
            </a>
            <motion.button
              onClick={logout}
              className={`px-3 py-1.5 rounded-lg transition-colors text-xs font-medium ${
                isDarkMode 
                  ? 'bg-teal-500 hover:bg-teal-600 text-white'
                  : 'bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-700'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Logout
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-6 py-8 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
        <Outlet />
      </main>
    </div>
  );
}

function AdminLayout() {
  return (
    <AdminThemeProvider>
      <AdminLayoutContent />
    </AdminThemeProvider>
  );
}

export default AdminLayout;
