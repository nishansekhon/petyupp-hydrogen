import React from 'react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import HubNavigation from '@/components/AIContentHub/HubNavigation';
import AIAgentsTab from './AIAgentsTab';
import { Bot } from 'lucide-react';

const AIAgentsPage = () => {
    const { isDarkMode } = useAdminTheme();
    
    return (
        <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-2">
                    <h1 className={`text-2xl font-bold flex items-center gap-3 ${
                        isDarkMode ? 'text-slate-100' : 'text-gray-900'
                    }`}>
                        <Bot className="text-teal-500" size={28} />
                        AI Content Hub
                    </h1>
                </div>
                
                <p className={`mb-4 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    AI-powered content generation, review, and posting pipeline for PetYupp
                </p>
                
                <HubNavigation activeTab="agents" />
                
                {/* Agents Content */}
                <AIAgentsTab />
            </div>
        </div>
    );
};

export default AIAgentsPage;
