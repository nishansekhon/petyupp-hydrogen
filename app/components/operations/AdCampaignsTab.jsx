import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { API_BASE_URL } from '@/config/api';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { 
  TrendingUp, DollarSign, Target, Activity, Percent,
  Plus, Edit2, Trash2, Play, Pause, RefreshCw,
  X, ChevronDown, ChevronRight, AlertCircle,
  BarChart2, ShoppingCart, ShoppingBag, Store, LineChart, Loader2,
  Settings, CheckCircle2, XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import ConfirmationModal from '@/components/common/ConfirmationModal';

const API_URL = API_BASE_URL;

// Platform configuration with icons
const PLATFORMS = {
  amazon: { name: 'Amazon', color: 'bg-orange-500', textColor: 'text-orange-400', Icon: ShoppingCart },
  flipkart: { name: 'Flipkart', color: 'bg-blue-500', textColor: 'text-blue-400', Icon: ShoppingBag },
  google: { name: 'Google', color: 'bg-green-500', textColor: 'text-green-400', Icon: LineChart },
  jiomart: { name: 'Jiomart', color: 'bg-red-500', textColor: 'text-red-400', Icon: Store }
};

const CAMPAIGN_TYPES = {
  amazon: [
    { value: 'sponsored_products', label: 'Sponsored Products' },
    { value: 'sponsored_brands', label: 'Sponsored Brands' },
    { value: 'sponsored_display', label: 'Sponsored Display' }
  ],
  flipkart: [
    { value: 'product_ads', label: 'Product Ads' },
    { value: 'search', label: 'Search Ads' },
    { value: 'banner', label: 'Banner Ads' }
  ],
  google: [
    { value: 'search_ads', label: 'Search Ads' },
    { value: 'shopping_ads', label: 'Shopping Ads' },
    { value: 'display_ads', label: 'Display Ads' },
    { value: 'video_ads', label: 'Video Ads' },
    { value: 'performance_max', label: 'Performance Max' }
  ],
  jiomart: [
    { value: 'search', label: 'Search Ads' },
    { value: 'sponsored', label: 'Sponsored Listings' }
  ]
};

const STATUS_COLORS = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  planned: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ended: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
};

// Time slot configuration for performance tracking
const TIME_SLOTS = [
  { value: '09:00', label: 'Morning (9 AM)', hour: 9 },
  { value: '12:00', label: 'Noon (12 PM)', hour: 12 },
  { value: '15:00', label: 'Afternoon (3 PM)', hour: 15 },
  { value: '18:00', label: 'Evening (6 PM)', hour: 18 },
  { value: '21:00', label: 'Night (9 PM)', hour: 21 },
  { value: '23:00', label: 'End of Day (11 PM)', hour: 23 }
];

// Get nearest time slot based on current hour
const getNearestTimeSlot = () => {
  const currentHour = new Date().getHours();
  // Find the nearest slot (prefer upcoming slot)
  for (let i = TIME_SLOTS.length - 1; i >= 0; i--) {
    if (currentHour >= TIME_SLOTS[i].hour) {
      return TIME_SLOTS[i].value;
    }
  }
  return TIME_SLOTS[0].value; // Default to morning
};

// Get time slot label from timestamp using hour ranges
const getTimeSlotLabel = (timestamp) => {
  const date = new Date(timestamp);
  const hour = date.getHours();
  
  // Named time slots based on hour ranges
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night'; // 9 PM to 4:59 AM
};

const AdCampaignsTab = () => {
  const { isDarkMode } = useAdminTheme();
  
  // State
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({
    total_daily_budget: 0,
    total_spent_mtd: 0,
    total_sales_mtd: 0,
    blended_roas: 0,
    blended_acos: 0,
    active_campaigns_count: 0
  });
  const [playbooks, setPlaybooks] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ROAS Alerts state
  const [roasAlerts, setRoasAlerts] = useState({
    has_alerts: false,
    critical_count: 0,
    warning_count: 0,
    critical_alerts: [],
    warning_alerts: []
  });
  const [showAlertDetails, setShowAlertDetails] = useState(false);
  
  // Filters
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Google Ads sync state
  const [googleSyncing, setGoogleSyncing] = useState(false);
  const [googleLastSynced, setGoogleLastSynced] = useState(null);
  const [googleAdsStatus, setGoogleAdsStatus] = useState({
    configured: false,
    status: 'unknown',
    credentials: {},
    customer_id: ''
  });
  
  // Modals
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [expandedPlaybooks, setExpandedPlaybooks] = useState({});
  const [historyDateRange, setHistoryDateRange] = useState('all');
  const [historyMetrics, setHistoryMetrics] = useState({ roas: true, spent: true, sales: true });
  
  // Form state
  const [formData, setFormData] = useState({
    platform: 'amazon',
    campaign_type: 'sponsored_products',
    campaign_name: '',
    objective: 'sales',
    daily_budget: '',
    default_bid: '',
    targeting_type: 'automatic',
    bid_strategy: 'dynamic_down',
    start_date: '',
    end_date: '',
    no_end_date: true,
    keywords: '',
    products: [],
    notes: ''
  });
  
  const [perfData, setPerfData] = useState({
    spent_mtd: '',
    sales_mtd: '',
    impressions_mtd: '',
    clicks_mtd: '',
    orders_mtd: ''
  });
  
  // Performance date/time state
  const [perfDate, setPerfDate] = useState('');
  const [perfTimeSlot, setPerfTimeSlot] = useState('');
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, campaign: null });

  // Fetch Google Ads status
  const fetchGoogleAdsStatus = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${API_URL}/api/admin/ad-campaigns/google-ads-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setGoogleAdsStatus({
          configured: data.configured,
          status: data.status,
          credentials: data.credentials || {},
          customer_id: data.customer_id || '',
          message: data.message
        });
        if (data.last_synced) {
          setGoogleLastSynced(data.last_synced);
        }
      }
    } catch (err) {
      console.error('Error fetching Google Ads status:', err);
    }
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
      const [campaignsRes, statsRes, playbooksRes, productsRes, alertsRes, googleStatusRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/admin/ad-campaigns`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/api/admin/ad-campaigns/stats`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/api/admin/ad-playbooks`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/api/admin/products`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/api/admin/ad-campaigns/roas-alerts`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/api/admin/ad-campaigns/google-ads-status`, { headers }).then(r => r.json())
      ]);
      
      if (campaignsRes.status === 'fulfilled' && campaignsRes.value.success) {
        setCampaigns(campaignsRes.value.campaigns || []);
      }
      if (statsRes.status === 'fulfilled' && statsRes.value.success) {
        setStats(statsRes.value.stats || {});
      }
      if (playbooksRes.status === 'fulfilled' && playbooksRes.value.success) {
        setPlaybooks(playbooksRes.value.playbooks || []);
      }
      if (productsRes.status === 'fulfilled') {
        const data = productsRes.value;
        setProducts(Array.isArray(data) ? data : (data.products || []));
      }
      if (alertsRes.status === 'fulfilled' && alertsRes.value.success) {
        setRoasAlerts(alertsRes.value);
      }
      if (googleStatusRes.status === 'fulfilled' && googleStatusRes.value.success) {
        setGoogleAdsStatus({
          configured: googleStatusRes.value.configured,
          status: googleStatusRes.value.status,
          credentials: googleStatusRes.value.credentials || {},
          customer_id: googleStatusRes.value.customer_id || '',
          message: googleStatusRes.value.message
        });
        if (googleStatusRes.value.last_synced) {
          setGoogleLastSynced(googleStatusRes.value.last_synced);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load campaigns data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(c => {
    if (platformFilter !== 'all' && c.platform !== platformFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Get ROAS color (higher is better)
  const getRoasColor = (roas) => {
    if (roas >= 3) return 'text-green-400';
    if (roas >= 2) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Get ACoS color (lower is better)
  const getAcosColor = (acos) => {
    if (acos === 0 || acos === null) return 'text-slate-400';
    if (acos <= 20) return 'text-green-400';
    if (acos <= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Get campaign health color based on ROAS
  const getHealthColor = (campaign) => {
    const roas = campaign.roas || 0;
    const hasData = campaign.performance?.spent_mtd > 0;
    if (!hasData) return 'bg-slate-400';
    if (roas >= 3) return 'bg-green-400';
    if (roas >= 2) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return { text: 'Never updated', color: 'text-yellow-400' };
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    let text = '';
    let color = 'text-slate-500';
    
    if (diffHours < 1) {
      text = 'Just now';
    } else if (diffHours < 24) {
      text = `${Math.floor(diffHours)}h ago`;
    } else if (diffDays < 7) {
      text = `${Math.floor(diffDays)}d ago`;
    } else {
      text = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    }
    
    if (diffDays > 7) {
      color = 'text-red-400';
    } else if (diffDays > 3) {
      color = 'text-yellow-400';
    }
    
    return { text, color };
  };

  // Sync Google Ads campaigns
  const handleGoogleSync = async () => {
    const token = localStorage.getItem('adminToken');
    setGoogleSyncing(true);
    
    try {
      const response = await fetch(`${API_URL}/api/admin/ad-campaigns/sync-google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Synced ${data.campaigns_synced || 0} Google Ads campaigns`);
        setGoogleLastSynced(data.last_synced || new Date().toISOString());
        fetchData(); // Refresh campaign data
      } else if (data.error === 'not_configured') {
        toast.error('Google Ads API not configured. Add credentials in Settings > API Settings.', {
          duration: 5000,
          description: 'Customer ID is pre-configured. Add Developer Token, Client ID, Secret, and Refresh Token.'
        });
      } else if (data.error === 'incomplete_credentials') {
        const missing = data.missing_credentials?.join(', ') || 'some credentials';
        toast.error(`Missing: ${missing}`, {
          duration: 5000,
          description: 'Go to Settings > API Settings > Google Ads API to add missing credentials.'
        });
      } else if (data.error === 'token_refresh_failed') {
        toast.error('OAuth token refresh failed', {
          duration: 5000,
          description: 'Check that Client ID, Client Secret, and Refresh Token are correct.'
        });
      } else {
        toast.error(data.message || 'Failed to sync Google Ads');
      }
    } catch (err) {
      console.error('Error syncing Google Ads:', err);
      toast.error('Failed to connect to Google Ads API');
    } finally {
      setGoogleSyncing(false);
    }
  };

  // Initialize Google Ads configuration
  const handleInitGoogleAds = async () => {
    const token = localStorage.getItem('adminToken');
    
    try {
      const response = await fetch(`${API_URL}/api/admin/ad-campaigns/google-ads-init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Google Ads API initialized', {
          description: `Customer ID: ${data.customer_id}. Now add OAuth credentials in API Settings.`
        });
        fetchData(); // Refresh status
      } else {
        toast.error(data.error || 'Failed to initialize Google Ads');
      }
    } catch (err) {
      console.error('Error initializing Google Ads:', err);
      toast.error('Failed to initialize Google Ads configuration');
    }
  };

  // Open campaign modal
  const openCampaignModal = (campaign = null) => {
    setShowProductDropdown(false);
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        platform: campaign.platform,
        campaign_type: campaign.campaign_type,
        campaign_name: campaign.campaign_name,
        objective: campaign.objective || 'sales',
        daily_budget: campaign.daily_budget?.toString() || '',
        default_bid: campaign.default_bid?.toString() || '',
        targeting_type: campaign.targeting_type || 'automatic',
        bid_strategy: campaign.bid_strategy || 'dynamic_down',
        start_date: campaign.start_date || '',
        end_date: campaign.end_date || '',
        no_end_date: !campaign.end_date,
        keywords: campaign.keywords || '',
        products: campaign.products || [],
        notes: campaign.notes || ''
      });
    } else {
      setEditingCampaign(null);
      setFormData({
        platform: 'amazon',
        campaign_type: 'sponsored_products',
        campaign_name: '',
        objective: 'sales',
        daily_budget: '',
        default_bid: '',
        targeting_type: 'automatic',
        bid_strategy: 'dynamic_down',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        no_end_date: true,
        keywords: '',
        products: [],
        notes: ''
      });
    }
    setShowCampaignModal(true);
  };

  // Save campaign
  const saveCampaign = async (status = 'planned') => {
    if (!formData.campaign_name.trim()) {
      toast.error('Campaign name is required');
      return;
    }
    if (!formData.daily_budget || parseFloat(formData.daily_budget) <= 0) {
      toast.error('Valid daily budget is required');
      return;
    }
    if (!formData.start_date) {
      toast.error('Start date is required');
      return;
    }

    const token = localStorage.getItem('adminToken');
    const payload = {
      ...formData,
      daily_budget: parseFloat(formData.daily_budget),
      default_bid: formData.default_bid ? parseFloat(formData.default_bid) : null,
      end_date: formData.no_end_date ? null : formData.end_date,
      status: editingCampaign ? undefined : status
    };
    
    delete payload.no_end_date;

    try {
      const url = editingCampaign 
        ? `${API_URL}/api/admin/ad-campaigns/${editingCampaign.id}`
        : `${API_URL}/api/admin/ad-campaigns`;
      
      const response = await fetch(url, {
        method: editingCampaign ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(editingCampaign ? 'Campaign updated' : 'Campaign created');
        setShowCampaignModal(false);
        fetchData();
      } else {
        toast.error(data.detail || 'Failed to save campaign');
      }
    } catch (err) {
      console.error('Error saving campaign:', err);
      toast.error('Failed to save campaign');
    }
  };

  // Open performance modal
  const openPerformanceModal = (campaign) => {
    setEditingCampaign(campaign);
    setPerfData({
      spent_mtd: campaign.performance?.spent_mtd?.toString() || '',
      sales_mtd: campaign.performance?.sales_mtd?.toString() || '',
      impressions_mtd: campaign.performance?.impressions_mtd?.toString() || '',
      clicks_mtd: campaign.performance?.clicks_mtd?.toString() || '',
      orders_mtd: campaign.performance?.orders_mtd?.toString() || ''
    });
    // Set default date to today and nearest time slot
    const today = new Date().toISOString().split('T')[0];
    setPerfDate(today);
    setPerfTimeSlot(getNearestTimeSlot());
    setShowPerformanceModal(true);
  };

  // Open history modal
  const openHistoryModal = (campaign) => {
    setEditingCampaign(campaign);
    setHistoryDateRange('all');
    setHistoryMetrics({ roas: true, spent: true, sales: false });
    setShowHistoryModal(true);
  };

  // Get filtered history data based on date range
  const getFilteredHistory = () => {
    if (!editingCampaign?.performance_history) return [];
    
    const history = [...editingCampaign.performance_history];
    const now = new Date();
    
    let filtered = history;
    if (historyDateRange === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = history.filter(h => new Date(h.timestamp) >= sevenDaysAgo);
    } else if (historyDateRange === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = history.filter(h => new Date(h.timestamp) >= thirtyDaysAgo);
    }
    
    // Sort by timestamp ascending for chart
    return filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };
  
  // Calculate incremental daily aggregated data for chart display
  // This transforms cumulative MTD values into daily incremental changes
  const getDailyIncrementalData = useMemo(() => {
    const rawHistory = getFilteredHistory();
    if (!rawHistory || rawHistory.length === 0) return [];
    
    // Sort by timestamp ascending
    const sorted = [...rawHistory].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Group entries by date (YYYY-MM-DD)
    const byDate = {};
    sorted.forEach(entry => {
      const date = new Date(entry.timestamp);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!byDate[dateKey]) {
        byDate[dateKey] = [];
      }
      byDate[dateKey].push({
        ...entry,
        spent_mtd: entry.spent_mtd || 0,
        sales_mtd: entry.sales_mtd || 0,
        orders_mtd: entry.orders_mtd || 0
      });
    });
    
    // Sort dates and calculate incremental values
    const sortedDates = Object.keys(byDate).sort();
    const dailyData = [];
    
    let previousDayLastSpent = 0;
    let previousDayLastSales = 0;
    let previousDayLastOrders = 0;
    
    sortedDates.forEach((dateKey, index) => {
      const dayEntries = byDate[dateKey];
      // Sort entries within the day by timestamp
      dayEntries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Get first and last entry of the day
      const firstEntry = dayEntries[0];
      const lastEntry = dayEntries[dayEntries.length - 1];
      
      // For the first day, use the first entry as the baseline
      // For subsequent days, calculate delta from previous day's last entry
      let dailySpent, dailySales, dailyOrders;
      
      if (index === 0) {
        // First day: calculate delta within the day
        dailySpent = lastEntry.spent_mtd - firstEntry.spent_mtd;
        dailySales = lastEntry.sales_mtd - firstEntry.sales_mtd;
        dailyOrders = lastEntry.orders_mtd - firstEntry.orders_mtd;
        
        // If only one entry on first day, show the raw values (or 0 for a cleaner start)
        if (dayEntries.length === 1) {
          dailySpent = 0;
          dailySales = 0;
          dailyOrders = 0;
        }
      } else {
        // Subsequent days: delta from previous day's last entry
        dailySpent = lastEntry.spent_mtd - previousDayLastSpent;
        dailySales = lastEntry.sales_mtd - previousDayLastSales;
        dailyOrders = lastEntry.orders_mtd - previousDayLastOrders;
      }
      
      // Treat negative values as 0 (data corrections)
      dailySpent = Math.max(0, dailySpent);
      dailySales = Math.max(0, dailySales);
      dailyOrders = Math.max(0, dailyOrders);
      
      // Calculate ROAS and ACoS for the day
      const dailyRoas = dailySpent > 0 ? dailySales / dailySpent : 0;
      const dailyAcos = dailySales > 0 ? (dailySpent / dailySales) * 100 : 0;
      
      // Format date for display
      const date = new Date(dateKey);
      const formattedDate = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      
      dailyData.push({
        date: dateKey,
        displayDate: formattedDate,
        dailySpent: Math.round(dailySpent),
        dailySales: Math.round(dailySales),
        dailyOrders: dailyOrders,
        dailyRoas: parseFloat(dailyRoas.toFixed(2)),
        dailyAcos: parseFloat(dailyAcos.toFixed(1)),
        entriesCount: dayEntries.length,
        // Keep cumulative values for reference
        cumulativeSpent: lastEntry.spent_mtd,
        cumulativeSales: lastEntry.sales_mtd,
        cumulativeOrders: lastEntry.orders_mtd
      });
      
      // Update previous day's last values
      previousDayLastSpent = lastEntry.spent_mtd;
      previousDayLastSales = lastEntry.sales_mtd;
      previousDayLastOrders = lastEntry.orders_mtd;
    });
    
    return dailyData;
  }, [editingCampaign?.performance_history, historyDateRange]);

  // Get individual entry data for table display (not grouped by date)
  // Each performance entry gets its own row with incremental values calculated from previous entry
  const getIndividualEntryData = useMemo(() => {
    const rawHistory = getFilteredHistory();
    if (!rawHistory || rawHistory.length === 0) return [];
    
    // Sort by timestamp ascending for delta calculation
    const sorted = [...rawHistory].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    const entries = [];
    let previousSpent = 0;
    let previousSales = 0;
    let previousOrders = 0;
    
    sorted.forEach((entry, index) => {
      const date = new Date(entry.timestamp);
      const dateKey = date.toISOString().split('T')[0];
      const timeSlotLabel = getTimeSlotLabel(entry.timestamp);
      const formattedDate = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      
      // Current entry's cumulative values
      const currentSpent = entry.spent_mtd || 0;
      const currentSales = entry.sales_mtd || 0;
      const currentOrders = entry.orders_mtd || 0;
      
      // Calculate incremental values (delta from previous entry)
      let dailySpent, dailySales, dailyOrders;
      
      if (index === 0) {
        // First entry - show zeros or the raw values
        dailySpent = 0;
        dailySales = 0;
        dailyOrders = 0;
      } else {
        dailySpent = currentSpent - previousSpent;
        dailySales = currentSales - previousSales;
        dailyOrders = currentOrders - previousOrders;
      }
      
      // Treat negative values as 0 (data corrections)
      dailySpent = Math.max(0, dailySpent);
      dailySales = Math.max(0, dailySales);
      dailyOrders = Math.max(0, dailyOrders);
      
      // Calculate ROAS and ACoS
      const dailyRoas = dailySpent > 0 ? dailySales / dailySpent : 0;
      const dailyAcos = dailySales > 0 ? (dailySpent / dailySales) * 100 : 0;
      
      entries.push({
        id: entry._id || index,
        date: dateKey,
        displayDate: formattedDate,
        timeSlot: timeSlotLabel,
        timestamp: entry.timestamp,
        dailySpent: Math.round(dailySpent),
        dailySales: Math.round(dailySales),
        dailyOrders: dailyOrders,
        dailyRoas: parseFloat(dailyRoas.toFixed(2)),
        dailyAcos: parseFloat(dailyAcos.toFixed(1)),
        // Cumulative values for reference
        cumulativeSpent: currentSpent,
        cumulativeSales: currentSales,
        cumulativeOrders: currentOrders
      });
      
      // Update previous values for next iteration
      previousSpent = currentSpent;
      previousSales = currentSales;
      previousOrders = currentOrders;
    });
    
    // Reverse for display (most recent first) and calculate isNewDate in reversed order
    const reversed = entries.reverse();
    let lastDateKey = null;
    reversed.forEach((entry) => {
      entry.isNewDate = entry.date !== lastDateKey;
      lastDateKey = entry.date;
    });
    
    return reversed;
  }, [editingCampaign?.performance_history, historyDateRange]);

  // Format history date for display (with time slot label)
  const formatHistoryDate = (timestamp) => {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric'
    });
    const slotLabel = getTimeSlotLabel(timestamp);
    return `${dateStr}, ${slotLabel}`;
  };

  // Save performance
  const savePerformance = async () => {
    const token = localStorage.getItem('adminToken');
    
    // Combine date and time slot into timestamp
    const timestamp = `${perfDate}T${perfTimeSlot}:00`;
    
    const payload = {
      spent_mtd: perfData.spent_mtd ? parseFloat(perfData.spent_mtd) : 0,
      sales_mtd: perfData.sales_mtd ? parseFloat(perfData.sales_mtd) : 0,
      impressions_mtd: perfData.impressions_mtd ? parseInt(perfData.impressions_mtd) : 0,
      clicks_mtd: perfData.clicks_mtd ? parseInt(perfData.clicks_mtd) : 0,
      orders_mtd: perfData.orders_mtd ? parseInt(perfData.orders_mtd) : 0,
      recorded_at: timestamp
    };

    try {
      const response = await fetch(
        `${API_URL}/api/admin/ad-campaigns/${editingCampaign.id}/performance`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Performance updated');
        setShowPerformanceModal(false);
        fetchData();
      } else {
        toast.error(data.detail || 'Failed to update performance');
      }
    } catch (err) {
      console.error('Error updating performance:', err);
      toast.error('Failed to update performance');
    }
  };

  // Toggle campaign status
  const toggleCampaignStatus = async (campaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    const token = localStorage.getItem('adminToken');

    try {
      const response = await fetch(
        `${API_URL}/api/admin/ad-campaigns/${campaign.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success(`Campaign ${newStatus}`);
        fetchData();
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      toast.error('Failed to update status');
    }
  };

  // Delete campaign
  const deleteCampaign = async () => {
    const campaign = deleteConfirm.campaign;
    if (!campaign) return;
    
    setDeleteConfirm({ show: false, campaign: null });
    
    const token = localStorage.getItem('adminToken');

    try {
      const response = await fetch(
        `${API_URL}/api/admin/ad-campaigns/${campaign.id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Campaign deleted');
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting campaign:', err);
      toast.error('Failed to delete campaign');
    }
  };
  
  // Show delete confirmation
  const confirmDeleteCampaign = (campaign) => {
    setDeleteConfirm({ show: true, campaign });
  };

  // Calculate preview metrics for performance modal
  const calcPreviewMetrics = () => {
    const spent = parseFloat(perfData.spent_mtd) || 0;
    const sales = parseFloat(perfData.sales_mtd) || 0;
    const impressions = parseInt(perfData.impressions_mtd) || 0;
    const clicks = parseInt(perfData.clicks_mtd) || 0;
    const orders = parseInt(perfData.orders_mtd) || 0;
    
    return {
      roas: spent > 0 ? (sales / spent).toFixed(2) : '0.00',
      acos: sales > 0 ? ((spent / sales) * 100).toFixed(1) : '0.0',
      ctr: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00',
      cvr: clicks > 0 ? ((orders / clicks) * 100).toFixed(2) : '0.00'
    };
  };

  // Group playbooks by platform
  const groupedPlaybooks = playbooks.reduce((acc, p) => {
    if (!acc[p.platform]) acc[p.platform] = [];
    acc[p.platform].push(p);
    return acc;
  }, {});

  // Calculate blended ACoS
  const blendedAcos = stats.total_sales_mtd > 0 
    ? ((stats.total_spent_mtd / stats.total_sales_mtd) * 100).toFixed(1)
    : 0;

  // Calculate YTD stats (Year-to-Date)
  // For now, YTD = MTD since we only have Feb 2026 data
  // In future months, YTD will accumulate across months
  const ytdStats = useMemo(() => {
    // Use stats.total_spent_mtd and stats.total_sales_mtd as YTD
    // These already sum all campaigns' current values
    const totalSpentYTD = stats.total_spent_mtd || 0;
    const totalSalesYTD = stats.total_sales_mtd || 0;
    
    const roasYTD = totalSpentYTD > 0 ? (totalSalesYTD / totalSpentYTD).toFixed(2) : '0.00';
    
    return {
      spent: totalSpentYTD,
      sales: totalSalesYTD,
      roas: roasYTD
    };
  }, [stats.total_spent_mtd, stats.total_sales_mtd]);

  return (
    <div className="space-y-3">
      {/* ROAS Alert Banner */}
      {roasAlerts.has_alerts && (
        <div className={`rounded-lg p-4 ${
          roasAlerts.critical_count > 0 
            ? 'bg-red-500/20 border border-red-500/40' 
            : 'bg-amber-500/20 border border-amber-500/40'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                roasAlerts.critical_count > 0 
                  ? 'bg-red-500/30' 
                  : 'bg-amber-500/30'
              }`}>
                <AlertCircle className={`w-5 h-5 ${
                  roasAlerts.critical_count > 0 
                    ? 'text-red-400' 
                    : 'text-amber-400'
                }`} />
              </div>
              <div>
                <h3 className={`font-semibold ${
                  roasAlerts.critical_count > 0 
                    ? 'text-red-400' 
                    : 'text-amber-400'
                }`}>
                  {roasAlerts.critical_count > 0 
                    ? `${roasAlerts.critical_count} Campaign${roasAlerts.critical_count > 1 ? 's' : ''} with Critical ROAS` 
                    : `${roasAlerts.warning_count} Campaign${roasAlerts.warning_count > 1 ? 's' : ''} Underperforming`
                  }
                </h3>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                  {roasAlerts.critical_count > 0 
                    ? 'ROAS below 1.0x - spending more than earning. Immediate action required.'
                    : 'ROAS between 1.0x-1.5x - breaking even but below optimal performance.'
                  }
                </p>
                
                {/* Expandable Alert Details */}
                {showAlertDetails && (
                  <div className="mt-3 space-y-2">
                    {roasAlerts.critical_alerts.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between bg-red-500/10 rounded-md px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {alert.campaign_name}
                          </span>
                          <span className="text-xs text-slate-400">({alert.platform})</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-red-400 font-semibold">{alert.roas}x ROAS</span>
                          <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                            Loss: {formatCurrency(alert.loss)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {roasAlerts.warning_alerts.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between bg-amber-500/10 rounded-md px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {alert.campaign_name}
                          </span>
                          <span className="text-xs text-slate-400">({alert.platform})</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-amber-400 font-semibold">{alert.roas}x ROAS</span>
                          <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                            Spent: {formatCurrency(alert.spent)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setShowAlertDetails(!showAlertDetails)}
              className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                roasAlerts.critical_count > 0 
                  ? 'text-red-400 hover:bg-red-500/20' 
                  : 'text-amber-400 hover:bg-amber-500/20'
              }`}
              data-testid="toggle-roas-alert-details"
            >
              {showAlertDetails ? 'Hide Details' : 'View Details'}
            </button>
          </div>
        </div>
      )}

      {/* Compact Stats Cards - MTD and YTD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {/* MTD Cards */}
        <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <DollarSign className="w-3.5 h-3.5 text-teal-400" />
            <span className={`text-[10px] uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Daily Budget
            </span>
          </div>
          <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {loading ? '...' : formatCurrency(stats.total_daily_budget)}
          </div>
        </div>

        <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Target className="w-3.5 h-3.5 text-orange-400" />
            <span className={`text-[10px] uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Spent MTD
            </span>
          </div>
          <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {loading ? '...' : formatCurrency(stats.total_spent_mtd)}
          </div>
        </div>

        <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Activity className="w-3.5 h-3.5 text-green-400" />
            <span className={`text-[10px] uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Sales MTD
            </span>
          </div>
          <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {loading ? '...' : formatCurrency(stats.total_sales_mtd)}
          </div>
        </div>

        <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            <span className={`text-[10px] uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              ROAS MTD
            </span>
          </div>
          <div className={`text-xl font-bold ${getRoasColor(stats.blended_roas)}`}>
            {loading ? '...' : `${stats.blended_roas || 0}x`}
          </div>
        </div>

        <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Percent className="w-3.5 h-3.5 text-blue-400" />
            <span className={`text-[10px] uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              ACoS MTD
            </span>
          </div>
          <div className={`text-xl font-bold ${getAcosColor(parseFloat(blendedAcos))}`}>
            {loading ? '...' : `${blendedAcos}%`}
          </div>
        </div>

        {/* YTD Cards */}
        <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-800/80 border border-amber-500/20' : 'bg-amber-50 shadow-sm'}`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span className={`text-[10px] uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-amber-400/80' : 'text-amber-600'}`}>
              Spent YTD
            </span>
          </div>
          <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {loading ? '...' : formatCurrency(ytdStats.spent)}
          </div>
        </div>

        <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-800/80 border border-amber-500/20' : 'bg-amber-50 shadow-sm'}`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span className={`text-[10px] uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-amber-400/80' : 'text-amber-600'}`}>
              Sales YTD
            </span>
          </div>
          <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {loading ? '...' : formatCurrency(ytdStats.sales)}
          </div>
        </div>

        <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-800/80 border border-amber-500/20' : 'bg-amber-50 shadow-sm'}`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span className={`text-[10px] uppercase tracking-wider whitespace-nowrap ${isDarkMode ? 'text-amber-400/80' : 'text-amber-600'}`}>
              ROAS YTD
            </span>
          </div>
          <div className={`text-xl font-bold ${getRoasColor(parseFloat(ytdStats.roas))}`}>
            {loading ? '...' : `${ytdStats.roas}x`}
          </div>
        </div>
      </div>

      {/* Campaigns Section */}
      <div className={`rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
        {/* Compact Header with filters */}
        <div className="px-3 py-2 border-b border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Campaigns
            </h2>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
              {filteredCampaigns.length}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className={`text-xs px-2 py-1 rounded border ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <option value="all">All Platforms</option>
              <option value="amazon">Amazon</option>
              <option value="flipkart">Flipkart</option>
              <option value="google">Google Ads</option>
              <option value="jiomart">Jiomart</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`text-xs px-2 py-1 rounded border ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="planned">Planned</option>
            </select>

            <button
              onClick={fetchData}
              className={`p-1.5 rounded ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} />
            </button>
            
            {/* Google Ads Sync Button with Status */}
            <div className="flex items-center gap-1">
              {/* Status indicator */}
              {googleAdsStatus.status === 'ready' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" title="Google Ads configured" />
              ) : googleAdsStatus.status === 'incomplete' ? (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" title={googleAdsStatus.message || 'Missing credentials'} />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-slate-400" title="Not configured" />
              )}
              
              <button
                onClick={handleGoogleSync}
                disabled={googleSyncing}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
                  googleSyncing 
                    ? 'bg-green-600/50 text-green-300 cursor-not-allowed'
                    : googleAdsStatus.configured
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                }`}
                title={
                  googleAdsStatus.configured 
                    ? (googleLastSynced ? `Last synced: ${new Date(googleLastSynced).toLocaleString()}` : 'Click to sync Google Ads')
                    : `${googleAdsStatus.message || 'Configure in Settings > API Settings'}`
                }
                data-testid="sync-google-ads-btn"
              >
                {googleSyncing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                <span>Sync Google</span>
              </button>
            </div>

            <button
              onClick={() => openCampaignModal()}
              className="flex items-center gap-1 px-2 py-1 bg-teal-500 hover:bg-teal-600 text-white rounded text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        </div>

        {/* Compact Campaigns Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              <BarChart2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No campaigns found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-[10px] uppercase tracking-wide ${isDarkMode ? 'text-slate-400 bg-slate-900/50' : 'text-gray-500 bg-gray-50'}`}>
                  <th className="px-3 py-2 text-left">Platform</th>
                  <th className="px-3 py-2 text-left">Campaign</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-right">Budget</th>
                  <th className="px-3 py-2 text-right">Spent</th>
                  <th className="px-3 py-2 text-right">Sales</th>
                  <th className="px-3 py-2 text-right">ROAS</th>
                  <th className="px-3 py-2 text-right">ACoS</th>
                  <th className="px-3 py-2 text-center">Status</th>
                  <th className="px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-gray-100'}`}>
                {filteredCampaigns.map((campaign) => {
                  const platformConfig = PLATFORMS[campaign.platform] || PLATFORMS.amazon;
                  const PlatformIcon = platformConfig.Icon;
                  const lastUpdated = formatRelativeTime(campaign.performance?.last_updated);
                  const acos = campaign.performance?.sales_mtd > 0 
                    ? ((campaign.performance?.spent_mtd || 0) / campaign.performance.sales_mtd * 100).toFixed(1)
                    : null;
                  
                  return (
                    <tr 
                      key={campaign.id}
                      className={`${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${platformConfig.color} text-white`}>
                          <PlatformIcon className="w-3 h-3" />
                          {platformConfig.name}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getHealthColor(campaign)}`} />
                          <div>
                            <div className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {campaign.campaign_name}
                            </div>
                            <div className={`text-[10px] ${lastUpdated.color}`}>
                              Updated {lastUpdated.text}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                          {campaign.campaign_type?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className={`px-3 py-2 text-right text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        {formatCurrency(campaign.daily_budget)}
                      </td>
                      <td className={`px-3 py-2 text-right text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        {formatCurrency(campaign.performance?.spent_mtd || 0)}
                      </td>
                      <td className={`px-3 py-2 text-right text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        {formatCurrency(campaign.performance?.sales_mtd || 0)}
                      </td>
                      <td className={`px-3 py-2 text-right text-xs font-semibold ${getRoasColor(campaign.roas)}`}>
                        {campaign.roas || 0}x
                      </td>
                      <td className={`px-3 py-2 text-right text-xs font-semibold ${getAcosColor(parseFloat(acos))}`}>
                        {acos !== null ? `${acos}%` : '-'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_COLORS[campaign.status] || STATUS_COLORS.planned}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => openCampaignModal(campaign)}
                            className={`p-1 rounded ${isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-200'}`}
                            title="Edit Campaign"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          <button
                            onClick={() => openPerformanceModal(campaign)}
                            className={`p-1 rounded ${isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-200'}`}
                            title="Update Performance"
                          >
                            <BarChart2 className="w-3.5 h-3.5 text-teal-400" />
                          </button>
                          <button
                            onClick={() => openHistoryModal(campaign)}
                            className={`p-1 rounded ${isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-200'}`}
                            title="View Performance History"
                          >
                            <LineChart className="w-3.5 h-3.5 text-purple-400" />
                          </button>
                          <button
                            onClick={() => toggleCampaignStatus(campaign)}
                            className={`p-1 rounded ${isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-200'}`}
                            title={campaign.status === 'active' ? 'Pause Campaign' : 'Resume Campaign'}
                          >
                            {campaign.status === 'active' 
                              ? <Pause className="w-3.5 h-3.5 text-yellow-400" />
                              : <Play className="w-3.5 h-3.5 text-green-400" />
                            }
                          </button>
                          <button
                            onClick={() => confirmDeleteCampaign(campaign)}
                            className={`p-1 rounded ${isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-200'}`}
                            title="Delete Campaign"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Compact Playbooks Section */}
      <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
        <div className="mb-2">
          <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Campaign Playbooks
          </h2>
          <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Best practices and setup guides
          </p>
        </div>

        {Object.entries(groupedPlaybooks).map(([platform, platformPlaybooks]) => {
          const platformConfig = PLATFORMS[platform] || PLATFORMS.amazon;
          const PlatformIcon = platformConfig.Icon;
          return (
            <div key={platform} className="mb-2">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${platformConfig.color} text-white`}>
                  <PlatformIcon className="w-3 h-3" />
                  {platformConfig.name}
                </span>
              </div>
              <div className="space-y-1">
                {platformPlaybooks.map((playbook) => (
                  <div 
                    key={playbook.id}
                    className={`rounded border ${isDarkMode ? 'border-slate-700 bg-slate-900/30' : 'border-gray-200 bg-gray-50'}`}
                  >
                    <button
                      onClick={() => setExpandedPlaybooks(prev => ({
                        ...prev,
                        [playbook.id]: !prev[playbook.id]
                      }))}
                      className="w-full px-3 py-2 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {playbook.title}
                        </span>
                        {playbook.target_roas && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
                            {playbook.target_roas}x
                          </span>
                        )}
                      </div>
                      {expandedPlaybooks[playbook.id] 
                        ? <ChevronDown className="w-4 h-4 text-slate-400" />
                        : <ChevronRight className="w-4 h-4 text-slate-400" />
                      }
                    </button>
                    {expandedPlaybooks[playbook.id] && (
                      <div className={`px-3 pb-3 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                        {playbook.recommended_budget_min && playbook.recommended_budget_max && (
                          <div className={`mt-2 text-xs ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                            Budget: {formatCurrency(playbook.recommended_budget_min)} - {formatCurrency(playbook.recommended_budget_max)} / day
                          </div>
                        )}
                        <div className={`mt-2 whitespace-pre-wrap text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                          {playbook.content}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Compact Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
              <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingCampaign ? 'Edit Campaign' : 'New Campaign'}
              </h3>
              <button onClick={() => setShowCampaignModal(false)}>
                <X className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Row 1: Platform & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Platform <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => {
                      const newPlatform = e.target.value;
                      const newTypes = CAMPAIGN_TYPES[newPlatform] || [];
                      setFormData({
                        ...formData,
                        platform: newPlatform,
                        campaign_type: newTypes[0]?.value || ''
                      });
                    }}
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="amazon">Amazon</option>
                    <option value="flipkart">Flipkart</option>
                    <option value="google">Google Ads</option>
                    <option value="jiomart">Jiomart</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Campaign Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.campaign_type}
                    onChange={(e) => setFormData({ ...formData, campaign_type: e.target.value })}
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    {(CAMPAIGN_TYPES[formData.platform] || []).map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Name & Objective */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Campaign Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.campaign_name}
                    onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                    placeholder="e.g., BarkBite Auto - Jan 2026"
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Objective
                  </label>
                  <select
                    value={formData.objective}
                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="sales">Sales</option>
                    <option value="brand_awareness">Brand Awareness</option>
                    <option value="new_product_launch">New Product Launch</option>
                    <option value="clearance">Clearance</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Budget & Bid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Daily Budget (₹) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.daily_budget}
                    onChange={(e) => setFormData({ ...formData, daily_budget: e.target.value })}
                    placeholder="500"
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Default Bid (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.default_bid}
                    onChange={(e) => setFormData({ ...formData, default_bid: e.target.value })}
                    placeholder="20"
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>

              {/* Row 4: Targeting & Bid Strategy */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Targeting Type
                  </label>
                  <select
                    value={formData.targeting_type}
                    onChange={(e) => setFormData({ ...formData, targeting_type: e.target.value })}
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="automatic">Automatic</option>
                    <option value="manual_keywords">Manual Keywords</option>
                    <option value="product_targeting">Product Targeting</option>
                    <option value="category">Category</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Bid Strategy
                  </label>
                  <select
                    value={formData.bid_strategy}
                    onChange={(e) => setFormData({ ...formData, bid_strategy: e.target.value })}
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="dynamic_up_down">Dynamic - Up and Down</option>
                    <option value="dynamic_down">Dynamic - Down Only</option>
                    <option value="fixed">Fixed Bids</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Start Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    End Date
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value, no_end_date: false })}
                      disabled={formData.no_end_date}
                      className={`flex-1 px-2 py-1.5 text-sm rounded border ${
                        isDarkMode 
                          ? 'bg-slate-700 border-slate-600 text-white disabled:opacity-50'
                          : 'bg-white border-gray-200 text-gray-900 disabled:opacity-50'
                      }`}
                    />
                    <label className="flex items-center gap-1 text-[10px]">
                      <input
                        type="checkbox"
                        checked={formData.no_end_date}
                        onChange={(e) => setFormData({ ...formData, no_end_date: e.target.checked, end_date: '' })}
                        className="rounded"
                      />
                      <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>None</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Keywords */}
              {formData.targeting_type === 'manual_keywords' && (
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Keywords
                  </label>
                  <textarea
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="Enter keywords, one per line"
                    rows={3}
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Strategy notes, goals, etc."
                  rows={2}
                  className={`w-full px-2 py-1.5 text-sm rounded border ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Products Multi-Select */}
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Products
                </label>
                <div className={`border rounded ${isDarkMode ? 'border-slate-600 bg-slate-700' : 'border-gray-200 bg-white'}`}>
                  <div 
                    className={`px-2 py-1.5 text-sm cursor-pointer flex items-center justify-between ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
                    onClick={() => setShowProductDropdown(!showProductDropdown)}
                  >
                    <span>
                      {formData.products.length > 0 
                        ? `${formData.products.length} product${formData.products.length > 1 ? 's' : ''} selected`
                        : 'Select products...'
                      }
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showProductDropdown ? 'rotate-180' : ''}`} />
                  </div>
                  {showProductDropdown && (
                    <div className={`border-t max-h-40 overflow-y-auto ${isDarkMode ? 'border-slate-600' : 'border-gray-200'}`}>
                      {products.length === 0 ? (
                        <div className={`px-2 py-2 text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          No products available
                        </div>
                      ) : (
                        products.map((product) => {
                          const productId = product._id || product.id;
                          const isSelected = formData.products.includes(productId);
                          return (
                            <label 
                              key={productId}
                              className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:${isDarkMode ? 'bg-slate-600' : 'bg-gray-50'}`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  setFormData({
                                    ...formData,
                                    products: isSelected
                                      ? formData.products.filter(id => id !== productId)
                                      : [...formData.products, productId]
                                  });
                                }}
                                className="rounded text-teal-500 focus:ring-teal-500"
                              />
                              <span className={`text-xs flex-1 ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                                {product.name}
                              </span>
                              <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                ₹{product.price || product.salePrice || 0}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
                {formData.products.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {formData.products.map(productId => {
                      const product = products.find(p => (p._id || p.id) === productId);
                      return product ? (
                        <span 
                          key={productId}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
                            isDarkMode ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-100 text-teal-700'
                          }`}
                        >
                          {product.name.length > 20 ? product.name.slice(0, 20) + '...' : product.name}
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              products: formData.products.filter(id => id !== productId)
                            })}
                            className="hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={`sticky bottom-0 flex items-center justify-end gap-2 px-4 py-3 border-t ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
              <button
                onClick={() => setShowCampaignModal(false)}
                className={`px-3 py-1.5 text-sm rounded ${
                  isDarkMode 
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              {editingCampaign ? (
                <button
                  onClick={() => saveCampaign()}
                  className="px-3 py-1.5 text-sm bg-teal-500 hover:bg-teal-600 text-white rounded font-medium"
                >
                  Update
                </button>
              ) : (
                <>
                  <button
                    onClick={() => saveCampaign('planned')}
                    className={`px-3 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Save Planned
                  </button>
                  <button
                    onClick={() => saveCampaign('active')}
                    className="px-3 py-1.5 text-sm bg-teal-500 hover:bg-teal-600 text-white rounded font-medium"
                  >
                    Save Active
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compact Performance Modal */}
      {showPerformanceModal && editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`w-full max-w-sm rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <div>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Update Performance
                </h3>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  {editingCampaign.campaign_name}
                </p>
              </div>
              <button onClick={() => setShowPerformanceModal(false)}>
                <X className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Date and Time Slot Selection */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Data Recorded At
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={perfDate}
                    onChange={(e) => setPerfDate(e.target.value)}
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                  <select
                    value={perfTimeSlot}
                    onChange={(e) => setPerfTimeSlot(e.target.value)}
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    {TIME_SLOTS.map(slot => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Spent MTD (₹)
                  </label>
                  <input
                    type="number"
                    value={perfData.spent_mtd}
                    onChange={(e) => setPerfData({ ...perfData, spent_mtd: e.target.value })}
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Sales MTD (₹)
                  </label>
                  <input
                    type="number"
                    value={perfData.sales_mtd}
                    onChange={(e) => setPerfData({ ...perfData, sales_mtd: e.target.value })}
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={`block text-[10px] font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Impressions
                  </label>
                  <input
                    type="number"
                    value={perfData.impressions_mtd}
                    onChange={(e) => setPerfData({ ...perfData, impressions_mtd: e.target.value })}
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Clicks
                  </label>
                  <input
                    type="number"
                    value={perfData.clicks_mtd}
                    onChange={(e) => setPerfData({ ...perfData, clicks_mtd: e.target.value })}
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Orders
                  </label>
                  <input
                    type="number"
                    value={perfData.orders_mtd}
                    onChange={(e) => setPerfData({ ...perfData, orders_mtd: e.target.value })}
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              {/* Preview Metrics */}
              <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                <p className={`text-[10px] font-medium mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Calculated Metrics
                </p>
                <div className="grid grid-cols-4 gap-1 text-center">
                  <div>
                    <div className={`text-sm font-bold ${getRoasColor(parseFloat(calcPreviewMetrics().roas))}`}>
                      {calcPreviewMetrics().roas}x
                    </div>
                    <div className={`text-[9px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>ROAS</div>
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${getAcosColor(parseFloat(calcPreviewMetrics().acos))}`}>
                      {calcPreviewMetrics().acos}%
                    </div>
                    <div className={`text-[9px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>ACoS</div>
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {calcPreviewMetrics().ctr}%
                    </div>
                    <div className={`text-[9px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>CTR</div>
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {calcPreviewMetrics().cvr}%
                    </div>
                    <div className={`text-[9px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>CVR</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`flex items-center justify-end gap-2 px-4 py-3 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setShowPerformanceModal(false)}
                className={`px-3 py-1.5 text-sm rounded ${
                  isDarkMode 
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={savePerformance}
                className="px-3 py-1.5 text-sm bg-teal-500 hover:bg-teal-600 text-white rounded font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Performance History Modal */}
      {showHistoryModal && editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`w-full max-w-2xl rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white'} max-h-[90vh] overflow-hidden flex flex-col`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <div>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Performance History
                </h3>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  {editingCampaign.campaign_name}
                </p>
              </div>
              <button onClick={() => setShowHistoryModal(false)}>
                <X className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Date Range Filter */}
              <div className="flex items-center gap-2">
                <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Period:</span>
                {['7days', '30days', 'all'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setHistoryDateRange(range)}
                    className={`px-2 py-1 text-xs rounded ${
                      historyDateRange === range
                        ? 'bg-teal-500 text-white'
                        : isDarkMode 
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range === '7days' ? 'Last 7 Days' : range === '30days' ? 'Last 30 Days' : 'All Time'}
                  </button>
                ))}
              </div>

              {/* Metrics Toggle */}
              <div className="flex items-center gap-4">
                <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Show:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={historyMetrics.roas}
                    onChange={(e) => setHistoryMetrics({ ...historyMetrics, roas: e.target.checked })}
                    className="w-3 h-3 rounded accent-teal-500"
                  />
                  <span className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>ROAS</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={historyMetrics.spent}
                    onChange={(e) => setHistoryMetrics({ ...historyMetrics, spent: e.target.checked })}
                    className="w-3 h-3 rounded accent-orange-500"
                  />
                  <span className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Spent</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={historyMetrics.sales}
                    onChange={(e) => setHistoryMetrics({ ...historyMetrics, sales: e.target.checked })}
                    className="w-3 h-3 rounded accent-green-500"
                  />
                  <span className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Sales</span>
                </label>
              </div>

              {/* Chart - Shows incremental daily data */}
              {getDailyIncrementalData.length > 0 ? (
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                  <div className="mb-2">
                    <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      Daily Incremental Performance (not cumulative MTD)
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={getDailyIncrementalData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e5e7eb'} />
                      <XAxis 
                        dataKey="displayDate" 
                        tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#6b7280' }}
                        stroke={isDarkMode ? '#475569' : '#d1d5db'}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis 
                        yAxisId="left"
                        tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#6b7280' }}
                        stroke={isDarkMode ? '#475569' : '#d1d5db'}
                        domain={[0, 'auto']}
                        tickFormatter={(value) => `₹${value}`}
                        label={{ value: 'Spent (₹)', angle: -90, position: 'insideLeft', fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#6b7280' }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#6b7280' }}
                        stroke={isDarkMode ? '#475569' : '#d1d5db'}
                        domain={[0, 'auto']}
                        tickFormatter={(value) => `${value}x`}
                        label={{ value: 'ROAS', angle: 90, position: 'insideRight', fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#6b7280' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                          border: isDarkMode ? '1px solid #334155' : '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '11px'
                        }}
                        formatter={(value, name) => {
                          if (name === 'Daily Spent') return [`₹${value.toLocaleString()}`, name];
                          if (name === 'Daily Sales') return [`₹${value.toLocaleString()}`, name];
                          if (name === 'ROAS') return [`${value}x`, name];
                          return [value, name];
                        }}
                        labelFormatter={(label) => label}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      
                      {/* Break-even reference line at ROAS = 1.0 */}
                      {historyMetrics.roas && (
                        <ReferenceLine 
                          yAxisId="right" 
                          y={1} 
                          stroke="#ef4444" 
                          strokeDasharray="4 4" 
                          strokeWidth={1}
                          label={{ value: 'Break-even', position: 'right', fontSize: 9, fill: '#ef4444' }}
                        />
                      )}
                      
                      {historyMetrics.spent && (
                        <Bar 
                          yAxisId="left"
                          dataKey="dailySpent" 
                          fill="#f97316" 
                          name="Daily Spent"
                          radius={[4, 4, 0, 0]}
                          barSize={30}
                        />
                      )}
                      {historyMetrics.sales && (
                        <Bar 
                          yAxisId="left"
                          dataKey="dailySales" 
                          fill="#22c55e" 
                          name="Daily Sales"
                          radius={[4, 4, 0, 0]}
                          barSize={30}
                        />
                      )}
                      {historyMetrics.roas && (
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="dailyRoas" 
                          stroke="#14b8a6" 
                          strokeWidth={2}
                          dot={{ r: 4, fill: '#14b8a6' }}
                          name="ROAS"
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className={`p-6 text-center rounded-lg ${isDarkMode ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                  <LineChart className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    No history data yet
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    History will be tracked each time you update performance
                  </p>
                </div>
              )}

              {/* History Table - Shows individual entries (not grouped by date) */}
              {getIndividualEntryData.length > 0 && (
                <div>
                  <h4 className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Performance Entries ({getIndividualEntryData.length} entries)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                          <th className="text-left py-2 px-2 font-medium">Date</th>
                          <th className="text-left py-2 px-2 font-medium">Time Slot</th>
                          <th className="text-right py-2 px-2 font-medium">Δ Spent</th>
                          <th className="text-right py-2 px-2 font-medium">Δ Sales</th>
                          <th className="text-right py-2 px-2 font-medium">ROAS</th>
                          <th className="text-right py-2 px-2 font-medium">ACoS</th>
                          <th className="text-right py-2 px-2 font-medium">Δ Orders</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getIndividualEntryData.map((entry, idx) => (
                          <tr 
                            key={entry.id || idx} 
                            className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-100'} ${
                              entry.isNewDate ? '' : isDarkMode ? 'bg-slate-800/30' : 'bg-gray-50/50'
                            }`}
                          >
                            <td className={`py-2 px-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                              {entry.isNewDate ? (
                                <span className="font-medium">{entry.displayDate}</span>
                              ) : (
                                <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>↳</span>
                              )}
                            </td>
                            <td className={`py-2 px-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                              {entry.timeSlot}
                            </td>
                            <td className={`py-2 px-2 text-right ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                              {entry.dailySpent > 0 ? (
                                <span className="text-orange-500">+₹{entry.dailySpent.toLocaleString()}</span>
                              ) : (
                                <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>-</span>
                              )}
                            </td>
                            <td className={`py-2 px-2 text-right ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                              {entry.dailySales > 0 ? (
                                <span className="text-green-500">+₹{entry.dailySales.toLocaleString()}</span>
                              ) : (
                                <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>-</span>
                              )}
                            </td>
                            <td className={`py-2 px-2 text-right font-medium ${getRoasColor(entry.dailyRoas)}`}>
                              {entry.dailyRoas > 0 ? `${entry.dailyRoas.toFixed(2)}x` : '-'}
                            </td>
                            <td className={`py-2 px-2 text-right font-medium ${getAcosColor(entry.dailyAcos)}`}>
                              {entry.dailyAcos > 0 ? `${entry.dailyAcos.toFixed(1)}%` : '-'}
                            </td>
                            <td className={`py-2 px-2 text-right ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                              {entry.dailyOrders > 0 ? (
                                <span className="text-teal-500">+{entry.dailyOrders}</span>
                              ) : (
                                <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {/* Totals row */}
                      <tfoot>
                        <tr className={`border-t-2 ${isDarkMode ? 'border-slate-600 bg-slate-800/50' : 'border-gray-300 bg-gray-100'}`}>
                          <td colSpan="2" className={`py-2 px-2 font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                            Period Total
                          </td>
                          <td className={`py-2 px-2 text-right font-semibold text-orange-500`}>
                            ₹{getIndividualEntryData.reduce((sum, d) => sum + d.dailySpent, 0).toLocaleString()}
                          </td>
                          <td className={`py-2 px-2 text-right font-semibold text-green-500`}>
                            ₹{getIndividualEntryData.reduce((sum, d) => sum + d.dailySales, 0).toLocaleString()}
                          </td>
                          <td className={`py-2 px-2 text-right font-semibold ${getRoasColor(
                            getIndividualEntryData.reduce((sum, d) => sum + d.dailySales, 0) / 
                            Math.max(1, getIndividualEntryData.reduce((sum, d) => sum + d.dailySpent, 0))
                          )}`}>
                            {(getIndividualEntryData.reduce((sum, d) => sum + d.dailySales, 0) / 
                              Math.max(1, getIndividualEntryData.reduce((sum, d) => sum + d.dailySpent, 0))).toFixed(2)}x
                          </td>
                          <td className={`py-2 px-2 text-right font-semibold`}>
                            -
                          </td>
                          <td className={`py-2 px-2 text-right font-semibold text-teal-500`}>
                            +{getIndividualEntryData.reduce((sum, d) => sum + d.dailyOrders, 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-end gap-2 px-4 py-3 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setShowHistoryModal(false)}
                className={`px-3 py-1.5 text-sm rounded ${
                  isDarkMode 
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, campaign: null })}
        onConfirm={deleteCampaign}
        title="Delete Campaign"
        message="Are you sure you want to delete this ad campaign?"
        itemName={deleteConfirm.campaign?.campaign_name}
        warning="This action cannot be undone. All performance history will be lost."
        confirmText="Delete"
        confirmColor="red"
      />
    </div>
  );
};

export default AdCampaignsTab;
