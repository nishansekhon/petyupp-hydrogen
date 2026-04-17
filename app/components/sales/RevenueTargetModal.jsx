import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { X, Target, IndianRupee, TrendingUp, Save } from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

const API_URL = API_BASE_URL + '/api';

const RevenueTargetModal = ({ isOpen, onClose, weekInfo, onSave }) => {
  const { isDarkMode } = useAdminTheme();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [targets, setTargets] = useState({
    ecommerce_target: 0,
    retail_target: 0,
    ad_spend_budget: 0,
    roas_target: 3.0
  });

  useEffect(() => {
    if (isOpen && weekInfo?.period_key) {
      fetchTargets();
    }
  }, [isOpen, weekInfo]);

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${API_URL}/admin/revenue-targets?type=weekly&period=${weekInfo.period_key}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success && data.data) {
        setTargets({
          ecommerce_target: data.data.ecommerce_target || 0,
          retail_target: data.data.retail_target || 0,
          ad_spend_budget: data.data.ad_spend_budget || 0,
          roas_target: data.data.roas_target || 3.0
        });
      }
    } catch (error) {
      console.error('Error fetching targets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/revenue-targets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          period_type: 'weekly',
          period_key: weekInfo.period_key,
          ...targets
        })
      });
      const data = await response.json();
      if (data.success) {
        onSave && onSave();
        onClose();
      }
    } catch (error) {
      console.error('Error saving targets:', error);
    } finally {
      setSaving(false);
    }
  };

  const combinedTarget = (parseFloat(targets.ecommerce_target) || 0) + (parseFloat(targets.retail_target) || 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`w-full max-w-lg rounded-xl shadow-2xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-3 py-2.5 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Target className="text-teal-500" size={18} />
            <div>
              <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Set Weekly Targets
              </h3>
              <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                {weekInfo?.period_key} ({weekInfo?.start_date} to {weekInfo?.end_date})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg ${isDarkMode ? 'hover:bg-slate-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2.5">
          {loading ? (
            <div className="text-center py-6">
              <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : (
            <>
              {/* Revenue Targets */}
              <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <h4 className={`text-[11px] font-medium mb-2 flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <IndianRupee size={12} /> Revenue Targets
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className={`text-[11px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      E-Commerce Weekly Target
                    </label>
                    <div className="flex items-center mt-0.5">
                      <span className={`px-1.5 py-1 rounded-l border-r-0 text-xs ${isDarkMode ? 'bg-slate-600 border-slate-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-600'} border`}>₹</span>
                      <input
                        type="number"
                        value={targets.ecommerce_target}
                        onChange={(e) => setTargets({ ...targets, ecommerce_target: parseFloat(e.target.value) || 0 })}
                        className={`flex-1 px-2 py-1 rounded-r text-xs border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                          isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="0"
                      />
                    </div>
                    <span className={`text-[9px] mt-0.5 block ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                      Expected online sales this week
                    </span>
                  </div>
                  
                  <div>
                    <label className={`text-[11px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Retail Weekly Target
                    </label>
                    <div className="flex items-center mt-0.5">
                      <span className={`px-1.5 py-1 rounded-l border-r-0 text-xs ${isDarkMode ? 'bg-slate-600 border-slate-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-600'} border`}>₹</span>
                      <input
                        type="number"
                        value={targets.retail_target}
                        onChange={(e) => setTargets({ ...targets, retail_target: parseFloat(e.target.value) || 0 })}
                        className={`flex-1 px-2 py-1 rounded-r text-xs border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                          isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="0"
                      />
                    </div>
                    <span className={`text-[9px] mt-0.5 block ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                      Expected store sales this week
                    </span>
                  </div>
                  
                  <div>
                    <label className={`text-[11px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Combined Target (Auto-calculated)
                    </label>
                    <div className="flex items-center mt-0.5">
                      <span className={`px-1.5 py-1 rounded-l border-r-0 text-xs ${isDarkMode ? 'bg-slate-600 border-slate-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-600'} border`}>₹</span>
                      <input
                        type="text"
                        value={combinedTarget.toLocaleString('en-IN')}
                        readOnly
                        className={`flex-1 px-2 py-1 rounded-r text-xs border cursor-not-allowed font-semibold ${
                          isDarkMode ? 'bg-slate-800 border-slate-600 text-teal-400' : 'bg-gray-100 border-gray-300 text-teal-600'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Targets */}
              <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <h4 className={`text-[11px] font-medium mb-2 flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <TrendingUp size={12} /> Performance Targets
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <label className={`text-[11px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Ad Spend Budget
                    </label>
                    <div className="flex items-center mt-0.5">
                      <span className={`px-1.5 py-1 rounded-l border-r-0 text-xs shrink-0 ${isDarkMode ? 'bg-slate-600 border-slate-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-600'} border`}>₹</span>
                      <input
                        type="number"
                        value={targets.ad_spend_budget}
                        onChange={(e) => setTargets({ ...targets, ad_spend_budget: parseFloat(e.target.value) || 0 })}
                        className={`w-full min-w-0 px-2 py-1 rounded-r text-xs border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                          isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="0"
                      />
                    </div>
                    <span className={`text-[9px] mt-0.5 block ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                      How much to spend on ads
                    </span>
                  </div>
                  
                  <div className="min-w-0">
                    <label className={`text-[11px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      ROAS Target
                    </label>
                    <div className={`flex items-center mt-0.5 rounded-lg overflow-hidden border ${isDarkMode ? 'border-slate-600' : 'border-gray-300'}`}>
                      <input
                        type="number"
                        step="0.1"
                        value={targets.roas_target}
                        onChange={(e) => setTargets({ ...targets, roas_target: parseFloat(e.target.value) || 3.0 })}
                        className={`w-full min-w-0 px-2 py-1 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                          isDarkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-900'
                        }`}
                        placeholder="3.0"
                      />
                      <span className={`px-2 py-1 text-xs shrink-0 ${isDarkMode ? 'bg-slate-600 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>x</span>
                    </div>
                    <span className={`text-[9px] mt-0.5 block ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                      Return on Ad Spend multiplier
                    </span>
                  </div>
                </div>

                {/* ROAS Explainer Card - Compact */}
                <div 
                  className="mt-2.5 rounded-lg p-2.5"
                  style={{
                    background: isDarkMode 
                      ? 'linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)' 
                      : 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)',
                    border: isDarkMode ? '1px solid rgba(20, 184, 166, 0.3)' : '1px solid rgba(20, 184, 166, 0.4)'
                  }}
                >
                  <div className={`font-semibold mb-1.5 text-xs flex items-center gap-1 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                    <span>💡</span> What does this mean?
                  </div>
                  
                  <div className={`text-xs ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    <p className="mb-1.5">
                      For every <span className="font-semibold text-amber-500">₹1</span> spent on ads, 
                      you expect <span className="font-semibold text-emerald-500">₹{targets.roas_target || 3}</span> in revenue
                    </p>
                    
                    {/* Calculation Box - Compact */}
                    <div className={`rounded p-2 ${isDarkMode ? 'bg-black/30' : 'bg-white/60'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ad Budget:</span>
                        <span className="text-amber-500 font-medium text-[11px]">₹{(targets.ad_spend_budget || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>× ROAS Target:</span>
                        <span className="text-teal-400 font-medium text-[11px]">{targets.roas_target || 3}x</span>
                      </div>
                      <div className={`flex justify-between items-center pt-1.5 mt-1 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                        <span className={`text-[10px] font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Expected Ad Revenue:</span>
                        <span className="text-emerald-500 font-bold text-[11px]">₹{((targets.ad_spend_budget || 0) * (targets.roas_target || 3)).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* ROAS Guide - Compact */}
                  <div className={`mt-2 pt-2 border-t ${isDarkMode ? 'border-white/10' : 'border-teal-200'}`}>
                    <div className={`text-[9px] mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>ROAS Target Guide:</div>
                    <div className="flex gap-1.5 flex-wrap">
                      <span 
                        className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-all ${
                          targets.roas_target < 3 
                            ? 'bg-red-500 text-white' 
                            : isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                        }`}
                      >
                        2x Min
                      </span>
                      <span 
                        className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-all ${
                          targets.roas_target >= 3 && targets.roas_target < 5 
                            ? 'bg-amber-500 text-white' 
                            : isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'
                        }`}
                      >
                        3-4x Good
                      </span>
                      <span 
                        className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-all ${
                          targets.roas_target >= 5 && targets.roas_target < 8 
                            ? 'bg-emerald-500 text-white' 
                            : isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                        }`}
                      >
                        5-7x Great
                      </span>
                      <span 
                        className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-all ${
                          targets.roas_target >= 8 
                            ? 'bg-violet-500 text-white' 
                            : isDarkMode ? 'bg-violet-500/20 text-violet-400' : 'bg-violet-100 text-violet-600'
                        }`}
                      >
                        8x+ Excellent
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-2 px-3 py-2.5 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`px-3 py-1.5 rounded-lg text-xs ${
              isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-3 py-1.5 rounded-lg text-xs bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={14} />
                Save Targets
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevenueTargetModal;
