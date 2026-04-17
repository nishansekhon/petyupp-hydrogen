import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '@/config/api';
import { 
  Plus, Search, Edit2, Trash2, X, ExternalLink,
  ChevronDown, ChevronUp, Calendar, Camera, Film, Image,
  FileText, Play, BarChart3, Clock, CheckCircle, AlertCircle,
  AlertTriangle, Users, TrendingUp, Link, Package, Download
} from 'lucide-react';
import { FaInstagram, FaFacebook, FaTwitter, FaLinkedin, FaYoutube, FaAmazon, FaGlobe } from 'react-icons/fa';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { toast } from 'react-toastify';

const API_URL = API_BASE_URL + '/api';

// Status configuration - Draft is first (lowest) status
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-slate-500', textColor: 'text-slate-400', muted: true },
  requested: { label: 'Requested', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  in_progress: { label: 'In Progress', color: 'bg-orange-500', textColor: 'text-orange-400' },
  review: { label: 'Review', color: 'bg-purple-500', textColor: 'text-purple-400' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-500', textColor: 'text-blue-400' },
  revision: { label: 'Revision', color: 'bg-pink-500', textColor: 'text-pink-400' },
  delivered: { label: 'Delivered', color: 'bg-green-500', textColor: 'text-green-400' },
  posted: { label: 'Posted', color: 'bg-emerald-500', textColor: 'text-emerald-400' }
};

// Ordered status list for dropdown (Draft, Requested, In Progress, Review, Scheduled, Revision, Delivered, Posted)
const STATUS_ORDER = ['draft', 'requested', 'in_progress', 'review', 'scheduled', 'revision', 'delivered', 'posted'];

// Fixed designer options
const DESIGNER_OPTIONS = [
  { value: '', label: 'Select Designer' },
  { value: 'Rashi', label: 'Rashi' },
  { value: 'Akshay', label: 'Akshay' },
  { value: 'Ajay', label: 'Ajay' },
  { value: 'Eya', label: 'Eya' },
  { value: 'External', label: 'External' }
];

// Content type icons
const CONTENT_TYPE_CONFIG = {
  post: { label: 'Post', icon: Image },
  reel: { label: 'Reel', icon: Play },
  short_video: { label: 'Short Video', icon: Film },
  story: { label: 'Story', icon: Clock },
  carousel: { label: 'Carousel', icon: FileText },
  blog_banner: { label: 'Blog Banner', icon: FileText },
  video_thumbnail: { label: 'Thumbnail', icon: Film },
  ad_creative: { label: 'Ad Creative', icon: BarChart3 }
};

// Platform icons
const PLATFORM_ICONS = {
  instagram: FaInstagram,
  facebook: FaFacebook,
  twitter: FaTwitter,
  linkedin: FaLinkedin,
  youtube: FaYoutube,
  amazon: FaAmazon,
  website: FaGlobe,
  all: FaGlobe
};

// Priority colors
const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-gray-400' },
  medium: { label: 'Medium', color: 'text-blue-400' },
  high: { label: 'High', color: 'text-orange-400' },
  urgent: { label: 'Urgent', color: 'text-red-400' }
};

// Format date for display
const formatShortDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// Format number for reach display
const formatNumber = (num) => {
  if (!num) return '-';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// Get due date status - context-aware based on item status
// Now returns { text, color, isOverdue, isDueToday } for dot indicator rendering
const getDueDateStatus = (dueDate, itemStatus, deliveredDate, postedDate, scheduledDate, scheduledTime) => {
  const status = itemStatus?.toLowerCase();
  
  // Posted items - show posted date with checkmark (green, celebratory)
  if (status === 'posted') {
    const displayDate = postedDate || deliveredDate || dueDate;
    return { 
      text: displayDate ? `✓ ${formatShortDate(displayDate)}` : '✓ Posted', 
      color: 'text-green-400',
      isOverdue: false,
      isDueToday: false
    };
  }
  
  // Scheduled items - show scheduled date with countdown
  if (status === 'scheduled' && scheduledDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const schedDate = new Date(scheduledDate);
    schedDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((schedDate - today) / (1000 * 60 * 60 * 24));
    
    let countdown = '';
    if (diffDays === 0) countdown = 'Today';
    else if (diffDays === 1) countdown = 'Tomorrow';
    else if (diffDays < 0) countdown = `${Math.abs(diffDays)}d overdue`;
    else countdown = `in ${diffDays}d`;
    
    const timeStr = scheduledTime ? ` @ ${scheduledTime}` : '';
    return { 
      text: `📅 ${formatShortDate(scheduledDate)}${timeStr} (${countdown})`, 
      color: 'text-violet-400',
      isOverdue: false,
      isDueToday: false
    };
  }
  
  // Delivered items - show delivered date neutral (NOT overdue even if past due date)
  if (status === 'delivered') {
    const displayDate = deliveredDate || dueDate;
    return { 
      text: displayDate ? formatShortDate(displayDate) : 'Delivered', 
      color: 'text-slate-300',
      isOverdue: false,
      isDueToday: false
    };
  }
  
  // Cancelled items - show grey dash
  if (status === 'cancelled') {
    return { text: '—', color: 'text-slate-500', isOverdue: false, isDueToday: false };
  }
  
  // Draft items - no due date urgency
  if (status === 'draft') {
    return { text: dueDate ? formatShortDate(dueDate) : '-', color: 'text-slate-500', isOverdue: false, isDueToday: false };
  }
  
  // Active items (Requested, In Progress, Review, Revision) - show actual date with dot indicator
  if (!dueDate) return { text: '-', color: 'text-gray-400', isOverdue: false, isDueToday: false };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    // Overdue - show date with red indicator
    return { 
      text: formatShortDate(dueDate), 
      color: 'text-red-400',
      isOverdue: true,
      isDueToday: false
    };
  } else if (diffDays === 0) {
    // Due today - show date with yellow/orange indicator
    return { 
      text: formatShortDate(dueDate), 
      color: 'text-yellow-400',
      isOverdue: false,
      isDueToday: true
    };
  } else if (diffDays === 1) {
    return { text: formatShortDate(dueDate), color: 'text-orange-400', isOverdue: false, isDueToday: false };
  } else if (diffDays <= 3) {
    return { text: formatShortDate(dueDate), color: 'text-green-400', isOverdue: false, isDueToday: false };
  }
  return { text: formatShortDate(dueDate), color: 'text-slate-300', isOverdue: false, isDueToday: false };
};

// Get turnaround color/text - context-aware based on item status
const getTurnaroundDisplay = (days, itemStatus) => {
  const status = itemStatus?.toLowerCase();
  
  // No TAT data
  if (days === null || days === undefined) {
    return { text: '-', color: 'text-slate-500' };
  }
  
  const tatValue = parseFloat(days);
  
  // Posted or Delivered items - celebrate early, neutral for late
  if (status === 'posted' || status === 'delivered') {
    if (tatValue < 0) {
      // Early delivery - celebrate!
      return { 
        text: `${Math.abs(tatValue).toFixed(1)}d early ⚡`, 
        color: 'text-green-400' 
      };
    } else if (tatValue === 0) {
      return { text: 'On time ✓', color: 'text-green-400' };
    } else {
      // Late but done - show neutral, not red
      return { text: `${tatValue.toFixed(1)}d`, color: 'text-slate-400' };
    }
  }
  
  // Cancelled items
  if (status === 'cancelled') {
    return { text: '—', color: 'text-slate-500' };
  }
  
  // Active items - show remaining/overdue
  if (tatValue < 0) {
    return { text: `${Math.abs(tatValue).toFixed(1)}d over`, color: 'text-red-400' };
  } else if (tatValue === 0) {
    return { text: '0d left', color: 'text-orange-400' };
  } else if (tatValue <= 1) {
    return { text: `${tatValue.toFixed(1)}d left`, color: 'text-orange-400' };
  } else {
    return { text: `${tatValue.toFixed(1)}d left`, color: 'text-slate-300' };
  }
};

// ============================================
// Team Productivity Dashboard Component
// ============================================
const TeamProductivityDashboard = ({ isDarkMode }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [period, setPeriod] = useState('weekly');

  useEffect(() => {
    fetchProductivityStats();
  }, [period]);

  const fetchProductivityStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/content-pipeline/productivity-stats?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching productivity stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Period options
  const periodOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  if (loading && !stats) {
    return (
      <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-5 h-5 bg-slate-600 rounded" />
          <div className="h-5 w-48 bg-slate-600 rounded" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { content_manager, designers, platform_stats, platform_stats_source, date_range } = stats;

  // Calculate team totals
  const teamMembers = [
    {
      name: 'Eya',
      role: 'Content Manager',
      assigned: content_manager?.requests_created || 0,
      in_progress: content_manager?.items_in_review || 0,
      completed: content_manager?.items_posted || 0,
      on_time_rate: content_manager?.review_on_time_rate ?? 100
    },
    ...(designers || []).map(d => ({
      name: d.name,
      role: 'Designer',
      assigned: d.assigned || 0,
      in_progress: d.in_progress || 0,
      completed: d.completed_this_period || 0,
      on_time_rate: d.on_time_rate
    }))
  ];

  // Calculate summary totals
  const totalMembers = teamMembers.length;
  const totalCompleted = teamMembers.reduce((sum, m) => sum + m.completed, 0);
  const totalInProgress = teamMembers.reduce((sum, m) => sum + m.in_progress, 0);
  const backlogCount = content_manager?.backlog_count || 0;
  const pendingPostCount = content_manager?.items_delivered_pending_post || 0;

  // Platform config with icons and colors
  const platformConfig = {
    instagram: { icon: FaInstagram, label: 'Instagram', color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
    facebook: { icon: FaFacebook, label: 'Facebook', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    linkedin: { icon: FaLinkedin, label: 'LinkedIn', color: 'text-blue-600', bgColor: 'bg-blue-600/10' },
    twitter: { icon: FaTwitter, label: 'Twitter', color: 'text-sky-400', bgColor: 'bg-sky-500/10' },
    amazon: { icon: FaAmazon, label: 'Amazon', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
    website: { icon: FaGlobe, label: 'Website', color: 'text-teal-400', bgColor: 'bg-teal-500/10' },
    youtube: { icon: FaYoutube, label: 'YouTube', color: 'text-red-500', bgColor: 'bg-red-500/10' }
  };

  // Format on-time rate
  const formatOnTime = (rate) => {
    if (rate === null || rate === undefined || rate === 0) return '-';
    return `${rate}%`;
  };

  // Get subtle color for on-time rate
  const getOnTimeColor = (rate) => {
    if (rate === null || rate === undefined || rate === 0) return isDarkMode ? 'text-slate-500' : 'text-gray-400';
    if (rate >= 80) return isDarkMode ? 'text-teal-400' : 'text-teal-600';
    if (rate >= 50) return isDarkMode ? 'text-slate-300' : 'text-gray-600';
    return isDarkMode ? 'text-slate-400' : 'text-gray-500';
  };

  // Stat mini-card component
  const StatMiniCard = ({ value, label, highlight }) => (
    <div 
      className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg ${
        isDarkMode ? 'bg-slate-700/50' : 'bg-white border border-gray-100'
      }`}
      style={{ minWidth: '70px' }}
    >
      <span className={`text-lg font-bold ${
        highlight ? 'text-teal-500' : (isDarkMode ? 'text-white' : 'text-gray-900')
      }`}>
        {value}
      </span>
      <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );

  // Platform mini-card component
  const PlatformMiniCard = ({ platform }) => {
    const config = platformConfig[platform];
    const data = platform_stats?.[platform] || { posted: 0, target: 0 };
    const PlatformIcon = config.icon;
    const isOnTarget = data.posted >= data.target && data.target > 0;
    const hasNoPosts = data.posted === 0;
    
    return (
      <div 
        className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg border ${
          hasNoPosts 
            ? (isDarkMode ? 'bg-slate-700/30 border-red-900/50' : 'bg-white border-red-200')
            : isOnTarget 
              ? (isDarkMode ? 'bg-teal-900/20 border-teal-700/50' : 'bg-teal-50 border-teal-200')
              : (isDarkMode ? 'bg-slate-700/50 border-slate-600/50' : 'bg-white border-gray-200')
        }`}
        style={{ minWidth: '80px' }}
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          <PlatformIcon className={`w-3.5 h-3.5 ${config.color}`} />
          <span className={`text-base font-bold ${
            hasNoPosts 
              ? (isDarkMode ? 'text-red-400' : 'text-red-500')
              : isOnTarget 
                ? 'text-teal-500' 
                : (isDarkMode ? 'text-white' : 'text-gray-900')
          }`}>
            {data.posted}/{data.target}
          </span>
        </div>
        <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          {config.label}
        </span>
      </div>
    );
  };

  return (
    <div 
      className={`rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-gray-50/50 border-gray-200/50'}`}
      data-testid="team-productivity-dashboard"
    >
      {/* Row 1: Header with Period Selector */}
      <div className={`flex items-center justify-between px-4 py-3 ${showDetails ? `border-b ${isDarkMode ? 'border-slate-700/50' : 'border-gray-200/50'}` : ''}`}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-500" />
            <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Team Productivity
            </span>
          </div>
          
          {/* Period Dropdown */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className={`px-2 py-1 rounded-md text-xs font-medium border-none cursor-pointer transition-colors ${
              isDarkMode 
                ? 'bg-slate-700 text-white hover:bg-slate-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            data-testid="productivity-period-select"
          >
            {periodOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          {/* Date Range Display */}
          <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            {date_range || ''}
          </span>
          
          {/* Loading indicator */}
          {loading && (
            <div className="w-3 h-3 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
          )}
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            isDarkMode 
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
          }`}
          data-testid="productivity-dashboard-toggle"
        >
          <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
          <svg 
            className={`w-5 h-5 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Row 2: Stats Mini-Cards */}
      <div className="px-4 py-3">
        <div className="flex flex-wrap gap-2 justify-start">
          <StatMiniCard value={totalMembers} label="Members" />
          <StatMiniCard value={totalCompleted} label="Done" highlight={totalCompleted > 0} />
          <StatMiniCard value={totalInProgress} label="Active" />
          <StatMiniCard value={backlogCount} label="Queue" />
          <StatMiniCard value={pendingPostCount} label="Ready" />
        </div>
      </div>

      {/* Row 3: Platform Cards */}
      <div className={`px-4 pb-4`}>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            PLATFORMS
          </span>
          {platform_stats_source && (
            <span className={`px-1.5 py-0.5 rounded text-xs ${
              platform_stats_source === 'metricool' 
                ? (isDarkMode ? 'bg-teal-900/50 text-teal-400' : 'bg-teal-100 text-teal-700')
                : (isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-500')
            }`}>
              {platform_stats_source === 'metricool' ? '📊 Metricool' : '📝 Manual'}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(platformConfig).filter(p => platform_stats?.[p]).map((platform) => (
            <PlatformMiniCard key={platform} platform={platform} />
          ))}
        </div>
      </div>

      {/* Expanded: Team Details Table */}
      {showDetails && (
        <div className={`px-4 pb-4 border-t ${isDarkMode ? 'border-slate-700/50' : 'border-gray-200/50'}`}>
          <div className={`mt-3 rounded-lg overflow-hidden ${isDarkMode ? 'bg-slate-700/30' : 'bg-white border border-gray-100'}`} data-testid="team-stats-table">
            <table className="w-full">
              <thead>
                <tr className={isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}>
                  <th className={`text-left px-3 py-2 text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Team Member</th>
                  <th className={`text-left px-3 py-2 text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Role</th>
                  <th className={`text-center px-3 py-2 text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Assigned</th>
                  <th className={`text-center px-3 py-2 text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>In Progress</th>
                  <th className={`text-center px-3 py-2 text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Completed</th>
                  <th className={`text-center px-3 py-2 text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>On-Time</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/30' : 'divide-gray-100'}`}>
                {teamMembers.map((member) => (
                  <tr key={member.name}>
                    <td className={`px-3 py-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      {member.name}
                    </td>
                    <td className={`px-3 py-2 text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                      {member.role}
                    </td>
                    <td className={`text-center px-3 py-2 text-sm ${
                      member.assigned === 0 ? (isDarkMode ? 'text-slate-600' : 'text-gray-300') : (isDarkMode ? 'text-slate-300' : 'text-gray-600')
                    }`}>
                      {member.assigned || '-'}
                    </td>
                    <td className={`text-center px-3 py-2 text-sm ${
                      member.in_progress === 0 ? (isDarkMode ? 'text-slate-600' : 'text-gray-300') : (isDarkMode ? 'text-orange-400/80' : 'text-orange-500')
                    }`}>
                      {member.in_progress || '-'}
                    </td>
                    <td className={`text-center px-3 py-2 text-sm ${
                      member.completed === 0 ? (isDarkMode ? 'text-slate-600' : 'text-gray-300') : 'text-teal-500'
                    }`}>
                      {member.completed || '-'}
                    </td>
                    <td className={`text-center px-3 py-2 text-sm ${getOnTimeColor(member.on_time_rate)}`}>
                      {formatOnTime(member.on_time_rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// Posting Checklist Component (for expanded rows)
// ============================================
const PostingChecklist = ({ request, onUpdate, isDarkMode }) => {
  const [postingPlatform, setPostingPlatform] = useState(null);
  const [postUrl, setPostUrl] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Use checklist from request, with fallback to defaults based on content type
  const getChecklist = () => {
    if (request.posting_checklist && request.posting_checklist.length > 0) {
      return request.posting_checklist;
    }
    // Generate default checklist based on content type
    const requirements = {
      post: { instagram: true, facebook: true, linkedin: true, twitter: true },
      carousel: { instagram: true, facebook: true, linkedin: false, twitter: false },
      reel: { instagram: true, facebook: true, linkedin: false, twitter: false },
      short_video: { instagram: true, facebook: true, linkedin: false, twitter: true },
      story: { instagram: true, facebook: false, linkedin: false, twitter: false },
      blog_banner: { instagram: true, facebook: true, linkedin: true, twitter: true },
      video_thumbnail: { instagram: false, facebook: false, linkedin: false, twitter: false },
      ad_creative: { instagram: true, facebook: true, linkedin: false, twitter: false }
    };
    const contentType = request.content_type || 'post';
    const reqs = requirements[contentType] || requirements.post;
    return ['instagram', 'facebook', 'linkedin', 'twitter'].map(platform => ({
      platform,
      required: reqs[platform],
      posted: false,
      posted_by: null,
      posted_at: null,
      post_url: null
    }));
  };

  // Validate URL matches platform
  const validateUrl = (url, platform) => {
    if (!url) return { valid: false, error: 'URL is required' };
    
    const platformDomains = {
      instagram: ['instagram.com', 'instagr.am'],
      facebook: ['facebook.com', 'fb.com', 'fb.watch'],
      linkedin: ['linkedin.com'],
      twitter: ['twitter.com', 'x.com']
    };
    
    const domains = platformDomains[platform] || [];
    const valid = domains.some(domain => url.toLowerCase().includes(domain));
    
    if (!valid) {
      return { valid: false, error: `URL must contain ${domains.join(' or ')}` };
    }
    return { valid: true };
  };

  const handleMarkPosted = async (platform) => {
    const validation = validateUrl(postUrl, platform);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/content-pipeline/${request.id}/mark-posted`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          platform,
          post_url: postUrl,
          posted_by: 'Admin'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} marked as posted`);
        setPostingPlatform(null);
        setPostUrl('');
        onUpdate?.();
      } else {
        toast.error(data.error || 'Failed to mark as posted');
      }
    } catch (error) {
      toast.error('Failed to mark as posted');
    } finally {
      setLoading(false);
    }
  };

  const handleUnmarkPosted = async (platform) => {
    if (!window.confirm(`Remove post status for ${platform}?`)) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/content-pipeline/${request.id}/unmark-posted`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ platform })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Post status removed');
        onUpdate?.();
      } else {
        toast.error(data.error || 'Failed to unmark');
      }
    } catch (error) {
      toast.error('Failed to unmark');
    } finally {
      setLoading(false);
    }
  };

  const displayChecklist = getChecklist();

  return (
    <div className={`p-4 border-t ${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`} data-testid={`posting-checklist-${request.id}`}>
      <h4 className={`text-sm font-medium mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        <CheckCircle size={16} className="text-teal-400" />
        Posting Checklist
      </h4>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {displayChecklist.map((item) => {
          const PlatformIcon = PLATFORM_ICONS[item.platform] || FaGlobe;
          const isPosted = item.posted;
          const isRequired = item.required;
          
          return (
            <div
              key={item.platform}
              className={`rounded-lg p-3 border ${
                isPosted
                  ? isDarkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'
                  : isRequired
                    ? isDarkMode ? 'bg-slate-700 border-orange-700' : 'bg-white border-orange-200'
                    : isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PlatformIcon className={`w-4 h-4 ${
                    item.platform === 'instagram' ? 'text-pink-400' :
                    item.platform === 'facebook' ? 'text-blue-500' :
                    item.platform === 'twitter' ? 'text-sky-400' : 'text-blue-600'
                  }`} />
                  <span className={`text-sm font-medium capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {item.platform}
                  </span>
                </div>
                {isRequired && !isPosted && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-orange-900/50 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>
                    Required
                  </span>
                )}
                {!isRequired && !isPosted && (
                  <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    Optional
                  </span>
                )}
              </div>

              {isPosted ? (
                <div>
                  <div className="flex items-center gap-1 text-green-400 mb-1">
                    <CheckCircle size={14} />
                    <span className="text-xs">Posted</span>
                  </div>
                  {item.post_url && (
                    <a
                      href={item.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-teal-400 hover:underline mb-2"
                    >
                      <ExternalLink size={12} />
                      View Post
                    </a>
                  )}
                  <button
                    onClick={() => handleUnmarkPosted(item.platform)}
                    disabled={loading}
                    className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-slate-600 hover:bg-slate-500 text-slate-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}
                  >
                    Remove
                  </button>
                </div>
              ) : postingPlatform === item.platform ? (
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder={`Paste ${item.platform} URL...`}
                    value={postUrl}
                    onChange={(e) => setPostUrl(e.target.value)}
                    className={`w-full px-2 py-1.5 text-xs rounded border ${
                      isDarkMode ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleMarkPosted(item.platform)}
                      disabled={loading || !postUrl}
                      className="flex-1 text-xs px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded disabled:opacity-50"
                    >
                      {loading ? '...' : 'Save'}
                    </button>
                    <button
                      onClick={() => { setPostingPlatform(null); setPostUrl(''); }}
                      className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-600'}`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setPostingPlatform(item.platform)}
                  className={`w-full text-xs px-2 py-1.5 rounded ${
                    isRequired
                      ? 'bg-teal-600 hover:bg-teal-700 text-white'
                      : isDarkMode ? 'bg-slate-600 hover:bg-slate-500 text-slate-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                  }`}
                >
                  Mark as Posted
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Status Dropdown Component
const StatusDropdown = ({ status, onChange, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const buttonRef = useRef(null);
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.requested;
  const isPosted = status === 'posted';

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      // Calculate if we need to open upward
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const dropdownHeight = 320; // Approximate height for all status options
      setOpenUpward(spaceBelow < dropdownHeight);
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`px-2 py-1 rounded text-xs font-medium ${config.color} text-white flex items-center gap-1`}
        data-testid="status-dropdown-button"
      >
        {isPosted && <CheckCircle size={10} />}
        {config.label}
        <ChevronDown size={12} className={openUpward && isOpen ? 'rotate-180' : ''} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
          <div 
            className={`absolute z-[101] rounded-lg shadow-lg py-1 min-w-[130px] max-h-60 overflow-y-auto ${
              isDarkMode ? 'bg-slate-700' : 'bg-white border border-gray-200'
            }`}
            style={openUpward ? { bottom: '100%', marginBottom: '4px' } : { top: '100%', marginTop: '4px' }}
          >
            {STATUS_ORDER.map((key) => {
              const val = STATUS_CONFIG[key];
              return (
                <button
                  key={key}
                  onClick={() => { onChange(key); setIsOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-600 flex items-center gap-1 ${
                    key === status ? (isDarkMode ? 'bg-slate-600' : 'bg-gray-100') : ''
                  } ${val.textColor}`}
                >
                  {key === 'posted' && <CheckCircle size={12} />}
                  {key === 'scheduled' && <Calendar size={12} />}
                  {val.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// Helper function to format relative time (handles UTC timestamps)
const formatTimeAgo = (date) => {
  if (!date) return '';
  
  // Parse the date - if it doesn't have timezone info, treat it as UTC
  let dateObj;
  if (typeof date === 'string') {
    // If no timezone indicator, append Z to treat as UTC
    if (!date.includes('Z') && !date.includes('+') && !date.includes('-', 10)) {
      dateObj = new Date(date + 'Z');
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = new Date(date);
  }
  
  const now = new Date();
  const seconds = Math.floor((now - dateObj) / 1000);
  
  // Handle future dates (shouldn't happen for created_at, but just in case)
  if (seconds < 0) return 'just now';
  
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

// Content Request Modal
const ContentRequestModal = ({ isOpen, onClose, request, onSave, onRefresh, isDarkMode }) => {
  const [formData, setFormData] = useState({
    title: '',
    content_type: 'post',
    platform: 'instagram',
    designer: '',
    priority: 'medium',
    due_date: '',
    notes: '',
    started_date: '',
    delivered_date: '',
    posted_date: '',
    post_url: '',
    deliverable_url: '',
    revision_count: 0,
    results_reach: '',
    results_engagement: '',
    results_saves: '',
    results_shares: ''
  });
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [downloading, setDownloading] = useState(false);
  
  // New fields for reference URLs and delivery images
  const [referenceUrls, setReferenceUrls] = useState([]);
  const [newReferenceUrl, setNewReferenceUrl] = useState("");
  const [deliveryImages, setDeliveryImages] = useState([]);
  const [uploadingDelivery, setUploadingDelivery] = useState(false);
  
  // Draft auto-save state
  const [draftId, setDraftId] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);

  useEffect(() => {
    if (request) {
      const initialData = {
        title: request.title || '',
        content_type: request.content_type || 'post',
        platform: request.platform || 'instagram',
        designer: request.designer || '',
        priority: request.priority || 'medium',
        due_date: request.due_date ? request.due_date.split('T')[0] : '',
        notes: request.notes || '',
        started_date: request.started_date ? request.started_date.split('T')[0] : '',
        delivered_date: request.delivered_date ? request.delivered_date.split('T')[0] : '',
        posted_date: request.posted_date ? request.posted_date.split('T')[0] : '',
        post_url: request.post_url || '',
        deliverable_url: request.deliverable_url || '',
        revision_count: request.revision_count || 0,
        results_reach: request.results_reach || '',
        results_engagement: request.results_engagement || '',
        results_saves: request.results_saves || '',
        results_shares: request.results_shares || ''
      };
      setFormData(initialData);
      setInitialFormData(initialData);
      setAttachments(request.attachments || []);
      setReferenceUrls(request.reference_urls || []);
      setDeliveryImages(request.delivery_images || []);
      // If editing an existing request, track its ID for updates
      setDraftId(request.id || null);
      setLastSaved(null);
      setHasUnsavedChanges(false);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const initialData = {
        title: '',
        content_type: 'post',
        platform: 'instagram',
        designer: '',
        priority: 'medium',
        due_date: tomorrow.toISOString().split('T')[0],
        notes: '',
        started_date: '',
        delivered_date: '',
        posted_date: '',
        post_url: '',
        deliverable_url: '',
        revision_count: 0,
        results_reach: '',
        results_engagement: '',
        results_saves: '',
        results_shares: ''
      };
      setFormData(initialData);
      setInitialFormData(initialData);
      setAttachments([]);
      setReferenceUrls([]);
      setNewReferenceUrl("");
      setDeliveryImages([]);
      setDraftId(null);
      setLastSaved(null);
      setHasUnsavedChanges(false);
    }
  }, [request, isOpen]);

  // Track form changes for auto-save
  useEffect(() => {
    if (initialFormData) {
      const changed = JSON.stringify(formData) !== JSON.stringify(initialFormData);
      setHasUnsavedChanges(changed);
    }
  }, [formData, initialFormData]);

  // Auto-save draft function
  const saveDraft = useCallback(async () => {
    // Don't save if nothing to save or if editing an existing non-draft request
    if (!formData.title && attachments.length === 0) return;
    if (request && request.status !== 'draft' && !request.is_draft) return;
    
    setIsSavingDraft(true);
    const token = localStorage.getItem('adminToken');
    
    const draftData = {
      ...formData,
      status: 'draft',
      is_draft: true,
      attachments: attachments
    };
    
    try {
      if (draftId && !request) {
        // Update existing draft (only if it's a new draft we created)
        await fetch(`${API_BASE_URL}/api/admin/content-pipeline/${draftId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(draftData)
        });
      } else if (!request) {
        // Create new draft
        const response = await fetch(`${API_BASE_URL}/api/admin/content-pipeline`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(draftData)
        });
        const result = await response.json();
        if (result.success && result.id) {
          setDraftId(result.id);
        }
      }
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setInitialFormData(formData);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
    
    setIsSavingDraft(false);
  }, [formData, attachments, draftId, request]);

  // Auto-save when attachments change (image uploaded)
  useEffect(() => {
    if (attachments.length > 0 && !request) {
      const timer = setTimeout(() => saveDraft(), 1000);
      return () => clearTimeout(timer);
    }
  }, [attachments, request, saveDraft]);

  // Auto-save every 30 seconds if there are unsaved changes
  useEffect(() => {
    if (!isOpen || request) return; // Only auto-save for new requests
    
    const interval = setInterval(() => {
      if (hasUnsavedChanges && (formData.title || attachments.length > 0)) {
        saveDraft();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isOpen, hasUnsavedChanges, formData.title, attachments.length, request, saveDraft]);

  const handleSubmit = async () => {
    if (!formData.title) {
      toast.error('Title is required');
      return;
    }
    if (!formData.designer) {
      toast.error('Designer is required');
      return;
    }
    setSaving(true);
    
    // Prepare save data - convert draft to "requested" status when submitting
    const saveData = {
      ...formData,
      attachments: attachments,
      reference_urls: referenceUrls,
      delivery_images: deliveryImages,
      is_draft: false // Remove draft flag
    };
    
    // If this was a draft (either new or editing a draft), change status to "requested"
    const isDraft = request?.status === 'draft' || request?.is_draft || draftId;
    if (isDraft && (!request || request.status === 'draft')) {
      saveData.status = 'requested';
    }
    
    // If we have a draftId but no request (new draft being submitted), pass the ID
    if (draftId && !request) {
      saveData._draftId = draftId;
    }
    
    await onSave(saveData);
    setSaving(false);
    onClose();
  };

  // Handle cancel - delete draft if user confirms
  const handleCancel = async () => {
    if (draftId && !request) {
      // We have an unsaved draft
      if (window.confirm('Discard this draft? Your work will be lost.')) {
        try {
          const token = localStorage.getItem('adminToken');
          await fetch(`${API_BASE_URL}/api/admin/content-pipeline/${draftId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (onRefresh) onRefresh();
        } catch (error) {
          console.error('Failed to delete draft:', error);
        }
        onClose();
      }
    } else if (hasUnsavedChanges) {
      if (window.confirm('Discard unsaved changes?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    // Validate max 10 attachments
    if (attachments.length + files.length > 10) {
      toast.error(`Maximum 10 images allowed. You can add ${10 - attachments.length} more.`);
      e.target.value = "";
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const invalidFiles = files.filter(f => !allowedTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      toast.error("Only JPG, PNG, WEBP, or GIF images allowed.");
      e.target.value = "";
      return;
    }

    const oversizedFiles = files.filter(f => f.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`${oversizedFiles[0].name} exceeds 10MB limit.`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });
    const token = localStorage.getItem('adminToken');
    let uploadedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({ current: i + 1, total: files.length });
      
      try {
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);
        
        // Use temp upload if no request exists, otherwise use request-specific upload
        const endpoint = request?.id 
          ? `${API_BASE_URL}/api/admin/content-pipeline/upload`
          : `${API_BASE_URL}/api/admin/content-pipeline/upload-temp`;
        
        if (request?.id) {
          formDataUpload.append("request_id", request.id);
          formDataUpload.append("category", "reference");
        }
        
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formDataUpload
        });
        
        const data = await response.json();
        
        if (data.success) {
          setAttachments(prev => [...prev, data.attachment]);
          uploadedCount++;
        } else {
          toast.error(data.error || `Failed to upload ${file.name}`);
        }
      } catch (error) {
        toast.error(`Upload failed: ${file.name}`);
      }
    }

    if (uploadedCount > 0) {
      toast.success(`${uploadedCount} image${uploadedCount > 1 ? 's' : ''} uploaded`);
    }
    
    setUploading(false);
    setUploadProgress({ current: 0, total: 0 });
    e.target.value = "";
  };

  const handleRemoveAttachment = async (attachmentId) => {
    // If it's a temp attachment (no request yet), just remove from state
    if (!request?.id || attachmentId.startsWith('temp_')) {
      setAttachments(prev => prev.filter(att => att.id !== attachmentId));
      toast.success("Image removed");
      return;
    }
    
    // Otherwise delete from server
    if (!window.confirm("Delete this attachment?")) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${API_BASE_URL}/api/admin/content-pipeline/attachment/${request.id}/${attachmentId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setAttachments(prev => prev.filter(att => att.id !== attachmentId));
        toast.success("Attachment deleted");
      } else {
        toast.error(data.error || "Delete failed");
      }
    } catch (error) {
      toast.error("Delete failed: " + error.message);
    }
  };

  // Reference URL handlers
  const handleAddReferenceUrl = () => {
    const url = newReferenceUrl.trim();
    if (!url) return;
    if (referenceUrls.length >= 10) {
      toast.error("Maximum 10 reference links allowed");
      return;
    }
    setReferenceUrls(prev => [...prev, { url: url, label: "", added_at: new Date().toISOString() }]);
    setNewReferenceUrl("");
  };

  const handleRemoveReferenceUrl = (index) => {
    setReferenceUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Get icon for URL type
  const getUrlIcon = (url) => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('amazon')) return '🛒';
    if (lowerUrl.includes('instagram')) return '📸';
    if (lowerUrl.includes('figma')) return '🎨';
    if (lowerUrl.includes('drive.google')) return '📁';
    if (lowerUrl.includes('canva')) return '🖼️';
    return '🔗';
  };

  // Download all images function
  const handleDownloadAllImages = async (images, prefix = 'ref') => {
    if (!images || images.length < 2) return;
    
    setDownloading(true);
    const title = formData.title ? formData.title.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'request';
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const url = img.url || img;
      
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        
        // Determine file extension from URL or default to png
        const urlParts = url.split('.');
        const ext = urlParts.length > 1 ? urlParts.pop().split('?')[0] : 'png';
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${title}-${prefix}-${i + 1}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
        // Small delay between downloads to prevent browser blocking
        if (i < images.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        console.error(`Failed to download image ${i + 1}:`, error);
        toast.error(`Failed to download image ${i + 1}`);
      }
    }
    
    setDownloading(false);
    toast.success(`Downloaded ${images.length} images`);
  };

  // Delivery image handlers
  const handleDeliveryImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, WEBP, GIF allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum 10MB.");
      return;
    }
    if (deliveryImages.length >= 10) {
      toast.error("Maximum 10 delivery images allowed");
      return;
    }

    setUploadingDelivery(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("request_id", request?.id || "temp");

      const response = await fetch(`${API_URL}/admin/content-pipeline/upload-delivery`, {
        method: "POST",
        body: formDataUpload,
      });
      const data = await response.json();

      if (data.success) {
        setDeliveryImages(prev => [...prev, data.image]);
        toast.success("Delivery image uploaded");
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch (error) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setUploadingDelivery(false);
      e.target.value = "";
    }
  };

  const handleRemoveDeliveryImage = (index) => {
    setDeliveryImages(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate turnaround days
  const getTurnaroundDays = () => {
    if (!formData.due_date || !formData.delivered_date) return null;
    const due = new Date(formData.due_date);
    const delivered = new Date(formData.delivered_date);
    const diff = Math.ceil((delivered - due) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (!isOpen) return null;

  const showStartedDate = request && ['in_progress', 'review', 'revision', 'delivered', 'posted'].includes(request.status);
  const showDeliveredDate = request && ['delivered', 'posted'].includes(request.status);
  const showPostedDate = request && ['posted'].includes(request.status);
  const showResults = request && request.status === 'posted';
  const isDraftRequest = request?.status === 'draft' || request?.is_draft;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl ${
        isDarkMode ? 'bg-slate-800' : 'bg-white'
      }`} data-testid="content-request-modal">
        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {request ? 'Edit Request' : 'New Content Request'}
          </h3>
          <button onClick={onClose} className={`p-1 rounded hover:bg-slate-700 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          {/* Two-column layout on desktop */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Column - Form Fields */}
            <div className="flex-1 space-y-4">
              {/* Title */}
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                  placeholder="Describe the content needed"
                  data-testid="content-title-input"
                />
              </div>

              {/* Content Type + Platform Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Content Type</label>
                  <select
                    value={formData.content_type}
                    onChange={(e) => setFormData({...formData, content_type: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                    data-testid="content-type-select"
                  >
                    {Object.entries(CONTENT_TYPE_CONFIG).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Platform</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({...formData, platform: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="twitter">Twitter</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="youtube">YouTube</option>
                    <option value="amazon">Amazon</option>
                    <option value="website">Website</option>
                    <option value="all">All Platforms</option>
                  </select>
                </div>
              </div>

              {/* Designer + Priority Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Designer *</label>
                  <select
                    value={formData.designer}
                    onChange={(e) => setFormData({...formData, designer: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                    data-testid="designer-select"
                  >
                    {DESIGNER_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  >
                    {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Due Date + Started Date Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Due Date *</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                {showStartedDate && (
                  <div>
                    <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Started Date</label>
                    <input
                      type="date"
                      value={formData.started_date}
                      onChange={(e) => setFormData({...formData, started_date: e.target.value})}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Delivered Date Row - URL moved to Deliverables section */}
              {showDeliveredDate && (
                <div>
                  <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Delivered Date</label>
                  <input
                    type="date"
                    value={formData.delivered_date}
                    onChange={(e) => setFormData({...formData, delivered_date: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              )}

              {/* Posted Date + URL Row */}
              {showPostedDate && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Posted Date</label>
                    <input
                      type="date"
                      value={formData.posted_date}
                      onChange={(e) => setFormData({...formData, posted_date: e.target.value})}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Post URL</label>
                    <input
                      type="url"
                      value={formData.post_url}
                      onChange={(e) => setFormData({...formData, post_url: e.target.value})}
                      placeholder="Link to live post"
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Results Section */}
              {showResults && (
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Results</h4>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Reach</label>
                      <input
                        type="number"
                        value={formData.results_reach}
                        onChange={(e) => setFormData({...formData, results_reach: e.target.value})}
                        className={`w-full px-2 py-1.5 rounded border text-sm ${
                          isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Engagement</label>
                      <input
                        type="number"
                        value={formData.results_engagement}
                        onChange={(e) => setFormData({...formData, results_engagement: e.target.value})}
                        className={`w-full px-2 py-1.5 rounded border text-sm ${
                          isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Saves</label>
                      <input
                        type="number"
                        value={formData.results_saves}
                        onChange={(e) => setFormData({...formData, results_saves: e.target.value})}
                        className={`w-full px-2 py-1.5 rounded border text-sm ${
                          isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Shares</label>
                      <input
                        type="number"
                        value={formData.results_shares}
                        onChange={(e) => setFormData({...formData, results_shares: e.target.value})}
                        className={`w-full px-2 py-1.5 rounded border text-sm ${
                          isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Revisions Counter */}
              {request && (
                <div className="flex items-center gap-4">
                  <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Revisions:</span>
                  <button
                    onClick={() => setFormData({...formData, revision_count: Math.max(0, formData.revision_count - 1)})}
                    className={`w-8 h-8 rounded flex items-center justify-center ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >-</button>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formData.revision_count}</span>
                  <button
                    onClick={() => setFormData({...formData, revision_count: formData.revision_count + 1})}
                    className={`w-8 h-8 rounded flex items-center justify-center ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >+</button>
                </div>
              )}
            </div>

            {/* Right Column - Notes */}
            <div className="flex-1 flex flex-col">
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                Notes & Brief
              </label>
              <p className={`text-xs mb-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                Include copy text, image descriptions, brand guidelines, references
              </p>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className={`flex-1 min-h-[320px] w-full px-3 py-2 rounded-lg border text-sm resize-y focus:ring-1 focus:ring-teal-500 focus:border-teal-500 ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
                placeholder={`Example brief format:

1) text: If they're a good dog... treat them better.
   (image: Cute dog looking hopeful at camera)

2) text: Treat time = happiness
   (image: Happy dog with treat in mouth)

Brand colors: Teal #14b8a6, Dark #1e293b
Font: Keep text minimal and punchy
Reference: [paste link or describe style]`}
              />
            </div>
          </div>

          {/* =========== SECTION 2: REFERENCE MATERIAL =========== */}
          <div className={`mt-5 pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">📎</span>
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Reference Material
              </span>
            </div>
            <p className={`text-[10px] mb-3 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
              Mood boards, screenshots, competitor examples, or links
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* LEFT: Reference Images */}
              <div>
                <label className={`flex items-center justify-between text-xs font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  <span>Reference Images</span>
                  <div className="flex items-center gap-2">
                    {attachments.length >= 2 && (
                      <button
                        onClick={() => handleDownloadAllImages(attachments, 'ref')}
                        disabled={downloading}
                        className={`flex items-center gap-1 text-xs ${downloading ? 'opacity-50' : 'text-teal-400 hover:text-teal-300'}`}
                        title="Download all reference images"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download All</span>
                      </button>
                    )}
                    <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{attachments.length}/10</span>
                  </div>
                </label>

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {attachments.map((att) => (
                      <div 
                        key={att.id} 
                        className={`relative group w-14 h-14 rounded overflow-hidden ring-1 ${
                          isDarkMode ? 'ring-slate-600' : 'ring-gray-300'
                        }`}
                      >
                        <img 
                          src={att.url} 
                          alt={att.filename}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                          <a 
                            href={att.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-0.5 rounded bg-black/60 hover:bg-black/80"
                            title="Open"
                          >
                            <ExternalLink className="w-2.5 h-2.5 text-white" />
                          </a>
                          <button 
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600"
                            title="Remove"
                          >
                            <X className="w-2.5 h-2.5 text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {attachments.length < 10 && (
                  <label className={`flex flex-col items-center justify-center gap-1 px-3 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    uploading ? "opacity-50 cursor-not-allowed" : ""
                  } ${
                    isDarkMode 
                      ? 'border-slate-600 hover:border-teal-500 hover:bg-slate-700/30' 
                      : 'border-gray-300 hover:border-teal-500 hover:bg-gray-50'
                  }`}>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleFileUpload}
                      disabled={uploading}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                    />
                    {uploading ? (
                      <>
                        <div className="w-3 h-3 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
                        <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          Uploading {uploadProgress.current} of {uploadProgress.total}...
                        </span>
                      </>
                    ) : (
                      <>
                        <Image className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                        <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          Add Images
                        </span>
                        <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                          Select multiple files
                        </span>
                      </>
                    )}
                  </label>
                )}
              </div>

              {/* RIGHT: Reference Links */}
              <div>
                <label className={`flex items-center justify-between text-xs font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  <span>Reference Links</span>
                  <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{referenceUrls.length}/10</span>
                </label>

                <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
                  {/* URL List */}
                  {referenceUrls.length > 0 && (
                    <div className={`divide-y ${isDarkMode ? 'divide-slate-600/50' : 'divide-gray-200'}`}>
                      {referenceUrls.map((urlItem, index) => (
                        <div 
                          key={index}
                          className={`flex items-center gap-2 px-2.5 py-2 ${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-100'}`}
                        >
                          <span className="text-sm">{getUrlIcon(urlItem.url)}</span>
                          <a 
                            href={urlItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex-1 text-xs truncate ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                            title={urlItem.url}
                          >
                            {urlItem.url.length > 45 ? urlItem.url.substring(0, 45) + '...' : urlItem.url}
                          </a>
                          <button 
                            onClick={() => handleRemoveReferenceUrl(index)}
                            className={`p-0.5 rounded ${isDarkMode ? 'text-slate-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add URL Input */}
                  {referenceUrls.length < 10 && (
                    <div className={`flex gap-2 p-2 ${referenceUrls.length > 0 ? (isDarkMode ? 'border-t border-slate-600/50' : 'border-t border-gray-200') : ''}`}>
                      <input
                        type="url"
                        value={newReferenceUrl}
                        onChange={(e) => setNewReferenceUrl(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddReferenceUrl(); } }}
                        placeholder="Paste URL (Amazon, Figma, Drive...)"
                        className={`flex-1 px-2.5 py-1.5 rounded text-xs border ${
                          isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                      <button
                        onClick={handleAddReferenceUrl}
                        disabled={!newReferenceUrl.trim()}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                          newReferenceUrl.trim()
                            ? 'bg-teal-500/20 border border-teal-500/30 text-teal-400 hover:bg-teal-500/30'
                            : isDarkMode ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        + Add
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* =========== SECTION 3: DELIVERABLES =========== */}
          {request && ['delivered', 'scheduled', 'posted'].includes(request.status) ? (
            <div className={`mt-5 pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">📦</span>
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Deliverables
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                  request.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                  request.status === 'scheduled' ? 'bg-violet-500/20 text-violet-400' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {STATUS_CONFIG[request.status]?.label}
                </span>
              </div>
              <p className={`text-[10px] mb-3 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                Upload final designs and assets
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* LEFT: Delivery Images */}
                <div>
                  <label className={`flex items-center justify-between text-xs font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    <span>Delivery Images</span>
                    <div className="flex items-center gap-2">
                      {deliveryImages.length >= 2 && (
                        <button
                          onClick={() => handleDownloadAllImages(deliveryImages, 'delivery')}
                          disabled={downloading}
                          className={`flex items-center gap-1 text-xs ${downloading ? 'opacity-50' : 'text-purple-400 hover:text-purple-300'}`}
                          title="Download all delivery images"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download All</span>
                        </button>
                      )}
                      <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{deliveryImages.length}/10</span>
                    </div>
                  </label>

                  {deliveryImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {deliveryImages.map((img, index) => (
                        <div 
                          key={index} 
                          className={`relative group w-[72px] h-[72px] rounded-md overflow-hidden ring-1 ${
                            isDarkMode ? 'ring-slate-600' : 'ring-gray-300'
                          }`}
                        >
                          <img 
                            src={img.url} 
                            alt={img.filename}
                            className="w-full h-full object-cover"
                          />
                          <button 
                            onClick={() => handleRemoveDeliveryImage(index)}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {deliveryImages.length < 10 && (
                    <label className={`flex flex-col items-center justify-center gap-1 px-3 py-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      uploadingDelivery ? "opacity-50 cursor-not-allowed" : ""
                    } ${
                      isDarkMode 
                        ? 'border-purple-400/30 hover:border-purple-400/50 bg-purple-500/5' 
                        : 'border-purple-300 hover:border-purple-400 bg-purple-50/50'
                    }`}>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleDeliveryImageUpload}
                        disabled={uploadingDelivery}
                        accept="image/*"
                      />
                      {uploadingDelivery ? (
                        <>
                          <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                          <span className={`text-xs ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Package className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
                          <span className={`text-xs ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                            Add Delivery Images
                          </span>
                          <span className={`text-[10px] ${isDarkMode ? 'text-purple-400/60' : 'text-purple-400'}`}>
                            Max 10 images, 10MB each
                          </span>
                        </>
                      )}
                    </label>
                  )}
                </div>

                {/* RIGHT: Deliverable Link + Summary */}
                <div className="space-y-3">
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Deliverable Link
                    </label>
                    <input
                      type="url"
                      value={formData.deliverable_url}
                      onChange={(e) => setFormData({...formData, deliverable_url: e.target.value})}
                      placeholder="Link to asset (Google Drive, Figma, Canva...)"
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                    <p className={`text-[9px] mt-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                      External link to final assets (Canva, Google Drive, Figma)
                    </p>
                  </div>

                  {/* Delivery Summary Card */}
                  <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-200'}`}>
                    <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                      Delivery Summary
                    </p>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Images uploaded</span>
                        <span className={isDarkMode ? 'text-slate-200' : 'text-gray-700'}>{deliveryImages.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Due date</span>
                        <span className={isDarkMode ? 'text-slate-200' : 'text-gray-700'}>{formData.due_date || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Delivered date</span>
                        <span className={isDarkMode ? 'text-slate-200' : 'text-gray-700'}>{formData.delivered_date || '-'}</span>
                      </div>
                      {getTurnaroundDays() !== null && (
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Turnaround</span>
                          <span className={getTurnaroundDays() <= 0 ? 'text-green-400' : 'text-orange-400'}>
                            {getTurnaroundDays() <= 0 ? `${Math.abs(getTurnaroundDays())} days early` : `${getTurnaroundDays()} days late`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : request ? (
            <div className={`mt-5 pt-4 border-t text-center ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <p className={`text-xs italic ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                📦 Deliverables section appears when status changes to Delivered
              </p>
            </div>
          ) : null}
        </div>

        {/* Footer with draft status and action buttons */}
        <div className={`flex justify-between items-center p-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          {/* Draft save status indicator */}
          <div className="flex items-center gap-2">
            {isSavingDraft ? (
              <>
                <div className="w-3 h-3 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Saving draft...</span>
              </>
            ) : lastSaved ? (
              <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                Draft saved {formatTimeAgo(lastSaved)}
              </span>
            ) : draftId && !request ? (
              <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                Draft will auto-save
              </span>
            ) : null}
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className={`px-4 py-2 rounded-lg text-sm ${
                isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm disabled:opacity-50 flex items-center gap-2"
              data-testid="save-request-button"
            >
              {saving && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {request?.status === 'draft' ? 'Submit Request' : request ? 'Save Changes' : draftId ? 'Submit Request' : 'Create Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Content Pipeline Tab
const ContentPipelineTab = () => {
  const { isDarkMode } = useAdminTheme();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [activePipelineFilter, setActivePipelineFilter] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [filters, setFilters] = useState({
    designer: '',
    content_type: '',
    platform: '',
    search: ''
  });
  
  // Show Posted toggle - default OFF to hide completed items
  const [showPosted, setShowPosted] = useState(false);
  
  // Schedule modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    content_id: null,
    scheduled_date: '',
    scheduled_time: ''
  });

  // Fetch all data
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      if (filters.designer) params.append('designer', filters.designer);
      if (filters.content_type) params.append('content_type', filters.content_type);
      if (filters.platform) params.append('platform', filters.platform);
      if (activePipelineFilter) params.append('status', activePipelineFilter);
      
      const response = await fetch(`${API_URL}/admin/content-pipeline?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        let filtered = data.requests || [];
        if (filters.search) {
          const search = filters.search.toLowerCase();
          filtered = filtered.filter(r => 
            r.title.toLowerCase().includes(search) || 
            (r.notes && r.notes.toLowerCase().includes(search))
          );
        }
        setRequests(filtered);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [filters, activePipelineFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/content-pipeline/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [fetchRequests, fetchStats]);

  // Handle save
  const handleSave = async (formData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const url = editingRequest
        ? `${API_URL}/admin/content-pipeline/${editingRequest.id}`
        : `${API_URL}/admin/content-pipeline`;
      const method = editingRequest ? 'PATCH' : 'POST';

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
        toast.success(editingRequest ? 'Request updated!' : 'Request created!');
        fetchRequests();
        fetchStats();
        setEditingRequest(null);
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving request:', error);
      toast.error('Failed to save request');
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this request?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/content-pipeline/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Request deleted');
        fetchRequests();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  };

  // Handle status change
  const handleStatusChange = async (id, newStatus) => {
    // If changing to "scheduled", show the schedule modal first
    if (newStatus === 'scheduled') {
      setScheduleData({
        content_id: id,
        scheduled_date: new Date().toISOString().slice(0, 10),
        scheduled_time: ''
      });
      setShowScheduleModal(true);
      return; // Don't save yet, wait for modal confirmation
    }
    
    // For other statuses, save immediately
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/content-pipeline/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Status updated');
        fetchRequests();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update');
    }
  };
  
  // Handle schedule confirmation
  const handleConfirmSchedule = async () => {
    if (!scheduleData.scheduled_date) {
      toast.error('Please select a date');
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/content-pipeline/${scheduleData.content_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'scheduled',
          scheduled_date: scheduleData.scheduled_date,
          scheduled_time: scheduleData.scheduled_time || null
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Content scheduled!');
        fetchRequests();
        fetchStats();
        setShowScheduleModal(false);
        setScheduleData({ content_id: null, scheduled_date: '', scheduled_time: '' });
      } else {
        toast.error(data.error || 'Failed to schedule');
      }
    } catch (error) {
      console.error('Error scheduling content:', error);
      toast.error('Failed to schedule');
    }
  };

  // Handle pipeline stat click
  const handlePipelineClick = (statusKey) => {
    if (statusKey === 'total') {
      setActivePipelineFilter(null);
    } else if (activePipelineFilter === statusKey) {
      setActivePipelineFilter(null);
    } else {
      setActivePipelineFilter(statusKey);
    }
  };

  // Handle row expand toggle
  const handleRowExpand = (requestId) => {
    setExpandedRow(expandedRow === requestId ? null : requestId);
  };

  // Refresh after posting checklist update
  const handleChecklistUpdate = () => {
    fetchRequests();
    fetchStats();
  };

  return (
    <div className="space-y-3" data-testid="content-pipeline-tab">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className={`text-xl font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <FileText className="w-5 h-5 text-teal-400" />
            Content Pipeline
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Track content requests from creation to results
          </p>
        </div>
        <button
          onClick={() => { setEditingRequest(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm"
          data-testid="new-request-button"
        >
          <Plus size={16} />
          New Request
        </button>
      </div>

      {/* Team Productivity Dashboard */}
      <TeamProductivityDashboard isDarkMode={isDarkMode} />

      {/* Pipeline Stats - Clickable */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        <button
          onClick={() => handlePipelineClick('total')}
          className={`rounded-lg p-2 text-center border-l-4 border-teal-500 cursor-pointer transition-all ${
            !activePipelineFilter
              ? isDarkMode ? 'bg-slate-700 ring-2 ring-teal-500' : 'bg-teal-50 ring-2 ring-teal-500'
              : isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-gray-50'
          }`}
          data-testid="filter-total"
        >
          <div className={`text-xl font-bold ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
            {showPosted ? (stats.total_count || 0) : ((stats.total_count || 0) - (stats.posted || 0))}
          </div>
          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Total</div>
        </button>
        <button
          onClick={() => handlePipelineClick('requested')}
          className={`rounded-lg p-2 text-center border-l-4 border-yellow-500 cursor-pointer transition-all ${
            activePipelineFilter === 'requested'
              ? isDarkMode ? 'bg-slate-700 ring-2 ring-teal-500' : 'bg-yellow-50 ring-2 ring-teal-500'
              : isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-gray-50'
          }`}
          data-testid="filter-requested"
        >
          <div className={`text-xl font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>{stats.requested || 0}</div>
          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Requested</div>
        </button>
        <button
          onClick={() => handlePipelineClick('in_progress')}
          className={`rounded-lg p-2 text-center border-l-4 border-orange-500 cursor-pointer transition-all ${
            activePipelineFilter === 'in_progress'
              ? isDarkMode ? 'bg-slate-700 ring-2 ring-teal-500' : 'bg-orange-50 ring-2 ring-teal-500'
              : isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-gray-50'
          }`}
          data-testid="filter-in-progress"
        >
          <div className={`text-xl font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>{stats.in_progress || 0}</div>
          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>In Progress</div>
        </button>
        <button
          onClick={() => handlePipelineClick('review')}
          className={`rounded-lg p-2 text-center border-l-4 border-purple-500 cursor-pointer transition-all ${
            activePipelineFilter === 'review'
              ? isDarkMode ? 'bg-slate-700 ring-2 ring-teal-500' : 'bg-purple-50 ring-2 ring-teal-500'
              : isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-gray-50'
          }`}
          data-testid="filter-review"
        >
          <div className={`text-xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{stats.review || 0}</div>
          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Review</div>
        </button>
        <button
          onClick={() => handlePipelineClick('revision')}
          className={`rounded-lg p-2 text-center border-l-4 border-pink-500 cursor-pointer transition-all ${
            activePipelineFilter === 'revision'
              ? isDarkMode ? 'bg-slate-700 ring-2 ring-teal-500' : 'bg-pink-50 ring-2 ring-teal-500'
              : isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-gray-50'
          }`}
          data-testid="filter-revision"
        >
          <div className={`text-xl font-bold ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`}>{stats.revision || 0}</div>
          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Revision</div>
        </button>
        <button
          onClick={() => handlePipelineClick('delivered')}
          className={`rounded-lg p-2 text-center border-l-4 border-green-500 cursor-pointer transition-all ${
            activePipelineFilter === 'delivered'
              ? isDarkMode ? 'bg-slate-700 ring-2 ring-teal-500' : 'bg-green-50 ring-2 ring-teal-500'
              : isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-gray-50'
          }`}
          data-testid="filter-delivered"
        >
          <div className={`text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{stats.delivered || 0}</div>
          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Delivered</div>
        </button>
        <button
          onClick={() => handlePipelineClick('scheduled')}
          className={`rounded-lg p-2 text-center border-l-4 border-violet-500 cursor-pointer transition-all ${
            activePipelineFilter === 'scheduled'
              ? isDarkMode ? 'bg-slate-700 ring-2 ring-violet-500' : 'bg-violet-50 ring-2 ring-violet-500'
              : isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-gray-50'
          }`}
          data-testid="filter-scheduled"
        >
          <div className={`text-xl font-bold ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`}>{stats.scheduled || 0}</div>
          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Scheduled</div>
        </button>
        <button
          onClick={() => handlePipelineClick('posted')}
          className={`rounded-lg p-2 text-center border-l-4 border-emerald-500 cursor-pointer transition-all ${
            activePipelineFilter === 'posted'
              ? isDarkMode ? 'bg-slate-700 ring-2 ring-teal-500' : 'bg-emerald-50 ring-2 ring-teal-500'
              : isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-gray-50'
          }`}
          data-testid="filter-posted"
        >
          <div className={`text-xl font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{stats.posted || 0}</div>
          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Posted</div>
        </button>
      </div>

      {/* Combined Stats Row */}
      <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-1.5 rounded-lg text-sm ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-3">
          <span className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
            This Week: <span className="text-teal-500">{stats.this_week_requested || 0}</span> requested,{' '}
            <span className="text-teal-500">{stats.this_week_delivered || 0}</span> delivered,{' '}
            <span className="text-teal-500">{stats.this_week_posted || 0}</span> posted
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
            Avg Turnaround: <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.avg_turnaround_days || '-'} days</span>
          </span>
          <span className={isDarkMode ? 'text-slate-600' : 'text-gray-300'}>|</span>
          <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
            On-Time: <span className="font-medium text-green-400">{stats.on_time_percentage || '-'}%</span>
          </span>
        </div>
      </div>

      {/* Compact Filters Row */}
      <div className={`flex flex-wrap gap-2 items-center rounded-lg px-3 py-2 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
        <select
          value={filters.designer}
          onChange={(e) => setFilters({...filters, designer: e.target.value})}
          className={`rounded-lg px-2 py-1.5 text-sm border ${
            isDarkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-gray-50 text-gray-900 border-gray-300'
          }`}
        >
          <option value="">All Designers</option>
          {DESIGNER_OPTIONS.filter(opt => opt.value).map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={filters.content_type}
          onChange={(e) => setFilters({...filters, content_type: e.target.value})}
          className={`rounded-lg px-2 py-1.5 text-sm border ${
            isDarkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-gray-50 text-gray-900 border-gray-300'
          }`}
        >
          <option value="">All Types</option>
          {Object.entries(CONTENT_TYPE_CONFIG).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>

        <select
          value={filters.platform}
          onChange={(e) => setFilters({...filters, platform: e.target.value})}
          className={`rounded-lg px-2 py-1.5 text-sm border ${
            isDarkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-gray-50 text-gray-900 border-gray-300'
          }`}
        >
          <option value="">All Platforms</option>
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="twitter">Twitter</option>
          <option value="linkedin">LinkedIn</option>
          <option value="youtube">YouTube</option>
          <option value="amazon">Amazon</option>
          <option value="website">Website</option>
        </select>

        <div className="flex-1 min-w-[180px]">
          <div className="relative">
            <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className={`w-full rounded-lg pl-8 pr-3 py-1.5 text-sm border ${
                isDarkMode ? 'bg-slate-700 text-white border-slate-600 placeholder-slate-400' : 'bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-400'
              }`}
            />
          </div>
        </div>

        {/* Show Posted Toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Show Posted</span>
          <button
            onClick={() => setShowPosted(!showPosted)}
            className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
              showPosted ? 'bg-teal-500' : isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
            }`}
            data-testid="show-posted-toggle"
          >
            <span 
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                showPosted ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
        <table className="w-full">
          <thead className={isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}>
            <tr>
              <th className={`text-left px-3 py-2 text-xs font-medium w-8 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}></th>
              <th className={`text-left px-3 py-2 text-xs font-medium w-8 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>#</th>
              <th className={`text-left px-3 py-2 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Content</th>
              <th className={`text-left px-3 py-2 text-xs font-medium w-24 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Type</th>
              <th className={`text-left px-3 py-2 text-xs font-medium w-24 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Designer</th>
              <th className={`text-left px-3 py-2 text-xs font-medium w-20 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Due</th>
              <th className={`text-left px-3 py-2 text-xs font-medium w-28 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Status</th>
              <th className={`text-left px-3 py-2 text-xs font-medium w-20 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>TAT</th>
              <th className={`text-left px-3 py-2 text-xs font-medium w-16 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Results</th>
              <th className={`text-center px-3 py-2 text-xs font-medium w-20 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-100'}`}>
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={10} className={`text-center py-12 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  {activePipelineFilter ? `No ${STATUS_CONFIG[activePipelineFilter]?.label} requests.` : 'No content requests yet. Click "New Request" to get started.'}
                </td>
              </tr>
            ) : requests.filter(req => showPosted || req.status !== 'posted').length === 0 ? (
              <tr>
                <td colSpan={10} className={`text-center py-12 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  No active requests. {stats.posted > 0 && <span className="text-teal-400">Toggle "Show Posted" to see {stats.posted} completed items.</span>}
                </td>
              </tr>
            ) : (
              // Filter out posted items if showPosted is false, then sort by due date ascending
              [...requests]
                .filter(req => showPosted || req.status !== 'posted')
                .sort((a, b) => {
                  // Sort by due_date ascending (oldest/overdue first)
                  const dateA = a.due_date ? new Date(a.due_date) : new Date('9999-12-31');
                  const dateB = b.due_date ? new Date(b.due_date) : new Date('9999-12-31');
                  return dateA - dateB;
                })
                .map((req, index) => {
                const PlatformIcon = PLATFORM_ICONS[req.platform] || FaGlobe;
                const TypeConfig = CONTENT_TYPE_CONFIG[req.content_type] || CONTENT_TYPE_CONFIG.post;
                const TypeIcon = TypeConfig.icon;
                const dueStatus = getDueDateStatus(req.due_date, req.status, req.delivered_date, req.posted_date, req.scheduled_date, req.scheduled_time);
                const tatDisplay = getTurnaroundDisplay(req.turnaround_days, req.status);
                const isExpanded = expandedRow === req.id;
                const canExpand = ['delivered', 'scheduled', 'posted'].includes(req.status);
                const isDraft = req.status === 'draft' || req.is_draft;
                
                return (
                  <React.Fragment key={req.id}>
                    <tr 
                      className={`${isDraft ? (isDarkMode ? 'bg-slate-800/50 opacity-70' : 'bg-gray-50/50 opacity-75') : ''} ${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'} ${canExpand ? 'cursor-pointer' : ''}`}
                      onClick={() => canExpand && handleRowExpand(req.id)}
                      data-testid={`pipeline-row-${req.id}`}
                    >
                      <td className={`px-3 py-2`}>
                        {canExpand && (
                          <button className={`p-0.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}
                      </td>
                      <td className={`px-3 py-2 text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                        {index + 1}
                      </td>
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <PlatformIcon className={`w-3.5 h-3.5 flex-shrink-0 ${
                            req.platform === 'instagram' ? 'text-pink-400' :
                            req.platform === 'facebook' ? 'text-blue-500' :
                            req.platform === 'twitter' ? 'text-sky-400' :
                            req.platform === 'linkedin' ? 'text-blue-600' :
                            req.platform === 'youtube' ? 'text-red-500' : 'text-gray-400'
                          }`} />
                          <div>
                            <div className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {req.title}
                            </div>
                            {req.priority === 'urgent' && (
                              <span className="text-xs text-red-400 font-medium">URGENT</span>
                            )}
                            {req.priority === 'high' && (
                              <span className="text-xs text-orange-400">High Priority</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <TypeIcon className={`w-3.5 h-3.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} />
                          <span className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>{TypeConfig.label}</span>
                        </div>
                      </td>
                      <td className={`px-3 py-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`} onClick={(e) => e.stopPropagation()}>
                        {req.designer}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <span className="flex items-center gap-1.5">
                          {dueStatus.isOverdue && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>}
                          {dueStatus.isDueToday && <span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0"></span>}
                          <span className={`text-xs whitespace-nowrap ${dueStatus.color}`}>{dueStatus.text}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <StatusDropdown
                          status={req.status}
                          onChange={(newStatus) => handleStatusChange(req.id, newStatus)}
                          isDarkMode={isDarkMode}
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <span className={`text-xs whitespace-nowrap ${tatDisplay.color}`}>
                          {tatDisplay.text}
                        </span>
                      </td>
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <span className={`text-xs ${req.results_reach ? 'text-teal-400' : isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                          {formatNumber(req.results_reach)}
                        </span>
                      </td>
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {req.post_url && (
                            <a
                              href={req.post_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`p-1.5 rounded ${isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-200'}`}
                            >
                              <ExternalLink size={14} className="text-teal-400" />
                            </a>
                          )}
                          <button
                            onClick={() => { setEditingRequest(req); setShowModal(true); }}
                            className={`p-1.5 rounded ${isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-200'}`}
                            data-testid={`edit-request-${req.id}`}
                          >
                            <Edit2 size={14} className={isDarkMode ? 'text-slate-400' : 'text-gray-500'} />
                          </button>
                          <button
                            onClick={() => handleDelete(req.id)}
                            className={`p-1.5 rounded ${isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-200'}`}
                            data-testid={`delete-request-${req.id}`}
                          >
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded Posting Checklist */}
                    {isExpanded && canExpand && (
                      <tr>
                        <td colSpan={10} className="p-0">
                          <PostingChecklist 
                            request={req} 
                            onUpdate={handleChecklistUpdate}
                            isDarkMode={isDarkMode} 
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Results count */}
      {!loading && requests.length > 0 && (
        <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
          Showing {requests.length} requests
          {activePipelineFilter && ` (${STATUS_CONFIG[activePipelineFilter]?.label})`}
        </div>
      )}

      {/* Modal */}
      <ContentRequestModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingRequest(null); }}
        request={editingRequest}
        onSave={handleSave}
        onRefresh={fetchRequests}
        isDarkMode={isDarkMode}
      />
      
      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="schedule-modal">
          <div className={`w-full max-w-md rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Calendar className="w-5 h-5 text-violet-400" />
                Schedule Content
              </h3>
              <button 
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduleData({ content_id: null, scheduled_date: '', scheduled_time: '' });
                }}
                className={`p-1 rounded hover:bg-slate-700 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Scheduled Date *
                </label>
                <input
                  type="date"
                  value={scheduleData.scheduled_date}
                  onChange={(e) => setScheduleData({ ...scheduleData, scheduled_date: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                  required
                  data-testid="schedule-date-input"
                />
              </div>
              
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Scheduled Time (optional)
                </label>
                <input
                  type="time"
                  value={scheduleData.scheduled_time}
                  onChange={(e) => setScheduleData({ ...scheduleData, scheduled_time: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                  data-testid="schedule-time-input"
                />
              </div>
            </div>
            
            <div className={`flex gap-3 p-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduleData({ content_id: null, scheduled_date: '', scheduled_time: '' });
                }}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                  isDarkMode 
                    ? 'bg-slate-600 hover:bg-slate-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSchedule}
                disabled={!scheduleData.scheduled_date}
                className="flex-1 px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium"
                data-testid="schedule-confirm-btn"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentPipelineTab;
