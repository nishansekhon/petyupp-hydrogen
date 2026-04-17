import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';
import { useSearchParams } from 'react-router';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { Package, ShoppingCart, Gift, AlertTriangle, Layers, Clock, RefreshCw, Megaphone, Send, BarChart3, Beaker, HeartPulse, Tag } from 'lucide-react';
import { toast } from 'sonner';

// Import existing page components
import AdminProductsPage from './AdminProductsPage';
import AdminOrdersPage from './AdminOrdersPage';
import BundlesPage from './BundlesPage';
import AdCampaignsTab from '@/components/operations/AdCampaignsTab';
import TelegramOutreachTab from '@/components/operations/TelegramOutreachTab';
import WeeklyReportTab from '@/components/operations/WeeklyReportTab';
import RDLabTab from '@/components/operations/RDLabTab';
import SystemHealthTab from '@/components/operations/SystemHealthTab';
import PromoCodesTab from '@/components/operations/PromoCodesTab';

const API_URL = API_BASE_URL;

const OperationsHub = () => {
  const { isDarkMode } = useAdminTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Overview data state
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    activeBundles: 0,
    lowStock: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'overview', Icon: Layers, label: 'Overview' },
    { id: 'products', Icon: Package, label: 'Products' },
    { id: 'orders', Icon: ShoppingCart, label: 'Orders' },
    { id: 'bundles', Icon: Gift, label: 'Bundles' },
    { id: 'promo-codes', Icon: Tag, label: 'Promo Codes' },
    { id: 'ad-campaigns', Icon: Megaphone, label: 'Ad Campaigns' },
    { id: 'telegram', Icon: Send, label: 'Telegram Outreach' },
    { id: 'weekly-report', Icon: BarChart3, label: 'Weekly Report' },
    { id: 'rd-lab', Icon: Beaker, label: 'R&D Lab' },
    { id: 'system-health', Icon: HeartPulse, label: 'System Health' },
  ];

  // Fetch overview data using Promise.allSettled for resilient loading
  const fetchOverviewData = useCallback(async () => {
    if (activeTab !== 'overview') return;
    
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    const headers = { 'Authorization': `Bearer ${token}` };

    // Make all API calls in parallel, handle failures individually
    const [productsResult, ordersResult, bundlesResult] = await Promise.allSettled([
      fetch(`${API_URL}/api/admin/products`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/api/admin/orders`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/api/bundles`).then(r => r.json())
    ]);

    // Process products
    let products = [];
    let productsError = false;
    if (productsResult.status === 'fulfilled' && !productsResult.value?.detail) {
      const data = productsResult.value;
      products = Array.isArray(data) ? data : (data.products || []);
    } else {
      productsError = true;
    }

    // Process orders  
    let orders = [];
    let ordersError = false;
    if (ordersResult.status === 'fulfilled' && !ordersResult.value?.detail) {
      const data = ordersResult.value;
      orders = Array.isArray(data) ? data : (data.orders || []);
    } else {
      ordersError = true;
    }

    // Process bundles
    let bundles = [];
    let bundlesError = false;
    if (bundlesResult.status === 'fulfilled' && !bundlesResult.value?.detail) {
      const data = bundlesResult.value;
      bundles = Array.isArray(data) ? data : (data.bundles || []);
    } else {
      bundlesError = true;
    }

    // Calculate low stock (stock < 10)
    const lowStockItems = products.filter(p => {
      const stock = p.stock ?? p.quantity ?? p.inventory ?? 0;
      return stock < 10;
    });

    // Get recent 5 orders - sort by date
    const sortedOrders = [...orders].sort((a, b) => 
      new Date(b.created_at || b.createdAt || b.date || 0) - new Date(a.created_at || a.createdAt || a.date || 0)
    );
    
    setStats({
      totalProducts: products.length,
      totalOrders: orders.length,
      activeBundles: bundles.filter(b => b.is_active !== false).length,
      lowStock: lowStockItems.length,
      productsError,
      ordersError,
      bundlesError
    });
    
    setRecentOrders(sortedOrders.slice(0, 5));
    setLowStockProducts(lowStockItems.slice(0, 5));
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab !== 'overview') {
      setSearchParams({ tab: activeTab });
    } else {
      setSearchParams({});
    }
  }, [activeTab, setSearchParams]);

  // Sync tab with URL on mount
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabs.some(t => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'delivered' || statusLower === 'completed') return 'text-green-400 bg-green-400/10';
    if (statusLower === 'processing' || statusLower === 'confirmed') return 'text-blue-400 bg-blue-400/10';
    if (statusLower === 'pending') return 'text-yellow-400 bg-yellow-400/10';
    if (statusLower === 'cancelled' || statusLower === 'failed') return 'text-red-400 bg-red-400/10';
    return 'text-slate-400 bg-slate-400/10';
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Operations
          </h1>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Products, Orders & Bundles
          </p>
        </div>

        {/* Tab Navigation */}
        <div className={`flex gap-1 p-1 rounded-lg mb-4 ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
          {tabs.map((tab) => {
            const Icon = tab.Icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-teal-500 text-white'
                    : isDarkMode 
                      ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
                data-testid={`operations-tab-${tab.id}`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            {/* Stat Cards - Compact */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {/* Total Products */}
              <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Package className="w-3.5 h-3.5 text-teal-400" />
                  <span className={`text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Products
                  </span>
                </div>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {loading ? '...' : stats.totalProducts}
                </div>
                {stats.productsError && <span className={`text-[9px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>(unable to load)</span>}
              </div>

              {/* Total Orders */}
              <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <ShoppingCart className="w-3.5 h-3.5 text-blue-400" />
                  <span className={`text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Orders
                  </span>
                </div>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {loading ? '...' : stats.totalOrders}
                </div>
                {stats.ordersError && <span className={`text-[9px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>(unable to load)</span>}
              </div>

              {/* Active Bundles */}
              <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Gift className="w-3.5 h-3.5 text-purple-400" />
                  <span className={`text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Bundles
                  </span>
                </div>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {loading ? '...' : stats.activeBundles}
                </div>
                {stats.bundlesError && <span className={`text-[9px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>(unable to load)</span>}
              </div>

              {/* Low Stock */}
              <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                  <span className={`text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Low Stock
                  </span>
                </div>
                <div className={`text-2xl font-bold ${stats.lowStock > 0 ? 'text-orange-400' : isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {loading ? '...' : stats.lowStock}
                </div>
              </div>
            </div>

            {/* Two-column layout: Recent Orders + Low Stock Alert */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recent Orders */}
              <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <h3 className={`text-xs font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Recent Orders
                    </h3>
                  </div>
                  <button 
                    onClick={fetchOverviewData}
                    className={`p-1 rounded ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                  >
                    <RefreshCw className={`w-3 h-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} />
                  </button>
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
                  </div>
                ) : recentOrders.length === 0 ? (
                  <p className={`text-xs text-center py-6 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    No orders yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentOrders.map((order, idx) => (
                      <div 
                        key={order._id || order.id || idx}
                        className={`flex items-center justify-between p-2 rounded ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            #{order.order_id || order.id || `ORD-${(order._id || '').slice(-6).toUpperCase()}`}
                          </div>
                          <div className={`text-[10px] truncate ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            {order.customer_name || order.shipping_address?.name || order.shipping?.fullName || order.user_name || 'Guest'}
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <div className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(order.total || order.total_amount)}
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${getStatusColor(order.status || order.order_status)}`}>
                            {order.status || order.order_status || 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Low Stock Alert */}
              <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <h3 className={`text-xs font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Low Stock Alert
                  </h3>
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
                  </div>
                ) : lowStockProducts.length === 0 ? (
                  <p className={`text-xs text-center py-6 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    All products have sufficient stock
                  </p>
                ) : (
                  <div className="space-y-2">
                    {lowStockProducts.map((product, idx) => {
                      const stock = product.stock ?? product.quantity ?? product.inventory ?? 0;
                      return (
                        <div 
                          key={product._id || product.id || idx}
                          className={`flex items-center justify-between p-2 rounded ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {product.name || product.title}
                            </div>
                            <div className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                              SKU: {product.sku || '-'}
                            </div>
                          </div>
                          <div className={`text-sm font-bold ml-2 ${stock === 0 ? 'text-red-400' : 'text-orange-400'}`}>
                            {stock}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && <AdminProductsPage />}
        {activeTab === 'orders' && <AdminOrdersPage />}
        {activeTab === 'bundles' && <BundlesPage />}
        {activeTab === 'promo-codes' && <PromoCodesTab />}
        {activeTab === 'ad-campaigns' && <AdCampaignsTab />}
        {activeTab === 'telegram' && <TelegramOutreachTab />}
        {activeTab === 'weekly-report' && <WeeklyReportTab />}
        {activeTab === 'rd-lab' && <RDLabTab />}
        {activeTab === 'system-health' && <SystemHealthTab />}
      </div>
    </div>
  );
};

export default OperationsHub;
