import React, { useState, useEffect } from 'react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { API_BASE_URL } from '@/config/api';
import HubNavigation from '@/components/AIContentHub/HubNavigation';
import DashboardStepper from '@/components/AIContentHub/DashboardStepper';
import DashboardContentList from '@/components/AIContentHub/DashboardContentList';
import DashboardSidebar from '@/components/AIContentHub/DashboardSidebar';
import { Bot, AlertCircle, CheckCircle } from 'lucide-react';

const AIContentHubPage = () => {
    const { isDarkMode } = useAdminTheme();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [initialized, setInitialized] = useState(false);
    const [initializing, setInitializing] = useState(false);
    
    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-content-hub/stats`);
            const data = await response.json();
            if (data.status === 'success') {
                setStats(data.stats);
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
            setError('Failed to load stats');
        } finally {
            setLoading(false);
        }
    };
    
    const initializeHub = async () => {
        try {
            setInitializing(true);
            setError(null);
            const response = await fetch(`${API_BASE_URL}/api/ai-content-hub/initialize`, {
                method: 'POST'
            });
            const data = await response.json();
            if (data.status === 'success') {
                setInitialized(true);
                await fetchStats();
            }
        } catch (err) {
            console.error('Failed to initialize:', err);
            setError('Failed to initialize AI Content Hub');
        } finally {
            setInitializing(false);
        }
    };
    
    useEffect(() => {
        fetchStats();
    }, []);
    
    return (
        <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-2">
                    <h1 className={`text-2xl font-bold flex items-center gap-3 ${
                        isDarkMode ? 'text-slate-100' : 'text-gray-900'
                    }`}>
                        <Bot className="text-teal-500" size={28} />
                        AI Content Hub
                    </h1>
                    <button
                        onClick={initializeHub}
                        disabled={initializing}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            initializing 
                                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                : 'bg-teal-500 text-white hover:bg-teal-600'
                        }`}
                        data-testid="initialize-btn"
                    >
                        {initializing ? 'Initializing...' : 'Initialize Collections'}
                    </button>
                </div>
                
                <p className={`mb-4 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    AI-powered content generation, review, and posting pipeline for PetYupp
                </p>
                
                <HubNavigation activeTab="dashboard" />
                
                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 text-red-500 text-sm">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}
                
                {/* Success Message */}
                {initialized && (
                    <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-green-500/10 text-green-500 text-sm">
                        <CheckCircle size={18} />
                        AI Content Hub collections initialized successfully!
                    </div>
                )}
                
                {/* Dashboard Content */}
                {loading ? (
                    <div className={`text-center py-10 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        Loading...
                    </div>
                ) : (
                    <>
                        {/* Progress Stepper */}
                        <DashboardStepper stats={stats} />
                        
                        {/* Two Column Layout */}
                        <div 
                            className="grid gap-[10px]"
                            style={{ gridTemplateColumns: '1fr 280px' }}
                        >
                            {/* Left Column - Content List */}
                            <DashboardContentList />
                            
                            {/* Right Column - Sidebar */}
                            <DashboardSidebar stats={stats} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AIContentHubPage;
