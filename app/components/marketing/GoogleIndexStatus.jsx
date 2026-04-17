/**
 * GoogleIndexStatus Component
 * 
 * Displays Google Index Status dashboard with:
 * - Stats for indexed, not indexed, submitted, error counts
 * - Filter tabs by status
 * - URL table with actions (Submit, Re-check)
 * - Bulk operations (Sync URLs, Check All, Submit All Unindexed)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Globe, RefreshCw, Search, CheckCircle, XCircle, Clock, 
  AlertTriangle, ExternalLink, Loader2, FileSearch, Send, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';

const API_URL = API_BASE_URL;

// Helper function to convert clean URL to render/prerender URL for Google indexing
const toPrerenderUrl = (cleanUrl) => {
  const baseUrl = 'https://www.oyebark.com';
  
  // Extract the path from the URL
  let urlPath;
  if (cleanUrl.startsWith('http')) {
    try {
      const parsed = new URL(cleanUrl);
      urlPath = parsed.pathname;
    } catch (e) {
      urlPath = cleanUrl;
    }
  } else {
    urlPath = cleanUrl;
  }
  
  // Map to render/prerender URL based on path type
  if (urlPath.startsWith('/blog/')) {
    const slug = urlPath.replace('/blog/', '');
    return `${baseUrl}/api/blog/render/${slug}`;
  } else if (urlPath.startsWith('/product/')) {
    const slug = urlPath.replace('/product/', '');
    return `${baseUrl}/api/prerender/product/${slug}`;
  } else {
    // Static pages: /, /products, /stores, /about, /contact, /affiliate, etc.
    let pageName = urlPath.replace(/^\//, '') || 'home';
    // Handle /products as 'shop' for consistency with sitemap
    if (pageName === 'products') pageName = 'shop';
    if (pageName === '') pageName = 'home';
    return `${baseUrl}/api/prerender/page/${pageName}`;
  }
};

// Status badge styles
const STATUS_STYLES = {
  'Indexed': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Not Indexed': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Submitted': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Error': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Unknown': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
};

// Page type badge styles
const TYPE_STYLES = {
  'Blog': 'bg-blue-500/20 text-blue-400',
  'Product': 'bg-purple-500/20 text-purple-400',
  'Static': 'bg-slate-500/20 text-slate-300'
};

const GoogleIndexStatus = ({ isDarkMode }) => {
  // Stats
  const [stats, setStats] = useState({
    total: 0, indexed: 0, not_indexed: 0, submitted: 0, error: 0, unknown: 0
  });
  
  // URLs list
  const [urls, setUrls] = useState([]);
  const [totalUrls, setTotalUrls] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  
  // Filters
  const [activeTab, setActiveTab] = useState('all');
  const [pageTypeFilter, setPageTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounce, setSearchDebounce] = useState(null);
  
  // Loading states
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUrls, setLoadingUrls] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittingUrl, setSubmittingUrl] = useState(null);
  
  // Error and progress state
  const [lastError, setLastError] = useState(null);
  const [checkProgress, setCheckProgress] = useState(null); // { current, total, indexed, notIndexed, errors }
  const [submitProgress, setSubmitProgress] = useState(null); // { current, total, successful, failed }
  const checkCancelledRef = useRef(false); // Using ref for async loop

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const res = await fetch(`${API_URL}/api/admin/seo/index-status/stats`);
      const data = await res.json();
      if (!data.error) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch URLs list
  const fetchUrls = useCallback(async () => {
    try {
      setLoadingUrls(true);
      const params = new URLSearchParams();
      
      if (activeTab !== 'all') {
        params.append('status', activeTab);
      }
      if (pageTypeFilter !== 'all') {
        params.append('page_type', pageTypeFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      params.append('page', page);
      params.append('limit', limit);
      
      const res = await fetch(`${API_URL}/api/admin/seo/index-status/list?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setUrls(data.urls);
        setTotalUrls(data.total);
      }
    } catch (error) {
      console.error('Error fetching URLs:', error);
    } finally {
      setLoadingUrls(false);
    }
  }, [activeTab, pageTypeFilter, searchQuery, page, limit]);

  // Sync URLs
  const handleSyncUrls = async () => {
    try {
      setSyncing(true);
      setLastError(null);
      
      const res = await fetch(`${API_URL}/api/admin/seo/index-status/sync-urls`);
      
      // Read response body ONCE
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        const errorMsg = `Failed to parse response: ${parseError.message}`;
        setLastError(errorMsg);
        toast.error(errorMsg);
        return;
      }
      
      if (data.success) {
        setLastError(null); // Clear any previous errors on success
        toast.success(`Synced ${data.total_synced} URLs (${data.new_added} new)`);
        await fetchStats();
        await fetchUrls();
      } else {
        const errorMsg = data.detail || 'Sync failed';
        setLastError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = `Network error: ${error.message}`;
      setLastError(errorMsg);
      toast.error('Failed to sync URLs');
    } finally {
      setSyncing(false);
    }
  };

  // Check all with Google - Individual requests from frontend to prevent timeout
  const handleCheckAll = async () => {
    try {
      setChecking(true);
      setLastError(null);
      checkCancelledRef.current = false;
      
      // First, get all URLs that need checking (not indexed + unknown + error)
      const params = new URLSearchParams();
      params.append('limit', 200); // Get all URLs
      
      const listRes = await fetch(`${API_URL}/api/admin/seo/index-status/list?${params}`);
      if (!listRes.ok) {
        throw new Error(`Failed to fetch URLs: HTTP ${listRes.status}`);
      }
      
      const listData = await listRes.json();
      if (!listData.success || !listData.urls) {
        throw new Error('Failed to get URL list');
      }
      
      // Filter to URLs that need checking (exclude already indexed)
      const urlsToCheck = listData.urls.filter(u => 
        u.index_status !== 'Indexed' || !u.last_checked
      );
      
      const total = urlsToCheck.length;
      if (total === 0) {
        toast.info('No URLs need checking');
        setChecking(false);
        return;
      }
      
      setCheckProgress({ current: 0, total, indexed: 0, notIndexed: 0, errors: 0 });
      toast.info(`Checking ${total} URLs individually (1.5s delay between each)...`);
      
      let indexed = 0;
      let notIndexed = 0;
      let errors = 0;
      
      for (let i = 0; i < urlsToCheck.length; i++) {
        // Check if cancelled
        if (checkCancelledRef.current) {
          toast.info(`Check cancelled at ${i}/${total}`);
          break;
        }
        
        const item = urlsToCheck[i];
        const prerenderUrl = toPrerenderUrl(item.url);
        
        setCheckProgress({ current: i + 1, total, indexed, notIndexed, errors });
        
        try {
          const res = await fetch(`${API_URL}/api/admin/seo/index-status/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: [prerenderUrl] })
          });
          
          if (!res.ok) {
            errors++;
            console.warn(`Check failed for ${item.url}: HTTP ${res.status}`);
            continue;
          }
          
          const data = await res.json();
          
          if (data.success && data.results && data.results.length > 0) {
            const result = data.results[0];
            if (result.index_status === 'Indexed') {
              indexed++;
            } else if (result.index_status === 'Not Indexed') {
              notIndexed++;
            } else {
              errors++;
            }
          } else {
            errors++;
          }
        } catch (err) {
          errors++;
          console.warn(`Check error for ${item.url}:`, err.message);
        }
        
        setCheckProgress({ current: i + 1, total, indexed, notIndexed, errors });
        
        // 1.5 second delay between calls to respect Google API rate limits
        if (i < urlsToCheck.length - 1 && !checkCancelledRef.current) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
      
      // Final results
      if (errors > 0) {
        setLastError(`${errors} URLs had errors during check`);
        toast.warning(`Checked URLs: ${indexed} indexed, ${notIndexed} not indexed, ${errors} errors`);
      } else {
        setLastError(null);
        toast.success(`Checked ${total} URLs: ${indexed} indexed, ${notIndexed} not indexed`);
      }
      
      // Refresh data
      await fetchStats();
      await fetchUrls();
      
    } catch (error) {
      const errorMsg = `Network error: ${error.message}`;
      setLastError(errorMsg);
      toast.error('Failed to check index status');
      console.error('Check error:', error);
    } finally {
      setChecking(false);
      setCheckProgress(null);
      checkCancelledRef.current = false;
    }
  };

  // Cancel check operation
  const handleCancelCheck = () => {
    checkCancelledRef.current = true;
  };

  // Submit all unindexed - with progress tracking
  const handleSubmitAllUnindexed = async () => {
    try {
      setSubmitting(true);
      setLastError(null);
      
      // First, get all not indexed URLs
      const params = new URLSearchParams();
      params.append('status', 'Not Indexed');
      params.append('limit', 200);
      
      const listRes = await fetch(`${API_URL}/api/admin/seo/index-status/list?${params}`);
      
      // Read response body ONCE
      let listData;
      try {
        listData = await listRes.json();
      } catch (parseError) {
        const errorMsg = `Failed to parse response: ${parseError.message}`;
        setLastError(errorMsg);
        toast.error(errorMsg);
        setSubmitting(false);
        return;
      }
      
      if (!listData.success || !listData.urls || listData.urls.length === 0) {
        toast.info('No URLs to submit');
        setSubmitting(false);
        return;
      }
      
      const urlsToSubmit = listData.urls;
      const total = urlsToSubmit.length;
      setSubmitProgress({ current: 0, total, successful: 0, failed: 0 });
      toast.info(`Submitting ${total} URLs to Google... (1 second delay between each)`);
      
      let successful = 0;
      let failed = 0;
      const results = [];
      
      for (let i = 0; i < urlsToSubmit.length; i++) {
        const item = urlsToSubmit[i];
        const prerenderUrl = toPrerenderUrl(item.url);
        
        setSubmitProgress({ current: i + 1, total, successful, failed });
        
        try {
          const res = await fetch(`${API_URL}/api/admin/seo/index-status/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: [prerenderUrl] })
          });
          
          // Read response body ONCE
          let data;
          try {
            data = await res.json();
          } catch (parseErr) {
            failed++;
            results.push({ url: item.url, status: 'failed', error: `Parse error: ${parseErr.message}` });
            continue;
          }
          
          if (data.success && data.successful > 0) {
            successful++;
            results.push({ url: item.url, status: 'success' });
          } else {
            failed++;
            results.push({ url: item.url, status: 'failed', error: data.detail || 'Unknown error' });
          }
        } catch (err) {
          failed++;
          results.push({ url: item.url, status: 'failed', error: err.message });
        }
        
        setSubmitProgress({ current: i + 1, total, successful, failed });
        
        // 1 second delay between calls to avoid rate limits
        if (i < urlsToSubmit.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (failed > 0) {
        const firstError = results.find(r => r.status === 'failed')?.error || 'Unknown error';
        setLastError(`${failed} URLs failed to submit. First error: ${firstError}`);
        toast.warning(`Submitted ${successful}/${total} URLs. ${failed} failed.`);
      } else {
        setLastError(null); // Clear any previous errors on success
        toast.success(`Successfully submitted ${successful} URLs to Google!`);
      }
      
      await fetchStats();
      await fetchUrls();
      
    } catch (error) {
      const errorMsg = `Network error: ${error.message}`;
      setLastError(errorMsg);
      toast.error('Failed to submit URLs');
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
      setSubmitProgress(null);
    }
  };

  // Submit single URL
  const handleSubmitUrl = async (url) => {
    try {
      setSubmittingUrl(url);
      
      // Convert clean URL to prerender URL for Google (same as Submit All)
      const prerenderUrl = toPrerenderUrl(url);
      console.log(`[GoogleIndexStatus] Submitting single URL: ${url} -> ${prerenderUrl}`);
      
      const res = await fetch(`${API_URL}/api/admin/seo/index-status/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: [prerenderUrl] })
      });
      
      // Read response body ONCE
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        toast.error(`Failed to parse response: ${parseError.message}`);
        return;
      }
      
      if (res.ok && data.success && data.successful > 0) {
        toast.success('URL submitted for indexing');
        // Update local state to reflect the new status
        setUrls(prevUrls => prevUrls.map(item => 
          item.url === url ? { ...item, index_status: 'Submitted' } : item
        ));
        await fetchStats();
      } else {
        const errorMsg = data.detail || data.message || 'Failed to submit URL';
        toast.error(errorMsg);
        console.error('[GoogleIndexStatus] Submit error:', data);
      }
    } catch (error) {
      toast.error(`Network error: ${error.message}`);
      console.error('[GoogleIndexStatus] Submit error:', error);
    } finally {
      setSubmittingUrl(null);
    }
  };

  // Check single URL
  const handleCheckUrl = async (url) => {
    try {
      setSubmittingUrl(url);
      
      // Convert clean URL to prerender URL for Google
      const prerenderUrl = toPrerenderUrl(url);
      console.log(`[GoogleIndexStatus] Checking single URL: ${url} -> ${prerenderUrl}`);
      
      const res = await fetch(`${API_URL}/api/admin/seo/index-status/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: [prerenderUrl] })
      });
      
      // Read response body ONCE
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        toast.error(`Failed to parse response: ${parseError.message}`);
        return;
      }
      
      if (res.ok && data.success) {
        const result = data.results?.[0];
        if (result) {
          toast.info(`Status: ${result.index_status}`);
          // Update local state
          setUrls(prevUrls => prevUrls.map(item => 
            item.url === url ? { ...item, index_status: result.index_status, coverage_state: result.coverage_state, last_checked: new Date().toISOString() } : item
          ));
        }
        await fetchStats();
      } else {
        const errorMsg = data.detail || data.message || 'Failed to check URL';
        toast.error(errorMsg);
      }
    } catch (error) {
      toast.error(`Network error: ${error.message}`);
      console.error('[GoogleIndexStatus] Check error:', error);
    } finally {
      setSubmittingUrl(null);
    }
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        const statsRes = await fetch(`${API_URL}/api/admin/seo/index-status/stats`);
        
        // Read response body ONCE
        let statsData;
        try {
          statsData = await statsRes.json();
        } catch (parseError) {
          console.error('Failed to parse stats response:', parseError);
          setLoadingStats(false);
          return;
        }
        
        if (statsData.total === 0) {
          // Auto-sync if no URLs exist
          await handleSyncUrls();
        } else {
          setStats(statsData);
          await fetchUrls();
        }
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setLoadingStats(false);
      }
    };
    
    init();
  }, []);

  // Fetch URLs when filters change
  useEffect(() => {
    fetchUrls();
  }, [activeTab, pageTypeFilter, page]);

  // Debounced search
  useEffect(() => {
    if (searchDebounce) clearTimeout(searchDebounce);
    const timeout = setTimeout(() => {
      fetchUrls();
    }, 300);
    setSearchDebounce(timeout);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Format relative time
  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Never';
    
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Tab counts
  const tabCounts = {
    all: stats.total,
    'Not Indexed': stats.not_indexed,
    'Submitted': stats.submitted,
    'Indexed': stats.indexed,
    'Error': stats.error
  };

  return (
    <div className={`backdrop-blur-lg border rounded-2xl p-6 mb-6 ${
      isDarkMode 
        ? 'bg-[#1E293B] border-slate-700' 
        : 'bg-white border-gray-200 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-teal-400" />
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Google Index Status
          </h3>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSyncUrls}
            disabled={syncing}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
              isDarkMode 
                ? 'bg-[#1E293B] border-slate-600 text-slate-300 hover:bg-slate-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            } disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync URLs
          </button>
          
          <button
            onClick={handleCheckAll}
            disabled={checking || stats.total === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 transition-colors disabled:opacity-50"
          >
            {checking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Check All with Google
          </button>
          
          <button
            onClick={handleSubmitAllUnindexed}
            disabled={submitting || stats.not_indexed === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
            title={stats.not_indexed === 0 ? 'No URLs to submit' : `Submit ${stats.not_indexed} not indexed URLs`}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit All Not Indexed {stats.not_indexed > 0 && `(${stats.not_indexed})`}
          </button>
        </div>
      </div>

      {/* Progress indicator for long operations */}
      {(checking || submitting) && (
        <div className="mb-4 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
              <span className="text-sm text-teal-400">
                {checking && checkProgress
                  ? `Checking ${checkProgress.current}/${checkProgress.total} URLs... (${checkProgress.indexed} indexed, ${checkProgress.notIndexed} not indexed${checkProgress.errors > 0 ? `, ${checkProgress.errors} errors` : ''})` 
                  : checking
                  ? 'Starting check...'
                  : submitProgress 
                  ? `Submitting ${submitProgress.current}/${submitProgress.total} URLs... (${submitProgress.successful} success, ${submitProgress.failed} failed)`
                  : 'Submitting URLs to Google...'
                }
              </span>
            </div>
            {checking && (
              <button
                onClick={handleCancelCheck}
                className="px-3 py-1 text-xs font-medium text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
          <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-teal-500 rounded-full transition-all duration-300" 
              style={{ 
                width: checking && checkProgress
                  ? `${(checkProgress.current / checkProgress.total) * 100}%`
                  : submitProgress 
                  ? `${(submitProgress.current / submitProgress.total) * 100}%` 
                  : '10%',
                animation: (checkProgress || submitProgress) ? 'none' : 'pulse 2s infinite'
              }} 
            />
          </div>
        </div>
      )}

      {/* Error Alert Banner */}
      {lastError && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-400 font-medium">Error</p>
              <p className="text-xs text-red-400/80 mt-1 break-all">{lastError}</p>
            </div>
            <button 
              onClick={() => setLastError(null)} 
              className="text-red-400 hover:text-red-300 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {/* Indexed */}
        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>Indexed</span>
          </div>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
            {loadingStats ? '...' : stats.indexed}
          </p>
        </div>
        
        {/* Not Indexed */}
        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-amber-400" />
            <span className={`text-xs font-medium ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>Not Indexed</span>
          </div>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
            {loadingStats ? '...' : stats.not_indexed}
          </p>
        </div>
        
        {/* Submitted */}
        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className={`text-xs font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Submitted</span>
          </div>
          <p className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            {loadingStats ? '...' : stats.submitted}
          </p>
        </div>
        
        {/* Errors */}
        {stats.error > 0 && (
          <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className={`text-xs font-medium ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>Errors</span>
            </div>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
              {loadingStats ? '...' : stats.error}
            </p>
          </div>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {Object.entries(tabCounts).map(([tab, count]) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-teal-500/20 text-teal-400 border-b-2 border-teal-400'
                  : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab === 'all' ? 'All' : tab} ({count})
            </button>
          ))}
        </div>
        
        {/* Search & Type Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Filter URLs..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className={`pl-8 pr-3 py-1.5 w-40 rounded-lg text-xs border ${
                isDarkMode 
                  ? 'bg-[#0F172A] border-slate-600 text-white placeholder-slate-500' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          
          <select
            value={pageTypeFilter}
            onChange={(e) => { setPageTypeFilter(e.target.value); setPage(1); }}
            className={`px-2 py-1.5 rounded-lg text-xs border ${
              isDarkMode 
                ? 'bg-[#0F172A] border-slate-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">All Types</option>
            <option value="Blog">Blog</option>
            <option value="Product">Product</option>
            <option value="Static">Static</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar for Not Indexed */}
      {activeTab === 'Not Indexed' && stats.not_indexed > 0 && (
        <div className={`flex items-center justify-between p-3 rounded-lg mb-4 ${
          isDarkMode ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
        }`}>
          <span className={`text-sm font-medium ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
            {stats.not_indexed} pages not indexed
          </span>
          <button
            onClick={handleSubmitAllUnindexed}
            disabled={submitting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit All to Google
          </button>
        </div>
      )}

      {/* URL Table */}
      <div className={`rounded-xl overflow-hidden border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
        {loadingUrls ? (
          <div className="p-8 text-center">
            <Loader2 className={`w-6 h-6 animate-spin mx-auto mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Loading URLs...</p>
          </div>
        ) : urls.length === 0 ? (
          <div className="p-8 text-center">
            <Globe className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} />
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              No URLs found. Click "Sync URLs" to discover pages.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className={isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}>
                <tr className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                  <th className="text-left py-2.5 px-3 font-medium">URL Path</th>
                  <th className="text-left py-2.5 px-3 font-medium">Type</th>
                  <th className="text-left py-2.5 px-3 font-medium">Status</th>
                  <th className="text-left py-2.5 px-3 font-medium hidden md:table-cell">Coverage</th>
                  <th className="text-left py-2.5 px-3 font-medium hidden sm:table-cell">Checked</th>
                  <th className="text-right py-2.5 px-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {urls.map((item, idx) => (
                  <tr 
                    key={item.url}
                    className={`border-t transition-colors ${
                      isDarkMode 
                        ? `border-slate-700/50 ${idx % 2 === 0 ? 'bg-[#1E293B]' : 'bg-[#1E293B]/70'} hover:bg-slate-700/50` 
                        : `border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-gray-100`
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1 hover:text-teal-400 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
                        title={item.url}
                      >
                        <span className="truncate max-w-[200px]">{item.url_path}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />
                      </a>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${TYPE_STYLES[item.page_type] || TYPE_STYLES.Static}`}>
                        {item.page_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${STATUS_STYLES[item.index_status] || STATUS_STYLES.Unknown}`}>
                        {item.index_status}
                      </span>
                    </td>
                    <td className={`py-2.5 px-3 hidden md:table-cell ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                      <span className="truncate max-w-[150px] block" title={item.coverage_state}>
                        {item.coverage_state || '-'}
                      </span>
                    </td>
                    <td className={`py-2.5 px-3 hidden sm:table-cell ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                      {formatRelativeTime(item.last_checked)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {item.index_status === 'Indexed' ? (
                        <CheckCircle className="w-4 h-4 text-green-400 inline" />
                      ) : item.index_status === 'Submitted' ? (
                        <button
                          onClick={() => handleCheckUrl(item.url)}
                          disabled={submittingUrl === item.url}
                          data-testid={`recheck-btn-${item.url_path?.replace(/\//g, '-') || idx}`}
                          className={`px-2 py-1 rounded text-[10px] font-medium ${
                            isDarkMode ? 'bg-slate-600 text-slate-300 hover:bg-slate-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          } disabled:opacity-50`}
                        >
                          {submittingUrl === item.url ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Re-check'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSubmitUrl(item.url)}
                          disabled={submittingUrl === item.url}
                          data-testid={`submit-btn-${item.url_path?.replace(/\//g, '-') || idx}`}
                          className="px-2 py-1 rounded text-[10px] font-medium bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 disabled:opacity-50"
                        >
                          {submittingUrl === item.url ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Submit'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalUrls > limit && (
        <div className="flex items-center justify-between mt-4">
          <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, totalUrls)} of {totalUrls}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-3 py-1 rounded text-xs ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-700'} disabled:opacity-50`}
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * limit >= totalUrls}
              className={`px-3 py-1 rounded text-xs ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-700'} disabled:opacity-50`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleIndexStatus;
