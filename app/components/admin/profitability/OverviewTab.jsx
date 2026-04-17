import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';
import { TrendingUp, TrendingDown, Package, Target, AlertCircle, ChevronDown } from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

const API_URL = API_BASE_URL + '/api';

const OverviewTab = () => {
  const { isDarkMode } = useAdminTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [error, setError] = useState(null);

  // Generate month options (last 12 months)
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  };

  const monthOptions = getMonthOptions();

  useEffect(() => {
    // Default to current month
    if (!selectedMonth) {
      setSelectedMonth(monthOptions[0]?.value || '');
    }
  }, []);

  const fetchOverview = useCallback(async () => {
    if (!selectedMonth) return;
    
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/profitability/overview?year_month=${selectedMonth}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load data');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching overview:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (selectedMonth) {
      fetchOverview();
    }
  }, [selectedMonth, fetchOverview]);

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '₹0';
    return `₹${Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '0%';
    return `${value.toFixed(1)}%`;
  };

  // Skeleton loader
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-28 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-gray-200'}`}></div>
          ))}
        </div>
        <div className={`h-64 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-gray-200'}`}></div>
        <div className={`h-48 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-gray-200'}`}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{error}</p>
        <button 
          onClick={fetchOverview}
          className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Month Selector */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Period:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className={`px-3 py-1.5 rounded-lg text-sm border-0 focus:ring-1 focus:ring-teal-500 ${
              isDarkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-900 shadow-sm'
            }`}
          >
            {monthOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
          {data.days_with_data} days with data
        </span>
      </div>

      {/* Section 1: Four Metric Cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Inventory Value */}
        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-blue-500" />
            <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Inventory Value</span>
          </div>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(data.inventory_value)}
          </p>
          <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
            {data.inventory_units.toLocaleString()} units
          </p>
        </div>

        {/* Gross Margin */}
        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Gross Margin</span>
          </div>
          <p className={`text-xl font-bold text-emerald-500`}>
            {formatPercentage(data.gross_margin)}
          </p>
          <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
            {formatCurrency(data.gross_profit)} profit
          </p>
        </div>

        {/* Net Margin */}
        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-2 mb-2">
            {data.net_profit >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Net Margin</span>
          </div>
          <p className={`text-xl font-bold ${data.net_profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {data.net_profit < 0 ? '-' : ''}{formatPercentage(Math.abs(data.net_margin))}
          </p>
          <p className={`text-xs ${data.net_profit >= 0 ? (isDarkMode ? 'text-slate-500' : 'text-gray-400') : 'text-red-400'}`}>
            {data.net_profit < 0 ? '-' : ''}{formatCurrency(Math.abs(data.net_profit))} {data.net_profit < 0 ? 'loss' : 'profit'}
          </p>
        </div>

        {/* Break-even Gap */}
        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-amber-500" />
            <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Break-even Gap</span>
          </div>
          {data.breakeven_gap <= 0 ? (
            <>
              <p className={`text-xl font-bold text-emerald-500`}>On Track</p>
              <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                Exceeding daily target
              </p>
            </>
          ) : (
            <>
              <p className={`text-xl font-bold text-amber-500`}>
                {formatCurrency(data.breakeven_gap)}/day
              </p>
              <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                needed to break even
              </p>
            </>
          )}
        </div>
      </div>

      {/* Section 2: Monthly P&L Summary */}
      <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
        <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          📊 Monthly P&L Summary
        </h3>
        <div className="space-y-2 font-mono text-sm">
          {/* Revenue */}
          <div className="flex justify-between">
            <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>Revenue</span>
            <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(data.total_revenue)}
            </span>
          </div>
          <div className={`flex justify-between pl-4 text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
            <span>E-commerce: {formatCurrency(data.ecom_revenue)}</span>
            <span>Retail: {formatCurrency(data.retail_revenue)}</span>
          </div>
          
          {/* COGS */}
          <div className="flex justify-between">
            <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
              Less: COGS ({data.cogs_percentage}%)
            </span>
            <span className="text-red-400">-{formatCurrency(data.cogs)}</span>
          </div>
          
          {/* Gross Profit Line */}
          <div className={`flex justify-between pt-2 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
            <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Gross Profit</span>
            <span className={`font-semibold ${data.gross_profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {formatCurrency(data.gross_profit)}
            </span>
          </div>
          <div className={`flex justify-between text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
            <span>Gross Margin</span>
            <span>{formatPercentage(data.gross_margin)}</span>
          </div>
          
          {/* Operating Expenses */}
          <div className="flex justify-between pt-2">
            <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>Less: Operating Expenses</span>
            <span className="text-red-400">-{formatCurrency(data.operating_expenses)}</span>
          </div>
          
          {/* Ad Spend */}
          <div className="flex justify-between">
            <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>Less: Ad Spend</span>
            <span className="text-red-400">-{formatCurrency(data.ad_spend)}</span>
          </div>
          
          {/* Net Profit Line */}
          <div className={`flex justify-between pt-2 border-t-2 ${isDarkMode ? 'border-slate-600' : 'border-gray-300'}`}>
            <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Net Profit</span>
            <span className={`font-bold ${data.net_profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {data.net_profit < 0 ? '-' : ''}{formatCurrency(Math.abs(data.net_profit))}
            </span>
          </div>
          <div className={`flex justify-between text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
            <span>Net Margin</span>
            <span className={data.net_margin < 0 ? 'text-red-400' : ''}>
              {data.net_margin < 0 ? '-' : ''}{formatPercentage(Math.abs(data.net_margin))}
            </span>
          </div>
        </div>
      </div>

      {/* Section 3: Break-even Analysis */}
      <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
        <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          🎯 Break-even Analysis
        </h3>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Monthly Fixed Costs</p>
            <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(data.fixed_costs)}
            </p>
            <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
              OpEx + Ad Spend
            </p>
          </div>
          <div>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Gross Margin</p>
            <p className={`text-lg font-semibold text-emerald-500`}>
              {formatPercentage(data.gross_margin)}
            </p>
          </div>
          <div>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Break-even Revenue</p>
            <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(data.breakeven_revenue)}
            </p>
            <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
              per month
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Progress to Break-even
            </span>
            <span className={`text-xs font-medium ${
              data.breakeven_progress >= 100 ? 'text-emerald-500' : 
              data.breakeven_progress >= 70 ? 'text-amber-500' : 'text-red-500'
            }`}>
              {data.breakeven_progress.toFixed(0)}%
            </span>
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
            <div 
              className={`h-full rounded-full transition-all ${
                data.breakeven_progress >= 100 ? 'bg-emerald-500' : 
                data.breakeven_progress >= 70 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(data.breakeven_progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Daily Targets */}
        <div className="grid grid-cols-3 gap-4">
          <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Daily Target</p>
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(data.breakeven_daily)}
            </p>
          </div>
          <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Current Daily Avg</p>
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(data.current_daily_avg)}
            </p>
          </div>
          <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Gap Amount</p>
            <p className={`text-sm font-semibold ${data.breakeven_gap <= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {data.breakeven_gap <= 0 ? '+' : ''}{formatCurrency(Math.abs(data.breakeven_gap))}/day
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
