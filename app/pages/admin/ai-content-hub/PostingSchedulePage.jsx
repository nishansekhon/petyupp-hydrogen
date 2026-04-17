import React, { useState, useEffect, useMemo } from 'react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { API_BASE_URL } from '@/config/api';
import HubNavigation from '@/components/AIContentHub/HubNavigation';
import { 
    Rocket, Calendar, Clock, CheckCircle, AlertCircle, Send, 
    Twitter, Instagram, Facebook, Linkedin, History, XCircle, Loader2,
    Edit2, Save, X
} from 'lucide-react';

// Twitter URL expansion helper - Twitter converts all URLs to 23-char t.co links
const TWITTER_URL_LENGTH = 23;
const URL_REGEX = /https?:\/\/[^\s]+|[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s]*)?/g;

const calculateTwitterLength = (text) => {
    if (!text) return { display: 0, effective: 0, urls: [] };
    
    const urls = text.match(URL_REGEX) || [];
    let effectiveLength = text.length;
    
    // For each URL found, adjust the length calculation
    urls.forEach(url => {
        const urlLength = url.length;
        // Replace URL's actual length with Twitter's standard 23-char length
        effectiveLength = effectiveLength - urlLength + TWITTER_URL_LENGTH;
    });
    
    return {
        display: text.length,
        effective: effectiveLength,
        urls: urls,
        isOverLimit: effectiveLength > 280
    };
};

const PostingSchedulePage = () => {
    const { isDarkMode } = useAdminTheme();
    const [activeTab, setActiveTab] = useState('ready');
    const [approved, setApproved] = useState([]);
    const [postedHistory, setPostedHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [metricoolStatus, setMetricoolStatus] = useState(null);
    const [twitterStatus, setTwitterStatus] = useState(null);
    const [twitterPostingEnabled, setTwitterPostingEnabled] = useState(true);
    const [selectedContent, setSelectedContent] = useState(null);
    const [selectedPlatforms, setSelectedPlatforms] = useState(['twitter']);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    
    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const [saving, setSaving] = useState(false);

    // Calculate Twitter character count for displayed content (edited or original)
    const displayContent = isEditing ? editedContent : selectedContent?.final_content;
    const twitterCharCount = useMemo(() => {
        if (!displayContent) return null;
        return calculateTwitterLength(displayContent);
    }, [displayContent]);
    
    // Check if Twitter posting is blocked due to character limit OR kill switch
    const twitterBlocked = selectedPlatforms.includes('twitter') && (twitterCharCount?.isOverLimit || !twitterPostingEnabled);

    useEffect(() => {
        checkMetricool();
        checkTwitter();
        checkTwitterPostingStatus();
        fetchApproved();
        fetchHistory();
    }, []);
    
    // Reset editing state when selection changes
    useEffect(() => {
        setIsEditing(false);
        setEditedContent('');
    }, [selectedContent?._id]);

    const checkTwitterPostingStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/twitter/posting-status`);
            const data = await response.json();
            setTwitterPostingEnabled(data.twitter_posting_enabled ?? true);
        } catch (err) {
            console.error('Error checking Twitter posting status:', err);
        }
    };

    const checkMetricool = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-content-hub/posting/check-metricool`);
            const data = await response.json();
            setMetricoolStatus(data);
        } catch (err) {
            setMetricoolStatus({ status: 'error', message: 'Failed to check Metricool' });
        }
    };
    
    const checkTwitter = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/twitter/status`);
            const data = await response.json();
            setTwitterStatus(data);
        } catch (err) {
            setTwitterStatus({ configured: false });
        }
    };
    
    const handleEditStart = () => {
        setEditedContent(selectedContent?.final_content || '');
        setIsEditing(true);
    };
    
    const handleEditCancel = () => {
        setIsEditing(false);
        setEditedContent('');
    };
    
    const handleSaveContent = async () => {
        if (!selectedContent?._id || !editedContent.trim()) return;
        
        setSaving(true);
        setError(null);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-content-hub/approved/${selectedContent._id}/content`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ final_content: editedContent.trim() })
            });
            
            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch {
                setError('Invalid response from server');
                return;
            }
            
            if (data.status === 'success') {
                // Update local state
                setSelectedContent(prev => ({ ...prev, final_content: editedContent.trim() }));
                setApproved(prev => prev.map(a => 
                    a._id === selectedContent._id 
                        ? { ...a, final_content: editedContent.trim() }
                        : a
                ));
                setIsEditing(false);
                setSuccessMessage('Content updated!');
            } else {
                setError(data.message || 'Failed to save');
            }
        } catch (err) {
            setError('Failed to save: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const fetchApproved = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-content-hub/approved`);
            const data = await response.json();
            if (data.status === 'success') {
                setApproved(data.approved);
            }
        } catch (err) {
            console.error('Failed to fetch approved:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-content-hub/posting/history`);
            const data = await response.json();
            if (data.status === 'success') {
                setPostedHistory(data.posts);
            }
        } catch (err) {
            console.error('Failed to fetch history:', err);
        }
    };

    const handleSelectContent = (content) => {
        setSelectedContent(content);
        setError(null);
        setSuccessMessage(null);
    };

    const togglePlatform = (platform) => {
        if (selectedPlatforms.includes(platform)) {
            if (selectedPlatforms.length > 1) {
                setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
            }
        } else {
            setSelectedPlatforms([...selectedPlatforms, platform]);
        }
    };

    const handlePostNow = async () => {
        if (!selectedContent) return;

        setProcessing(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-content-hub/posting/post-now`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    approved_id: selectedContent._id,
                    platforms: selectedPlatforms
                })
            });

            // Read response body only once and store it
            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse response:', responseText);
                setError('Invalid response from server');
                return;
            }

            if (data.status === 'success' || data.status === 'partial') {
                // Build detailed success message
                let message = data.message || `Posted to ${data.platforms_succeeded?.join(', ') || selectedPlatforms.join(', ')}!`;
                setSuccessMessage(message);
                setSelectedContent(null);
                fetchApproved();
                fetchHistory();
                
                // Show warning for partial success
                if (data.status === 'partial' && data.platforms_failed?.length > 0) {
                    setTimeout(() => {
                        setError(`Some platforms failed: ${data.platforms_failed.map(f => `${f.platform} (${f.error})`).join(', ')}`);
                    }, 100);
                }
            } else {
                // Build detailed error message
                let errorMsg = data.message || 'Failed to post';
                if (data.platforms_failed?.length > 0) {
                    errorMsg = data.platforms_failed.map(f => `${f.platform}: ${f.error}`).join(' | ');
                }
                setError(errorMsg);
            }
        } catch (err) {
            setError('Failed to post: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleSchedule = async () => {
        if (!selectedContent || !scheduleDate || !scheduleTime) {
            setError('Please select date and time');
            return;
        }

        setProcessing(true);
        setError(null);

        const scheduledTime = new Date(`${scheduleDate}T${scheduleTime}`);

        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-content-hub/posting/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    approved_id: selectedContent._id,
                    platforms: selectedPlatforms,
                    scheduled_time: scheduledTime.toISOString()
                })
            });

            // Read response body only once and store it
            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse response:', responseText);
                setError('Invalid response from server');
                return;
            }

            if (data.status === 'success') {
                let message = data.message;
                if (data.warnings && data.warnings.length > 0) {
                    message += ` (${data.warnings.join(', ')})`;
                }
                setSuccessMessage(message);
                setSelectedContent(null);
                setScheduleDate('');
                setScheduleTime('');
                fetchApproved();
            } else {
                setError(data.message || 'Failed to schedule');
            }
        } catch (err) {
            setError('Failed to schedule: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleCancelSchedule = async (contentId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-content-hub/posting/cancel/${contentId}`, {
                method: 'POST'
            });

            const data = await response.json();

            if (data.status === 'success') {
                setSuccessMessage('Schedule cancelled');
                fetchApproved();
            } else {
                setError(data.message || 'Failed to cancel');
            }
        } catch (err) {
            setError('Failed to cancel: ' + err.message);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFilteredContent = () => {
        switch (activeTab) {
            case 'ready':
                return approved.filter(a => a.posting_status === 'pending');
            case 'scheduled':
                return approved.filter(a => a.posting_status === 'scheduled');
            case 'posted':
                return approved.filter(a => a.posting_status === 'posted');
            default:
                return [];
        }
    };

    const platforms = [
        { id: 'twitter', name: 'Twitter', icon: Twitter, color: '#1DA1F2' },
        { id: 'instagram', name: 'Instagram', icon: Instagram, color: '#E4405F' },
        { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2' },
        { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0A66C2' }
    ];

    const tabs = [
        { id: 'ready', label: 'Ready to Post', icon: Send, count: approved.filter(a => a.posting_status === 'pending').length },
        { id: 'scheduled', label: 'Scheduled', icon: Clock, count: approved.filter(a => a.posting_status === 'scheduled').length },
        { id: 'posted', label: 'Posted History', icon: History, count: postedHistory.length }
    ];

    return (
        <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <h1 className={`text-2xl font-bold flex items-center gap-3 mb-2 ${
                    isDarkMode ? 'text-slate-100' : 'text-gray-900'
                }`}>
                    <Rocket className="text-green-500" size={28} />
                    Posting Schedule
                </h1>
                <p className={`mb-6 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    Schedule and post approved content to social media
                </p>

                <HubNavigation activeTab="schedule" />

                {/* Platform Connection Status */}
                <div className="flex flex-wrap gap-3 mb-5">
                    {/* Twitter Status - shown when Twitter is selected */}
                    {selectedPlatforms.includes('twitter') && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                            twitterStatus?.configured
                                ? 'bg-sky-500/10 text-sky-500'
                                : 'bg-amber-500/10 text-amber-600'
                        }`}>
                            <Twitter size={16} />
                            {twitterStatus?.configured ? (
                                <>Posts via direct Twitter API</>
                            ) : (
                                <>Twitter API not configured</>
                            )}
                        </div>
                    )}
                    
                    {/* Metricool Status - shown when Instagram/Facebook/LinkedIn is selected */}
                    {selectedPlatforms.some(p => ['instagram', 'facebook', 'linkedin'].includes(p)) && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                            metricoolStatus?.status === 'success'
                                ? 'bg-green-500/10 text-green-500'
                                : metricoolStatus?.status === 'not_configured'
                                    ? 'bg-amber-500/10 text-amber-600'
                                    : 'bg-red-500/10 text-red-500'
                        }`}>
                            {metricoolStatus?.status === 'success' ? (
                                <>
                                    <CheckCircle size={16} />
                                    Posts via Metricool ({selectedPlatforms.filter(p => p !== 'twitter').join(', ')})
                                </>
                            ) : metricoolStatus?.status === 'not_configured' ? (
                                <>
                                    <AlertCircle size={16} />
                                    Metricool not configured
                                </>
                            ) : (
                                <>
                                    <AlertCircle size={16} />
                                    {metricoolStatus?.message || 'Metricool error'}
                                </>
                            )}
                        </div>
                    )}
                    
                    {/* Show general info if no platforms selected */}
                    {selectedPlatforms.length === 0 && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                            isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500'
                        }`}>
                            <AlertCircle size={16} />
                            Select a platform to see connection status
                        </div>
                    )}
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-green-500/10 text-green-500">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={18} />
                            {successMessage}
                        </div>
                        <button onClick={() => setSuccessMessage(null)} className="hover:text-green-600">×</button>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-5">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-teal-500 text-white'
                                        : isDarkMode 
                                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                                data-testid={`tab-${tab.id}`}
                            >
                                <Icon size={16} />
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                                        activeTab === tab.id ? 'bg-white/30' : isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className={`grid gap-6 ${selectedContent ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                    {/* Content List */}
                    <div className={`rounded-lg shadow-sm overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                        <div className={`px-5 py-4 border-b font-semibold ${
                            isDarkMode ? 'border-slate-700 text-slate-100' : 'border-gray-200 text-gray-900'
                        }`}>
                            {activeTab === 'ready' && 'Ready to Post'}
                            {activeTab === 'scheduled' && 'Scheduled Posts'}
                            {activeTab === 'posted' && 'Posted History'}
                            {' '}({getFilteredContent().length})
                        </div>

                        {loading ? (
                            <div className={`p-10 text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                Loading...
                            </div>
                        ) : getFilteredContent().length === 0 ? (
                            <div className="p-10 text-center">
                                <Rocket size={40} className={`mx-auto mb-3 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                                <div className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                                    {activeTab === 'ready' && 'No content ready to post'}
                                    {activeTab === 'scheduled' && 'No scheduled posts'}
                                    {activeTab === 'posted' && 'No posted content yet'}
                                </div>
                            </div>
                        ) : (
                            <div className="max-h-[500px] overflow-y-auto">
                                {getFilteredContent().map(content => (
                                    <div
                                        key={content._id}
                                        onClick={() => activeTab !== 'posted' && handleSelectContent(content)}
                                        className={`px-5 py-4 border-b cursor-pointer transition-all ${
                                            selectedContent?._id === content._id
                                                ? 'bg-teal-500/10'
                                                : isDarkMode 
                                                    ? 'border-slate-700 hover:bg-slate-700/50'
                                                    : 'border-gray-100 hover:bg-gray-50'
                                        } ${activeTab === 'posted' ? 'cursor-default' : ''}`}
                                        data-testid={`content-${content._id}`}
                                    >
                                        <div className={`text-sm leading-relaxed mb-2 ${
                                            isDarkMode ? 'text-slate-200' : 'text-gray-800'
                                        }`}>
                                            {content.final_content?.substring(0, 120)}...
                                        </div>
                                        <div className={`flex gap-3 text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                            <span>{content.platform}</span>
                                            <span>{formatDate(content.approved_at || content.created_at)}</span>
                                            {content.posting_status === 'scheduled' && content.scheduled_time && (
                                                <span className="text-amber-500">
                                                    Scheduled: {formatDate(content.scheduled_time)}
                                                </span>
                                            )}
                                        </div>
                                        {activeTab === 'scheduled' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCancelSchedule(content._id);
                                                }}
                                                className="mt-2 px-3 py-1 text-xs rounded bg-red-500/20 text-red-500 hover:bg-red-500/30 flex items-center gap-1"
                                            >
                                                <XCircle size={12} />
                                                Cancel Schedule
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Posting Panel */}
                    {selectedContent && activeTab === 'ready' && (
                        <div className={`rounded-lg shadow-sm p-5 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                            {/* Header with Edit toggle */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-base font-semibold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                                    Post Content
                                </h3>
                                {!isEditing ? (
                                    <button
                                        onClick={handleEditStart}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                            isDarkMode 
                                                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                        data-testid="edit-content-btn"
                                    >
                                        <Edit2 size={14} />
                                        Edit
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleEditCancel}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                                isDarkMode 
                                                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            <X size={14} />
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveContent}
                                            disabled={saving}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                                saving
                                                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                                    : 'bg-teal-500 text-white hover:bg-teal-600'
                                            }`}
                                            data-testid="save-content-btn"
                                        >
                                            {saving ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Save size={14} />
                                            )}
                                            Save
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Content Preview / Editor */}
                            <div className={`p-4 rounded-lg mb-4 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                {isEditing ? (
                                    <textarea
                                        value={editedContent}
                                        onChange={(e) => setEditedContent(e.target.value)}
                                        rows={6}
                                        className={`w-full p-3 rounded-lg border text-sm leading-relaxed resize-y ${
                                            isDarkMode 
                                                ? 'bg-slate-800 border-slate-600 text-slate-200 placeholder-slate-400' 
                                                : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
                                        }`}
                                        placeholder="Enter your post content..."
                                        data-testid="content-editor"
                                    />
                                ) : (
                                    <div className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                                        {selectedContent.final_content}
                                    </div>
                                )}
                                
                                {/* Twitter-aware character count */}
                                <div className="mt-2 space-y-1">
                                    <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                        {twitterCharCount?.display || 0} characters
                                        {selectedPlatforms.includes('twitter') && twitterCharCount?.urls?.length > 0 && (
                                            <span className={twitterCharCount.isOverLimit ? 'text-red-400 font-medium' : 'text-amber-400'}>
                                                {' '}(effective: {twitterCharCount.effective} with URL expansion
                                                {twitterCharCount.isOverLimit && ' - OVER LIMIT'})
                                            </span>
                                        )}
                                        {selectedPlatforms.includes('twitter') && !twitterCharCount?.urls?.length && twitterCharCount?.display > 280 && (
                                            <span className="text-red-400 font-medium"> - OVER LIMIT</span>
                                        )}
                                    </div>
                                    
                                    {/* Twitter limit warning */}
                                    {twitterBlocked && (
                                        <div className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                                            <AlertCircle size={12} />
                                            {!twitterPostingEnabled 
                                                ? 'Twitter posting disabled - enable in Settings'
                                                : isEditing 
                                                    ? 'Shorten content to post to Twitter (max 280 chars after URL expansion)'
                                                    : 'Tweet exceeds 280 chars after URL expansion. Click Edit to shorten.'
                                            }
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Platform Selection */}
                            <div className="mb-4">
                                <label className={`block text-sm mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                    Select Platforms
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {platforms.map(platform => {
                                        const Icon = platform.icon;
                                        const isSelected = selectedPlatforms.includes(platform.id);
                                        const isTwitterDisabled = platform.id === 'twitter' && !twitterPostingEnabled;
                                        return (
                                            <button
                                                key={platform.id}
                                                onClick={() => !isTwitterDisabled && togglePlatform(platform.id)}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                    isTwitterDisabled
                                                        ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                                                        : isSelected
                                                            ? 'text-white'
                                                            : isDarkMode 
                                                                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                                style={isSelected && !isTwitterDisabled ? { backgroundColor: platform.color } : {}}
                                                data-testid={`platform-${platform.id}`}
                                                title={isTwitterDisabled ? 'Twitter posting disabled - enable in Settings' : ''}
                                            >
                                                <Icon size={16} />
                                                {platform.name}
                                                {isTwitterDisabled && <XCircle size={12} className="ml-1" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 text-red-500 text-sm">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            {/* Post Now Button */}
                            <button
                                onClick={handlePostNow}
                                disabled={processing || twitterBlocked || (selectedPlatforms.some(p => ['instagram', 'facebook', 'linkedin'].includes(p)) && metricoolStatus?.status !== 'success')}
                                className={`w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 mb-4 ${
                                    processing || twitterBlocked || (selectedPlatforms.some(p => ['instagram', 'facebook', 'linkedin'].includes(p)) && metricoolStatus?.status !== 'success')
                                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                        : 'bg-green-500 text-white hover:bg-green-600'
                                }`}
                                data-testid="post-now-btn"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Posting...
                                    </>
                                ) : twitterBlocked ? (
                                    <>
                                        <AlertCircle size={18} />
                                        {!twitterPostingEnabled ? 'Twitter Posting Disabled' : 'Tweet exceeds 280 chars'}
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Post Now
                                    </>
                                )}
                            </button>

                            {/* Schedule Section */}
                            <div className={`pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                                <label className={`block text-sm mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                    Or Schedule for Later
                                </label>
                                
                                {/* Twitter Scheduling Warning */}
                                {selectedPlatforms.includes('twitter') && (
                                    <div className="flex items-start gap-2 p-3 mb-3 rounded-lg bg-amber-500/10 text-amber-500 text-sm">
                                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                        <div>
                                            <strong>Note:</strong> Twitter does not support scheduled posts. 
                                            {selectedPlatforms.length > 1 
                                                ? ' Only other platforms will be scheduled.'
                                                : ' Use "Post Now" for Twitter.'}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="date"
                                        value={scheduleDate}
                                        onChange={(e) => setScheduleDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                                            isDarkMode 
                                                ? 'bg-slate-700 border-slate-600 text-slate-100' 
                                                : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                        data-testid="schedule-date"
                                    />
                                    <input
                                        type="time"
                                        value={scheduleTime}
                                        onChange={(e) => setScheduleTime(e.target.value)}
                                        className={`w-32 px-3 py-2 rounded-lg border text-sm ${
                                            isDarkMode 
                                                ? 'bg-slate-700 border-slate-600 text-slate-100' 
                                                : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                        data-testid="schedule-time"
                                    />
                                </div>
                                <button
                                    onClick={handleSchedule}
                                    disabled={
                                        processing || 
                                        !scheduleDate || 
                                        !scheduleTime || 
                                        metricoolStatus?.status !== 'success' ||
                                        (selectedPlatforms.length === 1 && selectedPlatforms.includes('twitter'))
                                    }
                                    className={`w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${
                                        processing || !scheduleDate || !scheduleTime || metricoolStatus?.status !== 'success' ||
                                        (selectedPlatforms.length === 1 && selectedPlatforms.includes('twitter'))
                                            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                    }`}
                                    data-testid="schedule-btn"
                                >
                                    <Calendar size={18} />
                                    {selectedPlatforms.length === 1 && selectedPlatforms.includes('twitter')
                                        ? 'Twitter cannot be scheduled'
                                        : 'Schedule Post'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostingSchedulePage;
