import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { X, Save, Package } from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { toast } from 'react-toastify';

const API_URL = API_BASE_URL + '/api';

const InventoryModal = ({ isOpen, onClose, onSave, editingItem }) => {
  const { isDarkMode } = useAdminTheme();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    sku: '',
    quantity: 0,
    cost_per_unit: 0,
    cogs_percentage: 100
  });

  // Fetch products for dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_URL}/profitability/products-for-dropdown`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  // Initialize form when editing
  useEffect(() => {
    if (editingItem) {
      setFormData({
        product_id: editingItem.product_id || '',
        product_name: editingItem.product_name || '',
        sku: editingItem.sku || '',
        quantity: editingItem.quantity || 0,
        cost_per_unit: editingItem.cost_per_unit || 0,
        cogs_percentage: editingItem.cogs_percentage || 100
      });
    } else {
      setFormData({
        product_id: '',
        product_name: '',
        sku: '',
        quantity: 0,
        cost_per_unit: 0,
        cogs_percentage: 100
      });
    }
  }, [editingItem, isOpen]);

  const handleProductSelect = (e) => {
    const productId = e.target.value;
    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData({
        ...formData,
        product_id: product.id,
        product_name: product.name,
        sku: product.sku || ''
      });
    } else {
      setFormData({
        ...formData,
        product_id: '',
        product_name: '',
        sku: ''
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.product_id || !formData.product_name) {
      toast.error('Please select a product');
      return;
    }
    if (formData.quantity < 0) {
      toast.error('Quantity cannot be negative');
      return;
    }
    if (formData.cost_per_unit < 0) {
      toast.error('Cost cannot be negative');
      return;
    }
    if (formData.cogs_percentage < 0) {
      toast.error('COGS % cannot be negative');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const url = editingItem 
        ? `${API_URL}/profitability/inventory/${editingItem.id}`
        : `${API_URL}/profitability/inventory`;
      const method = editingItem ? 'PUT' : 'POST';

      const body = editingItem 
        ? { quantity: formData.quantity, cost_per_unit: formData.cost_per_unit }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(editingItem ? 'Inventory updated' : 'Inventory added');
        onSave();
      } else {
        toast.error(data.detail || 'Failed to save');
      }
    } catch (err) {
      toast.error('Failed to save inventory');
    } finally {
      setSaving(false);
    }
  };

  const totalValue = formData.quantity * formData.cost_per_unit;
  const cogsValue = formData.cost_per_unit * (formData.cogs_percentage / 100);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`w-full max-w-md rounded-lg shadow-xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Package className="text-teal-500" size={18} />
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {editingItem ? 'Edit Inventory' : 'Add Stock'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg ${isDarkMode ? 'hover:bg-slate-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Product Dropdown */}
          <div>
            <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Product *
            </label>
            <select
              value={formData.product_id}
              onChange={handleProductSelect}
              disabled={!!editingItem}
              className={`w-full px-3 py-2 rounded-lg text-sm border focus:ring-1 focus:ring-teal-500 ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white disabled:bg-slate-800 disabled:text-slate-400' 
                  : 'bg-white border-gray-300 text-gray-900 disabled:bg-gray-100'
              }`}
            >
              <option value="">Select a product</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* SKU (auto-filled, readonly) */}
          <div>
            <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              SKU
            </label>
            <input
              type="text"
              value={formData.sku}
              readOnly
              className={`w-full px-3 py-2 rounded-lg text-sm border ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-600 text-slate-400' 
                  : 'bg-gray-100 border-gray-300 text-gray-500'
              }`}
              placeholder="Auto-filled from product"
            />
          </div>

          {/* Quantity and MFG-COST in a row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Quantity *
              </label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className={`w-full px-3 py-2 rounded-lg text-sm border focus:ring-1 focus:ring-teal-500 ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                MFG-COST *
              </label>
              <div className="relative">
                <span className={`absolute left-3 top-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost_per_unit}
                  onChange={(e) => setFormData({ ...formData, cost_per_unit: parseFloat(e.target.value) || 0 })}
                  className={`w-full pl-7 pr-3 py-2 rounded-lg text-sm border focus:ring-1 focus:ring-teal-500 ${
                    isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* COGS % field - only for new items */}
          {!editingItem && (
            <div>
              <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                COGS %
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.cogs_percentage}
                  onChange={(e) => setFormData({ ...formData, cogs_percentage: parseFloat(e.target.value) || 0 })}
                  className={`w-24 px-3 py-2 rounded-lg text-sm border focus:ring-1 focus:ring-teal-500 ${
                    isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>%</span>
                <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                  = ₹{cogsValue.toFixed(2)} COGS
                </span>
              </div>
              <p className={`text-[10px] mt-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                COGS = MFG-COST × COGS%. Default 100%.
              </p>
            </div>
          )}

          {/* Total Value (calculated) */}
          <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <div className="flex justify-between items-center">
              <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Total Value</span>
              <span className={`text-lg font-bold text-teal-500`}>
                ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className={`text-[10px] mt-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
              {formData.quantity} × ₹{formData.cost_per_unit} = ₹{totalValue.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-2 px-4 py-3 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg text-sm bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Save size={14} />
            )}
            {editingItem ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;
