import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Package, Play } from 'lucide-react';
import { API_BASE_URL } from '@/utils/api';

const API_URL = API_BASE_URL + '/api';

const QuickRestockModal = ({ 
  isOpen, 
  onClose, 
  partnerName, 
  partnerId,
  onSuccess,
  title = "Add Stock",
  showInfoBanner = false
}) => {
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    quantity: '',
    cost_per_unit: ''
  });

  // Fetch products when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      // Reset form
      setFormData({
        product_id: '',
        product_name: '',
        quantity: '',
        cost_per_unit: ''
      });
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      // Handle both array response and {products: [...]} response
      const productList = Array.isArray(data) ? data : data.products || [];
      setProducts(productList);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData(prev => ({
        ...prev,
        product_id: product.id,
        product_name: product.name,
        cost_per_unit: product.selling_price || product.price || ''
      }));
    }
  };

  const handleSaveStock = async () => {
    if (!formData.product_id) {
      alert('Please select a product');
      return;
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }
    if (!formData.cost_per_unit || parseFloat(formData.cost_per_unit) <= 0) {
      alert('Please enter a valid cost per unit');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      // Generate a partner_id from the store name if not available
      const pid = partnerId || partnerName.toLowerCase().replace(/\s+/g, '_');
      
      const response = await fetch(`${API_URL}/v1/partner-stock/quick-restock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          partner_id: pid,
          partner_name: partnerName,
          product_id: formData.product_id,
          product_name: formData.product_name,
          quantity: parseInt(formData.quantity),
          cost_per_unit: parseFloat(formData.cost_per_unit),
          notes: `Stock added via Quick Restock`
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        onClose();
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        alert(data.error || 'Failed to add stock');
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Failed to add stock');
    }
    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#1E293B] rounded-2xl w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="quick-restock-modal"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-slate-400">{partnerName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner (optional) */}
        {showInfoBanner && (
          <div className="mx-4 mt-4 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
            <p className="text-xs text-teal-400">
              Add consignment stock entry to start tracking this partner.
              Once tracked, you can monitor stock levels and calculate unsold inventory.
            </p>
          </div>
        )}

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Product Selection */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Product *</label>
            <select
              value={formData.product_id}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              data-testid="restock-product-select"
            >
              <option value="">Select a product</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} - ₹{p.selling_price || p.price}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Quantity *</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder="0"
              min="1"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              data-testid="restock-quantity-input"
            />
          </div>

          {/* Cost Per Unit */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Cost Per Unit *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
              <input
                type="number"
                value={formData.cost_per_unit}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: e.target.value }))}
                placeholder="0"
                min="1"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-8 pr-4 py-2.5 text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                data-testid="restock-cost-input"
              />
            </div>
          </div>

          {/* Total Value Preview */}
          {formData.quantity && formData.cost_per_unit && (
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Stock Value:</span>
                <span className="text-teal-400 font-semibold">
                  ₹{(parseInt(formData.quantity) * parseFloat(formData.cost_per_unit)).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex gap-3 p-4 border-t border-slate-700/50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveStock}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2"
            data-testid="save-restock-btn"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                Add Stock
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickRestockModal;
