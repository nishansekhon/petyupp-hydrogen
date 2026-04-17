/**
 * GuestPostOutreach Component
 * 
 * Guest post outreach management for SEO backlink building.
 * Tracks outreach to Indian pet websites for guest posting opportunities.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';
import { 
  Send, Plus, Pencil, Trash2, ChevronRight, ExternalLink,
  Copy, Sparkles, Check, X, Loader2, Search, ChevronDown, ChevronUp, SearchIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

const API_URL = API_BASE_URL;

// Status colors
const STATUS_COLORS = {
  'Research': 'bg-slate-600 text-slate-200',
  'Ready': 'bg-blue-600 text-blue-100',
  'Emailed': 'bg-purple-600 text-purple-100',
  'Followed Up': 'bg-indigo-600 text-indigo-100',
  'Replied': 'bg-cyan-600 text-cyan-100',
  'Negotiating': 'bg-orange-600 text-orange-100',
  'Accepted': 'bg-green-600 text-green-100',
  'Writing': 'bg-amber-600 text-amber-100',
  'Submitted': 'bg-lime-600 text-lime-100',
  'Published': 'bg-emerald-500 text-white',
  'Rejected': 'bg-red-600 text-red-100',
  'No Response': 'bg-slate-500 text-slate-200'
};

// Niche colors
const NICHE_COLORS = {
  'Dog Food': 'bg-orange-500/20 text-orange-400',
  'Pet Care': 'bg-blue-500/20 text-blue-400',
  'Veterinary': 'bg-green-500/20 text-green-400',
  'Pet Products': 'bg-purple-500/20 text-purple-400',
  'Pet Services': 'bg-cyan-500/20 text-cyan-400',
  'Lifestyle': 'bg-pink-500/20 text-pink-400',
  'General Pet': 'bg-slate-500/20 text-slate-400'
};

// Pipeline columns (in order)
const PIPELINE_COLUMNS = ['Research', 'Ready', 'Emailed', 'Followed Up', 'Replied', 'Accepted', 'Writing', 'Published'];

// All statuses
const ALL_STATUSES = [...PIPELINE_COLUMNS, 'Negotiating', 'Submitted', 'Rejected', 'No Response'];

const NICHES = ['Dog Food', 'Pet Care', 'Veterinary', 'Pet Products', 'Pet Services', 'Lifestyle', 'General Pet'];

const GuestPostOutreach = ({ isDarkMode: propDarkMode }) => {
  const themeContext = useAdminTheme();
  const isDarkMode = propDarkMode ?? themeContext?.isDarkMode ?? true;
  
  // Sub-tab state
  const [activeTab, setActiveTab] = useState('pipeline');
  
  // Data state
  const [targets, setTargets] = useState([]);
  const [stats, setStats] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNiche, setFilterNiche] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Modal state
  const [editModal, setEditModal] = useState(null); // null or target object
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // AI Pitch state
  const [pitchTarget, setPitchTarget] = useState('');
  const [pitchTopic, setPitchTopic] = useState('');
  const [pitchTone, setPitchTone] = useState('professional');
  const [pitchResult, setPitchResult] = useState(null);
  const [pitchLoading, setPitchLoading] = useState(false);
  
  // Mobile collapsed columns
  const [collapsedColumns, setCollapsedColumns] = useState({});
  
  // Auto-research state
  const [researchingUrl, setResearchingUrl] = useState(null);
  const [researchingAll, setResearchingAll] = useState(false);
  const [researchProgress, setResearchProgress] = useState({ current: 0, total: 0 });
  
  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [targetsRes, statsRes, templatesRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/guest-posts/targets`),
        fetch(`${API_URL}/api/admin/guest-posts/stats`),
        fetch(`${API_URL}/api/admin/guest-posts/templates`)
      ]);
      
      const [targetsData, statsData, templatesData] = await Promise.all([
        targetsRes.json(),
        statsRes.json(),
        templatesRes.json()
      ]);
      
      if (targetsData.success) setTargets(targetsData.targets || []);
      if (statsData.success) setStats(statsData);
      if (templatesData.success) setTemplates(templatesData.templates || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Seed data
  const handleSeed = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/guest-posts/seed`, { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        fetchData();
      } else {
        toast.error(data.detail || 'Failed to seed');
      }
    } catch (error) {
      toast.error('Failed to seed data');
    }
  };
  
  // Save target (create or update)
  const handleSaveTarget = async (targetData) => {
    try {
      const isNew = !targetData._id;
      const url = isNew 
        ? `${API_URL}/api/admin/guest-posts/targets`
        : `${API_URL}/api/admin/guest-posts/targets/${targetData._id}`;
      
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetData)
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(isNew ? 'Site added' : 'Site updated');
        setEditModal(null);
        fetchData();
      } else {
        toast.error(data.detail || 'Failed to save');
      }
    } catch (error) {
      toast.error('Failed to save site');
    }
  };
  
  // Delete target
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/guest-posts/targets/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Site deleted');
        setDeleteConfirm(null);
        fetchData();
      } else {
        toast.error(data.detail || 'Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };
  
  // Move to next status
  const handleMoveNext = async (target) => {
    const currentIndex = PIPELINE_COLUMNS.indexOf(target.outreach_status);
    if (currentIndex < PIPELINE_COLUMNS.length - 1) {
      const newStatus = PIPELINE_COLUMNS[currentIndex + 1];
      await handleSaveTarget({ ...target, outreach_status: newStatus });
    }
  };
  
  // Generate AI pitch
  const handleGeneratePitch = async () => {
    if (!pitchTarget) {
      toast.error('Select a target site');
      return;
    }
    
    try {
      setPitchLoading(true);
      setPitchResult(null);
      
      const res = await fetch(`${API_URL}/api/admin/guest-posts/generate-pitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_id: pitchTarget,
          topic: pitchTopic,
          tone: pitchTone
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setPitchResult(data);
        toast.success('Pitch generated!');
      } else {
        toast.error(data.detail || 'Failed to generate pitch');
      }
    } catch (error) {
      toast.error('Failed to generate pitch');
    } finally {
      setPitchLoading(false);
    }
  };
  
  // Save pitch to target
  const handleSavePitch = async () => {
    if (!pitchTarget || !pitchResult) return;
    
    const target = targets.find(t => t._id === pitchTarget);
    if (!target) return;
    
    await handleSaveTarget({
      ...target,
      pitch_subject: pitchResult.subject,
      pitch_body: pitchResult.body
    });
    toast.success('Pitch saved to site');
  };
  
  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };
  
  // Auto-research a single site
  const handleAutoResearch = async (siteUrl, niche, setFormCallback) => {
    if (!siteUrl) {
      toast.error('Please enter a site URL first');
      return null;
    }
    
    try {
      setResearchingUrl(siteUrl);
      
      const res = await fetch(`${API_URL}/api/admin/guest-posts/auto-research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_url: siteUrl, niche: niche || 'General Pet' })
      });
      
      const response = await res.json();
      
      if (response.success && response.data) {
        const data = response.data;
        
        // Show any errors as warnings
        if (data.errors && data.errors.length > 0) {
          toast.warning(`Research completed with issues: ${data.errors[0]}`);
        } else {
          toast.success('Site researched successfully!');
        }
        
        return data;
      } else {
        toast.error(response.detail || 'Research failed');
        return null;
      }
    } catch (error) {
      toast.error(`Could not reach ${siteUrl}, some fields may be incomplete`);
      return null;
    } finally {
      setResearchingUrl(null);
    }
  };
  
  // Research all sites in Research column without contact/pitch
  const handleResearchAll = async () => {
    // Find sites in Research status without contact_email and pitch_body
    const sitesToResearch = targets.filter(t => 
      t.outreach_status === 'Research' && 
      !t.contact_email && 
      !t.pitch_body
    );
    
    if (sitesToResearch.length === 0) {
      toast.info('No sites need research. All Research column sites have contact info or pitch.');
      return;
    }
    
    setResearchingAll(true);
    setResearchProgress({ current: 0, total: sitesToResearch.length });
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < sitesToResearch.length; i++) {
      const site = sitesToResearch[i];
      setResearchProgress({ current: i + 1, total: sitesToResearch.length });
      
      try {
        const res = await fetch(`${API_URL}/api/admin/guest-posts/auto-research`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ site_url: site.site_url, niche: site.niche })
        });
        
        const response = await res.json();
        
        if (response.success && response.data) {
          const data = response.data;
          
          // Update the site with researched data (only fill empty fields)
          const updates = {};
          if (!site.contact_email && data.contact_email) updates.contact_email = data.contact_email;
          if (!site.contact_name && data.contact_name) updates.contact_name = data.contact_name;
          if (!site.blog_url && data.blog_url) updates.blog_url = data.blog_url;
          if (site.accepts_guest_posts === 'Unknown' && data.accepts_guest_posts !== 'Unknown') {
            updates.accepts_guest_posts = data.accepts_guest_posts;
          }
          if (!site.guest_post_topic && data.guest_post_topic) updates.guest_post_topic = data.guest_post_topic;
          if (!site.pitch_subject && data.pitch_subject) updates.pitch_subject = data.pitch_subject;
          if (!site.pitch_body && data.pitch_body) updates.pitch_body = data.pitch_body;
          
          // Save updates
          if (Object.keys(updates).length > 0) {
            await handleSaveTarget({ ...site, ...updates });
            successCount++;
          } else {
            successCount++; // Still count as success even if no new data
          }
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`Research failed for ${site.site_name}:`, error);
        failCount++;
      }
      
      // Rate limiting delay
      if (i < sitesToResearch.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    setResearchingAll(false);
    setResearchProgress({ current: 0, total: 0 });
    
    if (failCount > 0) {
      toast.warning(`Completed: ${successCount} of ${sitesToResearch.length} sites researched. ${failCount} failed.`);
    } else {
      toast.success(`Completed: All ${successCount} sites researched successfully!`);
    }
    
    // Refresh data
    fetchData();
  };
  
  // Filter targets
  const filteredTargets = targets.filter(t => {
    if (searchQuery && !t.site_name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !t.site_url?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !t.contact_name?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterNiche && t.niche !== filterNiche) return false;
    if (filterStatus && t.outreach_status !== filterStatus) return false;
    return true;
  });
  
  // Group targets by status for pipeline
  const targetsByStatus = PIPELINE_COLUMNS.reduce((acc, status) => {
    acc[status] = filteredTargets.filter(t => t.outreach_status === status);
    return acc;
  }, {});
  
  // Published targets for backlinks
  const publishedTargets = targets.filter(t => t.outreach_status === 'Published');
  
  // Toggle column collapse (mobile)
  const toggleColumn = (status) => {
    setCollapsedColumns(prev => ({ ...prev, [status]: !prev[status] }));
  };
  
  // Render status badge
  const StatusBadge = ({ status }) => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-slate-600 text-slate-200'}`}>
      {status}
    </span>
  );
  
  // Render niche badge
  const NicheBadge = ({ niche }) => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${NICHE_COLORS[niche] || 'bg-slate-500/20 text-slate-400'}`}>
      {niche}
    </span>
  );
  
  // Edit Modal Component
  const EditModal = ({ target, onSave, onClose }) => {
    const [form, setForm] = useState(target || {
      site_name: '', site_url: '', blog_url: '', contact_name: '', contact_email: '',
      domain_authority: '', monthly_traffic: '', niche: 'Dog Food', accepts_guest_posts: 'Unknown',
      outreach_status: 'Research', pitch_subject: '', pitch_body: '', guest_post_topic: '',
      backlink_url: '', published_url: '', published_date: '', anchor_text: '', follow_up_date: '', notes: ''
    });
    const [researching, setResearching] = useState(false);
    
    const handleChange = (field, value) => {
      setForm(prev => ({ ...prev, [field]: value }));
    };
    
    // Handle auto-research for this site
    const handleResearch = async () => {
      if (!form.site_url) {
        toast.error('Please enter a site URL first');
        return;
      }
      
      setResearching(true);
      const data = await handleAutoResearch(form.site_url, form.niche, setForm);
      setResearching(false);
      
      if (data) {
        // Only fill empty fields
        setForm(prev => ({
          ...prev,
          contact_email: prev.contact_email || data.contact_email || '',
          contact_name: prev.contact_name || data.contact_name || '',
          blog_url: prev.blog_url || data.blog_url || '',
          accepts_guest_posts: prev.accepts_guest_posts === 'Unknown' ? (data.accepts_guest_posts || 'Unknown') : prev.accepts_guest_posts,
          guest_post_topic: prev.guest_post_topic || data.guest_post_topic || '',
          pitch_subject: prev.pitch_subject || data.pitch_subject || '',
          pitch_body: prev.pitch_body || data.pitch_body || ''
        }));
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl ${isDarkMode ? 'bg-[#1E293B]' : 'bg-white'}`}>
          <div className={`sticky top-0 flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700 bg-[#1E293B]' : 'border-gray-200 bg-white'}`}>
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {target?._id ? 'Edit Site' : 'Add New Site'}
            </h3>
            <button onClick={onClose} className={`p-1 rounded-lg ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Site Name *</label>
                <input type="text" value={form.site_name} onChange={e => handleChange('site_name', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Site URL *</label>
                <input type="text" value={form.site_url} onChange={e => handleChange('site_url', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
            </div>
            
            {/* Auto-Research Button */}
            <button 
              onClick={handleResearch}
              disabled={researching || !form.site_url}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                researching || !form.site_url
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {researching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Researching...
                </>
              ) : (
                <>
                  <SearchIcon className="w-4 h-4" />
                  Auto-Research
                </>
              )}
            </button>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Blog URL</label>
                <input type="text" value={form.blog_url} onChange={e => handleChange('blog_url', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Contact Name</label>
                <input type="text" value={form.contact_name} onChange={e => handleChange('contact_name', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Contact Email</label>
                <input type="email" value={form.contact_email} onChange={e => handleChange('contact_email', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Domain Authority</label>
                <input type="number" value={form.domain_authority} onChange={e => handleChange('domain_authority', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Monthly Traffic</label>
                <input type="text" value={form.monthly_traffic} onChange={e => handleChange('monthly_traffic', e.target.value)}
                  placeholder="e.g., 50K, 100K+"
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Niche</label>
                <select value={form.niche} onChange={e => handleChange('niche', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Accepts Guest Posts</label>
                <select value={form.accepts_guest_posts} onChange={e => handleChange('accepts_guest_posts', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  {['Unknown', 'Yes', 'No', 'Maybe'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Outreach Status</label>
                <select value={form.outreach_status} onChange={e => handleChange('outreach_status', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Follow-up Date</label>
                <input type="date" value={form.follow_up_date?.split('T')[0] || ''} onChange={e => handleChange('follow_up_date', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Guest Post Topic</label>
                <input type="text" value={form.guest_post_topic} onChange={e => handleChange('guest_post_topic', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Pitch Subject</label>
              <input type="text" value={form.pitch_subject} onChange={e => handleChange('pitch_subject', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Pitch Body</label>
              <textarea value={form.pitch_body} onChange={e => handleChange('pitch_body', e.target.value)} rows={4}
                className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Backlink URL (OyeBark page)</label>
                <input type="text" value={form.backlink_url} onChange={e => handleChange('backlink_url', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Published URL</label>
                <input type="text" value={form.published_url} onChange={e => handleChange('published_url', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Published Date</label>
                <input type="date" value={form.published_date?.split('T')[0] || ''} onChange={e => handleChange('published_date', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Anchor Text</label>
                <input type="text" value={form.anchor_text} onChange={e => handleChange('anchor_text', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              </div>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Notes</label>
              <textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)} rows={2}
                className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
            </div>
          </div>
          
          <div className={`sticky bottom-0 flex justify-end gap-2 p-4 border-t ${isDarkMode ? 'border-slate-700 bg-[#1E293B]' : 'border-gray-200 bg-white'}`}>
            <button onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              Cancel
            </button>
            <button onClick={() => onSave(form)}
              className="px-4 py-2 rounded-lg font-medium bg-teal-500 text-white hover:bg-teal-600">
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render Pipeline Tab
  const renderPipeline = () => (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`rounded-xl border p-3 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Total Sites</p>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats?.total || 0}</p>
        </div>
        <div className={`rounded-xl border p-3 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>In Pipeline</p>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {PIPELINE_COLUMNS.slice(0, -1).reduce((sum, s) => sum + (stats?.by_status?.[s] || 0), 0)}
          </p>
        </div>
        <div className={`rounded-xl border p-3 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Published</p>
          <p className="text-xl font-bold text-green-400">{stats?.published || 0}</p>
        </div>
        <div className={`rounded-xl border p-3 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Backlinks Earned</p>
          <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats?.backlinks_earned || 0}</p>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {targets.length === 0 && (
          <button onClick={handleSeed}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            Seed Starter Sites
          </button>
        )}
        <button onClick={() => setEditModal({})}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-teal-500 text-white hover:bg-teal-600">
          <Plus className="w-4 h-4" />
          Add Site
        </button>
        <button 
          onClick={handleResearchAll}
          disabled={researchingAll}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
            researchingAll 
              ? 'bg-purple-600/50 text-purple-300 cursor-not-allowed' 
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {researchingAll ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Researching {researchProgress.current} of {researchProgress.total}...
            </>
          ) : (
            <>
              <SearchIcon className="w-4 h-4" />
              Research All
            </>
          )}
        </button>
      </div>
      
      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-4 lg:grid lg:grid-cols-8 lg:overflow-visible">
        {PIPELINE_COLUMNS.map(status => (
          <div key={status} className={`min-w-[200px] lg:min-w-0 rounded-xl border ${isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
            {/* Column Header */}
            <button 
              onClick={() => toggleColumn(status)}
              className={`w-full flex items-center justify-between p-3 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}
            >
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                {status}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600'}`}>
                {targetsByStatus[status]?.length || 0}
              </span>
            </button>
            
            {/* Column Content */}
            {!collapsedColumns[status] && (
              <div className="p-2 space-y-2 max-h-[400px] overflow-y-auto">
                {targetsByStatus[status]?.map(target => (
                  <div key={target._id} className={`rounded-xl border p-3 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
                    <p className={`font-medium text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {target.site_name}
                    </p>
                    <p className={`text-xs truncate ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      {target.site_url?.replace('https://', '')}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <NicheBadge niche={target.niche} />
                    </div>
                    {target.contact_name && (
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        Contact: {target.contact_name}
                      </p>
                    )}
                    {target.follow_up_date && (
                      <p className={`text-xs mt-1 ${new Date(target.follow_up_date) < new Date() ? 'text-amber-400' : 'text-green-400'}`}>
                        Follow-up: {new Date(target.follow_up_date).toLocaleDateString()}
                      </p>
                    )}
                    <div className="flex gap-1 mt-2">
                      <button onClick={() => setEditModal(target)}
                        className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {status !== 'Published' && (
                        <button onClick={() => handleMoveNext(target)}
                          className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
                          title="Move to next status">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {targetsByStatus[status]?.length === 0 && (
                  <p className={`text-xs text-center py-4 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    No sites
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
  
  // Render All Sites Tab
  const renderAllSites = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="Search sites..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-3 py-2 rounded-xl border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          />
        </div>
        <select value={filterNiche} onChange={e => setFilterNiche(e.target.value)}
          className={`px-3 py-2 rounded-xl border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
          <option value="">All Niches</option>
          {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className={`px-3 py-2 rounded-xl border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      
      {/* Table (desktop) / Cards (mobile) */}
      <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-gray-200'}`}>
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Site</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>DA</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Traffic</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Niche</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Status</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Contact</th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
              {filteredTargets.map(target => (
                <tr key={target._id} className={isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3">
                    <a href={target.site_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-teal-400 hover:underline">
                      {target.site_name}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className={`px-4 py-3 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{target.domain_authority || '-'}</td>
                  <td className={`px-4 py-3 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{target.monthly_traffic || '-'}</td>
                  <td className="px-4 py-3"><NicheBadge niche={target.niche} /></td>
                  <td className="px-4 py-3"><StatusBadge status={target.outreach_status} /></td>
                  <td className={`px-4 py-3 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{target.contact_name || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setEditModal(target)} className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(target)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-slate-700">
          {filteredTargets.map(target => (
            <div key={target._id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <a href={target.site_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-teal-400 font-medium">
                    {target.site_name}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <NicheBadge niche={target.niche} />
                    <StatusBadge status={target.outreach_status} />
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditModal(target)} className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteConfirm(target)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredTargets.length === 0 && (
          <p className={`text-center py-8 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
            No sites found
          </p>
        )}
      </div>
    </div>
  );
  
  // Render Templates Tab
  const renderTemplates = () => (
    <div className="space-y-6">
      {/* Email Templates */}
      <div>
        <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Email Templates</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {templates.map((template, idx) => (
            <div key={idx} className={`rounded-2xl border p-4 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-start justify-between mb-2">
                <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{template.name}</h4>
                <button onClick={() => copyToClipboard(template.body)}
                  className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className={`text-sm mb-2 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>{template.subject}</p>
              <pre className={`text-xs whitespace-pre-wrap p-3 rounded-lg max-h-[200px] overflow-y-auto ${isDarkMode ? 'bg-[#0F172A] text-slate-300' : 'bg-gray-100 text-gray-700'}`}>
                {template.body}
              </pre>
            </div>
          ))}
        </div>
      </div>
      
      {/* AI Pitch Generator */}
      <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-teal-400" />
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>AI Pitch Generator</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Target Site *</label>
            <select value={pitchTarget} onChange={e => setPitchTarget(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
              <option value="">Select a site...</option>
              {targets.map(t => <option key={t._id} value={t._id}>{t.site_name}</option>)}
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Topic (optional)</label>
            <input type="text" value={pitchTopic} onChange={e => setPitchTopic(e.target.value)}
              placeholder="Leave empty for AI to suggest"
              className={`w-full px-3 py-2 rounded-xl border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Tone</label>
            <select value={pitchTone} onChange={e => setPitchTone(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border ${isDarkMode ? 'bg-[#0F172A] border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="enthusiastic">Enthusiastic</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mb-4">
          <button onClick={handleGeneratePitch} disabled={pitchLoading || !pitchTarget}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50">
            {pitchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Pitch
          </button>
          <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Uses ~500 tokens (~$0.002)</p>
        </div>
        
        {pitchResult && (
          <div className={`rounded-xl border p-4 ${isDarkMode ? 'bg-[#0F172A] border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
            <div className="mb-3">
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Subject</label>
              <p className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}`}>{pitchResult.subject}</p>
            </div>
            <div className="mb-3">
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Body</label>
              <textarea value={pitchResult.body} readOnly rows={8}
                className={`w-full px-3 py-2 rounded-lg ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}`} />
            </div>
            {pitchResult.suggested_topics?.length > 0 && (
              <div className="mb-3">
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Suggested Topics</label>
                <ul className={`list-disc list-inside text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  {pitchResult.suggested_topics.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => copyToClipboard(`Subject: ${pitchResult.subject}\n\n${pitchResult.body}`)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                <Copy className="w-4 h-4" /> Copy Pitch
              </button>
              <button onClick={handleSavePitch}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm bg-teal-500 text-white hover:bg-teal-600">
                <Check className="w-4 h-4" /> Save to Site
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  
  // Render Backlinks Tab
  const renderBacklinks = () => {
    const highestDA = publishedTargets.reduce((max, t) => 
      (t.domain_authority || 0) > (max?.domain_authority || 0) ? t : max, null);
    
    return (
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`rounded-xl border p-4 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Total Backlinks</p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{publishedTargets.length}</p>
          </div>
          <div className={`rounded-xl border p-4 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Average DA</p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats?.avg_da_published || 0}</p>
          </div>
          <div className={`rounded-xl border p-4 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Highest DA</p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {highestDA ? `${highestDA.site_name} (${highestDA.domain_authority})` : '-'}
            </p>
          </div>
        </div>
        
        {/* Backlinks Table */}
        {publishedTargets.length > 0 ? (
          <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Site</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>DA</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Published URL</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Backlink URL</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Anchor</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Date</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                  {publishedTargets.map(target => (
                    <tr key={target._id}>
                      <td className={`px-4 py-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{target.site_name}</td>
                      <td className={`px-4 py-3 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{target.domain_authority || '-'}</td>
                      <td className="px-4 py-3">
                        {target.published_url ? (
                          <a href={target.published_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-teal-400 hover:underline text-sm">
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : '-'}
                      </td>
                      <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{target.backlink_url || '-'}</td>
                      <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{target.anchor_text || '-'}</td>
                      <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        {target.published_date ? new Date(target.published_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setEditModal(target)} className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={`rounded-2xl border p-8 text-center ${isDarkMode ? 'bg-[#1E293B] border-slate-700' : 'bg-white border-gray-200'}`}>
            <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              No backlinks earned yet. Start reaching out to sites in the Pipeline tab.
            </p>
          </div>
        )}
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Send className="w-5 h-5 text-teal-400" />
        <div>
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Guest Post Outreach</h2>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Track outreach to Indian pet websites for backlink building
          </p>
        </div>
      </div>
      
      {/* Sub-tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {[
          { id: 'pipeline', label: 'Pipeline' },
          { id: 'all', label: 'All Sites' },
          { id: 'templates', label: 'Templates' },
          { id: 'backlinks', label: 'Backlinks' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-teal-500/20 text-teal-400'
                : isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      {activeTab === 'pipeline' && renderPipeline()}
      {activeTab === 'all' && renderAllSites()}
      {activeTab === 'templates' && renderTemplates()}
      {activeTab === 'backlinks' && renderBacklinks()}
      
      {/* Edit Modal */}
      {editModal !== null && (
        <EditModal 
          target={editModal._id ? editModal : null}
          onSave={handleSaveTarget}
          onClose={() => setEditModal(null)}
        />
      )}
      
      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 max-w-sm w-full ${isDarkMode ? 'bg-[#1E293B]' : 'bg-white'}`}>
            <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Delete Site?</h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Are you sure you want to delete "{deleteConfirm.site_name}"? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)}
                className={`px-4 py-2 rounded-lg font-medium ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm._id)}
                className="px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestPostOutreach;
