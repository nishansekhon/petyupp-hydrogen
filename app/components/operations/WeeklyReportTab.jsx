/**
 * WeeklyReportTab Component
 * 
 * Displays weekly business report preview, send to Telegram functionality,
 * schedule info, and report history with date range selector.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';
import { 
  BarChart3, Eye, Send, Calendar, Check, Loader2, 
  AlertTriangle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

const API_URL = API_BASE_URL;

// Helper function to get Sunday of the current week (week starts on Sunday)
const getSunday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Go back to Sunday
  return new Date(d.setDate(diff));
};

// Helper function to get Saturday of a week (6 days after Sunday)
const getSaturday = (sunday) => {
  const d = new Date(sunday);
  d.setDate(d.getDate() + 6);
  return d;
};

// Helper function to get first day of month
const getFirstOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

// Helper function to get last day of month
const getLastOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

// Format date as YYYY-MM-DD
const formatDateISO = (date) => {
  return date.toISOString().split('T')[0];
};

// Format date for display
const formatDateDisplay = (date) => {
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

// Format month for display
const formatMonthDisplay = (date) => {
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

const WeeklyReportTab = () => {
  const { isDarkMode } = useAdminTheme();
  
  // Date selection state
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  const [selectedStart, setSelectedStart] = useState(() => getSunday(new Date()));
  const [selectedEnd, setSelectedEnd] = useState(() => getSaturday(getSunday(new Date())));
  
  // Preview state
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState(null);
  
  // Send state
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // History state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [expandedReport, setExpandedReport] = useState(null);
  
  // Check if current/future week
  const isCurrentOrFuture = useCallback(() => {
    const today = new Date();
    const currentSunday = getSunday(today);
    return selectedStart >= currentSunday;
  }, [selectedStart]);
  
  // Navigate to previous period
  const goToPrevious = () => {
    if (viewMode === 'week') {
      const newStart = new Date(selectedStart);
      newStart.setDate(newStart.getDate() - 7);
      setSelectedStart(newStart);
      setSelectedEnd(getSaturday(newStart));
    } else {
      const newStart = new Date(selectedStart);
      newStart.setMonth(newStart.getMonth() - 1);
      setSelectedStart(getFirstOfMonth(newStart));
      setSelectedEnd(getLastOfMonth(newStart));
    }
  };
  
  // Navigate to next period
  const goToNext = () => {
    if (viewMode === 'week') {
      const newStart = new Date(selectedStart);
      newStart.setDate(newStart.getDate() + 7);
      const today = new Date();
      const currentSunday = getSunday(today);
      // Don't go past current week
      if (newStart <= currentSunday) {
        setSelectedStart(newStart);
        setSelectedEnd(getSaturday(newStart));
      }
    } else {
      const newStart = new Date(selectedStart);
      newStart.setMonth(newStart.getMonth() + 1);
      const today = new Date();
      // Don't go past current month
      if (newStart.getMonth() <= today.getMonth() || newStart.getFullYear() < today.getFullYear()) {
        setSelectedStart(getFirstOfMonth(newStart));
        setSelectedEnd(getLastOfMonth(newStart));
      }
    }
  };
  
  // Go to current period
  const goToCurrent = () => {
    const today = new Date();
    if (viewMode === 'week') {
      const sunday = getSunday(today);
      setSelectedStart(sunday);
      setSelectedEnd(getSaturday(sunday));
    } else {
      setSelectedStart(getFirstOfMonth(today));
      setSelectedEnd(getLastOfMonth(today));
    }
  };
  
  // Toggle view mode
  const toggleViewMode = (mode) => {
    setViewMode(mode);
    const today = new Date();
    if (mode === 'week') {
      const sunday = getSunday(selectedStart);
      setSelectedStart(sunday);
      setSelectedEnd(getSaturday(sunday));
    } else {
      setSelectedStart(getFirstOfMonth(selectedStart));
      setSelectedEnd(getLastOfMonth(selectedStart));
    }
  };
  
  // Fetch preview
  const fetchPreview = useCallback(async () => {
    try {
      setPreviewLoading(true);
      setPreviewError(null);
      
      const startStr = formatDateISO(selectedStart);
      const endStr = formatDateISO(selectedEnd);
      
      const res = await fetch(`${API_URL}/api/admin/weekly-report/preview?week_start=${startStr}&week_end=${endStr}`);
      const data = await res.json();
      
      if (res.ok && data.success) {
        setPreview(data);
      } else {
        setPreviewError(data.detail || 'Failed to load preview');
      }
    } catch (error) {
      setPreviewError('Failed to connect to server');
      console.error('Preview error:', error);
    } finally {
      setPreviewLoading(false);
    }
  }, [selectedStart, selectedEnd]);
  
  // Fetch history on mount
  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      
      const res = await fetch(`${API_URL}/api/admin/weekly-report/history`);
      const data = await res.json();
      
      if (res.ok && data.success) {
        setHistory(data.reports || []);
      }
    } catch (error) {
      console.error('History error:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);
  
  // Fetch preview when date changes
  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);
  
  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);
  
  // Send to Telegram
  const handleSend = async () => {
    try {
      setSending(true);
      setShowConfirm(false);
      
      const startStr = formatDateISO(selectedStart);
      const endStr = formatDateISO(selectedEnd);
      
      const res = await fetch(`${API_URL}/api/admin/weekly-report/generate?week_start=${startStr}&week_end=${endStr}`);
      const data = await res.json();
      
      if (res.ok && data.success && data.telegram_sent) {
        toast.success('Report sent to Telegram', { icon: <Check className="w-4 h-4" /> });
        fetchHistory(); // Refresh history
      } else if (data.telegram_error) {
        toast.error(`Telegram error: ${data.telegram_error}`);
      } else {
        toast.error('Failed to send report');
      }
    } catch (error) {
      toast.error('Failed to send report');
      console.error('Send error:', error);
    } finally {
      setSending(false);
    }
  };
  
  // Format date range for display
  const formatWeekRange = (start, end) => {
    if (!start || !end) return '';
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ${endDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  };
  
  // Extract key metrics from report for history display
  const extractMetrics = (metrics) => {
    if (!metrics) return null;
    const ecom = metrics.ecommerce?.revenue_current || 0;
    const retail = metrics.retail?.current || 0;
    const orders = metrics.ecommerce?.orders_current || 0;
    const impressions = metrics.seo?.impressions_current || 0;
    const clicks = metrics.seo?.clicks_current || 0;
    return { ecom, retail, orders, impressions, clicks };
  };
  
  // Get display text for current selection
  const getSelectionDisplay = () => {
    if (viewMode === 'month') {
      return formatMonthDisplay(selectedStart);
    }
    return `${formatDateDisplay(selectedStart)} - ${formatDateDisplay(selectedEnd)} ${selectedEnd.getFullYear()}`;
  };
  
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4">
        <BarChart3 className="w-5 h-5 text-teal-400" />
        <div>
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Weekly Business Report
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Automated weekly performance summary delivered via Telegram every Sunday 8 PM IST
          </p>
        </div>
      </div>
      
      {/* Date Selector */}
      <div className={`rounded-xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${
        isDarkMode 
          ? 'bg-[#1E293B] border-slate-700' 
          : 'bg-white border-gray-200 shadow-sm'
      }`}>
        {/* Week/Month Toggle */}
        <div className={`flex rounded-lg border ${
          isDarkMode ? 'bg-[#0F172A] border-slate-600' : 'bg-gray-100 border-gray-200'
        }`}>
          <button
            onClick={() => toggleViewMode('week')}
            className={`px-3 py-1.5 text-xs font-medium rounded-l-lg transition-colors ${
              viewMode === 'week'
                ? 'bg-teal-500/20 text-teal-400'
                : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => toggleViewMode('month')}
            className={`px-3 py-1.5 text-xs font-medium rounded-r-lg transition-colors ${
              viewMode === 'month'
                ? 'bg-teal-500/20 text-teal-400'
                : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Month
          </button>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevious}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'text-slate-400 hover:text-white hover:bg-slate-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title={viewMode === 'week' ? 'Previous week' : 'Previous month'}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className={`px-4 py-1 min-w-[180px] text-center font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {getSelectionDisplay()}
          </div>
          
          <button
            onClick={goToNext}
            disabled={isCurrentOrFuture()}
            className={`p-2 rounded-lg transition-colors ${
              isCurrentOrFuture()
                ? 'text-slate-600 cursor-not-allowed'
                : isDarkMode 
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title={viewMode === 'week' ? 'Next week' : 'Next month'}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* This Week/Month Button */}
        <button
          onClick={goToCurrent}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            isCurrentOrFuture()
              ? isDarkMode ? 'text-slate-500' : 'text-gray-400'
              : 'text-teal-400 hover:text-teal-300'
          }`}
          disabled={isCurrentOrFuture()}
        >
          This {viewMode === 'week' ? 'Week' : 'Month'}
        </button>
      </div>
      
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* LEFT COLUMN: Report Preview Card */}
        <div className={`rounded-2xl border p-6 ${
          isDarkMode 
            ? 'bg-[#1E293B] border-slate-700' 
            : 'bg-white border-gray-200 shadow-sm'
        }`}>
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {viewMode === 'week' ? "Week's Report" : "Month's Report"}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={fetchPreview}
                disabled={previewLoading || sending}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  isDarkMode 
                    ? 'bg-[#0F172A] border-slate-600 text-slate-300 hover:bg-slate-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                } disabled:opacity-50 w-full sm:w-auto justify-center`}
                data-testid="weekly-report-preview-btn"
              >
                {previewLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                Preview
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={previewLoading || sending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/25 transition-colors disabled:opacity-50 w-full sm:w-auto justify-center"
                data-testid="weekly-report-send-btn"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send to Telegram
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Confirmation Dialog */}
          {showConfirm && (
            <div className={`mb-4 p-4 rounded-xl border ${
              isDarkMode ? 'bg-[#0F172A] border-slate-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                Send this report ({getSelectionDisplay()}) to Telegram now?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleSend}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode 
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* Error Alert */}
          {previewError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{previewError}</span>
              </div>
            </div>
          )}
          
          {/* Preview Content */}
          {previewLoading ? (
            <div className={`rounded-xl p-4 space-y-3 ${
              isDarkMode ? 'bg-[#0F172A]' : 'bg-gray-100'
            }`}>
              <div className={`h-4 rounded animate-pulse ${isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`} style={{ width: '60%' }} />
              <div className={`h-3 rounded animate-pulse ${isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`} style={{ width: '80%' }} />
              <div className={`h-3 rounded animate-pulse ${isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`} style={{ width: '70%' }} />
              <div className={`h-3 rounded animate-pulse ${isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`} style={{ width: '90%' }} />
            </div>
          ) : preview?.report_text ? (
            <div>
              <pre className={`rounded-xl p-4 text-sm font-mono whitespace-pre-wrap overflow-x-auto max-h-[400px] overflow-y-auto ${
                isDarkMode 
                  ? 'bg-[#0F172A] text-slate-300' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {preview.report_text}
              </pre>
              <p className={`mt-2 text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                Report covers {formatWeekRange(preview.week_start, preview.week_end)}
              </p>
            </div>
          ) : null}
        </div>
        
        {/* RIGHT COLUMN: Schedule Info + History */}
        <div className="space-y-4">
          {/* Schedule Card */}
          <div className={`rounded-2xl border p-4 ${
            isDarkMode 
              ? 'bg-[#1E293B] border-slate-700' 
              : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-teal-400" />
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Every Sunday at 8:00 PM IST
                </p>
                <div className={`flex items-center gap-1.5 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  <Send className="w-3.5 h-3.5" />
                  <span>Delivered to OyeBark Telegram Channel</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                Active
              </span>
            </div>
          </div>
          
          {/* Past Reports Card */}
          <div className={`rounded-2xl border p-4 ${
            isDarkMode 
              ? 'bg-[#1E293B] border-slate-700' 
              : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Past Reports
            </h3>
            
            {historyLoading ? (
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Loading...
              </p>
            ) : history.length === 0 ? (
              <p className={`text-sm text-center py-4 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                No reports generated yet. Click Preview to see this week's report.
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {history.map((report, index) => {
                  const metrics = extractMetrics(report.metrics);
                  const isExpanded = expandedReport === index;
                  
                  return (
                    <div 
                      key={index}
                      className={`rounded-xl border p-3 ${
                        isDarkMode 
                          ? 'bg-[#0F172A] border-slate-600' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatWeekRange(report.week_start, report.week_end)}
                          </p>
                          {metrics && (
                            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                              E-com: ₹{metrics.ecom.toLocaleString()} | Retail: ₹{metrics.retail.toLocaleString()} | Orders: {metrics.orders}{metrics.impressions > 0 ? ` | Imp: ${metrics.impressions.toLocaleString()}` : ''}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setExpandedReport(isExpanded ? null : index)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                            isDarkMode 
                              ? 'text-slate-400 hover:text-white hover:bg-slate-700' 
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              View
                            </>
                          )}
                        </button>
                      </div>
                      
                      {/* Expanded Report Text */}
                      {isExpanded && report.report_text && (
                        <pre className={`mt-3 rounded-lg p-3 text-xs font-mono whitespace-pre-wrap max-h-[200px] overflow-y-auto ${
                          isDarkMode 
                            ? 'bg-slate-800 text-slate-300' 
                            : 'bg-white text-gray-700 border border-gray-200'
                        }`}>
                          {report.report_text}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyReportTab;
