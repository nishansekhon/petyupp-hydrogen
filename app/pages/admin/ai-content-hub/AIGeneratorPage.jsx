import React, { useState, useEffect } from 'react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { API_BASE_URL } from '@/config/api';
import HubNavigation from '@/components/AIContentHub/HubNavigation';
import { Sparkles, Calendar, Copy, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const AIGeneratorPage = () => {
    const { isDarkMode } = useAdminTheme();
    const [calendarEntries, setCalendarEntries] = useState([]);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [prompts, setPrompts] = useState([]);
    const [selectedPrompt, setSelectedPrompt] = useState('default');
    const [numVariations, setNumVariations] = useState(3);
    const [generating, setGenerating] = useState(false);
    const [generatedDraft, setGeneratedDraft] = useState(null);
    const [apiStatus, setApiStatus] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        fetchCalendarEntries();
        fetchPrompts();
        checkApiStatus();
    }, []);

    const checkApiStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-content-hub/generate/check-api`);
            const data = await response.json();
            setApiStatus(data);
        } catch (err) {
            setApiStatus({ status: 'error', message: 'Failed to check API status' });
        }
    };

    const fetchCalendarEntries = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-content-hub/calendar`);
            const data = await response.json();
            if (data.status === 'success') {
                setCalendarEntries(data.entries);
                if (data.entries.length > 0) {
                    const today = new Date().toISOString().split('T')[0];
                    const todayEntry = data.entries.find(e => 
                        new Date(e.date).toISOString().split('T')[0] === today
                    );
                    setSelectedEntry(todayEntry || data.entries[0]);
                }
            }
        } catch (err) {
            console.error('Failed to fetch calendar:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPrompts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-content-hub/prompts`);
            const data = await response.json();
            if (data.status === 'success') {
                setPrompts(data.prompts);
            }
        } catch (err) {
            console.error('Failed to fetch prompts:', err);
        }
    };

    const handleGenerate = async () => {
        if (!selectedEntry) {
            setError('Please select a calendar entry first');
            return;
        }

        setGenerating(true);
        setError(null);
        setGeneratedDraft(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-content-hub/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    calendar_id: selectedEntry._id,
                    prompt_name: selectedPrompt,
                    num_variations: numVariations
                })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                setGeneratedDraft(data.draft);
            } else {
                setError(data.detail || 'Generation failed');
            }
        } catch (err) {
            setError('Failed to generate content: ' + err.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleRegenerate = async (variationIndex, feedback = '') => {
        if (!generatedDraft) return;

        setGenerating(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-content-hub/generate/regenerate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    draft_id: generatedDraft._id,
                    variation_index: variationIndex,
                    feedback: feedback
                })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                const updatedVariations = [...generatedDraft.variations];
                updatedVariations[variationIndex] = data.new_variation;
                setGeneratedDraft({
                    ...generatedDraft,
                    variations: updatedVariations
                });
            } else {
                setError(data.detail || 'Regeneration failed');
            }
        } catch (err) {
            setError('Failed to regenerate: ' + err.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = (content, id) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    };

    const contentTypeColors = {
        educational: '#3b82f6',
        behind_scenes: '#8b5cf6',
        ugc: '#ec4899',
        viral: '#f59e0b',
        promo: '#10b981',
        engagement: '#06b6d4'
    };

    return (
        <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <h1 className={`text-2xl font-bold flex items-center gap-3 mb-2 ${
                    isDarkMode ? 'text-slate-100' : 'text-gray-900'
                }`}>
                    <Sparkles className="text-purple-500" size={28} />
                    AI Content Generator
                </h1>
                <p className={`mb-6 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    Generate AI-powered content variations from your calendar entries
                </p>

                <HubNavigation activeTab="generate" />

                {/* API Status Banner */}
                {apiStatus && apiStatus.status !== 'success' && (
                    <div className={`flex items-center gap-2 p-4 mb-5 rounded-lg ${
                        apiStatus.configured 
                            ? 'bg-amber-500/10 text-amber-600' 
                            : 'bg-red-500/10 text-red-500'
                    }`}>
                        <AlertCircle size={18} />
                        <div>
                            <strong>API Status:</strong> {apiStatus.message}
                            {!apiStatus.configured && (
                                <div className="mt-1 text-sm">
                                    Add EMERGENT_LLM_KEY to your environment variables to enable AI generation.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {apiStatus && apiStatus.status === 'success' && (
                    <div className="flex items-center gap-2 p-3 mb-5 rounded-lg bg-green-500/10 text-green-500 text-sm">
                        <CheckCircle size={18} />
                        Claude API connected ({apiStatus.masked_key})
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
                    {/* Left Panel - Settings */}
                    <div>
                        {/* Calendar Selection */}
                        <div className={`rounded-lg p-5 shadow-sm mb-4 ${
                            isDarkMode ? 'bg-slate-800' : 'bg-white'
                        }`}>
                            <h3 className={`text-base font-semibold mb-4 flex items-center gap-2 ${
                                isDarkMode ? 'text-slate-100' : 'text-gray-900'
                            }`}>
                                <Calendar size={18} />
                                1. Select Calendar Entry
                            </h3>

                            {loading ? (
                                <div className={`text-center py-8 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                    Loading...
                                </div>
                            ) : calendarEntries.length === 0 ? (
                                <div className={`text-center py-8 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                    No calendar entries. Create one first.
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                    {calendarEntries.map(entry => (
                                        <div
                                            key={entry._id}
                                            onClick={() => setSelectedEntry(entry)}
                                            className={`p-3 rounded-lg cursor-pointer transition-all ${
                                                selectedEntry?._id === entry._id 
                                                    ? 'border-2 border-teal-500 bg-teal-500/10' 
                                                    : isDarkMode
                                                        ? 'border border-slate-700 hover:border-slate-600'
                                                        : 'border border-gray-200 hover:border-gray-300'
                                            }`}
                                            data-testid={`calendar-entry-${entry._id}`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                    {formatDate(entry.date)}
                                                </span>
                                                <span 
                                                    className="px-2 py-0.5 rounded text-xs text-white"
                                                    style={{ backgroundColor: contentTypeColors[entry.content_type] || '#6b7280' }}
                                                >
                                                    {entry.content_type}
                                                </span>
                                            </div>
                                            <div className={`text-sm font-medium ${
                                                isDarkMode ? 'text-slate-200' : 'text-gray-800'
                                            }`}>
                                                {entry.theme}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Generation Settings */}
                        <div className={`rounded-lg p-5 shadow-sm mb-4 ${
                            isDarkMode ? 'bg-slate-800' : 'bg-white'
                        }`}>
                            <h3 className={`text-base font-semibold mb-4 ${
                                isDarkMode ? 'text-slate-100' : 'text-gray-900'
                            }`}>
                                2. Generation Settings
                            </h3>

                            <div className="mb-4">
                                <label className={`block text-sm mb-1.5 ${
                                    isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                }`}>
                                    Brand Voice
                                </label>
                                <select
                                    value={selectedPrompt}
                                    onChange={(e) => setSelectedPrompt(e.target.value)}
                                    className={`w-full px-3 py-2.5 rounded-lg border text-sm ${
                                        isDarkMode 
                                            ? 'bg-slate-700 border-slate-600 text-slate-100' 
                                            : 'bg-white border-gray-200 text-gray-900'
                                    }`}
                                    data-testid="prompt-select"
                                >
                                    {prompts.map(prompt => (
                                        <option key={prompt._id} value={prompt.name}>
                                            {prompt.name.charAt(0).toUpperCase() + prompt.name.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className={`block text-sm mb-1.5 ${
                                    isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                }`}>
                                    Number of Variations
                                </label>
                                <select
                                    value={numVariations}
                                    onChange={(e) => setNumVariations(parseInt(e.target.value))}
                                    className={`w-full px-3 py-2.5 rounded-lg border text-sm ${
                                        isDarkMode 
                                            ? 'bg-slate-700 border-slate-600 text-slate-100' 
                                            : 'bg-white border-gray-200 text-gray-900'
                                    }`}
                                    data-testid="variations-select"
                                >
                                    <option value={2}>2 variations</option>
                                    <option value={3}>3 variations</option>
                                    <option value={4}>4 variations</option>
                                    <option value={5}>5 variations</option>
                                </select>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={generating || !selectedEntry || apiStatus?.status !== 'success'}
                            className={`w-full py-3.5 rounded-lg text-base font-semibold flex items-center justify-center gap-2 transition-all ${
                                generating || !selectedEntry || apiStatus?.status !== 'success'
                                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                    : 'bg-teal-500 text-white hover:bg-teal-600'
                            }`}
                            data-testid="generate-btn"
                        >
                            {generating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Generate Content
                                </>
                            )}
                        </button>

                        {/* Error Message */}
                        {error && (
                            <div className="mt-3 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm flex items-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Right Panel - Results */}
                    <div>
                        {/* Selected Entry Details */}
                        {selectedEntry && (
                            <div className={`rounded-lg p-5 shadow-sm mb-4 ${
                                isDarkMode ? 'bg-slate-800' : 'bg-white'
                            }`}>
                                <h3 className={`text-base font-semibold mb-3 ${
                                    isDarkMode ? 'text-slate-100' : 'text-gray-900'
                                }`}>
                                    Selected Entry Details
                                </h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Theme:</span>
                                        <div className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                                            {selectedEntry.theme}
                                        </div>
                                    </div>
                                    <div>
                                        <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Type:</span>
                                        <div className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                                            {selectedEntry.content_type}
                                        </div>
                                    </div>
                                    <div>
                                        <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Platform:</span>
                                        <div className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                                            {selectedEntry.platform}
                                        </div>
                                    </div>
                                    <div>
                                        <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Hook:</span>
                                        <div className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                                            {selectedEntry.hook_style || 'Not specified'}
                                        </div>
                                    </div>
                                    {selectedEntry.cta && (
                                        <div className="col-span-2">
                                            <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>CTA:</span>
                                            <div className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                                                {selectedEntry.cta}
                                            </div>
                                        </div>
                                    )}
                                    {selectedEntry.hashtags && selectedEntry.hashtags.length > 0 && (
                                        <div className="col-span-2">
                                            <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Hashtags:</span>
                                            <div className="font-medium text-teal-500">
                                                {selectedEntry.hashtags.join(' ')}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Generated Variations */}
                        {generatedDraft && (
                            <div className={`rounded-lg p-5 shadow-sm ${
                                isDarkMode ? 'bg-slate-800' : 'bg-white'
                            }`}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className={`text-base font-semibold ${
                                        isDarkMode ? 'text-slate-100' : 'text-gray-900'
                                    }`}>
                                        Generated Variations
                                    </h3>
                                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                                        Draft saved
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {generatedDraft.variations.map((variation, index) => (
                                        <div
                                            key={variation.variation_id}
                                            className={`p-4 rounded-lg border ${
                                                isDarkMode 
                                                    ? 'bg-slate-700/50 border-slate-600' 
                                                    : 'bg-gray-50 border-gray-200'
                                            }`}
                                            data-testid={`variation-${index}`}
                                        >
                                            <div className="flex justify-between items-center mb-3">
                                                <span className={`text-sm font-semibold ${
                                                    isDarkMode ? 'text-slate-200' : 'text-gray-700'
                                                }`}>
                                                    Variation {index + 1}
                                                </span>
                                                <div className="flex gap-2 items-center">
                                                    <span className={`text-xs ${
                                                        variation.character_count > 280 
                                                            ? 'text-red-500' 
                                                            : isDarkMode ? 'text-slate-400' : 'text-gray-500'
                                                    }`}>
                                                        {variation.character_count} chars
                                                    </span>
                                                    <button
                                                        onClick={() => handleRegenerate(index)}
                                                        disabled={generating}
                                                        className={`p-1.5 rounded text-xs flex items-center gap-1 ${
                                                            isDarkMode 
                                                                ? 'bg-slate-600 text-slate-300 hover:bg-slate-500' 
                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        } ${generating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <RefreshCw size={12} />
                                                        Regenerate
                                                    </button>
                                                    <button
                                                        onClick={() => handleCopy(variation.content, variation.variation_id)}
                                                        className={`p-1.5 rounded text-xs flex items-center gap-1 ${
                                                            copiedId === variation.variation_id
                                                                ? 'bg-green-500/20 text-green-500'
                                                                : isDarkMode 
                                                                    ? 'bg-slate-600 text-slate-300 hover:bg-slate-500' 
                                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {copiedId === variation.variation_id ? (
                                                            <>
                                                                <CheckCircle size={12} />
                                                                Copied
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy size={12} />
                                                                Copy
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
                                                isDarkMode ? 'text-slate-100' : 'text-gray-800'
                                            }`}>
                                                {variation.content}
                                            </div>
                                            {variation.is_regenerated && (
                                                <div className="mt-2 text-xs text-purple-500 flex items-center gap-1">
                                                    <RefreshCw size={10} />
                                                    Regenerated
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className={`mt-5 p-3 rounded-lg text-sm ${
                                    isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    <strong>Next step:</strong> Go to Review Queue to approve these variations for posting.
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {!generatedDraft && !generating && (
                            <div className={`rounded-lg p-16 shadow-sm text-center ${
                                isDarkMode ? 'bg-slate-800' : 'bg-white'
                            }`}>
                                <Sparkles size={48} className={`mx-auto mb-4 ${
                                    isDarkMode ? 'text-slate-600' : 'text-gray-300'
                                }`} />
                                <div className={`text-lg mb-2 ${
                                    isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                }`}>
                                    Ready to generate
                                </div>
                                <div className={`text-sm ${
                                    isDarkMode ? 'text-slate-500' : 'text-gray-500'
                                }`}>
                                    Select a calendar entry and click Generate to create AI content
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIGeneratorPage;
