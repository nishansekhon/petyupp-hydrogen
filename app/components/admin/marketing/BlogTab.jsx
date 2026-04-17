/**
 * BlogTab Component
 * 
 * Handles the AI Blog tab functionality in Marketing Hub including:
 * - AI Blog Generator card
 * - Blog stats display
 * - AI Autopilot status and settings
 * - Upcoming AI Posts section
 * - Published Blog Posts table
 * - Blog actions (view, generate image, edit, delete)
 * 
 * @component
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { 
  Sparkles, BarChart3, Rocket, CalendarDays, Circle, 
  Package, Edit3, Pause, Play, Settings, Loader2, 
  Clock, ExternalLink, Edit, Trash2, Image as ImageIcon,
  CheckCircle, X, Eye, Save, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';
import ConfirmationModal from '@/components/common/ConfirmationModal';

// Settings Modal Component
const AutopilotSettingsModal = ({ isDarkMode, settings, setSettings, onSave, onClose, loading }) => {
  const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: '3_per_week', label: '3 per week' },
    { value: '2_per_week', label: '2 per week' },
    { value: '1_per_week', label: 'Weekly' }
  ];
  
  const publishDays = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' }
  ];
  
  const contentTypes = [
    { value: 'educational', label: 'Educational' },
    { value: 'product', label: 'Product Focused' },
    { value: 'how-to', label: 'How-To Guides' },
    { value: 'faq', label: 'FAQ / Q&A' }
  ];
  
  const togglePublishDay = (day) => {
    const currentDays = settings.publishDays || [];
    if (currentDays.includes(day)) {
      setSettings({ ...settings, publishDays: currentDays.filter(d => d !== day) });
    } else {
      setSettings({ ...settings, publishDays: [...currentDays, day].sort((a, b) => a - b) });
    }
  };
  
  const toggleContentType = (type) => {
    const currentMix = settings.contentMix || [];
    if (currentMix.includes(type)) {
      if (currentMix.length > 1) { // Keep at least one
        setSettings({ ...settings, contentMix: currentMix.filter(t => t !== type) });
      }
    } else {
      setSettings({ ...settings, contentMix: [...currentMix, type] });
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className={`w-full max-w-md rounded-xl overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`px-5 py-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <Settings size={16} className="text-teal-400" />
              </div>
              <h3 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Autopilot Settings
              </h3>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-700">
              <X size={18} className="text-slate-400" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Enable Autopilot</p>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Automatically generate blog posts</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, isActive: !settings.isActive })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.isActive ? 'bg-teal-500' : isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.isActive ? 'left-6' : 'left-1'
              }`} />
            </button>
          </div>
          
          {/* Frequency */}
          <div>
            <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Frequency</p>
            <select
              value={settings.frequency || '2_per_week'}
              onChange={(e) => setSettings({ ...settings, frequency: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              {frequencies.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          
          {/* Publish Time */}
          <div>
            <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Publish Time</p>
            <input
              type="time"
              value={settings.publishTime || '10:00'}
              onChange={(e) => setSettings({ ...settings, publishTime: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            />
          </div>
          
          {/* Publish Days */}
          <div>
            <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Publish Days</p>
            <div className="flex gap-1">
              {publishDays.map(day => (
                <button
                  key={day.value}
                  onClick={() => togglePublishDay(day.value)}
                  className={`flex-1 py-2 text-xs rounded-lg font-medium transition-colors ${
                    (settings.publishDays || []).includes(day.value)
                      ? 'bg-teal-500 text-white'
                      : isDarkMode 
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Content Mix */}
          <div>
            <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Content Types</p>
            <div className="grid grid-cols-2 gap-2">
              {contentTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => toggleContentType(type.value)}
                  className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
                    (settings.contentMix || []).includes(type.value)
                      ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                      : isDarkMode 
                        ? 'bg-slate-700 text-slate-300 border border-slate-600 hover:border-slate-500' 
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Auto Publish Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Auto-Publish</p>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Publish immediately after generation</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, autoPublish: !settings.autoPublish })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.autoPublish ? 'bg-teal-500' : isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.autoPublish ? 'left-6' : 'left-1'
              }`} />
            </button>
          </div>
          
          {/* Product Linking Info */}
          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              <span className="text-teal-400 font-medium">💡 Product Linking:</span> AI will automatically link relevant PetYupp products in generated posts.
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className={`px-5 py-4 border-t flex justify-end gap-3 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm rounded-lg ${
              isDarkMode 
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="px-4 py-2 text-sm bg-teal-500 hover:bg-teal-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

const BlogTab = ({
  isDarkMode,
  // Blog data
  blogs,
  loadingBlogs,
  fetchBlogs,
  // Blog generator
  setShowBlogGenerator,
  // Autopilot
  autopilotEnabled,
  autopilotStatus,
  autopilotQueue,
  autopilotSettings,
  autopilotLoading,
  showAutopilotSettings,
  setShowAutopilotSettings,
  setAutopilotSettings,
  toggleAutopilot,
  saveAutopilotSettings,
  // Image generation
  openImageGenerator,
  // Products for linking
  products
}) => {
  const navigate = useNavigate();
  
  // Delete confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: '', id: '', title: '' });

  // Delete blog post
  const handleDeleteBlog = async (blogId) => {
    setDeleteConfirm({ show: false, type: '', id: '', title: '' });
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/blog/posts/${blogId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Blog post deleted');
        fetchBlogs();
      } else {
        toast.error('Failed to delete blog post');
      }
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error('Failed to delete blog post');
    }
  };

  // Delete queue item
  const handleDeleteQueueItem = async (queueId) => {
    setDeleteConfirm({ show: false, type: '', id: '', title: '' });
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/autopilot/queue?queue_id=${queueId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('Queue item removed');
        // Refresh the queue - parent component should handle this
        if (typeof fetchBlogs === 'function') {
          fetchBlogs();
        }
        // Force a page refresh to update queue
        window.location.reload();
      } else {
        toast.error('Failed to remove queue item');
      }
    } catch (error) {
      console.error('Error deleting queue item:', error);
      toast.error('Failed to remove queue item');
    }
  };
  
  // Show delete confirmation modal
  const confirmDelete = (type, id, title) => {
    setDeleteConfirm({ show: true, type, id, title });
  };
  
  // Handle confirm action
  const handleConfirmDelete = () => {
    if (deleteConfirm.type === 'blog') {
      handleDeleteBlog(deleteConfirm.id);
    } else if (deleteConfirm.type === 'queue') {
      handleDeleteQueueItem(deleteConfirm.id);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    });
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const styles = {
      published: 'bg-green-500/20 text-green-400',
      draft: 'bg-amber-500/20 text-amber-400',
      scheduled: 'bg-blue-500/20 text-blue-400'
    };
    return styles[status] || styles.draft;
  };

  return (
    <div className="space-y-5">
      {/* Header Row: Generator Card + Stats Card + Autopilot Status */}
      <div className="grid grid-cols-12 gap-4">
        {/* AI Generator Card - col-span-4 */}
        <div className={`col-span-12 lg:col-span-4 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border rounded-xl p-5 ${isDarkMode ? 'border-teal-500/30' : 'border-teal-300'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>AI Blog Generator</h3>
              <p className="text-xs text-slate-400">Create SEO-optimized posts with product links</p>
            </div>
          </div>
          <button
            onClick={() => setShowBlogGenerator(true)}
            className="w-full mt-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles size={14} />
            Generate New Post
          </button>
        </div>

        {/* Stats Card - col-span-3 */}
        <div className={`col-span-12 lg:col-span-3 border rounded-xl p-5 ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-teal-400" />
            </div>
            <h3 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Blog Stats</h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{blogs.length}</p>
              <p className="text-[10px] text-slate-500 uppercase">Total</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-400">{blogs.filter(b => b.status === 'published').length}</p>
              <p className="text-[10px] text-slate-500 uppercase">Published</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-amber-400">{blogs.filter(b => b.status === 'draft').length}</p>
              <p className="text-[10px] text-slate-500 uppercase">Drafts</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-400">{blogs.reduce((sum, b) => sum + (b.views || 0), 0).toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 uppercase">Views</p>
            </div>
          </div>
          <Link 
            to="/admin/blog" 
            className="text-xs text-teal-400 hover:text-teal-300 cursor-pointer mt-3 inline-flex items-center gap-1"
          >
            Manage All Posts
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* AI Autopilot Status Card - col-span-5 */}
        <div className={`col-span-12 lg:col-span-5 border rounded-xl p-5 transition-all ${
          isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
        } ${autopilotEnabled ? 'border-teal-500/50' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                autopilotEnabled ? 'bg-teal-500/20' : 'bg-slate-700/50'
              }`}>
                <Rocket className={`w-5 h-5 ${autopilotEnabled ? 'text-teal-400' : 'text-slate-500'}`} />
              </div>
              <div>
                <h3 className={`text-base font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  AI Autopilot
                  {autopilotEnabled && (
                    <span className="px-2 py-0.5 bg-teal-500/20 text-teal-400 text-[10px] rounded-full uppercase font-bold">Active</span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">Auto-generates 2 posts/week</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAutopilotSettings(true)}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
              >
                <Settings size={16} className="text-slate-400" />
              </button>
              <button
                onClick={toggleAutopilot}
                disabled={autopilotLoading}
                className={`p-2 rounded-lg transition-colors ${
                  autopilotEnabled 
                    ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30' 
                    : isDarkMode ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {autopilotLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : autopilotEnabled ? (
                  <Pause size={16} />
                ) : (
                  <Play size={16} />
                )}
              </button>
            </div>
          </div>
          
          {/* Autopilot Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                <CalendarDays size={12} className="text-teal-400" />
                <span className="text-[10px] text-slate-400 uppercase">Next Post</span>
              </div>
              <p className={`text-sm font-medium mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {autopilotStatus.nextPost 
                  ? new Date(autopilotStatus.nextPost).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                  : 'Not scheduled'
                }
              </p>
            </div>
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                <Circle size={12} className="text-blue-400" />
                <span className="text-[10px] text-slate-400 uppercase">In Queue</span>
              </div>
              <p className={`text-sm font-medium mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {autopilotStatus.scheduled || 0} posts
              </p>
            </div>
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                <Package size={12} className="text-green-400" />
                <span className="text-[10px] text-slate-400 uppercase">This Month</span>
              </div>
              <p className={`text-sm font-medium mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {autopilotStatus.generatedThisMonth || 0} generated
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming AI Posts Section */}
      <div className={`border rounded-xl p-5 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Upcoming AI Posts</h3>
          <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
            {autopilotQueue.length} in queue
          </span>
        </div>
        
        {autopilotQueue.length === 0 ? (
          <div className={`text-center py-6 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
            <CalendarDays size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No posts scheduled</p>
            <p className="text-xs mt-1">Enable autopilot to auto-generate posts</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {autopilotQueue.slice(0, 4).map((post, idx) => {
              // Get the title from generated content if available, or suggested_title
              const displayTitle = post.generated_content?.title || post.suggested_title || 'Pending Generation';
              const postType = post.post_type || post.generated_content?.category?.toLowerCase() || 'educational';
              const isGenerated = post.status === 'ready' && post.generated_content;
              
              return (
                <div 
                  key={post.id || idx}
                  className={`p-3 rounded-lg border ${
                    isDarkMode ? 'bg-slate-700/30 border-slate-600/50' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      postType === 'educational' ? 'bg-blue-500/20 text-blue-400' :
                      postType === 'product' ? 'bg-green-500/20 text-green-400' :
                      postType === 'how-to' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {postType}
                    </span>
                    <div className="flex items-center gap-1">
                      {isGenerated && (
                        <CheckCircle size={12} className="text-green-400" />
                      )}
                      <button
                        onClick={() => confirmDelete('queue', post.id, displayTitle)}
                        className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-50'}`}
                        title="Remove from queue"
                      >
                        <X size={12} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                  <p className={`text-sm font-medium line-clamp-2 mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {displayTitle}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <Clock size={10} />
                    <span>
                      {post.scheduled_date || post.scheduledFor
                        ? new Date(post.scheduled_date || post.scheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'Pending'
                      }
                    </span>
                    {isGenerated && (
                      <span className="text-green-400">• Ready</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Blog Posts List */}
      <div className={`border rounded-xl overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className={`px-5 py-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Blog Posts
          </h3>
          <Link 
            to="/admin/blog" 
            className="text-sm text-teal-400 hover:text-teal-300 cursor-pointer inline-flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        
        <div className="divide-y divide-slate-700/50">
          {loadingBlogs ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-500" />
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Loading posts...</p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-12">
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>No blog posts yet</p>
              <button
                onClick={() => setShowBlogGenerator(true)}
                className="mt-2 text-sm text-teal-400 hover:text-teal-300"
              >
                Create your first post →
              </button>
            </div>
          ) : (
            blogs.map(blog => (
              <div 
                key={blog._id || blog.id}
                className={`px-5 py-3 flex items-center gap-4 ${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'} transition-colors`}
              >
                {/* Featured Image Thumbnail */}
                <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-700/50 flex-shrink-0">
                  {blog.featuredImage?.url ? (
                    <img 
                      src={blog.featuredImage.url} 
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-slate-500" />
                    </div>
                  )}
                </div>
                
                {/* Title & Meta */}
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {blog.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                      {formatDate(blog.createdAt || blog.publishedDate)}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusBadge(blog.status)}`}>
                      {blog.status}
                    </span>
                    {blog.category && (
                      <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                        {blog.category}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Views */}
                <div className="text-right hidden md:block">
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {(blog.views || 0).toLocaleString()}
                  </p>
                  <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>views</p>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => window.open(`/blog/${blog.slug}`, '_blank')}
                    className={`p-1.5 rounded transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
                    title="View"
                  >
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </button>
                  <button 
                    onClick={() => openImageGenerator(blog)}
                    className={`p-1.5 rounded transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
                    title="Generate Image"
                  >
                    <ImageIcon className="w-3 h-3 text-teal-400" />
                  </button>
                  <button 
                    onClick={() => navigate(`/admin/blog/edit/${blog.id || blog._id}`)}
                    className={`p-1.5 rounded transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
                    title="Edit"
                  >
                    <Edit className="w-3 h-3 text-slate-400" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDelete('blog', blog.id || blog._id, blog.title);
                    }}
                    className={`p-1.5 rounded transition-colors ${isDarkMode ? 'hover:bg-red-500/20' : 'hover:bg-red-50'}`}
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Autopilot Info */}
      <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-800/30 border border-slate-700/50' : 'bg-gray-50 border border-gray-200'}`}>
        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          <span className="font-medium text-teal-400">💡 AI Autopilot Tip:</span> The autopilot analyzes your products and generates SEO-optimized blog posts automatically. 
          Each post includes internal links to relevant products. Enable autopilot and let AI handle your content marketing!
          <br />
          <span className="opacity-70">Workflow: Select Products → Generate Title → Write Content → Add Image → Schedule!</span>
        </p>
      </div>
      
      {/* Autopilot Settings Modal */}
      {showAutopilotSettings && (
        <AutopilotSettingsModal
          isDarkMode={isDarkMode}
          settings={autopilotSettings}
          setSettings={setAutopilotSettings}
          onSave={saveAutopilotSettings}
          onClose={() => setShowAutopilotSettings(false)}
          loading={autopilotLoading}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, type: '', id: '', title: '' })}
        onConfirm={handleConfirmDelete}
        title={deleteConfirm.type === 'blog' ? 'Delete Blog Post' : 'Remove Scheduled Post'}
        message={deleteConfirm.type === 'blog' 
          ? 'Are you sure you want to delete this blog post?' 
          : 'Are you sure you want to remove this scheduled post from the queue?'}
        itemName={deleteConfirm.title}
        warning="This action cannot be undone."
        confirmText="Delete"
        confirmColor="red"
      />
    </div>
  );
};

export default BlogTab;
