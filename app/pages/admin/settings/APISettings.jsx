import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { useNavigate, Link, useLocation } from 'react-router';
import { APIDiagnostics } from '../../../components/APIDiagnostics';
import { APIEditModal } from '../../../components/APIEditModal';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import BackupsSection from '../../../components/BackupsSection';
import SeasonalOverlaysSection from '../../../components/admin/settings/SeasonalOverlaysSection';
import { 
  Eye, EyeOff, Copy, ExternalLink, Plus, Pencil, Trash2, Check, Key, X, 
  Zap, RefreshCw, Settings, Shield, Database, Cloud, CreditCard, BarChart3, 
  Share2, Code, ShoppingBag, Globe, ChevronRight, Sparkles, MapPin, Search
} from 'lucide-react';
import { toast } from 'sonner';

// Platform logo URLs
const getPlatformLogo = (name) => {
  const logos = {
    // Cloud Services
    'cloudinary': 'https://res.cloudinary.com/demo/image/upload/cloudinary_icon.png',
    'firebase': 'https://www.gstatic.com/devrel-devsite/prod/v0e0f589edd85502a40d78d7d0825db8ea5ef3b99ab4070381ee86977c9168730/firebase/images/touchicon-180.png',
    'google cloud': 'https://www.gstatic.com/devrel-devsite/prod/v84899f04a47014423fe1c3a9bb2ad2e6e0e325f00e01cb5a7ff729be82d72ddd/cloud/images/cloud-logo.svg',
    'mongodb': 'https://www.mongodb.com/assets/images/global/favicon.ico',
    'aws': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Amazon_Web_Services_Logo.svg/120px-Amazon_Web_Services_Logo.svg.png',
    
    // Social Media
    'instagram': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/132px-Instagram_logo_2016.svg.png',
    'threads': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Threads_%28app%29.svg/120px-Threads_%28app%29.svg.png',
    'linkedin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/96px-LinkedIn_logo_initials.png',
    'twitter': 'https://abs.twimg.com/favicons/twitter.3.ico',
    'facebook': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/120px-Facebook_Logo_%282019%29.png',
    'google business': 'https://www.gstatic.com/images/branding/product/2x/business_messages_64dp.png',
    
    // Marketplace
    'amazon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/120px-Amazon_logo.svg.png',
    'flipkart': 'https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/flipkart-plus_8d85f4.png',
    'jiomart': 'https://www.jiomart.com/images/cms/aw_rbslider/slides/1684748498_JioMart-Logo.png',
    
    // Payment
    'razorpay': 'https://razorpay.com/favicon.png',
    'stripe': 'https://images.ctfassets.net/fzn2n1nzq965/3AGidihOJl4nH9D1vDjM84/9540155d584be52fc54c443b6efa4ae6/favicon.ico',
    'paypal': 'https://www.paypalobjects.com/webstatic/icon/favicon.ico',
    
    // Analytics
    'google search console': 'https://ssl.gstatic.com/search-console/scfe/search_console-64.png',
    'google analytics': 'https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg',
    'metricool': 'https://metricool.com/wp-content/uploads/favicon-metricool-2022.png',
    
    // Development
    'github': 'https://github.githubassets.com/favicons/favicon-dark.svg',
    'gitlab': 'https://gitlab.com/assets/favicon-72a2cad5025aa931d6ea56c3201d1f18e68a8cd39788c7c80d5b2b82aa5143ef.png',
    'figma': 'https://static.figma.com/app/icon/1/favicon.png',
    'gmail': 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico',
    'notion': 'https://www.notion.so/images/favicon.ico',
  };
  
  // Find matching logo (case-insensitive partial match)
  const nameLower = (name || '').toLowerCase();
  for (const [key, url] of Object.entries(logos)) {
    if (nameLower.includes(key) || key.includes(nameLower)) {
      return url;
    }
  }
  
  return null;
};

// Get category icon as fallback
const getCategoryIcon = (category) => {
  const icons = {
    'Cloud Services': Cloud,
    'Database': Database,
    'Payment': CreditCard,
    'Analytics': BarChart3,
    'Social Media': Share2,
    'Development': Code,
    'Marketplace': ShoppingBag,
    'Other': Globe,
  };
  return icons[category] || Key;
};

// Credential categories
const CREDENTIAL_CATEGORIES = [
  { value: 'Cloud Services', label: 'Cloud Services', color: 'bg-blue-500' },
  { value: 'Payment', label: 'Payment', color: 'bg-green-500' },
  { value: 'Database', label: 'Database', color: 'bg-purple-500' },
  { value: 'Analytics', label: 'Analytics', color: 'bg-orange-500' },
  { value: 'Social Media', label: 'Social Media', color: 'bg-pink-500' },
  { value: 'Development', label: 'Development', color: 'bg-cyan-500' },
  { value: 'Marketplace', label: 'Marketplace', color: 'bg-amber-500' },
  { value: 'Other', label: 'Other', color: 'bg-slate-500' }
];

const APISettings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState({});
  const [testResults, setTestResults] = useState({});
  const [error, setError] = useState(null);
  const [testingAll, setTestingAll] = useState(false);
  const [selectedAPIForDiag, setSelectedAPIForDiag] = useState(null);
  const [selectedAPIForEdit, setSelectedAPIForEdit] = useState(null);

  // Add API Modal State
  const [showAddApiModal, setShowAddApiModal] = useState(false);
  const [newApi, setNewApi] = useState({
    api_name: '',
    api_type: 'ai',
    endpoint: '',
    api_key: '',
    description: ''
  });
  const [addingApi, setAddingApi] = useState(false);

  // Team Credentials State
  const [credentials, setCredentials] = useState([]);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [copiedField, setCopiedField] = useState(null);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [editingCredential, setEditingCredential] = useState(null);
  const [credentialForm, setCredentialForm] = useState({
    name: '',
    category: 'Other',
    url: '',
    username: '',
    password: '',
    notes: ''
  });
  
  // Twitter API state
  const [twitterRevealed, setTwitterRevealed] = useState({});
  const [testingTwitter, setTestingTwitter] = useState(false);
  const [twitterPostingEnabled, setTwitterPostingEnabled] = useState(true);
  const [togglingTwitterPosting, setTogglingTwitterPosting] = useState(false);

  // Delete API state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [apiToDelete, setApiToDelete] = useState(null);
  const [deletingApi, setDeletingApi] = useState(false);
  
  // Cleanup state
  const [cleaningUp, setCleaningUp] = useState(false);

  const backendUrl = API_BASE_URL;

  useEffect(() => {
    fetchAPIs();
    fetchCredentials();
    fetchTwitterPostingStatus();
  }, []);

  // Scroll to Team Credentials section if URL has #credentials hash
  useEffect(() => {
    if (location.hash === '#credentials') {
      setTimeout(() => {
        const element = document.getElementById('team-credentials');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300); // Delay to ensure page is rendered
    }
  }, [location.hash]);

  const fetchAPIs = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${backendUrl}/api/admin/settings/apis`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: Failed to fetch APIs`);
      }

      const data = await response.json();
      const rawApis = data.settings || data.apis || [];
      
      // Normalize API data to ensure consistent field names
      const normalizedApis = rawApis.map(api => ({
        ...api,
        api_name: api.api_name || api.name || 'Unknown API',
        api_type: api.api_type || api.type || 'other',
        status: api.status || 'unknown'
      }));
      
      setApis(normalizedApis);
    } catch (err) {
      console.error('Error fetching APIs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============ CREDENTIALS FUNCTIONS ============
  const fetchCredentials = async () => {
    setCredentialsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${backendUrl}/api/admin/credentials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCredentials(data.credentials);
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
    }
    setCredentialsLoading(false);
  };

  const revealPassword = async (credentialId) => {
    if (revealedPasswords[credentialId]) {
      setRevealedPasswords(prev => ({ ...prev, [credentialId]: null }));
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${backendUrl}/api/admin/credentials/${credentialId}/reveal`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setRevealedPasswords(prev => ({ ...prev, [credentialId]: data.password }));
        setTimeout(() => {
          setRevealedPasswords(prev => ({ ...prev, [credentialId]: null }));
        }, 30000);
      }
    } catch (error) {
      console.error('Error revealing password:', error);
    }
  };

  const copyToClipboard = async (text, fieldId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  // Twitter API functions
  const revealTwitterCredential = async (field) => {
    if (twitterRevealed[field]) {
      setTwitterRevealed(prev => ({ ...prev, [field]: null }));
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${backendUrl}/api/twitter/settings/reveal/${field}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTwitterRevealed(prev => ({ ...prev, [field]: data.value }));
        setTimeout(() => {
          setTwitterRevealed(prev => ({ ...prev, [field]: null }));
        }, 30000);
      }
    } catch (error) {
      console.error('Error revealing Twitter credential:', error);
    }
  };

  const testTwitterConnection = async () => {
    setTestingTwitter(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${backendUrl}/api/twitter/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Twitter connected as @${data.username}`);
      } else {
        toast.error(data.error || 'Twitter connection failed');
      }
    } catch (error) {
      toast.error('Failed to test Twitter connection');
    } finally {
      setTestingTwitter(false);
    }
  };

  // Fetch Twitter posting status
  const fetchTwitterPostingStatus = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/twitter/posting-status`);
      const data = await response.json();
      setTwitterPostingEnabled(data.twitter_posting_enabled ?? true);
    } catch (error) {
      console.error('Error fetching Twitter posting status:', error);
    }
  };

  // Toggle Twitter posting
  const toggleTwitterPosting = async () => {
    setTogglingTwitterPosting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const newState = !twitterPostingEnabled;
      const response = await fetch(`${backendUrl}/api/twitter/posting-toggle`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled: newState })
      });
      const data = await response.json();
      if (data.success) {
        setTwitterPostingEnabled(newState);
        toast.success(data.message);
      } else {
        toast.error(data.detail || 'Failed to toggle Twitter posting');
      }
    } catch (error) {
      toast.error('Failed to toggle Twitter posting');
    } finally {
      setTogglingTwitterPosting(false);
    }
  };

  const getTwitterApi = () => {
    return apis.find(api => api.provider === 'twitter');
  };

  const handleSaveCredential = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const url = editingCredential
        ? `${backendUrl}/api/admin/credentials/${editingCredential._id}`
        : `${backendUrl}/api/admin/credentials`;
      const method = editingCredential ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(credentialForm)
      });

      const data = await response.json();
      if (data.success) {
        fetchCredentials();
        setShowCredentialModal(false);
        setEditingCredential(null);
        setCredentialForm({ name: '', category: 'Other', url: '', username: '', password: '', notes: '' });
      }
    } catch (error) {
      console.error('Error saving credential:', error);
    }
  };

  const handleDeleteCredential = async (credentialId) => {
    if (!window.confirm('Delete this credential?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${backendUrl}/api/admin/credentials/${credentialId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        fetchCredentials();
      }
    } catch (error) {
      console.error('Error deleting credential:', error);
    }
  };

  const openEditModal = (credential) => {
    setEditingCredential(credential);
    setCredentialForm({
      name: credential.name,
      category: credential.category,
      url: credential.url,
      username: credential.username,
      password: '',
      notes: credential.notes
    });
    setShowCredentialModal(true);
  };

  const openAddModal = () => {
    setEditingCredential(null);
    setCredentialForm({ name: '', category: 'Other', url: '', username: '', password: '', notes: '' });
    setShowCredentialModal(true);
  };

  const getCategoryColor = (category) => {
    const cat = CREDENTIAL_CATEGORIES.find(c => c.value === category);
    return cat ? cat.color : 'bg-slate-500';
  };

  // ============ API FUNCTIONS ============
  const testAPI = async (apiName) => {
    try {
      setTesting(prev => ({ ...prev, [apiName]: true }));
      setTestResults(prev => ({ ...prev, [apiName]: null }));
      const token = localStorage.getItem('adminToken');

      const response = await fetch(
        `${backendUrl}/api/admin/settings/apis/${encodeURIComponent(apiName)}/test`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();
      setTestResults(prev => ({ ...prev, [apiName]: data.result }));
      await fetchAPIs();
    } catch (err) {
      console.error('Error testing API:', err);
      setTestResults(prev => ({ 
        ...prev, 
        [apiName]: { status: 'error', message: err.message } 
      }));
    } finally {
      setTesting(prev => ({ ...prev, [apiName]: false }));
    }
  };

  const testAllAPIs = async () => {
    try {
      setTestingAll(true);
      setTestResults({});
      const token = localStorage.getItem('adminToken');

      const response = await fetch(
        `${backendUrl}/api/admin/settings/apis/test-all`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();
      const resultsMap = {};
      data.results?.forEach(result => {
        resultsMap[result.api_name] = result;
      });
      setTestResults(resultsMap);
      await fetchAPIs();
    } catch (err) {
      console.error('Error testing all APIs:', err);
    } finally {
      setTestingAll(false);
    }
  };

  // Delete API handler
  const handleDeleteAPI = async () => {
    if (!apiToDelete) return;
    
    setDeletingApi(true);
    try {
      const token = localStorage.getItem('adminToken');
      const apiIdentifier = apiToDelete.api_name || apiToDelete.name;
      
      const response = await fetch(
        `${backendUrl}/api/admin/settings/apis/${encodeURIComponent(apiIdentifier)}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();
      if (data.success && data.deleted) {
        toast.success(`${apiIdentifier} deleted successfully`);
        await fetchAPIs();
      } else {
        toast.error('Failed to delete API configuration');
      }
    } catch (err) {
      console.error('Error deleting API:', err);
      toast.error('Failed to delete API');
    } finally {
      setDeletingApi(false);
      setShowDeleteConfirm(false);
      setApiToDelete(null);
    }
  };

  const openDeleteConfirm = (api) => {
    setApiToDelete(api);
    setShowDeleteConfirm(true);
  };

  // Cleanup test/unknown APIs handler
  const handleCleanupAPIs = async () => {
    setCleaningUp(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${backendUrl}/api/admin/settings/apis/cleanup`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();
      if (data.success) {
        if (data.deleted_count > 0) {
          toast.success(`Cleaned up ${data.deleted_count} test/unknown APIs`, {
            description: data.deleted_names?.slice(0, 3).join(', ') + (data.deleted_names?.length > 3 ? '...' : '')
          });
          await fetchAPIs();
        } else {
          toast.info('No test/unknown APIs found to clean up');
        }
      } else {
        toast.error(data.error || 'Failed to cleanup APIs');
      }
    } catch (err) {
      console.error('Error cleaning up APIs:', err);
      toast.error('Failed to cleanup APIs');
    } finally {
      setCleaningUp(false);
    }
  };

  const handleEditAPI = async (payload) => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Use api_name if available, otherwise use name
      const apiIdentifier = selectedAPIForEdit.api_name || selectedAPIForEdit.name;
      
      if (!apiIdentifier) {
        throw new Error('Cannot identify API - no name or api_name found');
      }

      const updateResponse = await fetch(
        `${backendUrl}/api/admin/settings/apis/${encodeURIComponent(apiIdentifier)}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!updateResponse.ok) {
        // Clone response before reading to avoid "body already used" error
        const errorText = await updateResponse.text();
        let errorMessage = 'Failed to update API configuration';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // If not JSON, use the text or default message
          if (errorText) errorMessage = errorText;
        }
        throw new Error(errorMessage);
      }

      const testResponse = await fetch(
        `${backendUrl}/api/admin/settings/apis/${encodeURIComponent(apiIdentifier)}/test`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      // Safely parse test response
      let testData = { result: { status: 'error', message: 'Failed to parse test response' } };
      try {
        const testText = await testResponse.text();
        testData = JSON.parse(testText);
      } catch (parseError) {
        console.error('Error parsing test response:', parseError);
      }

      // Only refresh API list if test succeeded - let modal show result first
      // Backend returns status: 'active' for success, or success: true at top level
      const isSuccess = testData.success === true || testData.result?.status === 'active' || testData.result?.status === 'success';
      
      if (isSuccess) {
        // Delay fetchAPIs to let modal close first
        setTimeout(() => fetchAPIs(), 2000);
        return {
          success: true,
          message: `Updated and tested! Response: ${testData.result.response_time_ms}ms`
        };
      } else {
        // Don't refresh on error - let user see the error message
        return {
          success: false,
          message: testData.result?.message || 'Saved but test failed'
        };
      }
    } catch (err) {
      console.error('Error updating API:', err);
      return { success: false, message: err.message };
    }
  };

  // Handle Add New API
  const handleAddApi = async () => {
    if (!newApi.api_name || !newApi.endpoint || !newApi.api_key) {
      toast.error('Please fill in all required fields');
      return;
    }

    setAddingApi(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      // Build payload with optional fields
      const payload = {
        api_name: newApi.api_name,
        api_type: newApi.api_type,
        endpoint: newApi.endpoint,
        api_key: newApi.api_key
      };
      
      // Add analytics-specific fields if present
      if (newApi.api_type === 'analytics') {
        if (newApi.user_id) payload.user_id = newApi.user_id;
        if (newApi.blog_id) payload.blog_id = newApi.blog_id;
      }
      
      const response = await fetch(`${backendUrl}/api/admin/settings/apis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success('API added successfully');
        setShowAddApiModal(false);
        setNewApi({ api_name: '', api_type: 'ai', endpoint: '', api_key: '', description: '', user_id: '', blog_id: '' });
        fetchAPIs(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to add API');
      }
    } catch (error) {
      console.error('Error adding API:', error);
      toast.error('Failed to add API');
    } finally {
      setAddingApi(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'payment': return <Shield className="w-3 h-3" />;
      case 'analytics': return <Database className="w-3 h-3" />;
      case 'ai': return <Sparkles className="w-3 h-3" />;
      case 'location_service': 
      case 'location': return <MapPin className="w-3 h-3" />;
      case 'seo_indexing': 
      case 'seo': return <Search className="w-3 h-3" />;
      case 'authentication': return <Shield className="w-3 h-3" />;
      case 'media': return <Cloud className="w-3 h-3" />;
      default: return <Cloud className="w-3 h-3" />;
    }
  };

  // Get type badge styling
  const getTypeBadgeStyle = (type) => {
    const styles = {
      'location_service': 'bg-blue-500/20 text-blue-400',
      'location': 'bg-blue-500/20 text-blue-400',
      'analytics': 'bg-purple-500/20 text-purple-400',
      'payment': 'bg-green-500/20 text-green-400',
      'authentication': 'bg-cyan-500/20 text-cyan-400',
      'seo_indexing': 'bg-orange-500/20 text-orange-400',
      'seo': 'bg-orange-500/20 text-orange-400',
      'ai': 'bg-violet-500/20 text-violet-400',
      'media': 'bg-pink-500/20 text-pink-400'
    };
    return styles[type] || 'bg-slate-500/20 text-slate-400';
  };

  // Format type label for display
  const formatTypeLabel = (type) => {
    const labels = {
      'location_service': 'Location',
      'location': 'Location',
      'analytics': 'Analytics',
      'payment': 'Payment',
      'authentication': 'Auth',
      'seo_indexing': 'SEO',
      'seo': 'SEO',
      'ai': 'AI',
      'media': 'Media'
    };
    return labels[type] || type?.replace('_', ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || 'Service';
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Loading APIs...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-3">{error}</p>
          <button onClick={fetchAPIs} className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm mb-4">
        <Link 
          to="/admin/marketing" 
          className="text-teal-400 hover:text-teal-300 transition-colors"
        >
          Admin
        </Link>
        <ChevronRight size={14} className="text-slate-500" />
        <span className="text-white font-medium">Settings</span>
      </nav>

      {/* Page Header - Compact */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-white">API Settings</h1>
          <p className="text-xs text-slate-400">Manage and test external API integrations</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCleanupAPIs}
            disabled={cleaningUp}
            className="flex items-center gap-1.5 bg-amber-600/80 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            title="Remove test/unknown API entries"
          >
            {cleaningUp ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            {cleaningUp ? 'Cleaning...' : 'Cleanup'}
          </button>
          <button 
            onClick={() => setShowAddApiModal(true)} 
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add API
          </button>
          <button 
            onClick={testAllAPIs} 
            disabled={testingAll}
            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            {testingAll ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            {testingAll ? 'Testing...' : 'Test All'}
          </button>
        </div>
      </div>

      {/* API Table - Premium Compact Design */}
      {apis.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8 text-center">
          <Settings className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No APIs configured</p>
          <button onClick={fetchAPIs} className="mt-3 text-xs text-teal-400 hover:text-teal-300">
            Refresh
          </button>
        </div>
      ) : (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-700/30 border-b border-slate-700/50">
                <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-slate-400 font-medium">API</th>
                <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-slate-400 font-medium">Type</th>
                <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-slate-400 font-medium">Status</th>
                <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-slate-400 font-medium">Endpoint</th>
                <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-slate-400 font-medium">Tested</th>
                <th className="px-4 py-2 text-right text-xs uppercase tracking-wider text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apis.map((api, index) => (
                <tr 
                  key={api.api_name} 
                  className={`hover:bg-slate-700/20 transition-colors border-b border-slate-700/30 ${index === apis.length - 1 ? 'border-0' : ''}`}
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-white">{api.api_name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${getTypeBadgeStyle(api.api_type)}`}>
                      {getTypeIcon(api.api_type)}
                      {formatTypeLabel(api.api_type)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                      (api.status === 'success' || api.status === 'active')
                        ? 'bg-green-500/20 text-green-400' 
                        : api.status === 'error'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {(api.status === 'success' || api.status === 'active') ? (
                        <Check className="w-3 h-3" />
                      ) : api.status === 'error' ? (
                        <X className="w-3 h-3" />
                      ) : null}
                      {(api.status === 'success' || api.status === 'active') ? 'Active' : api.status === 'error' ? 'Error' : 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-mono text-slate-300 truncate max-w-[200px]">
                        {api.endpoint || '-'}
                      </div>
                      <div className="text-xs font-mono text-slate-500">
                        Key: {api.api_key || '••••••••'}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-400">
                      {formatDate(api.last_tested)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => setSelectedAPIForEdit(api)}
                        className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600 transition-colors" 
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-300" />
                      </button>
                      <button 
                        onClick={() => testAPI(api.api_name)}
                        disabled={testing[api.api_name]}
                        className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-amber-500/20 hover:text-amber-400 transition-colors" 
                        title="Test"
                      >
                        {testing[api.api_name] ? (
                          <RefreshCw className="w-3.5 h-3.5 text-slate-300 animate-spin" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 text-slate-300" />
                        )}
                      </button>
                      <button 
                        onClick={() => setSelectedAPIForDiag(api)}
                        className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-blue-500/20 hover:text-blue-400 transition-colors" 
                        title="Diagnostics"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-300" />
                      </button>
                      <button 
                        onClick={() => openDeleteConfirm(api)}
                        className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-red-500/20 transition-colors" 
                        title="Delete"
                        data-testid={`delete-api-${api.api_name?.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-300 hover:text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Google Product Studio API Section */}
      <div className="mt-8 pt-6 border-t border-slate-700/50">
        <div className="bg-gradient-to-r from-amber-900/20 via-orange-900/10 to-amber-900/20 rounded-xl border border-amber-500/30 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    Google Product Studio API
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 uppercase tracking-wider">Alpha</span>
                  </h2>
                  <p className="text-xs text-slate-400">AI-powered product image generation</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {apis.find(api => api.api_name === 'Google Product Studio API')?.api_key ? (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                    <Check className="w-3 h-3" />
                    Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                    <Shield className="w-3 h-3" />
                    Not Configured
                  </span>
                )}
              </div>
            </div>
            
            <div className="mt-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-1.5 rounded-lg bg-blue-500/20">
                  <Globe className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-white">How to get access:</strong><br />
                    1. Go to <a href="https://merchants.google.com" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">Google Merchant Center</a><br />
                    2. Navigate to Creative Content → Product Studio<br />
                    3. Apply for alpha access (limited availability)<br />
                    4. Once approved, generate API credentials in Google Cloud Console
                  </p>
                </div>
              </div>
              
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Service Account JSON</label>
                  <div className="relative">
                    <input 
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            try {
                              const jsonContent = JSON.parse(event.target.result);
                              toast.success('Service account JSON loaded - save to configure');
                              // Store in state for saving
                              setNewApi({
                                api_name: 'Google Product Studio API',
                                api_type: 'ai',
                                endpoint: 'https://productstudio.googleapis.com',
                                api_key: jsonContent.private_key?.substring(0, 50) || '',
                                description: 'Google Product Studio for AI image generation',
                                project_id: jsonContent.project_id
                              });
                            } catch (error) {
                              toast.error('Invalid JSON file');
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-700 text-slate-300 rounded-lg border border-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-teal-500 file:text-white hover:file:bg-teal-600 cursor-pointer"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">Upload the service account JSON from Google Cloud Console</p>
                </div>
                
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Project ID</label>
                  <input 
                    type="text"
                    placeholder="your-gcp-project-id"
                    className="w-full px-3 py-2 text-xs bg-slate-700 text-white rounded-lg border border-slate-600 placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Merchant ID</label>
                  <input 
                    type="text"
                    placeholder="5640753810"
                    defaultValue="5640753810"
                    className="w-full px-3 py-2 text-xs bg-slate-700 text-white rounded-lg border border-slate-600 placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <a 
                  href="https://developers.google.com/product-studio/reference/rest" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  API Documentation
                </a>
                <button
                  onClick={() => toast.info('Save functionality - coming soon. Contact support for manual configuration.')}
                  className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Twitter API Section */}
      {getTwitterApi() && (
        <div className="mt-8 pt-6 border-t border-slate-700/50">
          <div className="bg-gradient-to-r from-sky-900/20 via-blue-900/10 to-sky-900/20 rounded-xl border border-sky-500/30 overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-500/20">
                    <Share2 className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                      Twitter/X API
                      {getTwitterApi()?.is_active ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 uppercase tracking-wider">Active</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-400 uppercase tracking-wider">Inactive</span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-400">{getTwitterApi()?.description || 'Post tweets from PetYupp account'}</p>
                  </div>
                </div>
                <button
                  onClick={testTwitterConnection}
                  disabled={testingTwitter}
                  className="flex items-center gap-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  {testingTwitter ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  Test Connection
                </button>
              </div>

              {/* Twitter Credentials Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Bearer Token */}
                <div className="bg-slate-800/50 rounded-lg p-3 group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Bearer Token</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => revealTwitterCredential('bearer_token')} className="p-1 hover:bg-slate-700 rounded">
                        {twitterRevealed.bearer_token ? <EyeOff className="w-3 h-3 text-slate-400" /> : <Eye className="w-3 h-3 text-slate-400" />}
                      </button>
                      {twitterRevealed.bearer_token && (
                        <button onClick={() => copyToClipboard(twitterRevealed.bearer_token, 'twitter-bearer')} className="p-1 hover:bg-slate-700 rounded">
                          {copiedField === 'twitter-bearer' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-300 break-all">
                    {twitterRevealed.bearer_token || (getTwitterApi()?.has_bearer_token ? getTwitterApi()?.bearer_token : '-')}
                  </span>
                </div>

                {/* Consumer Key */}
                <div className="bg-slate-800/50 rounded-lg p-3 group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Consumer Key</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => revealTwitterCredential('consumer_key')} className="p-1 hover:bg-slate-700 rounded">
                        {twitterRevealed.consumer_key ? <EyeOff className="w-3 h-3 text-slate-400" /> : <Eye className="w-3 h-3 text-slate-400" />}
                      </button>
                      {twitterRevealed.consumer_key && (
                        <button onClick={() => copyToClipboard(twitterRevealed.consumer_key, 'twitter-consumer-key')} className="p-1 hover:bg-slate-700 rounded">
                          {copiedField === 'twitter-consumer-key' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-300 break-all">
                    {twitterRevealed.consumer_key || (getTwitterApi()?.has_consumer_key ? getTwitterApi()?.consumer_key : '-')}
                  </span>
                </div>

                {/* Consumer Secret */}
                <div className="bg-slate-800/50 rounded-lg p-3 group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Consumer Secret</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => revealTwitterCredential('consumer_secret')} className="p-1 hover:bg-slate-700 rounded">
                        {twitterRevealed.consumer_secret ? <EyeOff className="w-3 h-3 text-slate-400" /> : <Eye className="w-3 h-3 text-slate-400" />}
                      </button>
                      {twitterRevealed.consumer_secret && (
                        <button onClick={() => copyToClipboard(twitterRevealed.consumer_secret, 'twitter-consumer-secret')} className="p-1 hover:bg-slate-700 rounded">
                          {copiedField === 'twitter-consumer-secret' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-300 break-all">
                    {twitterRevealed.consumer_secret || (getTwitterApi()?.has_consumer_secret ? getTwitterApi()?.consumer_secret : '-')}
                  </span>
                </div>

                {/* Access Token */}
                <div className="bg-slate-800/50 rounded-lg p-3 group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Access Token</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => revealTwitterCredential('access_token')} className="p-1 hover:bg-slate-700 rounded">
                        {twitterRevealed.access_token ? <EyeOff className="w-3 h-3 text-slate-400" /> : <Eye className="w-3 h-3 text-slate-400" />}
                      </button>
                      {twitterRevealed.access_token && (
                        <button onClick={() => copyToClipboard(twitterRevealed.access_token, 'twitter-access-token')} className="p-1 hover:bg-slate-700 rounded">
                          {copiedField === 'twitter-access-token' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-300 break-all">
                    {twitterRevealed.access_token || (getTwitterApi()?.has_access_token ? getTwitterApi()?.access_token : '-')}
                  </span>
                </div>

                {/* Access Token Secret */}
                <div className="bg-slate-800/50 rounded-lg p-3 group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Access Token Secret</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => revealTwitterCredential('access_token_secret')} className="p-1 hover:bg-slate-700 rounded">
                        {twitterRevealed.access_token_secret ? <EyeOff className="w-3 h-3 text-slate-400" /> : <Eye className="w-3 h-3 text-slate-400" />}
                      </button>
                      {twitterRevealed.access_token_secret && (
                        <button onClick={() => copyToClipboard(twitterRevealed.access_token_secret, 'twitter-access-secret')} className="p-1 hover:bg-slate-700 rounded">
                          {copiedField === 'twitter-access-secret' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-300 break-all">
                    {twitterRevealed.access_token_secret || (getTwitterApi()?.has_access_token_secret ? getTwitterApi()?.access_token_secret : '-')}
                  </span>
                </div>
              </div>

              {/* Twitter Posting Kill Switch */}
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-200">Twitter Posting</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Enable or disable all Twitter API posting system-wide
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold ${twitterPostingEnabled ? 'text-emerald-400' : 'text-red-400'}`}>
                      {twitterPostingEnabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                    <button
                      onClick={toggleTwitterPosting}
                      disabled={togglingTwitterPosting}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                        twitterPostingEnabled ? 'bg-teal-500' : 'bg-slate-600'
                      } ${togglingTwitterPosting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      data-testid="twitter-posting-toggle"
                    >
                      <span 
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                          twitterPostingEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                {!twitterPostingEnabled && (
                  <div className="mt-3 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <div className="text-xs text-amber-400">
                      All Twitter posting is paused. Posts from AI Hub, Marketing Hub, and Shoutout Generator will be blocked until re-enabled.
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <a 
                  href="https://developer.twitter.com/en/docs/twitter-api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Twitter API Docs
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Credentials Section - Premium Compact Design */}
      <div id="team-credentials" className="mt-8 pt-6 border-t border-slate-700/50 scroll-mt-20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/20">
              <Key className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Team Credentials</h2>
              <p className="text-xs text-slate-400">Quick access to platform logins</p>
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

        {credentialsLoading ? (
          <div className="text-center py-6 text-slate-400 text-xs">Loading credentials...</div>
        ) : credentials.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 text-center">
            <Key className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No credentials saved</p>
            <button onClick={openAddModal} className="mt-2 text-xs text-teal-400 hover:text-teal-300">
              Add your first credential
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {credentials.map((cred) => (
              <div 
                key={cred._id} 
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-3 hover:border-slate-600 transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* Platform Logo or Category Icon */}
                    {getPlatformLogo(cred.name) ? (
                      <img 
                        src={getPlatformLogo(cred.name)} 
                        alt=""
                        className="w-5 h-5 object-contain rounded flex-shrink-0"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          // Show fallback icon
                          const IconComponent = getCategoryIcon(cred.category);
                          const fallback = document.createElement('div');
                          fallback.className = 'w-5 h-5 text-slate-400';
                          e.target.parentNode.appendChild(fallback);
                        }}
                      />
                    ) : (
                      (() => {
                        const IconComponent = getCategoryIcon(cred.category);
                        return <IconComponent className="w-5 h-5 text-slate-400 flex-shrink-0" />;
                      })()
                    )}
                    <span className="text-sm font-medium text-white">{cred.name}</span>
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                    {cred.category}
                  </span>
                </div>

                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Username</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono text-slate-300">{cred.username || '-'}</span>
                      {cred.username && (
                        <button 
                          onClick={() => copyToClipboard(cred.username, `user-${cred._id}`)} 
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {copiedField === `user-${cred._id}` ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-500 hover:text-white" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Password</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono text-slate-300">
                        {revealedPasswords[cred._id] || (cred.has_password ? '••••••••' : '-')}
                      </span>
                      {cred.has_password && (
                        <>
                          <button 
                            onClick={() => revealPassword(cred._id)} 
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {revealedPasswords[cred._id] ? (
                              <EyeOff className="w-3 h-3 text-slate-500 hover:text-white" />
                            ) : (
                              <Eye className="w-3 h-3 text-slate-500 hover:text-white" />
                            )}
                          </button>
                          {revealedPasswords[cred._id] && (
                            <button 
                              onClick={() => copyToClipboard(revealedPasswords[cred._id], `pass-${cred._id}`)} 
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {copiedField === `pass-${cred._id}` ? (
                                <Check className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-500 hover:text-white" />
                              )}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                  {cred.url ? (
                    <a 
                      href={cred.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
                    >
                      Open <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span />
                  )}
                  <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditModal(cred)} 
                      className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-300" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCredential(cred._id)} 
                      className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Diagnostics Modal */}
      {selectedAPIForDiag && (
        <APIDiagnostics
          api={selectedAPIForDiag}
          onClose={() => setSelectedAPIForDiag(null)}
          onRetry={async () => {
            await testAPI(selectedAPIForDiag.api_name);
            const updatedAPI = apis.find(a => a.api_name === selectedAPIForDiag.api_name);
            if (updatedAPI) {
              setSelectedAPIForDiag(updatedAPI);
            }
          }}
        />
      )}

      {/* Edit Modal */}
      {selectedAPIForEdit && (
        <APIEditModal
          api={selectedAPIForEdit}
          onClose={() => setSelectedAPIForEdit(null)}
          onSave={handleEditAPI}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setApiToDelete(null);
        }}
        onConfirm={handleDeleteAPI}
        title="Delete API Configuration"
        message="Are you sure you want to delete this API configuration? This will remove all stored credentials and settings."
        itemName={apiToDelete?.api_name}
        warning="This action cannot be undone."
        confirmText="Delete"
        confirmColor="red"
        icon="trash"
        isLoading={deletingApi}
      />

      {/* Credential Add/Edit Modal - Compact */}
      {showCredentialModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-4 w-full max-w-sm mx-4 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">
                {editingCredential ? 'Edit Credential' : 'Add Credential'}
              </h3>
              <button 
                onClick={() => setShowCredentialModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Platform</label>
                <input
                  type="text"
                  value={credentialForm.name}
                  onChange={(e) => setCredentialForm({ ...credentialForm, name: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-2.5 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  placeholder="e.g. Cloudinary"
                />
              </div>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">Category</label>
                <select
                  value={credentialForm.category}
                  onChange={(e) => setCredentialForm({ ...credentialForm, category: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-teal-500"
                >
                  {CREDENTIAL_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">Login URL</label>
                <input
                  type="url"
                  value={credentialForm.url}
                  onChange={(e) => setCredentialForm({ ...credentialForm, url: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-2.5 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  placeholder="https://..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Username</label>
                  <input
                    type="text"
                    value={credentialForm.username}
                    onChange={(e) => setCredentialForm({ ...credentialForm, username: e.target.value })}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-2.5 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Password {editingCredential && <span className="text-slate-500">(blank=keep)</span>}
                  </label>
                  <input
                    type="password"
                    value={credentialForm.password}
                    onChange={(e) => setCredentialForm({ ...credentialForm, password: e.target.value })}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-2.5 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowCredentialModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-1.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCredential}
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white text-xs py-1.5 rounded-lg transition-colors"
              >
                {editingCredential ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add API Modal */}
      {showAddApiModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Add New API</h2>
              <button 
                onClick={() => setShowAddApiModal(false)}
                className="p-1 hover:bg-slate-700 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">API Name *</label>
                <input
                  type="text"
                  value={newApi.api_name}
                  onChange={(e) => setNewApi({...newApi, api_name: e.target.value})}
                  placeholder="e.g., Anthropic Claude API"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select
                  value={newApi.api_type}
                  onChange={(e) => setNewApi({...newApi, api_type: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="ai">AI Generation</option>
                  <option value="location_service">Location Service</option>
                  <option value="analytics">Analytics</option>
                  <option value="payment">Payment</option>
                  <option value="authentication">Authentication</option>
                  <option value="seo_indexing">SEO Indexing</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Endpoint URL *</label>
                <input
                  type="text"
                  value={newApi.endpoint}
                  onChange={(e) => setNewApi({...newApi, endpoint: e.target.value})}
                  placeholder="https://api.example.com/v1"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">API Key *</label>
                <input
                  type="password"
                  value={newApi.api_key}
                  onChange={(e) => setNewApi({...newApi, api_key: e.target.value})}
                  placeholder="sk-ant-xxxxxxxxxxxxx"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Metricool-specific fields */}
              {newApi.api_type === 'analytics' && (
                <>
                  <div className="pt-3 border-t border-slate-700">
                    <p className="text-xs text-slate-500 mb-3">For Metricool: Get these from your Metricool dashboard URL</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">User ID</label>
                        <input
                          type="text"
                          value={newApi.user_id || ''}
                          onChange={(e) => setNewApi({...newApi, user_id: e.target.value})}
                          placeholder="e.g., 4245681"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Blog ID</label>
                        <input
                          type="text"
                          value={newApi.blog_id || ''}
                          onChange={(e) => setNewApi({...newApi, blog_id: e.target.value})}
                          placeholder="e.g., 54658598"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddApiModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddApi}
                disabled={addingApi}
                className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {addingApi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add API'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seasonal Logo Overlays Section */}
      <div className="mt-6">
        <SeasonalOverlaysSection />
      </div>

      {/* Database Backups Section */}
      <div className="mt-6">
        <BackupsSection />
      </div>
    </div>
  );
};

export default APISettings;
