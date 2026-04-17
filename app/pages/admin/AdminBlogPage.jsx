import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/config/api';
import { Link, useNavigate } from 'react-router';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { Plus, Search, Edit, Trash2, Eye, FileText, CheckCircle, Clock, Send, Loader2, Zap, Check, X, ChevronRight } from 'lucide-react';
import { blogAPI } from '@/services/blogAPI';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Autopilot components
import BlogAutopilotPanel from '@/components/admin/blog/BlogAutopilotPanel';
import AutopilotRunsTable from '@/components/admin/blog/AutopilotRunsTable';
import AutopilotFlowViz from '@/components/admin/blog/AutopilotFlowViz';

// Using imported API_BASE_URL

function AdminBlogPage() {
  const { isDarkMode } = useAdminTheme();
  const navigate = useNavigate();
  const runsTableRef = useRef(null);
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState(''); // New: for autopilot filter
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, autopilot: 0 });
  const [submitting, setSubmitting] = useState({});
  const [actionLoading, setActionLoading] = useState({}); // For approve/reject actions
  const postsPerPage = 10;

  useEffect(() => {
    fetchPosts();
  }, [currentPage, statusFilter, searchTerm, sourceFilter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = {
        skip: (currentPage - 1) * postsPerPage,
        limit: postsPerPage,
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
        ...(sourceFilter && { source: sourceFilter })
      };

      const data = await blogAPI.getAllPosts(params);
      setPosts(data.posts || []);
      setTotalPosts(data.total || 0);

      // Calculate stats
      const totalResponse = await blogAPI.getAllPosts({ limit: 1000 });
      const allPosts = totalResponse.posts || [];
      setStats({
        total: allPosts.length,
        published: allPosts.filter(p => p.status === 'published').length,
        drafts: allPosts.filter(p => p.status === 'draft').length,
        autopilot: allPosts.filter(p => p.source === 'autopilot').length
      });
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId, postTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${postTitle}"?`)) {
      return;
    }

    try {
      await blogAPI.deletePost(postId);
      toast.success('Post deleted successfully');
      fetchPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleSubmitToGoogle = async (postId, postTitle) => {
    setSubmitting(prev => ({ ...prev, [postId]: true }));
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/seo/submit-blog/${postId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message || `"${postTitle}" submitted to Google!`);
        if (data.mocked) {
          toast.info('Note: Google API not configured - submission was mocked');
        }
      } else {
        toast.error(data.message || 'Failed to submit to Google');
      }
    } catch (error) {
      console.error('Failed to submit to Google:', error);
      toast.error('Failed to submit to Google');
    } finally {
      setSubmitting(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSourceFilter = (source) => {
    setSourceFilter(source === sourceFilter ? '' : source);
    setCurrentPage(1);
  };

  // Handle approve autopilot blog
  const handleApprove = async (postId) => {
    setActionLoading(prev => ({ ...prev, [postId]: 'approve' }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/autopilot/runs/${postId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        toast.success('Blog approved and published!');
        fetchPosts();
        if (runsTableRef.current) runsTableRef.current.refresh();
      } else {
        toast.error('Failed to approve blog');
      }
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error('Failed to approve blog');
    } finally {
      setActionLoading(prev => ({ ...prev, [postId]: null }));
    }
  };

  // Handle reject autopilot blog
  const handleReject = async (postId) => {
    setActionLoading(prev => ({ ...prev, [postId]: 'reject' }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/autopilot/runs/${postId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        toast.success('Blog rejected');
        fetchPosts();
        if (runsTableRef.current) runsTableRef.current.refresh();
      } else {
        toast.error('Failed to reject blog');
      }
    } catch (error) {
      console.error('Failed to reject:', error);
      toast.error('Failed to reject blog');
    } finally {
      setActionLoading(prev => ({ ...prev, [postId]: null }));
    }
  };

  // Get distribution dots for shared_to
  const getDistributionDots = (sharedTo) => {
    if (!sharedTo || Object.keys(sharedTo).length === 0) return null;
    
    const platforms = {
      twitter: '#1DA1F2',
      instagram: '#E4405F',
      facebook: '#1877F2',
      linkedin: '#0A66C2'
    };
    
    return (
      <div className="flex items-center gap-1 ml-2">
        {Object.entries(sharedTo).map(([platform, value]) => {
          if (!value) return null;
          return (
            <span
              key={platform}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: platforms[platform] || '#64748B' }}
              title={platform}
            />
          );
        })}
      </div>
    );
  };

  const totalPages = Math.ceil(totalPosts / postsPerPage);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} p-4`}>
      <ToastContainer position="top-right" theme={isDarkMode ? 'dark' : 'light'} />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 mb-4" data-testid="breadcrumb-nav">
          <Link 
            to="/admin/marketing" 
            className="text-sm text-slate-500 hover:text-teal-400 cursor-pointer transition-colors"
          >
            Marketing Hub
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <Link 
            to="/admin/marketing" 
            className="text-sm text-slate-500 hover:text-teal-400 cursor-pointer transition-colors"
          >
            AI Blog
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-sm text-slate-200 font-medium">Blog Management</span>
        </div>

        {/* Compact Header with Inline Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <div>
              <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-[#F8FAFC]' : 'text-gray-900'}`}>
                Blog Management
              </h1>
              <p className={`text-xs ${isDarkMode ? 'text-[#94A3B8]' : 'text-gray-600'}`}>
                Create and manage blog posts
              </p>
            </div>
            
            {/* Inline Stats Bar */}
            <div className={`hidden md:flex items-center gap-4 px-4 py-1.5 rounded-lg ${isDarkMode ? 'bg-[#1E293B]' : 'bg-white/80'} border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-1.5">
                <FileText className={`w-3.5 h-3.5 ${isDarkMode ? 'text-teal-400' : 'text-indigo-500'}`} />
                <span className={`text-xs font-medium ${isDarkMode ? 'text-[#E2E8F0]' : 'text-gray-600'}`}>
                  {stats.total} Total
                </span>
              </div>
              <div className="w-px h-4 bg-slate-600/30" />
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className={`text-xs font-medium ${isDarkMode ? 'text-[#E2E8F0]' : 'text-gray-600'}`}>
                  {stats.published} Published
                </span>
              </div>
              <div className="w-px h-4 bg-slate-600/30" />
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className={`text-xs font-medium ${isDarkMode ? 'text-[#E2E8F0]' : 'text-gray-600'}`}>
                  {stats.drafts} Drafts
                </span>
              </div>
              <div className="w-px h-4 bg-slate-600/30" />
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-violet-400" />
                <span className={`text-xs font-medium ${isDarkMode ? 'text-[#E2E8F0]' : 'text-gray-600'}`}>
                  {stats.autopilot} Autopilot
                </span>
              </div>
            </div>
          </div>
          
          <Link to="/admin/blog/create">
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-teal-500/25 transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Create Post
            </button>
          </Link>
        </div>

        {/* Mobile Stats Row */}
        <div className={`md:hidden flex items-center justify-around mb-4 p-2 rounded-lg ${isDarkMode ? 'bg-[#1E293B] border border-slate-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center gap-1.5">
            <FileText className={`w-3.5 h-3.5 ${isDarkMode ? 'text-teal-400' : 'text-indigo-500'}`} />
            <span className={`text-xs font-medium ${isDarkMode ? 'text-[#E2E8F0]' : 'text-gray-600'}`}>{stats.total}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className={`text-xs font-medium ${isDarkMode ? 'text-[#E2E8F0]' : 'text-gray-600'}`}>{stats.published}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className={`text-xs font-medium ${isDarkMode ? 'text-[#E2E8F0]' : 'text-gray-600'}`}>{stats.drafts}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-violet-400" />
            <span className={`text-xs font-medium ${isDarkMode ? 'text-[#E2E8F0]' : 'text-gray-600'}`}>{stats.autopilot}</span>
          </div>
        </div>

        {/* Blog Autopilot Panel */}
        <BlogAutopilotPanel onRunsRefresh={() => runsTableRef.current?.refresh()} />

        {/* Autopilot Runs Table */}
        <AutopilotRunsTable ref={runsTableRef} />

        {/* Daily Flow Visualization */}
        <AutopilotFlowViz />

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-4" data-testid="filter-tabs">
          <button
            onClick={() => { setStatusFilter(''); setSourceFilter(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
              !statusFilter && !sourceFilter
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                : isDarkMode
                  ? 'bg-[#1E293B] border border-slate-700 text-slate-300 hover:border-teal-500 hover:text-teal-400'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-500'
            }`}
            data-testid="filter-all"
          >
            All
          </button>
          <button
            onClick={() => { setStatusFilter('published'); setSourceFilter(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
              statusFilter === 'published' && !sourceFilter
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                : isDarkMode
                  ? 'bg-[#1E293B] border border-slate-700 text-slate-300 hover:border-teal-500 hover:text-teal-400'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-500'
            }`}
            data-testid="filter-published"
          >
            Published
          </button>
          <button
            onClick={() => { setStatusFilter('draft'); setSourceFilter(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
              statusFilter === 'draft' && !sourceFilter
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                : isDarkMode
                  ? 'bg-[#1E293B] border border-slate-700 text-slate-300 hover:border-teal-500 hover:text-teal-400'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-500'
            }`}
            data-testid="filter-drafts"
          >
            Drafts
          </button>
          <button
            onClick={() => handleSourceFilter('autopilot')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
              sourceFilter === 'autopilot'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                : isDarkMode
                  ? 'bg-[#1E293B] border border-slate-700 text-slate-300 hover:border-violet-500 hover:text-violet-400'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-500'
            }`}
            data-testid="filter-autopilot"
          >
            <Zap className="w-3 h-3" />
            Autopilot
          </button>
        </div>

        {/* Compact Filters */}
        <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-[#1E293B] border border-slate-700' : 'bg-white border border-gray-200'} mb-4`}>
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-[#64748B]' : 'text-gray-400'} w-3.5 h-3.5`} />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={handleSearch}
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-sm ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-[#64748B]'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500`}
                data-testid="search-input"
              />
            </div>
            <select
              value={statusFilter}
              onChange={handleStatusFilter}
              className={`px-3 py-1.5 rounded-lg border text-sm ${
                isDarkMode 
                  ? 'bg-slate-900 border-slate-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-1 focus:ring-teal-500`}
              data-testid="status-filter"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
            </select>
          </div>
        </div>

        {/* Posts Table - Compact Design */}
        <div className={`rounded-2xl overflow-hidden ${isDarkMode ? 'bg-[#1E293B] border border-slate-700' : 'bg-white border border-gray-200'}`} data-testid="blog-list">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 text-teal-500 animate-spin mx-auto" />
              <div className={`text-sm mt-2 ${isDarkMode ? 'text-[#94A3B8]' : 'text-gray-600'}`}>
                Loading posts...
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className={`mx-auto mb-3 ${isDarkMode ? 'text-[#64748B]' : 'text-gray-400'} w-8 h-8`} />
              <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-gray-600'}`}>
                No blog posts found
              </p>
              <Link to="/admin/blog/create">
                <button className="mt-2 text-xs text-teal-400 hover:underline">
                  Create your first post
                </button>
              </Link>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className={`${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-4 py-2 text-left text-[10px] uppercase tracking-wider font-semibold ${isDarkMode ? 'text-[#64748B]' : 'text-gray-500'}`}>
                      Title
                    </th>
                    <th className={`px-4 py-2 text-left text-[10px] uppercase tracking-wider font-semibold ${isDarkMode ? 'text-[#64748B]' : 'text-gray-500'}`}>
                      Category
                    </th>
                    <th className={`px-4 py-2 text-left text-[10px] uppercase tracking-wider font-semibold ${isDarkMode ? 'text-[#64748B]' : 'text-gray-500'}`}>
                      Status
                    </th>
                    <th className={`px-4 py-2 text-left text-[10px] uppercase tracking-wider font-semibold ${isDarkMode ? 'text-[#64748B]' : 'text-gray-500'}`}>
                      Date
                    </th>
                    <th className={`px-4 py-2 text-right text-[10px] uppercase tracking-wider font-semibold ${isDarkMode ? 'text-[#64748B]' : 'text-gray-500'}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-gray-200'}`}>
                  {posts.map((post) => (
                    <tr 
                      key={post.id}
                      className={`${isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-gray-50'} transition-colors cursor-pointer group`}
                      onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                      data-testid={`blog-row-${post.id}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {post.featuredImage?.url && (
                            <img 
                              src={post.featuredImage.url} 
                              alt="" 
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                                {post.title}
                              </p>
                              {/* Autopilot Badge */}
                              {(post.source === 'autopilot' || post.source === 'blog_autopilot') && (
                                <span className="inline-flex items-center gap-1 bg-violet-500/20 text-violet-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  <Zap className="w-2.5 h-2.5" />
                                  Autopilot
                                </span>
                              )}
                              {/* Distribution Dots */}
                              {post.shared_to && getDistributionDots(post.shared_to)}
                            </div>
                            <p className={`text-xs ${isDarkMode ? 'text-[#64748B]' : 'text-gray-500'} truncate max-w-[200px]`}>
                              {post.excerpt}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-xs ${isDarkMode ? 'text-[#94A3B8]' : 'text-gray-600'}`}>
                        {post.category || 'Uncategorized'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          post.status === 'published'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : post.status === 'pending_approval'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {post.status === 'published' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {post.status === 'published' ? 'Published' : post.status === 'pending_approval' ? 'Pending' : 'Draft'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-xs ${isDarkMode ? 'text-[#64748B]' : 'text-gray-500'}`}>
                        {formatDate(post.publishDate || post.createdAt)}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Approve/Reject for pending_approval */}
                          {post.status === 'pending_approval' && (
                            <>
                              <button
                                onClick={() => handleApprove(post.id)}
                                disabled={actionLoading[post.id]}
                                className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                                title="Approve"
                                data-testid={`approve-btn-${post.id}`}
                              >
                                {actionLoading[post.id] === 'approve' ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleReject(post.id)}
                                disabled={actionLoading[post.id]}
                                className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                title="Reject"
                                data-testid={`reject-btn-${post.id}`}
                              >
                                {actionLoading[post.id] === 'reject' ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <X className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </>
                          )}
                          {post.status === 'published' && (
                            <button
                              onClick={() => handleSubmitToGoogle(post.id, post.title)}
                              disabled={submitting[post.id]}
                              className={`p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${
                                isDarkMode 
                                  ? 'hover:bg-teal-500/20 text-teal-400 hover:text-teal-300'
                                  : 'hover:bg-teal-50 text-teal-600 hover:text-teal-700'
                              } ${submitting[post.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title="Submit to Google"
                            >
                              {submitting[post.id] ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                            className={`p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${
                              isDarkMode 
                                ? 'hover:bg-slate-700 text-[#94A3B8] hover:text-white'
                                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                            }`}
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                            className={`p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${
                              isDarkMode 
                                ? 'hover:bg-slate-700 text-[#94A3B8] hover:text-white'
                                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                            }`}
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id, post.title)}
                            className={`p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${
                              isDarkMode 
                                ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300'
                                : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                            }`}
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Compact Pagination */}
              {totalPages > 1 && (
                <div className={`px-4 py-3 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs ${isDarkMode ? 'text-[#64748B]' : 'text-gray-500'}`}>
                      {(currentPage - 1) * postsPerPage + 1}-{Math.min(currentPage * postsPerPage, totalPosts)} of {totalPosts}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                          currentPage === 1
                            ? isDarkMode ? 'bg-slate-800 text-slate-600' : 'bg-gray-100 text-gray-400'
                            : isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Prev
                      </button>
                      {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-7 h-7 rounded-lg text-xs font-medium ${
                              currentPage === pageNum
                                ? 'bg-teal-500 text-white'
                                : isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                          currentPage === totalPages
                            ? isDarkMode ? 'bg-slate-800 text-slate-600' : 'bg-gray-100 text-gray-400'
                            : isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminBlogPage;
