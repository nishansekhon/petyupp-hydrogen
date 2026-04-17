import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { 
  Send, Users, Handshake, DollarSign, 
  Plus, Edit2, Trash2, ExternalLink, Copy, Check,
  X, ChevronDown, ChevronRight, MessageSquare, Link as LinkIcon
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = API_BASE_URL;

const STATUS_CONFIG = {
  not_contacted: { label: 'Not Contacted', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  contacted: { label: 'Contacted', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  negotiating: { label: 'Negotiating', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  deal_made: { label: 'Deal Made', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  rejected: { label: 'Rejected', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
};

const CATEGORIES = ['Loot Deals', 'Pet Community', 'Dog Lovers', 'General Deals'];

const MESSAGE_TEMPLATES = [
  {
    title: "Initial Outreach",
    content: `Hi, I'm from OyeBark - a premium pet care brand on Amazon India.

We want to run a limited-time deal:
- Product: [PRODUCT NAME]
- MRP: ₹[MRP]
- Deal Price: ₹[PRICE] ([X]% off)
- Amazon Link: [LINK]

Can we discuss featuring this deal on your channel? We can work on commission basis or flat fee.`
  },
  {
    title: "Follow Up",
    content: `Hi, following up on my message about OyeBark deal promotion. Would love to discuss partnership options. Let me know your rate card.`
  }
];

const TelegramOutreachTab = () => {
  const { isDarkMode } = useAdminTheme();
  
  // State
  const [channels, setChannels] = useState([]);
  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    total_channels: 0,
    channels_contacted: 0,
    deals_made: 0,
    total_spent: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [selectedChannelForDeal, setSelectedChannelForDeal] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(null);
  
  // Form state
  const [channelForm, setChannelForm] = useState({
    name: '',
    username: '',
    subscribers: '',
    category: 'Loot Deals',
    admin_contact: '',
    status: 'not_contacted',
    notes: ''
  });
  
  const [dealForm, setDealForm] = useState({
    product_name: '',
    deal_type: 'flat_fee',
    amount: '',
    post_date: '',
    post_link: '',
    results_clicks: '',
    results_sales: '',
    notes: ''
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
      const [channelsRes, dealsRes, statsRes, productsRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/admin/telegram-channels`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/api/admin/telegram-deals`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/api/admin/telegram-outreach/stats`, { headers }).then(r => r.json()),
        fetch(`${API_URL}/api/admin/products`, { headers }).then(r => r.json())
      ]);
      
      if (channelsRes.status === 'fulfilled' && channelsRes.value.success) {
        setChannels(channelsRes.value.channels || []);
      }
      if (dealsRes.status === 'fulfilled' && dealsRes.value.success) {
        setDeals(dealsRes.value.deals || []);
      }
      if (statsRes.status === 'fulfilled' && statsRes.value.success) {
        setStats(statsRes.value.stats || {});
      }
      if (productsRes.status === 'fulfilled') {
        const data = productsRes.value;
        setProducts(Array.isArray(data) ? data : (data.products || []));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load outreach data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format number with K/M suffix
  const formatSubscribers = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num?.toString() || '0';
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  // Open channel modal
  const openChannelModal = (channel = null) => {
    if (channel) {
      setEditingChannel(channel);
      setChannelForm({
        name: channel.name,
        username: channel.username,
        subscribers: channel.subscribers?.toString() || '',
        category: channel.category || 'Loot Deals',
        admin_contact: channel.admin_contact || '',
        status: channel.status || 'not_contacted',
        notes: channel.notes || ''
      });
    } else {
      setEditingChannel(null);
      setChannelForm({
        name: '',
        username: '',
        subscribers: '',
        category: 'Loot Deals',
        admin_contact: '',
        status: 'not_contacted',
        notes: ''
      });
    }
    setShowChannelModal(true);
  };

  // Save channel
  const saveChannel = async () => {
    if (!channelForm.name.trim()) {
      toast.error('Channel name is required');
      return;
    }
    if (!channelForm.username.trim()) {
      toast.error('Username is required');
      return;
    }

    const token = localStorage.getItem('adminToken');
    const payload = {
      ...channelForm,
      subscribers: channelForm.subscribers ? parseInt(channelForm.subscribers) : 0
    };

    try {
      const url = editingChannel 
        ? `${API_URL}/api/admin/telegram-channels/${editingChannel.id}`
        : `${API_URL}/api/admin/telegram-channels`;
      
      const response = await fetch(url, {
        method: editingChannel ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(editingChannel ? 'Channel updated' : 'Channel added');
        setShowChannelModal(false);
        fetchData();
      } else {
        toast.error(data.detail || 'Failed to save channel');
      }
    } catch (err) {
      console.error('Error saving channel:', err);
      toast.error('Failed to save channel');
    }
  };

  // Delete channel
  const deleteChannel = async (channel) => {
    if (!window.confirm(`Delete channel "${channel.name}"?`)) return;
    
    const token = localStorage.getItem('adminToken');

    try {
      const response = await fetch(
        `${API_URL}/api/admin/telegram-channels/${channel.id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('Channel deleted');
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting channel:', err);
      toast.error('Failed to delete channel');
    }
  };

  // Open deal modal
  const openDealModal = (channel) => {
    setSelectedChannelForDeal(channel);
    setDealForm({
      product_name: '',
      deal_type: 'flat_fee',
      amount: '',
      post_date: new Date().toISOString().split('T')[0],
      post_link: '',
      results_clicks: '',
      results_sales: '',
      notes: ''
    });
    setShowDealModal(true);
  };

  // Save deal
  const saveDeal = async () => {
    if (!dealForm.product_name.trim()) {
      toast.error('Product is required');
      return;
    }
    if (!dealForm.amount || parseFloat(dealForm.amount) <= 0) {
      toast.error('Valid amount is required');
      return;
    }

    const token = localStorage.getItem('adminToken');
    const payload = {
      channel_id: selectedChannelForDeal.id,
      channel_name: selectedChannelForDeal.name,
      product_name: dealForm.product_name,
      deal_type: dealForm.deal_type,
      amount: parseFloat(dealForm.amount),
      post_date: dealForm.post_date || null,
      post_link: dealForm.post_link || null,
      results_clicks: dealForm.results_clicks ? parseInt(dealForm.results_clicks) : 0,
      results_sales: dealForm.results_sales ? parseInt(dealForm.results_sales) : 0,
      notes: dealForm.notes || null
    };

    try {
      const response = await fetch(`${API_URL}/api/admin/telegram-deals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Deal logged');
        setShowDealModal(false);
        fetchData();
      } else {
        toast.error(data.detail || 'Failed to log deal');
      }
    } catch (err) {
      console.error('Error logging deal:', err);
      toast.error('Failed to log deal');
    }
  };

  // Copy template
  const copyTemplate = (content, idx) => {
    navigator.clipboard.writeText(content);
    setCopiedTemplate(idx);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2">
        <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Users className="w-3.5 h-3.5 text-teal-400" />
            <span className={`text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Total Channels
            </span>
          </div>
          <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {loading ? '...' : stats.total_channels}
          </div>
        </div>

        <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Send className="w-3.5 h-3.5 text-blue-400" />
            <span className={`text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Contacted
            </span>
          </div>
          <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {loading ? '...' : stats.channels_contacted}
          </div>
        </div>

        <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Handshake className="w-3.5 h-3.5 text-green-400" />
            <span className={`text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Deals Made
            </span>
          </div>
          <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {loading ? '...' : stats.deals_made}
          </div>
        </div>

        <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <DollarSign className="w-3.5 h-3.5 text-orange-400" />
            <span className={`text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Total Spent
            </span>
          </div>
          <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {loading ? '...' : formatCurrency(stats.total_spent)}
          </div>
        </div>
      </div>

      {/* Channels Section */}
      <div className={`rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
        <div className="px-3 py-2 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Channels
            </h2>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
              {channels.length}
            </span>
          </div>
          
          <button
            onClick={() => openChannelModal()}
            className="flex items-center gap-1 px-2 py-1 bg-teal-500 hover:bg-teal-600 text-white rounded text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Channel
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
            </div>
          ) : channels.length === 0 ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              <Send className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No channels yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-[10px] uppercase tracking-wide ${isDarkMode ? 'text-slate-400 bg-slate-900/50' : 'text-gray-500 bg-gray-50'}`}>
                  <th className="px-3 py-2 text-left">Channel</th>
                  <th className="px-3 py-2 text-left">Username</th>
                  <th className="px-3 py-2 text-right">Subscribers</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-center">Status</th>
                  <th className="px-3 py-2 text-left">Last Contact</th>
                  <th className="px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-gray-100'}`}>
                {channels.map((channel) => (
                  <tr 
                    key={channel.id}
                    className={`${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-3 py-2">
                      <div className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {channel.name}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <a 
                        href={`https://t.me/${channel.username.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-teal-400 hover:underline"
                      >
                        {channel.username}
                      </a>
                    </td>
                    <td className={`px-3 py-2 text-right text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                      {formatSubscribers(channel.subscribers)}
                    </td>
                    <td className={`px-3 py-2 text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                      {channel.category}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_CONFIG[channel.status]?.color || STATUS_CONFIG.not_contacted.color}`}>
                        {STATUS_CONFIG[channel.status]?.label || channel.status}
                      </span>
                    </td>
                    <td className={`px-3 py-2 text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      {channel.last_contact ? formatDate(channel.last_contact) : '-'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          onClick={() => openChannelModal(channel)}
                          className={`p-1 rounded ${isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-200'}`}
                          title="Edit Channel"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <button
                          onClick={() => openDealModal(channel)}
                          className={`p-1 rounded ${isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-200'}`}
                          title="Log Deal"
                        >
                          <Handshake className="w-3.5 h-3.5 text-green-400" />
                        </button>
                        <button
                          onClick={() => deleteChannel(channel)}
                          className={`p-1 rounded ${isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-200'}`}
                          title="Delete Channel"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent Deals Section */}
      <div className={`rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
        <div className="px-3 py-2 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Recent Deals
            </h2>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
              {deals.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {deals.length === 0 ? (
            <div className={`text-center py-6 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              <p className="text-xs">No deals logged yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-[10px] uppercase tracking-wide ${isDarkMode ? 'text-slate-400 bg-slate-900/50' : 'text-gray-500 bg-gray-50'}`}>
                  <th className="px-3 py-2 text-left">Channel</th>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-left">Post Date</th>
                  <th className="px-3 py-2 text-center">Link</th>
                  <th className="px-3 py-2 text-right">Results</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-gray-100'}`}>
                {deals.slice(0, 10).map((deal) => (
                  <tr 
                    key={deal.id}
                    className={`${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'}`}
                  >
                    <td className={`px-3 py-2 text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                      {deal.channel_name}
                    </td>
                    <td className={`px-3 py-2 text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {deal.product_name}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        deal.deal_type === 'commission' 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-teal-500/20 text-teal-400'
                      }`}>
                        {deal.deal_type === 'commission' ? 'Commission' : 'Flat Fee'}
                      </span>
                    </td>
                    <td className={`px-3 py-2 text-right text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                      {formatCurrency(deal.amount)}
                    </td>
                    <td className={`px-3 py-2 text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      {deal.post_date ? formatDate(deal.post_date) : '-'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {deal.post_link ? (
                        <a 
                          href={deal.post_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex p-1 rounded hover:bg-slate-600"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
                        </a>
                      ) : '-'}
                    </td>
                    <td className={`px-3 py-2 text-right text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                      {deal.results_clicks > 0 || deal.results_sales > 0 
                        ? `${deal.results_clicks || 0} clicks, ${deal.results_sales || 0} sales`
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Message Templates Section */}
      <div className={`rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full px-3 py-2 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} />
            <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Message Templates
            </h2>
          </div>
          {showTemplates 
            ? <ChevronDown className="w-4 h-4 text-slate-400" />
            : <ChevronRight className="w-4 h-4 text-slate-400" />
          }
        </button>
        
        {showTemplates && (
          <div className={`px-3 pb-3 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
            <div className="space-y-3 mt-3">
              {MESSAGE_TEMPLATES.map((template, idx) => (
                <div 
                  key={idx}
                  className={`rounded border p-3 ${isDarkMode ? 'border-slate-700 bg-slate-900/30' : 'border-gray-200 bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {template.title}
                    </span>
                    <button
                      onClick={() => copyTemplate(template.content, idx)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        copiedTemplate === idx
                          ? 'bg-green-500/20 text-green-400'
                          : isDarkMode 
                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {copiedTemplate === idx ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedTemplate === idx ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className={`whitespace-pre-wrap text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                    {template.content}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Channel Modal */}
      {showChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
              <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {editingChannel ? 'Edit Channel' : 'Add Channel'}
              </h3>
              <button onClick={() => setShowChannelModal(false)}>
                <X className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Channel Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={channelForm.name}
                  onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
                  placeholder="e.g., OMG Loot Deals"
                  className={`w-full px-2 py-1.5 text-sm rounded border ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={channelForm.username}
                  onChange={(e) => setChannelForm({ ...channelForm, username: e.target.value })}
                  placeholder="@channelname"
                  className={`w-full px-2 py-1.5 text-sm rounded border ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Subscribers
                  </label>
                  <input
                    type="number"
                    value={channelForm.subscribers}
                    onChange={(e) => setChannelForm({ ...channelForm, subscribers: e.target.value })}
                    placeholder="300000"
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Category
                  </label>
                  <select
                    value={channelForm.category}
                    onChange={(e) => setChannelForm({ ...channelForm, category: e.target.value })}
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Admin Contact
                </label>
                <input
                  type="text"
                  value={channelForm.admin_contact}
                  onChange={(e) => setChannelForm({ ...channelForm, admin_contact: e.target.value })}
                  placeholder="@admin_username or phone"
                  className={`w-full px-2 py-1.5 text-sm rounded border ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Status
                </label>
                <select
                  value={channelForm.status}
                  onChange={(e) => setChannelForm({ ...channelForm, status: e.target.value })}
                  className={`w-full px-2 py-1.5 text-sm rounded border ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  }`}
                >
                  {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                    <option key={value} value={value}>{config.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Notes
                </label>
                <textarea
                  value={channelForm.notes}
                  onChange={(e) => setChannelForm({ ...channelForm, notes: e.target.value })}
                  placeholder="Any notes about this channel..."
                  rows={2}
                  className={`w-full px-2 py-1.5 text-sm rounded border ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
            </div>

            <div className={`sticky bottom-0 flex items-center justify-end gap-2 px-4 py-3 border-t ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
              <button
                onClick={() => setShowChannelModal(false)}
                className={`px-3 py-1.5 text-sm rounded ${
                  isDarkMode 
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={saveChannel}
                className="px-3 py-1.5 text-sm bg-teal-500 hover:bg-teal-600 text-white rounded font-medium"
              >
                {editingChannel ? 'Update' : 'Add Channel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deal Modal */}
      {showDealModal && selectedChannelForDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
              <div>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Log Deal
                </h3>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  {selectedChannelForDeal.name}
                </p>
              </div>
              <button onClick={() => setShowDealModal(false)}>
                <X className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Product <span className="text-red-400">*</span>
                </label>
                <select
                  value={dealForm.product_name}
                  onChange={(e) => setDealForm({ ...dealForm, product_name: e.target.value })}
                  className={`w-full px-2 py-1.5 text-sm rounded border ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p._id || p.id} value={p.name}>
                      {p.name} - ₹{p.price || p.salePrice}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Deal Type
                  </label>
                  <select
                    value={dealForm.deal_type}
                    onChange={(e) => setDealForm({ ...dealForm, deal_type: e.target.value })}
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="flat_fee">Flat Fee</option>
                    <option value="commission">Commission</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Amount (₹) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={dealForm.amount}
                    onChange={(e) => setDealForm({ ...dealForm, amount: e.target.value })}
                    placeholder="500"
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Post Date
                  </label>
                  <input
                    type="date"
                    value={dealForm.post_date}
                    onChange={(e) => setDealForm({ ...dealForm, post_date: e.target.value })}
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Post Link
                  </label>
                  <input
                    type="url"
                    value={dealForm.post_link}
                    onChange={(e) => setDealForm({ ...dealForm, post_link: e.target.value })}
                    placeholder="https://t.me/..."
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Clicks
                  </label>
                  <input
                    type="number"
                    value={dealForm.results_clicks}
                    onChange={(e) => setDealForm({ ...dealForm, results_clicks: e.target.value })}
                    placeholder="0"
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Sales
                  </label>
                  <input
                    type="number"
                    value={dealForm.results_sales}
                    onChange={(e) => setDealForm({ ...dealForm, results_sales: e.target.value })}
                    placeholder="0"
                    className={`w-full px-2 py-1.5 text-sm rounded border ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Notes
                </label>
                <textarea
                  value={dealForm.notes}
                  onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })}
                  placeholder="Any notes about this deal..."
                  rows={2}
                  className={`w-full px-2 py-1.5 text-sm rounded border ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500'
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
            </div>

            <div className={`sticky bottom-0 flex items-center justify-end gap-2 px-4 py-3 border-t ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
              <button
                onClick={() => setShowDealModal(false)}
                className={`px-3 py-1.5 text-sm rounded ${
                  isDarkMode 
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={saveDeal}
                className="px-3 py-1.5 text-sm bg-teal-500 hover:bg-teal-600 text-white rounded font-medium"
              >
                Log Deal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelegramOutreachTab;
