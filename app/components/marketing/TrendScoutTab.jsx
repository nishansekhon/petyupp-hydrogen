import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';
import {
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Settings, RefreshCw, Copy, Check, Loader2,
  Flame, Bot, Send, Zap, X, Trash2, Image, Wand2, Download
} from 'lucide-react';
import { toast } from 'sonner';

// Status badge configuration
const STATUS_CONFIG = {
  posted: { color: '#10B981', bg: 'rgba(16,185,129,0.15)', label: '✓ Posted' },
  created: { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', label: '◉ Created' },
  pending: { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', label: '○ Pending' },
  skipped: { color: '#6B7280', bg: 'rgba(107,114,128,0.15)', label: '— Skipped' },
  filtered: { color: '#EF4444', bg: 'rgba(239,68,68,0.15)', label: '✕ Filtered' }
};

// Difficulty colors
const DIFFICULTY_COLORS = {
  Easy: '#10B981',
  Medium: '#F59E0B',
  Hard: '#EF4444'
};

const TrendScoutTab = ({ isDarkMode }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [settings, setSettings] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedTrends, setExpandedTrends] = useState({});
  const [copiedField, setCopiedField] = useState(null);
  const [runningNow, setRunningNow] = useState(false);
  const [regenerating, setRegenerating] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  
  // Feedback banner state for Run Now button
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [feedbackType, setFeedbackType] = useState(null); // 'success' | 'info' | 'error'
  
  // Test Telegram state
  const [testingTelegram, setTestingTelegram] = useState(false);
  
  // Custom topic state
  const [customTopic, setCustomTopic] = useState('');
  const [generatingCustom, setGeneratingCustom] = useState(false);
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState(null); // index of trend to delete
  const [deleting, setDeleting] = useState(false);
  
  // Image generation state
  const [generatingImage, setGeneratingImage] = useState(null); // index of trend generating image
  
  // Custom prompt state for direct image generation
  const [customPromptIndex, setCustomPromptIndex] = useState(null); // index of trend showing custom prompt input
  const [customPromptText, setCustomPromptText] = useState('');
  const [generatingCustomImage, setGeneratingCustomImage] = useState(null);

  // Show feedback and auto-dismiss after 4 seconds
  const showFeedback = (message, type) => {
    setFeedbackMessage(message);
    setFeedbackType(type);
    setTimeout(() => {
      setFeedbackMessage(null);
      setFeedbackType(null);
    }, 4000);
  };

  // Fetch available dates
  const fetchDates = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trend-scout/dates`);
      if (response.ok) {
        const dates = await response.json();
        setAvailableDates(dates);
        if (dates.length > 0 && !selectedDate) {
          setSelectedDate(dates[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dates:', error);
    }
  }, [selectedDate]);

  // Fetch daily trends
  const fetchDaily = useCallback(async (date) => {
    if (!date) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/trend-scout/daily?date=${date}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else if (response.status === 404) {
        setData(null);
      }
    } catch (error) {
      console.error('Failed to fetch daily trends:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trend-scout/settings`);
      if (response.ok) {
        const result = await response.json();
        setSettings(result);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDates();
    fetchSettings();
  }, [fetchDates, fetchSettings]);

  // Load data when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchDaily(selectedDate);
    }
  }, [selectedDate, fetchDaily]);

  // Run Now handler
  const handleRunNow = async () => {
    setRunningNow(true);
    // Clear any existing feedback
    setFeedbackMessage(null);
    setFeedbackType(null);
    
    try {
      // Use XMLHttpRequest to avoid rrweb fetch interceptor issues
      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}/api/trend-scout/run-now`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = () => {
          const status = xhr.status;
          let data = null;
          try {
            data = JSON.parse(xhr.responseText);
          } catch (e) {
            data = null;
          }
          resolve({ status, data });
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error'));
        };
        
        xhr.send();
      });
      
      const { status: statusCode, data } = result;
      
      // Check for 409 Conflict (already generated today)
      if (statusCode === 409) {
        showFeedback('📅 Trends already generated for today', 'info');
        await fetchDates();
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
        await fetchDaily(today);
        setRunningNow(false);
        return;
      }
      
      // Check for other errors
      if (statusCode >= 400) {
        showFeedback(data?.detail || 'Failed to generate trends', 'error');
        setRunningNow(false);
        return;
      }
      
      // Success case
      setData(data);
      showFeedback('🔥 Trends generated successfully!', 'success');
      await fetchDates();
      if (data?.date) {
        setSelectedDate(data.date);
      }
      setRunningNow(false);
      
    } catch (error) {
      console.error('Run now failed:', error);
      showFeedback('Failed to generate trends', 'error');
      setRunningNow(false);
    }
  };

  // Test Telegram handler - skips date check
  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    setFeedbackMessage(null);
    setFeedbackType(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/trend-scout/test-telegram-buttons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showFeedback(`📱 Sent to Telegram: ${data.trends_extracted} trends with buttons`, 'success');
      } else {
        showFeedback(data.detail || 'Failed to send to Telegram', 'error');
      }
    } catch (error) {
      console.error('Test Telegram failed:', error);
      showFeedback('Failed to test Telegram', 'error');
    } finally {
      setTestingTelegram(false);
    }
  };

  // Update status handler
  const handleUpdateStatus = async (trendIndex, status) => {
    if (!selectedDate) return;
    
    setUpdatingStatus(trendIndex);
    try {
      const response = await fetch(`${API_BASE_URL}/api/trend-scout/update-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          trend_index: trendIndex,
          status
        })
      });
      
      if (response.ok) {
        toast.success(`Marked as ${status}`);
        await fetchDaily(selectedDate);
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Update status failed:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Generate ideas from custom topic
  const handleGenerateFromTopic = async () => {
    if (!customTopic.trim()) {
      toast.error('Please enter a trending topic');
      return;
    }
    
    setGeneratingCustom(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/trend-scout/generate-from-topic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: customTopic.trim() })
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success(`Generated ${result.ideas?.length || 0} ideas for "${customTopic}"`);
        setCustomTopic('');
        
        // Refresh data and update to today's date
        await fetchDates();
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
        await fetchDaily(today);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to generate ideas');
      }
    } catch (error) {
      console.error('Generate from topic failed:', error);
      toast.error('Failed to generate ideas');
    } finally {
      setGeneratingCustom(false);
    }
  };

  // Delete idea handler
  const handleDeleteIdea = async (trendIndex) => {
    if (!selectedDate) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/trend-scout/delete-idea`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          trend_index: trendIndex
        })
      });
      
      if (response.ok) {
        toast.success('Idea deleted');
        setDeleteConfirm(null);
        // Remove from local state without full reload
        setData(prev => ({
          ...prev,
          trends: prev.trends.filter((_, i) => i !== trendIndex)
        }));
      } else {
        toast.error('Failed to delete idea');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete idea');
    } finally {
      setDeleting(false);
    }
  };

  // Generate image handler
  const handleGenerateImage = async (trendIndex) => {
    if (!selectedDate || !data?.trends?.[trendIndex]) return;
    
    const trend = data.trends[trendIndex];
    setGeneratingImage(trendIndex);
    
    // Create AbortController with 90 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/trend-scout/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          trend_index: trendIndex,
          meme_text: trend.meme_idea,
          topic: trend.topic,
          product: trend.product
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json();
        toast.success('Image generated!');
        // Update local state with new image URL
        setData(prev => ({
          ...prev,
          trends: prev.trends.map((t, i) => 
            i === trendIndex ? { ...t, image_url: result.image_url, image_error: null } : t
          )
        }));
      } else {
        const error = await response.json();
        const errorMsg = error.detail || 'Failed to generate image';
        toast.error(errorMsg);
        // Store error in trend for display
        setData(prev => ({
          ...prev,
          trends: prev.trends.map((t, i) => 
            i === trendIndex ? { ...t, image_error: 'Generation failed. Check Gemini API key in Settings.' } : t
          )
        }));
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Image generation failed:', error);
      
      // Check if it was a timeout/abort error
      if (error.name === 'AbortError') {
        toast.error('Image generation timed out. Try again in a moment.');
        setData(prev => ({
          ...prev,
          trends: prev.trends.map((t, i) => 
            i === trendIndex ? { ...t, image_error: 'Image generation timed out. Try again in a moment.' } : t
          )
        }));
      } else {
        toast.error('Failed to generate image');
        // Store error in trend for display
        setData(prev => ({
          ...prev,
          trends: prev.trends.map((t, i) => 
            i === trendIndex ? { ...t, image_error: 'Generation failed. Check Gemini API key in Settings.' } : t
          )
        }));
      }
    } finally {
      setGeneratingImage(null);
    }
  };

  // Generate image with custom prompt handler
  const handleGenerateCustomPromptImage = async (trendIndex) => {
    if (!selectedDate || !customPromptText.trim()) {
      toast.error('Please enter a custom prompt');
      return;
    }
    
    setGeneratingCustomImage(trendIndex);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/trend-scout/generate-image-with-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          trend_index: trendIndex,
          custom_prompt: customPromptText.trim()
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json();
        toast.success('Custom prompt image generated!');
        setData(prev => ({
          ...prev,
          trends: prev.trends.map((t, i) => 
            i === trendIndex ? { ...t, image_url: result.image_url, image_error: null, custom_prompt_used: customPromptText.trim() } : t
          )
        }));
        setCustomPromptIndex(null);
        setCustomPromptText('');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to generate image');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        toast.error('Image generation timed out. Try again.');
      } else {
        toast.error('Failed to generate image');
      }
    } finally {
      setGeneratingCustomImage(null);
    }
  };

  // Regenerate handler
  const handleRegenerate = async (trendIndex) => {
    if (!selectedDate) return;
    
    setRegenerating(trendIndex);
    try {
      const response = await fetch(`${API_BASE_URL}/api/trend-scout/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          trend_index: trendIndex
        })
      });
      
      if (response.ok) {
        toast.success('Idea regenerated!');
        await fetchDaily(selectedDate);
      } else {
        toast.error('Failed to regenerate idea');
      }
    } catch (error) {
      console.error('Regenerate failed:', error);
      toast.error('Failed to regenerate idea');
    } finally {
      setRegenerating(null);
    }
  };

  // Copy to clipboard
  const handleCopy = async (text, fieldId) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      toast.success('Copied!', { autoClose: 1500 });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  // Navigate dates
  const navigateDate = (direction) => {
    const currentIndex = availableDates.indexOf(selectedDate);
    if (direction === 'prev' && currentIndex < availableDates.length - 1) {
      setSelectedDate(availableDates[currentIndex + 1]);
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedDate(availableDates[currentIndex - 1]);
    }
  };

  // Toggle expand
  const toggleExpand = (index) => {
    setExpandedTrends(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  // Calculate stats
  const getStats = () => {
    if (!data) return { found: 0, ideas: 0, posted: 0, created: 0, pending: 0, custom: 0 };
    
    const trends = data.trends || [];
    const sources = data.sources || {};
    
    // Count custom ideas from trends array (with null check)
    const customCount = trends.filter(t => t && t.source === 'Custom').length;
    
    return {
      custom: customCount,
      ideas: trends.filter(t => t && t.status !== 'filtered').length,
      posted: trends.filter(t => t && t.status === 'posted').length,
      created: trends.filter(t => t && t.status === 'created').length,
      pending: trends.filter(t => t && t.status === 'pending').length
    };
  };

  const stats = getStats();

  return (
    <div data-testid="trend-scout-tab" className="space-y-4">
      {/* CONTROLS ROW */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDate('prev')}
            disabled={availableDates.indexOf(selectedDate) >= availableDates.length - 1}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} className="text-slate-300" />
          </button>
          
          <select
            value={selectedDate || ''}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm min-w-[140px]"
          >
            {availableDates.map(date => (
              <option key={date} value={date}>{formatDate(date)}</option>
            ))}
            {availableDates.length === 0 && (
              <option value="">No data yet</option>
            )}
          </select>
          
          <button
            onClick={() => navigateDate('next')}
            disabled={availableDates.indexOf(selectedDate) <= 0}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} className="text-slate-300" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showSettings 
                ? 'bg-teal-500/20 text-teal-400' 
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            <Settings size={16} />
            Settings
          </button>
          
          <button
            onClick={handleRunNow}
            disabled={runningNow}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 disabled:opacity-50 transition-all"
          >
            {runningNow ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap size={16} />
                Run Now
              </>
            )}
          </button>
          <button
            onClick={handleTestTelegram}
            disabled={testingTelegram}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 transition-all"
          >
            {testingTelegram ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={14} />
                Test Telegram
              </>
            )}
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNER - Shows below controls after Run Now action */}
      {feedbackMessage && (
        <div 
          data-testid="run-now-feedback-banner"
          className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium ${
            feedbackType === 'success' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : feedbackType === 'info'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          <span>{feedbackMessage}</span>
          <button 
            onClick={() => { setFeedbackMessage(null); setFeedbackType(null); }}
            className="p-1 hover:opacity-70 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SETTINGS PANEL */}
      {showSettings && settings && (
        <div className="p-4 rounded-xl bg-[#1E293B] border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-3">Trend Scout Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
            <div>
              <span className="text-slate-500 block mb-1">Schedule</span>
              <span className="text-white">{settings.schedule_time || '09:00'} AM IST Daily</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Telegram</span>
              <span className={settings.telegram_enabled ? 'text-teal-400' : 'text-slate-400'}>
                {settings.telegram_enabled ? '✓ OyeBark Group' : 'Disabled'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Ideas/Day</span>
              <span className="text-white">{settings.max_ideas || 5}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Skip Categories</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {(settings.skip_categories || []).map((cat, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Sources</span>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">
                  Custom Topics
                </span>
                <span className="px-2 py-0.5 rounded text-xs bg-teal-500/20 text-teal-400">
                  Trends Screenshot
                </span>
              </div>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Products</span>
              <span className="text-white">Auto-rotate catalog</span>
            </div>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-teal-400" />
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !data && (
        <div className="text-center py-12 px-4">
          <Flame size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No trends generated for {selectedDate ? formatDate(selectedDate) : 'today'}
          </h3>
          <p className="text-slate-400 mb-6">
            Click "Run Now" to generate today's trending meme ideas, or enter a custom topic below
          </p>
          
          {/* Custom Topic Input for Empty State */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-6">
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Type a trending topic (e.g. LPG cylinder price Delhi)"
              className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !generatingCustom) {
                  handleGenerateFromTopic();
                }
              }}
            />
            <button
              onClick={handleGenerateFromTopic}
              disabled={generatingCustom || !customTopic.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
            >
              {generatingCustom ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Generate Ideas
                </>
              )}
            </button>
          </div>
          
          <button
            onClick={handleRunNow}
            disabled={runningNow}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 disabled:opacity-50 transition-all"
          >
            {runningNow ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap size={16} />
                Run Now
              </>
            )}
          </button>
        </div>
      )}

      {/* DATA VIEW */}
      {!loading && data && (
        <>
          {/* STATS STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl bg-[#1E293B] border border-slate-700">
              <div className="text-2xl font-bold text-purple-400">{stats.custom}</div>
              <div className="text-xs text-slate-500">Custom</div>
            </div>
            <div className="p-3 rounded-xl bg-[#1E293B] border border-slate-700">
              <div className="text-2xl font-bold text-teal-400">{stats.ideas}</div>
              <div className="text-xs text-slate-500">Ideas</div>
            </div>
            <div className="p-3 rounded-xl bg-[#1E293B] border border-slate-700">
              <div className="text-2xl font-bold text-green-400">{stats.posted}</div>
              <div className="text-xs text-slate-500">Posted</div>
            </div>
            <div className="p-3 rounded-xl bg-[#1E293B] border border-slate-700">
              <div className="text-2xl font-bold text-blue-400">{stats.created}</div>
              <div className="text-xs text-slate-500">Created</div>
            </div>
            <div className="p-3 rounded-xl bg-[#1E293B] border border-slate-700">
              <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
              <div className="text-xs text-slate-500">Pending</div>
            </div>
          </div>

          {/* CUSTOM TREND INPUT */}
          <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-[#1E293B] border border-slate-700">
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Type a trending topic (e.g. LPG cylinder price Delhi)"
              className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !generatingCustom) {
                  handleGenerateFromTopic();
                }
              }}
            />
            <button
              onClick={handleGenerateFromTopic}
              disabled={generatingCustom || !customTopic.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
            >
              {generatingCustom ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Generate Ideas
                </>
              )}
            </button>
          </div>

          {/* INFO BAR */}
          <div className="flex items-center gap-3 flex-wrap px-4 py-2 rounded-lg bg-teal-500/6 border border-teal-500/20 text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Bot size={14} className="text-teal-400" />
              Generated: {data.generated_at ? new Date(data.generated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-purple-400">
              Custom: {stats.custom}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">
              Filtered: {data.trends?.filter(t => t && t.status === 'filtered').length || 0}
            </span>
            {data.telegram_sent && (
              <>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-teal-400">
                  <Send size={12} />
                  Sent to Telegram
                </span>
              </>
            )}
          </div>

          {/* TRENDS LIST - Sorted by most recent first (reversed order) */}
          <div className="space-y-2">
            {[...(data.trends || [])].map((trend, idx) => ({ trend, originalIndex: idx }))
              .filter(item => item.trend != null)
              .reverse()
              .map(({ trend, originalIndex }, displayIndex) => {
              const isFiltered = trend.status === 'filtered';
              const isExpanded = expandedTrends[originalIndex];
              const statusConfig = STATUS_CONFIG[trend.status] || STATUS_CONFIG.pending;

              return (
                <div
                  key={`trend-${originalIndex}-${trend.topic || displayIndex}`}
                  className="rounded-xl bg-[#1E293B] border border-slate-700 overflow-hidden"
                >
                  {/* COLLAPSED ROW */}
                  <div
                    onClick={() => toggleExpand(originalIndex)}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-700/50 transition-colors"
                  >
                    {/* Number Badge */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isFiltered 
                          ? 'bg-red-500/10 text-red-400' 
                          : 'bg-teal-500/12 text-teal-400'
                      }`}
                    >
                      {displayIndex + 1}
                    </div>

                    {/* Topic & Idea */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-white truncate">
                        {trend.topic}
                      </div>
                      {!isFiltered && (
                        <div className="text-[11px] text-slate-500 truncate">
                          {trend.meme_idea}
                        </div>
                      )}
                    </div>

                    {/* Source Badge - Color coded by source */}
                    <span className={`hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                      trend.source === 'Custom'
                        ? 'bg-purple-500/12 text-purple-400'
                        : trend.source === 'Google Trends'
                          ? 'bg-green-500/12 text-green-400'
                          : 'bg-slate-500/12 text-slate-400'  // Legacy for BBNPost and others
                    }`}>
                      {(trend.source === 'BBNPost' || trend.source === 'Google Trends') ? 'Legacy' : trend.source}
                    </span>

                    {/* Volume */}
                    <span className="hidden sm:block text-[11px] text-slate-500 shrink-0">
                      {trend.volume}
                    </span>

                    {/* Status Badge */}
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-medium shrink-0"
                      style={{
                        backgroundColor: statusConfig.bg,
                        color: statusConfig.color
                      }}
                    >
                      {statusConfig.label}
                    </span>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(originalIndex);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete idea"
                    >
                      <Trash2 size={14} />
                    </button>

                    {/* Chevron */}
                    <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                      <ChevronDown size={16} className="text-slate-500" />
                    </div>
                  </div>

                  {/* EXPANDED SECTION */}
                  {isExpanded && (
                    <div className="border-t border-slate-700 p-4">
                      {isFiltered ? (
                        <div className="text-sm text-slate-400 italic">
                          ⚠️ Auto-filtered: {trend.category} topics are skipped for brand safety.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* LEFT COLUMN */}
                          <div className="space-y-3">
                            {/* Meme Idea */}
                            <div>
                              <label className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider">
                                Meme Idea
                              </label>
                              <div className="mt-1 p-3 rounded-lg bg-slate-800 text-sm text-slate-200">
                                {trend.meme_idea}
                              </div>
                            </div>

                            {/* Caption */}
                            <div>
                              <label className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider">
                                Caption
                              </label>
                              <div className="mt-1 p-3 rounded-lg bg-slate-800 text-sm text-slate-200">
                                {trend.caption}
                              </div>
                            </div>

                            {/* Hashtags */}
                            <div>
                              <label className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider">
                                Hashtags
                              </label>
                              <div className="mt-1 p-3 rounded-lg bg-slate-800 text-sm text-purple-400">
                                {trend.hashtags}
                              </div>
                            </div>
                          </div>

                          {/* RIGHT COLUMN */}
                          <div className="space-y-3">
                            {/* Meta Grid */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2 rounded-lg bg-slate-800 text-center">
                                <div className="text-xs text-slate-500">🎨 Format</div>
                                <div className="text-sm text-white mt-1">{trend.format}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-800 text-center">
                                <div className="text-xs text-slate-500">🦴 Product</div>
                                <div className="text-sm text-white mt-1">{trend.product}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-800 text-center">
                                <div className="text-xs text-slate-500">⚡ Difficulty</div>
                                <div 
                                  className="text-sm font-medium mt-1"
                                  style={{ color: DIFFICULTY_COLORS[trend.difficulty] || '#F59E0B' }}
                                >
                                  {trend.difficulty}
                                </div>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-800 text-center">
                                <div className="text-xs text-slate-500">⏱️ Time</div>
                                <div className="text-sm text-white mt-1">{trend.time_to_create}</div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2">
                              {/* Mark as Posted */}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(originalIndex, 'posted'); }}
                                disabled={updatingStatus === originalIndex || trend.status === 'posted'}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 disabled:opacity-50 transition-all"
                              >
                                {updatingStatus === originalIndex ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Check size={14} />
                                )}
                                {trend.status === 'posted' ? 'Already Posted' : 'Mark as Posted'}
                              </button>

                              {/* Copy Buttons */}
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleCopy(trend.caption, `caption-${originalIndex}`); }}
                                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                                >
                                  {copiedField === `caption-${originalIndex}` ? (
                                    <Check size={12} className="text-teal-400" />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                  Copy Caption
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleCopy(trend.hashtags, `tags-${originalIndex}`); }}
                                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                                >
                                  {copiedField === `tags-${originalIndex}` ? (
                                    <Check size={12} className="text-teal-400" />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                  Copy Tags
                                </button>
                              </div>

                              {/* Status Buttons */}
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleUpdateStatus(originalIndex, 'created'); }}
                                  disabled={updatingStatus === originalIndex || trend.status === 'created'}
                                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 disabled:opacity-50 transition-colors"
                                >
                                  Mark Created
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleUpdateStatus(originalIndex, 'skipped'); }}
                                  disabled={updatingStatus === originalIndex || trend.status === 'skipped'}
                                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-400 disabled:opacity-50 transition-colors"
                                >
                                  Skip
                                </button>
                              </div>

                              {/* Regenerate */}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRegenerate(originalIndex); }}
                                disabled={regenerating === originalIndex}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-slate-600 hover:border-slate-500 text-slate-400 hover:text-slate-300 disabled:opacity-50 transition-colors"
                              >
                                {regenerating === originalIndex ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <RefreshCw size={12} />
                                )}
                                Regenerate Idea
                              </button>

                              {/* Generate Image */}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleGenerateImage(originalIndex); }}
                                disabled={generatingImage === originalIndex}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-purple-500/50 hover:border-purple-500 text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors"
                              >
                                {generatingImage === originalIndex ? (
                                  <>
                                    <Loader2 size={12} className="animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Image size={12} />
                                    {trend.image_url ? 'Regenerate Image' : 'Generate Image'}
                                  </>
                                )}
                              </button>

                              {/* Custom Prompt Toggle */}
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  if (customPromptIndex === originalIndex) {
                                    setCustomPromptIndex(null);
                                    setCustomPromptText('');
                                  } else {
                                    setCustomPromptIndex(originalIndex);
                                    setCustomPromptText('');
                                  }
                                }}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-orange-500/50 hover:border-orange-500 text-orange-400 hover:text-orange-300 transition-colors"
                              >
                                <Wand2 size={12} />
                                {customPromptIndex === originalIndex ? 'Hide Custom Prompt' : 'Use Custom Prompt'}
                              </button>

                              {/* Custom Prompt Input */}
                              {customPromptIndex === originalIndex && (
                                <div className="mt-2 space-y-2 p-3 rounded-lg bg-slate-800 border border-orange-500/30" onClick={(e) => e.stopPropagation()}>
                                  <label className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">
                                    Custom Image Prompt
                                  </label>
                                  <textarea
                                    value={customPromptText}
                                    onChange={(e) => setCustomPromptText(e.target.value)}
                                    placeholder="Photorealistic photograph of two Indian street dogs sitting together in front of a chai stall..."
                                    rows={4}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                                  />
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-slate-500">{customPromptText.length} chars</span>
                                    <button
                                      onClick={() => handleGenerateCustomPromptImage(originalIndex)}
                                      disabled={generatingCustomImage === originalIndex || !customPromptText.trim()}
                                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                      {generatingCustomImage === originalIndex ? (
                                        <>
                                          <Loader2 size={12} className="animate-spin" />
                                          Generating...
                                        </>
                                      ) : (
                                        <>
                                          <Wand2 size={12} />
                                          Generate with Custom Prompt
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Image Error Message */}
                              {trend.image_error && !trend.image_url && (
                                <p className="text-xs text-red-400 mt-1">{trend.image_error}</p>
                              )}

                              {/* Generated Image Preview with Download/Regenerate buttons */}
                              {trend.image_url && (
                                <div className="mt-3 space-y-2">
                                  <div className="rounded-2xl overflow-hidden border border-slate-700 max-w-full">
                                    <img 
                                      src={trend.image_url} 
                                      alt="Generated meme" 
                                      className="w-full h-auto"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <a
                                      href={trend.image_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 transition-colors"
                                    >
                                      Download
                                    </a>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleGenerateImage(originalIndex); }}
                                      disabled={generatingImage === originalIndex}
                                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-50 transition-colors"
                                    >
                                      {generatingImage === originalIndex ? (
                                        <Loader2 size={12} className="animate-spin" />
                                      ) : (
                                        <RefreshCw size={12} />
                                      )}
                                      Regenerate
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-6 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-2">Delete this trend idea?</h3>
            <p className="text-sm text-slate-400 mb-4">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteIdea(deleteConfirm)}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROMPT TESTER SECTION */}
      <PromptTesterSection />
    </div>
  );
};

// Prompt Tester - Self-contained component with its own state
const PromptTesterSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [withLogos, setWithLogos] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Send to Telegram state
  const [showTelegramCaption, setShowTelegramCaption] = useState(false);
  const [telegramCaption, setTelegramCaption] = useState('');
  const [sendingToTelegram, setSendingToTelegram] = useState(false);

  const defaultCaption = `Bumrah gets the wicket, crowd goes wild… and my dog is just focused on getting his BarkBite treat 🏆🐾 True priorities right there! Congratulations Team India on the T20 World Cup! 🇮🇳✨ #T20WorldCup #IndiaWins #JaspritBumrah #DogTreats #CricketDogs #OyeBark #PetYupp`;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setGenerating(true);
    setError(null);
    setResult(null);
    setShowTelegramCaption(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/trend-scout/test-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          with_logos: withLogos
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        const errData = await response.json();
        setError(errData.detail || 'Failed to generate image');
      }
    } catch (err) {
      console.error('Prompt test failed:', err);
      setError('Failed to generate image. Check console for details.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setResult(null);
    setShowTelegramCaption(false);
    handleGenerate();
  };

  const handleSendToTelegram = async () => {
    if (!result || !result.image_url) return;
    
    setSendingToTelegram(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/trend-scout/send-to-telegram-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: result.image_url,
          caption: telegramCaption.trim() || defaultCaption
        })
      });
      
      if (response.ok) {
        toast.success('Image sent to Telegram!');
        setShowTelegramCaption(false);
      } else {
        const errData = await response.json();
        toast.error(errData.detail || 'Failed to send to Telegram');
      }
    } catch (err) {
      console.error('Send to Telegram failed:', err);
      toast.error('Failed to send to Telegram');
    } finally {
      setSendingToTelegram(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="mt-6 rounded-xl bg-[#1E293B] border border-slate-700 overflow-hidden">
      {/* Header - Clickable to toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-500/10">
            <Zap size={18} className="text-teal-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-white">Prompt Tester</h3>
            <p className="text-xs text-slate-500">Test raw prompts directly against the image API</p>
          </div>
        </div>
        <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDown size={18} className="text-slate-500" />
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-slate-700 p-4 space-y-4">
          {/* Model Display Row */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Model</span>
            <span className="text-sm text-white font-mono">gemini-3.1-flash-image-preview</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-teal-500/20 text-teal-400">
              Active
            </span>
          </div>

          {/* Prompt Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Prompt
              </label>
              <span className="text-[10px] text-slate-600">{prompt.length} chars</span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Photorealistic DSLR photograph of two Indian street dogs sitting together..."
              rows={6}
              className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-slate-700 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors resize-none"
            />
          </div>

          {/* Logo Toggle + Generate Button Row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setWithLogos(!withLogos)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  withLogos ? 'bg-teal-500' : 'bg-slate-600'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    withLogos ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
              <span className="text-sm text-slate-300">Add OyeBark + PetYupp logo overlays</span>
            </label>

            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 size={16} />
                  Generate Image
                </>
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="space-y-3">
              {/* Generated Image */}
              <div className="rounded-xl overflow-hidden border border-slate-700">
                <img
                  src={result.image_url}
                  alt="Generated test image"
                  className="w-full h-auto"
                />
              </div>

              {/* Stats + Action Buttons Row */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Size: <span className="text-slate-300">{formatFileSize(result.file_size_bytes)}</span></span>
                  <span>Time: <span className="text-slate-300">{result.generation_time_seconds}s</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={result.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 transition-colors"
                  >
                    <Download size={14} />
                    Download
                  </a>
                  <button
                    onClick={handleRegenerate}
                    disabled={generating}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw size={14} />
                    Regenerate
                  </button>
                  <button
                    onClick={() => {
                      setShowTelegramCaption(!showTelegramCaption);
                      if (!telegramCaption) setTelegramCaption(defaultCaption);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
                  >
                    <Send size={14} />
                    Send to Telegram
                  </button>
                </div>
              </div>

              {/* Telegram Caption Input */}
              {showTelegramCaption && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-3">
                  <label className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider block">
                    Caption for Telegram
                  </label>
                  <textarea
                    value={telegramCaption}
                    onChange={(e) => setTelegramCaption(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-slate-700 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">{telegramCaption.length} chars</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowTelegramCaption(false)}
                        className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendToTelegram}
                        disabled={sendingToTelegram}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {sendingToTelegram ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            Confirm Send
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrendScoutTab;
