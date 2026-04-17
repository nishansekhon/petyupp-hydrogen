/**
 * SmartTwitterEditorModal.js
 * 
 * A modal that helps users shorten long content for Twitter with AI suggestions.
 * Opens when user tries to save content > 280 chars to Twitter draft.
 */

import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/config/api';
import { 
  X, AlertTriangle, Sparkles, Check, RefreshCw, 
  Twitter, Instagram, Copy, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = API_BASE_URL + '/api';

const SmartTwitterEditorModal = ({ 
  isOpen, 
  onClose, 
  originalContent, 
  productName,
  onSaveSuccess 
}) => {
  const [editedContent, setEditedContent] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState(false);
  const [savingTwitter, setSavingTwitter] = useState(false);
  const [savingInstagram, setSavingInstagram] = useState(false);
  const textareaRef = useRef(null);

  const originalChars = originalContent?.length || 0;
  const editedChars = editedContent.length;
  const isOverLimit = editedChars > 280;
  const isOriginalOverLimit = originalChars > 280;

  // Initialize edited content and fetch suggestions when modal opens
  useEffect(() => {
    if (isOpen && originalContent) {
      setEditedContent(originalContent);
      setSuggestions([]);
      setSuggestionsError(false);
      fetchAISuggestions();
    }
  }, [isOpen, originalContent]);

  // Fetch AI suggestions
  const fetchAISuggestions = async () => {
    setLoadingSuggestions(true);
    setSuggestionsError(false);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/ai/shorten-for-twitter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: originalContent,
          platform: 'twitter',
          max_chars: 280,
          product_name: productName || '',
          num_options: 3
        })
      });

      const data = await response.json();
      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        setSuggestionsError(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestionsError(true);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Apply a suggestion to the textarea
  const applySuggestion = (text) => {
    setEditedContent(text);
    // Scroll to textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Save to Twitter draft
  const saveToTwitterDraft = async () => {
    if (isOverLimit) {
      toast.error('Content still exceeds 280 characters');
      return;
    }

    setSavingTwitter(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/twitter/drafts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          platform: 'twitter',
          content: editedContent.trim()
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Saved to Twitter Drafts!');
        onSaveSuccess?.();
        onClose();
      } else {
        toast.error(data.error || 'Failed to save draft');
      }
    } catch (error) {
      console.error('Error saving Twitter draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setSavingTwitter(false);
    }
  };

  // Save to Instagram draft (original long content)
  const saveToInstagramDraft = async () => {
    setSavingInstagram(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/twitter/drafts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          platform: 'instagram',
          content: originalContent.trim()
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Saved to Instagram Drafts!');
        onSaveSuccess?.();
        onClose();
      } else {
        toast.error(data.error || 'Failed to save draft');
      }
    } catch (error) {
      console.error('Error saving Instagram draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setSavingInstagram(false);
    }
  };

  // Get character count color
  const getCharCountColor = () => {
    if (editedChars > 280) return 'text-red-400';
    if (editedChars > 260) return 'text-yellow-400';
    return 'text-green-400';
  };

  // Get suggestion type label
  const getSuggestionLabel = (type, index) => {
    const labels = {
      informative: '💡 Informative',
      engaging: '❤️ Engaging',
      punchy: '⚡ Short & Punchy'
    };
    return labels[type] || `Option ${index + 1}`;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-xl w-full max-w-2xl border border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        data-testid="smart-twitter-editor-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 rounded-lg">
              <Twitter className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Smart Twitter Draft Editor</h2>
              <p className="text-xs text-slate-400">Shorten your content for Twitter</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Section 1: Original Content */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Original ({originalChars} chars)
              </span>
              {isOriginalOverLimit && (
                <span className="flex items-center gap-1 text-xs text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  Too long for Twitter
                </span>
              )}
            </div>
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 max-h-[150px] overflow-y-auto">
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{originalContent}</p>
            </div>
          </div>

          {/* Section 2: AI Suggestions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  AI Suggestions
                </span>
              </div>
              {!loadingSuggestions && !suggestionsError && (
                <button
                  onClick={fetchAISuggestions}
                  className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </button>
              )}
            </div>

            {loadingSuggestions ? (
              <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Generating smart suggestions...</span>
              </div>
            ) : suggestionsError ? (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">AI suggestions unavailable. Please edit manually.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={index}
                    className="bg-slate-700/50 border border-slate-600 hover:border-teal-500/50 rounded-lg p-3 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-medium text-slate-300">
                            {getSuggestionLabel(suggestion.type, index)}
                          </span>
                          <span className={`text-xs ${suggestion.chars <= 280 ? 'text-green-400' : 'text-red-400'}`}>
                            ({suggestion.chars} chars)
                            {suggestion.chars <= 280 && <Check className="w-3 h-3 inline ml-1" />}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">{suggestion.text}</p>
                      </div>
                      <button
                        onClick={() => applySuggestion(suggestion.text)}
                        className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-teal-400 border border-teal-500/50 hover:bg-teal-500/10 rounded-lg transition-colors"
                      >
                        Use This
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Manual Edit */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Edit for Twitter
              </span>
              <span className={`text-xs font-medium ${getCharCountColor()}`}>
                {editedChars} / 280
                {!isOverLimit && <Check className="w-3 h-3 inline ml-1" />}
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-[120px] bg-slate-900/50 border border-slate-600 focus:border-teal-500 rounded-lg p-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-colors"
              placeholder="Edit your content here..."
              data-testid="twitter-edit-textarea"
            />
            {isOverLimit && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {editedChars - 280} characters over limit
              </p>
            )}
          </div>
        </div>

        {/* Footer - Action Buttons */}
        <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-700 bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={saveToInstagramDraft}
              disabled={savingInstagram}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {savingInstagram ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Instagram className="w-4 h-4" />
              )}
              Save to Instagram Draft
            </button>
            
            <button
              onClick={saveToTwitterDraft}
              disabled={isOverLimit || savingTwitter}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                isOverLimit || savingTwitter
                  ? 'bg-slate-600 cursor-not-allowed'
                  : 'bg-teal-500 hover:bg-teal-400'
              }`}
              data-testid="save-twitter-draft-btn"
            >
              {savingTwitter ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Twitter className="w-4 h-4" />
              )}
              Save to Twitter Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartTwitterEditorModal;
