import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '@/config/api';
import { 
  Send, Twitter, MessageSquare, Linkedin, Check, X, 
  RefreshCw, ExternalLink, Clock, Handshake, Rocket, 
  Tag, MessageCircle, AlertTriangle, Package, Image,
  Trash2, Edit3, Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import ShoutoutGeneratorModal from '../sales/ShoutoutGeneratorModal';

const API_URL = API_BASE_URL + '/api';

// Platform configurations
const PLATFORMS = [
  { id: 'twitter', name: 'Twitter', icon: Twitter, maxChars: 280, active: true },
  { id: 'reddit', name: 'Reddit', icon: MessageSquare, maxChars: 40000, active: false },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, maxChars: 3000, active: false }
];

// Generate product launch content
const generateProductLaunchContent = (product) => {
  if (!product) return '';
  
  const name = product.name || 'Product';
  const description = product.description || product.short_description || '';
  const briefDesc = description.substring(0, 50) + (description.length > 50 ? '...' : '');
  
  const features = [];
  if (product.features && Array.isArray(product.features)) {
    features.push(...product.features.slice(0, 3));
  } else {
    if (description.toLowerCase().includes('protein')) features.push('High protein content');
    if (description.toLowerCase().includes('natural')) features.push('100% natural ingredients');
    if (description.toLowerCase().includes('healthy')) features.push('Healthy & nutritious');
    if (description.toLowerCase().includes('crunchy')) features.push('Crunchy & delicious');
    if (description.toLowerCase().includes('premium')) features.push('Premium quality');
    if (features.length === 0) {
      features.push('Made with love', 'Great taste', 'Healthy treat');
    }
  }
  
  return `🚀 NEW IN STOCK! 🚀

${name}

${briefDesc}

✓ ${features[0] || 'Premium quality'}
✓ ${features[1] || 'Natural ingredients'}
✓ ${features[2] || 'Dogs love it!'}

🛒 Shop now: oyebark.com

#OyeBark #DogTreats #${name.split(' ').slice(-1)[0] || 'NewProduct'}`;
};

// Quick templates (static ones)
const TEMPLATES = {
  promotion: {
    icon: Tag,
    label: 'Promotion',
    content: `🎉 SPECIAL OFFER! 🎉

[Offer details]

Use code: [CODE]
Valid until: [Date]

🛒 oyebark.com

#OyeBark #DogTreats #Sale`
  },
  engagement: {
    icon: MessageCircle,
    label: 'Engagement',
    content: `What's your dog's favorite treat? 🐕

Drop your answer below! 👇

#OyeBark #DogParents #PetCommunity`
  }
};

const PostTab = () => {
  const { isDarkMode } = useAdminTheme();
  const [selectedPlatform, setSelectedPlatform] = useState('twitter');
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [postResult, setPostResult] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [showShoutoutModal, setShowShoutoutModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [twitterPostingEnabled, setTwitterPostingEnabled] = useState(true);
  
  // Image upload state
  const [imageUrl, setImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  
  // Draft state
  const [currentDraftId, setCurrentDraftId] = useState(null);
  const [savingDraft, setSavingDraft] = useState(false);

  const currentPlatform = PLATFORMS.find(p => p.id === selectedPlatform);
  const charCount = content.length;
  const maxChars = currentPlatform?.maxChars || 280;

  // Check if posting is disabled (Twitter-specific)
  const isTwitterDisabled = selectedPlatform === 'twitter' && !twitterPostingEnabled;

  // Fetch Twitter posting status
  const fetchTwitterPostingStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/twitter/posting-status`);
      const data = await response.json();
      setTwitterPostingEnabled(data.twitter_posting_enabled ?? true);
    } catch (error) {
      console.error('Error fetching Twitter posting status:', error);
    }
  };

  // Fetch recent posts (includes drafts)
  const fetchRecentPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/twitter/social-posts?limit=10&include_drafts=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        // Sort: drafts first, then by date
        const sorted = (data.posts || []).sort((a, b) => {
          if (a.status === 'draft' && b.status !== 'draft') return -1;
          if (a.status !== 'draft' && b.status === 'draft') return 1;
          const dateA = new Date(a.updated_at || a.posted_at);
          const dateB = new Date(b.updated_at || b.posted_at);
          return dateB - dateA;
        });
        setRecentPosts(sorted);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentPosts();
    fetchTwitterPostingStatus();
  }, [fetchRecentPosts]);

  // Get character count color
  const getCharCountColor = () => {
    if (charCount > maxChars) return isDarkMode ? 'text-red-400 bg-red-500/20' : 'text-red-600 bg-red-100';
    if (charCount > 270) return isDarkMode ? 'text-red-400 bg-red-500/20' : 'text-red-600 bg-red-100';
    if (charCount >= 250) return isDarkMode ? 'text-yellow-400 bg-yellow-500/20' : 'text-yellow-600 bg-yellow-100';
    return isDarkMode ? 'text-green-400 bg-green-500/20' : 'text-green-600 bg-green-100';
  };

  // Handle image upload
  const handleImageUpload = async (file) => {
    if (!file) return;
    
    // Validate file type BEFORE uploading
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid format. Use JPG, PNG, GIF, or WEBP.');
      return;
    }
    
    // Validate file size (max 5MB for Twitter) BEFORE uploading
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      toast.error(`File too large (${sizeMB}MB). Maximum size is 5MB.`);
      return;
    }
    
    setUploading(true);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 30000); // 30 second timeout
    
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'social-posts');
      
      const response = await fetch(`${API_URL}/admin/upload/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.url) {
        setImageUrl(data.url);
        toast.success('Image uploaded successfully');
      } else {
        toast.error(data.error || 'Upload failed. Please try again.');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Upload error:', error);
      
      if (error.name === 'AbortError') {
        toast.error('Upload timed out. Please try again with a smaller image.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        toast.error('Network error. Check your connection and try again.');
      } else {
        toast.error('Upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
      // Reset file input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Cancel upload
  const cancelUpload = () => {
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info('Upload cancelled');
  };

  // File input change handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  // Remove image
  const removeImage = () => {
    setImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save draft
  const handleSaveDraft = async () => {
    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }
    
    setSavingDraft(true);
    try {
      const token = localStorage.getItem('adminToken');
      const endpoint = currentDraftId 
        ? `${API_URL}/twitter/drafts/${currentDraftId}`
        : `${API_URL}/twitter/drafts`;
      
      const response = await fetch(endpoint, {
        method: currentDraftId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          platform: selectedPlatform,
          content: content.trim(),
          image_url: imageUrl
        })
      });
      
      const data = await response.json();
      if (data.success) {
        if (!currentDraftId && data.draft_id) {
          setCurrentDraftId(data.draft_id);
        }
        toast.success(currentDraftId ? 'Draft updated' : 'Draft saved');
        fetchRecentPosts();
      } else {
        toast.error(data.error || 'Failed to save draft');
      }
    } catch (error) {
      console.error('Save draft error:', error);
      toast.error('Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  // Load draft into editor
  const loadDraft = (draft) => {
    setContent(draft.content || '');
    setImageUrl(draft.image_url || null);
    setCurrentDraftId(draft._id);
    toast.success('Draft loaded - edit and post when ready');
  };

  // Delete draft
  const handleDeleteDraft = async (draftId, e) => {
    e?.stopPropagation();
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/twitter/drafts/${draftId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Draft deleted');
        // Clear editor if this was the loaded draft
        if (currentDraftId === draftId) {
          setContent('');
          setImageUrl(null);
          setCurrentDraftId(null);
        }
        fetchRecentPosts();
      } else {
        toast.error(data.error || 'Failed to delete draft');
      }
    } catch (error) {
      toast.error('Failed to delete draft');
    }
  };

  // Clear editor (new post)
  const clearEditor = () => {
    setContent('');
    setImageUrl(null);
    setCurrentDraftId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle post click
  const handlePostClick = () => {
    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }
    if (charCount > maxChars) {
      toast.error(`Content exceeds ${maxChars} character limit`);
      return;
    }
    setPostResult(null);
    setShowConfirmModal(true);
  };

  // Confirm and post
  const confirmPost = async () => {
    setPosting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/twitter/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          text: content,
          image_url: imageUrl,
          draft_id: currentDraftId
        })
      });

      const data = await response.json();
      if (data.success) {
        setPostResult({ success: true, tweet_url: data.tweet_url });
        clearEditor();
        fetchRecentPosts();
        toast.success('Posted successfully!');
      } else {
        setPostResult({ success: false, error: data.error });
        toast.error(data.error || 'Failed to post');
      }
    } catch (error) {
      setPostResult({ success: false, error: 'Failed to connect' });
      toast.error('Failed to post');
    } finally {
      setPosting(false);
    }
  };

  // Apply template
  const applyTemplate = (templateKey) => {
    setContent(TEMPLATES[templateKey].content);
    setCurrentDraftId(null); // Clear draft ID when using template
  };

  // Format relative time
  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
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

  // Get platform icon component
  const getPlatformIcon = (platform) => {
    const config = PLATFORMS.find(p => p.id === platform);
    return config?.icon || Twitter;
  };

  return (
    <div className="space-y-6" data-testid="post-tab">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <Send className="w-5 h-5 text-teal-500" />
            Social Post
            {currentDraftId && (
              <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-500 rounded ml-2">
                Editing Draft
              </span>
            )}
          </h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Create and publish content to social media</p>
        </div>
        {currentDraftId && (
          <button
            onClick={clearEditor}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              isDarkMode 
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            + New Post
          </button>
        )}
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex gap-6">
        {/* Left Column - Compose Section */}
        <div className="flex-1 space-y-4">
          {/* Platform Selector */}
          <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
            <label className={`text-xs uppercase tracking-wider mb-3 block ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Platform</label>
            <div className="flex gap-2">
              {PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.id}
                    onClick={() => platform.active && setSelectedPlatform(platform.id)}
                    disabled={!platform.active}
                    data-testid={`platform-btn-${platform.id}`}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      selectedPlatform === platform.id && platform.active
                        ? 'bg-teal-500/20 border-teal-500 text-teal-500'
                        : platform.active
                          ? isDarkMode 
                            ? 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                          : isDarkMode
                            ? 'bg-slate-800/30 border-slate-700/50 text-slate-500 cursor-not-allowed'
                            : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{platform.name}</span>
                    {!platform.active && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-slate-600 text-slate-400' : 'bg-gray-200 text-gray-500'}`}>Soon</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compose Area */}
          <div 
            className={`rounded-xl border overflow-hidden transition-all ${
              isDragging 
                ? 'border-teal-500 ring-2 ring-teal-500/20' 
                : isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200 shadow-sm'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isDragging ? "Drop image here..." : "What's happening?"}
              data-testid="post-content-textarea"
              className={`w-full p-4 text-sm resize-y focus:outline-none min-h-[150px] ${
                isDarkMode 
                  ? 'bg-slate-900/50 text-slate-200 placeholder-slate-500' 
                  : 'bg-white text-gray-900 placeholder-gray-400'
              }`}
              style={{ minHeight: '150px' }}
            />
            
            {/* Attach Image Row - Separate row below textarea */}
            <div className={`px-4 py-2 ${isDarkMode ? 'bg-slate-900/30' : 'bg-gray-50/50'}`}>
              <div className="flex items-center gap-3">
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  data-testid="image-upload-input"
                />
                {/* Attach Image Button */}
                <button
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  disabled={uploading}
                  data-testid="attach-image-btn"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    uploading
                      ? isDarkMode ? 'border-slate-600 bg-slate-700 text-slate-400 cursor-wait' : 'border-gray-300 bg-gray-100 text-gray-400 cursor-wait'
                      : isDarkMode 
                        ? 'border-teal-500/50 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 hover:border-teal-500' 
                        : 'border-teal-500/50 bg-teal-50 text-teal-600 hover:bg-teal-100 hover:border-teal-500'
                  }`}
                  title="Attach image (JPG, PNG, GIF, WebP • Max 5MB)"
                >
                  {uploading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Image className="w-4 h-4" />
                  )}
                  <span>{uploading ? 'Uploading...' : 'Attach Image'}</span>
                </button>
                
                {/* Cancel button while uploading */}
                {uploading && (
                  <button
                    onClick={cancelUpload}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400' 
                        : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                    }`}
                    title="Cancel upload"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                
                {/* Image Preview (if attached) - inline with button */}
                {imageUrl && (
                  <div className="relative inline-block">
                    <img 
                      src={imageUrl} 
                      alt="Attached" 
                      className={`h-12 w-auto rounded-lg object-cover border ${isDarkMode ? 'border-slate-600' : 'border-gray-300'}`}
                    />
                    <button
                      onClick={removeImage}
                      className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Image Guidelines - shown below the button */}
              <p className={`text-xs mt-1.5 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                JPG, PNG, GIF, WEBP • Max 5MB • Recommended 1200×675px
              </p>
            </div>
            
            {/* Compose Footer - Character count and buttons */}
            <div className={`flex items-center justify-between p-3 border-t ${isDarkMode ? 'border-slate-700/50 bg-slate-800/30' : 'border-gray-200 bg-gray-50'}`}>
              {/* Left side - Character Count */}
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getCharCountColor()}`}>
                  {charCount} / {maxChars}
                  {charCount <= maxChars ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                </span>
                {charCount > maxChars - 50 && charCount <= maxChars && (
                  <span className={`text-xs ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    {maxChars - charCount} chars remaining
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveDraft}
                  disabled={savingDraft || !content.trim()}
                  data-testid="save-draft-btn"
                  className={`px-3 py-1.5 border text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
                    savingDraft || !content.trim()
                      ? isDarkMode ? 'border-slate-700 text-slate-500 cursor-not-allowed' : 'border-gray-200 text-gray-400 cursor-not-allowed'
                      : isDarkMode 
                        ? 'border-slate-600 hover:bg-slate-700 text-slate-300' 
                        : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {savingDraft ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Edit3 className="w-3.5 h-3.5" />
                  )}
                  {currentDraftId ? 'Update Draft' : 'Save Draft'}
                </button>
                <button
                  onClick={handlePostClick}
                  disabled={!content.trim() || charCount > maxChars || !currentPlatform?.active || isTwitterDisabled}
                  data-testid="post-now-btn"
                  title={isTwitterDisabled ? 'Twitter posting disabled - enable in Settings' : ''}
                  className={`px-4 py-1.5 text-white text-sm rounded-lg flex items-center gap-2 transition-colors ${
                    !content.trim() || charCount > maxChars || !currentPlatform?.active || isTwitterDisabled
                      ? isDarkMode ? 'bg-slate-600 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed'
                      : 'bg-teal-500 hover:bg-teal-600'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  {isTwitterDisabled ? 'Twitter Disabled' : 'Post Now'}
                </button>
                {isTwitterDisabled && (
                  <span className="text-xs text-red-400">Enable in Settings</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Templates */}
          <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
            <label className={`text-xs uppercase tracking-wider mb-3 block ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Quick Templates</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setShowShoutoutModal(true)}
                data-testid="partner-shoutout-btn"
                className={`flex flex-col items-center gap-2 p-3 border rounded-lg transition-colors group ${
                  isDarkMode 
                    ? 'bg-slate-700/30 hover:bg-slate-700/50 border-slate-600/50' 
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                }`}
              >
                <Handshake className="w-5 h-5 text-purple-500 group-hover:text-purple-400" />
                <span className={`text-xs text-center ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Partner Shoutout</span>
              </button>
              <button
                onClick={() => setShowProductModal(true)}
                data-testid="product-launch-btn"
                className={`flex flex-col items-center gap-2 p-3 border rounded-lg transition-colors group ${
                  isDarkMode 
                    ? 'bg-slate-700/30 hover:bg-slate-700/50 border-slate-600/50' 
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                }`}
              >
                <Rocket className="w-5 h-5 text-orange-500 group-hover:text-orange-400" />
                <span className={`text-xs text-center ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Product Launch</span>
              </button>
              {Object.entries(TEMPLATES).map(([key, template]) => {
                const Icon = template.icon;
                return (
                  <button
                    key={key}
                    onClick={() => applyTemplate(key)}
                    data-testid={`template-btn-${key}`}
                    className={`flex flex-col items-center gap-2 p-3 border rounded-lg transition-colors group ${
                      isDarkMode 
                        ? 'bg-slate-700/30 hover:bg-slate-700/50 border-slate-600/50' 
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-teal-500 group-hover:text-teal-400" />
                    <span className={`text-xs text-center ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{template.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Preview & Recent Posts */}
        <div className="w-[350px] space-y-4">
          {/* Preview Card */}
          <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className={`flex items-center justify-between p-3 border-b ${isDarkMode ? 'border-slate-700/50' : 'border-gray-200'}`}>
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Preview</h3>
              <span className="text-xs px-2 py-0.5 bg-teal-500/20 text-teal-500 rounded">
                {currentPlatform?.name || 'Twitter'}
              </span>
            </div>
            <div className={`p-4 ${isDarkMode ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  OB
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Oye Bark</span>
                    <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>@OyeBark</span>
                  </div>
                  <div className={`mt-2 text-sm whitespace-pre-wrap break-words ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                    {content || <span className={isDarkMode ? 'text-slate-500 italic' : 'text-gray-400 italic'}>Your post preview will appear here...</span>}
                  </div>
                  {/* Image preview in sidebar */}
                  {imageUrl && (
                    <div className="mt-3">
                      <img 
                        src={imageUrl} 
                        alt="Attached" 
                        className="w-full h-auto rounded-lg object-cover max-h-48"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Posts Card */}
          <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className={`flex items-center justify-between p-3 border-b ${isDarkMode ? 'border-slate-700/50' : 'border-gray-200'}`}>
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Recent Posts & Drafts</h3>
              <button 
                onClick={fetchRecentPosts}
                className="text-xs text-teal-500 hover:text-teal-400 flex items-center gap-1"
              >
                {loadingPosts ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  'Refresh'
                )}
              </button>
            </div>
            <div className={`divide-y max-h-[400px] overflow-y-auto ${isDarkMode ? 'divide-slate-700/50' : 'divide-gray-100'}`}>
              {recentPosts.length === 0 ? (
                <div className={`p-4 text-center text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                  {loadingPosts ? 'Loading...' : 'No posts yet'}
                </div>
              ) : (
                recentPosts.map((post) => {
                  const PlatformIcon = getPlatformIcon(post.platform);
                  const isDraft = post.status === 'draft';
                  
                  return (
                    <div 
                      key={post._id} 
                      onClick={() => isDraft && loadDraft(post)}
                      className={`p-3 transition-colors group ${
                        isDraft 
                          ? 'cursor-pointer ' + (isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-orange-50')
                          : isDarkMode ? 'hover:bg-slate-700/20' : 'hover:bg-gray-50'
                      }`}
                      data-testid={`post-item-${post._id}`}
                    >
                      <div className="flex items-start gap-2">
                        {/* Platform icon with draft badge */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <PlatformIcon className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                          {isDraft && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-orange-500 text-white rounded font-semibold uppercase tracking-wide">
                              Draft
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Image indicator if present */}
                          {post.image_url && (
                            <div className="flex items-center gap-1 mb-1">
                              <Image className={`w-3 h-3 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} />
                              <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Image attached</span>
                            </div>
                          )}
                          <p className={`text-xs line-clamp-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{post.content}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              post.status === 'posted' ? 'bg-green-400' : 'bg-orange-400'
                            }`} />
                            <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                              {formatRelativeTime(post.updated_at || post.posted_at)}
                            </span>
                            {post.post_url && (
                              <a 
                                href={post.post_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] text-teal-500 hover:text-teal-400 flex items-center gap-0.5"
                              >
                                View <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                        {/* Delete button for drafts */}
                        {isDraft && (
                          <button
                            onClick={(e) => handleDeleteDraft(post._id, e)}
                            className={`p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                              isDarkMode 
                                ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400' 
                                : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                            }`}
                            title="Delete draft"
                            data-testid={`delete-draft-${post._id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Post Confirmation Modal */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !posting && !postResult?.success && setShowConfirmModal(false)}
        >
          <div 
            className={`rounded-xl w-full max-w-md border shadow-2xl overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700 bg-gradient-to-r from-teal-900/30 to-slate-800' : 'border-gray-200 bg-gradient-to-r from-teal-50 to-white'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <Twitter className="w-5 h-5 text-teal-500" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {postResult?.success ? 'Posted Successfully!' : 'Post to Twitter?'}
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>@OyeBark</p>
                </div>
              </div>
              {!posting && (
                <button 
                  onClick={() => setShowConfirmModal(false)} 
                  className={`transition-colors p-1 ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              {postResult?.success ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                  <h4 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Tweet Posted!</h4>
                  <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Your tweet is now live.</p>
                  <a
                    href={postResult.tweet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-teal-500 hover:text-teal-400 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Twitter
                  </a>
                </div>
              ) : postResult?.error ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                    <X className="w-8 h-8 text-red-500" />
                  </div>
                  <h4 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Failed to Post</h4>
                  <p className="text-red-500 text-sm mb-4">{postResult.error}</p>
                  <button
                    onClick={() => setPostResult(null)}
                    className={`text-sm ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  {charCount > maxChars - 30 && charCount <= maxChars && (
                    <div className={`flex items-center gap-2 mb-3 px-3 py-2 border rounded-lg ${isDarkMode ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200'}`}>
                      <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      <p className={`text-xs ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                        Approaching character limit ({maxChars - charCount} chars remaining)
                      </p>
                    </div>
                  )}

                  <div className={`rounded-lg border p-4 mb-4 ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        OB
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Oye Bark</p>
                        <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>@OyeBark</p>
                      </div>
                    </div>
                    <div className={`text-sm whitespace-pre-wrap leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                      {content}
                    </div>
                    {imageUrl && (
                      <div className="mt-3">
                        <img src={imageUrl} alt="Attached" className="w-full h-auto rounded-lg max-h-48 object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    {imageUrl && (
                      <span className={`text-xs flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        <Image className="w-3 h-3" /> Image attached
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ml-auto ${getCharCountColor()}`}>
                      {charCount}/{maxChars}
                      {charCount <= maxChars && <Check className="w-3 h-3" />}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-end gap-3 p-4 border-t ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
              {postResult?.success ? (
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${isDarkMode ? 'bg-slate-600 hover:bg-slate-500' : 'bg-gray-600 hover:bg-gray-500'}`}
                >
                  Done
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    disabled={posting}
                    className={`px-4 py-2 border rounded-lg transition-colors disabled:opacity-50 ${
                      isDarkMode 
                        ? 'border-slate-600 hover:bg-slate-700 text-slate-300' 
                        : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmPost}
                    disabled={posting || charCount > maxChars}
                    className={`px-4 py-2 text-white rounded-lg flex items-center gap-2 transition-colors min-w-[120px] justify-center ${
                      posting || charCount > maxChars
                        ? isDarkMode ? 'bg-slate-600 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed'
                        : 'bg-teal-500 hover:bg-teal-600'
                    }`}
                  >
                    {posting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Post Tweet
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Partner Selection Modal for Shoutout */}
      {showShoutoutModal && (
        <PartnerSelectModal 
          isDarkMode={isDarkMode}
          onSelect={(partner) => {
            setSelectedPartner(partner);
            setShowShoutoutModal(false);
          }}
          onClose={() => setShowShoutoutModal(false)}
        />
      )}

      {/* Shoutout Generator Modal */}
      {selectedPartner && (
        <ShoutoutGeneratorModal 
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
        />
      )}

      {/* Product Selection Modal for Product Launch */}
      {showProductModal && (
        <ProductSelectModal 
          isDarkMode={isDarkMode}
          onSelect={(product) => {
            const launchContent = generateProductLaunchContent(product);
            setContent(launchContent);
            setCurrentDraftId(null);
            setShowProductModal(false);
            toast.success(`Template loaded for ${product.name}`);
          }}
          onClose={() => setShowProductModal(false)}
        />
      )}
    </div>
  );
};

// Partner Selection Modal Component
const PartnerSelectModal = ({ onSelect, onClose, isDarkMode }) => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_URL}/v1/partner-stores`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setPartners(data.stores || []);
        }
      } catch (error) {
        console.error('Error fetching partners:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);

  const filteredPartners = partners.filter(p => 
    p.store_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.area?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className={`rounded-xl w-full max-w-md border shadow-2xl overflow-hidden max-h-[80vh] flex flex-col ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}
        onClick={(e) => e.stopPropagation()}
        data-testid="partner-select-modal"
      >
        <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <Handshake className="w-5 h-5 text-purple-500" />
              Select Partner
            </h3>
            <button onClick={onClose} className={isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <input
            type="text"
            placeholder="Search partners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="partner-search-input"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-teal-500 ${
              isDarkMode 
                ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className={`p-4 text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
              Loading partners...
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className={`p-4 text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>No partners found</div>
          ) : (
            <div className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-100'}`}>
              {filteredPartners.map((partner) => (
                <button
                  key={partner._id}
                  onClick={() => onSelect(partner)}
                  data-testid={`partner-option-${partner._id}`}
                  className={`w-full p-3 text-left transition-colors ${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}
                >
                  <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{partner.store_name}</p>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{partner.area}, {partner.city}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Product Selection Modal Component
const ProductSelectModal = ({ onSelect, onClose, isDarkMode }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_URL}/admin/products`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (data.products) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className={`rounded-xl w-full max-w-md border shadow-2xl overflow-hidden max-h-[80vh] flex flex-col ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}
        onClick={(e) => e.stopPropagation()}
        data-testid="product-select-modal"
      >
        <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <Package className="w-5 h-5 text-orange-500" />
              Select Product
            </h3>
            <button onClick={onClose} className={isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="product-search-input"
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-teal-500 ${
              isDarkMode 
                ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className={`p-4 text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className={`p-4 text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>No products found</div>
          ) : (
            <div className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-100'}`}>
              {filteredProducts.map((product) => (
                <button
                  key={product._id || product.id}
                  onClick={() => onSelect(product)}
                  data-testid={`product-option-${product._id || product.id}`}
                  className={`w-full p-3 text-left transition-colors ${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}
                >
                  <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{product.name}</p>
                  <p className={`text-xs line-clamp-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {product.description?.substring(0, 60) || 'No description'}...
                  </p>
                  {product.price && (
                    <p className="text-teal-500 text-xs mt-1">₹{product.price}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostTab;
