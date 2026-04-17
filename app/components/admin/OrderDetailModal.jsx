import React, { useState } from 'react';
import { API_BASE_URL } from '@/config/api';
import { motion } from 'framer-motion';
import { X, Package, MapPin, CreditCard, Clock, Save, Ban } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminAuthContext';
import axios from 'axios';

const API_URL = API_BASE_URL + '/api';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'confirmed', label: 'Confirmed', color: 'blue' },
  { value: 'processing', label: 'Processing', color: 'purple' },
  { value: 'shipped', label: 'Shipped', color: 'indigo' },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: 'cyan' },
  { value: 'delivered', label: 'Delivered', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
  { value: 'returned', label: 'Returned', color: 'orange' }
];

function OrderDetailModal({ order, onClose, onUpdate }) {
  const [selectedStatus, setSelectedStatus] = useState(order?.order_status || 'pending');
  const [statusNotes, setStatusNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { getToken } = useAdmin();

  // Early return if no order
  if (!order) {
    return null;
  }

  const handleStatusUpdate = async () => {
    if (selectedStatus === order.order_status) {
      alert('Please select a different status');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        `${API_URL}/admin/orders/${order.id}/status`,
        {
          status: selectedStatus,
          notes: statusNotes || null
        },
        {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        }
      );

      if (response.data.success) {
        alert(`Order status updated to ${selectedStatus}`);
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Status update failed:', error);
      alert(error.response?.data?.detail || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }

    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        `${API_URL}/admin/orders/${order.id}/cancel`,
        { reason: cancelReason },
        {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        }
      );

      if (response.data.success) {
        alert('Order cancelled successfully');
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Cancellation failed:', error);
      alert(error.response?.data?.detail || 'Failed to cancel order');
    } finally {
      setLoading(false);
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
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-obsidian via-obsidian/95 to-deep-purple/20 border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-black text-pearl-white flex items-center gap-2">
              <Package className="text-cyber-lime" size={24} />
              Order Details
            </h2>
            <p className="text-pearl-white/60 text-sm mt-1 font-mono">
              Order ID: #{order.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-pearl-white/60 hover:text-pearl-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-lg font-bold text-pearl-white mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-cyber-lime" />
                Customer & Shipping
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-pearl-white/60">Customer Name</div>
                  <div className="text-pearl-white font-semibold">
                    {order.user_name || order.shipping_address?.name || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-pearl-white/60">Contact</div>
                  <div className="text-pearl-white">
                    {order.user_email || 'N/A'}<br />
                    {order.user_phone || order.shipping_address?.phone || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-pearl-white/60">Shipping Address</div>
                  <div className="text-pearl-white">
                    {order.shipping_address?.address_line1}<br />
                    {order.shipping_address?.address_line2 && (
                      <>{order.shipping_address.address_line2}<br /></>
                    )}
                    {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pincode}
                    {order.shipping_address?.landmark && (
                      <><br />Landmark: {order.shipping_address.landmark}</>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-lg font-bold text-pearl-white mb-4">Order Items</h3>
              <div className="space-y-3">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex gap-4 p-3 bg-white/5 rounded-lg">
                    <img
                      src={`${API_BASE_URL}${item.product_image}`}
                      alt={item.product_name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="text-pearl-white font-semibold">{item.product_name}</div>
                      <div className="text-sm text-pearl-white/60">
                        Qty: {item.quantity} × {formatCurrency(item.price)}
                      </div>
                    </div>
                    <div className="text-pearl-white font-bold">
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                <div className="flex justify-between text-pearl-white/80">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>- {formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-pearl-white/80">
                  <span>Shipping Charges</span>
                  <span>{formatCurrency(order.shipping_charges)}</span>
                </div>
                <div className="flex justify-between text-xl font-black text-pearl-white pt-2 border-t border-white/10">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-lg font-bold text-pearl-white mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-cyber-lime" />
                Payment Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-pearl-white/60">Payment Method</span>
                  <span className="text-pearl-white font-semibold capitalize">
                    {order.payment_method?.replace('_', ' ') || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-pearl-white/60">Payment Status</span>
                  <span className={`font-semibold capitalize ${
                    order.payment_status === 'success' ? 'text-green-400' :
                    order.payment_status === 'failed' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {order.payment_status}
                  </span>
                </div>
                {order.razorpay_payment_id && (
                  <div className="flex justify-between">
                    <span className="text-pearl-white/60">Payment ID</span>
                    <span className="text-pearl-white font-mono text-sm">
                      {order.razorpay_payment_id}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Status History */}
            {order.status_history && order.status_history.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-lg font-bold text-pearl-white mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-cyber-lime" />
                  Status History
                </h3>
                <div className="space-y-3">
                  {order.status_history.map((history, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-2 h-2 mt-2 rounded-full bg-cyber-lime"></div>
                      <div className="flex-1">
                        <div className="text-pearl-white font-semibold capitalize">
                          {history.status?.replace('_', ' ') || 'Unknown'}
                        </div>
                        <div className="text-xs text-pearl-white/60">
                          {formatDate(history.changed_at)} by {history.changed_by === 'admin' ? 'Admin' : 'Customer'}
                        </div>
                        {history.notes && (
                          <div className="text-sm text-pearl-white/80 mt-1">
                            {history.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Order Info Card */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-sm text-pearl-white/60 mb-1">Order Date</div>
              <div className="text-pearl-white font-semibold mb-4">
                {formatDate(order.created_at)}
              </div>

              <div className="text-sm text-pearl-white/60 mb-1">Current Status</div>
              <div className="text-lg font-black text-cyber-lime capitalize mb-4">
                {order.order_status?.replace('_', ' ') || 'Unknown'}
              </div>

              {order.cancelled_at && (
                <>
                  <div className="text-sm text-pearl-white/60 mb-1">Cancelled At</div>
                  <div className="text-red-400 mb-2">{formatDate(order.cancelled_at)}</div>
                  <div className="text-sm text-pearl-white/60 mb-1">Cancellation Reason</div>
                  <div className="text-pearl-white mb-4">{order.cancellation_reason}</div>
                </>
              )}
            </div>

            {/* Update Status */}
            {order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-lg font-bold text-pearl-white mb-4">Update Status</h3>
                <div className="space-y-3">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-pearl-white focus:border-cyber-lime focus:outline-none"
                  >
                    {STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <textarea
                    placeholder="Add notes (optional)"
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-pearl-white placeholder:text-pearl-white/40 focus:border-cyber-lime focus:outline-none resize-none"
                  />

                  <button
                    onClick={handleStatusUpdate}
                    disabled={loading || selectedStatus === order.order_status}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyber-lime to-electric-coral text-obsidian font-bold rounded-xl hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={18} />
                    {loading ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </div>
            )}

            {/* Cancel Order */}
            {order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <h3 className="text-lg font-bold text-red-400 mb-4">Cancel Order</h3>
                <div className="space-y-3">
                  <textarea
                    placeholder="Cancellation reason (required)"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-pearl-white placeholder:text-pearl-white/40 focus:border-red-500 focus:outline-none resize-none"
                  />

                  <button
                    onClick={handleCancelOrder}
                    disabled={loading || !cancelReason.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 border border-red-500 text-red-400 font-bold rounded-xl hover:bg-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Ban size={18} />
                    {loading ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default OrderDetailModal;
