import React, { useState } from 'react';
import { API_BASE_URL } from '@/config/api';
import { FileText, Download, Printer, TrendingUp, Package, ShoppingCart, DollarSign } from 'lucide-react';

// Using imported API_BASE_URL

const ReportsTab = ({ isDarkMode }) => {
  const [reportType, setReportType] = useState('sales');
  const [period, setPeriod] = useState('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 7));
  const [channel, setChannel] = useState('both');
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      let startDate, endDate;
      
      if (period === 'daily') {
        startDate = selectedDate;
        endDate = selectedDate;
      } else if (period === 'weekly') {
        const date = new Date(selectedDate);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(date.setDate(diff));
        startDate = weekStart.toISOString().slice(0, 10);
        endDate = new Date(weekStart.setDate(weekStart.getDate() + 6)).toISOString().slice(0, 10);
      } else if (period === 'monthly') {
        startDate = selectedDate + '-01';
        const year = parseInt(selectedDate.slice(0, 4));
        const month = parseInt(selectedDate.slice(5, 7));
        endDate = new Date(year, month, 0).toISOString().slice(0, 10);
      } else if (period === 'quarterly') {
        const quarter = parseInt(selectedDate);
        const year = new Date().getFullYear();
        startDate = `${year}-${String((quarter - 1) * 3 + 1).padStart(2, '0')}-01`;
        endDate = new Date(year, quarter * 3, 0).toISOString().slice(0, 10);
      } else if (period === 'yearly') {
        startDate = `${selectedDate}-01-01`;
        endDate = `${selectedDate}-12-31`;
      }

      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${API_BASE_URL}/api/admin/reports/sales?period=${period}&start_date=${startDate}&end_date=${endDate}&channel=${channel}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();

      if (data.success) {
        setReportData(data.data || []);
        setSummary(data.summary || {});
        setGenerated(true);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
    setLoading(false);
  };

  const downloadExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(reportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');
      XLSX.writeFile(wb, `sales-report-${period}-${selectedDate}.xlsx`);
    } catch (error) {
      console.error('Error downloading Excel:', error);
    }
  };

  const downloadCSV = () => {
    if (reportData.length === 0) return;
    const headers = Object.keys(reportData[0]).join(',');
    const rows = reportData.map(row => Object.values(row).map(v => `"${v || ''}"`).join(',')).join('\n');
    const csv = headers + '\n' + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${period}-${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/20 rounded-lg">
            <FileText className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Sales Reports</h2>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Generate and download sales performance reports</p>
          </div>
        </div>
      </div>

      {/* Report Settings */}
      <div className={`rounded-xl p-6 border ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'}`}>
        <h3 className={`text-sm font-medium mb-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Report Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Report Type */}
          <div>
            <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
              } border`}
            >
              <option value="sales">Sales Report</option>
            </select>
          </div>

          {/* Period */}
          <div>
            <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
              } border`}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Date Selector */}
          <div>
            <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              {period === 'daily' ? 'Date' : period === 'weekly' ? 'Week Of' : period === 'monthly' ? 'Month' : period === 'quarterly' ? 'Quarter' : 'Year'}
            </label>
            {period === 'daily' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                } border`}
              />
            )}
            {period === 'weekly' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                } border`}
              />
            )}
            {period === 'monthly' && (
              <input
                type="month"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                } border`}
              />
            )}
            {period === 'quarterly' && (
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                } border`}
              >
                <option value="1">Q1 (Jan-Mar)</option>
                <option value="2">Q2 (Apr-Jun)</option>
                <option value="3">Q3 (Jul-Sep)</option>
                <option value="4">Q4 (Oct-Dec)</option>
              </select>
            )}
            {period === 'yearly' && (
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                } border`}
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            )}
          </div>

          {/* Channel */}
          <div>
            <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Channel</label>
            <div className="flex gap-2">
              {['ecom', 'retail', 'both'].map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannel(ch)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    channel === ch
                      ? 'bg-teal-500 text-white'
                      : isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {ch === 'ecom' ? 'E-Com' : ch === 'retail' ? 'Retail' : 'Both'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={loading}
          className="px-6 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Generate Report
            </>
          )}
        </button>
      </div>

      {/* Summary Cards */}
      {generated && summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Total Revenue</p>
                <p className="text-xl font-bold text-green-400">{formatCurrency(summary.total_revenue)}</p>
              </div>
            </div>
          </div>
          <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Total Orders</p>
                <p className="text-xl font-bold text-blue-400">{summary.total_orders || 0}</p>
              </div>
            </div>
          </div>
          <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Avg Order Value</p>
                <p className="text-xl font-bold text-purple-400">{formatCurrency(summary.avg_order)}</p>
              </div>
            </div>
          </div>
          <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Package className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Units Sold</p>
                <p className="text-xl font-bold text-orange-400">{summary.units_sold || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Data Table */}
      {generated && (
        <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'}`}>
          {/* Table Header */}
          <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700/50' : 'border-gray-200'}`}>
            <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Report Data ({reportData.length} records)</h3>
            <div className="flex gap-2">
              <button
                onClick={downloadExcel}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={downloadCSV}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>Date</th>
                  {channel === 'both' && <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>Channel</th>}
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>Source</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>Product</th>
                  <th className={`px-4 py-3 text-right text-xs font-medium uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>Qty</th>
                  <th className={`px-4 py-3 text-right text-xs font-medium uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>Price</th>
                  <th className={`px-4 py-3 text-right text-xs font-medium uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>Revenue</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-gray-100'}`}>
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className={`px-4 py-8 text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      No data found for selected period
                    </td>
                  </tr>
                ) : (
                  reportData.map((row, index) => (
                    <tr key={index} className={isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'}>
                      <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{row.date}</td>
                      {channel === 'both' && (
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${row.channel === 'ecom' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                            {row.channel === 'ecom' ? 'E-Com' : 'Retail'}
                          </span>
                        </td>
                      )}
                      <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>{row.store_name || row.platform || '-'}</td>
                      <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{row.product_name}</td>
                      <td className={`px-4 py-3 text-sm text-right ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>{row.quantity}</td>
                      <td className={`px-4 py-3 text-sm text-right ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>{formatCurrency(row.unit_price)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-green-400">{formatCurrency(row.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsTab;
