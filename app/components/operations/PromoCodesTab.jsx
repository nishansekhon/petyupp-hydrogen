import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { 
  Plus, Edit2, Trash2, X, Tag, Percent, DollarSign, 
  Calendar, CheckCircle, XCircle, AlertTriangle, RefreshCw,
  Search, Copy, Check
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = API_BASE_URL;

const PromoCodesTab = () => {
  const { isDarkMode } = useAdminTheme();
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: '',
    start_date: '',
    end_date: '',
    is_active: true,
    usage_limit: '',
    description: ''
  });

  const fetchPromoCodes = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/promo-codes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPromoCodes(data.promo_codes || []);
      }
    } catch (error) {
      console.error('Failed to fetch promo codes:', error);
      toast.error('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '',
      max_discount_amount: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_active: true,
      usage_limit: '',
      description: ''
    });
    setEditingPromo(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (promo) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code || '',
      discount_type: promo.discount_type || 'percentage',
      discount_value: promo.discount_value?.toString() || '',
      min_order_amount: promo.min_order_amount?.toString() || '',
      max_discount_amount: promo.max_discount_amount?.toString() || '',
      start_date: promo.start_date?.split('T')[0] || '',
      end_date: promo.end_date?.split('T')[0] || '',
      is_active: promo.is_active !== false,
      usage_limit: promo.usage_limit?.toString() || '',
      description: promo.description || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.code || !formData.discount_value || !formData.start_date || !formData.end_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const url = editingPromo 
        ? `${API_URL}/api/admin/promo-codes/${editingPromo.id}`
        : `${API_URL}/api/admin/promo-codes`;
      
      const payload = {
        code: formData.code.toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_active: formData.is_active,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        description: formData.description
      };

      const response = await fetch(url, {
        method: editingPromo ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(editingPromo ? 'Promo code updated!' : 'Promo code created!');
        setShowModal(false);
        resetForm();
        fetchPromoCodes();
      } else {
        toast.error(data.detail || data.error || 'Failed to save promo code');
      }
    } catch (error) {
      console.error('Failed to save promo code:', error);
      toast.error('Failed to save promo code');
    }
  };

  const handleDelete = async (promoId) => {
    if (!confirm('Are you sure you want to deactivate this promo code?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/promo-codes/${promoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Promo code deactivated');
        fetchPromoCodes();
      } else {
        toast.error('Failed to deactivate promo code');
      }
    } catch (error) {
      console.error('Failed to delete promo code:', error);
      toast.error('Failed to deactivate promo code');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success('Code copied!');
  };

  const getStatusBadge = (promo) => {
    const now = new Date();
    const startDate = new Date(promo.start_date);
    const endDate = new Date(promo.end_date);
    
    if (!promo.is_active) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 text-xs font-medium">
          <XCircle className="w-3 h-3" /> Disabled
        </span>
      );
    }
    
    if (now < startDate) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
          <Calendar className="w-3 h-3" /> Scheduled
        </span>
      );
    }
    
    if (now > endDate) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
          <AlertTriangle className="w-3 h-3" /> Expired
        </span>
      );
    }
    
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
        <CheckCircle className="w-3 h-3" /> Active
      </span>
    );
  };

  const filteredCodes = promoCodes.filter(promo =>
    promo.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Promo Codes
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Manage discount codes for checkout
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 rounded-lg border text-sm ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>
          
          <button
            onClick={fetchPromoCodes}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Promo Code
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}>
              <tr className={`text-left text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Min Order</th>
                <th className="px-4 py-3 font-medium">Valid Period</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Used</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center">
                    <RefreshCw className="w-6 h-6 text-teal-400 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan="8" className={`px-4 py-8 text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    No promo codes found. Click "Add Promo Code" to create one.
                  </td>
                </tr>
              ) : (
                filteredCodes.map((promo) => (
                  <tr key={promo.id} className={isDarkMode ? 'text-white hover:bg-slate-800/30' : 'text-gray-900 hover:bg-gray-50'}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-teal-400" />
                        <span className="font-mono font-semibold">{promo.code}</span>
                        {promo.affiliate_id && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-orange-500/20 text-orange-400 font-medium">
                            Affiliate
                          </span>
                        )}
                        <button
                          onClick={() => copyCode(promo.code)}
                          className="p-1 rounded hover:bg-slate-700/50"
                          title="Copy code"
                        >
                          {copiedCode === promo.code ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      </div>
                      {promo.description && (
                        <p className="text-xs text-slate-400 mt-1 truncate max-w-[200px]">{promo.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                        promo.discount_type === 'percentage' 
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {promo.discount_type === 'percentage' ? (
                          <><Percent className="w-3 h-3" /> Percentage</>
                        ) : (
                          <><DollarSign className="w-3 h-3" /> Fixed</>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {promo.discount_type === 'percentage' 
                        ? `${promo.discount_value}%`
                        : `₹${promo.discount_value}`}
                      {promo.max_discount_amount && (
                        <span className="text-xs text-slate-400 block">Max ₹{promo.max_discount_amount}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {promo.min_order_amount > 0 ? `₹${promo.min_order_amount}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">
                        <div>{new Date(promo.start_date).toLocaleDateString()}</div>
                        <div className="text-slate-400">to {new Date(promo.end_date).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(promo)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono">{promo.used_count || 0}</span>
                      {promo.usage_limit && (
                        <span className="text-slate-400">/{promo.usage_limit}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(promo)}
                          className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(promo.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                          title="Deactivate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-lg rounded-2xl ${isDarkMode ? 'bg-[#1E293B]' : 'bg-white'} shadow-xl`}>
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Code */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Code <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SUMMER20"
                  className={`w-full px-3 py-2 rounded-lg border text-sm font-mono ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  required
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Discount Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    {formData.discount_type === 'percentage' ? 'Discount %' : 'Discount Amount'} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder={formData.discount_type === 'percentage' ? '10' : '100'}
                    min="0"
                    max={formData.discount_type === 'percentage' ? '100' : undefined}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                    required
                  />
                </div>
              </div>

              {/* Min Order & Max Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Min Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                    placeholder="0"
                    min="0"
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Max Discount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.max_discount_amount}
                    onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                    placeholder="No limit"
                    min="0"
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Start Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    End Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>
              </div>

              {/* Usage Limit & Active */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    placeholder="Unlimited"
                    min="0"
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-teal-500 focus:ring-teal-500"
                    />
                    <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Active</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Description (internal note)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Google Merchant Center promotion"
                  rows={2}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {editingPromo ? 'Update Code' : 'Create Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoCodesTab;
