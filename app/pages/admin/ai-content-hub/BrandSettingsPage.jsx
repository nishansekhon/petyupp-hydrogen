import React, { useState, useEffect } from 'react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { API_BASE_URL } from '@/config/api';
import HubNavigation from '@/components/AIContentHub/HubNavigation';
import { 
    Settings, Plus, Edit2, Trash2, TestTube, Check, X, 
    AlertCircle, CheckCircle, Loader2, ChevronDown, ChevronUp
} from 'lucide-react';

const BrandSettingsPage = () => {
    const { isDarkMode } = useAdminTheme();
    const [prompts, setPrompts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedPrompt, setExpandedPrompt] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [testResult, setTestResult] = useState(null);
    const [testingPromptId, setTestingPromptId] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        content_type: 'tweet',
        system_prompt: '',
        example_outputs: '',
        is_active: true
    });

    useEffect(() => {
        fetchPrompts();
    }, []);

    const fetchPrompts = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-content-hub/prompts`);
            const data = await response.json();
            if (data.status === 'success') {
                setPrompts(data.prompts);
            }
        } catch (err) {
            console.error('Failed to fetch prompts:', err);
            setError('Failed to load prompts');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setEditingPrompt(null);
        setFormData({
            name: '',
            content_type: 'tweet',
            system_prompt: '',
            example_outputs: '',
            is_active: true
        });
        setShowModal(true);
        setError(null);
    };

    const handleEdit = (prompt) => {
        setEditingPrompt(prompt);
        setFormData({
            name: prompt.name,
            content_type: prompt.content_type || 'tweet',
            system_prompt: prompt.system_prompt || '',
            example_outputs: (prompt.example_outputs || []).join('\n'),
            is_active: prompt.is_active !== false
        });
        setShowModal(true);
        setError(null);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setError('Prompt name is required');
            return;
        }
        if (!formData.system_prompt.trim()) {
            setError('System prompt is required');
            return;
        }

        setProcessing(true);
        setError(null);

        const payload = {
            name: formData.name.trim(),
            content_type: formData.content_type,
            system_prompt: formData.system_prompt.trim(),
            example_outputs: formData.example_outputs.split('\n').filter(s => s.trim()),
            is_active: formData.is_active
        };

        try {
            let response;
            if (editingPrompt) {
                response = await fetch(`${API_BASE_URL}/api/ai-content-hub/prompts/${editingPrompt._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                response = await fetch(`${API_BASE_URL}/api/ai-content-hub/prompts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            const data = await response.json();

            if (data.status === 'success') {
                setSuccessMessage(editingPrompt ? 'Prompt updated!' : 'Prompt created!');
                setShowModal(false);
                fetchPrompts();
            } else {
                setError(data.detail || data.message || 'Failed to save prompt');
            }
        } catch (err) {
            setError('Failed to save: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (prompt) => {
        if (prompt.name === 'default') {
            setError('Cannot delete the default prompt');
            return;
        }

        if (!window.confirm(`Delete prompt "${prompt.name}"? This cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-content-hub/prompts/${prompt._id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.status === 'success') {
                setSuccessMessage('Prompt deleted');
                fetchPrompts();
            } else {
                setError(data.detail || 'Failed to delete');
            }
        } catch (err) {
            setError('Failed to delete: ' + err.message);
        }
    };

    const handleTest = async (prompt) => {
        setTestingPromptId(prompt._id);
        setTestResult(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-content-hub/prompts/${prompt._id}/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ test_theme: 'PetYupp premium dog treats' })
            });

            const data = await response.json();

            if (data.status === 'success') {
                setTestResult({
                    promptId: prompt._id,
                    output: data.test_output,
                    tokens: data.tokens_used
                });
            } else {
                setError(data.message || 'Test failed');
            }
        } catch (err) {
            setError('Test failed: ' + err.message);
        } finally {
            setTestingPromptId(null);
        }
    };

    const toggleExpand = (promptId) => {
        setExpandedPrompt(expandedPrompt === promptId ? null : promptId);
        setTestResult(null);
    };

    const contentTypes = [
        { value: 'tweet', label: 'Tweet' },
        { value: 'thread', label: 'Thread' },
        { value: 'caption', label: 'Caption' },
        { value: 'story', label: 'Story' }
    ];

    return (
        <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <h1 className={`text-2xl font-bold flex items-center gap-3 mb-2 ${
                    isDarkMode ? 'text-slate-100' : 'text-gray-900'
                }`}>
                    <Settings className="text-purple-500" size={28} />
                    Brand Settings
                </h1>
                <p className={`mb-6 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    Manage AI prompts and brand voice configurations
                </p>

                <HubNavigation activeTab="settings" />

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

                {/* Error Message */}
                {error && !showModal && (
                    <div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-red-500/10 text-red-500">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                        <button onClick={() => setError(null)} className="hover:text-red-600">×</button>
                    </div>
                )}

                {/* Create New Button */}
                <div className="mb-5">
                    <button
                        onClick={handleCreateNew}
                        className="px-4 py-2.5 rounded-lg bg-teal-500 text-white font-medium flex items-center gap-2 hover:bg-teal-600 transition-colors"
                        data-testid="create-prompt-btn"
                    >
                        <Plus size={18} />
                        Create New Prompt
                    </button>
                </div>

                {/* Prompts List */}
                {loading ? (
                    <div className={`p-10 text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                        Loading prompts...
                    </div>
                ) : prompts.length === 0 ? (
                    <div className={`p-10 text-center rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                        <Settings size={40} className={`mx-auto mb-3 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                        <div className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                            No prompts found. Create your first prompt!
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {prompts.map(prompt => (
                            <div
                                key={prompt._id}
                                className={`rounded-lg shadow-sm overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}
                                data-testid={`prompt-card-${prompt._id}`}
                            >
                                {/* Card Header */}
                                <div
                                    onClick={() => toggleExpand(prompt._id)}
                                    className={`px-5 py-4 flex items-center justify-between cursor-pointer transition-colors ${
                                        isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <div className={`font-semibold flex items-center gap-2 ${
                                                isDarkMode ? 'text-slate-100' : 'text-gray-900'
                                            }`}>
                                                {prompt.name}
                                                {prompt.name === 'default' && (
                                                    <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
                                                        System
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`text-sm mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                Content Type: {prompt.content_type || 'tweet'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                            prompt.is_active !== false
                                                ? 'bg-green-500/20 text-green-500'
                                                : 'bg-gray-500/20 text-gray-400'
                                        }`}>
                                            {prompt.is_active !== false ? 'Active' : 'Inactive'}
                                        </span>
                                        {expandedPrompt === prompt._id ? (
                                            <ChevronUp size={20} className={isDarkMode ? 'text-slate-400' : 'text-gray-400'} />
                                        ) : (
                                            <ChevronDown size={20} className={isDarkMode ? 'text-slate-400' : 'text-gray-400'} />
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {expandedPrompt === prompt._id && (
                                    <div className={`px-5 pb-5 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                                        {/* System Prompt */}
                                        <div className="mt-4">
                                            <label className={`block text-sm font-medium mb-1.5 ${
                                                isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                            }`}>
                                                System Prompt
                                            </label>
                                            <div className={`p-3 rounded-lg text-sm whitespace-pre-wrap max-h-48 overflow-y-auto ${
                                                isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-gray-50 text-gray-800'
                                            }`}>
                                                {prompt.system_prompt || 'No system prompt defined'}
                                            </div>
                                        </div>

                                        {/* Example Outputs */}
                                        {prompt.example_outputs && prompt.example_outputs.length > 0 && (
                                            <div className="mt-4">
                                                <label className={`block text-sm font-medium mb-1.5 ${
                                                    isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                                }`}>
                                                    Example Outputs ({prompt.example_outputs.length})
                                                </label>
                                                <div className="space-y-2">
                                                    {prompt.example_outputs.slice(0, 3).map((ex, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`p-2 rounded text-sm ${
                                                                isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-50 text-gray-700'
                                                            }`}
                                                        >
                                                            {ex}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Test Result */}
                                        {testResult && testResult.promptId === prompt._id && (
                                            <div className="mt-4">
                                                <label className={`block text-sm font-medium mb-1.5 ${
                                                    isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                                }`}>
                                                    Test Output
                                                </label>
                                                <div className={`p-3 rounded-lg text-sm border-2 border-teal-500/30 ${
                                                    isDarkMode ? 'bg-teal-500/10 text-slate-200' : 'bg-teal-50 text-gray-800'
                                                }`}>
                                                    {testResult.output}
                                                </div>
                                                {testResult.tokens && (
                                                    <div className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                                                        Tokens: {testResult.tokens.total_tokens || 'N/A'}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="mt-4 flex gap-2 flex-wrap">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleTest(prompt);
                                                }}
                                                disabled={testingPromptId === prompt._id}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                                                    testingPromptId === prompt._id
                                                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                                        : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                                                }`}
                                                data-testid={`test-prompt-${prompt._id}`}
                                            >
                                                {testingPromptId === prompt._id ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <TestTube size={14} />
                                                )}
                                                Test Prompt
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(prompt);
                                                }}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                                                    isDarkMode
                                                        ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                                data-testid={`edit-prompt-${prompt._id}`}
                                            >
                                                <Edit2 size={14} />
                                                Edit
                                            </button>
                                            {prompt.name !== 'default' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(prompt);
                                                    }}
                                                    className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                                    data-testid={`delete-prompt-${prompt._id}`}
                                                >
                                                    <Trash2 size={14} />
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className={`w-full max-w-2xl rounded-lg shadow-xl max-h-[90vh] overflow-y-auto ${
                            isDarkMode ? 'bg-slate-800' : 'bg-white'
                        }`}>
                            {/* Modal Header */}
                            <div className={`px-5 py-4 border-b flex items-center justify-between ${
                                isDarkMode ? 'border-slate-700' : 'border-gray-200'
                            }`}>
                                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                                    {editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className={`text-xl ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    ×
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 space-y-4">
                                {/* Error in Modal */}
                                {error && (
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                )}

                                {/* Name */}
                                <div>
                                    <label className={`block text-sm font-medium mb-1.5 ${
                                        isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                    }`}>
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        disabled={editingPrompt?.name === 'default'}
                                        placeholder="e.g., promotional, educational"
                                        className={`w-full px-3 py-2.5 rounded-lg border text-sm ${
                                            isDarkMode 
                                                ? 'bg-slate-700 border-slate-600 text-slate-100' 
                                                : 'bg-white border-gray-200 text-gray-900'
                                        } ${editingPrompt?.name === 'default' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        data-testid="prompt-name-input"
                                    />
                                </div>

                                {/* Content Type */}
                                <div>
                                    <label className={`block text-sm font-medium mb-1.5 ${
                                        isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                    }`}>
                                        Content Type
                                    </label>
                                    <select
                                        value={formData.content_type}
                                        onChange={(e) => setFormData({...formData, content_type: e.target.value})}
                                        className={`w-full px-3 py-2.5 rounded-lg border text-sm ${
                                            isDarkMode 
                                                ? 'bg-slate-700 border-slate-600 text-slate-100' 
                                                : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                        data-testid="prompt-content-type"
                                    >
                                        {contentTypes.map(ct => (
                                            <option key={ct.value} value={ct.value}>{ct.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* System Prompt */}
                                <div>
                                    <label className={`block text-sm font-medium mb-1.5 ${
                                        isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                    }`}>
                                        System Prompt *
                                    </label>
                                    <textarea
                                        value={formData.system_prompt}
                                        onChange={(e) => setFormData({...formData, system_prompt: e.target.value})}
                                        rows={8}
                                        placeholder="Enter the AI system prompt that defines the brand voice..."
                                        className={`w-full px-3 py-2.5 rounded-lg border text-sm resize-y ${
                                            isDarkMode 
                                                ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400' 
                                                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                        }`}
                                        data-testid="prompt-system-prompt"
                                    />
                                </div>

                                {/* Example Outputs */}
                                <div>
                                    <label className={`block text-sm font-medium mb-1.5 ${
                                        isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                    }`}>
                                        Example Outputs (one per line)
                                    </label>
                                    <textarea
                                        value={formData.example_outputs}
                                        onChange={(e) => setFormData({...formData, example_outputs: e.target.value})}
                                        rows={4}
                                        placeholder="Add example outputs to guide the AI...&#10;One example per line"
                                        className={`w-full px-3 py-2.5 rounded-lg border text-sm resize-y ${
                                            isDarkMode 
                                                ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400' 
                                                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                        }`}
                                        data-testid="prompt-examples"
                                    />
                                </div>

                                {/* Is Active */}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                        className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                                        data-testid="prompt-active-checkbox"
                                    />
                                    <label htmlFor="is_active" className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                        Active (available for selection in AI Generator)
                                    </label>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className={`px-5 py-4 border-t flex justify-end gap-3 ${
                                isDarkMode ? 'border-slate-700' : 'border-gray-200'
                            }`}>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                        isDarkMode 
                                            ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={processing}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                                        processing
                                            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                            : 'bg-teal-500 text-white hover:bg-teal-600'
                                    }`}
                                    data-testid="save-prompt-btn"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={16} />
                                            {editingPrompt ? 'Update Prompt' : 'Create Prompt'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrandSettingsPage;
