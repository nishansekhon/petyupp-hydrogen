import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';
import { Receipt, Plus, Edit2, RefreshCw, AlertCircle } from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { toast } from 'react-toastify';
import ExpensesModal from './ExpensesModal';

const API_URL = API_BASE_URL + '/api';

const ExpensesTab = () => {
  const { isDarkMode } = useAdminTheme();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/profitability/expenses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setExpenses(data.expenses || []);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const formatCurrency = (value) => {
    return `₹${(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const formatMonth = (yearMonth) => {
    if (!yearMonth) return '-';
    const [year, month] = yearMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingExpense(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingExpense(null);
  };

  const handleModalSave = () => {
    fetchExpenses();
    handleModalClose();
  };

  // Check if current month exists
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const hasCurrentMonth = expenses.some(e => e.year_month === currentYearMonth);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Monthly Operating Expenses
        </h3>
        <div className="flex gap-2">
          <button
            onClick={fetchExpenses}
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
            Add Month
          </button>
        </div>
      </div>

      {/* Prompt to add current month if missing */}
      {!loading && !hasCurrentMonth && (
        <div className={`rounded-lg p-4 border-2 border-dashed flex items-center justify-between ${
          isDarkMode ? 'bg-slate-800/50 border-amber-500/30' : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatMonth(currentYearMonth)} expenses not set
              </p>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Add operating expenses for accurate P&L calculation
              </p>
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium"
          >
            Add Now
          </button>
        </div>
      )}

      {/* Expenses Table */}
      <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-500" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`} />
            <p className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              No expense records yet
            </p>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Add your monthly operating expenses to track profitability
            </p>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium"
            >
              <Plus size={16} />
              Add Month
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}>
                  <th className={`text-left px-4 py-3 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                    Month
                  </th>
                  <th className={`text-right px-4 py-3 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                    Operating Expenses
                  </th>
                  <th className={`text-right px-4 py-3 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                    <span className="flex items-center justify-end gap-1">
                      Ad Spend
                      <span className={`text-[9px] px-1 py-0.5 rounded ${isDarkMode ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-500'}`}>
                        auto
                      </span>
                    </span>
                  </th>
                  <th className={`text-right px-4 py-3 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                    Total
                  </th>
                  <th className={`text-center px-4 py-3 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense, idx) => (
                  <tr 
                    key={expense.year_month}
                    className={`border-t ${
                      isDarkMode 
                        ? `border-slate-700 ${idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/50'}` 
                        : `border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`
                    }`}
                  >
                    <td className={`px-4 py-3 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatMonth(expense.year_month)}
                      {expense.year_month === currentYearMonth && (
                        <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400">
                          Current
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      {formatCurrency(expense.operating_expenses)}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      {formatCurrency(expense.ad_spend)}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-semibold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                      {formatCurrency(expense.total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleEdit(expense)}
                        className={`p-1.5 rounded ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                        title="Edit"
                      >
                        <Edit2 size={14} className="text-teal-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <ExpensesModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSave={handleModalSave}
        editingExpense={editingExpense}
        existingMonths={expenses.map(e => e.year_month)}
      />
    </div>
  );
};

export default ExpensesTab;
