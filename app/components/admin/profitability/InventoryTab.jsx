import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';
import { Package, Plus, Edit2, Trash2, RefreshCw, Check } from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { toast } from 'react-toastify';
import InventoryModal from './InventoryModal';

const API_URL = API_BASE_URL + '/api';

const InventoryTab = () => {
  const { isDarkMode } = useAdminTheme();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState({ total_units: 0, total_value: 0, item_count: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Track which item's COGS is being edited and its local value
  const [editingCogsId, setEditingCogsId] = useState(null);
  const [localCogsValues, setLocalCogsValues] = useState({});
  const [savingCogsId, setSavingCogsId] = useState(null);
  const [savedCogsId, setSavedCogsId] = useState(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/profitability/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setInventory(data.inventory || []);
        setSummary(data.summary || { total_units: 0, total_value: 0, item_count: 0 });
        
        // Initialize local COGS values
        const cogsMap = {};
        (data.inventory || []).forEach(item => {
          cogsMap[item.id] = item.cogs_percentage || 100;
        });
        setLocalCogsValues(cogsMap);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleDelete = async (id, productName) => {
    if (!window.confirm(`Delete inventory record for "${productName}"?`)) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/profitability/inventory/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Inventory record deleted');
        fetchInventory();
      } else {
        toast.error(data.detail || 'Failed to delete');
      }
    } catch (err) {
      toast.error('Failed to delete inventory record');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleModalSave = () => {
    fetchInventory();
    handleModalClose();
  };

  // Handle COGS percentage change
  const handleCogsChange = (itemId, value) => {
    const numValue = parseFloat(value) || 0;
    setLocalCogsValues(prev => ({ ...prev, [itemId]: numValue }));
  };

  // Save COGS percentage to backend
  const saveCogsPercentage = async (itemId) => {
    const cogsValue = localCogsValues[itemId];
    if (cogsValue === undefined) return;
    
    setSavingCogsId(itemId);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/profitability/inventory/${itemId}/cogs`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ cogs_percentage: cogsValue })
      });
      const data = await response.json();
      if (data.success) {
        // Update local inventory state
        setInventory(prev => prev.map(item => 
          item.id === itemId ? { ...item, cogs_percentage: cogsValue } : item
        ));
        // Show brief checkmark
        setSavedCogsId(itemId);
        setTimeout(() => setSavedCogsId(null), 1500);
      } else {
        toast.error(data.detail || 'Failed to update COGS');
      }
    } catch (err) {
      toast.error('Failed to update COGS percentage');
    } finally {
      setSavingCogsId(null);
      setEditingCogsId(null);
    }
  };

  const handleCogsBlur = (itemId) => {
    saveCogsPercentage(itemId);
  };

  const handleCogsKeyDown = (e, itemId) => {
    if (e.key === 'Enter') {
      e.target.blur();
      saveCogsPercentage(itemId);
    }
    if (e.key === 'Escape') {
      // Reset to original value
      const item = inventory.find(i => i.id === itemId);
      if (item) {
        setLocalCogsValues(prev => ({ ...prev, [itemId]: item.cogs_percentage || 100 }));
      }
      setEditingCogsId(null);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return `₹${(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  // Calculate total inventory value for percentage calculation
  const totalInventoryValue = inventory.reduce((sum, item) => {
    return sum + (item.total_value || (item.quantity || 0) * (item.cost_per_unit || 0));
  }, 0);

  // Get color based on percentage concentration
  const getPercentageColor = (pct) => {
    if (pct >= 20) return isDarkMode ? 'text-red-400' : 'text-red-600';      // High concentration - risk
    if (pct >= 10) return isDarkMode ? 'text-orange-400' : 'text-orange-600'; // Medium concentration
    return isDarkMode ? 'text-slate-300' : 'text-gray-700';                   // Normal
  };

  return (
    <div className="space-y-4">
      {/* Header with Summary */}
      <div className="flex justify-between items-start">
        <div className="flex gap-6">
          <div>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Total Value</p>
            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(summary.total_value)}
            </p>
          </div>
          <div>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Total Units</p>
            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {summary.total_units.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchInventory}
            disabled={loading}
            className={`p-2 rounded-lg ${
              isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium"
          >
            <Plus size={16} />
            Add Stock
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-500" />
          </div>
        ) : inventory.length === 0 ? (
          <div className="p-8 text-center">
            <Package className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`} />
            <p className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              No inventory records yet
            </p>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Add your first inventory item to start tracking costs
            </p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium"
            >
              <Plus size={16} />
              Add Stock
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}>
                  <th className={`text-left px-4 py-3 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                    Product
                  </th>
                  <th className={`text-left px-4 py-3 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                    SKU
                  </th>
                  <th className={`text-right px-4 py-3 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                    Qty
                  </th>
                  <th className={`text-right px-4 py-3 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                    MFG-COST
                  </th>
                  <th className={`text-right px-4 py-3 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                    MRP
                  </th>
                  <th className={`text-right px-4 py-3 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                    COGS
                  </th>
                  <th className={`text-right px-4 py-3 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                    Total Value
                  </th>
                  <th className={`text-right px-4 py-3 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                    % Share
                  </th>
                  <th className={`text-left px-4 py-3 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                    Last Updated
                  </th>
                  <th className={`text-center px-4 py-3 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item, idx) => {
                  const itemValue = item.total_value || (item.quantity || 0) * (item.cost_per_unit || 0);
                  const percentage = totalInventoryValue > 0 
                    ? ((itemValue / totalInventoryValue) * 100).toFixed(1) 
                    : 0;
                  const cogsPercentage = localCogsValues[item.id] ?? item.cogs_percentage ?? 100;
                  const cogsValue = (item.cost_per_unit || 0) * (cogsPercentage / 100);
                  
                  return (
                  <tr 
                    key={item.id}
                    className={`border-t ${
                      isDarkMode 
                        ? `border-slate-700 ${idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/50'}` 
                        : `border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`
                    }`}
                  >
                    <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.product_name}
                    </td>
                    <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      {item.sku || '-'}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      {formatCurrency(item.cost_per_unit)}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {formatCurrency(item.mrp)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className={isDarkMode ? 'text-amber-400' : 'text-amber-600'}>
                          {formatCurrency(cogsValue)}
                        </span>
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={cogsPercentage}
                            onChange={(e) => handleCogsChange(item.id, e.target.value)}
                            onFocus={() => setEditingCogsId(item.id)}
                            onBlur={() => handleCogsBlur(item.id)}
                            onKeyDown={(e) => handleCogsKeyDown(e, item.id)}
                            disabled={savingCogsId === item.id}
                            className={`w-14 px-1 py-0.5 text-xs text-right rounded border focus:ring-1 focus:ring-teal-500 focus:border-teal-500 ${
                              isDarkMode 
                                ? 'bg-slate-700 border-slate-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            } ${savingCogsId === item.id ? 'opacity-50' : ''}`}
                          />
                          <span className={`text-xs ml-0.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>%</span>
                          {savedCogsId === item.id && (
                            <Check size={14} className="ml-1 text-green-500 animate-pulse" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-semibold ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                      {formatCurrency(item.total_value)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className={`w-16 h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                          <div 
                            className="h-full bg-teal-500 rounded-full transition-all" 
                            style={{ width: `${Math.min(parseFloat(percentage), 100)}%` }}
                          />
                        </div>
                        <span className={`w-12 text-right text-xs font-medium ${getPercentageColor(parseFloat(percentage))}`}>
                          {percentage}%
                        </span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                      {formatDate(item.last_updated)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(item)}
                          className={`p-1.5 rounded ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                          title="Edit"
                        >
                          <Edit2 size={14} className="text-teal-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.product_name)}
                          className={`p-1.5 rounded ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                          title="Delete"
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <InventoryModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSave={handleModalSave}
        editingItem={editingItem}
      />
    </div>
  );
};

export default InventoryTab;
