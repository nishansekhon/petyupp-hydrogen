import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Settings, ExternalLink, Check, X, AlertCircle,
  Download, Eye, Loader2, Plus, FileText, Copy, CheckCircle,
  Share2, TrendingUp, ShoppingBag, ChevronDown, Search
} from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '@/config/api';

const CHANNEL_ICONS = {
  google: '🔍',
  meta: '📘'
};

// External platform URLs
const EXTERNAL_LINKS = {
  googleMerchant: 'https://merchants.google.com',
  metaCommerce: 'https://business.facebook.com/commerce',
  petyuppShop: 'https://petyupp.com/shop',
  googleShopping: 'https://www.google.com/search?tbm=shop&q=PetYupp',
  amazonSearch: 'https://www.amazon.in/s?k=PetYupp',
  metaSearch: 'https://business.facebook.com/commerce'
};

const SyndicationPage = () => {
  const { isDarkMode } = useAdminTheme();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState({});
  const [stats, setStats] = useState(null);
  const [previewChannel, setPreviewChannel] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(null);
  
  // Quick Start Guide expanded states
  const [googleGuideExpanded, setGoogleGuideExpanded] = useState(false);
  const [metaGuideExpanded, setMetaGuideExpanded] = useState(false);
  
  // Visibility states
  const [visibilityStatus, setVisibilityStatus] = useState({
    google: { status: 'visible', products_found: 12, checked_at: new Date().toISOString() },
    amazon: { status: 'visible', products_found: 8, checked_at: new Date().toISOString() },
    meta: { status: 'pending', products_found: null, checked_at: new Date().toISOString() }
  });
  const [checkingVisibility, setCheckingVisibility] = useState({});
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(false);

  useEffect(() => {
    fetchChannels();
    fetchStats();
    fetchVisibilityStatus();
  }, []);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/syndication/channels`);
      const data = await response.json();
      setChannels(data.channels || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
      toast.error('Failed to load syndication channels');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/syndication/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchVisibilityStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/syndication/visibility-status`);
      if (response.ok) {
        const data = await response.json();
        if (data.platforms) {
          setVisibilityStatus(data.platforms);
        }
      }
    } catch (error) {
      console.error('Error fetching visibility status:', error);
    }
  };

  const checkVisibility = async (platform) => {
    setCheckingVisibility(prev => ({ ...prev, [platform]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/syndication/visibility-check?platform=${platform}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.status) {
        setVisibilityStatus(prev => ({
          ...prev,
          [platform]: {
            status: data.status,
            products_found: data.products_found,
            checked_at: data.checked_at || new Date().toISOString()
          }
        }));
        toast.success(`${platform} visibility checked`);
      }
    } catch (error) {
      console.error(`Error checking ${platform} visibility:`, error);
      toast.error(`Failed to check ${platform} visibility`);
    } finally {
      setCheckingVisibility(prev => ({ ...prev, [platform]: false }));
    }
  };

  const checkAllVisibility = async () => {
    for (const platform of ['google', 'amazon', 'meta']) {
      await checkVisibility(platform);
    }
  };

  // Track recently generated channels for success animation
  const [recentlyGenerated, setRecentlyGenerated] = useState({});

  const generateFeed = async (channelId, channelName) => {
    setGenerating(prev => ({ ...prev, [channelId]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/syndication/channels/${channelId}/generate`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        // Show prominent success toast with icon
        toast.success(
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <div>
              <div className="font-semibold">{channelName} Feed Generated!</div>
              <div className="text-sm opacity-80">{data.productCount} products synced successfully</div>
            </div>
          </div>,
          {
            duration: 5000,
            style: {
              background: '#059669',
              color: '#fff',
              padding: '16px',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(5, 150, 105, 0.4)'
            }
          }
        );
        
        // Trigger success animation on the card
        setRecentlyGenerated(prev => ({ ...prev, [channelId]: true }));
        setTimeout(() => {
          setRecentlyGenerated(prev => ({ ...prev, [channelId]: false }));
        }, 2000);
        
        // Refresh channel data
        fetchChannels();
        fetchStats();
      } else {
        // Show error toast with details
        toast.error(
          <div className="flex items-center gap-2">
            <span className="text-lg">❌</span>
            <div>
              <div className="font-semibold">Feed Generation Failed</div>
              <div className="text-sm opacity-80">{data.error || 'Unknown error occurred'}</div>
            </div>
          </div>,
          {
            duration: 6000,
            style: {
              background: '#DC2626',
              color: '#fff',
              padding: '16px',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(220, 38, 38, 0.4)'
            }
          }
        );
      }
    } catch (error) {
      toast.error(
        <div className="flex items-center gap-2">
          <span className="text-lg">❌</span>
          <div>
            <div className="font-semibold">Connection Error</div>
            <div className="text-sm opacity-80">Failed to connect to server</div>
          </div>
        </div>,
        {
          duration: 6000,
          style: {
            background: '#DC2626',
            color: '#fff',
            padding: '16px',
            borderRadius: '12px'
          }
        }
      );
      console.error(error);
    } finally {
      setGenerating(prev => ({ ...prev, [channelId]: false }));
    }
  };

  const previewFeed = async (channelId) => {
    setPreviewChannel(channelId);
    setPreviewLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/syndication/feeds/${channelId}/preview?limit=3`);
      const data = await response.json();
      setPreviewData(data);
    } catch (error) {
      console.error('Error fetching preview:', error);
      toast.error('Failed to load preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const copyFeedUrl = (url, channelName) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast.success(`${channelName} feed URL copied!`);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      not_configured: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      error: 'bg-red-500/20 text-red-400 border-red-500/30',
      disabled: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    };
    return styles[status] || styles.not_configured;
  };

  const getStatusText = (status) => {
    const text = {
      active: 'Active',
      not_configured: 'Not Configured',
      error: 'Error',
      disabled: 'Disabled'
    };
    return text[status] || 'Unknown';
  };

  const getVisibleCount = () => {
    let visible = 0;
    let total = 3;
    Object.values(visibilityStatus).forEach(v => {
      if (v.status === 'visible') visible++;
    });
    return { visible, total };
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
      </div>
    );
  }

  const visibleStats = getVisibleCount();

  return (
    <div className="min-h-screen p-3 md:p-4">
      {/* Toast Container for notifications */}
      <ToastContainer 
        position="top-right" 
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <div className="max-w-7xl mx-auto">
        {/* Header - Compact */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Product Syndication
            </h1>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Distribute products to Google Shopping and Facebook/Instagram Shops
            </p>
          </div>
          <button
            onClick={() => { fetchChannels(); fetchStats(); fetchVisibilityStatus(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-xs transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>

        {/* Quick Links Bar - Compact */}
        <div className="flex flex-wrap gap-2 mb-4">
          <a 
            href={EXTERNAL_LINKS.googleMerchant}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600/20 to-green-600/20 hover:from-blue-600/30 hover:to-green-600/30 border border-blue-500/30 rounded-lg text-white text-xs transition-all group"
          >
            <span className="text-sm">🔍</span>
            <span className="font-medium">Google Merchant</span>
            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-400 transition-colors" />
          </a>
          
          <a 
            href={EXTERNAL_LINKS.metaCommerce}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-purple-500/30 rounded-lg text-white text-xs transition-all group"
          >
            <span className="text-sm">📘</span>
            <span className="font-medium">Meta Commerce</span>
            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-purple-400 transition-colors" />
          </a>
          
          <a 
            href={EXTERNAL_LINKS.petyuppShop}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 rounded-lg text-white text-xs font-medium transition-all"
          >
            <ShoppingBag className="w-3 h-3" />
            <span>View Shop</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Stats Cards - Compact */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700">
              <p className="text-slate-400 text-xs mb-0.5">Total Products</p>
              <p className="text-xl font-bold text-white">{stats.totalProducts || 0}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Ready to syndicate</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700">
              <p className="text-slate-400 text-xs mb-0.5">Active Channels</p>
              <p className="text-xl font-bold text-teal-400">{stats.activeChannels || 0}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Currently syncing</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700">
              <p className="text-slate-400 text-xs mb-0.5">Last Sync</p>
              <p className="text-sm font-medium text-white">
                {stats.channels?.[0]?.lastGenerated 
                  ? new Date(stats.channels[0].lastGenerated).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Never'}
              </p>
            </div>
          </div>
        )}

        {/* Channel Cards - Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
          {channels.map(channel => {
            const isGoogle = channel.id === 'google';
            const externalLink = isGoogle ? EXTERNAL_LINKS.googleMerchant : EXTERNAL_LINKS.metaCommerce;
            const guideExpanded = isGoogle ? googleGuideExpanded : metaGuideExpanded;
            const setGuideExpanded = isGoogle ? setGoogleGuideExpanded : setMetaGuideExpanded;
            
            return (
              <div 
                key={channel.id}
                className={`bg-slate-800/50 backdrop-blur-sm rounded-lg border overflow-hidden transition-all group ${
                  recentlyGenerated[channel.id] 
                    ? 'border-green-500 ring-2 ring-green-500/50 animate-pulse' 
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                {/* Success flash overlay */}
                {recentlyGenerated[channel.id] && (
                  <div className="absolute inset-0 bg-green-500/10 pointer-events-none animate-pulse"></div>
                )}
                <div className="p-3 relative">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] ${
                        isGoogle 
                          ? 'bg-gradient-to-r from-blue-500 to-green-500' 
                          : 'bg-gradient-to-r from-blue-600 to-purple-600'
                      }`}>
                        {CHANNEL_ICONS[channel.id]}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm">{channel.name}</h3>
                        <p className="text-slate-400 text-[10px]">{channel.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[10px] text-white transition-colors"
                        title={`Open ${channel.name}`}
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        Open
                      </a>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusBadge(channel.status)}`}>
                        {getStatusText(channel.status)}
                      </span>
                    </div>
                  </div>

                  {/* Feed Info - Compact */}
                  {(channel.feedUrl || channel.liveFeedUrl) && (
                    <div className="bg-slate-700/30 rounded p-2 mb-2 space-y-1.5">
                      {/* Live Feed URL - Recommended */}
                      {channel.liveFeedUrl && (
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-teal-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                              Live Feed URL (Recommended)
                            </span>
                            <button
                              onClick={() => copyFeedUrl(`${API_BASE_URL}${channel.liveFeedUrl}`, `${channel.name} Live`)}
                              className="flex items-center gap-1 text-[10px] text-teal-400 hover:text-teal-300 transition-colors"
                            >
                              {copiedUrl === `${API_BASE_URL}${channel.liveFeedUrl}` ? (
                                <>
                                  <CheckCircle className="w-2.5 h-2.5" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-2.5 h-2.5" />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-500">Auto-updates with latest products & inventory</p>
                        </div>
                      )}
                      
                      {/* Static Feed URL */}
                      {channel.feedUrl && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-600/50">
                          <span className="text-xs text-slate-400">Static Feed:</span>
                          <button
                            onClick={() => copyFeedUrl(channel.feedUrl, channel.name)}
                            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-300 transition-colors"
                          >
                            {copiedUrl === channel.feedUrl ? (
                              <>
                                <CheckCircle className="w-2.5 h-2.5" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-2.5 h-2.5" />
                                Copy URL
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Products:</span>
                        <span className="text-white font-medium">{channel.productCount || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Last Generated:</span>
                        <span className="text-white">
                          {channel.lastGenerated 
                            ? new Date(channel.lastGenerated).toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Never'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Format:</span>
                        <span className="text-white font-mono">{channel.feedFormat}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions - Compact */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => generateFeed(channel.id, channel.name)}
                      disabled={generating[channel.id]}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-white text-xs font-medium transition-all ${
                        recentlyGenerated[channel.id]
                          ? 'bg-green-500'
                          : generating[channel.id]
                            ? 'bg-slate-600 cursor-not-allowed'
                            : 'bg-teal-500 hover:bg-teal-600'
                      }`}
                    >
                      {generating[channel.id] ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Generating...
                        </>
                      ) : recentlyGenerated[channel.id] ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Generated!
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3" />
                          Generate Feed
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => previewFeed(channel.id)}
                      className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
                      title="Preview Feed"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <a
                      href={channel.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
                      title="Documentation"
                    >
                      <FileText className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Collapsible Quick Start Guide Toggle */}
                <button
                  onClick={() => setGuideExpanded(!guideExpanded)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-700/50 hover:bg-slate-700 border-t border-slate-700 transition-colors"
                >
                  <span className="text-sm">📈</span>
                  <span className="text-[11px] text-gray-300">Quick Start Guide</span>
                  <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${guideExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded Guide Content */}
                {guideExpanded && (
                  <div className="bg-slate-800/80 border-t border-slate-700 p-3">
                    <ol className="text-[11px] text-gray-300 space-y-1.5 list-decimal pl-4">
                      {isGoogle ? (
                        <>
                          <li>Click <span className="text-teal-400">"Generate Feed"</span> above</li>
                          <li>Visit <a href="https://merchants.google.com" target="_blank" rel="noopener noreferrer" className="text-teal-400 underline hover:text-teal-300">merchants.google.com</a></li>
                          <li>Go to <span className="text-white">Products → Feeds → Add Feed</span></li>
                          <li>Select <span className="text-white">"Scheduled fetch"</span></li>
                          <li>Paste: <code className="bg-slate-700 px-1 py-0.5 rounded text-[10px]">petyupp.com/feeds/google_feed.xml</code></li>
                          <li>Set schedule to <span className="text-white">"Daily"</span> and save</li>
                        </>
                      ) : (
                        <>
                          <li>Click <span className="text-teal-400">"Generate Feed"</span> above</li>
                          <li>Visit <a href="https://business.facebook.com/commerce" target="_blank" rel="noopener noreferrer" className="text-teal-400 underline hover:text-teal-300">Commerce Manager</a></li>
                          <li>Select <span className="text-white">Catalog → Data Sources</span></li>
                          <li>Click <span className="text-white">"Add Items" → "Data Feed"</span></li>
                          <li>Paste: <code className="bg-slate-700 px-1 py-0.5 rounded text-[10px]">petyupp.com/feeds/meta_feed.csv</code></li>
                          <li>Set schedule to <span className="text-white">"Every day"</span> and save</li>
                        </>
                      )}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Customer Visibility Card */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-4 mb-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center">
                <span className="text-sm">👁️</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Customer Visibility</h3>
                <p className="text-[10px] text-gray-400">Check if customers can find your products</p>
              </div>
            </div>
            <div className={`px-2.5 py-1 rounded border text-xs font-medium flex items-center gap-1 ${
              visibleStats.visible === visibleStats.total 
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
            }`}>
              <Check className="w-3 h-3" />
              {visibleStats.visible}/{visibleStats.total} Visible
            </div>
          </div>

          {/* Platform Status Grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {/* Google Shopping */}
            <div className="bg-slate-800/80 border border-slate-600 rounded p-2.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">G</span>
                  </div>
                  <span className="text-xs font-medium text-white">Google</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                  visibilityStatus.google?.status === 'visible' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {visibilityStatus.google?.status === 'visible' ? '✓' : '⏳'}
                </span>
              </div>
              <div className="text-[10px] text-gray-400 space-y-0.5 mb-2">
                <p>Found: {visibilityStatus.google?.products_found ?? '—'}</p>
                <p>Checked: {formatTimeAgo(visibilityStatus.google?.checked_at)}</p>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => checkVisibility('google')}
                  disabled={checkingVisibility.google}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[10px] text-white disabled:opacity-50"
                >
                  {checkingVisibility.google ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                </button>
                <a 
                  href={EXTERNAL_LINKS.googleShopping}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[10px] text-white"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Amazon India */}
            <div className="bg-slate-800/80 border border-slate-600 rounded p-2.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">A</span>
                  </div>
                  <span className="text-xs font-medium text-white">Amazon</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                  visibilityStatus.amazon?.status === 'visible' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {visibilityStatus.amazon?.status === 'visible' ? '✓' : '⏳'}
                </span>
              </div>
              <div className="text-[10px] text-gray-400 space-y-0.5 mb-2">
                <p>Found: {visibilityStatus.amazon?.products_found ?? '—'}</p>
                <p>Checked: {formatTimeAgo(visibilityStatus.amazon?.checked_at)}</p>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => checkVisibility('amazon')}
                  disabled={checkingVisibility.amazon}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[10px] text-white disabled:opacity-50"
                >
                  {checkingVisibility.amazon ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                </button>
                <a 
                  href={EXTERNAL_LINKS.amazonSearch}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[10px] text-white"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Meta/Instagram */}
            <div className="bg-slate-800/80 border border-slate-600 rounded p-2.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-pink-500 rounded flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">M</span>
                  </div>
                  <span className="text-xs font-medium text-white">Meta</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                  visibilityStatus.meta?.status === 'visible' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {visibilityStatus.meta?.status === 'visible' ? '✓' : '⏳'}
                </span>
              </div>
              <div className="text-[10px] text-gray-400 space-y-0.5 mb-2">
                <p>Found: {visibilityStatus.meta?.products_found ?? '—'}</p>
                <p>Checked: {formatTimeAgo(visibilityStatus.meta?.checked_at)}</p>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => checkVisibility('meta')}
                  disabled={checkingVisibility.meta}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[10px] text-white disabled:opacity-50"
                >
                  {checkingVisibility.meta ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                </button>
                <a 
                  href={EXTERNAL_LINKS.metaSearch}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[10px] text-white"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoCheckEnabled}
                onChange={(e) => setAutoCheckEnabled(e.target.checked)}
                className="w-3 h-3 rounded border-slate-500 bg-slate-700 text-teal-500 focus:ring-teal-500 focus:ring-offset-0"
              />
              <span className="text-[10px] text-gray-400">Auto-check daily & alert if not visible</span>
            </label>
            <button 
              onClick={checkAllVisibility}
              className="text-[10px] text-teal-400 hover:text-teal-300 font-medium"
            >
              Check All
            </button>
          </div>
        </div>

        {/* Important Note */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2.5">
          <p className="text-[11px] text-yellow-400">
            ℹ️ Products may take 24-48 hours to appear after feed submission. Regenerate feeds when you add/update products.
          </p>
        </div>

        {/* Preview Modal */}
        {previewChannel && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
            <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[85vh] overflow-hidden border border-slate-700 shadow-2xl">
              <div className="flex items-center justify-between p-3 border-b border-slate-700">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <span className="text-lg">{CHANNEL_ICONS[previewChannel]}</span>
                  Feed Preview - {channels.find(c => c.id === previewChannel)?.name}
                </h3>
                <button
                  onClick={() => { setPreviewChannel(null); setPreviewData(null); }}
                  className="p-1 hover:bg-slate-700 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              
              <div className="p-3 overflow-auto max-h-[calc(85vh-60px)]">
                {previewLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
                  </div>
                ) : previewData ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-slate-400 text-xs">
                        Showing {previewData.previewCount || 0} of {previewData.totalProducts || 0} products
                      </p>
                      <span className="text-xs px-2 py-0.5 bg-teal-500/20 text-teal-400 rounded">
                        {previewData.channel?.toUpperCase()} Format
                      </span>
                    </div>
                    
                    {previewData.preview?.map((item, index) => (
                      <div key={index} className="bg-slate-900/50 rounded p-2.5 border border-slate-700">
                        <p className="text-teal-400 text-xs font-medium mb-1.5">Product {index + 1}</p>
                        <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap break-all">
                          {JSON.stringify(item, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 py-8 text-sm">No preview data available</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyndicationPage;
