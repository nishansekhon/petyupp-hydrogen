import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { 
  Users, UserPlus, Share2, ShoppingCart, Wallet, Search, 
  Settings, Trophy, CheckCircle, XCircle, Clock, DollarSign,
  TrendingUp, Gift, ExternalLink, RefreshCw, Trash2, Copy, Check, Link,
  Download, Upload, X, Loader2, FileDown, MessageSquare, Edit2, Pencil
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = API_BASE_URL;

// Category options - expanded per task requirements
const CATEGORIES = ['Pet Parent', 'Pet Influencer', 'Vet', 'Pet Store', 'Trainer', 'Vet Staff', 'Blogger', 'Dog Walker', 'Other'];
const TIERS = ['Standard', 'Premium', 'VIP', 'Silver', 'Gold'];
const STATUSES = ['active', 'inactive', 'pending'];

// Generate affiliate code: First 4 letters of name uppercase + 4 random digits
const generateAffiliateCode = (name) => {
  const prefix = name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase().padEnd(4, 'X');
  const suffix = Math.floor(1000 + Math.random() * 9000).toString();
  return prefix + suffix;
};

const AffiliatesTab = () => {
  const { isDarkMode } = useAdminTheme();
  const [activeSubTab, setActiveSubTab] = useState('dashboard');
  
  // Data states
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [affiliates, setAffiliates] = useState([]);
  const [applications, setApplications] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // UGC Import modal states
  const [showUgcImportConfirm, setShowUgcImportConfirm] = useState(false);
  const [showUgcImportResults, setShowUgcImportResults] = useState(false);
  const [ugcImportLoading, setUgcImportLoading] = useState(false);
  const [ugcImportResults, setUgcImportResults] = useState(null);
  const [templateCopied, setTemplateCopied] = useState(false);
  
  // Add/Edit Affiliate modal state
  const [showAffiliateModal, setShowAffiliateModal] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState(null); // null = add mode, object = edit mode
  const [affiliateForm, setAffiliateForm] = useState({
    name: '',
    instagram_handle: '',
    email: '',
    phone: '',
    category: 'Pet Parent',
    tier: 'Standard',
    status: 'active',
    affiliate_code: ''
  });
  const [savingAffiliate, setSavingAffiliate] = useState(false);
  
  // Commission edit/delete state
  const [editingCommission, setEditingCommission] = useState(null); // commission id being edited
  const [editCommForm, setEditCommForm] = useState({});
  const [savingCommission, setSavingCommission] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // commission id pending delete
  const [deletingCommission, setDeletingCommission] = useState(false);
  
  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    first_order_commission: 15,
    repeat_order_commission: 10,
    repeat_commission_months: 6,
    cookie_duration_days: 30,
    min_payout_amount: 500,
    customer_discount_percent: 10
  });

  // Copy affiliate link handler
  const handleCopyLink = (code) => {
    navigator.clipboard.writeText(`https://petyupp.com/?ref=${code}`);
    setCopiedCode(code);
    toast.success('Affiliate link copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const subTabs = [
    { id: 'dashboard', label: 'Dashboard', Icon: TrendingUp },
    { id: 'affiliates', label: 'Affiliates', Icon: Users },
    { id: 'applications', label: `Applications${applications.length > 0 ? ` (${applications.length})` : ''}`, Icon: UserPlus },
    { id: 'commissions', label: 'Commissions', Icon: DollarSign },
    { id: 'payouts', label: 'Payouts', Icon: Wallet },
    { id: 'settings', label: 'Settings', Icon: Settings },
  ];

  // Fetch functions
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/affiliates/stats`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/affiliates-settings`);
      const data = await res.json();
      setSettings(data);
      setSettingsForm({
        first_order_commission: data.first_order_commission || 15,
        repeat_order_commission: data.repeat_order_commission || 10,
        repeat_commission_months: data.repeat_commission_months || 6,
        cookie_duration_days: data.cookie_duration_days || 30,
        min_payout_amount: data.min_payout_amount || 500,
        customer_discount_percent: data.customer_discount_percent || 10
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, []);

  const fetchAffiliates = useCallback(async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/api/admin/affiliates`;
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setAffiliates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching affiliates:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, searchQuery]);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/affiliates/applications`);
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  }, []);

  const fetchCommissions = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/affiliates/commissions`);
      const data = await res.json();
      setCommissions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching commissions:', error);
    }
  }, []);

  // Commission Edit Handlers
  const startEditCommission = (comm) => {
    setEditingCommission(comm.id);
    setEditCommForm({
      affiliate_name: comm.affiliate_name || '',
      order_amount: comm.order_amount || 0,
      commission_rate: comm.commission_rate || 0,
      commission_amount: comm.commission_amount || 0,
      status: comm.status || 'pending',
      created_at: comm.created_at?.split('T')[0] || ''
    });
  };

  const cancelEditCommission = () => {
    setEditingCommission(null);
    setEditCommForm({});
  };

  const saveCommission = async () => {
    if (!editingCommission) return;
    setSavingCommission(true);
    
    try {
      const res = await fetch(`${API_URL}/api/admin/affiliates/commissions/${editingCommission}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editCommForm,
          order_amount: parseFloat(editCommForm.order_amount) || 0,
          commission_rate: parseFloat(editCommForm.commission_rate) || 0,
          commission_amount: parseFloat(editCommForm.commission_amount) || 0
        })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Commission updated');
        fetchCommissions();
        cancelEditCommission();
      } else {
        toast.error(data.detail || 'Failed to update');
      }
    } catch (error) {
      console.error('Error updating commission:', error);
      toast.error('Failed to update commission');
    } finally {
      setSavingCommission(false);
    }
  };

  const handleDeleteCommission = async (commId) => {
    setDeletingCommission(true);
    
    try {
      const res = await fetch(`${API_URL}/api/admin/affiliates/commissions/${commId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Commission deleted');
        fetchCommissions();
      } else {
        toast.error(data.detail || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting commission:', error);
      toast.error('Failed to delete commission');
    } finally {
      setDeletingCommission(false);
      setDeleteConfirm(null);
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveCommission();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditCommission();
    }
  };

  const fetchPayouts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/affiliates/payouts`);
      const data = await res.json();
      setPayouts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching payouts:', error);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchStats();
    fetchSettings();
    fetchApplications();
  }, [fetchStats, fetchSettings, fetchApplications]);

  // Load data based on active tab
  useEffect(() => {
    if (activeSubTab === 'affiliates') fetchAffiliates();
    if (activeSubTab === 'commissions') fetchCommissions();
    if (activeSubTab === 'payouts') fetchPayouts();
  }, [activeSubTab, fetchAffiliates, fetchCommissions, fetchPayouts]);

  // Handlers
  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/affiliates/applications/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(`Approved! Code: ${data.affiliate_code}`);
        fetchApplications();
        fetchStats();
      }
    } catch (error) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/affiliates/applications/${id}/reject`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('Application rejected');
        fetchApplications();
      }
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  const handleDeleteAffiliate = async (affiliateId) => {
    if (!window.confirm('Are you sure you want to delete this affiliate? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/affiliates/${affiliateId}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Affiliate deleted');
        fetchAffiliates();
        fetchStats();
      } else {
        toast.error(data.error || 'Failed to delete affiliate');
      }
    } catch (error) {
      console.error('Error deleting affiliate:', error);
      toast.error('Failed to delete affiliate');
    }
  };

  const handleDeleteApplication = async (applicationId) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/affiliates/applications/${applicationId}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Application deleted');
        fetchApplications();
      } else {
        toast.error(data.error || 'Failed to delete application');
      }
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application');
    }
  };

  const handleProcessPayouts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/affiliates/payouts/process`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchPayouts();
        fetchStats();
      }
    } catch (error) {
      toast.error('Failed to process payouts');
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/affiliates-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Settings saved');
        fetchSettings();
      }
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  // UGC Import handlers
  const handleUgcImport = async () => {
    setUgcImportLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/affiliates/bulk-create-from-ugc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      
      if (data.success) {
        setUgcImportResults(data);
        setShowUgcImportConfirm(false);
        setShowUgcImportResults(true);
        
        if (data.newly_created > 0) {
          toast.success(`Created ${data.newly_created} new affiliates from UGC!`);
        } else {
          toast.info('No new affiliates to create - all UGC creators already have accounts');
        }
      } else {
        toast.error(data.error || 'Import failed');
      }
    } catch (error) {
      console.error('UGC import error:', error);
      toast.error('Failed to import from UGC');
    } finally {
      setUgcImportLoading(false);
    }
  };

  const handleDownloadUgcCsv = () => {
    window.open(`${API_URL}/api/admin/affiliates/export-ugc-affiliates`, '_blank');
  };

  const handleCopyWhatsAppTemplate = () => {
    const template = `Hi {name}! You are now an PetYupp affiliate. Share your personal link with friends and followers and earn 15% commission on every sale. Your link: petyupp.com/?ref={CODE} - Start sharing today!`;
    navigator.clipboard.writeText(template);
    setTemplateCopied(true);
    toast.success('Template copied!');
    setTimeout(() => setTemplateCopied(false), 2000);
  };

  const handleCloseUgcResults = () => {
    setShowUgcImportResults(false);
    setUgcImportResults(null);
    fetchAffiliates();
    fetchStats();
  };

  // ============ ADD/EDIT AFFILIATE HANDLERS ============
  
  const handleOpenAddModal = () => {
    const newCode = generateAffiliateCode('NEW');
    setEditingAffiliate(null);
    setAffiliateForm({
      name: '',
      instagram_handle: '',
      email: '',
      phone: '',
      category: 'Pet Parent',
      tier: 'Standard',
      status: 'active',
      affiliate_code: newCode
    });
    setShowAffiliateModal(true);
  };

  const handleOpenEditModal = (affiliate) => {
    setEditingAffiliate(affiliate);
    setAffiliateForm({
      name: affiliate.name || '',
      instagram_handle: affiliate.instagram_handle || '',
      email: affiliate.email || '',
      phone: affiliate.phone || '',
      category: affiliate.category || 'Pet Parent',
      tier: affiliate.tier || 'Standard',
      status: affiliate.status || 'active',
      affiliate_code: affiliate.affiliate_code || ''
    });
    setShowAffiliateModal(true);
  };

  const handleCloseAffiliateModal = () => {
    setShowAffiliateModal(false);
    setEditingAffiliate(null);
    setAffiliateForm({
      name: '',
      instagram_handle: '',
      email: '',
      phone: '',
      category: 'Pet Parent',
      tier: 'Standard',
      status: 'active',
      affiliate_code: ''
    });
  };

  const handleAffiliateFormChange = (field, value) => {
    setAffiliateForm(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-generate code when name changes (only in add mode)
      if (field === 'name' && !editingAffiliate && value.length >= 2) {
        updated.affiliate_code = generateAffiliateCode(value);
      }
      return updated;
    });
  };

  const handleSaveAffiliate = async () => {
    if (!affiliateForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    
    setSavingAffiliate(true);
    try {
      const url = editingAffiliate 
        ? `${API_URL}/api/admin/affiliates/${editingAffiliate.id || editingAffiliate._id}`
        : `${API_URL}/api/admin/affiliates`;
      
      const method = editingAffiliate ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(affiliateForm)
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(editingAffiliate ? 'Affiliate updated successfully' : 'Affiliate added successfully');
        handleCloseAffiliateModal();
        fetchAffiliates();
        fetchStats();
      } else {
        toast.error(data.detail || data.error || 'Failed to save affiliate');
      }
    } catch (error) {
      console.error('Error saving affiliate:', error);
      toast.error('Failed to save affiliate');
    } finally {
      setSavingAffiliate(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-500/20 text-green-400',
      inactive: 'bg-slate-500/20 text-slate-400',
      suspended: 'bg-red-500/20 text-red-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      confirmed: 'bg-blue-500/20 text-blue-400',
      paid: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-red-500/20 text-red-400',
      processing: 'bg-blue-500/20 text-blue-400',
      completed: 'bg-green-500/20 text-green-400',
      failed: 'bg-red-500/20 text-red-400'
    };
    return styles[status?.toLowerCase()] || 'bg-slate-500/20 text-slate-400';
  };

  const getTierBadge = (tier) => {
    const styles = {
      Standard: 'bg-slate-500/20 text-slate-400',
      Silver: 'bg-blue-500/20 text-blue-400',
      Gold: 'bg-yellow-500/20 text-yellow-400'
    };
    return styles[tier] || styles.Standard;
  };

  return (
    <div className="space-y-4">
      {/* Sub-tab Navigation */}
      <div className={`flex gap-1 p-1 rounded-lg ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-100'}`}>
        {subTabs.map((tab) => {
          const Icon = tab.Icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-all ${
                activeSubTab === tab.id
                  ? 'bg-teal-500 text-white'
                  : isDarkMode 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ============ DASHBOARD SUB-TAB ============ */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-3">
          {/* Stats Cards - Compact */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className={`rounded-lg p-2.5 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Users className="w-3.5 h-3.5 text-teal-400" />
                <span className={`text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Affiliates
                </span>
              </div>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {stats?.total_affiliates || 0}
              </div>
            </div>

            <div className={`rounded-lg p-2.5 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                <span className={`text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Active
                </span>
              </div>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {stats?.active_this_month || 0}
              </div>
            </div>

            <div className={`rounded-lg p-2.5 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                <span className={`text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Revenue
                </span>
              </div>
              <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(stats?.total_revenue)}
              </div>
            </div>

            <div className={`rounded-lg p-2.5 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Wallet className="w-3.5 h-3.5 text-orange-400" />
                <span className={`text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Pending
                </span>
              </div>
              <div className={`text-xl font-bold text-orange-400`}>
                {formatCurrency(stats?.pending_payouts)}
              </div>
            </div>
          </div>

          {/* Program Status Card */}
          <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  PetYupp Pack Affiliate Program
                </h3>
                <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Program configuration and status
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                settings?.program_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {settings?.program_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
              <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>First Order</span>
                <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {settings?.first_order_commission || 15}%
                </div>
              </div>
              <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Repeat Orders</span>
                <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {settings?.repeat_order_commission || 10}%
                </div>
              </div>
              <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Cookie</span>
                <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {settings?.cookie_duration_days || 30} days
                </div>
              </div>
              <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Min Payout</span>
                <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(settings?.min_payout_amount || 500)}
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
            <h3 className={`text-xs font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              How It Works
            </h3>
            <div className="flex items-center justify-between gap-2">
              {[
                { icon: UserPlus, label: 'Sign Up', color: 'text-teal-400' },
                { icon: Share2, label: 'Share Link', color: 'text-blue-400' },
                { icon: ShoppingCart, label: 'Customer Buys', color: 'text-purple-400' },
                { icon: Wallet, label: 'Earn Commission', color: 'text-green-400' }
              ].map((step, idx) => (
                <React.Fragment key={step.label}>
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                      <step.icon className={`w-5 h-5 ${step.color}`} />
                    </div>
                    <span className={`text-[10px] mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      {step.label}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div className={`flex-1 h-0.5 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Top Affiliates */}
          <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <h3 className={`text-xs font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Top Affiliates
              </h3>
            </div>
            {stats?.top_affiliates?.length > 0 ? (
              <table className="w-full text-[11px]">
                <thead>
                  <tr className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                    <th className="text-left py-1.5 px-2">#</th>
                    <th className="text-left py-1.5 px-2">Name</th>
                    <th className="text-left py-1.5 px-2">Code</th>
                    <th className="text-right py-1.5 px-2">Clicks</th>
                    <th className="text-right py-1.5 px-2">Referrals</th>
                    <th className="text-right py-1.5 px-2">Revenue</th>
                    <th className="text-right py-1.5 px-2">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.top_affiliates.map((aff, idx) => (
                    <tr key={aff.id} className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                      <td className={`py-1.5 px-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        {idx + 1}
                      </td>
                      <td className={`py-1.5 px-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {aff.name}
                      </td>
                      <td className="py-1.5 px-2">
                        <div className="flex items-center gap-1">
                          <span className={`font-mono text-[10px] ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                            {aff.affiliate_code || aff.code}
                          </span>
                          <button
                            onClick={() => handleCopyLink(aff.affiliate_code || aff.code)}
                            className={`p-0.5 rounded transition-colors ${
                              copiedCode === (aff.affiliate_code || aff.code) 
                                ? 'text-green-400' 
                                : 'text-slate-400 hover:text-teal-400'
                            }`}
                            title="Copy link"
                          >
                            {copiedCode === (aff.affiliate_code || aff.code) ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className={`py-1.5 px-2 text-right ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        {aff.clicks}
                      </td>
                      <td className={`py-1.5 px-2 text-right ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        {aff.referrals}
                      </td>
                      <td className={`py-1.5 px-2 text-right ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        {formatCurrency(aff.revenue_generated)}
                      </td>
                      <td className={`py-1.5 px-2 text-right font-medium text-green-400`}>
                        {formatCurrency(aff.commission_earned)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className={`text-xs text-center py-4 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                No affiliates yet
              </p>
            )}
          </div>
        </div>
      )}

      {/* ============ AFFILIATES SUB-TAB ============ */}
      {activeSubTab === 'affiliates' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search by name, code, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded text-xs border ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`px-2 py-1.5 rounded text-xs border ${
                isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-2 py-1.5 rounded text-xs border ${
                isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
            <button
              onClick={handleOpenAddModal}
              data-testid="add-affiliate-btn"
              className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl px-4 py-2 text-xs font-medium shadow-lg shadow-teal-500/25 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Affiliate
            </button>
            <button
              onClick={() => setShowUgcImportConfirm(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-teal-500 text-teal-400 hover:bg-teal-500/10 transition-colors`}
              title="Import UGC creators as affiliates"
            >
              <Upload className="w-3.5 h-3.5" />
              Import from UGC
            </button>
            <button
              onClick={fetchAffiliates}
              className={`p-1.5 rounded ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Table */}
          <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
            <table className="w-full text-[11px]">
              <thead className={isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}>
                <tr className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                  <th className="text-left py-2 px-3">Name</th>
                  <th className="text-left py-2 px-3">Code</th>
                  <th className="text-left py-2 px-3">Category</th>
                  <th className="text-left py-2 px-3">Tier</th>
                  <th className="text-right py-2 px-3">Clicks</th>
                  <th className="text-right py-2 px-3">Referrals</th>
                  <th className="text-right py-2 px-3">Revenue</th>
                  <th className="text-right py-2 px-3">Commission</th>
                  <th className="text-center py-2 px-3">Status</th>
                  <th className="text-center py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8">
                      <div className="w-5 h-5 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : affiliates.length === 0 ? (
                  <tr>
                    <td colSpan={10} className={`text-center py-8 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                      No affiliates found
                    </td>
                  </tr>
                ) : (
                  affiliates.map((aff) => (
                    <tr key={aff.id} className={`border-t ${isDarkMode ? 'border-slate-700 hover:bg-slate-700/30' : 'border-gray-100 hover:bg-gray-50'}`}>
                      <td className={`py-2 px-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {aff.name}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono text-[11px] ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                            {aff.affiliate_code}
                          </span>
                          <button
                            onClick={() => handleCopyLink(aff.affiliate_code)}
                            className={`p-1 rounded transition-colors ${
                              copiedCode === aff.affiliate_code 
                                ? 'text-green-400' 
                                : 'text-slate-400 hover:text-teal-400 hover:bg-teal-500/10'
                            }`}
                            title="Copy affiliate link"
                          >
                            {copiedCode === aff.affiliate_code ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className={`text-[9px] mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                          petyupp.com/?ref={aff.affiliate_code}
                        </div>
                      </td>
                      <td className={`py-2 px-3 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        {aff.category}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${getTierBadge(aff.tier)}`}>
                          {aff.tier}
                        </span>
                      </td>
                      <td className={`py-2 px-3 text-right ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        {aff.clicks || 0}
                      </td>
                      <td className={`py-2 px-3 text-right ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        {aff.referrals || 0}
                      </td>
                      <td className={`py-2 px-3 text-right ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        {formatCurrency(aff.revenue_generated)}
                      </td>
                      <td className={`py-2 px-3 text-right font-medium text-green-400`}>
                        {formatCurrency(aff.commission_earned)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${getStatusBadge(aff.status)}`}>
                          {aff.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => handleOpenEditModal(aff)}
                            className="text-slate-400 hover:text-teal-400 p-1 rounded hover:bg-teal-500/10 transition-colors"
                            title="Edit Affiliate"
                            data-testid={`edit-affiliate-${aff.affiliate_code}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteAffiliate(aff._id || aff.id)}
                            className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition-colors"
                            title="Delete Affiliate"
                            data-testid={`delete-affiliate-${aff.affiliate_code}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============ APPLICATIONS SUB-TAB ============ */}
      {activeSubTab === 'applications' && (
        <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
          <table className="w-full text-[11px]">
            <thead className={isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}>
              <tr className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                <th className="text-left py-2 px-3">Name</th>
                <th className="text-left py-2 px-3">Email</th>
                <th className="text-left py-2 px-3">Instagram</th>
                <th className="text-left py-2 px-3">Category</th>
                <th className="text-left py-2 px-3">Applied</th>
                <th className="text-center py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`text-center py-8 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    No pending applications
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                    <td className={`py-2 px-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {app.name}
                    </td>
                    <td className={`py-2 px-3 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                      {app.email}
                    </td>
                    <td className={`py-2 px-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {app.instagram_handle || '-'}
                    </td>
                    <td className={`py-2 px-3 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                      {app.category}
                    </td>
                    <td className={`py-2 px-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      {app.applied_date}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleApprove(app.id || app._id)}
                          className="px-2 py-1 rounded text-[10px] font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        >
                          <CheckCircle className="w-3 h-3 inline mr-0.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(app.id || app._id)}
                          className="px-2 py-1 rounded text-[10px] font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        >
                          <XCircle className="w-3 h-3 inline mr-0.5" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleDeleteApplication(app.id || app._id)}
                          className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          title="Delete Application"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ============ COMMISSIONS SUB-TAB ============ */}
      {activeSubTab === 'commissions' && (
        <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
          {commissions.length === 0 ? (
            <div className={`text-center py-12 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
              <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No commissions recorded yet</p>
              <p className="text-xs mt-1">Commissions will appear here when affiliates generate orders</p>
            </div>
          ) : (
            <table className="w-full text-[11px]">
              <thead className={isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}>
                <tr className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                  <th className="text-left py-2 px-3">Affiliate</th>
                  <th className="text-left py-2 px-3">Order ID</th>
                  <th className="text-right py-2 px-3">Order Amount</th>
                  <th className="text-right py-2 px-3">Rate</th>
                  <th className="text-right py-2 px-3">Commission</th>
                  <th className="text-center py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-center py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((comm) => {
                  const isEditing = editingCommission === comm.id;
                  
                  return (
                    <tr key={comm.id} className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-100'} ${isEditing ? 'bg-teal-500/10' : ''}`}>
                      {/* Affiliate Name */}
                      <td className={`py-2 px-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editCommForm.affiliate_name}
                            onChange={(e) => setEditCommForm({...editCommForm, affiliate_name: e.target.value})}
                            onKeyDown={handleEditKeyDown}
                            className="w-full px-2 py-1 text-xs bg-slate-700 border border-teal-500 rounded text-white"
                          />
                        ) : (
                          comm.affiliate_name || 'N/A'
                        )}
                      </td>
                      
                      {/* Order ID (not editable) */}
                      <td className={`py-2 px-3 font-mono ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        {comm.order_id}
                      </td>
                      
                      {/* Order Amount */}
                      <td className={`py-2 px-3 text-right ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editCommForm.order_amount}
                            onChange={(e) => setEditCommForm({...editCommForm, order_amount: e.target.value})}
                            onKeyDown={handleEditKeyDown}
                            className="w-20 px-2 py-1 text-xs text-right bg-slate-700 border border-teal-500 rounded text-white"
                          />
                        ) : (
                          formatCurrency(comm.order_amount)
                        )}
                      </td>
                      
                      {/* Rate % */}
                      <td className={`py-2 px-3 text-right ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editCommForm.commission_rate}
                            onChange={(e) => setEditCommForm({...editCommForm, commission_rate: e.target.value})}
                            onKeyDown={handleEditKeyDown}
                            className="w-14 px-2 py-1 text-xs text-right bg-slate-700 border border-teal-500 rounded text-white"
                          />
                        ) : (
                          `${comm.commission_rate}%`
                        )}
                      </td>
                      
                      {/* Commission Amount */}
                      <td className={`py-2 px-3 text-right font-medium text-green-400`}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editCommForm.commission_amount}
                            onChange={(e) => setEditCommForm({...editCommForm, commission_amount: e.target.value})}
                            onKeyDown={handleEditKeyDown}
                            className="w-20 px-2 py-1 text-xs text-right bg-slate-700 border border-teal-500 rounded text-white"
                          />
                        ) : (
                          formatCurrency(comm.commission_amount)
                        )}
                      </td>
                      
                      {/* Status */}
                      <td className="py-2 px-3 text-center">
                        {isEditing ? (
                          <select
                            value={editCommForm.status}
                            onChange={(e) => setEditCommForm({...editCommForm, status: e.target.value})}
                            className="px-2 py-1 text-xs bg-slate-700 border border-teal-500 rounded text-white"
                          >
                            <option value="pending">pending</option>
                            <option value="approved">approved</option>
                            <option value="paid">paid</option>
                            <option value="rejected">rejected</option>
                          </select>
                        ) : (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${getStatusBadge(comm.status)}`}>
                            {comm.status}
                          </span>
                        )}
                      </td>
                      
                      {/* Date */}
                      <td className={`py-2 px-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editCommForm.created_at}
                            onChange={(e) => setEditCommForm({...editCommForm, created_at: e.target.value})}
                            onKeyDown={handleEditKeyDown}
                            className="px-2 py-1 text-xs bg-slate-700 border border-teal-500 rounded text-white"
                          />
                        ) : (
                          comm.created_at?.split('T')[0]
                        )}
                      </td>
                      
                      {/* Actions */}
                      <td className="py-2 px-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={saveCommission}
                              disabled={savingCommission}
                              className="p-1 rounded bg-teal-500/20 text-teal-400 hover:bg-teal-500/30"
                              title="Save"
                            >
                              {savingCommission ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={cancelEditCommission}
                              className="p-1 rounded bg-slate-600/50 text-slate-400 hover:bg-slate-600"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : deleteConfirm === comm.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleDeleteCommission(comm.id)}
                              disabled={deletingCommission}
                              className="px-2 py-0.5 rounded text-[9px] bg-red-500 text-white hover:bg-red-600"
                            >
                              {deletingCommission ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-0.5 rounded text-[9px] bg-slate-600 text-slate-300 hover:bg-slate-500"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => startEditCommission(comm)}
                              className="p-1 rounded text-slate-400 hover:text-teal-400 hover:bg-teal-500/10"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(comm.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ============ PAYOUTS SUB-TAB ============ */}
      {activeSubTab === 'payouts' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={handleProcessPayouts}
              className="px-3 py-1.5 rounded text-xs font-medium bg-teal-500 text-white hover:bg-teal-600"
            >
              Process Pending Payouts
            </button>
          </div>
          <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
            {payouts.length === 0 ? (
              <div className={`text-center py-12 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                <Wallet className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No payouts recorded yet</p>
              </div>
            ) : (
              <table className="w-full text-[11px]">
                <thead className={isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}>
                  <tr className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                    <th className="text-left py-2 px-3">Affiliate</th>
                    <th className="text-right py-2 px-3">Amount</th>
                    <th className="text-left py-2 px-3">Method</th>
                    <th className="text-center py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3">Requested</th>
                    <th className="text-left py-2 px-3">Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <tr key={payout.id} className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                      <td className={`py-2 px-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {payout.affiliate_name}
                      </td>
                      <td className={`py-2 px-3 text-right font-medium text-green-400`}>
                        {formatCurrency(payout.amount)}
                      </td>
                      <td className={`py-2 px-3 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        {payout.method}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${getStatusBadge(payout.status)}`}>
                          {payout.status}
                        </span>
                      </td>
                      <td className={`py-2 px-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        {payout.requested_at?.split('T')[0]}
                      </td>
                      <td className={`py-2 px-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        {payout.paid_at?.split('T')[0] || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ============ SETTINGS SUB-TAB ============ */}
      {activeSubTab === 'settings' && (
        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
          <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Program Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'first_order_commission', label: 'First Order Commission (%)', type: 'number' },
              { key: 'repeat_order_commission', label: 'Repeat Order Commission (%)', type: 'number' },
              { key: 'repeat_commission_months', label: 'Repeat Commission Window (months)', type: 'number' },
              { key: 'cookie_duration_days', label: 'Cookie Duration (days)', type: 'number' },
              { key: 'min_payout_amount', label: 'Minimum Payout (₹)', type: 'number' },
              { key: 'customer_discount_percent', label: 'Customer Discount (%)', type: 'number' }
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  {label}
                </label>
                <input
                  type={type}
                  value={settingsForm[key]}
                  onChange={(e) => setSettingsForm({ ...settingsForm, [key]: parseInt(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 rounded text-sm border ${
                    isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 rounded text-sm font-medium bg-teal-500 text-white hover:bg-teal-600"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* ============ ADD/EDIT AFFILIATE MODAL ============ */}
      {showAffiliateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/20">
                  <UserPlus className="w-5 h-5 text-teal-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {editingAffiliate ? 'Edit Affiliate' : 'Add New Affiliate'}
                </h3>
              </div>
              <button
                onClick={handleCloseAffiliateModal}
                className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {/* Form */}
            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={affiliateForm.name}
                  onChange={(e) => handleAffiliateFormChange('name', e.target.value)}
                  placeholder="Enter affiliate name"
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  data-testid="affiliate-name-input"
                />
              </div>
              
              {/* Instagram Handle */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  Instagram Handle
                </label>
                <input
                  type="text"
                  value={affiliateForm.instagram_handle}
                  onChange={(e) => handleAffiliateFormChange('instagram_handle', e.target.value)}
                  placeholder="@username"
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={affiliateForm.email}
                  onChange={(e) => handleAffiliateFormChange('email', e.target.value)}
                  placeholder="email@example.com"
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
              
              {/* Phone */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  Phone
                </label>
                <input
                  type="text"
                  value={affiliateForm.phone}
                  onChange={(e) => handleAffiliateFormChange('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
              
              {/* Category */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  Category
                </label>
                <select
                  value={affiliateForm.category}
                  onChange={(e) => handleAffiliateFormChange('category', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              {/* Tier */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  Tier
                </label>
                <select
                  value={affiliateForm.tier}
                  onChange={(e) => handleAffiliateFormChange('tier', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500"
                >
                  {TIERS.map(tier => (
                    <option key={tier} value={tier}>{tier}</option>
                  ))}
                </select>
              </div>
              
              {/* Status */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  Status
                </label>
                <select
                  value={affiliateForm.status}
                  onChange={(e) => handleAffiliateFormChange('status', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500"
                >
                  {STATUSES.map(status => (
                    <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>
              </div>
              
              {/* Referral Code - Read-only in Add mode, Editable in Edit mode */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  Referral Code {!editingAffiliate && <span className="text-xs text-slate-500">(Auto-generated)</span>}
                </label>
                <input
                  type="text"
                  value={affiliateForm.affiliate_code}
                  onChange={(e) => handleAffiliateFormChange('affiliate_code', e.target.value.toUpperCase())}
                  readOnly={!editingAffiliate}
                  className={`w-full bg-slate-900 border border-slate-600 text-teal-400 font-mono rounded-xl px-4 py-2 text-sm focus:outline-none ${
                    editingAffiliate ? 'focus:border-teal-500' : 'cursor-not-allowed opacity-75'
                  }`}
                />
              </div>
              
              {/* Referral Link - Always read-only */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  Referral Link
                </label>
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-600 rounded-xl px-4 py-2">
                  <Link className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-300">petyupp.com/?ref={affiliateForm.affiliate_code}</span>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-700">
              <button
                onClick={handleCloseAffiliateModal}
                disabled={savingAffiliate}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAffiliate}
                disabled={savingAffiliate}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-teal-500 text-white hover:bg-teal-600 transition-colors disabled:opacity-50"
                data-testid="save-affiliate-btn"
              >
                {savingAffiliate ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingAffiliate ? 'Save Changes' : 'Add Affiliate'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ UGC IMPORT CONFIRMATION MODAL ============ */}
      {showUgcImportConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'} p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-teal-500/20">
                <Upload className="w-5 h-5 text-teal-400" />
              </div>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Import UGC Creators as Affiliates
              </h3>
            </div>
            
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
              This will create affiliate codes for all UGC creators with <span className="font-semibold text-green-400">"Posted"</span> status who do not already have an affiliate account.
              <br /><br />
              They will get <span className="font-semibold text-teal-400">15% first order</span> and <span className="font-semibold text-teal-400">10% repeat</span> commission.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowUgcImportConfirm(false)}
                disabled={ugcImportLoading}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleUgcImport}
                disabled={ugcImportLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50"
              >
                {ugcImportLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Now'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ UGC IMPORT RESULTS MODAL ============ */}
      {showUgcImportResults && ugcImportResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-2xl rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'} max-h-[90vh] overflow-hidden flex flex-col`}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Import Complete
                </h3>
              </div>
              <button
                onClick={handleCloseUgcResults}
                className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {/* Stats */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Found (Posted)</p>
                  <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {ugcImportResults.total_ugc_posted}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Already Affiliated</p>
                  <p className={`text-xl font-bold text-amber-400`}>
                    {ugcImportResults.already_affiliated}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Newly Created</p>
                  <p className={`text-xl font-bold text-green-400`}>
                    {ugcImportResults.newly_created}
                  </p>
                </div>
              </div>
              
              {/* New Affiliates Table */}
              {ugcImportResults.affiliates?.length > 0 && (
                <div className={`rounded-lg overflow-hidden mb-4 ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className={`sticky top-0 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                        <tr className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                          <th className="text-left py-2 px-3">Name</th>
                          <th className="text-left py-2 px-3">Code</th>
                          <th className="text-left py-2 px-3">Link</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ugcImportResults.affiliates.map((aff, idx) => (
                          <tr key={idx} className={`border-t ${isDarkMode ? 'border-slate-600' : 'border-gray-200'}`}>
                            <td className={`py-2 px-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {aff.name}
                            </td>
                            <td className={`py-2 px-3 font-mono text-teal-400`}>
                              {aff.code}
                            </td>
                            <td className={`py-2 px-3 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                              {aff.referral_link}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Download CSV Button */}
              <button
                onClick={handleDownloadUgcCsv}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 mb-4"
              >
                <FileDown className="w-4 h-4" />
                Download CSV
              </button>
              
              {/* WhatsApp Template */}
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-green-400" />
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    WhatsApp Message Template
                  </span>
                </div>
                <textarea
                  readOnly
                  value={`Hi {name}! You are now an PetYupp affiliate. Share your personal link with friends and followers and earn 15% commission on every sale. Your link: petyupp.com/?ref={CODE} - Start sharing today!`}
                  className={`w-full px-3 py-2 rounded-lg text-xs resize-none ${isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-600' : 'bg-white text-gray-700 border-gray-300'} border`}
                  rows={3}
                />
                <button
                  onClick={handleCopyWhatsAppTemplate}
                  className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium ${
                    templateCopied 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-slate-600 text-white hover:bg-slate-500'
                  }`}
                >
                  {templateCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {templateCopied ? 'Copied!' : 'Copy Template'}
                </button>
                <p className={`text-[10px] mt-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                  Replace &#123;name&#125; and &#123;CODE&#125; with each affiliate's details from the CSV
                </p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-700">
              <button
                onClick={handleCloseUgcResults}
                className="w-full py-2.5 rounded-lg text-sm font-medium bg-teal-500 text-white hover:bg-teal-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliatesTab;
