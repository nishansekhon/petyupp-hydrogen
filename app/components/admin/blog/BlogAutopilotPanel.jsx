/**
 * BlogAutopilotPanel Component
 * 
 * Main banner for the Blog Autopilot feature showing:
 * - Header with toggle and settings button
 * - Stats cards (Schedule, Topic Source, Next Post, This Month)
 * - Action buttons (Trigger Now, Refresh Queue)
 */

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { Bot, Settings, Clock, Zap, Play, RefreshCw, Calendar, TrendingUp, Key, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import AutopilotSettingsModal from './AutopilotSettingsModal';

const BlogAutopilotPanel = ({ onRunsRefresh }) => {
  const [status, setStatus] = useState({
    is_active: false,
    next_scheduled_date: null,
    total_scheduled: 0,
    generated_this_month: 0
  });
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchSettings();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/autopilot/status`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch autopilot status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/autopilot/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || data);
      }
    } catch (error) {
      console.error('Failed to fetch autopilot settings:', error);
    }
  };

  const handleToggle = async () => {
    setToggling(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/autopilot/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        setStatus(prev => ({ ...prev, is_active: data.is_active }));
        toast.success(data.is_active ? 'Autopilot enabled!' : 'Autopilot disabled');
      } else {
        toast.error('Failed to toggle autopilot');
      }
    } catch (error) {
      console.error('Failed to toggle autopilot:', error);
      toast.error('Failed to toggle autopilot');
    } finally {
      setToggling(false);
    }
  };

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/autopilot/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(
          <div>
            <strong>Blog Generated!</strong>
            <p className="text-sm mt-1">{data.title}</p>
            <p className="text-xs text-slate-400">SEO Score: {data.seo_score} • {data.word_count} words</p>
          </div>,
          { autoClose: 5000 }
        );
        fetchStatus();
        if (onRunsRefresh) onRunsRefresh();
      } else {
        toast.error(data.message || 'Failed to trigger autopilot');
      }
    } catch (error) {
      console.error('Failed to trigger autopilot:', error);
      toast.error('Failed to trigger autopilot');
    } finally {
      setTriggering(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/autopilot/queue/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        toast.success('Queue regenerated successfully');
        fetchStatus();
      } else {
        toast.error('Failed to regenerate queue');
      }
    } catch (error) {
      console.error('Failed to regenerate queue:', error);
      toast.error('Failed to regenerate queue');
    } finally {
      setRegenerating(false);
    }
  };

  const formatNextPost = (dateStr) => {
    if (!dateStr) return 'Not scheduled';
    
    // The dateStr is already in IST from the backend (e.g., "2026-02-10T10:00:00+05:30")
    // We want to display it as-is without browser timezone conversion
    const date = new Date(dateStr);
    const now = new Date();
    
    // Extract the hour and minute from the ISO string directly (after T, before +)
    const timeMatch = dateStr.match(/T(\d{2}):(\d{2})/);
    let displayTime = '10:00 AM';
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 || 12;
      displayTime = `${displayHour}:${minutes} ${ampm}`;
    }
    
    // Check if it's today or tomorrow in IST
    // Compare dates using just the date part from the ISO string
    const dateMatch = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      // Get current IST date (add 5:30 to UTC)
      const nowIST = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      const todayIST = nowIST.toISOString().split('T')[0];
      
      const tomorrowIST = new Date(nowIST.getTime() + (24 * 60 * 60 * 1000));
      const tomorrowDateStr = tomorrowIST.toISOString().split('T')[0];
      
      const scheduledDate = dateMatch[1];
      
      if (scheduledDate === todayIST) {
        return `Today ${displayTime} IST`;
      }
      if (scheduledDate === tomorrowDateStr) {
        return `Tomorrow ${displayTime} IST`;
      }
    }
    
    // For other dates, show the formatted date
    return `${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ${displayTime} IST`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '10:00 AM IST';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm} IST`;
  };

  if (loading) {
    return (
      <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-4 md:p-6 mb-6" data-testid="blog-autopilot-panel">
        {/* Row 1: Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="bg-teal-500/15 rounded-xl p-2">
              <Bot className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Blog Autopilot</h2>
              <p className="text-xs text-slate-500">AI generates, you approve in 10 seconds</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Toggle Switch */}
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                status.is_active ? 'bg-teal-500' : 'bg-slate-600'
              }`}
              data-testid="autopilot-toggle"
            >
              {toggling ? (
                <Loader2 className="absolute top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 text-white animate-spin" />
              ) : (
                <>
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${
                    status.is_active ? 'left-8' : 'left-1'
                  }`} />
                  <span className={`absolute top-1.5 text-[10px] font-bold ${
                    status.is_active ? 'left-2 text-white' : 'right-2 text-slate-400'
                  }`}>
                    {status.is_active ? 'ON' : 'OFF'}
                  </span>
                </>
              )}
            </button>
            
            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-xl border border-slate-600 text-slate-300 hover:border-teal-500 hover:text-teal-400 transition-colors"
              data-testid="autopilot-settings-btn"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-5">
          {/* Schedule */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-3 md:p-4" data-testid="stat-schedule">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Schedule</span>
            </div>
            <p className="text-sm text-slate-200 font-semibold">
              {formatTime(settings?.publish_time)}
            </p>
          </div>

          {/* Topic Source */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-3 md:p-4" data-testid="stat-topic-source">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Topic Source</span>
            </div>
            <p className="text-sm text-slate-200 font-semibold">3-Tier Priority</p>
            <div className="hidden md:flex items-center gap-1 mt-1 text-[10px] text-slate-400">
              <Calendar className="w-3 h-3" />
              <span>Calendar</span>
              <span className="text-slate-600">›</span>
              <Key className="w-3 h-3" />
              <span>Keywords</span>
              <span className="text-slate-600">›</span>
              <TrendingUp className="w-3 h-3" />
              <span>Trending</span>
            </div>
          </div>

          {/* Next Post */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-3 md:p-4" data-testid="stat-next-post">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Next Post</span>
            </div>
            <p className="text-sm text-slate-200 font-semibold">
              {formatNextPost(status.next_scheduled_date)}
            </p>
          </div>

          {/* This Month */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-3 md:p-4" data-testid="stat-this-month">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">This Month</span>
            </div>
            <p className="text-sm text-slate-200 font-semibold">
              {status.generated_this_month || 0} posts
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleTrigger}
            disabled={triggering}
            className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-teal-500/25 font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="trigger-now-btn"
          >
            {triggering ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Trigger Now
              </>
            )}
          </button>
          
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="border border-slate-600 text-slate-300 hover:border-teal-500 hover:text-teal-400 px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
            data-testid="refresh-queue-btn"
          >
            <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <AutopilotSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          settings={settings}
          onSettingsSaved={() => {
            fetchSettings();
            fetchStatus();
          }}
        />
      )}
    </>
  );
};

export default BlogAutopilotPanel;
