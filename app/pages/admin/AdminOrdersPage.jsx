import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, TrendingUp, DollarSign, Clock, Eye, XCircle, CheckCircle, Truck, Trash2 } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminAuthContext';
import OrderDetailModal from '@/components/admin/OrderDetailModal';
import axios from 'axios';
import { API_BASE_URL } from '@/utils/api';

const API_URL = API_BASE_URL + '/api';

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  processing: 'bg-purple-500/20 text-purple-400',
  shipped: 'bg-indigo-500/20 text-indigo-400',
  out_for_delivery: 'bg-cyan-500/20 text-cyan-400',
  delivered: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
  returned: 'bg-orange-500/20 text-orange-400'
};

const PAYMENT_METHOD_LABELS = {
  cod: 'COD',
  upi: 'UPI',
  card: 'Card',
  netbanking: 'Net Banking',
  wallet: 'Wallet'
};

function AdminOrdersPage() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { getToken } = useAdmin();

  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    payment_method: '',
    payment_status: '',
    date_range: 'all',
    search: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total_count: 0,
    total_pages: 0
  });

  useEffect(() => {
    fetchStats();
    fetchOrders();
  }, [filters, pagination.page]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/orders/stats`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === 'all') {
          delete params[key];
        }
      });

      const response = await axios.get(`${API_URL}/admin/orders`, {
        params,
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });

      setOrders(response.data.orders);
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination
      }));
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleDeleteOrder = async (order) => {
    const orderId = order.id || order.order_id || order._id;
    const displayId = order.id?.slice(0, 8) || order.order_id || orderId;
    
    if (!window.confirm(`Are you sure you want to delete order #${displayId}? This cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await axios.delete(`${API_URL}/admin/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      
      if (response.data.success) {
        // Remove from local state
        setOrders(orders.filter(o => (o.id || o._id) !== (order.id || order._id)));
        // Show success message (if toast is available)
        console.log('Order deleted successfully');
        // Refresh the list
        fetchOrders();
      }
    } catch (error) {
      console.error('Failed to delete order:', error);
      alert('Failed to delete order. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="p-4">
      {/* Compact Header with Inline Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-xl font-semibold text-pearl-white">Order Management</h1>
            <p className="text-xs text-pearl-white/60">Track and manage customer orders</p>
          </div>
          
          {/* Inline Stats Bar */}
          {stats && (
            <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-cyber-lime" />
                <span className="text-xs font-medium text-pearl-white/70">
                  {stats.total_orders?.today || 0} Today
                </span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-deep-purple" />
                <span className="text-xs font-medium text-pearl-white/70">
                  {formatCurrency(stats.revenue?.today || 0)}
                </span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-medium text-pearl-white/70">
                  {stats.orders_by_status?.shipped || 0} Shipped
                </span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs font-medium text-pearl-white/70">
                  {stats.orders_by_status?.pending || 0} Pending
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Stats Row */}
      {stats && (
        <div className="lg:hidden flex items-center justify-around mb-4 p-2 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-cyber-lime" />
            <span className="text-xs font-medium text-pearl-white/70">{stats.total_orders?.today || 0}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-deep-purple" />
            <span className="text-xs font-medium text-pearl-white/70">{formatCurrency(stats.revenue?.today || 0)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs font-medium text-pearl-white/70">{stats.orders_by_status?.delivered || 0}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-medium text-pearl-white/70">{stats.orders_by_status?.pending || 0}</span>
          </div>
        </div>
      )}

      {/* Compact Filters */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Filter className="w-3.5 h-3.5 text-cyber-lime" />
          <span className="text-xs font-medium text-pearl-white">Filters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-pearl-white/40 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search orders..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-pearl-white placeholder:text-pearl-white/40 focus:border-cyber-lime focus:outline-none"
              />
            </div>
          </div>

          {/* Order Status */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-pearl-white focus:border-cyber-lime focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="returned">Returned</option>
          </select>

          {/* Payment Method */}
          <select
            value={filters.payment_method}
            onChange={(e) => handleFilterChange('payment_method', e.target.value)}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-pearl-white focus:border-cyber-lime focus:outline-none"
          >
            <option value="">All Methods</option>
            <option value="cod">COD</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="netbanking">Net Banking</option>
            <option value="wallet">Wallet</option>
          </select>

          {/* Payment Status */}
          <select
            value={filters.payment_status}
            onChange={(e) => handleFilterChange('payment_status', e.target.value)}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-pearl-white focus:border-cyber-lime focus:outline-none"
          >
            <option value="">All Payment</option>
            <option value="pending">Pending</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Orders Table - Compact Design */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-pearl-white/60 uppercase tracking-wider">Order ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-pearl-white/60 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-pearl-white/60 uppercase tracking-wider">Items</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-pearl-white/60 uppercase tracking-wider">Total</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-pearl-white/60 uppercase tracking-wider">Payment</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-pearl-white/60 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-pearl-white/60 uppercase tracking-wider">Date</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-pearl-white/60 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-sm text-pearl-white/60">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-sm text-pearl-white/60">
                    No orders found
                  </td>
                </tr>
              ) : orders && orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-cyber-lime">
                        #{order.id?.slice(0, 8) || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-pearl-white font-medium">
                        {order.user_name || order.shipping_address?.name || 'N/A'}
                      </div>
                      <div className="text-xs text-pearl-white/50">
                        {order.user_phone || order.shipping_address?.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-pearl-white/70">
                        {order.items?.length || 0} items
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-pearl-white">
                        {formatCurrency(order.total)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-pearl-white/70">
                        {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}
                      </div>
                      <div className={`text-xs ${
                        order.payment_status === 'success' ? 'text-green-400' :
                        order.payment_status === 'failed' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {order.payment_status || 'pending'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.order_status] || 'bg-slate-500/20 text-slate-400'}`}>
                        {order.order_status === 'delivered' && <CheckCircle className="w-3 h-3" />}
                        {order.order_status === 'pending' && <Clock className="w-3 h-3" />}
                        {order.order_status === 'cancelled' && <XCircle className="w-3 h-3" />}
                        {formatStatus(order.order_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-pearl-white/60">
                        {formatDate(order.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-deep-purple/20 transition-colors opacity-0 group-hover:opacity-100"
                          title="View Order"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-300 hover:text-deep-purple" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order)}
                          className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete Order"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-slate-300 hover:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-sm text-pearl-white/60">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Compact Pagination */}
        {pagination.total_pages > 1 && (
          <div className="px-4 py-3 bg-white/5 border-t border-white/10 flex items-center justify-between">
            <p className="text-xs text-pearl-white/50">
              {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total_count)} of {pagination.total_count}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-2.5 py-1 rounded text-xs font-medium bg-white/10 text-pearl-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
              >
                Prev
              </button>
              <span className="px-2.5 py-1 rounded text-xs font-medium bg-cyber-lime/20 text-cyber-lime">
                {pagination.page} / {pagination.total_pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.total_pages}
                className="px-2.5 py-1 rounded text-xs font-medium bg-white/10 text-pearl-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedOrder(null);
          }}
          onStatusUpdate={fetchOrders}
        />
      )}
    </div>
  );
}

export default AdminOrdersPage;
