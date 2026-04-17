import React, { useState, useEffect, useCallback } from 'react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { API_BASE_URL } from '@/config/api';
import { toast } from 'sonner';
import { 
    Bot, Plus, Edit3, MessageSquare, Power, X, Save, 
    RefreshCw, Tag, Cpu, FileText, Zap, List, ChevronDown, ChevronUp
} from 'lucide-react';

// Color mapping for agent avatars
const AVATAR_COLORS = {
    scout: 'bg-teal-500',
    maya: 'bg-purple-500',
    blog: 'bg-amber-500',
    reddit: 'bg-blue-500'
};

const getAvatarColor = (alias) => {
    return AVATAR_COLORS[alias] || 'bg-slate-500';
};

const getInitials = (name) => {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
};

// Format timestamp for display
const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
        return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + 
           date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

// Status pill component
const StatusPill = ({ status }) => {
    const styles = {
        ok: 'bg-[#14532D] text-[#4ADE80]',
        failed: 'bg-[#450A0A] text-[#FCA5A5]',
        partial: 'bg-[#431407] text-[#FDBA74]'
    };
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${styles[status] || styles.ok}`}>
            {status}
        </span>
    );
};

// Log entry component
const LogEntry = ({ log, isDarkMode }) => {
    const [expanded, setExpanded] = useState(false);
    
    const description = log.image_description_raw 
        ? (log.image_description_raw.length > 80 
            ? log.image_description_raw.substring(0, 80) + '...' 
            : log.image_description_raw)
        : `${log.command} — ${log.status}`;
    
    return (
        <div 
            className="cursor-pointer"
            onClick={() => setExpanded(!expanded)}
        >
            <div className="flex items-center justify-between py-2 px-3 hover:bg-[#0F1D32] rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                    <code className="text-[11px] font-mono text-[#38BDF8] bg-[#0B1628] px-2 py-0.5 rounded">
                        {log.command.length > 25 ? log.command.substring(0, 25) + '...' : log.command}
                    </code>
                    <StatusPill status={log.status} />
                </div>
                <span className="text-[10px] text-[#64748B]">
                    {formatTimestamp(log.timestamp)}
                </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] px-3 pb-2 truncate">
                {description}
            </p>
            
            {/* Expanded debug block */}
            {expanded && log.full_debug_block && (
                <div className="mx-3 mb-3 p-3 rounded-lg bg-[#071220] font-mono text-[10px] whitespace-pre-wrap">
                    {log.full_debug_block.split('\n').map((line, i) => {
                        if (line.includes('=== DEBUG LOG ===') || line.includes('=== END DEBUG LOG ===')) {
                            return <div key={i} className="text-[#4ADE80]">{line}</div>;
                        }
                        const colonIndex = line.indexOf(':');
                        if (colonIndex > 0) {
                            const key = line.substring(0, colonIndex + 1);
                            const value = line.substring(colonIndex + 1);
                            return (
                                <div key={i}>
                                    <span className="text-[#38BDF8]">{key}</span>
                                    <span className="text-[#94A3B8]">{value}</span>
                                </div>
                            );
                        }
                        return <div key={i} className="text-[#94A3B8]">{line}</div>;
                    })}
                </div>
            )}
            {expanded && !log.full_debug_block && (
                <div className="mx-3 mb-3 p-3 rounded-lg bg-[#071220] text-[11px] text-[#64748B]">
                    No debug block available (MODE 1 or /run command)
                </div>
            )}
        </div>
    );
};

// Log panel component
const LogPanel = ({ alias, isDarkMode, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [skip, setSkip] = useState(0);
    const limit = 20;
    
    const fetchLogs = useCallback(async (filterVal, skipVal = 0) => {
        try {
            setLoading(true);
            let url = `${API_BASE_URL}/api/ai-agents/${alias}/logs?limit=${limit}&skip=${skipVal}`;
            if (filterVal && filterVal !== 'all') {
                url += `&command_filter=${filterVal}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            
            if (skipVal === 0) {
                setLogs(data.logs || []);
            } else {
                setLogs(prev => [...prev, ...(data.logs || [])]);
            }
            setTotal(data.total || 0);
            setSkip(skipVal);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    }, [alias]);
    
    useEffect(() => {
        fetchLogs(filter, 0);
    }, [fetchLogs, filter]);
    
    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setSkip(0);
    };
    
    const handleLoadMore = () => {
        fetchLogs(filter, skip + limit);
    };
    
    const filters = [
        { key: 'all', label: 'All' },
        { key: 'meme', label: '/meme' },
        { key: 'image', label: 'image' },
        { key: 'failed', label: 'failed' }
    ];
    
    return (
        <div className="bg-[#0B1628] border-t border-[#1E293B] rounded-b-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E293B]">
                <span className="text-xs font-medium text-[#94A3B8]">Invocation logs</span>
                <div className="flex gap-1">
                    {filters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => handleFilterChange(f.key)}
                            className={`text-[10px] px-2 py-1 rounded-lg transition-colors ${
                                filter === f.key 
                                    ? 'bg-[#1E4D6B] text-[#38BDF8]' 
                                    : 'text-[#64748B] hover:bg-[#1C3A50]'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Log list */}
            <div className="max-h-[400px] overflow-y-auto">
                {loading && logs.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-[#64748B] text-xs">
                        <RefreshCw size={14} className="animate-spin mr-2" />
                        Loading...
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-8 text-[#64748B] text-xs">
                        No logs yet — trigger a /meme command in Telegram to see logs here
                    </div>
                ) : (
                    <div className="divide-y divide-[#1E293B]">
                        {logs.map((log, i) => (
                            <LogEntry key={log._id || i} log={log} isDarkMode={isDarkMode} />
                        ))}
                    </div>
                )}
            </div>
            
            {/* Load more */}
            {logs.length < total && (
                <div className="p-3 border-t border-[#1E293B]">
                    <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="w-full py-2 text-[11px] text-[#38BDF8] hover:bg-[#1C3A50] rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : `Load older logs (${total - logs.length} more)`}
                    </button>
                </div>
            )}
        </div>
    );
};

const AIAgentsTab = () => {
    const { isDarkMode } = useAdminTheme();
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [editPrompt, setEditPrompt] = useState('');
    const [saving, setSaving] = useState(false);
    const [expandedLogs, setExpandedLogs] = useState({});  // Track which agent logs are expanded
    const [logCounts, setLogCounts] = useState({});  // Track log counts per agent
    
    // Create form state
    const [createForm, setCreateForm] = useState({
        alias: '',
        name: '',
        description: '',
        system_prompt: '',
        used_by: '',
        output_format: 'text',
        status: 'active'
    });

    const fetchAgents = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/ai-agents`);
            const data = await response.json();
            setAgents(data);
            
            // Fetch log counts for each agent
            const counts = {};
            for (const agent of data) {
                try {
                    const logRes = await fetch(`${API_BASE_URL}/api/ai-agents/${agent.alias}/logs?limit=1`);
                    const logData = await logRes.json();
                    counts[agent.alias] = logData.total || 0;
                } catch (e) {
                    counts[agent.alias] = 0;
                }
            }
            setLogCounts(counts);
        } catch (error) {
            console.error('Failed to fetch agents:', error);
            toast.error('Failed to load agents');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    const handleEditPrompt = (agent) => {
        setSelectedAgent(agent);
        setEditPrompt(agent.system_prompt || '');
        setEditModalOpen(true);
    };

    const handleSavePrompt = async () => {
        if (!selectedAgent) return;
        
        try {
            setSaving(true);
            const response = await fetch(`${API_BASE_URL}/api/ai-agents/${selectedAgent.alias}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ system_prompt: editPrompt })
            });
            
            if (!response.ok) throw new Error('Failed to save');
            
            toast.success(`Updated ${selectedAgent.name} prompt`);
            setEditModalOpen(false);
            setSelectedAgent(null);
            fetchAgents();
        } catch (error) {
            console.error('Failed to save prompt:', error);
            toast.error('Failed to save prompt');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (agent) => {
        const newStatus = agent.status === 'active' ? 'inactive' : 'active';
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-agents/${agent.alias}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (!response.ok) throw new Error('Failed to update status');
            
            toast.success(`${agent.name} is now ${newStatus}`);
            fetchAgents();
        } catch (error) {
            console.error('Failed to toggle status:', error);
            toast.error('Failed to update status');
        }
    };

    const handleTestTelegram = () => {
        toast.info('Telegram testing coming soon!');
    };

    const handleCreateAgent = async () => {
        if (!createForm.alias || !createForm.name) {
            toast.error('Alias and name are required');
            return;
        }
        
        try {
            setSaving(true);
            const payload = {
                ...createForm,
                used_by: createForm.used_by.split(',').map(s => s.trim()).filter(Boolean)
            };
            
            const response = await fetch(`${API_BASE_URL}/api/ai-agents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to create agent');
            }
            
            toast.success(`Created agent: ${createForm.name}`);
            setCreateModalOpen(false);
            setCreateForm({
                alias: '',
                name: '',
                description: '',
                system_prompt: '',
                used_by: '',
                output_format: 'text',
                status: 'active'
            });
            fetchAgents();
        } catch (error) {
            console.error('Failed to create agent:', error);
            toast.error(error.message || 'Failed to create agent');
        } finally {
            setSaving(false);
        }
    };

    const toggleLogPanel = (alias) => {
        setExpandedLogs(prev => ({
            ...prev,
            [alias]: !prev[alias]
        }));
    };

    const activeAgents = agents.filter(a => a.status === 'active');
    const inactiveAgents = agents.filter(a => a.status === 'inactive');

    const AgentCard = ({ agent, isActive }) => {
        const isLogExpanded = expandedLogs[agent.alias];
        const logCount = logCounts[agent.alias] || 0;
        
        return (
            <div 
                className={`relative rounded-2xl transition-all ${
                    isDarkMode ? 'bg-slate-800' : 'bg-white'
                } ${isActive ? 'border-l-[3px] border-teal-500' : 'opacity-70'} ${
                    isLogExpanded ? 'border border-[#14B8A6]' : ''
                }`}
                data-testid={`agent-card-${agent.alias}`}
            >
                <div className="p-5">
                    <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-xl ${getAvatarColor(agent.alias)} flex items-center justify-center text-white font-semibold text-sm`}>
                            {getInitials(agent.name)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {agent.name}
                                </h3>
                                <code className={`text-xs px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                                    {agent.alias}
                                </code>
                                <button
                                    onClick={() => handleToggleStatus(agent)}
                                    className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer transition-colors ${
                                        isActive 
                                            ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30' 
                                            : 'bg-slate-600/50 text-slate-400 hover:bg-slate-600'
                                    }`}
                                    data-testid={`agent-status-${agent.alias}`}
                                >
                                    {isActive ? 'Active' : 'Inactive'}
                                </button>
                            </div>
                            
                            {/* Description */}
                            <p className={`text-xs mb-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                {agent.description}
                            </p>
                            
                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded ${
                                    isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    <MessageSquare size={10} />
                                    /{agent.alias}
                                </span>
                                {agent.used_by?.map(feature => (
                                    <span key={feature} className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded ${
                                        isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        <Tag size={10} />
                                        {feature}
                                    </span>
                                ))}
                                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded ${
                                    isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
                                }`}>
                                    <FileText size={10} />
                                    {agent.output_format}
                                </span>
                                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded ${
                                    isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'
                                }`}>
                                    <Cpu size={10} />
                                    {agent.model?.split('-').slice(0, 2).join('-') || 'claude'}
                                </span>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEditPrompt(agent)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-teal-500 text-white hover:bg-teal-600 transition-colors"
                                    data-testid={`edit-prompt-${agent.alias}`}
                                >
                                    <Edit3 size={12} />
                                    Edit prompt
                                </button>
                                <button
                                    onClick={handleTestTelegram}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
                                        isDarkMode 
                                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <MessageSquare size={12} />
                                    Test in Telegram
                                </button>
                                <button
                                    onClick={() => toggleLogPanel(agent.alias)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-colors border ${
                                        isLogExpanded
                                            ? 'bg-[#1C3A50] border-[#14B8A6] text-[#38BDF8]'
                                            : 'bg-[#1C3A50] border-[#1E4D6B] text-[#38BDF8] hover:bg-[#234563]'
                                    }`}
                                    data-testid={`view-logs-${agent.alias}`}
                                >
                                    <List size={12} />
                                    {isLogExpanded ? 'Hide Logs' : 'View Logs'}
                                    {logCount > 0 && !isLogExpanded && (
                                        <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-[#38BDF8]/20 text-[#38BDF8] rounded-full">
                                            {logCount}
                                        </span>
                                    )}
                                    {isLogExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>
                                {!isActive && (
                                    <button
                                        onClick={() => handleToggleStatus(agent)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                    >
                                        <Power size={12} />
                                        Activate
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Log Panel */}
                {isLogExpanded && (
                    <LogPanel 
                        alias={agent.alias} 
                        isDarkMode={isDarkMode}
                        onClose={() => toggleLogPanel(agent.alias)}
                    />
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className={`flex items-center justify-center py-20 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                <RefreshCw className="animate-spin mr-2" size={20} />
                Loading agents...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        AI Agents
                    </h2>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        Named Claude agents with editable prompts. Changes apply instantly without code deploys.
                    </p>
                </div>
                <button
                    onClick={() => setCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-teal-500 text-white hover:bg-teal-600 transition-colors"
                    data-testid="new-agent-btn"
                >
                    <Plus size={16} />
                    New Agent
                </button>
            </div>

            {/* Active Agents */}
            {activeAgents.length > 0 && (
                <div>
                    <h3 className={`text-sm font-medium mb-3 flex items-center gap-2 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                        <Zap size={14} />
                        Active Agents ({activeAgents.length})
                    </h3>
                    <div className="space-y-3">
                        {activeAgents.map(agent => (
                            <AgentCard key={agent.alias} agent={agent} isActive={true} />
                        ))}
                    </div>
                </div>
            )}

            {/* Inactive Agents */}
            {inactiveAgents.length > 0 && (
                <div>
                    <h3 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                        Inactive Agents ({inactiveAgents.length})
                    </h3>
                    <div className="space-y-3">
                        {inactiveAgents.map(agent => (
                            <AgentCard key={agent.alias} agent={agent} isActive={false} />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {agents.length === 0 && (
                <div className={`text-center py-12 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    <Bot size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No agents configured yet.</p>
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="mt-4 px-4 py-2 text-sm font-medium rounded-xl bg-teal-500 text-white hover:bg-teal-600"
                    >
                        Create First Agent
                    </button>
                </div>
            )}

            {/* Edit Prompt Modal */}
            {editModalOpen && selectedAgent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className={`w-full max-w-3xl mx-4 rounded-2xl shadow-2xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl ${getAvatarColor(selectedAgent.alias)} flex items-center justify-center text-white font-semibold text-sm`}>
                                    {getInitials(selectedAgent.name)}
                                </div>
                                <div>
                                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Edit {selectedAgent.name} Prompt
                                    </h3>
                                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                        /{selectedAgent.alias} • {selectedAgent.output_format} output
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditModalOpen(false)}
                                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                            >
                                <X size={20} className={isDarkMode ? 'text-slate-400' : 'text-gray-500'} />
                            </button>
                        </div>
                        
                        <div className="p-4">
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                System Prompt
                            </label>
                            <textarea
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                rows={12}
                                className={`w-full px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                                    isDarkMode 
                                        ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' 
                                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                                }`}
                                placeholder="Enter the system prompt for this agent..."
                                data-testid="edit-prompt-textarea"
                            />
                        </div>
                        
                        <div className={`flex justify-end gap-3 p-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                            <button
                                onClick={() => setEditModalOpen(false)}
                                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                                    isDarkMode 
                                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSavePrompt}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 transition-colors"
                                data-testid="save-prompt-btn"
                            >
                                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                {saving ? 'Saving...' : 'Save Prompt'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Agent Modal */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className={`w-full max-w-2xl mx-4 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Create New Agent
                            </h3>
                            <button
                                onClick={() => setCreateModalOpen(false)}
                                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                            >
                                <X size={20} className={isDarkMode ? 'text-slate-400' : 'text-gray-500'} />
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                        Alias *
                                    </label>
                                    <input
                                        type="text"
                                        value={createForm.alias}
                                        onChange={(e) => setCreateForm({...createForm, alias: e.target.value.toLowerCase().replace(/\s/g, '_')})}
                                        className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                                            isDarkMode 
                                                ? 'bg-slate-900 border-slate-600 text-white' 
                                                : 'bg-gray-50 border-gray-200 text-gray-900'
                                        }`}
                                        placeholder="e.g., scout"
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={createForm.name}
                                        onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                                        className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                                            isDarkMode 
                                                ? 'bg-slate-900 border-slate-600 text-white' 
                                                : 'bg-gray-50 border-gray-200 text-gray-900'
                                        }`}
                                        placeholder="e.g., Content Writer"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={createForm.description}
                                    onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                                        isDarkMode 
                                            ? 'bg-slate-900 border-slate-600 text-white' 
                                            : 'bg-gray-50 border-gray-200 text-gray-900'
                                    }`}
                                    placeholder="What does this agent do?"
                                />
                            </div>
                            
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                    System Prompt
                                </label>
                                <textarea
                                    value={createForm.system_prompt}
                                    onChange={(e) => setCreateForm({...createForm, system_prompt: e.target.value})}
                                    rows={8}
                                    className={`w-full px-3 py-2 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                                        isDarkMode 
                                            ? 'bg-slate-900 border-slate-600 text-white' 
                                            : 'bg-gray-50 border-gray-200 text-gray-900'
                                    }`}
                                    placeholder="Enter the Claude system prompt..."
                                />
                            </div>
                            
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                    Used By (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={createForm.used_by}
                                    onChange={(e) => setCreateForm({...createForm, used_by: e.target.value})}
                                    className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                                        isDarkMode 
                                            ? 'bg-slate-900 border-slate-600 text-white' 
                                            : 'bg-gray-50 border-gray-200 text-gray-900'
                                    }`}
                                    placeholder="e.g., trend_scout, ai_content_hub"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                        Output Format
                                    </label>
                                    <select
                                        value={createForm.output_format}
                                        onChange={(e) => setCreateForm({...createForm, output_format: e.target.value})}
                                        className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                                            isDarkMode 
                                                ? 'bg-slate-900 border-slate-600 text-white' 
                                                : 'bg-gray-50 border-gray-200 text-gray-900'
                                        }`}
                                    >
                                        <option value="text">text</option>
                                        <option value="json">json</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                        Status
                                    </label>
                                    <select
                                        value={createForm.status}
                                        onChange={(e) => setCreateForm({...createForm, status: e.target.value})}
                                        className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                                            isDarkMode 
                                                ? 'bg-slate-900 border-slate-600 text-white' 
                                                : 'bg-gray-50 border-gray-200 text-gray-900'
                                        }`}
                                    >
                                        <option value="active">active</option>
                                        <option value="inactive">inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div className={`flex justify-end gap-3 p-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                            <button
                                onClick={() => setCreateModalOpen(false)}
                                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                                    isDarkMode 
                                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateAgent}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 transition-colors"
                            >
                                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                                {saving ? 'Creating...' : 'Create Agent'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIAgentsTab;
