import React, { useState, useEffect } from 'react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { API_BASE_URL } from '@/config/api';
import HubNavigation from '@/components/AIContentHub/HubNavigation';
import { Calendar, Plus, Trash2, AlertCircle } from 'lucide-react';

const ContentCalendarPage = () => {
    const { isDarkMode } = useAdminTheme();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [error, setError] = useState(null);
    const [newEntry, setNewEntry] = useState({
        date: new Date().toISOString().split('T')[0],
        day_number: 1,
        theme: '',
        content_type: 'educational',
        platform: 'twitter',
        hook_style: '',
        cta: '',
        hashtags: '',
        notes: ''
    });
    
    const fetchEntries = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/ai-content-hub/calendar`);
            const data = await response.json();
            if (data.status === 'success') {
                setEntries(data.entries);
            }
        } catch (err) {
            console.error('Failed to fetch calendar:', err);
            setError('Failed to load calendar entries');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchEntries();
    }, []);
    
    const handleAddEntry = async () => {
        try {
            setError(null);
            const payload = {
                ...newEntry,
                date: new Date(newEntry.date).toISOString(),
                hashtags: newEntry.hashtags.split(',').map(h => h.trim()).filter(h => h)
            };
            
            const response = await fetch(`${API_BASE_URL}/api/ai-content-hub/calendar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            if (data.status === 'success') {
                setShowAddModal(false);
                setNewEntry({
                    date: new Date().toISOString().split('T')[0],
                    day_number: entries.length + 2,
                    theme: '',
                    content_type: 'educational',
                    platform: 'twitter',
                    hook_style: '',
                    cta: '',
                    hashtags: '',
                    notes: ''
                });
                fetchEntries();
            } else {
                setError(data.detail || 'Failed to add entry');
            }
        } catch (err) {
            console.error('Failed to add entry:', err);
            setError('Failed to add entry');
        }
    };
    
    const handleDeleteEntry = async (entryId) => {
        if (!window.confirm('Delete this calendar entry?')) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-content-hub/calendar/${entryId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.status === 'success') {
                fetchEntries();
            }
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };
    
    const contentTypeColors = {
        educational: '#3b82f6',
        behind_scenes: '#8b5cf6',
        ugc: '#ec4899',
        viral: '#f59e0b',
        promo: '#10b981',
        engagement: '#06b6d4'
    };
    
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    };
    
    return (
        <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-2">
                    <h1 className={`text-2xl font-bold flex items-center gap-3 ${
                        isDarkMode ? 'text-slate-100' : 'text-gray-900'
                    }`}>
                        <Calendar className="text-blue-500" size={28} />
                        Content Calendar
                    </h1>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-teal-500 text-white hover:bg-teal-600 transition-all"
                        data-testid="add-entry-btn"
                    >
                        <Plus size={18} />
                        Add Entry
                    </button>
                </div>
                
                <p className={`mb-4 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    Plan and manage your 30-day content calendar
                </p>
                
                <HubNavigation activeTab="calendar" />
                
                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 text-red-500 text-sm">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}
                
                {/* Content */}
                {loading ? (
                    <div className={`text-center py-10 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        Loading calendar...
                    </div>
                ) : entries.length === 0 ? (
                    <div className={`text-center py-16 rounded-lg shadow-sm ${
                        isDarkMode ? 'bg-slate-800' : 'bg-white'
                    }`}>
                        <Calendar size={48} className={`mx-auto mb-4 ${
                            isDarkMode ? 'text-slate-600' : 'text-gray-300'
                        }`} />
                        <div className={`text-lg mb-2 ${
                            isDarkMode ? 'text-slate-300' : 'text-gray-700'
                        }`}>
                            No calendar entries yet
                        </div>
                        <div className={`text-sm mb-5 ${
                            isDarkMode ? 'text-slate-500' : 'text-gray-500'
                        }`}>
                            Start by adding your content plan for the month
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-5 py-2 rounded-lg text-sm font-medium bg-teal-500 text-white hover:bg-teal-600 transition-all"
                        >
                            Add First Entry
                        </button>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {entries.map(entry => (
                            <div
                                key={entry._id}
                                className={`rounded-lg shadow-sm flex items-center gap-3 ${
                                    isDarkMode ? 'bg-slate-800' : 'bg-white'
                                }`}
                                style={{ 
                                    padding: '10px 14px',
                                    borderLeft: `4px solid ${contentTypeColors[entry.content_type] || '#6b7280'}` 
                                }}
                                data-testid={`calendar-entry-${entry._id}`}
                            >
                                <div style={{ minWidth: '70px' }} className="text-center">
                                    <div className={`uppercase ${
                                        isDarkMode ? 'text-slate-500' : 'text-gray-400'
                                    }`} style={{ fontSize: '9px' }}>
                                        Day {entry.day_number}
                                    </div>
                                    <div className={`font-semibold ${
                                        isDarkMode ? 'text-slate-200' : 'text-gray-800'
                                    }`} style={{ fontSize: '12px' }}>
                                        {formatDate(entry.date)}
                                    </div>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className={`font-medium truncate ${
                                        isDarkMode ? 'text-slate-200' : 'text-gray-800'
                                    }`} style={{ fontSize: '13px' }}>
                                        {entry.theme}
                                    </div>
                                    <div className="flex gap-1 flex-wrap" style={{ marginTop: '3px' }}>
                                        <span 
                                            className="rounded text-white"
                                            style={{ 
                                                padding: '1px 6px',
                                                fontSize: '11px',
                                                backgroundColor: contentTypeColors[entry.content_type] || '#6b7280' 
                                            }}
                                        >
                                            {entry.content_type}
                                        </span>
                                        <span className={`rounded ${
                                            isDarkMode 
                                                ? 'bg-slate-700 text-slate-300' 
                                                : 'bg-gray-100 text-gray-600'
                                        }`} style={{ padding: '1px 6px', fontSize: '11px' }}>
                                            {entry.platform}
                                        </span>
                                        {entry.hook_style && (
                                            <span className={`rounded ${
                                                isDarkMode 
                                                    ? 'bg-slate-700 text-slate-400' 
                                                    : 'bg-gray-50 text-gray-500'
                                            }`} style={{ padding: '1px 6px', fontSize: '11px' }}>
                                                Hook: {entry.hook_style}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <button
                                    onClick={() => handleDeleteEntry(entry._id)}
                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                                    data-testid={`delete-entry-${entry._id}`}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Add Entry Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className={`rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto ${
                            isDarkMode ? 'bg-slate-800' : 'bg-white'
                        }`} style={{ padding: '16px' }}>
                            <h2 className={`font-semibold mb-4 ${
                                isDarkMode ? 'text-slate-100' : 'text-gray-900'
                            }`} style={{ fontSize: '18px' }}>
                                Add Calendar Entry
                            </h2>
                            
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className={`block mb-1 ${
                                            isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                        }`} style={{ fontSize: '12px' }}>Date</label>
                                        <input
                                            type="date"
                                            value={newEntry.date}
                                            onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                                            className={`w-full rounded-lg border ${
                                                isDarkMode 
                                                    ? 'bg-slate-700 border-slate-600 text-slate-100' 
                                                    : 'bg-white border-gray-200 text-gray-900'
                                            }`}
                                            style={{ padding: '8px 10px', fontSize: '13px' }}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block mb-1 ${
                                            isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                        }`} style={{ fontSize: '12px' }}>Day Number</label>
                                        <input
                                            type="number"
                                            value={newEntry.day_number}
                                            onChange={(e) => setNewEntry({...newEntry, day_number: parseInt(e.target.value)})}
                                            className={`w-full rounded-lg border ${
                                                isDarkMode 
                                                    ? 'bg-slate-700 border-slate-600 text-slate-100' 
                                                    : 'bg-white border-gray-200 text-gray-900'
                                            }`}
                                            style={{ padding: '8px 10px', fontSize: '13px' }}
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className={`block mb-1 ${
                                        isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                    }`} style={{ fontSize: '12px' }}>Theme / Topic</label>
                                    <input
                                        type="text"
                                        value={newEntry.theme}
                                        onChange={(e) => setNewEntry({...newEntry, theme: e.target.value})}
                                        placeholder="e.g., Benefits of protein-rich treats"
                                        className={`w-full rounded-lg border ${
                                            isDarkMode 
                                                ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400' 
                                                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                        }`}
                                        style={{ padding: '8px 10px', fontSize: '13px' }}
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className={`block mb-1 ${
                                            isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                        }`} style={{ fontSize: '12px' }}>Content Type</label>
                                        <select
                                            value={newEntry.content_type}
                                            onChange={(e) => setNewEntry({...newEntry, content_type: e.target.value})}
                                            className={`w-full rounded-lg border ${
                                                isDarkMode 
                                                    ? 'bg-slate-700 border-slate-600 text-slate-100' 
                                                    : 'bg-white border-gray-200 text-gray-900'
                                            }`}
                                            style={{ padding: '8px 10px', fontSize: '13px' }}
                                        >
                                            <option value="educational">Educational</option>
                                            <option value="behind_scenes">Behind the Scenes</option>
                                            <option value="ugc">UGC / User Content</option>
                                            <option value="viral">Viral / Meme</option>
                                            <option value="promo">Promotional</option>
                                            <option value="engagement">Engagement</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`block mb-1 ${
                                            isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                        }`} style={{ fontSize: '12px' }}>Platform</label>
                                        <select
                                            value={newEntry.platform}
                                            onChange={(e) => setNewEntry({...newEntry, platform: e.target.value})}
                                            className={`w-full rounded-lg border ${
                                                isDarkMode 
                                                    ? 'bg-slate-700 border-slate-600 text-slate-100' 
                                                    : 'bg-white border-gray-200 text-gray-900'
                                            }`}
                                            style={{ padding: '8px 10px', fontSize: '13px' }}
                                        >
                                            <option value="twitter">Twitter</option>
                                            <option value="instagram">Instagram</option>
                                            <option value="both">Both</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className={`block mb-1 ${
                                        isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                    }`} style={{ fontSize: '12px' }}>Hook Style</label>
                                    <input
                                        type="text"
                                        value={newEntry.hook_style}
                                        onChange={(e) => setNewEntry({...newEntry, hook_style: e.target.value})}
                                        placeholder="e.g., question, statistic, story"
                                        className={`w-full rounded-lg border ${
                                            isDarkMode 
                                                ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400' 
                                                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                        }`}
                                        style={{ padding: '8px 10px', fontSize: '13px' }}
                                    />
                                </div>
                                
                                <div>
                                    <label className={`block mb-1 ${
                                        isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                    }`} style={{ fontSize: '12px' }}>CTA (Call to Action)</label>
                                    <input
                                        type="text"
                                        value={newEntry.cta}
                                        onChange={(e) => setNewEntry({...newEntry, cta: e.target.value})}
                                        placeholder="e.g., Shop now at petyupp.com"
                                        className={`w-full rounded-lg border ${
                                            isDarkMode 
                                                ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400' 
                                                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                        }`}
                                        style={{ padding: '8px 10px', fontSize: '13px' }}
                                    />
                                </div>
                                
                                <div>
                                    <label className={`block mb-1 ${
                                        isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                    }`} style={{ fontSize: '12px' }}>Hashtags (comma separated)</label>
                                    <input
                                        type="text"
                                        value={newEntry.hashtags}
                                        onChange={(e) => setNewEntry({...newEntry, hashtags: e.target.value})}
                                        placeholder="#PetYupp, #DogTreats, #PetCare"
                                        className={`w-full rounded-lg border ${
                                            isDarkMode 
                                                ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400' 
                                                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                        }`}
                                        style={{ padding: '8px 10px', fontSize: '13px' }}
                                    />
                                </div>
                                
                                <div>
                                    <label className={`block mb-1 ${
                                        isDarkMode ? 'text-slate-300' : 'text-gray-700'
                                    }`} style={{ fontSize: '12px' }}>Notes</label>
                                    <textarea
                                        value={newEntry.notes}
                                        onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                                        placeholder="Additional notes for content creation..."
                                        rows={2}
                                        className={`w-full rounded-lg border resize-none ${
                                            isDarkMode 
                                                ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400' 
                                                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                        }`}
                                        style={{ padding: '8px 10px', fontSize: '13px' }}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex gap-2 mt-4 justify-end">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className={`rounded-lg font-medium ${
                                        isDarkMode 
                                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                    style={{ padding: '8px 16px', fontSize: '13px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddEntry}
                                    disabled={!newEntry.theme}
                                    className={`rounded-lg font-medium ${
                                        newEntry.theme 
                                            ? 'bg-teal-500 text-white hover:bg-teal-600' 
                                            : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                    }`}
                                    style={{ padding: '8px 16px', fontSize: '13px' }}
                                    data-testid="submit-entry-btn"
                                >
                                    Add Entry
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContentCalendarPage;
