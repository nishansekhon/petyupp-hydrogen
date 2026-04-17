import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '@/config/api';
import { 
  Plus, Search, Edit2, Trash2, X, Users, ExternalLink,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Calendar,
  AlertCircle, Truck, Clock, CheckCircle, Copy, Check
} from 'lucide-react';
import { FaInstagram, FaYoutube, FaWallet, FaFacebook, FaTwitter, FaLinkedin, FaGlobe } from 'react-icons/fa';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { toast } from 'react-toastify';

const API_URL = API_BASE_URL + '/api';

// Status flow: Outreach > Confirmed > Contract Signed > Shipped > Content Received > In-Editing > Scheduled > Posted > Cancelled
const STATUS_CONFIG = {
  outreach: { label: 'Outreach', color: 'bg-gray-500', textColor: 'text-gray-400' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-500', textColor: 'text-blue-400' },
  contract_signed: { label: 'Contract Signed', color: 'bg-purple-500', textColor: 'text-purple-400' },
  shipped: { label: 'Shipped', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  content_received: { label: 'Content Received', color: 'bg-orange-500', textColor: 'text-orange-400' },
  in_editing: { label: 'In-Editing', color: 'bg-cyan-500', textColor: 'text-cyan-400' },
  scheduled: { label: 'Scheduled', color: 'bg-violet-500', textColor: 'text-violet-400' },
  posted: { label: 'Posted', color: 'bg-green-500', textColor: 'text-green-400' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', textColor: 'text-red-400' }
};

// Format large numbers (50000 -> 50K)
const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// Format Indian rupee amounts
const formatRupee = (amount) => {
  if (!amount || amount === 0) return '₹0';
  if (amount >= 100000) {
    return '₹' + (amount / 100000).toFixed(1) + 'L';
  }
  return '₹' + amount.toLocaleString('en-IN');
};

// Format relative time (like "2h ago", "3d ago", or "Jan 15")
const formatRelativeTime = (date) => {
  if (!date) return '-';
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// Format date for display (Jan 20)
const formatShortDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// Get countdown text for scheduled date
const getScheduledCountdown = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const scheduled = new Date(dateStr);
  scheduled.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((scheduled - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  return `in ${diffDays}d`;
};

// Date utility functions
const isSameDay = (date1, date2) => {
  return date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();
};

const isInWeek = (date, weekStart) => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return date >= weekStart && date <= weekEnd;
};

const isInMonth = (date, month, year) => {
  return date.getMonth() === month && date.getFullYear() === year;
};

const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0); // Reset to midnight
  return d;
};

const formatDateRange = (viewMode, selectedDate) => {
  const date = new Date(selectedDate);
  
  if (viewMode === 'daily') {
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }
  
  if (viewMode === 'weekly') {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return `${weekStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
  
  if (viewMode === 'monthly') {
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }
  
  return '';
};

// Get date status color based on due date
const getDateColor = (dateStr) => {
  if (!dateStr) return 'text-gray-400';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'text-red-500 font-medium'; // Overdue
  if (diffDays <= 1) return 'text-orange-500'; // Today or tomorrow
  return 'text-green-500'; // More than 2 days
};

// Check if date is overdue
const isOverdue = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date < today;
};

// Check if date is today
const isToday = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date.getTime() === today.getTime();
};

// Status Dropdown Component with Scheduled date support
const StatusDropdown = ({ status, onChange, isDarkMode, creator, onScheduledDateChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [showScheduledModal, setShowScheduledModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(creator?.scheduled_date || '');
  const [scheduledTime, setScheduledTime] = useState(creator?.scheduled_time || '');
  const buttonRef = useRef(null);
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.outreach;

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

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'scheduled') {
      setShowScheduledModal(true);
      setIsOpen(false);
    } else {
      onChange(newStatus);
      setIsOpen(false);
    }
  };

  const handleScheduledConfirm = () => {
    if (!scheduledDate) {
      toast.error('Please select a scheduled date');
      return;
    }
    onChange('scheduled');
    if (onScheduledDateChange) {
      onScheduledDateChange({
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime || null
      });
    }
    setShowScheduledModal(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`px-2 py-1 rounded text-xs font-medium ${config.color} text-white flex items-center gap-1`}
      >
        {config.label}
        <ChevronDown size={12} className={openUpward && isOpen ? 'rotate-180' : ''} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div 
            className={`absolute z-50 rounded-lg shadow-lg py-1 min-w-[140px] ${
              isDarkMode ? 'bg-slate-700' : 'bg-white border border-gray-200'
            }`}
            style={openUpward ? { bottom: '100%', marginBottom: '4px' } : { top: '100%', marginTop: '4px' }}
          >
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
              <button
                key={key}
                onClick={() => handleStatusChange(key)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-600 ${
                  key === status ? (isDarkMode ? 'bg-slate-600' : 'bg-gray-100') : ''
                } ${val.textColor}`}
              >
                {val.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Scheduled Date Modal */}
      {showScheduledModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowScheduledModal(false)} />
          <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-80 rounded-xl p-5 shadow-2xl ${
            isDarkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <Calendar size={18} className="text-violet-400" />
              Schedule Post
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Scheduled Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-violet-500`}
                  required
                />
              </div>
              
              <div>
                <label className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Time (Optional)
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg border text-sm ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-violet-500`}
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowScheduledModal(false)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                  isDarkMode ? 'bg-slate-600 text-slate-300 hover:bg-slate-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleScheduledConfirm}
                className="flex-1 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm font-medium"
              >
                Schedule
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Due Date Cell Component with inline editing
const DueDateCell = ({ creator, onDateUpdate, isDarkMode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [dateValue, setDateValue] = useState('');
  const inputRef = useRef(null);
  
  // Determine which date and label to show based on status
  const getDateInfo = () => {
    const status = creator.status;
    
    switch (status) {
      case 'contract_signed':
        return { date: creator.ship_by_date, label: 'Ship by', field: 'ship_by_date' };
      case 'shipped':
        return { date: creator.expected_post_date, label: 'Expected', field: 'expected_post_date' };
      case 'content_received':
      case 'in_editing':
        return { date: creator.expected_post_date, label: 'Post by', field: 'expected_post_date' };
      case 'scheduled':
        return { date: creator.scheduled_date, label: 'Scheduled', field: 'scheduled_date' };
      case 'posted':
        return { date: creator.actual_post_date, label: 'Posted', field: 'actual_post_date' };
      case 'outreach':
      case 'confirmed':
        return { date: creator.follow_up_date, label: 'Follow up', field: 'follow_up_date' };
      default:
        return { date: null, label: 'Set date', field: 'follow_up_date' };
    }
  };
  
  const { date, label, field } = getDateInfo();
  const colorClass = getDateColor(date);
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);
  
  const handleEdit = () => {
    setDateValue(date || '');
    setIsEditing(true);
  };
  
  const handleSave = async () => {
    if (dateValue !== date) {
      await onDateUpdate(creator._id, { [field]: dateValue || null });
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setIsEditing(false);
  };
  
  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="date"
        value={dateValue}
        onChange={(e) => setDateValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`w-28 px-1 py-0.5 text-xs rounded border ${
          isDarkMode 
            ? 'bg-slate-700 border-slate-500 text-white focus:border-teal-500' 
            : 'bg-white border-gray-300 text-gray-900 focus:border-teal-500'
        } focus:outline-none`}
      />
    );
  }
  
  if (!date) {
    return (
      <button
        onClick={handleEdit}
        className="text-xs text-gray-400 hover:text-teal-400"
      >
        + Set date
      </button>
    );
  }
  
  // Special rendering for scheduled status - show date + time + countdown on one line
  if (creator.status === 'scheduled') {
    return (
      <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
        <button
          onClick={handleEdit}
          className="text-violet-400 hover:opacity-80 flex items-center gap-1 whitespace-nowrap"
          title="Click to edit scheduled date"
        >
          <Calendar size={12} className="flex-shrink-0" />
          <span className="whitespace-nowrap">{formatShortDate(date)}{creator.scheduled_time && ` at ${creator.scheduled_time}`}</span>
        </button>
        <span className="text-slate-500 whitespace-nowrap">
          ({getScheduledCountdown(date)})
        </span>
      </div>
    );
  }
  
  return (
    <button
      onClick={handleEdit}
      className={`text-xs ${colorClass} hover:opacity-80`}
      title={`Click to edit ${label.toLowerCase()} date`}
    >
      {label}: {formatShortDate(date)}
    </button>
  );
};

// Notes Cell Component for table column
const NotesColumnCell = ({ notes, creatorId, onSave, isDarkMode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(notes || '');
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(notes || '');
  }, [notes]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (value !== notes) {
      onSave(creatorId, value);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setValue(notes || '');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex gap-1 items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add note..."
          className={`w-full px-1.5 py-0.5 text-xs rounded border ${
            isDarkMode 
              ? 'bg-slate-700 border-slate-500 text-white placeholder-slate-400 focus:border-teal-500' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500'
          } focus:outline-none`}
        />
        <button
          onClick={handleSave}
          className="text-xs text-teal-500 hover:text-teal-400"
        >
          Save
        </button>
      </div>
    );
  }

  if (notes) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className={`max-w-[150px] truncate cursor-pointer text-xs hover:opacity-80 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}
        title={notes}
      >
        {notes}
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="text-xs text-gray-500 hover:text-teal-400"
    >
      + Note
    </button>
  );
};

// Expanded Row Notes Component
const ExpandedNotesCell = ({ notes, creatorId, onSave, isDarkMode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(notes || '');
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(notes || '');
  }, [notes]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (value !== notes) {
      onSave(creatorId, value);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setValue(notes || '');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder="Add note..."
        className={`w-full px-2 py-1 text-sm rounded border ${
          isDarkMode 
            ? 'bg-slate-700 border-slate-500 text-white placeholder-slate-400 focus:border-teal-500' 
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-teal-500'
        } focus:outline-none`}
      />
    );
  }

  return notes ? (
    <span 
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:opacity-80 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}
    >
      {notes}
    </span>
  ) : (
    <button 
      onClick={() => setIsEditing(true)}
      className="text-teal-500 hover:text-teal-400 text-sm"
    >
      + Add note
    </button>
  );
};

// Platform icons for posting checklist
const PLATFORM_ICONS = {
  instagram: FaInstagram,
  facebook: FaFacebook,
  twitter: FaTwitter,
  linkedin: FaLinkedin
};

// UGC Posting Checklist Component
const UGCPostingChecklist = ({ creator, onUpdate, isDarkMode }) => {
  const [postingPlatform, setPostingPlatform] = useState(null);
  const [postUrl, setPostUrl] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Use checklist from creator, with fallback to defaults
  // Also merge top-level post_url for backwards compatibility
  const getChecklist = () => {
    // Default checklist structure
    const defaultChecklist = [
      { platform: 'instagram', required: true, posted: false, posted_by: null, posted_at: null, post_url: null },
      { platform: 'facebook', required: true, posted: false, posted_by: null, posted_at: null, post_url: null },
      { platform: 'linkedin', required: false, posted: false, posted_by: null, posted_at: null, post_url: null },
      { platform: 'twitter', required: false, posted: false, posted_by: null, posted_at: null, post_url: null }
    ];
    
    let checklist = creator.posting_checklist && creator.posting_checklist.length > 0 
      ? [...creator.posting_checklist]
      : defaultChecklist;
    
    // Backwards compatibility: if creator has top-level post_url but checklist items don't,
    // apply the top-level post_url to Instagram (primary platform)
    if (creator.post_url && creator.status === 'posted') {
      const hasPostUrl = checklist.some(item => item.post_url);
      if (!hasPostUrl) {
        // Determine which platform the URL is for
        const url = creator.post_url.toLowerCase();
        let targetPlatform = 'instagram'; // default
        if (url.includes('facebook.com') || url.includes('fb.com')) {
          targetPlatform = 'facebook';
        } else if (url.includes('linkedin.com')) {
          targetPlatform = 'linkedin';
        } else if (url.includes('twitter.com') || url.includes('x.com')) {
          targetPlatform = 'twitter';
        }
        
        // Update the matching platform item
        checklist = checklist.map(item => {
          if (item.platform === targetPlatform) {
            return {
              ...item,
              posted: true,
              post_url: creator.post_url,
              posted_at: creator.actual_post_date || creator.updated_at
            };
          }
          return item;
        });
      }
    }
    
    return checklist;
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
      const response = await fetch(`${API_URL}/admin/ugc-creators/${creator._id}/mark-posted`, {
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
      const response = await fetch(`${API_URL}/admin/ugc-creators/${creator._id}/unmark-posted`, {
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
    <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`} data-testid={`ugc-posting-checklist-${creator._id}`}>
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

// UGC Creator Modal Component
const UGCCreatorModal = ({ isOpen, onClose, creator, onSave, isDarkMode }) => {
  const [formData, setFormData] = useState({
    creator_name: '',
    handle: '',
    platform: 'instagram',
    followers: '',
    dog_name: '',
    deal_type: 'barter',
    products_sent: '',
    product_cost: '',
    shipping_cost: '',
    payment_amount: '',
    deliverable: 'reel',
    status: 'outreach',
    posted_date: '',
    post_url: '',
    reach: '',
    engagement: '',
    contact_details: '',
    address: '',
    email: '',
    notes: '',
    ship_by_date: '',
    expected_post_date: '',
    follow_up_date: '',
    actual_post_date: ''
  });
  const [saving, setSaving] = useState(false);
  
  // State for copy-to-clipboard feedback
  const [copiedField, setCopiedField] = useState(null);

  // Copy to clipboard handler with visual feedback
  const handleCopy = async (text, fieldName) => {
    if (!text || !text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success('Copied to clipboard!', { autoClose: 1500 });
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  useEffect(() => {
    if (creator) {
      setFormData({
        creator_name: creator.creator_name || '',
        handle: creator.handle || '',
        platform: creator.platform || 'instagram',
        followers: creator.followers || '',
        dog_name: creator.dog_name || '',
        deal_type: creator.deal_type || 'barter',
        products_sent: creator.products_sent || '',
        product_cost: creator.product_cost || '',
        shipping_cost: creator.shipping_cost || '',
        payment_amount: creator.payment_amount || '',
        deliverable: creator.deliverable || 'reel',
        status: creator.status || 'outreach',
        posted_date: creator.posted_date ? creator.posted_date.split('T')[0] : '',
        post_url: creator.post_url || '',
        reach: creator.reach || '',
        engagement: creator.engagement || '',
        contact_details: creator.contact_details || '',
        address: creator.address || '',
        email: creator.email || '',
        notes: creator.notes || '',
        ship_by_date: creator.ship_by_date || '',
        expected_post_date: creator.expected_post_date || '',
        follow_up_date: creator.follow_up_date || '',
        actual_post_date: creator.actual_post_date || ''
      });
    } else {
      setFormData({
        creator_name: '',
        handle: '',
        platform: 'instagram',
        followers: '',
        dog_name: '',
        deal_type: 'barter',
        products_sent: '',
        product_cost: '',
        shipping_cost: '',
        payment_amount: '',
        deliverable: 'reel',
        status: 'outreach',
        posted_date: '',
        post_url: '',
        reach: '',
        engagement: '',
        contact_details: '',
        address: '',
        email: '',
        notes: '',
        ship_by_date: '',
        expected_post_date: '',
        follow_up_date: '',
        actual_post_date: ''
      });
    }
  }, [creator, isOpen]);

  const handleSubmit = async () => {
    if (!formData.creator_name || !formData.handle) {
      toast.error('Creator name and handle are required');
      return;
    }
    setSaving(true);
    await onSave(formData);
    setSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl ${
        isDarkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDarkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {creator ? 'Edit Creator' : 'Add New Creator'}
          </h3>
          <button onClick={onClose} className={`p-1 rounded hover:bg-slate-700 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Creator Name *</label>
              <input
                type="text"
                value={formData.creator_name}
                onChange={(e) => setFormData({...formData, creator_name: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
                placeholder="e.g. Mitali"
              />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Handle *</label>
              <input
                type="text"
                value={formData.handle}
                onChange={(e) => setFormData({...formData, handle: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
                placeholder="@username"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
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
                <option value="youtube">YouTube</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Followers</label>
              <input
                type="number"
                value={formData.followers}
                onChange={(e) => setFormData({...formData, followers: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
                placeholder="10000"
              />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Dog Name</label>
              <input
                type="text"
                value={formData.dog_name}
                onChange={(e) => setFormData({...formData, dog_name: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
                placeholder="e.g. Shadow"
              />
            </div>
          </div>

          {/* Contact Info - Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full px-3 py-2 pr-9 rounded-lg border text-sm ${
                    isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                  placeholder="creator@email.com"
                />
                {formData.email && formData.email.trim() && (
                  <button
                    type="button"
                    onClick={() => handleCopy(formData.email, 'email')}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-600/50 transition-colors ${
                      copiedField === 'email' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-300'
                    }`}
                    title="Copy email"
                  >
                    {copiedField === 'email' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  value={formData.contact_details}
                  onChange={(e) => setFormData({...formData, contact_details: e.target.value})}
                  className={`w-full px-3 py-2 pr-9 rounded-lg border text-sm ${
                    isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                  placeholder="9876543210"
                />
                {formData.contact_details && formData.contact_details.trim() && (
                  <button
                    type="button"
                    onClick={() => handleCopy(formData.contact_details, 'phone')}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-600/50 transition-colors ${
                      copiedField === 'phone' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-300'
                    }`}
                    title="Copy phone number"
                  >
                    {copiedField === 'phone' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`block text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Shipping Address</label>
              {formData.address && formData.address.trim() && (
                <button
                  type="button"
                  onClick={() => handleCopy(formData.address, 'address')}
                  className={`p-1 rounded hover:bg-slate-600/50 transition-colors flex items-center gap-1 text-xs ${
                    copiedField === 'address' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-300'
                  }`}
                  title="Copy address"
                >
                  {copiedField === 'address' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedField === 'address' ? 'Copied!' : 'Copy'}</span>
                </button>
              )}
            </div>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              rows={2}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
              placeholder="Full shipping address with pincode"
            />
          </div>

          {/* Deal Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Deal Type</label>
              <select
                value={formData.deal_type}
                onChange={(e) => setFormData({...formData, deal_type: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              >
                <option value="barter">Barter</option>
                <option value="paid">Paid</option>
                <option value="barter_paid">Barter + Paid</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              >
                {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Products Sent</label>
              <input
                type="text"
                value={formData.products_sent}
                onChange={(e) => setFormData({...formData, products_sent: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
                placeholder="Moose leather toy, BarkBite cookies"
              />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Product Cost (₹)</label>
              <input
                type="number"
                value={formData.product_cost}
                onChange={(e) => setFormData({...formData, product_cost: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
                placeholder="500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Shipping Cost (₹)</label>
              <input
                type="number"
                value={formData.shipping_cost}
                onChange={(e) => setFormData({...formData, shipping_cost: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
                placeholder="100"
              />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Payment Amount (₹)</label>
              <input
                type="number"
                value={formData.payment_amount}
                onChange={(e) => setFormData({...formData, payment_amount: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
                placeholder="0"
              />
            </div>
          </div>

          {/* Workflow Dates Section */}
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Workflow Dates
            </h4>
            <p className={`text-xs mb-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Set dates to track deadlines and get reminders
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Ship By Date</label>
                <input
                  type="date"
                  value={formData.ship_by_date}
                  onChange={(e) => setFormData({...formData, ship_by_date: e.target.value})}
                  className={`w-full px-2 py-1.5 rounded border text-sm ${
                    isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Expected Post Date</label>
                <input
                  type="date"
                  value={formData.expected_post_date}
                  onChange={(e) => setFormData({...formData, expected_post_date: e.target.value})}
                  className={`w-full px-2 py-1.5 rounded border text-sm ${
                    isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Follow Up Date</label>
                <input
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData({...formData, follow_up_date: e.target.value})}
                  className={`w-full px-2 py-1.5 rounded border text-sm ${
                    isDarkMode ? 'bg-slate-600 border-slate-500 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Post URL */}
          <div>
            <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Post URL</label>
            <input
              type="url"
              value={formData.post_url}
              onChange={(e) => setFormData({...formData, post_url: e.target.value})}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
              placeholder="https://instagram.com/p/..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className={`block text-sm mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={2}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
              placeholder="Additional notes..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 p-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
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
          >
            {saving && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {creator ? 'Save' : 'Add Creator'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main UGC Tracker Tab Component
const UGCTrackerTab = () => {
  const { isDarkMode } = useAdminTheme();
  const [creators, setCreators] = useState([]);
  const [stats, setStats] = useState({});
  const [activityStats, setActivityStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCreator, setEditingCreator] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);
  const [statsPeriod, setStatsPeriod] = useState('all'); // Default to All Time for consistent view
  const [dateRange, setDateRange] = useState(''); // Display date range from API
  const [viewMode, setViewMode] = useState('all'); // Kept for table filtering
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activePipelineFilter, setActivePipelineFilter] = useState(null); // pipeline status filter
  const [filters, setFilters] = useState({
    status: '',
    platform: '',
    search: ''
  });
  
  // Show Completed toggle - default OFF to hide Posted and Cancelled items
  const [showCompleted, setShowCompleted] = useState(false);

  // Period options for stats dropdown - All Time first as it's the default
  const periodOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'daily', label: 'Daily' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  // Pipeline stat card click handler
  const handlePipelineClick = (statusKey) => {
    if (statusKey === 'total') {
      // Clear all filters when Total is clicked
      setActivePipelineFilter(null);
      setFilters(prev => ({ ...prev, status: '' }));
    } else if (activePipelineFilter === statusKey) {
      // Toggle off if same status clicked
      setActivePipelineFilter(null);
      setFilters(prev => ({ ...prev, status: '' }));
    } else {
      // Set new pipeline filter and sync with dropdown
      setActivePipelineFilter(statusKey);
      setFilters(prev => ({ ...prev, status: statusKey }));
    }
  };

  const toggleRowExpand = (creatorId) => {
    setExpandedRows(prev => 
      prev.includes(creatorId) 
        ? prev.filter(id => id !== creatorId)
        : [...prev, creatorId]
    );
  };

  // Filter creators by date based on viewMode
  const filterByDate = useCallback((creatorsData) => {
    if (viewMode === 'all') return creatorsData;
    
    return creatorsData.filter(creator => {
      const createdAt = creator.created_at ? new Date(creator.created_at) : null;
      const updatedAt = creator.updated_at ? new Date(creator.updated_at) : null;
      
      if (viewMode === 'daily') {
        return (createdAt && isSameDay(createdAt, selectedDate)) || 
               (updatedAt && isSameDay(updatedAt, selectedDate));
      }
      
      if (viewMode === 'weekly') {
        const weekStart = getWeekStart(selectedDate);
        return (createdAt && isInWeek(createdAt, weekStart)) || 
               (updatedAt && isInWeek(updatedAt, weekStart));
      }
      
      if (viewMode === 'monthly') {
        return (createdAt && isInMonth(createdAt, selectedDate.getMonth(), selectedDate.getFullYear())) || 
               (updatedAt && isInMonth(updatedAt, selectedDate.getMonth(), selectedDate.getFullYear()));
      }
      
      return true;
    });
  }, [viewMode, selectedDate]);

  // Calculate dynamic stats from creators data
  const calculateActivityStats = useCallback((creatorsData) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const weekStart = getWeekStart(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    
    let today_added = 0, today_updated = 0;
    let week_added = 0, week_updated = 0;
    let month_added = 0, month_updated = 0;
    
    creatorsData.forEach(creator => {
      const createdAt = creator.created_at ? new Date(creator.created_at) : null;
      const updatedAt = creator.updated_at ? new Date(creator.updated_at) : null;
      
      // Today stats
      if (createdAt && createdAt >= todayStart) today_added++;
      if (updatedAt && updatedAt >= todayStart && (!createdAt || !isSameDay(createdAt, updatedAt))) today_updated++;
      
      // Week stats - count any activity this week
      if (createdAt && createdAt >= weekStart) week_added++;
      if (updatedAt && updatedAt >= weekStart && (!createdAt || !isSameDay(createdAt, updatedAt))) week_updated++;
      
      // Month stats
      if (createdAt && createdAt >= monthStart) month_added++;
      if (updatedAt && updatedAt >= monthStart && (!createdAt || !isSameDay(createdAt, updatedAt))) month_updated++;
    });
    
    return { today_added, today_updated, week_added, week_updated, month_added, month_updated };
  }, []);

  const fetchCreators = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.platform) params.append('platform', filters.platform);
      if (filters.search) params.append('search', filters.search);
      
      const response = await fetch(`${API_URL}/admin/ugc-creators?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCreators(data.creators || []);
        const calculatedStats = calculateActivityStats(data.creators || []);
        setActivityStats(calculatedStats);
      }
    } catch (error) {
      console.error('Error fetching creators:', error);
      toast.error('Failed to load creators');
    } finally {
      setLoading(false);
    }
  }, [filters, calculateActivityStats]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/ugc-creators/stats?period=${statsPeriod}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats || {});
        setDateRange(data.date_range || '');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [statsPeriod]);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  // Fetch stats when period changes
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSave = async (formData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const url = editingCreator 
        ? `${API_URL}/admin/ugc-creators/${editingCreator._id}`
        : `${API_URL}/admin/ugc-creators`;
      const method = editingCreator ? 'PUT' : 'POST';
      
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
        toast.success(editingCreator ? 'Creator updated!' : 'Creator added!');
        fetchCreators();
        fetchStats();
        setEditingCreator(null);
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving creator:', error);
      toast.error('Failed to save creator');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this creator?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/ugc-creators/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Creator deleted');
        fetchCreators();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting creator:', error);
      toast.error('Failed to delete');
    }
  };

  const handleStatusChange = async (id, newStatus, scheduledData = null) => {
    try {
      const token = localStorage.getItem('adminToken');
      const body = { status: newStatus };
      
      // If scheduling, include the scheduled date/time
      if (newStatus === 'scheduled' && scheduledData) {
        body.scheduled_date = scheduledData.scheduled_date;
        body.scheduled_time = scheduledData.scheduled_time;
      }
      
      const response = await fetch(`${API_URL}/admin/ugc-creators/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (data.success) {
        toast.success(newStatus === 'scheduled' ? 'Post scheduled!' : 'Status updated');
        fetchCreators();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Handler for scheduled date change from StatusDropdown
  const handleScheduledDateChange = async (id, scheduledData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/ugc-creators/${id}/dates`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(scheduledData)
      });
      const data = await response.json();
      if (data.success) {
        setCreators(prev => prev.map(c => 
          c._id === id ? { ...c, ...scheduledData } : c
        ));
      }
    } catch (error) {
      console.error('Error updating scheduled date:', error);
    }
  };

  const handleNotesUpdate = async (id, notes) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/ugc-creators/${id}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes })
      });
      const data = await response.json();
      if (data.success) {
        setCreators(prev => prev.map(c => 
          c._id === id ? { ...c, notes } : c
        ));
        toast.success('Note saved');
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Failed to save note');
    }
  };

  const handleDateUpdate = async (id, dateData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/ugc-creators/${id}/dates`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(dateData)
      });
      const data = await response.json();
      if (data.success) {
        // Update local state
        setCreators(prev => prev.map(c => 
          c._id === id ? { ...c, ...dateData } : c
        ));
        toast.success('Date updated');
      }
    } catch (error) {
      console.error('Error updating date:', error);
      toast.error('Failed to update date');
    }
  };

  // Date navigation handlers
  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'daily') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'weekly') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'monthly') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Get filtered creators
  let filteredCreators = filterByDate(creators);

  // Calculate cost summary stats - EXCLUDING CANCELLED CREATORS
  const costSummary = React.useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Use filtered creators if any filter is active, otherwise use all creators
    const dataSource = (viewMode !== 'all' || filters.status || filters.platform || filters.search) 
      ? filteredCreators 
      : creators;
    
    // Exclude cancelled creators from spend calculations
    const activeCreators = dataSource.filter(c => c.status !== 'cancelled');
    
    let totalSpend = 0;
    let thisMonthSpend = 0;
    let postedValue = 0;
    let creatorsWithCost = 0;
    
    activeCreators.forEach(creator => {
      const cost = parseFloat(creator.total_cost) || 0;
      totalSpend += cost;
      
      if (cost > 0) {
        creatorsWithCost++;
      }
      
      // This month spend (non-cancelled only)
      if (creator.created_at) {
        const createdDate = new Date(creator.created_at);
        if (createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear) {
          thisMonthSpend += cost;
        }
      }
      
      // Posted value (only posted status)
      if (creator.status === 'posted') {
        postedValue += cost;
      }
    });
    
    // Average cost based on active creators with cost > 0
    const averageCost = creatorsWithCost > 0 ? Math.round(totalSpend / creatorsWithCost) : 0;
    
    return {
      totalSpend,
      thisMonthSpend,
      averageCost,
      postedValue
    };
  }, [creators, filteredCreators, viewMode, filters]);

  // Get the reset button label based on view mode
  const getResetLabel = () => {
    switch (viewMode) {
      case 'daily': return 'Today';
      case 'weekly': return 'This Week';
      case 'monthly': return 'This Month';
      default: return '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className={`text-xl font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <Users className="w-5 h-5 text-teal-400" />
            UGC Outreach Tracker
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Track influencer collaborations from outreach to posted content
          </p>
        </div>
        <button
          onClick={() => { setEditingCreator(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm"
        >
          <Plus size={16} />
          Add Creator
        </button>
      </div>

      {/* Period Selector Row */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-lg ${isDarkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-gray-50/50 border border-gray-200/50'}`}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>View:</span>
          <select
            value={statsPeriod}
            onChange={(e) => setStatsPeriod(e.target.value)}
            className={`px-2.5 py-1.5 rounded-md text-sm font-medium border-none cursor-pointer transition-colors ${
              isDarkMode 
                ? 'bg-slate-700 text-white hover:bg-slate-600' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
            data-testid="ugc-period-select"
          >
            {periodOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          {/* Date Range Display */}
          <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            {dateRange}
          </span>
          
          {/* Loading indicator */}
          {statsLoading && (
            <div className="w-3.5 h-3.5 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
          )}
        </div>
        
        {/* Cost Summary - moved here for consistency */}
        <div className="flex items-center gap-2 text-sm">
          <FaWallet className="w-3 h-3 text-teal-500" />
          <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Spend:</span>
          <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatRupee(stats.total_cost || 0)}</span>
          <span className={isDarkMode ? 'text-slate-600' : 'text-gray-300'}>|</span>
          <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Avg:</span>
          <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatRupee(stats.average_cost || 0)}</span>
          <span className={isDarkMode ? 'text-slate-600' : 'text-gray-300'}>|</span>
          <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Posted:</span>
          <span className="font-medium text-green-400">{formatRupee(stats.posted_value || 0)}</span>
        </div>
      </div>

      {/* Stats Cards - Clickable Pipeline Filter */}
      <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
        <button
          onClick={() => handlePipelineClick('total')}
          className={`rounded-lg p-2 text-center cursor-pointer transition-all ${
            !activePipelineFilter 
              ? isDarkMode ? 'bg-slate-700 ring-2 ring-teal-500' : 'bg-teal-50 ring-2 ring-teal-500'
              : isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-gray-50'
          }`}
          role="button"
          aria-label="Show all creators"
        >
          <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {showCompleted ? (stats.total || 0) : ((stats.total || 0) - (stats.posted || 0) - (stats.cancelled || 0))}
          </div>
          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Total</div>
        </button>
        <button
          onClick={() => handlePipelineClick('outreach')}
          className={`rounded-lg p-2 text-center border-l-4 border-gray-500 cursor-pointer transition-all ${
            activePipelineFilter === 'outreach'
              ? isDarkMode ? 'bg-slate-700 ring-2 ring-teal-500' : 'bg-gray-100 ring-2 ring-teal-500'
              : isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-gray-50'
          }`}
          role="button"
          aria-label="Filter by Outreach status"
        >
          <div className="text-xl font-bold text-gray-400">{stats.outreach || 0}</div>
          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Outreach</div>
        </button>
        <button
          onClick={() => handlePipelineClick('confirmed')}
          className={`rounded-lg p-2 text-center border-l-4 border-blue-500 cursor-pointer transition-all ${
            activePipelineFilter === 'confirmed'
              ? isDarkMode ? 'bg-slate-700 ring-2 ring-teal-500' : 'bg-blue-50 ring-2 ring-teal-500'
              : isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-gray-50'
          }`}
          role="button"
          aria-label="Filter by Confirmed status"
        >
          <div className="text-xl font-bold text-blue-400">{stats.confirmed || 0}</div>
          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Confirmed</div>
        </button>
        <button
          onClick={() => handlePipelineClick('contract_signed')}
          className={`rounded-lg p-2 text-center border-l-4 border-purple-500 cursor-pointer transition-all ${
            activePipelineFilter === 'contract_signed'
              ? isDarkMode ? 'bg-slate-700 ring-2 ring-teal-500' : 'bg-purple-50 ring-2 ring-teal-500'
              : isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-gray-50'
          }`}
          role="button"
          aria-label="Filter by Contract Signed status"
        >
          <div className="text-xl font-bold text-purple-400">{stats.contract_signed || 0}</div>
          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Contract</div>
        </button>
        <button
          onClick={() => handlePipelineClick('shipped')}
          className={`rounded-lg p-2 text-center border-l-4 border-yellow-500 cursor-pointer transition-all ${
            activePipelineFilter === 'shipped'
              ? isDarkMode ? 'bg-slate-700 ring-2 ring-teal-500' : 'bg-yellow-50 ring-2 ring-teal-500'
              : isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-gray-50'
          }`}
          role="button"
          aria-label="Filter by Shipped status"
        >
          <div className="text-xl font-bold text-yellow-400">{stats.shipped || 0}</div>
          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Shipped</div>
        </button>
        <button
          onClick={() => handlePipelineClick('content_received')}
          className={`rounded-lg p-2 text-center border-l-4 border-orange-500 cursor-pointer transition-all ${
            activePipelineFilter === 'content_received'
              ? isDarkMode ? 'bg-slate-700 ring-2 ring-teal-500' : 'bg-orange-50 ring-2 ring-teal-500'
              : isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-gray-50'
          }`}
          role="button"
          aria-label="Filter by Content Received status"
        >
          <div className="text-xl font-bold text-orange-400">{stats.content_received || 0}</div>
          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Received</div>
        </button>
        <button
          onClick={() => handlePipelineClick('in_editing')}
          className={`rounded-lg p-2 text-center border-l-4 border-cyan-500 cursor-pointer transition-all ${
            activePipelineFilter === 'in_editing'
              ? isDarkMode ? 'bg-slate-700 ring-2 ring-teal-500' : 'bg-cyan-50 ring-2 ring-teal-500'
              : isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-gray-50'
          }`}
          role="button"
          aria-label="Filter by In-Editing status"
        >
          <div className="text-xl font-bold text-cyan-400">{stats.in_editing || 0}</div>
          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Editing</div>
        </button>
        <button
          onClick={() => handlePipelineClick('scheduled')}
          className={`rounded-lg p-2 text-center border-l-4 border-violet-500 cursor-pointer transition-all ${
            activePipelineFilter === 'scheduled'
              ? isDarkMode ? 'bg-slate-700 ring-2 ring-teal-500' : 'bg-violet-50 ring-2 ring-teal-500'
              : isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-gray-50'
          }`}
          role="button"
          aria-label="Filter by Scheduled status"
        >
          <div className="text-xl font-bold text-violet-400">{stats.scheduled || 0}</div>
          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Scheduled</div>
        </button>
        <button
          onClick={() => handlePipelineClick('posted')}
          className={`rounded-lg p-2 text-center border-l-4 border-green-500 cursor-pointer transition-all ${
            activePipelineFilter === 'posted'
              ? isDarkMode ? 'bg-slate-700 ring-2 ring-teal-500' : 'bg-green-50 ring-2 ring-teal-500'
              : isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-gray-50'
          }`}
          role="button"
          aria-label="Filter by Posted status"
        >
          <div className="text-xl font-bold text-green-400">{stats.posted || 0}</div>
          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Posted</div>
        </button>
        <button
          onClick={() => handlePipelineClick('cancelled')}
          className={`rounded-lg p-2 text-center border-l-4 border-red-500 cursor-pointer transition-all ${
            activePipelineFilter === 'cancelled'
              ? isDarkMode ? 'bg-slate-700 ring-2 ring-teal-500' : 'bg-red-50 ring-2 ring-teal-500'
              : isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-gray-50'
          }`}
          role="button"
          aria-label="Filter by Cancelled status"
        >
          <div className="text-xl font-bold text-red-400">{stats.cancelled || 0}</div>
          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Cancelled</div>
        </button>
      </div>

      {/* Activity Stats Row (Table Filter Info) */}
      <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-1.5 rounded-lg text-sm ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-3">
          <span className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
            Activity: Today <span className="text-teal-500">{activityStats.today_added || 0}/{activityStats.today_updated || 0}</span>
          </span>
          <span className={isDarkMode ? 'text-slate-600' : 'text-gray-300'}>|</span>
          <span className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
            Week <span className="text-teal-500">{activityStats.week_added || 0}/{activityStats.week_updated || 0}</span>
          </span>
          <span className={isDarkMode ? 'text-slate-600' : 'text-gray-300'}>|</span>
          <span className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
            Month <span className="text-teal-500">{activityStats.month_added || 0}/{activityStats.month_updated || 0}</span>
          </span>
          <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>(added/updated)</span>
        </div>
      </div>

      {/* Table Filters Row */}
      <div className={`flex flex-wrap gap-2 items-center rounded-lg px-3 py-2 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          className={`rounded-lg px-2 py-1.5 text-sm border ${
            isDarkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-gray-50 text-gray-900 border-gray-300'
          }`}
          data-testid="ugc-table-filter-select"
        >
          <option value="all">All Creators</option>
          <option value="daily">Today's Activity</option>
          <option value="weekly">This Week's Activity</option>
          <option value="monthly">This Month's Activity</option>
        </select>

        {viewMode !== 'all' && (
          <>
            <button
              onClick={goToToday}
              className="px-2 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-lg"
            >
              {getResetLabel()}
            </button>
            <button
              onClick={() => navigateDate('prev')}
              className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => navigateDate('next')}
              className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <ChevronRight size={16} />
            </button>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
              <Calendar size={12} className="text-teal-500" />
              <span className={`text-xs ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatDateRange(viewMode, selectedDate)}
              </span>
            </div>
          </>
        )}

        <div className={`w-px h-6 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-300'}`} />

        <select
          value={filters.status}
          onChange={(e) => {
            setFilters({...filters, status: e.target.value});
            setActivePipelineFilter(e.target.value || null);
          }}
          className={`rounded-lg px-2 py-1.5 text-sm border ${
            isDarkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-gray-50 text-gray-900 border-gray-300'
          }`}
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
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
          <option value="youtube">YouTube</option>
          <option value="both">Both</option>
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

        {/* Show Completed Toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Show Completed</span>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
              showCompleted ? 'bg-teal-500' : isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
            }`}
            data-testid="show-completed-toggle"
          >
            <span 
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                showCompleted ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Compact Table with Due Date and Notes columns */}
      <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
        <table className="w-full">
          <thead className={isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}>
            <tr>
              <th className={`text-left px-3 py-3 text-xs font-medium w-10 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>#</th>
              <th className={`text-left px-3 py-3 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Creator</th>
              <th className={`text-left px-3 py-3 text-xs font-medium w-20 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Followers</th>
              <th className={`text-left px-3 py-3 text-xs font-medium w-16 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Cost</th>
              <th className={`text-left px-3 py-3 text-xs font-medium w-28 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Status</th>
              <th className={`text-left px-3 py-3 text-xs font-medium w-28 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Due Date</th>
              <th className={`text-left px-3 py-3 text-xs font-medium w-40 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Notes</th>
              <th className={`text-center px-3 py-3 text-xs font-medium w-24 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-100'}`}>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
                </td>
              </tr>
            ) : filteredCreators.length === 0 ? (
              <tr>
                <td colSpan={8} className={`text-center py-12 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  {filters.status ? `No creators with "${STATUS_CONFIG[filters.status]?.label || filters.status}" status.` : viewMode !== 'all' ? 'No creators found for this period.' : 'No UGC creators found. Click "Add Creator" to get started.'}
                </td>
              </tr>
            ) : filteredCreators.filter(c => showCompleted || (c.status !== 'posted' && c.status !== 'cancelled')).length === 0 ? (
              <tr>
                <td colSpan={8} className={`text-center py-12 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  No active creators. {(stats.posted > 0 || stats.cancelled > 0) && <span className="text-teal-400">Toggle "Show Completed" to see {(stats.posted || 0) + (stats.cancelled || 0)} completed items.</span>}
                </td>
              </tr>
            ) : (
              // Filter out completed items (posted/cancelled) if showCompleted is false
              filteredCreators
                .filter(creator => showCompleted || (creator.status !== 'posted' && creator.status !== 'cancelled'))
                .map((creator, index) => (
                <React.Fragment key={creator._id}>
                  {/* Main Row */}
                  <tr className={`${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}>
                    {/* Row number */}
                    <td className={`px-3 py-3 text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                      {index + 1}
                    </td>

                    {/* Creator */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {creator.platform === 'instagram' && <FaInstagram className="w-4 h-4 text-pink-400 flex-shrink-0" />}
                        {creator.platform === 'youtube' && <FaYoutube className="w-4 h-4 text-red-400 flex-shrink-0" />}
                        {creator.platform === 'both' && (
                          <div className="flex gap-1 flex-shrink-0">
                            <FaInstagram className="w-3.5 h-3.5 text-pink-400" />
                            <FaYoutube className="w-3.5 h-3.5 text-red-400" />
                          </div>
                        )}
                        <div>
                          <a 
                            href={creator.platform === 'youtube' 
                              ? `https://www.youtube.com/@${creator.handle.replace('@', '')}` 
                              : `https://www.instagram.com/${creator.handle.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`font-medium text-sm ${isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-500'} hover:underline`}
                          >
                            {creator.handle}
                          </a>
                          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            {creator.creator_name}{creator.dog_name && ` • ${creator.dog_name}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Followers */}
                    <td className={`px-3 py-3 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      {formatNumber(creator.followers)}
                    </td>

                    {/* Cost */}
                    <td className={`px-3 py-3 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      ₹{creator.total_cost || 0}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">
                      <StatusDropdown
                        status={creator.status}
                        onChange={(newStatus) => handleStatusChange(creator._id, newStatus)}
                        isDarkMode={isDarkMode}
                        creator={creator}
                        onScheduledDateChange={(scheduledData) => handleScheduledDateChange(creator._id, scheduledData)}
                      />
                    </td>

                    {/* Due Date */}
                    <td className="px-3 py-3">
                      <DueDateCell
                        creator={creator}
                        onDateUpdate={handleDateUpdate}
                        isDarkMode={isDarkMode}
                      />
                    </td>

                    {/* Notes */}
                    <td className="px-3 py-3">
                      <NotesColumnCell
                        notes={creator.notes}
                        creatorId={creator._id}
                        onSave={handleNotesUpdate}
                        isDarkMode={isDarkMode}
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {creator.post_url && (
                          <a
                            href={creator.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-1.5 rounded ${isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-200'}`}
                            title="View post"
                          >
                            <ExternalLink size={14} className="text-teal-400" />
                          </a>
                        )}
                        <button
                          onClick={() => { setEditingCreator(creator); setShowModal(true); }}
                          className={`p-1.5 rounded ${isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-200'}`}
                          title="Edit"
                        >
                          <Edit2 size={14} className={isDarkMode ? 'text-slate-400' : 'text-gray-500'} />
                        </button>
                        <button
                          onClick={() => handleDelete(creator._id)}
                          className={`p-1.5 rounded ${isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-200'}`}
                          title="Delete"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                        <button
                          onClick={() => toggleRowExpand(creator._id)}
                          className={`p-1.5 rounded transition-colors ${
                            isDarkMode ? 'hover:bg-slate-600 text-slate-400 hover:text-teal-400' : 'hover:bg-gray-200 text-gray-400 hover:text-teal-500'
                          }`}
                          title={expandedRows.includes(creator._id) ? 'Collapse' : 'Expand'}
                        >
                          {expandedRows.includes(creator._id) ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Details Row */}
                  {expandedRows.includes(creator._id) && (
                    <tr>
                      <td colSpan={8} className="p-0">
                        <div className={`border-l-2 border-teal-500 ml-4 pl-4 py-3 ${
                          isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'
                        }`}>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                            {/* Row 1: Timing info */}
                            <div className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                              <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>Added:</span>{' '}
                              <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>{formatRelativeTime(creator.created_at)}</span>
                            </div>
                            <div className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                              <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>Updated:</span>{' '}
                              <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>{formatRelativeTime(creator.updated_at)}</span>
                            </div>
                            <div className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                              <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>Platform:</span>{' '}
                              <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                                {creator.platform === 'instagram' ? 'Instagram' : 
                                 creator.platform === 'youtube' ? 'YouTube' : 'Instagram + YouTube'}
                              </span>
                            </div>
                            <div className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                              <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>Deal:</span>{' '}
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                creator.deal_type === 'barter' ? 'bg-purple-900/50 text-purple-300' :
                                creator.deal_type === 'paid' ? 'bg-green-900/50 text-green-300' :
                                'bg-blue-900/50 text-blue-300'
                              }`}>
                                {creator.deal_type === 'barter' ? 'Barter' :
                                 creator.deal_type === 'paid' ? `Paid ₹${creator.payment_amount || 0}` :
                                 'Barter + Paid'}
                              </span>
                            </div>
                            
                            {/* Row 2: Products */}
                            <div className={`md:col-span-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                              <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>Products:</span>{' '}
                              <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>{creator.products_sent || '-'}</span>
                            </div>
                            
                            {/* Row 3: Notes */}
                            <div className={`md:col-span-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                              <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>Notes:</span>{' '}
                              <ExpandedNotesCell
                                notes={creator.notes}
                                creatorId={creator._id}
                                onSave={handleNotesUpdate}
                                isDarkMode={isDarkMode}
                              />
                            </div>
                          </div>
                          
                          {/* Posting Checklist - only show when content has been received */}
                          {['content_received', 'in_editing', 'posted'].includes(creator.status) && (
                            <UGCPostingChecklist
                              creator={creator}
                              onUpdate={() => {
                                fetchCreators();
                                fetchStats();
                              }}
                              isDarkMode={isDarkMode}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results count */}
      {!loading && filteredCreators.length > 0 && (
        <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
          Showing {filteredCreators.length} of {creators.length} creators
          {filters.status && ` (${STATUS_CONFIG[filters.status]?.label})`}
          {viewMode !== 'all' && ` for ${formatDateRange(viewMode, selectedDate)}`}
        </div>
      )}

      {/* Modal */}
      <UGCCreatorModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingCreator(null); }}
        creator={editingCreator}
        onSave={handleSave}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default UGCTrackerTab;
