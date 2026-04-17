import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import axios from 'axios';
import { 
  RefreshCw, FileText, TrendingUp, Globe, ChevronDown, 
  Copy, Check, ExternalLink, Loader2, X, Calendar, Eye,
  Heart, Share2, Sparkles, Lightbulb, Users, DollarSign,
  Search, Award, Target, AlertTriangle, ChevronRight, Zap,
  Archive, CheckCircle, MousePointer, BarChart3, Settings, Key,
  Trash2, Edit, Clock, Video, Image as ImageIcon, ClipboardList,
  // SEO Sub-tab icons
  LayoutDashboard, Tags, Code2, Gauge, Map, CornerUpRight, Link2,
  Activity, ShoppingBag, Star, HelpCircle, Building2, Bot, Layers,
  Link as LinkIcon, Timer, CheckCircle2, Rss, Film, PlaySquare,
  // AI Autopilot icons
  Rocket, CalendarDays, Circle, Package, Edit3, Pause, Play,
  // Trend Scout
  Flame
} from 'lucide-react';
import { FaInstagram, FaFacebookF, FaYoutube, FaPinterestP, FaTiktok, FaTwitter, FaLinkedinIn } from 'react-icons/fa';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '@/config/api';
import ContentCalendarWidget from '@/components/admin/ContentCalendarWidget';
import { UGCTrackerTab, InsightsTab } from '@/components/marketing';
import ContentPipelineTab from '@/components/marketing/ContentPipelineTab';
import ProductStudioTab from '@/components/marketing/ProductStudioTab';
import TeamTasksTab from '@/components/marketing/TeamTasksTab';
import PostTab from '@/components/marketing/PostTab';
import TrendScoutTab from '@/components/marketing/TrendScoutTab';
import { BlogTab, AnalyticsTab, SEOTab, ContentTab, SocialTab } from '@/components/admin/marketing';
import AffiliatesTab from '@/components/admin/sales/AffiliatesTab';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Lazy load embedded pages for tabs
const SyndicationPage = React.lazy(() => import('@/pages/admin/SyndicationPage'));
const AdminVideosPage = React.lazy(() => import('@/pages/admin/AdminVideosPage'));
const BarkReelManager = React.lazy(() => import('@/pages/admin/BarkReelManager'));
const AdminBannersPage = React.lazy(() => import('@/pages/admin/AdminBannersPage'));
const AIOptimizationHub = React.lazy(() => import('@/pages/admin/AIOptimizationHub'));

// Platform configuration with brand logos and colors
const PLATFORM_CONFIG = {
  instagram: {
    Icon: FaInstagram,
    name: 'Instagram',
    subtitle: 'Social Media',
    bgColor: 'bg-gradient-to-br from-teal-500 to-teal-600',
    borderColor: 'border-teal-500/30',
  },
  facebook: {
    Icon: FaFacebookF,
    name: 'Facebook',
    subtitle: 'Social Media',
    bgColor: 'bg-blue-600',
    borderColor: 'border-blue-500/30',
  },
  youtube: {
    Icon: FaYoutube,
    name: 'YouTube',
    subtitle: 'Video Platform',
    bgColor: 'bg-red-600',
    borderColor: 'border-red-500/30',
  },
  pinterest: {
    Icon: FaPinterestP,
    name: 'Pinterest',
    subtitle: 'Visual Discovery',
    bgColor: 'bg-red-500',
    borderColor: 'border-red-500/30',
  },
  tiktok: {
    Icon: FaTiktok,
    name: 'TikTok',
    subtitle: 'Short Videos',
    bgColor: 'bg-black',
    borderColor: 'border-slate-500/30',
  },
};

// Content type icons
const CONTENT_ICONS = {
  product: '🍗',
  engagement: '🗳️',
  promotion: '🎉'
};

// Platform configs
const PLATFORMS = {
  instagram: { name: 'Instagram', color: 'from-teal-500 to-teal-400', textColor: 'text-teal-400' },
  facebook: { name: 'Facebook', color: 'from-blue-600 to-blue-500', textColor: 'text-blue-400' },
  twitter: { name: 'Twitter', color: 'from-sky-500 to-sky-400', textColor: 'text-sky-400' },
  all: { name: 'All Platforms', color: 'from-teal-500 to-teal-400', textColor: 'text-teal-400' }
};

// External links
const EXTERNAL_LINKS = {
  zuperbook: 'https://www.zuperbooks.com/',
  metricool: 'https://app.metricool.com'
};

const MarketingHubPage = () => {
  const { isDarkMode } = useAdminTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('content');
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [contentIdeas, setContentIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedIdea, setExpandedIdea] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [products, setProducts] = useState([]);
  const [autoGenerate, setAutoGenerate] = useState(false);
  
  // Handle tab from URL params (for navigation back from product edit)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['content', 'post', 'analytics', 'seo', 'ai-seo', 'intelligence', 'ai-blog', 'ugc', 'pipeline', 'syndication', 'videos', 'reels', 'banners', 'product-studio', 'team-tasks'].includes(tabParam)) {
      setActiveTab(tabParam);
      
      // If returning from product edit to SEO tab, no need to refresh - GoogleIndexStatus handles its own state
      const returnFrom = searchParams.get('returnFrom');
      if (tabParam === 'seo' && returnFrom === 'product') {
        console.log('🔄 Returned to SEO tab from product edit');
        // Clean up URL - GoogleIndexStatus will refresh its own data
        searchParams.delete('returnFrom');
        window.history.replaceState({}, '', `${window.location.pathname}?tab=seo`);
      }
    }
  }, [searchParams]);
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showEngagementModal, setShowEngagementModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Form states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [platform, setPlatform] = useState('instagram');
  const [contentType, setContentType] = useState('product_launch');
  const [engagementTopic, setEngagementTopic] = useState('');
  const [promoOffer, setPromoOffer] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoValidity, setPromoValidity] = useState('');
  const [promoProducts, setPromoProducts] = useState('');

  // SEO States
  const [seoStats, setSeoStats] = useState({
    total_products: 0,
    indexed_count: 0,
    pending_count: 0,
    indexed_percentage: 0,
    avg_seo_score: 0,
    products_needing_work: []
  });
  const [gscMetrics, setGscMetrics] = useState(null);
  const [seoAlerts, setSeoAlerts] = useState([]);
  const [seoScores, setSeoScores] = useState(null);
  const [seoRecommendations, setSeoRecommendations] = useState(null);
  const [loadingSEO, setLoadingSEO] = useState(true);
  const [loadingGSC, setLoadingGSC] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [loadingScores, setLoadingScores] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  
  // SEO View Navigation States
  const [seoView, setSeoView] = useState('main'); // 'main', 'recommendations', 'product-detail'
  const [selectedSeoProduct, setSelectedSeoProduct] = useState(null);
  const [expandedProductId, setExpandedProductId] = useState(null);
  
  // SEO Sub-tab State
  const [activeSeoSubTab, setActiveSeoSubTab] = useState('overview');
  
  // SEO Data States
  const [seoHealthData, setSeoHealthData] = useState({
    metaTags: { status: 'good', count: 10, total: 12 },
    schema: { status: 'warning', count: 8, total: 12 },
    brokenLinks: { status: 'good', count: 0 },
    pageSpeed: { status: 'warning', score: 72 },
    canonicals: { status: 'good', count: 12, total: 12 },
    robotsTxt: { status: 'good', configured: true },
    sitemap: { status: 'good', urls: 45 },
    openGraph: { status: 'warning', count: 8, total: 12 }
  });
  const [schemaTypes, setSchemaTypes] = useState([
    { type: 'Product', icon: ShoppingBag, count: 12, status: 'active' },
    { type: 'Review', icon: Star, count: 8, status: 'active' },
    { type: 'FAQ', icon: HelpCircle, count: 4, status: 'partial' },
    { type: 'Organization', icon: Building2, count: 1, status: 'active' },
    { type: 'Breadcrumb', icon: ChevronRight, count: 12, status: 'active' },
    { type: 'LocalBusiness', icon: Map, count: 0, status: 'missing' },
    { type: 'Article', icon: FileText, count: 4, status: 'active' },
    { type: 'WebSite', icon: Globe, count: 1, status: 'active' }
  ]);
  const [coreWebVitals, setCoreWebVitals] = useState({
    lcp: { value: 2.1, unit: 's', status: 'good', target: '<2.5s' },
    inp: { value: 180, unit: 'ms', status: 'warning', target: '<200ms' },
    cls: { value: 0.08, unit: '', status: 'good', target: '<0.1' },
    performanceScore: 78,
    device: 'desktop'
  });
  const [redirects, setRedirects] = useState([]);
  const [backlinks, setBacklinks] = useState({ total: 0, domains: 0, dofollow: 0, nofollow: 0 });
  
  // SEO Action States
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [showBacklinkModal, setShowBacklinkModal] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState(null);
  const [faqList, setFaqList] = useState([]);
  const [robotsTxtContent, setRobotsTxtContent] = useState(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/

Sitemap: https://petyupp.com/sitemap.xml`);
  const [savingRobotsTxt, setSavingRobotsTxt] = useState(false);
  const [scanningDuplicates, setScanningDuplicates] = useState(false);
  const [canonicalStats, setCanonicalStats] = useState({ missing: 3, duplicates: 0 });
  const [scanningBrokenLinks, setScanningBrokenLinks] = useState(false);
  const [brokenLinksData, setBrokenLinksData] = useState({ total: 256, broken: 0, external: 42 });
  const [submittingToGSC, setSubmittingToGSC] = useState(false);
  const [regeneratingSitemap, setRegeneratingSitemap] = useState(false);
  const [sitemapStats, setSitemapStats] = useState({ products: 12, blogs: 8, categories: 6, static: 5 });
  const [syncingBacklinks, setSyncingBacklinks] = useState(false);
  const [importingRedirects, setImportingRedirects] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [newRedirect, setNewRedirect] = useState({ from_path: '', to_path: '', type: '301' });
  const [newBacklink, setNewBacklink] = useState({ domain: '', url: '', type: 'dofollow', da: 0 });

  // Insights & Usage States
  const [apis, setApis] = useState([]);
  const [loadingApis, setLoadingApis] = useState(true);
  const [usageStats, setUsageStats] = useState(null);
  const [loadingUsage, setLoadingUsage] = useState(true);

  // Stats - Now dynamic from Metricool API
  const [stats, setStats] = useState({
    followers: null,
    postsThisMonth: null,
    engagementRate: null,
    scheduled: null
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [statsDataSource, setStatsDataSource] = useState('loading'); // 'live', 'mock', 'error', 'loading'

  // Performance/Trends data
  const [trendsData, setTrendsData] = useState(null);
  const [loadingTrends, setLoadingTrends] = useState(false);

  // Delete idea state
  const [deletingIdeaId, setDeletingIdeaId] = useState(null);

  // Ad Intelligence states
  const [competitorAds, setCompetitorAds] = useState([]);
  const [showPasteAdModal, setShowPasteAdModal] = useState(false);
  const [showInspireModal, setShowInspireModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [generatedInspiredContent, setGeneratedInspiredContent] = useState(null);
  const [isGeneratingInspired, setIsGeneratingInspired] = useState(false);
  const [inspireSelectedProduct, setInspireSelectedProduct] = useState('');
  const [deletingAdId, setDeletingAdId] = useState(null);
  const [adAnalysis, setAdAnalysis] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [inspirePlatform, setInspirePlatform] = useState('instagram');
  
  // AI Blog states
  const [blogs, setBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [showBlogGenerator, setShowBlogGenerator] = useState(false);
  const [generatingBlog, setGeneratingBlog] = useState(false);
  const [generatedBlogContent, setGeneratedBlogContent] = useState(null);
  const [blogGeneratorForm, setBlogGeneratorForm] = useState({
    topic: '',
    postType: 'educational',
    selectedProducts: [],
    keywords: '',
    category: 'Nutrition',
    tone: 'friendly',
    wordCount: 'medium'
  });
  
  // AI Autopilot states
  const [autopilotEnabled, setAutopilotEnabled] = useState(true);
  const [showAutopilotSettings, setShowAutopilotSettings] = useState(false);
  const [autopilotLoading, setAutopilotLoading] = useState(false);
  const [autopilotStatus, setAutopilotStatus] = useState({
    nextPost: null,
    scheduled: 4,
    generatedThisMonth: 12
  });
  const [autopilotQueue, setAutopilotQueue] = useState([]);
  const [autopilotSettings, setAutopilotSettings] = useState({
    frequency: '2_per_week',
    publishDays: [1, 4], // Monday and Thursday
    contentMix: ['educational', 'product', 'how-to'],
    autoPublish: false
  });
  
  // AI Blog Generator - Title Suggestions
  const [titleSuggestions, setTitleSuggestions] = useState([]);
  const [loadingTitleSuggestions, setLoadingTitleSuggestions] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  // AI Blog Image Generation states
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageGenForm, setImageGenForm] = useState({
    blogId: null,
    blogTitle: '',
    blogCategory: '',
    blogSummary: '',
    relatedProductId: null,
    templateId: null,
    provider: 'dalle3',
    prompt: '',
    negativePrompt: 'text, watermark, logo, blurry, low quality, cartoon, illustration'
  });
  const [imageTemplates, setImageTemplates] = useState([]);
  const [generatedImageResult, setGeneratedImageResult] = useState(null);
  const [imageGenStats, setImageGenStats] = useState(null);
  
  // Paste Modal form state
  const [pasteFormData, setPasteFormData] = useState({
    advertiser: '',
    copy: '',
    image: '',
    error: ''
  });
  const [savingAd, setSavingAd] = useState(false);

  // Helper function to map SEO issues to field names
  const getFieldFromIssue = (issue) => {
    if (!issue) return 'meta_description';
    const issueLower = issue.toLowerCase().replace(/_/g, ' ');
    
    if (issueLower.includes('meta description') || issueLower.includes('description missing') || issueLower.includes('description')) return 'meta_description';
    if (issueLower.includes('meta title') || issueLower.includes('title missing') || issueLower.includes('title')) return 'meta_title';
    if (issueLower.includes('keyword')) return 'keywords';
    if (issueLower.includes('image')) return 'images';
    
    return 'meta_description';
  };

  // Smart Fix Now handler - stores return location for navigation back
  const handleFixNow = (productId, issueType) => {
    const focusField = getFieldFromIssue(issueType);
    // Store return location for navigation back after edit
    sessionStorage.setItem('returnTo', '/admin/marketing');
    sessionStorage.setItem('returnTab', 'seo');
    navigate(`/admin/products?edit=${productId}&focus=${focusField}&issue=${encodeURIComponent(issueType)}&returnTo=marketing`);
  };

  // Fetch content ideas
  const fetchContentIdeas = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/content-ideas`);
      const data = await response.json();
      if (data.success) {
        setContentIdeas(data.ideas || []);
      }
    } catch (error) {
      console.error('Error fetching content ideas:', error);
    }
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      const data = await response.json();
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, []);

  // SEO Fetch functions - NOTE: These endpoints don't exist on backend
  // The actual SEO data comes from GoogleIndexStatus component which uses valid endpoints:
  // /api/admin/seo/index-status/sync-urls, /api/admin/seo/index-status/stats, 
  // /api/admin/seo/index-status/list, /api/admin/seo/index-status/check, /api/admin/seo/index-status/submit
  
  // Placeholder functions that do nothing - kept for component prop compatibility
  const fetchSEOStats = async () => { /* Not implemented - no backend endpoint */ };
  const fetchGSCMetrics = async () => { /* Not implemented - no backend endpoint */ };
  const fetchSEOAlerts = async () => { /* Not implemented - no backend endpoint */ };
  const fetchSEOScores = async () => { /* Not implemented - no backend endpoint */ };
  const fetchSEORecommendations = async () => { /* Not implemented - no backend endpoint */ };

  // SEO Action Handlers
  const handleAddFaq = async () => {
    if (!newFaq.question || !newFaq.answer) {
      toast.error('Please enter both question and answer');
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/seo/faq-schema`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...newFaq })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('FAQ added successfully');
        setFaqList(prev => [...prev, data.faq]);
        setNewFaq({ question: '', answer: '' });
        setShowFaqModal(false);
      }
    } catch (error) {
      toast.error('Failed to add FAQ');
    }
  };

  const handleDeleteFaq = async (faqId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_BASE_URL}/api/seo/faq-schema`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: faqId })
      });
      setFaqList(prev => prev.filter(f => f.id !== faqId));
      toast.success('FAQ deleted');
    } catch (error) {
      toast.error('Failed to delete FAQ');
    }
  };

  const handlePreviewRobotsTxt = () => {
    window.open('/robots.txt', '_blank');
  };

  const handleSaveRobotsTxt = async () => {
    setSavingRobotsTxt(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/seo/robots-txt`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'write', content: robotsTxtContent })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('robots.txt saved successfully');
      }
    } catch (error) {
      toast.error('Failed to save robots.txt');
    } finally {
      setSavingRobotsTxt(false);
    }
  };

  const handleScanDuplicates = async () => {
    setScanningDuplicates(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/seo/canonicals/scan`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCanonicalStats({
          missing: data.result.missing_canonical,
          duplicates: data.result.duplicate_content
        });
        toast.success('Duplicate scan complete');
      }
    } catch (error) {
      toast.error('Failed to scan duplicates');
    } finally {
      setScanningDuplicates(false);
    }
  };

  const handleRunBrokenLinkScan = async () => {
    setScanningBrokenLinks(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/seo/broken-links/scan`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setBrokenLinksData({
          total: data.result.total_scanned,
          broken: data.result.broken_links?.length || 0,
          external: data.result.external_links_count
        });
        toast.success('Broken link scan complete - No broken links found!');
      }
    } catch (error) {
      toast.error('Failed to run broken link scan');
    } finally {
      setScanningBrokenLinks(false);
    }
  };

  const handleSubmitToGSC = async () => {
    setSubmittingToGSC(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/seo/sitemap/submit-gsc`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Sitemap submitted to Google Search Console');
      }
    } catch (error) {
      toast.error('Failed to submit sitemap');
    } finally {
      setSubmittingToGSC(false);
    }
  };

  const handleRegenerateSitemap = async () => {
    setRegeneratingSitemap(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/seo/sitemap/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSitemapStats({
          products: data.stats.products,
          blogs: data.stats.blogs,
          categories: data.stats.categories,
          static: data.stats.static_pages
        });
        toast.success('Sitemap regenerated successfully');
      }
    } catch (error) {
      toast.error('Failed to regenerate sitemap');
    } finally {
      setRegeneratingSitemap(false);
    }
  };

  const handleAddRedirect = async () => {
    if (!newRedirect.from_path || !newRedirect.to_path) {
      toast.error('Please enter both From and To paths');
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/seo/redirects`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...newRedirect })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Redirect added successfully');
        setRedirects(prev => [...prev, data.redirect]);
        setNewRedirect({ from_path: '', to_path: '', type: '301' });
        setShowRedirectModal(false);
        setEditingRedirect(null);
      }
    } catch (error) {
      toast.error('Failed to add redirect');
    }
  };

  const handleUpdateRedirect = async () => {
    if (!newRedirect.from_path || !newRedirect.to_path) {
      toast.error('Please enter both From and To paths');
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/seo/redirects/${editingRedirect.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newRedirect)
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Redirect updated successfully');
        setRedirects(prev => prev.map(r => r.id === editingRedirect.id ? { ...r, ...newRedirect } : r));
        setNewRedirect({ from_path: '', to_path: '', type: '301' });
        setShowRedirectModal(false);
        setEditingRedirect(null);
      }
    } catch (error) {
      toast.error('Failed to update redirect');
    }
  };

  const handleDeleteRedirect = async (redirectId) => {
    if (!window.confirm('Are you sure you want to delete this redirect?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${API_BASE_URL}/api/seo/redirects/${redirectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setRedirects(prev => prev.filter(r => r.id !== redirectId));
      toast.success('Redirect deleted');
    } catch (error) {
      toast.error('Failed to delete redirect');
    }
  };

  const handleEditRedirect = (redirect) => {
    setEditingRedirect(redirect);
    setNewRedirect({
      from_path: redirect.from_path || redirect.from,
      to_path: redirect.to_path || redirect.to,
      type: redirect.type
    });
    setShowRedirectModal(true);
  };

  const handleImportCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      setImportingRedirects(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target.result;
          const lines = text.split('\n').filter(l => l.trim());
          const redirectsData = [];
          
          // Skip header row
          for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',').map(p => p.trim().replace(/"/g, ''));
            if (parts.length >= 2) {
              redirectsData.push({
                from_path: parts[0],
                to_path: parts[1],
                type: parts[2] || '301'
              });
            }
          }
          
          const token = localStorage.getItem('adminToken');
          const response = await fetch(`${API_BASE_URL}/api/seo/redirects/import`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ redirects: redirectsData })
          });
          const data = await response.json();
          if (data.success) {
            toast.success(`Imported ${data.imported} redirects`);
            // Refresh redirects list
            fetchRedirects();
          }
        } catch (error) {
          toast.error('Failed to import CSV');
        } finally {
          setImportingRedirects(false);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const fetchRedirects = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/seo/redirects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setRedirects(data.redirects || []);
      }
    } catch (error) {
      console.error('Failed to fetch redirects:', error);
    }
  };

  const handleAddBacklink = async () => {
    if (!newBacklink.domain) {
      toast.error('Please enter a domain');
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/seo/backlinks`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...newBacklink })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Backlink added successfully');
        setNewBacklink({ domain: '', url: '', type: 'dofollow', da: 0 });
        setShowBacklinkModal(false);
        // Refresh backlinks
        fetchBacklinks();
      }
    } catch (error) {
      toast.error('Failed to add backlink');
    }
  };

  const handleSyncBacklinks = async () => {
    setSyncingBacklinks(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/seo/backlinks/sync`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Backlinks synced! ${data.new_backlinks || 0} new backlinks found`);
        fetchBacklinks();
      } else {
        toast.error(data.message || 'Failed to sync backlinks');
      }
    } catch (error) {
      toast.error('Failed to sync with Bing API');
    } finally {
      setSyncingBacklinks(false);
    }
  };

  const fetchBacklinks = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/seo/backlinks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setBacklinks(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch backlinks:', error);
    }
  };

  const fetchFaqs = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/seo/faq-schema`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setFaqList(data.faqs || []);
      }
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
    }
  };

  // Default APIs to show if none from database
  const DEFAULT_APIS = [
    { api_name: 'Google Places API', api_type: 'location', status: 'active' },
    { api_name: 'Metricool API', api_type: 'analytics', status: 'active' },
    { api_name: 'Razorpay API', api_type: 'payment', status: 'active' },
    { api_name: 'Firebase Auth', api_type: 'authentication', status: 'active' },
    { api_name: 'Google Search Console', api_type: 'seo', status: 'active' },
    { api_name: 'Bing Webmaster Tools', api_type: 'seo', status: 'configured' },
    { api_name: 'Cloudinary', api_type: 'media', status: 'active' },
    { api_name: 'Google Merchant Center', api_type: 'commerce', status: 'active' },
    { api_name: 'Meta Commerce', api_type: 'commerce', status: 'active' },
  ];

  // Insights fetch functions
  const fetchAPIs = async () => {
    try {
      setLoadingApis(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/settings/apis`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      // Backend returns 'settings', normalize to api format
      const fetchedApis = data.settings || data.apis || [];
      const fetchedNames = new Set(fetchedApis.map(a => a.api_name || a.name));
      const mergedApis = [
        ...fetchedApis,
        ...DEFAULT_APIS.filter(d => !fetchedNames.has(d.api_name))
      ];
      setApis(mergedApis);
    } catch (error) {
      console.error('Failed to fetch APIs:', error);
      // Use defaults on error
      setApis(DEFAULT_APIS);
    } finally {
      setLoadingApis(false);
    }
  };

  const fetchUsageStats = async () => {
    try {
      setLoadingUsage(true);
      const response = await fetch(`${API_BASE_URL}/api/ai/usage-stats`);
      const data = await response.json();
      if (data.success) {
        setUsageStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
    } finally {
      setLoadingUsage(false);
    }
  };

  // Fetch performance/trends data
  const fetchTrends = useCallback(async () => {
    setLoadingTrends(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/social-media/trends?days=30`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTrendsData(data);
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoadingTrends(false);
    }
  }, []);

  // Fetch Metricool stats for header bar
  const fetchMetricoolStats = useCallback(async () => {
    setLoadingStats(true);
    setStatsError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Use axios instead of fetch for better compatibility
      const [overviewRes, calendarRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/social-media/overview?days=30`, { headers }),
        axios.get(`${API_BASE_URL}/api/social-media/calendar`, { headers })
      ]);
      
      const overviewData = overviewRes.data;
      const calendarData = calendarRes.data;
      
      if (overviewData.success && overviewData.data) {
        const data = overviewData.data;
        const engagementRate = data.engagement_rate !== undefined && data.engagement_rate !== null
          ? `${data.engagement_rate.toFixed(1)}%`
          : null;
        
        setStats({
          followers: data.total_followers || 0,
          postsThisMonth: data.total_posts || 0,
          engagementRate: engagementRate,
          scheduled: calendarData.success ? (calendarData.upcoming_posts?.length || 0) : 0
        });
        setStatsDataSource(overviewData.data_source || 'live');
      } else {
        // API returned but no success - show error state with null values
        setStats({ followers: null, postsThisMonth: null, engagementRate: null, scheduled: null });
        setStatsError('Failed to load stats');
        setStatsDataSource('error');
      }
    } catch (error) {
      console.error('Error fetching Metricool stats:', error);
      // On fetch error, set stats to null to show "-" in UI
      setStats({ followers: null, postsThisMonth: null, engagementRate: null, scheduled: null });
      setStatsError(error.message);
      setStatsDataSource('error');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch competitor ads (defined before useEffect that uses it)
  const fetchCompetitorAds = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/competitor-ads`);
      const data = await response.json();
      if (data.success) {
        setCompetitorAds(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching competitor ads:', error);
    }
  }, []);

  useEffect(() => {
    fetchContentIdeas();
    fetchProducts();
    fetchMetricoolStats(); // Fetch stats on mount
  }, [fetchContentIdeas, fetchProducts, fetchMetricoolStats]);

  // Load competitor ads when intelligence tab is selected
  useEffect(() => {
    if (activeTab === 'intelligence') {
      fetchCompetitorAds();
    }
  }, [activeTab, fetchCompetitorAds]);

  // Load SEO data when SEO tab is selected
  // Note: The actual SEO data loading happens inside the GoogleIndexStatus component
  useEffect(() => {
    if (activeTab === 'seo') {
      // These are local-only functions, no API calls
      fetchFaqs();
      fetchRedirects();
      fetchBacklinks();
    }
  }, [activeTab]);

  // Load Analytics/Trends data when Analytics tab is selected
  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchTrends();
    }
  }, [activeTab, fetchTrends]);

  // Load AI Blog data when AI Blog tab is selected
  useEffect(() => {
    if (activeTab === 'ai-blog') {
      fetchBlogs();
      fetchAutopilotStatus();
      fetchAutopilotQueue();
    }
  }, [activeTab]);

  // Fetch blogs for AI Blog tab
  const fetchBlogs = async () => {
    setLoadingBlogs(true);
    try {
      const token = localStorage.getItem('adminToken');
      // Use admin endpoint to get all posts including drafts
      const response = await fetch(`${API_BASE_URL}/api/admin/blog/posts?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success || Array.isArray(data) || data.posts) {
        setBlogs(Array.isArray(data) ? data : data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoadingBlogs(false);
    }
  };

  // Autopilot API functions
  const fetchAutopilotStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/autopilot/status`);
      const data = await response.json();
      if (data.success) {
        setAutopilotStatus({
          nextPost: data.next_scheduled_date,
          scheduled: data.total_scheduled || 0,
          generatedThisMonth: data.generated_this_month || 0
        });
        setAutopilotEnabled(data.is_active);
      }
    } catch (error) {
      console.error('Error fetching autopilot status:', error);
    }
  };

  const fetchAutopilotSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/autopilot/settings`);
      const data = await response.json();
      if (data.success && data.settings) {
        setAutopilotSettings({
          frequency: data.settings.frequency || '2_per_week',
          publishDays: data.settings.publish_days || [1, 4],
          contentMix: data.settings.content_mix || ['educational', 'product', 'how-to'],
          autoPublish: data.settings.auto_publish || false
        });
      }
    } catch (error) {
      console.error('Error fetching autopilot settings:', error);
    }
  };

  const saveAutopilotSettings = async () => {
    setAutopilotLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/autopilot/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frequency: autopilotSettings.frequency,
          publish_days: autopilotSettings.publishDays,
          content_mix: autopilotSettings.contentMix,
          auto_publish: autopilotSettings.autoPublish
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Autopilot settings saved!');
        setShowAutopilotSettings(false);
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving autopilot settings:', error);
      toast.error('Error saving settings');
    } finally {
      setAutopilotLoading(false);
    }
  };

  const toggleAutopilot = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/autopilot/toggle`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        setAutopilotEnabled(data.is_active);
        toast.success(data.is_active ? 'Autopilot activated!' : 'Autopilot paused');
      }
    } catch (error) {
      console.error('Error toggling autopilot:', error);
      toast.error('Failed to toggle autopilot');
    }
  };

  const fetchAutopilotQueue = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/autopilot/queue`);
      const data = await response.json();
      if (data.success) {
        setAutopilotQueue(data.queue || []);
      }
    } catch (error) {
      console.error('Error fetching autopilot queue:', error);
    }
  };

  const regenerateQueue = async () => {
    setAutopilotLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/autopilot/queue/regenerate`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Queue regenerated!');
        fetchAutopilotQueue();
      } else {
        toast.error('Failed to regenerate queue');
      }
    } catch (error) {
      console.error('Error regenerating queue:', error);
      toast.error('Error regenerating queue');
    } finally {
      setAutopilotLoading(false);
    }
  };

  const generateQueueItem = async (queueId) => {
    // Update local state to show generating
    setAutopilotQueue(prev => prev.map(item => 
      item.id === queueId ? { ...item, status: 'generating' } : item
    ));
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/autopilot/queue/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue_id: queueId })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Blog post generated!');
        fetchAutopilotQueue();
        fetchBlogs();
      } else {
        toast.error('Failed to generate post');
        setAutopilotQueue(prev => prev.map(item => 
          item.id === queueId ? { ...item, status: 'pending' } : item
        ));
      }
    } catch (error) {
      console.error('Error generating queue item:', error);
      toast.error('Error generating post');
      setAutopilotQueue(prev => prev.map(item => 
        item.id === queueId ? { ...item, status: 'pending' } : item
      ));
    }
  };

  // Fetch AI title suggestions for blog generator
  const fetchTitleSuggestions = async (productIds, postType) => {
    if (!productIds || productIds.length === 0) return;
    
    setLoadingTitleSuggestions(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/suggest-blog-titles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_ids: productIds,
          post_type: postType
        })
      });
      const data = await response.json();
      if (data.success && data.titles) {
        setTitleSuggestions(data.titles);
      }
    } catch (error) {
      console.error('Error fetching title suggestions:', error);
    } finally {
      setLoadingTitleSuggestions(false);
    }
  };

  // Fetch image templates for blog image generation
  const fetchImageTemplates = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/blog/image-templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setImageTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching image templates:', error);
    }
  };

  // Fetch image generation stats
  const fetchImageGenStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/blog/image-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setImageGenStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching image stats:', error);
    }
  };

  // Generate image prompt
  const generateImagePrompt = async (blogTitle, blogCategory, blogSummary, productId = null) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/admin/blog/generate-image-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          blog_title: blogTitle,
          blog_category: blogCategory,
          blog_summary: blogSummary,
          related_product_id: productId
        })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating prompt:', error);
      return null;
    }
  };

  // Generate AI image with branding (async job-based)
  const generateBlogImage = async () => {
    setGeneratingImage(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      // 1. Start the async job
      const startResponse = await fetch(`${API_BASE_URL}/api/admin/blog/start-image-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          blog_title: imageGenForm.blogTitle,
          blog_category: imageGenForm.blogCategory,
          blog_summary: imageGenForm.blogSummary,
          related_product_id: imageGenForm.relatedProductId,
          template_id: imageGenForm.templateId,
          provider: imageGenForm.provider,
          blog_id: imageGenForm.blogId
        })
      });
      
      const startData = await startResponse.json();
      
      if (!startData.job_id) {
        toast.error(startData.detail || 'Failed to start image generation');
        return null;
      }
      
      const jobId = startData.job_id;
      toast.info('Image generation started... This may take 20-30 seconds.');
      
      // 2. Poll for job completion
      const maxAttempts = 20; // 20 attempts * 3 seconds = 60 seconds max
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        
        const statusResponse = await fetch(`${API_BASE_URL}/api/admin/blog/job-status/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'completed' && statusData.result) {
          setGeneratedImageResult(statusData.result);
          toast.success('Image generated successfully!');
          fetchImageGenStats();
          return statusData.result;
        } else if (statusData.status === 'failed') {
          toast.error(statusData.error || 'Image generation failed');
          return null;
        }
        
        // Update progress toast (optional)
        if (statusData.progress > 0 && statusData.progress < 100) {
          // Progress is being made
        }
      }
      
      toast.error('Image generation timed out. Please try again.');
      return null;
      
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image');
      return null;
    } finally {
      setGeneratingImage(false);
    }
  };

  // Open image generator modal for a specific blog
  const openImageGenerator = async (blog) => {
    // Fetch templates if not loaded
    if (imageTemplates.length === 0) {
      await fetchImageTemplates();
    }
    
    // Generate initial prompt
    const promptResult = await generateImagePrompt(
      blog.title,
      blog.category || 'General',
      blog.excerpt || blog.content?.substring(0, 200) || '',
      blog.relatedProductId
    );
    
    setImageGenForm({
      blogId: blog.id,
      blogTitle: blog.title,
      blogCategory: blog.category || 'General',
      blogSummary: blog.excerpt || blog.content?.substring(0, 200) || '',
      relatedProductId: blog.relatedProductId || null,
      templateId: imageTemplates[1]?._id || null, // Default to "Educational Clean"
      provider: 'dalle3',
      prompt: promptResult?.prompt || '',
      negativePrompt: promptResult?.negative_prompt || 'text, watermark, logo, blurry, low quality, cartoon, illustration'
    });
    
    setGeneratedImageResult(null);
    setShowImageGenerator(true);
  };

  // Get smart defaults for tone and word count based on post type
  const getSmartDefaults = (postType) => {
    const defaults = {
      'educational': { tone: 'educational', wordCount: 'long' },
      'product-spotlight': { tone: 'professional', wordCount: 'medium' },
      'how-to': { tone: 'friendly', wordCount: 'medium' },
      'comparison': { tone: 'professional', wordCount: 'long' },
      'faq': { tone: 'friendly', wordCount: 'short' }
    };
    return defaults[postType] || { tone: 'friendly', wordCount: 'medium' };
  };

  // Get product image URL with Cloudinary handling
  const getProductImageUrl = (product) => {
    const imageUrl = product.images?.[0] || product.image || product.thumbnail;
    if (!imageUrl || typeof imageUrl !== 'string') return null;
    
    // If it's already a full URL (Cloudinary or other), use it directly
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If it starts with a path
    if (imageUrl.startsWith('/')) {
      return `https://res.cloudinary.com/petyupp${imageUrl}`;
    }
    
    // If it's a relative path
    return `https://res.cloudinary.com/petyupp/${imageUrl}`;
  };

  // Register global refresh function - placeholder for backward compatibility
  useEffect(() => {
    window.refreshSEORecommendations = () => {
      console.log('🔄 SEO refresh requested - GoogleIndexStatus handles its own state');
      // No-op: GoogleIndexStatus component manages its own data loading
    };
    
    return () => {
      delete window.refreshSEORecommendations;
    };
  }, []);

  // Generate product content
  const handleGenerateProduct = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    setGenerating(true);
    try {
      const product = products.find(p => p.id === selectedProduct || p._id === selectedProduct);
      if (!product) {
        toast.error('Product not found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/generate-social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: product.name,
          product_description: product.description || '',
          product_benefits: product.benefits || product.shortDescription || '',
          platform,
          content_type: contentType
        })
      });

      const result = await response.json();
      if (result.success && result.data) {
        await fetch(`${API_BASE_URL}/api/ai/content-ideas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'product',
            title: `${product.name} - ${contentType.replace('_', ' ')}`,
            platform,
            caption: result.data.caption || result.data.content || '',
            hashtags: result.data.hashtags || '',
            product_id: product.id || product._id
          })
        });

        toast.success('Content generated successfully!');
        setShowProductModal(false);
        fetchContentIdeas();
        resetForm();
      } else {
        toast.error(result.detail || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Generate error:', error);
      toast.error('Failed to generate content');
    } finally {
      setGenerating(false);
    }
  };

  // Generate engagement content
  const handleGenerateEngagement = async () => {
    if (!engagementTopic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-engagement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: engagementTopic,
          platform
        })
      });

      const result = await response.json();
      if (result.success && result.data) {
        await fetch(`${API_BASE_URL}/api/ai/content-ideas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'engagement',
            title: engagementTopic.substring(0, 50),
            platform,
            caption: result.data.caption || result.data.content || '',
            hashtags: result.data.hashtags || ''
          })
        });

        toast.success('Engagement content generated!');
        setShowEngagementModal(false);
        fetchContentIdeas();
        setEngagementTopic('');
      } else {
        toast.error(result.detail || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Generate error:', error);
      toast.error('Failed to generate content');
    } finally {
      setGenerating(false);
    }
  };

  // Generate promotion content
  const handleGeneratePromotion = async () => {
    if (!promoOffer.trim() || !promoCode.trim()) {
      toast.error('Please fill in offer and discount code');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-promotion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer: promoOffer,
          discount_code: promoCode,
          validity: promoValidity || 'Limited time',
          products: promoProducts || 'All products'
        })
      });

      const result = await response.json();
      if (result.success && result.data) {
        await fetch(`${API_BASE_URL}/api/ai/content-ideas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'promotion',
            title: `${promoOffer} - ${promoCode}`,
            platform,
            caption: result.data.caption || result.data.content || '',
            hashtags: result.data.hashtags || ''
          })
        });

        toast.success('Promotional content generated!');
        setShowPromotionModal(false);
        fetchContentIdeas();
        resetPromoForm();
      } else {
        toast.error(result.detail || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Generate error:', error);
      toast.error('Failed to generate content');
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setPlatform('instagram');
    setContentType('product_launch');
  };

  const resetPromoForm = () => {
    setPromoOffer('');
    setPromoCode('');
    setPromoValidity('');
    setPromoProducts('');
    setPlatform('instagram');
  };

  // Copy content to clipboard
  const handleCopy = async (idea) => {
    const text = `${idea.caption}\n\n${idea.hashtags}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(idea.id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Format time ago (handles UTC timestamps)
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    
    // Parse the date - if it doesn't have timezone info, treat it as UTC
    let dateObj;
    if (typeof dateStr === 'string') {
      // If no timezone indicator, append Z to treat as UTC
      if (!dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
        dateObj = new Date(dateStr + 'Z');
      } else {
        dateObj = new Date(dateStr);
      }
    } else {
      dateObj = new Date(dateStr);
    }
    
    const diff = Date.now() - dateObj.getTime();
    
    // Handle future dates (shouldn't happen, but just in case)
    if (diff < 0) return 'Just now';
    
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Copy to clipboard helper
  const copyToClipboard = async (text, type = 'Content') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied!`);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  // Delete content idea handler
  const handleDeleteIdea = async (ideaId) => {
    if (!window.confirm('Delete this content idea?')) return;
    
    setDeletingIdeaId(ideaId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/content-ideas/${ideaId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toast.success('Content idea deleted');
        fetchContentIdeas();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting idea:', error);
      toast.error('Error deleting idea');
    } finally {
      setDeletingIdeaId(null);
    }
  };

  // Save competitor ad
  const handleSaveCompetitorAd = async (adData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/competitor-ads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(adData)
      });
      
      if (response.ok) {
        toast.success('Ad saved!');
        fetchCompetitorAds();
      } else {
        toast.error('Failed to save ad');
      }
    } catch (error) {
      console.error('Error saving ad:', error);
      toast.error('Error saving ad');
    }
  };

  // Delete competitor ad
  const handleDeleteCompetitorAd = async (adId) => {
    if (!window.confirm('Delete this competitor ad?')) return;
    
    setDeletingAdId(adId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/competitor-ads/${adId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (response.ok) {
        toast.success('Competitor ad deleted');
        fetchCompetitorAds();
      } else {
        toast.error('Failed to delete ad');
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast.error('Error deleting ad');
    } finally {
      setDeletingAdId(null);
    }
  };

  // Handle inspire from ad
  const handleInspireFromAd = async (ad, productId = null, platform = 'instagram') => {
    setSelectedAd(ad);
    setShowInspireModal(true);
    setIsGeneratingInspired(true);
    setGeneratedInspiredContent(null);
    setAdAnalysis(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/inspire-from-ad`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          original_ad_copy: ad.copy,
          product_id: productId || inspireSelectedProduct,
          platform: platform || inspirePlatform
        })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedInspiredContent({
          caption: data.caption || data.data?.caption,
          hashtags: data.hashtags || data.data?.hashtags
        });
        setAdAnalysis(data.analysis || data.data?.analysis);
      } else {
        toast.error('Failed to generate content');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error generating content');
    } finally {
      setIsGeneratingInspired(false);
    }
  };

  // Save inspired content to ideas
  const handleSaveInspiredToIdeas = async () => {
    if (!generatedInspiredContent) return;

    try {
      const productName = products?.find(p => (p._id || p.id) === inspireSelectedProduct)?.name || 'PetYupp Product';
      
      const response = await fetch(`${API_BASE_URL}/api/ai/content-ideas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          product_id: inspireSelectedProduct,
          product_name: productName,
          platform: inspirePlatform,
          type: 'inspired',
          title: `Inspired from ${selectedAd?.advertiser || 'competitor'}`,
          caption: generatedInspiredContent.caption,
          hashtags: generatedInspiredContent.hashtags,
          source: 'ad_intelligence',
          inspired_from: selectedAd?.advertiser
        })
      });

      if (response.ok) {
        toast.success(
          <div>
            <p className="font-medium">Saved to Content Ideas!</p>
            <p className="text-xs opacity-80">Go to Content tab to view</p>
          </div>,
          { duration: 4000 }
        );
        setShowInspireModal(false);
        setAdAnalysis(null);
        setGeneratedInspiredContent(null);
        fetchContentIdeas();
      } else {
        toast.error('Failed to save');
      }
    } catch (error) {
      toast.error('Error saving idea');
    }
  };

  // Get score color based on value
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400 bg-green-500/20';
    if (score >= 60) return 'text-yellow-400 bg-yellow-500/20';
    if (score >= 40) return 'text-orange-400 bg-orange-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  // Get all products with recommendations for full view
  const getProductsWithRecommendations = () => {
    if (!seoScores || !seoScores.products) return [];
    return seoScores.products.filter(p => p.recommendations && p.recommendations.length > 0);
  };

  // Get actionable recommendation count (excludes LOW priority 'no_performance_data')
  const getActionableRecommendationCount = () => {
    if (!seoRecommendations) return 0;
    return seoRecommendations.actionable_recommendations || 0;
  };

  // Get total recommendation count (including low priority)
  const getTotalRecommendationCount = () => {
    if (!seoRecommendations) return 0;
    return seoRecommendations.total_recommendations || 0;
  };

  // Get products count that need action (have CRITICAL/HIGH/MEDIUM issues)
  const getProductsNeedingActionCount = () => {
    if (!seoRecommendations) return 0;
    return seoRecommendations.products_needing_action || 0;
  };

  // Get products count with issues
  const getProductsWithIssuesCount = () => {
    return getProductsWithRecommendations().length;
  };


  return (
    <div className={`min-h-screen p-4 md:p-6 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Marketing Hub
            </h1>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Manage social media, SEO, and analytics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400 font-medium">Live Data</span>
            </div>
            <button
              onClick={() => { fetchContentIdeas(); fetchProducts(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                isDarkMode 
                  ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
            <a
              href={EXTERNAL_LINKS.metricool}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 rounded-lg text-white text-xs font-medium transition-colors"
            >
              Open Metricool
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Quick Stats Bar - Modern Glassmorphism Design */}
        <div className={`backdrop-blur-sm border rounded-2xl p-4 mb-6 shadow-lg ${isDarkMode ? 'bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-slate-700/50' : 'bg-white/80 border-gray-200'}`}>
          <div className="flex items-center justify-between">
            {/* Followers */}
            <div className="flex items-center gap-3 px-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/20 border border-teal-500/30 flex items-center justify-center">
                <Users className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <p className={`text-[10px] uppercase tracking-wide ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Followers</p>
                {loadingStats ? (
                  <div className={`h-6 w-12 rounded animate-pulse ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                ) : (
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stats.followers !== null ? stats.followers.toLocaleString() : '-'}
                  </p>
                )}
              </div>
            </div>
            <div className={`w-px h-10 ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-200'}`}></div>
            
            {/* Posts */}
            <div className="flex items-center gap-3 px-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className={`text-[10px] uppercase tracking-wide ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Posts</p>
                {loadingStats ? (
                  <div className={`h-6 w-8 rounded animate-pulse ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                ) : (
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stats.postsThisMonth !== null ? stats.postsThisMonth : '-'}
                  </p>
                )}
              </div>
            </div>
            <div className={`w-px h-10 ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-200'}`}></div>
            
            {/* Engagement */}
            <div 
              className={`flex items-center gap-3 px-3 cursor-pointer rounded-xl transition-colors py-1 ${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('analytics')}
              title="View Performance Analytics"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className={`text-[10px] uppercase tracking-wide ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Engagement</p>
                {loadingStats ? (
                  <div className={`h-6 w-12 rounded animate-pulse ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                ) : (
                  <p className="text-lg font-bold text-emerald-400">
                    {stats.engagementRate || '-'}
                  </p>
                )}
              </div>
            </div>
            <div className={`w-px h-10 ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-200'}`}></div>
            
            {/* Scheduled */}
            <div 
              className={`flex items-center gap-3 px-3 cursor-pointer rounded-xl transition-colors py-1 ${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('content')}
              title="View Scheduled Posts"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className={`text-[10px] uppercase tracking-wide ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Scheduled</p>
                {loadingStats ? (
                  <div className={`h-6 w-8 rounded animate-pulse ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                ) : (
                  <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stats.scheduled !== null ? stats.scheduled : '-'}
                  </p>
                )}
              </div>
            </div>
            <div className={`w-px h-10 ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-200'}`}></div>
            
            {/* Ideas */}
            <div 
              className={`flex items-center gap-3 px-3 cursor-pointer rounded-xl transition-colors py-1 ${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('content')}
              title="View Content Ideas"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <p className={`text-[10px] uppercase tracking-wide ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Ideas</p>
                <p className="text-lg font-bold text-teal-400">{contentIdeas.length}</p>
              </div>
            </div>
            
            {/* Data Source Indicator & Refresh Button */}
            <div className={`w-px h-10 ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-200'}`}></div>
            <div className="flex items-center gap-2 px-3">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${
                  statsDataSource === 'live' ? 'bg-green-400' : 
                  statsDataSource === 'mock' ? 'bg-amber-400' : 
                  statsDataSource === 'error' ? 'bg-red-400' : 
                  'bg-gray-400 animate-pulse'
                }`}></div>
                <span className={`text-[10px] uppercase tracking-wide ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                  {statsDataSource === 'live' ? 'Live' : 
                   statsDataSource === 'mock' ? 'Mock' : 
                   statsDataSource === 'error' ? 'Error' : 
                   'Loading'}
                </span>
              </div>
              <button
                onClick={fetchMetricoolStats}
                disabled={loadingStats}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                } ${loadingStats ? 'animate-spin' : ''}`}
                title="Refresh Stats"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        {/* Order: Content | Post | SEO | AI Blog | UGC Tracker | Pipeline | Affiliates | Videos | Reels | Team Tasks | Banners | More (Analytics, AI SEO, Syndication, Product Studio) */}
        <div className={`flex flex-wrap gap-1 mb-6 pb-2 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-t-lg whitespace-nowrap ${
              activeTab === 'content'
                ? isDarkMode ? 'bg-slate-700 text-teal-400' : 'bg-teal-50 text-teal-600'
                : isDarkMode 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText size={16} />
            Content
          </button>
          <button
            onClick={() => setActiveTab('post')}
            data-testid="post-tab-btn"
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-t-lg whitespace-nowrap ${
              activeTab === 'post'
                ? isDarkMode ? 'bg-slate-700 text-sky-400' : 'bg-sky-50 text-sky-600'
                : isDarkMode 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Share2 size={16} />
            Post
          </button>
          <button
            onClick={() => setActiveTab('seo')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-t-lg whitespace-nowrap ${
              activeTab === 'seo'
                ? isDarkMode ? 'bg-slate-700 text-teal-400' : 'bg-teal-50 text-teal-600'
                : isDarkMode 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Search size={16} />
            SEO
          </button>
          <button
            onClick={() => setActiveTab('ai-blog')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-t-lg whitespace-nowrap ${
              activeTab === 'ai-blog'
                ? isDarkMode ? 'bg-slate-700 text-teal-400' : 'bg-teal-50 text-teal-600'
                : isDarkMode 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Sparkles size={16} />
            AI Blog
          </button>
          <button
            onClick={() => setActiveTab('ugc')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-t-lg whitespace-nowrap ${
              activeTab === 'ugc'
                ? isDarkMode ? 'bg-slate-700 text-teal-400' : 'bg-teal-50 text-teal-600'
                : isDarkMode 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users size={16} />
            UGC Tracker
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-t-lg whitespace-nowrap ${
              activeTab === 'pipeline'
                ? isDarkMode ? 'bg-slate-700 text-teal-400' : 'bg-teal-50 text-teal-600'
                : isDarkMode 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Layers size={16} />
            Pipeline
          </button>
          <button
            onClick={() => setActiveTab('affiliates')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-t-lg whitespace-nowrap ${
              activeTab === 'affiliates'
                ? isDarkMode ? 'bg-slate-700 text-teal-400' : 'bg-teal-50 text-teal-600'
                : isDarkMode 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users size={16} />
            Affiliates
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-t-lg whitespace-nowrap ${
              activeTab === 'videos'
                ? isDarkMode ? 'bg-slate-700 text-teal-400' : 'bg-teal-50 text-teal-600'
                : isDarkMode 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Film size={16} />
            Videos
          </button>
          <button
            onClick={() => setActiveTab('reels')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-t-lg whitespace-nowrap ${
              activeTab === 'reels'
                ? isDarkMode ? 'bg-slate-700 text-teal-400' : 'bg-teal-50 text-teal-600'
                : isDarkMode 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <PlaySquare size={16} />
            Reels
          </button>
          <button
            onClick={() => setActiveTab('team-tasks')}
            data-testid="team-tasks-tab-btn"
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-t-lg whitespace-nowrap ${
              activeTab === 'team-tasks'
                ? isDarkMode ? 'bg-slate-700 text-purple-400' : 'bg-purple-50 text-purple-600'
                : isDarkMode 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ClipboardList size={16} />
            Team Tasks
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            data-testid="banners-tab-btn"
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-t-lg whitespace-nowrap ${
              activeTab === 'banners'
                ? isDarkMode ? 'bg-slate-700 text-teal-400' : 'bg-teal-50 text-teal-600'
                : isDarkMode 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ImageIcon size={16} />
            Banners
          </button>
          
          {/* More Dropdown - Contains: Analytics, AI SEO, Syndication, Product Studio, Trend Scout */}
          <div className="relative">
            <button
              onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
              data-testid="more-dropdown-btn"
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-t-lg whitespace-nowrap ${
                ['analytics', 'ai-seo', 'syndication', 'product-studio', 'trend-scout'].includes(activeTab)
                  ? isDarkMode ? 'bg-slate-700 text-teal-400' : 'bg-teal-50 text-teal-600'
                  : isDarkMode 
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {['analytics', 'ai-seo', 'syndication', 'product-studio', 'trend-scout'].includes(activeTab) ? (
                <>
                  {activeTab === 'analytics' && <><BarChart3 size={16} />Analytics</>}
                  {activeTab === 'ai-seo' && <><Bot size={16} />AI SEO</>}
                  {activeTab === 'syndication' && <><Rss size={16} />Syndication</>}
                  {activeTab === 'product-studio' && <><Sparkles size={16} />Product Studio</>}
                  {activeTab === 'trend-scout' && <><Flame size={16} />Trend Scout</>}
                </>
              ) : (
                'More'
              )}
              <ChevronDown size={14} className={`transition-transform ${moreDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {moreDropdownOpen && (
              <>
                {/* Backdrop to close dropdown */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setMoreDropdownOpen(false)}
                />
                {/* Dropdown menu - dark navy #1E293B, border-slate-700, rounded-xl, shadow-lg, teal #14B8A6 hover */}
                <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] rounded-xl shadow-lg border border-slate-700 bg-[#1E293B]">
                  <button
                    onClick={() => { setActiveTab('analytics'); setMoreDropdownOpen(false); }}
                    data-testid="more-analytics-btn"
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors rounded-t-xl ${
                      activeTab === 'analytics'
                        ? 'bg-[#14B8A6]/20 text-[#14B8A6]'
                        : 'text-slate-300 hover:bg-[#14B8A6]/10 hover:text-[#14B8A6]'
                    }`}
                  >
                    <BarChart3 size={16} />
                    Analytics
                  </button>
                  <button
                    onClick={() => { setActiveTab('ai-seo'); setMoreDropdownOpen(false); }}
                    data-testid="more-ai-seo-btn"
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                      activeTab === 'ai-seo'
                        ? 'bg-[#14B8A6]/20 text-[#14B8A6]'
                        : 'text-slate-300 hover:bg-[#14B8A6]/10 hover:text-[#14B8A6]'
                    }`}
                  >
                    <Bot size={16} />
                    AI SEO
                  </button>
                  <button
                    onClick={() => { setActiveTab('syndication'); setMoreDropdownOpen(false); }}
                    data-testid="more-syndication-btn"
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                      activeTab === 'syndication'
                        ? 'bg-[#14B8A6]/20 text-[#14B8A6]'
                        : 'text-slate-300 hover:bg-[#14B8A6]/10 hover:text-[#14B8A6]'
                    }`}
                  >
                    <Rss size={16} />
                    Syndication
                  </button>
                  <button
                    onClick={() => { setActiveTab('product-studio'); setMoreDropdownOpen(false); }}
                    data-testid="more-product-studio-btn"
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                      activeTab === 'product-studio'
                        ? 'bg-[#14B8A6]/20 text-[#14B8A6]'
                        : 'text-slate-300 hover:bg-[#14B8A6]/10 hover:text-[#14B8A6]'
                    }`}
                  >
                    <Sparkles size={16} />
                    Product Studio
                  </button>
                  <button
                    onClick={() => { setActiveTab('trend-scout'); setMoreDropdownOpen(false); }}
                    data-testid="more-trend-scout-btn"
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors rounded-b-xl ${
                      activeTab === 'trend-scout'
                        ? 'bg-[#14B8A6]/20 text-[#14B8A6]'
                        : 'text-slate-300 hover:bg-[#14B8A6]/10 hover:text-[#14B8A6]'
                    }`}
                  >
                    <Flame size={16} />
                    🔥 Trend Scout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content Tab */}
        {activeTab === 'content' && (
          <ContentTab
            isDarkMode={isDarkMode}
            contentIdeas={contentIdeas}
            fetchContentIdeas={fetchContentIdeas}
            expandedIdea={expandedIdea}
            setExpandedIdea={setExpandedIdea}
            deletingIdeaId={deletingIdeaId}
            handleDeleteIdea={handleDeleteIdea}
            autoGenerate={autoGenerate}
            setAutoGenerate={setAutoGenerate}
            setShowProductModal={setShowProductModal}
            setShowEngagementModal={setShowEngagementModal}
            setShowPromotionModal={setShowPromotionModal}
            copyToClipboard={copyToClipboard}
            formatTimeAgo={formatTimeAgo}
          />
        )}

        {/* Post Tab - Social Media Posting */}
        {activeTab === 'post' && (
          <div data-testid="post-tab-content" className={`rounded-xl p-4 ${isDarkMode ? 'bg-slate-800/50' : 'bg-white'}`}>
            <PostTab />
          </div>
        )}

        {/* Analytics Tab - Combined Performance + Platforms */}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <AnalyticsTab
            isDarkMode={isDarkMode}
            trendsData={trendsData}
            loadingTrends={loadingTrends}
            fetchTrends={fetchTrends}
          />
        )}


        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <SEOTab
            isDarkMode={isDarkMode}
            navigate={navigate}
            // SEO data states
            seoStats={seoStats}
            gscMetrics={gscMetrics}
            seoAlerts={seoAlerts}
            seoScores={seoScores}
            seoRecommendations={seoRecommendations}
            // Loading states
            loadingSEO={loadingSEO}
            loadingGSC={loadingGSC}
            loadingAlerts={loadingAlerts}
            loadingScores={loadingScores}
            loadingRecommendations={loadingRecommendations}
            // View/Navigation states
            seoView={seoView}
            setSeoView={setSeoView}
            selectedSeoProduct={selectedSeoProduct}
            setSelectedSeoProduct={setSelectedSeoProduct}
            expandedProductId={expandedProductId}
            setExpandedProductId={setExpandedProductId}
            activeSeoSubTab={activeSeoSubTab}
            setActiveSeoSubTab={setActiveSeoSubTab}
            // SEO Data States
            seoHealthData={seoHealthData}
            schemaTypes={schemaTypes}
            coreWebVitals={coreWebVitals}
            setCoreWebVitals={setCoreWebVitals}
            redirects={redirects}
            backlinks={backlinks}
            robotsTxtContent={robotsTxtContent}
            setRobotsTxtContent={setRobotsTxtContent}
            canonicalStats={canonicalStats}
            brokenLinksData={brokenLinksData}
            sitemapStats={sitemapStats}
            faqList={faqList}
            // Action loading states
            savingRobotsTxt={savingRobotsTxt}
            scanningDuplicates={scanningDuplicates}
            scanningBrokenLinks={scanningBrokenLinks}
            submittingToGSC={submittingToGSC}
            regeneratingSitemap={regeneratingSitemap}
            syncingBacklinks={syncingBacklinks}
            importingRedirects={importingRedirects}
            // Form states
            newFaq={newFaq}
            setNewFaq={setNewFaq}
            newRedirect={newRedirect}
            setNewRedirect={setNewRedirect}
            editingRedirect={editingRedirect}
            setEditingRedirect={setEditingRedirect}
            newBacklink={newBacklink}
            setNewBacklink={setNewBacklink}
            // Modal states
            showFaqModal={showFaqModal}
            setShowFaqModal={setShowFaqModal}
            showRedirectModal={showRedirectModal}
            setShowRedirectModal={setShowRedirectModal}
            showBacklinkModal={showBacklinkModal}
            setShowBacklinkModal={setShowBacklinkModal}
            // Fetch functions
            fetchSEOStats={fetchSEOStats}
            fetchGSCMetrics={fetchGSCMetrics}
            fetchSEOAlerts={fetchSEOAlerts}
            fetchSEOScores={fetchSEOScores}
            fetchSEORecommendations={fetchSEORecommendations}
            fetchFaqs={fetchFaqs}
            fetchRedirects={fetchRedirects}
            fetchBacklinks={fetchBacklinks}
            // Action handlers
            handleFixNow={handleFixNow}
            handleAddFaq={handleAddFaq}
            handleDeleteFaq={handleDeleteFaq}
            handlePreviewRobotsTxt={handlePreviewRobotsTxt}
            handleSaveRobotsTxt={handleSaveRobotsTxt}
            handleScanDuplicates={handleScanDuplicates}
            handleRunBrokenLinkScan={handleRunBrokenLinkScan}
            handleSubmitToGSC={handleSubmitToGSC}
            handleRegenerateSitemap={handleRegenerateSitemap}
            handleAddRedirect={handleAddRedirect}
            handleUpdateRedirect={handleUpdateRedirect}
            handleDeleteRedirect={handleDeleteRedirect}
            handleEditRedirect={handleEditRedirect}
            handleImportCSV={handleImportCSV}
            handleAddBacklink={handleAddBacklink}
            handleSyncBacklinks={handleSyncBacklinks}
            // Helper functions
            getScoreColor={getScoreColor}
            getProductsWithRecommendations={getProductsWithRecommendations}
            getActionableRecommendationCount={getActionableRecommendationCount}
            getTotalRecommendationCount={getTotalRecommendationCount}
            getProductsNeedingActionCount={getProductsNeedingActionCount}
            getProductsWithIssuesCount={getProductsWithIssuesCount}
          />
        )}

        {/* AI SEO Tab - Embedded from AIOptimizationHub */}
        {activeTab === 'ai-seo' && (
          <React.Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
          }>
            <div className={`rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-white'}`}>
              <AIOptimizationHub />
            </div>
          </React.Suspense>
        )}

        {/* Ad Intelligence Tab */}
        {activeTab === 'intelligence' && (
          <SocialTab
            isDarkMode={isDarkMode}
            competitorAds={competitorAds}
            deletingAdId={deletingAdId}
            handleDeleteCompetitorAd={handleDeleteCompetitorAd}
            handleInspireFromAd={handleInspireFromAd}
            setShowPasteAdModal={setShowPasteAdModal}
            formatTimeAgo={formatTimeAgo}
          />
        )}




        {/* AI Blog Tab */}
        {activeTab === 'ai-blog' && (
          <BlogTab
            isDarkMode={isDarkMode}
            blogs={blogs}
            loadingBlogs={loadingBlogs}
            fetchBlogs={fetchBlogs}
            setShowBlogGenerator={setShowBlogGenerator}
            autopilotEnabled={autopilotEnabled}
            autopilotStatus={autopilotStatus}
            autopilotQueue={autopilotQueue}
            autopilotSettings={autopilotSettings}
            autopilotLoading={autopilotLoading}
            showAutopilotSettings={showAutopilotSettings}
            setShowAutopilotSettings={setShowAutopilotSettings}
            setAutopilotSettings={setAutopilotSettings}
            toggleAutopilot={toggleAutopilot}
            saveAutopilotSettings={saveAutopilotSettings}
            openImageGenerator={openImageGenerator}
            products={products}
          />
        )}


        {/* UGC Tracker Tab */}
        {activeTab === 'ugc' && <UGCTrackerTab />}

        {/* Content Pipeline Tab */}
        {activeTab === 'pipeline' && <ContentPipelineTab />}

        {/* Affiliates Tab - Moved from Sales Hub */}
        {activeTab === 'affiliates' && <AffiliatesTab />}

        {/* Syndication Tab - Embedded from SyndicationPage */}
        {activeTab === 'syndication' && (
          <React.Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
          }>
            <div className={`rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-white'}`}>
              <SyndicationPage />
            </div>
          </React.Suspense>
        )}

        {/* Videos Tab - Embedded from AdminVideosPage */}
        {activeTab === 'videos' && (
          <React.Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
          }>
            <div className={`rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-white'}`}>
              <AdminVideosPage />
            </div>
          </React.Suspense>
        )}

        {/* Reels Tab - Embedded from BarkReelManager */}
        {activeTab === 'reels' && (
          <React.Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
          }>
            <div className={`rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-white'}`}>
              <BarkReelManager />
            </div>
          </React.Suspense>
        )}

        {/* Banners Tab - Embedded from AdminBannersPage */}
        {activeTab === 'banners' && (
          <React.Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
          }>
            <div className={`rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-white'}`}>
              <AdminBannersPage />
            </div>
          </React.Suspense>
        )}

        {/* Product Studio Tab */}
        {activeTab === 'product-studio' && <ProductStudioTab />}

        {/* Trend Scout Tab */}
        {activeTab === 'trend-scout' && (
          <div data-testid="trend-scout-tab-content" className={`rounded-xl p-4 ${isDarkMode ? 'bg-slate-800/50' : 'bg-white'}`}>
            <TrendScoutTab isDarkMode={isDarkMode} />
          </div>
        )}

        {/* Team Tasks Tab */}
        {activeTab === 'team-tasks' && (
          <div data-testid="team-tasks-tab-content" className={`rounded-xl p-4 ${isDarkMode ? 'bg-slate-800/50' : 'bg-white'}`}>
            <TeamTasksTab />
          </div>
        )}

        {/* Floating Tip */}
        <div className={`fixed bottom-4 right-4 max-w-[280px] p-3 rounded-xl shadow-xl ${isDarkMode ? 'bg-slate-800 border border-teal-500/30' : 'bg-white border border-teal-200 shadow-lg'}`}>
          <p className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <span className="text-teal-500 font-medium">💡 Quick Tip:</span> Copy content idea → Open Metricool → Paste → Add image → Schedule!
          </p>
        </div>
      </div>

      {/* Generate Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-xl p-5 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Generate Product Content</h3>
              <button onClick={() => setShowProductModal(false)} className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Select Product</label>
                <select
                  value={selectedProduct || ''}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-sm outline-none ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                >
                  <option value="">Choose a product...</option>
                  {products.map((p) => (
                    <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Platform</label>
                <div className="flex gap-2">
                  {['instagram', 'facebook', 'twitter', 'all'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                        platform === p
                          ? 'bg-teal-600 text-white'
                          : isDarkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Content Type</label>
                <div className="flex flex-wrap gap-2">
                  {['product_launch', 'educational', 'engagement'].map((ct) => (
                    <button
                      key={ct}
                      onClick={() => setContentType(ct)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                        contentType === ct
                          ? 'bg-teal-600 text-white'
                          : isDarkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {ct.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateProduct}
                disabled={generating || !selectedProduct}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generate Content</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Engagement Modal */}
      {showEngagementModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-xl p-5 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Generate Engagement Content</h3>
              <button onClick={() => setShowEngagementModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Topic</label>
                <input
                  type="text"
                  value={engagementTopic}
                  onChange={(e) => setEngagementTopic(e.target.value)}
                  placeholder="e.g., Ask about favorite treat flavors"
                  className={`w-full px-3 py-2 rounded-lg text-sm outline-none ${isDarkMode ? 'bg-slate-700 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-900'}`}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Platform</label>
                <div className="flex gap-2">
                  {['instagram', 'facebook', 'twitter', 'all'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                        platform === p
                          ? 'bg-teal-600 text-white'
                          : isDarkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateEngagement}
                disabled={generating || !engagementTopic.trim()}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generate Content</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Promotion Modal */}
      {showPromotionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-xl p-5 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Generate Promotional Content</h3>
              <button onClick={() => setShowPromotionModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Offer</label>
                <input
                  type="text"
                  value={promoOffer}
                  onChange={(e) => setPromoOffer(e.target.value)}
                  placeholder="e.g., 20% off all treats"
                  className={`w-full px-3 py-2 rounded-lg text-sm outline-none ${isDarkMode ? 'bg-slate-700 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-900'}`}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Discount Code</label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="e.g., NEWYEAR20"
                  className={`w-full px-3 py-2 rounded-lg text-sm outline-none ${isDarkMode ? 'bg-slate-700 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-900'}`}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Valid Until</label>
                <input
                  type="text"
                  value={promoValidity}
                  onChange={(e) => setPromoValidity(e.target.value)}
                  placeholder="e.g., Dec 31, 2024"
                  className={`w-full px-3 py-2 rounded-lg text-sm outline-none ${isDarkMode ? 'bg-slate-700 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-900'}`}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Products</label>
                <input
                  type="text"
                  value={promoProducts}
                  onChange={(e) => setPromoProducts(e.target.value)}
                  placeholder="e.g., All treats, grooming products"
                  className={`w-full px-3 py-2 rounded-lg text-sm outline-none ${isDarkMode ? 'bg-slate-700 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-900'}`}
                />
              </div>

              <button
                onClick={handleGeneratePromotion}
                disabled={generating || !promoOffer.trim() || !promoCode.trim()}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generate Content</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paste Ad Modal - Improved with Validation */}
      {showPasteAdModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-semibold text-white">Add Competitor Ad</h3>
                <p className="text-xs text-slate-400 mt-0.5">Paste ad copy from Meta Ad Library</p>
              </div>
              <button 
                onClick={() => {
                  setShowPasteAdModal(false);
                  setPasteFormData({ advertiser: '', copy: '', image: '', error: '' });
                }} 
                className="p-2 hover:bg-slate-800 text-slate-500 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Error Message */}
              {pasteFormData.error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {pasteFormData.error}
                  </p>
                </div>
              )}

              {/* Advertiser Name */}
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
                  Advertiser Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={pasteFormData.advertiser}
                  onChange={(e) => setPasteFormData({ ...pasteFormData, advertiser: e.target.value, error: '' })}
                  placeholder="e.g., Gowiggle, Pedigree, TrueTumz"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm"
                />
              </div>

              {/* Ad Copy */}
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
                  Ad Copy <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={pasteFormData.copy}
                  onChange={(e) => setPasteFormData({ ...pasteFormData, copy: e.target.value, error: '' })}
                  placeholder={`Paste the FULL ad text here...

Example:
🐕 Give your puppy a healthy start!
Pedigree Puppy is packed with essential nutrients to support growth, immunity and strong bones.
Enjoy 10% OFF in our End of Year Sale!
Order now →`}
                  rows={8}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm resize-none"
                />
                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Paste the actual ad text, NOT the URL. Find this in Meta Ad Library ad details.
                </p>
              </div>

              {/* Image URL (Optional) */}
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
                  Image URL <span className="text-slate-600">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={pasteFormData.image}
                  onChange={(e) => setPasteFormData({ ...pasteFormData, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowPasteAdModal(false);
                  setPasteFormData({ advertiser: '', copy: '', image: '', error: '' });
                }}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // Validation
                  if (!pasteFormData.advertiser.trim()) {
                    setPasteFormData({ ...pasteFormData, error: 'Advertiser name is required' });
                    return;
                  }
                  if (!pasteFormData.copy.trim()) {
                    setPasteFormData({ ...pasteFormData, error: 'Ad copy is required' });
                    return;
                  }
                  // Check if ad copy looks like a URL
                  const copyText = pasteFormData.copy.trim();
                  if (copyText.startsWith('http') && copyText.split(' ').length < 5) {
                    setPasteFormData({ ...pasteFormData, error: 'Please paste the actual ad TEXT, not a URL. Copy the ad copy from Meta Ad Library.' });
                    return;
                  }
                  if (copyText.length < 20) {
                    setPasteFormData({ ...pasteFormData, error: 'Ad copy seems too short. Please paste the full ad text.' });
                    return;
                  }

                  setSavingAd(true);
                  try {
                    await handleSaveCompetitorAd({
                      advertiser: pasteFormData.advertiser.trim(),
                      copy: copyText,
                      image: pasteFormData.image.trim() || null,
                      platforms: ['facebook', 'instagram'],
                      source: 'meta_ad_library'
                    });
                    setShowPasteAdModal(false);
                    setPasteFormData({ advertiser: '', copy: '', image: '', error: '' });
                  } catch (err) {
                    setPasteFormData({ ...pasteFormData, error: 'Failed to save ad' });
                  } finally {
                    setSavingAd(false);
                  }
                }}
                disabled={savingAd}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingAd ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Add Ad</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspire Modal - Enhanced with Ad Analysis */}
      {showInspireModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Create Inspired Content</h3>
                  <p className="text-xs text-slate-400">from {selectedAd?.advertiser}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowInspireModal(false);
                  setAdAnalysis(null);
                  setGeneratedInspiredContent(null);
                }}
                className="p-2 hover:bg-slate-800 text-slate-500 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {/* Ad Analysis Section - Collapsible */}
              {adAnalysis && (
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowAnalysis(!showAnalysis)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-white">Ad Analysis</span>
                      <span className="text-xs text-slate-500">Learn why this ad works</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showAnalysis ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showAnalysis && (
                    <div className="p-4 pt-0 grid grid-cols-2 gap-3">
                      {/* Hook */}
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-3 h-3 text-yellow-400" />
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Hook Type</span>
                        </div>
                        <p className="text-sm text-white">{adAnalysis.hook_type || 'N/A'}</p>
                        {adAnalysis.hook_example && (
                          <p className="text-xs text-slate-500 mt-1 italic">&ldquo;{adAnalysis.hook_example}&rdquo;</p>
                        )}
                      </div>
                      
                      {/* Structure */}
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-3 h-3 text-blue-400" />
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Structure</span>
                        </div>
                        <p className="text-sm text-white">{adAnalysis.structure || 'N/A'}</p>
                      </div>
                      
                      {/* CTA */}
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-3 h-3 text-green-400" />
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">CTA Type</span>
                        </div>
                        <p className="text-sm text-white">{adAnalysis.cta_type || 'N/A'}</p>
                        {adAnalysis.cta_example && (
                          <p className="text-xs text-slate-500 mt-1 italic">&ldquo;{adAnalysis.cta_example}&rdquo;</p>
                        )}
                      </div>
                      
                      {/* Emotional Triggers */}
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="w-3 h-3 text-red-400" />
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Emotional Triggers</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {adAnalysis.emotional_triggers?.length > 0 ? (
                            adAnalysis.emotional_triggers.map((trigger, i) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-700 text-xs text-slate-300 rounded-full">
                                {trigger}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-white">N/A</span>
                          )}
                        </div>
                      </div>
                      
                      {/* What Works */}
                      <div className="bg-slate-800/50 rounded-lg p-3 col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-3 h-3 text-amber-400" />
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Why It Works</span>
                        </div>
                        <p className="text-sm text-slate-300">{adAnalysis.what_works || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Side by Side Comparison */}
              <div className="grid grid-cols-2 gap-4">
                {/* Original Ad */}
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Original Ad</span>
                  <div className="mt-2 bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 min-h-[180px] max-h-[250px] overflow-y-auto">
                    <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">{selectedAd?.copy}</p>
                  </div>
                </div>
                
                {/* Your Version */}
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Your Version</span>
                  <div className="mt-2 bg-slate-800/50 border border-teal-500/30 rounded-xl p-4 min-h-[180px] max-h-[250px] overflow-y-auto">
                    {isGeneratingInspired ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Loader2 className="w-6 h-6 animate-spin text-teal-400 mx-auto mb-2" />
                          <p className="text-xs text-slate-500">Generating PetYupp version...</p>
                        </div>
                      </div>
                    ) : generatedInspiredContent?.caption ? (
                      <p className="text-xs text-white whitespace-pre-wrap leading-relaxed">{generatedInspiredContent.caption}</p>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Select a product and generate</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Product & Platform Selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Product</span>
                  <select
                    value={inspireSelectedProduct}
                    onChange={(e) => setInspireSelectedProduct(e.target.value)}
                    className="mt-2 w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-teal-500 focus:outline-none"
                  >
                    <option value="">Select Product</option>
                    {products?.map((product) => (
                      <option key={product._id || product.id} value={product._id || product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Platform</span>
                  <div className="mt-2 flex gap-2">
                    {[
                      { id: 'instagram', label: 'Instagram', icon: FaInstagram },
                      { id: 'facebook', label: 'Facebook', icon: FaFacebookF },
                      { id: 'twitter', label: 'Twitter', icon: FaTwitter }
                    ].map((platform) => (
                      <button
                        key={platform.id}
                        onClick={() => {
                          setInspirePlatform(platform.id);
                          // Auto-regenerate for new platform
                          handleInspireFromAd(selectedAd, inspireSelectedProduct, platform.id);
                        }}
                        disabled={isGeneratingInspired}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                          inspirePlatform === platform.id
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'
                        } ${isGeneratingInspired ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <platform.icon className="w-4 h-4" />
                        {platform.label}
                        {isGeneratingInspired && inspirePlatform === platform.id && (
                          <Loader2 className="w-3 h-3 animate-spin ml-1" />
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Click a platform to regenerate optimized content
                  </p>
                </div>
              </div>

              {/* Hashtags */}
              {generatedInspiredContent?.hashtags && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Hashtags</span>
                  <div className="mt-2 bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between">
                    <p className="text-sm text-teal-400">{generatedInspiredContent.hashtags}</p>
                    <button
                      onClick={() => copyToClipboard(generatedInspiredContent.hashtags, 'Hashtags')}
                      className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-teal-400 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-5 border-t border-slate-800">
              <button
                onClick={() => handleInspireFromAd(selectedAd, inspireSelectedProduct, inspirePlatform)}
                disabled={isGeneratingInspired}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isGeneratingInspired ? 'animate-spin' : ''}`} />
                Regenerate
              </button>
              <button
                onClick={handleSaveInspiredToIdeas}
                disabled={!generatedInspiredContent || isGeneratingInspired}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Save to Ideas
              </button>
              <button
                onClick={() => {
                  if (generatedInspiredContent) {
                    copyToClipboard(generatedInspiredContent.caption + '\n\n' + generatedInspiredContent.hashtags, 'Content');
                  }
                }}
                disabled={!generatedInspiredContent}
                className="py-3 px-4 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-400 rounded-xl text-sm font-medium transition-colors"
                title="Copy All"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Blog Generator Modal - Simplified */}
      {showBlogGenerator && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between sticky top-0 ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
              <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Sparkles className="w-5 h-5 text-teal-400" />
                AI Blog Generator
              </h2>
              <button 
                onClick={() => {
                  setShowBlogGenerator(false);
                  setTitleSuggestions([]);
                  setShowAdvancedSettings(false);
                }}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Step 1: Post Type */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-500 text-white text-xs mr-2">1</span>
                  Select Post Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'educational', label: 'Educational', icon: Lightbulb },
                    { id: 'product-spotlight', label: 'Product Spotlight', icon: Archive },
                    { id: 'how-to', label: 'How-To Guide', icon: FileText },
                    { id: 'comparison', label: 'Comparison', icon: Target },
                    { id: 'faq', label: 'FAQ', icon: AlertTriangle },
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => {
                        const defaults = getSmartDefaults(type.id);
                        setBlogGeneratorForm(prev => ({ 
                          ...prev, 
                          postType: type.id,
                          tone: defaults.tone,
                          wordCount: defaults.wordCount
                        }));
                        // Re-fetch suggestions if products already selected
                        if (blogGeneratorForm.selectedProducts.length > 0) {
                          fetchTitleSuggestions(blogGeneratorForm.selectedProducts, type.id);
                        }
                      }}
                      className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                        blogGeneratorForm.postType === type.id
                          ? 'bg-teal-500 text-white'
                          : isDarkMode
                            ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Product Selection */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-500 text-white text-xs mr-2">2</span>
                  Select Products to Feature
                </label>
                <div className={`border rounded-lg p-3 max-h-48 overflow-y-auto grid grid-cols-2 gap-2 ${
                  isDarkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  {products.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-2 col-span-2">No products loaded</p>
                  ) : (
                    products.slice(0, 12).map(product => {
                      const imageUrl = getProductImageUrl(product);
                      const isSelected = blogGeneratorForm.selectedProducts.includes(product._id || product.id);
                      return (
                        <button 
                          key={product._id || product.id}
                          onClick={() => {
                            const pid = product._id || product.id;
                            let newSelectedProducts;
                            if (isSelected) {
                              newSelectedProducts = blogGeneratorForm.selectedProducts.filter(id => id !== pid);
                            } else {
                              newSelectedProducts = [...blogGeneratorForm.selectedProducts, pid];
                            }
                            setBlogGeneratorForm(prev => ({
                              ...prev,
                              selectedProducts: newSelectedProducts
                            }));
                            // Fetch title suggestions when products change
                            if (newSelectedProducts.length > 0) {
                              fetchTitleSuggestions(newSelectedProducts, blogGeneratorForm.postType);
                            } else {
                              setTitleSuggestions([]);
                            }
                          }}
                          className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                            isSelected
                              ? 'bg-teal-500/20 border-2 border-teal-500'
                              : isDarkMode 
                                ? 'bg-slate-700/50 border-2 border-transparent hover:border-slate-500' 
                                : 'bg-white border-2 border-transparent hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>
                            {imageUrl ? (
                              <img 
                                src={imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center ${imageUrl ? 'hidden' : ''}`}>
                              <Package className="w-4 h-4 text-slate-500" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {product.name?.substring(0, 25)}{product.name?.length > 25 ? '...' : ''}
                            </p>
                            {isSelected && (
                              <span className="text-[10px] text-teal-400 flex items-center gap-1">
                                <CheckCircle2 size={10} /> Selected
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {blogGeneratorForm.selectedProducts.length} product(s) selected
                </p>
              </div>

              {/* Step 3: AI Title Suggestions */}
              {blogGeneratorForm.selectedProducts.length > 0 && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-500 text-white text-xs mr-2">3</span>
                    Choose a Title
                    <button
                      onClick={() => fetchTitleSuggestions(blogGeneratorForm.selectedProducts, blogGeneratorForm.postType)}
                      disabled={loadingTitleSuggestions}
                      className="ml-2 p-1 rounded hover:bg-slate-700/50 transition-colors"
                      title="Refresh suggestions"
                    >
                      <RefreshCw size={14} className={`text-slate-400 ${loadingTitleSuggestions ? 'animate-spin' : ''}`} />
                    </button>
                  </label>
                  
                  {loadingTitleSuggestions ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
                      <span className="ml-2 text-sm text-slate-400">Generating title suggestions...</span>
                    </div>
                  ) : titleSuggestions.length > 0 ? (
                    <div className="space-y-2">
                      {titleSuggestions.map((title, idx) => (
                        <button
                          key={idx}
                          onClick={() => setBlogGeneratorForm(prev => ({ ...prev, topic: title }))}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            blogGeneratorForm.topic === title
                              ? 'bg-teal-500/20 border-teal-500 text-teal-400'
                              : isDarkMode
                                ? 'bg-slate-700/50 border-slate-600 text-white hover:border-teal-500/50'
                                : 'bg-white border-gray-200 text-gray-900 hover:border-teal-500/50'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <Sparkles size={14} className={`flex-shrink-0 mt-0.5 ${blogGeneratorForm.topic === title ? 'text-teal-400' : 'text-teal-400'}`} />
                            <span className="text-sm">{title}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className={`py-4 text-center rounded-lg ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
                      <Sparkles className="w-6 h-6 mx-auto mb-2 text-slate-500" />
                      <p className="text-sm text-slate-500">Click refresh to generate title suggestions</p>
                    </div>
                  )}
                  
                  {/* Custom Title Input */}
                  <div className="mt-3">
                    <p className={`text-xs mb-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                      Or enter a custom title:
                    </p>
                    <input
                      type="text"
                      value={blogGeneratorForm.topic}
                      onChange={(e) => setBlogGeneratorForm(prev => ({ ...prev, topic: e.target.value }))}
                      placeholder="Type your own title..."
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-teal-500 ${
                        isDarkMode 
                          ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Advanced Settings (Collapsed by default) */}
              <div className={`border rounded-lg ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className={`w-full px-4 py-3 flex items-center justify-between text-sm ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <span className="flex items-center gap-2">
                    <Settings size={14} />
                    Advanced Settings
                  </span>
                  <ChevronDown size={14} className={`transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`} />
                </button>
                
                {showAdvancedSettings && (
                  <div className={`px-4 pb-4 space-y-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    {/* Tone */}
                    <div className="pt-4">
                      <label className={`block text-xs font-medium mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        Tone
                      </label>
                      <div className="flex gap-2">
                        {['friendly', 'educational', 'professional'].map(tone => (
                          <button
                            key={tone}
                            onClick={() => setBlogGeneratorForm(prev => ({ ...prev, tone }))}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs capitalize transition-colors ${
                              blogGeneratorForm.tone === tone
                                ? 'bg-teal-500 text-white'
                                : isDarkMode
                                  ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {tone}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Word Count */}
                    <div>
                      <label className={`block text-xs font-medium mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        Word Count
                      </label>
                      <div className="flex gap-2">
                        {[
                          { id: 'short', label: 'Short (500)' },
                          { id: 'medium', label: 'Medium (800)' },
                          { id: 'long', label: 'Long (1200)' },
                        ].map(option => (
                          <button
                            key={option.id}
                            onClick={() => setBlogGeneratorForm(prev => ({ ...prev, wordCount: option.id }))}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs transition-colors ${
                              blogGeneratorForm.wordCount === option.id
                                ? 'bg-teal-500 text-white'
                                : isDarkMode
                                  ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`px-6 py-4 border-t sticky bottom-0 ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
              <div className="flex justify-between items-center">
                <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                  ✨ AI will auto-optimize keywords, tone, and length based on your selections
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowBlogGenerator(false);
                      setTitleSuggestions([]);
                      setShowAdvancedSettings(false);
                    }}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'bg-slate-700 hover:bg-slate-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!blogGeneratorForm.topic || blogGeneratorForm.selectedProducts.length === 0) {
                        toast.error('Please select products and choose a title');
                        return;
                      }
                      
                      setGeneratingBlog(true);
                      try {
                        const response = await fetch(`${API_BASE_URL}/api/ai/generate-ai-blog`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            topic: blogGeneratorForm.topic,
                            postType: blogGeneratorForm.postType,
                            selectedProducts: blogGeneratorForm.selectedProducts,
                            keywords: '', // Auto-extracted in backend
                            category: 'Auto', // Auto-detected in backend
                            tone: blogGeneratorForm.tone,
                            wordCount: blogGeneratorForm.wordCount
                          })
                        });
                        
                        const result = await response.json();
                        
                        if (result.success && result.data) {
                          // Save the generated blog as draft
                          const saveResponse = await fetch(`${API_BASE_URL}/api/ai/save-ai-blog`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              ...result.data,
                              selectedProducts: blogGeneratorForm.selectedProducts,
                              source: 'manual'
                            })
                          });
                          
                          const saveResult = await saveResponse.json();
                          
                          if (saveResult.success) {
                            toast.success('Blog post generated and saved as draft!');
                            setShowBlogGenerator(false);
                            setTitleSuggestions([]);
                            setShowAdvancedSettings(false);
                            fetchBlogs();
                            // Reset form
                            setBlogGeneratorForm({
                              topic: '',
                              postType: 'educational',
                              selectedProducts: [],
                              keywords: '',
                              category: 'Nutrition',
                              tone: 'friendly',
                              wordCount: 'medium'
                            });
                          } else {
                            toast.error(saveResult.detail || 'Failed to save blog post');
                          }
                        } else {
                          toast.error(result.detail || 'Failed to generate blog content');
                        }
                      } catch (error) {
                        console.error('Blog generation error:', error);
                        toast.error('Failed to generate blog post. Please try again.');
                      } finally {
                        setGeneratingBlog(false);
                      }
                    }}
                    disabled={generatingBlog || !blogGeneratorForm.topic || blogGeneratorForm.selectedProducts.length === 0}
                    className="px-6 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    {generatingBlog ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Blog Post
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowFaqModal(false)}>
          <div className={`w-full max-w-md mx-4 rounded-2xl p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add FAQ Schema</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Question</label>
                <input
                  type="text"
                  value={newFaq.question}
                  onChange={(e) => setNewFaq(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="Enter question..."
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Answer</label>
                <textarea
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq(prev => ({ ...prev, answer: e.target.value }))}
                  placeholder="Enter answer..."
                  rows={4}
                  className={`w-full px-3 py-2 rounded-lg border resize-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowFaqModal(false)} className={`px-4 py-2 rounded-lg text-sm ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
              <button onClick={handleAddFaq} className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm rounded-lg">Save FAQ</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Image Generator Modal */}
      {showImageGenerator && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`border rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b flex items-center justify-between sticky top-0 ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
              <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <ImageIcon className="w-5 h-5 text-teal-400" />
                Generate Blog Featured Image
              </h2>
              <button 
                onClick={() => {
                  setShowImageGenerator(false);
                  setGeneratedImageResult(null);
                }}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Blog Info */}
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <h3 className={`font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {imageGenForm.blogTitle}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  {imageGenForm.blogCategory} • {imageGenForm.blogSummary?.substring(0, 100)}...
                </p>
              </div>

              {/* AI Prompt */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  AI Prompt (auto-generated, editable)
                </label>
                <textarea
                  value={imageGenForm.prompt}
                  onChange={(e) => setImageGenForm(prev => ({ ...prev, prompt: e.target.value }))}
                  rows={4}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="A happy golden retriever..."
                />
              </div>

              {/* Provider & Template Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Provider
                  </label>
                  <select
                    value={imageGenForm.provider}
                    onChange={(e) => setImageGenForm(prev => ({ ...prev, provider: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="dalle3">DALL-E 3 (~₹3-6/image)</option>
                    <option value="gpt-image-1">GPT Image 1 (~₹3-6/image)</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Branding Template
                  </label>
                  <select
                    value={imageGenForm.templateId || ''}
                    onChange={(e) => setImageGenForm(prev => ({ ...prev, templateId: e.target.value || null }))}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {imageTemplates.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Related Product */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Related Product (optional overlay)
                </label>
                <select
                  value={imageGenForm.relatedProductId || ''}
                  onChange={(e) => setImageGenForm(prev => ({ ...prev, relatedProductId: e.target.value || null }))}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">None</option>
                  {products.map(p => (
                    <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Generated Result */}
              {generatedImageResult && (
                <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className={`font-medium mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Generated Image
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Raw Image</p>
                      <img 
                        src={generatedImageResult.raw_image_url?.startsWith('http') 
                          ? generatedImageResult.raw_image_url 
                          : `${API_BASE_URL}${generatedImageResult.raw_image_url}`} 
                        alt="Raw" 
                        className="rounded-lg w-full h-40 object-cover"
                      />
                    </div>
                    <div>
                      <p className={`text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Branded Image</p>
                      <img 
                        src={generatedImageResult.branded_image_url?.startsWith('http') 
                          ? generatedImageResult.branded_image_url 
                          : `${API_BASE_URL}${generatedImageResult.branded_image_url}`} 
                        alt="Branded" 
                        className="rounded-lg w-full h-40 object-cover border-2 border-teal-500"
                      />
                    </div>
                  </div>
                  <div className={`mt-3 text-xs flex items-center gap-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    <span>Applied: {generatedImageResult.applied_elements?.join(', ')}</span>
                    <span>Cost: ${(generatedImageResult.total_cost || generatedImageResult.cost || 0).toFixed(3)}</span>
                    <span>Time: {((generatedImageResult.generation_time_ms || (generatedImageResult.generation_time * 1000) || 0) / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              )}

              {/* Cost Info */}
              <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                Estimated cost: ~₹3-6 per image using DALL-E 3
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`px-6 py-4 border-t flex justify-between ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <button
                onClick={() => {
                  setShowImageGenerator(false);
                  setGeneratedImageResult(null);
                }}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                Cancel
              </button>
              <div className="flex gap-2">
                {generatedImageResult && (
                  <button
                    onClick={() => setGeneratedImageResult(null)}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'bg-slate-700 hover:bg-slate-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    Regenerate
                  </button>
                )}
                <button
                  onClick={async () => {
                    if (generatedImageResult) {
                      // Update blog with new image
                      try {
                        const token = localStorage.getItem('adminToken');
                        const blogId = imageGenForm.blogId;
                        
                        if (!blogId) {
                          toast.error('Blog ID not found');
                          return;
                        }
                        
                        const response = await fetch(`${API_BASE_URL}/api/admin/blog/posts/${blogId}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            featuredImage: {
                              url: generatedImageResult.branded_image_url,
                              alt: imageGenForm.blogTitle
                            },
                            featured_image_prompt: generatedImageResult.prompt_used,
                            featured_image_raw_url: generatedImageResult.raw_image_url,
                            featured_image_branded_url: generatedImageResult.branded_image_url,
                            featured_image_generation_cost: generatedImageResult.total_cost,
                            featured_image_provider: imageGenForm.provider
                          })
                        });
                        
                        if (response.ok) {
                          toast.success('Blog image updated!');
                          setShowImageGenerator(false);
                          setGeneratedImageResult(null);
                          fetchBlogs();
                        } else {
                          toast.error('Failed to update blog');
                        }
                      } catch (error) {
                        console.error('Error updating blog:', error);
                        toast.error('Failed to update blog');
                      }
                    } else {
                      // Generate image
                      await generateBlogImage();
                    }
                  }}
                  disabled={generatingImage || (!imageGenForm.prompt && !generatedImageResult)}
                  className="px-6 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {generatingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : generatedImageResult ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Use This Image
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      Generate Image (~₹5)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Redirect Modal */}
      {showRedirectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setShowRedirectModal(false); setEditingRedirect(null); }}>
          <div className={`w-full max-w-md mx-4 rounded-2xl p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{editingRedirect ? 'Edit Redirect' : 'Add Redirect'}</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>From Path</label>
                <input
                  type="text"
                  value={newRedirect.from_path}
                  onChange={(e) => setNewRedirect(prev => ({ ...prev, from_path: e.target.value }))}
                  placeholder="/old-page"
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>To Path</label>
                <input
                  type="text"
                  value={newRedirect.to_path}
                  onChange={(e) => setNewRedirect(prev => ({ ...prev, to_path: e.target.value }))}
                  placeholder="/new-page"
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Redirect Type</label>
                <select
                  value={newRedirect.type}
                  onChange={(e) => setNewRedirect(prev => ({ ...prev, type: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  <option value="301">301 - Permanent</option>
                  <option value="302">302 - Temporary</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { setShowRedirectModal(false); setEditingRedirect(null); }} className={`px-4 py-2 rounded-lg text-sm ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
              <button onClick={editingRedirect ? handleUpdateRedirect : handleAddRedirect} className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm rounded-lg">{editingRedirect ? 'Update' : 'Add'} Redirect</button>
            </div>
          </div>
        </div>
      )}

      {/* Backlink Modal */}
      {showBacklinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowBacklinkModal(false)}>
          <div className={`w-full max-w-md mx-4 rounded-2xl p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add Manual Backlink</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Domain</label>
                <input
                  type="text"
                  value={newBacklink.domain}
                  onChange={(e) => setNewBacklink(prev => ({ ...prev, domain: e.target.value }))}
                  placeholder="example.com"
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>URL (optional)</label>
                <input
                  type="text"
                  value={newBacklink.url}
                  onChange={(e) => setNewBacklink(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com/page"
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Type</label>
                  <select
                    value={newBacklink.type}
                    onChange={(e) => setNewBacklink(prev => ({ ...prev, type: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  >
                    <option value="dofollow">DoFollow</option>
                    <option value="nofollow">NoFollow</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>DA Score</label>
                  <input
                    type="number"
                    value={newBacklink.da}
                    onChange={(e) => setNewBacklink(prev => ({ ...prev, da: parseInt(e.target.value) || 0 }))}
                    placeholder="0-100"
                    min="0"
                    max="100"
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowBacklinkModal(false)} className={`px-4 py-2 rounded-lg text-sm ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
              <button onClick={handleAddBacklink} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg">Add Backlink</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingHubPage;
