import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';
import { Settings, Save, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { toast } from 'react-toastify';

const API_URL = API_BASE_URL + '/api';

const SettingsTab = () => {
  const { isDarkMode } = useAdminTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    default_cogs_percentage: 48
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/profitability/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    if (settings.default_cogs_percentage < 0 || settings.default_cogs_percentage > 100) {
      toast.error('COGS percentage must be between 0 and 100');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/profitability/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Settings saved successfully');
      } else {
        toast.error(data.detail || 'Failed to save settings');
      }
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <div className={`rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
        {/* Header */}
        <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Settings className="text-teal-500" size={18} />
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Profitability Settings
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5">
          {/* Default COGS Percentage */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Default COGS Percentage
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={settings.default_cogs_percentage}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  default_cogs_percentage: parseFloat(e.target.value) || 0 
                })}
                className={`w-32 px-3 py-2 rounded-lg text-sm border focus:ring-1 focus:ring-teal-500 ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <span className={`text-lg ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>%</span>
            </div>
            <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              <Info size={12} className="inline mr-1" />
              Used when product-level cost is not available. This is your average cost of goods as percentage of selling price.
            </p>
            
            {/* Example calculation */}
            <div className={`mt-3 rounded-lg p-3 ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
              <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                Example Calculation:
              </p>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                If you sell a product for ₹100, with {settings.default_cogs_percentage}% COGS:
              </p>
              <ul className={`text-xs mt-1 space-y-0.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                <li>• Cost of Goods: ₹{settings.default_cogs_percentage.toFixed(0)}</li>
                <li>• Gross Profit: ₹{(100 - settings.default_cogs_percentage).toFixed(0)}</li>
                <li>• Gross Margin: {(100 - settings.default_cogs_percentage).toFixed(0)}%</li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}></div>

          {/* Currency Display */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Currency Display
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value="INR (₹)"
                readOnly
                className={`w-32 px-3 py-2 rounded-lg text-sm border cursor-not-allowed ${
                  isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-400' : 'bg-gray-100 border-gray-300 text-gray-500'
                }`}
              />
            </div>
            <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
              Contact support to change currency
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-4 py-3 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Save size={16} />
            )}
            Save Settings
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className={`mt-4 rounded-lg p-4 ${isDarkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-blue-50 border border-blue-100'}`}>
        <div className="flex gap-3">
          <AlertCircle className={`w-5 h-5 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
          <div>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              About COGS Percentage
            </p>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              COGS (Cost of Goods Sold) represents the direct costs of producing your products. 
              This includes raw materials, manufacturing costs, and packaging. 
              A typical pet treat brand has COGS between 40-55%. 
              Set this accurately for reliable profit calculations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
