import React, { useState, useEffect } from 'react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { API_BASE_URL } from '@/config/api';
import HubNavigation from '@/components/AIContentHub/HubNavigation';
import { ClipboardList, Check, X, AlertCircle, CheckCircle, Inbox, Clock } from 'lucide-react';

const ReviewQueuePage = () => {
    const { isDarkMode } = useAdminTheme();
    const [drafts, setDrafts] = useState([]);
    const [allDrafts, setAllDrafts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ai_generated');
    const [selectedDraft, setSelectedDraft] = useState(null);
    const [selectedVariation, setSelectedVariation] = useState(null);
    const [editedContent, setEditedContent] = useState('');
    const [reviewerNotes, setReviewerNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        fetchDrafts();
    }, [filter]);

    const fetchDrafts = async () => {
        setLoading(true);
        try {
            // Fetch all drafts first to get counts
            const allResponse = await fetch(`${API_BASE_URL}/api/ai-content-hub/drafts`);
            const allData = await allResponse.json();
            if (allData.status === 'success') {
                setAllDrafts(allData.drafts);
            }

            // Fetch filtered drafts
            const url = filter 
                ? `${API_BASE_URL}/api/ai-content-hub/drafts?status=${filter}`
                : `${API_BASE_URL}/api/ai-content-hub/drafts`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.status === 'success') {
                setDrafts(data.drafts);
            }
        } catch (err) {
            console.error('Failed to fetch drafts:', err);
            setError('Failed to load drafts');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDraft = (draft) => {
        setSelectedDraft(draft);
        setSelectedVariation(null);
        setEditedContent('');
        setReviewerNotes('');
        setError(null);
        setSuccessMessage(null);
    };

    const handleSelectVariation = (variation, index) => {
        setSelectedVariation({ ...variation, index });
        setEditedContent(variation.content);
    };

    const handleApprove = async () => {
        if (!selectedDraft || !selectedVariation) {
            setError('Please select a draft and variation to approve');
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-content-hub/review/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    draft_id: selectedDraft._id,
                    selected_variation_id: selectedVariation.variation_id,
                    final_content: editedContent,
                    reviewer_notes: reviewerNotes
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                setSuccessMessage('Content approved and added to posting queue!');
                setSelectedDraft(null);
                setSelectedVariation(null);
                fetchDrafts();
            } else {
                setError(data.detail || 'Failed to approve');
            }
        } catch (err) {
            setError('Failed to approve: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedDraft) {
            setError('Please select a draft to reject');
            return;
        }

        if (!reviewerNotes.trim()) {
            setError('Please add notes explaining why this draft is rejected');
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/ai-content-hub/review/${selectedDraft._id}/reject?reviewer_notes=${encodeURIComponent(reviewerNotes)}`,
                { method: 'POST' }
            );

            const data = await response.json();

            if (data.status === 'success') {
                setSuccessMessage('Draft rejected');
                setSelectedDraft(null);
                setSelectedVariation(null);
                fetchDrafts();
            } else {
                setError(data.detail || 'Failed to reject');
            }
        } catch (err) {
            setError('Failed to reject: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleMarkForReview = async (draftId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-content-hub/drafts/${draftId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'pending_review' })
            });

            const data = await response.json();
            if (data.status === 'success') {
                fetchDrafts();
            }
        } catch (err) {
            console.error('Failed to update status:', err);
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

    const getStatusStyles = (status) => {
        const styles = {
            ai_generated: { bg: 'bg-purple-500/20', text: 'text-purple-500' },
            pending_review: { bg: 'bg-amber-500/20', text: 'text-amber-600' },
            in_review: { bg: 'bg-blue-500/20', text: 'text-blue-500' },
            approved: { bg: 'bg-green-500/20', text: 'text-green-500' },
            rejected: { bg: 'bg-red-500/20', text: 'text-red-500' }
        };
        return styles[status] || { bg: 'bg-gray-500/20', text: 'text-gray-500' };
    };

    const filterCounts = {
        ai_generated: allDrafts.filter(d => d.status === 'ai_generated').length,
        pending_review: allDrafts.filter(d => d.status === 'pending_review').length,
        approved: allDrafts.filter(d => d.status === 'approved').length,
        rejected: allDrafts.filter(d => d.status === 'rejected').length
    };

    const filters = [
        { value: 'ai_generated', label: 'AI Generated', icon: '✨' },
        { value: 'pending_review', label: 'Pending Review', icon: '⏳' },
        { value: 'approved', label: 'Approved', icon: '✓' },
        { value: 'rejected', label: 'Rejected', icon: '✕' },
        { value: '', label: 'All', icon: '📋' }
    ];

    return (
        <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <h1 className={`text-2xl font-bold flex items-center gap-3 mb-2 ${
                    isDarkMode ? 'text-slate-100' : 'text-gray-900'
                }`}>
                    <ClipboardList className="text-amber-500" size={28} />
                    Review Queue
                </h1>
                <p className={`mb-6 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    Review and approve AI-generated content before posting
                </p>

                <HubNavigation activeTab="review" />

                {/* Success Message */}
                {successMessage && (
                    <div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-green-500/10 text-green-500">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={18} />
                            {successMessage}
                        </div>
                        <button
                            onClick={() => setSuccessMessage(null)}
                            className="text-green-500 hover:text-green-600 text-lg"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Filter Buttons */}
                <div className="flex gap-2 mb-5 flex-wrap">
                    {filters.map(f => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                                filter === f.value
                                    ? 'bg-teal-500 text-white'
                                    : isDarkMode 
                                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                            data-testid={`filter-${f.value || 'all'}`}
                        >
                            <span>{f.icon}</span>
                            {f.label}
                            {f.value && filterCounts[f.value] > 0 && (
                                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                                    filter === f.value
                                        ? 'bg-white/30'
                                        : isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
                                }`}>
                                    {filterCounts[f.value]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className={`grid gap-6 ${selectedDraft ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                    {/* Drafts List */}
                    <div className={`rounded-lg shadow-sm overflow-hidden ${
                        isDarkMode ? 'bg-slate-800' : 'bg-white'
                    }`}>
                        <div className={`px-5 py-4 border-b font-semibold ${
                            isDarkMode 
                                ? 'border-slate-700 text-slate-100' 
                                : 'border-gray-200 text-gray-900'
                        }`}>
                            Drafts ({drafts.length})
                        </div>

                        {loading ? (
                            <div className={`p-10 text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                Loading drafts...
                            </div>
                        ) : drafts.length === 0 ? (
                            <div className="p-10 text-center">
                                <Inbox size={40} className={`mx-auto mb-3 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                                <div className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>No drafts found</div>
                                <div className={`text-sm mt-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                                    Generate content from the AI Generator page
                                </div>
                            </div>
                        ) : (
                            <div className="max-h-[600px] overflow-y-auto">
                                {drafts.map(draft => {
                                    const statusStyles = getStatusStyles(draft.status);
                                    return (
                                        <div
                                            key={draft._id}
                                            onClick={() => handleSelectDraft(draft)}
                                            className={`px-5 py-4 cursor-pointer transition-all border-b ${
                                                selectedDraft?._id === draft._id
                                                    ? 'bg-teal-500/10'
                                                    : isDarkMode 
                                                        ? 'border-slate-700 hover:bg-slate-700/50'
                                                        : 'border-gray-100 hover:bg-gray-50'
                                            }`}
                                            data-testid={`draft-${draft._id}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className={`text-sm font-medium flex-1 ${
                                                    isDarkMode ? 'text-slate-200' : 'text-gray-800'
                                                }`}>
                                                    {draft.theme || 'Untitled'}
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ml-2 ${statusStyles.bg} ${statusStyles.text}`}>
                                                    {draft.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className={`flex gap-3 text-xs ${
                                                isDarkMode ? 'text-slate-400' : 'text-gray-500'
                                            }`}>
                                                <span>{draft.platform}</span>
                                                <span>{draft.variations?.length || 0} variations</span>
                                                <span>{formatDate(draft.created_at)}</span>
                                            </div>
                                            {draft.status === 'ai_generated' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkForReview(draft._id);
                                                    }}
                                                    className="mt-2 px-3 py-1 text-xs rounded bg-amber-500/20 text-amber-600 hover:bg-amber-500/30 flex items-center gap-1"
                                                    data-testid={`mark-review-${draft._id}`}
                                                >
                                                    <Clock size={12} />
                                                    Mark for Review
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Panel - Draft Details */}
                    {selectedDraft && (
                        <div>
                            {/* Variations Selection */}
                            <div className={`rounded-lg shadow-sm mb-4 ${
                                isDarkMode ? 'bg-slate-800' : 'bg-white'
                            }`}>
                                <div className={`px-5 py-4 border-b flex justify-between items-center ${
                                    isDarkMode ? 'border-slate-700' : 'border-gray-200'
                                }`}>
                                    <div>
                                        <h3 className={`text-base font-semibold ${
                                            isDarkMode ? 'text-slate-100' : 'text-gray-900'
                                        }`}>
                                            Select Variation
                                        </h3>
                                        <div className={`text-sm mt-0.5 ${
                                            isDarkMode ? 'text-slate-400' : 'text-gray-500'
                                        }`}>
                                            {selectedDraft.theme}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedDraft(null)}
                                        className={`text-xl ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="p-5 space-y-3">
                                    {selectedDraft.variations?.map((variation, index) => (
                                        <div
                                            key={variation.variation_id}
                                            onClick={() => handleSelectVariation(variation, index)}
                                            className={`p-4 rounded-lg cursor-pointer transition-all ${
                                                selectedVariation?.variation_id === variation.variation_id
                                                    ? 'border-2 border-teal-500 bg-teal-500/10'
                                                    : isDarkMode
                                                        ? 'border border-slate-600 hover:border-slate-500'
                                                        : 'border border-gray-200 hover:border-gray-300'
                                            }`}
                                            data-testid={`variation-select-${index}`}
                                        >
                                            <div className="flex justify-between mb-2">
                                                <span className={`text-sm font-semibold ${
                                                    isDarkMode ? 'text-slate-200' : 'text-gray-700'
                                                }`}>
                                                    Variation {index + 1}
                                                </span>
                                                <span className={`text-xs ${
                                                    variation.character_count > 280 
                                                        ? 'text-red-500' 
                                                        : isDarkMode ? 'text-slate-400' : 'text-gray-500'
                                                }`}>
                                                    {variation.character_count} chars
                                                </span>
                                            </div>
                                            <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
                                                isDarkMode ? 'text-slate-300' : 'text-gray-800'
                                            }`}>
                                                {variation.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Edit & Approve Panel */}
                            {selectedVariation && (
                                <div className={`rounded-lg shadow-sm p-5 ${
                                    isDarkMode ? 'bg-slate-800' : 'bg-white'
                                }`}>
                                    <h3 className={`text-base font-semibold mb-4 ${
                                        isDarkMode ? 'text-slate-100' : 'text-gray-900'
                                    }`}>
                                        Edit & Approve
                                    </h3>

                                    <div className="mb-4">
                                        <label className={`block text-sm mb-1.5 ${
                                            isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                        }`}>
                                            Final Content (edit if needed)
                                        </label>
                                        <textarea
                                            value={editedContent}
                                            onChange={(e) => setEditedContent(e.target.value)}
                                            rows={5}
                                            className={`w-full px-3 py-2.5 rounded-lg border text-sm resize-y ${
                                                isDarkMode 
                                                    ? 'bg-slate-700 border-slate-600 text-slate-100' 
                                                    : 'bg-white border-gray-200 text-gray-900'
                                            }`}
                                            data-testid="edit-content"
                                        />
                                        <div className={`mt-1 text-xs text-right ${
                                            editedContent.length > 280 ? 'text-red-500' : isDarkMode ? 'text-slate-400' : 'text-gray-500'
                                        }`}>
                                            {editedContent.length} / 280 characters
                                        </div>
                                    </div>

                                    <div className="mb-5">
                                        <label className={`block text-sm mb-1.5 ${
                                            isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                        }`}>
                                            Reviewer Notes (optional for approve, required for reject)
                                        </label>
                                        <textarea
                                            value={reviewerNotes}
                                            onChange={(e) => setReviewerNotes(e.target.value)}
                                            rows={2}
                                            placeholder="Add any notes about this content..."
                                            className={`w-full px-3 py-2.5 rounded-lg border text-sm resize-y ${
                                                isDarkMode 
                                                    ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400' 
                                                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                            }`}
                                            data-testid="reviewer-notes"
                                        />
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 text-red-500 text-sm">
                                            <AlertCircle size={16} />
                                            {error}
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleApprove}
                                            disabled={processing || !editedContent.trim()}
                                            className={`flex-1 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${
                                                processing || !editedContent.trim()
                                                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                                    : 'bg-green-500 text-white hover:bg-green-600'
                                            }`}
                                            data-testid="approve-btn"
                                        >
                                            <Check size={18} />
                                            {processing ? 'Processing...' : 'Approve & Queue'}
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            disabled={processing}
                                            className={`py-3 px-5 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                                                processing
                                                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                                    : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                                            }`}
                                            data-testid="reject-btn"
                                        >
                                            <X size={18} />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewQueuePage;
