/**
 * ContentTab Component
 * 
 * Handles the Content tab functionality in Marketing Hub including:
 * - Content Ideas list with expandable cards
 * - Generate for Product, Engagement, and Promotion modals
 * - Content Calendar Widget integration
 * - Copy to clipboard functionality
 * - Auto-generate toggle
 * - Send to Twitter Draft functionality
 * - Smart Twitter Editor modal for long content
 * 
 * @component
 */

import React, { useState } from 'react';
import { API_BASE_URL } from '@/config/api';
import { 
  Lightbulb, Sparkles, Copy, Trash2, ChevronRight, 
  ExternalLink, Loader2, Twitter
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import ContentCalendarWidget from '@/components/admin/ContentCalendarWidget';
import SmartTwitterEditorModal from './SmartTwitterEditorModal';

const API_URL = API_BASE_URL + '/api';

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

const ContentTab = ({
  isDarkMode,
  // Content Ideas data
  contentIdeas,
  fetchContentIdeas,
  expandedIdea,
  setExpandedIdea,
  deletingIdeaId,
  handleDeleteIdea,
  // Auto-generate
  autoGenerate,
  setAutoGenerate,
  // Modal setters
  setShowProductModal,
  setShowEngagementModal,
  setShowPromotionModal,
  // Copy function
  copyToClipboard,
  // Format helper
  formatTimeAgo
}) => {
  const navigate = useNavigate();
  const [sendingToTwitter, setSendingToTwitter] = useState(null);
  
  // Smart Twitter Editor modal state
  const [showSmartEditor, setShowSmartEditor] = useState(false);
  const [smartEditorContent, setSmartEditorContent] = useState('');
  const [smartEditorProductName, setSmartEditorProductName] = useState('');

  // Handle Twitter icon click - open modal if over limit, otherwise save directly
  const handleTwitterClick = (idea, e) => {
    e?.stopPropagation();
    
    // Combine caption and hashtags for the draft content
    const content = idea.hashtags 
      ? `${idea.caption}\n\n${idea.hashtags}`.trim()
      : idea.caption;
    
    // If over 280 chars, open the Smart Editor modal
    if (content.length > 280) {
      setSmartEditorContent(content);
      setSmartEditorProductName(idea.product_name || '');
      setShowSmartEditor(true);
    } else {
      // Under limit - save directly
      handleSendToTwitterDraft(idea, e);
    }
  };

  // Send content idea to Twitter draft (for content under 280 chars)
  const handleSendToTwitterDraft = async (idea, e) => {
    e?.stopPropagation();
    
    // Combine caption and hashtags for the draft content
    const content = idea.hashtags 
      ? `${idea.caption}\n\n${idea.hashtags}`.trim()
      : idea.caption;
    
    setSendingToTwitter(idea.id);
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
          content: content
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(
          <div className="flex flex-col gap-1">
            <p className="font-medium">Saved to Twitter Drafts</p>
            <button 
              onClick={() => {
                navigate('/admin/marketing', { state: { activeTab: 'post' } });
                window.dispatchEvent(new CustomEvent('switchToPostTab'));
              }}
              className="text-xs text-teal-400 hover:text-teal-300 underline text-left"
            >
              View in Post tab →
            </button>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.error(data.error || 'Failed to save draft');
      }
    } catch (error) {
      console.error('Error sending to Twitter draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setSendingToTwitter(null);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-5">
      {/* Left Column - Content Ideas */}
      <div className="col-span-12 lg:col-span-5">
        <div className={`rounded-xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
          {/* Card Header */}
          <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Content Ideas</h3>
                <p className="text-[10px] text-gray-400">Auto-generated • Copy to Metricool</p>
              </div>
            </div>
            <button
              onClick={fetchContentIdeas}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-xs transition-colors"
            >
              Regenerate All
            </button>
          </div>

          {/* Action Buttons */}
          <div className="p-3 flex gap-2">
            <button
              onClick={() => setShowProductModal(true)}
              className="flex-1 py-2 px-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-lg text-white text-xs font-medium transition-colors"
            >
              <Sparkles className="w-3 h-3 inline mr-1" />
              Generate for Product
            </button>
            <button
              onClick={() => setShowEngagementModal(true)}
              className="flex-1 py-2 px-3 bg-slate-600 hover:bg-slate-500 rounded-lg text-white text-xs font-medium transition-colors"
            >
              Generate Engagement
            </button>
            <button
              onClick={() => setShowPromotionModal(true)}
              className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-500 rounded-lg text-white text-xs font-medium transition-colors"
            >
              Generate Promotion
            </button>
          </div>

          {/* Content Ideas List - Expandable Card Design */}
          <div className="max-h-[500px] overflow-y-auto">
            {contentIdeas.length === 0 ? (
              <div className="p-8 text-center">
                <Lightbulb className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-sm text-gray-400">No content ideas yet</p>
                <p className="text-xs text-gray-500 mt-1">Generate your first content idea above</p>
              </div>
            ) : (
              <div className="space-y-2 p-3">
                {contentIdeas.map((idea) => {
                  const isExpanded = expandedIdea === idea.id;
                  const isSending = sendingToTwitter === idea.id;
                  
                  return (
                    <div 
                      key={idea.id} 
                      className={`rounded-lg border transition-all ${
                        isDarkMode 
                          ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600' 
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Collapsed State - Main Card */}
                      <div
                        onClick={() => setExpandedIdea(isExpanded ? null : idea.id)}
                        className="p-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          {/* Product Thumbnail */}
                          <div className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 ${
                            isDarkMode ? 'bg-slate-700' : 'bg-gray-100'
                          }`}>
                            {idea.product_image ? (
                              <img 
                                src={idea.product_image} 
                                alt={idea.product_name || 'Product'} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-2xl">{CONTENT_ICONS[idea.type] || '📝'}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Content Info */}
                          <div className="flex-1 min-w-0">
                            {/* Type & Platform & Time */}
                            <div className="flex items-center gap-1.5 mb-1 text-slate-500 text-[10px]">
                              <span className="uppercase tracking-wide font-medium">
                                {idea.type === 'product' ? 'PRODUCT' : 
                                 idea.type === 'engagement' ? 'ENGAGEMENT' : 'PROMOTION'}
                              </span>
                              <span>•</span>
                              <span>{PLATFORMS[idea.platform]?.name || idea.platform}</span>
                              <span>•</span>
                              <span>{formatTimeAgo(idea.generated_at)}</span>
                            </div>
                            
                            {/* Product Name */}
                            {idea.product_name && (
                              <p className={`text-xs font-medium truncate mb-1 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {idea.product_name}
                              </p>
                            )}
                            
                            {/* Caption Preview - 2 lines */}
                            <p className={`text-[11px] line-clamp-2 ${
                              isDarkMode ? 'text-slate-400' : 'text-gray-600'
                            }`}>
                              {idea.caption}
                            </p>
                          </div>

                          {/* Right Side Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {/* Send to Twitter Draft Button */}
                            <button
                              onClick={(e) => handleTwitterClick(idea, e)}
                              disabled={isSending}
                              className={`p-2 rounded-lg transition-colors ${
                                isSending
                                  ? 'opacity-50 cursor-not-allowed'
                                  : isDarkMode 
                                    ? 'hover:bg-sky-500/20 text-sky-400 hover:text-sky-300' 
                                    : 'hover:bg-sky-50 text-sky-500 hover:text-sky-600'
                              }`}
                              title="Send to Twitter Draft"
                              data-testid={`send-twitter-draft-${idea.id}`}
                            >
                              {isSending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Twitter className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                copyToClipboard(`${idea.caption}\n\n${idea.hashtags}`, 'Content');
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                isDarkMode 
                                  ? 'hover:bg-slate-700 text-slate-400 hover:text-teal-400' 
                                  : 'hover:bg-gray-100 text-gray-500 hover:text-teal-600'
                              }`}
                              title="Copy all"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleDeleteIdea(idea.id); 
                              }}
                              disabled={deletingIdeaId === idea.id}
                              className={`p-2 rounded-lg transition-colors ${
                                isDarkMode 
                                  ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400' 
                                  : 'hover:bg-red-50 text-gray-500 hover:text-red-500'
                              } disabled:opacity-50`}
                              title="Delete"
                            >
                              {deletingIdeaId === idea.id 
                                ? <Loader2 className="w-4 h-4 animate-spin" /> 
                                : <Trash2 className="w-4 h-4" />
                              }
                            </button>
                            <ChevronRight 
                              className={`w-5 h-5 transition-transform ${
                                isExpanded ? 'rotate-90' : ''
                              } ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Expanded State */}
                      {isExpanded && (
                        <div className={`px-3 pb-3 space-y-3 ${
                          isDarkMode ? 'border-t border-slate-700' : 'border-t border-gray-200'
                        }`}>
                          {/* Caption Box */}
                          <div className={`mt-3 p-3 rounded-lg ${
                            isDarkMode ? 'bg-slate-800/80' : 'bg-gray-50'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-[9px] uppercase tracking-wide font-medium ${
                                isDarkMode ? 'text-slate-500' : 'text-gray-500'
                              }`}>Caption</span>
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  copyToClipboard(idea.caption, 'Caption');
                                }}
                                className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" /> Copy
                              </button>
                            </div>
                            <p className={`text-[11px] whitespace-pre-line ${
                              isDarkMode ? 'text-slate-300' : 'text-gray-700'
                            }`}>
                              {idea.caption}
                            </p>
                          </div>

                          {/* Hashtags Box */}
                          {idea.hashtags && (
                            <div className={`p-3 rounded-lg ${
                              isDarkMode ? 'bg-slate-800/80' : 'bg-gray-50'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-[9px] uppercase tracking-wide font-medium ${
                                  isDarkMode ? 'text-slate-500' : 'text-gray-500'
                                }`}>Hashtags</span>
                                <button
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    copyToClipboard(idea.hashtags, 'Hashtags');
                                  }}
                                  className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1"
                                >
                                  <Copy className="w-3 h-3" /> Copy
                                </button>
                              </div>
                              <p className="text-[11px] text-teal-400">
                                {idea.hashtags}
                              </p>
                            </div>
                          )}

                          {/* Action Bar */}
                          <div className="flex items-center gap-2 pt-2">
                            {/* Send to Twitter Draft - Expanded */}
                            <button 
                              onClick={(e) => handleTwitterClick(idea, e)}
                              disabled={isSending}
                              className={`flex-1 py-2 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors ${
                                isSending
                                  ? 'bg-slate-600 cursor-not-allowed text-slate-400'
                                  : 'bg-sky-600 hover:bg-sky-500 text-white'
                              }`}
                            >
                              {isSending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Twitter className="w-3.5 h-3.5" />
                              )}
                              {isSending ? 'Saving...' : 'Send to Twitter Draft'}
                            </button>
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                copyToClipboard(`${idea.caption}\n\n${idea.hashtags}`, 'Content');
                              }}
                              className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-[11px] text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" /> Copy All
                            </button>
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                window.open('https://app.metricool.com', '_blank');
                              }}
                              className={`flex-1 py-2 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors ${
                                isDarkMode 
                                  ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                              }`}
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Open Metricool
                            </button>
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleDeleteIdea(idea.id); 
                              }}
                              disabled={deletingIdeaId === idea.id}
                              className={`py-2 px-4 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors ${
                                isDarkMode 
                                  ? 'bg-slate-700 hover:bg-red-500/20 text-slate-400 hover:text-red-400' 
                                  : 'bg-gray-200 hover:bg-red-50 text-gray-600 hover:text-red-500'
                              } disabled:opacity-50`}
                            >
                              {deletingIdeaId === idea.id 
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> 
                                : <><Trash2 className="w-3.5 h-3.5" /> Delete</>
                              }
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`p-3 border-t flex items-center justify-between ${isDarkMode ? 'bg-slate-700/30 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoGenerate}
                onChange={(e) => setAutoGenerate(e.target.checked)}
                className="w-3 h-3 rounded border-slate-500 bg-slate-700 text-teal-500"
              />
              <span className="text-[10px] text-gray-400">Auto-generate for new products</span>
            </label>
            <button className="text-[10px] text-teal-400 hover:text-teal-300">Settings</button>
          </div>
        </div>
      </div>

      {/* Right Column - Content Calendar Widget (Live Data from Metricool) */}
      <div className="col-span-12 lg:col-span-7">
        <ContentCalendarWidget />
      </div>

      {/* Smart Twitter Editor Modal */}
      <SmartTwitterEditorModal
        isOpen={showSmartEditor}
        onClose={() => setShowSmartEditor(false)}
        originalContent={smartEditorContent}
        productName={smartEditorProductName}
        onSaveSuccess={() => {
          // Optionally refresh content ideas or trigger other updates
        }}
      />
    </div>
  );
};

export default ContentTab;
