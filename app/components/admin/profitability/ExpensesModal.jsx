import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { X, Save, Receipt, Info } from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { toast } from 'react-toastify';

const API_URL = API_BASE_URL + '/api';

const ExpensesModal = ({ isOpen, onClose, onSave, editingExpense, existingMonths = [] }) => {
  const { isDarkMode } = useAdminTheme();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    year_month: '',
    operating_expenses: 0,
    notes: ''
  });

  // Generate month options (last 12 months + next 2 months)
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    // Add 2 future months
    for (let i = -2; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const exists = existingMonths.includes(value);
      options.push({ value, label, exists });
    }
    return options;
  };

  const monthOptions = getMonthOptions();

  // Initialize form
  useEffect(() => {
    if (editingExpense) {
      setFormData({
        year_month: editingExpense.year_month,
        operating_expenses: editingExpense.operating_expenses || 0,
        notes: editingExpense.notes || ''
      });
    } else {
      // Default to current month if not existing
      const currentMonth = new Date().toISOString().slice(0, 7);
      const defaultMonth = existingMonths.includes(currentMonth) 
        ? monthOptions.find(m => !m.exists)?.value || '' 
        : currentMonth;
      setFormData({
        year_month: defaultMonth,
        operating_expenses: 0,
        notes: ''
      });
    }
  }, [editingExpense, isOpen]);

  const handleSubmit = async () => {
    if (!formData.year_month) {
      toast.error('Please select a month');
      return;
    }
    if (formData.operating_expenses < 0) {
      toast.error('Expenses cannot be negative');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const url = editingExpense 
        ? `${API_URL}/profitability/expenses/${formData.year_month}`
        : `${API_URL}/profitability/expenses`;
      const method = editingExpense ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(editingExpense ? 'Expenses updated' : 'Expenses added');
        onSave();
      } else {
        toast.error(data.detail || 'Failed to save');
      }
    } catch (err) {
      toast.error('Failed to save expenses');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`w-full max-w-md rounded-lg shadow-xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Receipt className="text-teal-500" size={18} />
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {editingExpense ? 'Edit Expenses' : 'Add Monthly Expenses'}
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
          {/* Month Selector */}
          <div>
            <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Month *
            </label>
            <select
              value={formData.year_month}
              onChange={(e) => setFormData({ ...formData, year_month: e.target.value })}
              disabled={!!editingExpense}
              className={`w-full px-3 py-2 rounded-lg text-sm border focus:ring-1 focus:ring-teal-500 ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white disabled:bg-slate-800' 
                  : 'bg-white border-gray-300 text-gray-900 disabled:bg-gray-100'
              }`}
            >
              <option value="">Select month</option>
              {monthOptions.map(opt => (
                <option 
                  key={opt.value} 
                  value={opt.value}
                  disabled={opt.exists && !editingExpense}
                >
                  {opt.label} {opt.exists && !editingExpense ? '(already added)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Operating Expenses */}
          <div>
            <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Operating Expenses *
            </label>
            <div className="relative">
              <span className={`absolute left-3 top-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>₹</span>
              <input
                type="number"
                min="0"
                value={formData.operating_expenses}
                onChange={(e) => setFormData({ ...formData, operating_expenses: parseFloat(e.target.value) || 0 })}
                className={`w-full pl-7 pr-3 py-2 rounded-lg text-sm border focus:ring-1 focus:ring-teal-500 ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
                placeholder="0"
              />
            </div>
            <p className={`text-[10px] mt-1 flex items-center gap-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
              <Info size={10} />
              Combine salaries, rent, utilities, subscriptions into one amount
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className={`w-full px-3 py-2 rounded-lg text-sm border focus:ring-1 focus:ring-teal-500 resize-none ${
                isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Personal reference notes..."
            />
          </div>

          {/* Ad Spend Info */}
          <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                Ad Spend
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-500'}`}>
                auto-calculated
              </span>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Ad spend is automatically pulled from your daily sales data. 
              {!editingExpense && ' For future months, this will be calculated once data is available.'}
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
            {editingExpense ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpensesModal;
