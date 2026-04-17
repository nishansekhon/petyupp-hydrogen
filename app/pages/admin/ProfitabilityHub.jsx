import React, { useState } from 'react';
import { TrendingUp, Package, Receipt, Settings } from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

// Tab components (will be created in Phase 3-6)
import OverviewTab from '@/components/admin/profitability/OverviewTab';
import InventoryTab from '@/components/admin/profitability/InventoryTab';
import ExpensesTab from '@/components/admin/profitability/ExpensesTab';
import SettingsTab from '@/components/admin/profitability/SettingsTab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'settings', label: 'Settings', icon: Settings }
];

const ProfitabilityHub = () => {
  const { isDarkMode } = useAdminTheme();
  const [activeTab, setActiveTab] = useState('overview');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'inventory':
        return <InventoryTab />;
      case 'expenses':
        return <ExpensesTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Profitability Hub
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Track P&L, manage inventory costs, and analyze break-even
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Pills Style */}
        <div className={`flex gap-1 p-1 rounded-lg mb-6 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? isDarkMode 
                      ? 'bg-teal-500/20 text-teal-400' 
                      : 'bg-teal-500 text-white'
                    : isDarkMode
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ProfitabilityHub;
