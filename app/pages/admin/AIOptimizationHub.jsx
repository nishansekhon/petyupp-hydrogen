import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
    CheckCircle, Circle, ExternalLink, RefreshCw, ArrowLeft,
    Globe, Code, Building, HelpCircle, Bot, Share2, 
    Image, Sparkles, Plus, Trash2, TrendingUp
} from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

const AIOptimizationHub = () => {
    const navigate = useNavigate();
    const [checklist, setChecklist] = useState([]);
    const [score, setScore] = useState(0);
    const [completed, setCompleted] = useState(0);
    const [total, setTotal] = useState(10);
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState([]);
    const [showContentModal, setShowContentModal] = useState(false);
    const [contentForm, setContentForm] = useState({
        platform: 'reddit',
        url: '',
        title: '',
        mentionsBrand: true
    });

    const platforms = ['reddit', 'quora', 'medium', 'youtube', 'wikipedia', 'twitter', 'other'];

    const iconMap = {
        google: <Globe className="w-5 h-5 text-blue-400" />,
        bing: <Globe className="w-5 h-5 text-teal-400" />,
        openai: <Sparkles className="w-5 h-5 text-green-400" />,
        code: <Code className="w-5 h-5 text-purple-400" />,
        building: <Building className="w-5 h-5 text-orange-400" />,
        help: <HelpCircle className="w-5 h-5 text-yellow-400" />,
        robot: <Bot className="w-5 h-5 text-cyan-400" />,
        share: <Share2 className="w-5 h-5 text-pink-400" />,
        image: <Image className="w-5 h-5 text-indigo-400" />,
        sparkles: <Sparkles className="w-5 h-5 text-amber-400" />
    };

    const platformColors = {
        reddit: 'bg-orange-600',
        quora: 'bg-red-600',
        medium: 'bg-gray-600',
        youtube: 'bg-red-500',
        wikipedia: 'bg-gray-500',
        twitter: 'bg-blue-500',
        other: 'bg-gray-600'
    };

    useEffect(() => {
        fetchChecklist();
        fetchContent();
    }, []);

    const fetchChecklist = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/ai-optimization/checklist`);
            const data = await response.json();
            if (data.success) {
                setChecklist(data.checklist);
                setScore(data.score);
                setCompleted(data.completed);
                setTotal(data.total);
            }
        } catch (error) {
            console.error('Error fetching checklist:', error);
        }
        setLoading(false);
    };

    const fetchContent = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/ai-optimization/content`);
            const data = await response.json();
            if (data.success) {
                setContent(data.content);
            }
        } catch (error) {
            console.error('Error fetching content:', error);
        }
    };

    const toggleChecklistItem = async (itemId, currentStatus) => {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        
        // Optimistic update
        setChecklist(prev => prev.map(item => 
            item.id === itemId ? { ...item, status: newStatus } : item
        ));
        
        try {
            await fetch(`${API_BASE_URL}/api/admin/ai-optimization/checklist/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            fetchChecklist(); // Refresh to get accurate score
        } catch (error) {
            console.error('Error updating checklist:', error);
            fetchChecklist(); // Revert on error
        }
    };

    const addContent = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/ai-optimization/content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contentForm)
            });
            const data = await response.json();
            if (data.success) {
                setShowContentModal(false);
                setContentForm({ platform: 'reddit', url: '', title: '', mentionsBrand: true });
                fetchContent();
            }
        } catch (error) {
            console.error('Error adding content:', error);
        }
    };

    const deleteContent = async (contentId) => {
        if (!window.confirm('Delete this content entry?')) return;
        try {
            await fetch(`${API_BASE_URL}/api/admin/ai-optimization/content/${contentId}`, {
                method: 'DELETE'
            });
            fetchContent();
        } catch (error) {
            console.error('Error deleting content:', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-400';
            case 'in_progress': return 'text-yellow-400';
            default: return 'text-gray-500';
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'from-green-500 to-emerald-600';
        if (score >= 50) return 'from-yellow-500 to-amber-600';
        return 'from-red-500 to-rose-600';
    };

    const getCategoryLabel = (category) => {
        const labels = {
            registration: '🌐 Registration',
            submission: '📝 Submission',
            schema: '⚙️ Schema',
            crawler: '🤖 Crawler',
            content: '📢 Content',
            visual: '🖼️ Visual',
            advanced: '🚀 Advanced'
        };
        return labels[category] || category;
    };

    if (loading) {
        return (
            <div className="p-6 bg-gray-900 min-h-screen text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-900 min-h-screen text-white">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/admin/marketing')}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            🤖 AI Search Optimization Hub
                        </h1>
                        <p className="text-gray-400 text-sm">Optimize your site for AI-powered search engines</p>
                    </div>
                </div>
                <button
                    onClick={fetchChecklist}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Score Card */}
            <div className={`bg-gradient-to-r ${getScoreColor(score)} rounded-xl p-6 mb-6 shadow-lg`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg opacity-90">AI Optimization Score</h2>
                        <div className="text-6xl font-bold mt-2">
                            {score}%
                        </div>
                        <p className="text-sm opacity-80 mt-2">
                            {completed} of {total} tasks completed
                        </p>
                    </div>
                    <div className="text-right">
                        <TrendingUp className="w-20 h-20 opacity-30" />
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden">
                    <div 
                        className="bg-white rounded-full h-3 transition-all duration-700 ease-out"
                        style={{ width: `${score}%` }}
                    />
                </div>
            </div>

            {/* 10-Point Checklist */}
            <div className="bg-gray-800 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    📋 10-Point AI Optimization Checklist
                </h2>
                
                <div className="space-y-3">
                    {checklist.map((item) => (
                        <div 
                            key={item.id}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                                item.status === 'completed' 
                                    ? 'bg-green-900/20 border-green-700/50' 
                                    : item.status === 'in_progress'
                                    ? 'bg-yellow-900/20 border-yellow-700/50'
                                    : 'bg-gray-700/30 border-gray-600/50 hover:border-gray-500'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => toggleChecklistItem(item.id, item.status)}
                                    className={`${getStatusColor(item.status)} hover:scale-110 transition-transform`}
                                    disabled={item.status === 'in_progress'}
                                >
                                    {item.status === 'completed' 
                                        ? <CheckCircle className="w-7 h-7" />
                                        : <Circle className="w-7 h-7" />
                                    }
                                </button>
                                <div className="p-2.5 bg-gray-700/50 rounded-lg">
                                    {iconMap[item.icon]}
                                </div>
                                <div>
                                    <h3 className={`font-medium text-lg ${item.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                                        {item.id}. {item.title}
                                    </h3>
                                    <p className="text-sm text-gray-400">{item.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                    item.status === 'completed' ? 'bg-green-600/30 text-green-400 border border-green-600/50' :
                                    item.status === 'in_progress' ? 'bg-yellow-600/30 text-yellow-400 border border-yellow-600/50' : 
                                    'bg-gray-600/30 text-gray-400 border border-gray-600/50'
                                }`}>
                                    {item.status === 'in_progress' ? 'In Progress' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                </span>
                                {item.externalUrl && (
                                    <a
                                        href={item.externalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 hover:bg-gray-600 rounded-lg transition-colors text-teal-400"
                                        title="Open setup page"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Distribution */}
            <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            📢 Content Distribution Tracker
                        </h2>
                        <p className="text-gray-400 text-sm">Track content posted on platforms that AI models train on</p>
                    </div>
                    <button
                        onClick={() => setShowContentModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Content
                    </button>
                </div>

                {content.length === 0 ? (
                    <div className="text-center py-12 bg-gray-700/30 rounded-lg border border-dashed border-gray-600">
                        <Share2 className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-400">No content tracked yet.</p>
                        <p className="text-gray-500 text-sm">Add links to your Reddit, Quora, Medium posts that mention your brand.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {content.map((item) => (
                            <div key={item._id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                                <div className="flex items-center gap-4">
                                    <span className={`px-3 py-1 ${platformColors[item.platform] || platformColors.other} rounded-lg text-xs font-medium uppercase`}>
                                        {item.platform}
                                    </span>
                                    <div>
                                        <a 
                                            href={item.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-teal-400 hover:text-teal-300 hover:underline font-medium"
                                        >
                                            {item.title || 'View Link'}
                                        </a>
                                        <div className="flex items-center gap-3 mt-1">
                                            {item.mentionsBrand && (
                                                <span className="text-xs text-green-400 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> Brand mentioned
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-500">
                                                Added {new Date(item.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteContent(item._id)}
                                    className="p-2 hover:bg-gray-600 rounded-lg text-red-400 transition-colors"
                                    title="Delete entry"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Tips */}
            <div className="mt-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-700/30">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    💡 AI Search Optimization Tips
                </h3>
                <ul className="space-y-2 text-sm text-gray-300">
                    <li>• <strong>Bing is critical</strong> - ChatGPT uses Bing for web search results</li>
                    <li>• <strong>Schema markup</strong> helps AI understand your products and pricing</li>
                    <li>• <strong>Reddit/Quora content</strong> gets indexed by AI training datasets</li>
                    <li>• <strong>Don't block GPTBot</strong> in robots.txt if you want ChatGPT visibility</li>
                    <li>• <strong>Consistent NAP</strong> (Name, Address, Phone) across all platforms</li>
                </ul>
            </div>

            {/* Add Content Modal */}
            {showContentModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-teal-400" />
                            Add Content Link
                        </h2>
                        <form onSubmit={addContent} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Platform</label>
                                <select
                                    value={contentForm.platform}
                                    onChange={(e) => setContentForm({...contentForm, platform: e.target.value})}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white"
                                >
                                    {platforms.map(p => (
                                        <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">URL *</label>
                                <input
                                    type="url"
                                    value={contentForm.url}
                                    onChange={(e) => setContentForm({...contentForm, url: e.target.value})}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white"
                                    placeholder="https://reddit.com/r/dogs/..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Title/Description</label>
                                <input
                                    type="text"
                                    value={contentForm.title}
                                    onChange={(e) => setContentForm({...contentForm, title: e.target.value})}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white"
                                    placeholder="Discussion about dog treats"
                                />
                            </div>
                            <div className="flex items-center gap-3 py-2">
                                <input
                                    type="checkbox"
                                    id="mentionsBrand"
                                    checked={contentForm.mentionsBrand}
                                    onChange={(e) => setContentForm({...contentForm, mentionsBrand: e.target.checked})}
                                    className="w-5 h-5 rounded bg-gray-700 border-gray-600"
                                />
                                <label htmlFor="mentionsBrand" className="text-sm cursor-pointer">
                                    Mentions PetYupp brand
                                </label>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowContentModal(false)}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
                                >
                                    Add Content
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIOptimizationHub;
