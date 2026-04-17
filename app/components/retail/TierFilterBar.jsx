import React from 'react';

/**
 * TierFilterBar component - filter buttons for store tiers
 * Shared between Sales Hub and Retail pages
 * 
 * Props:
 * - tierFilter: Current active filter ('all', 1, 2, 3, 4)
 * - setTierFilter: Function to update filter
 * - tierCounts: Object with tier counts { all, tier1, tier2, tier3, tier4 } (optional)
 * - results: Array of stores to calculate counts from (optional, used if tierCounts not provided)
 * - isDarkMode: Boolean for theme
 * - compact: Boolean for compact view (smaller buttons)
 */
const TierFilterBar = ({ 
  tierFilter, 
  setTierFilter, 
  tierCounts,
  results,
  isDarkMode = true,
  compact = false
}) => {
  // Calculate tier counts from results if tierCounts not provided
  const getCounts = () => {
    if (tierCounts) return tierCounts;
    
    if (!results || !Array.isArray(results)) {
      return { all: 0, tier1: 0, tier2: 0, tier3: 0, tier4: 0 };
    }
    
    return {
      all: results.length,
      tier1: results.filter(s => s.tier === 1 || s.tier === 'TIER1').length,
      tier2: results.filter(s => s.tier === 2 || s.tier === 'TIER2').length,
      tier3: results.filter(s => s.tier === 3 || s.tier === 'TIER3').length,
      tier4: results.filter(s => s.tier === 4 || s.tier === 'TIER4').length,
    };
  };
  
  const counts = getCounts();

  const filters = [
    { value: 'all', label: 'All', count: counts.all, icon: null, activeClass: isDarkMode ? 'bg-slate-600 text-white border-slate-500' : 'bg-gray-200 text-gray-900 border-gray-300' },
    { value: 1, label: 'T1', count: counts.tier1, icon: '⭐', activeClass: 'bg-yellow-500/30 text-yellow-400 border-yellow-500/50' },
    { value: 2, label: 'T2', count: counts.tier2, icon: '🟡', activeClass: 'bg-orange-500/30 text-orange-400 border-orange-500/50' },
    { value: 3, label: 'T3', count: counts.tier3, icon: '🔶', activeClass: 'bg-blue-500/30 text-blue-400 border-blue-500/50' },
    { value: 4, label: 'T4', count: counts.tier4, icon: '❌', activeClass: 'bg-gray-500/30 text-gray-400 border-gray-500/50' },
  ];

  const baseClass = compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs';
  const inactiveClass = isDarkMode 
    ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700' 
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
        Filter by Tier:
      </span>
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => setTierFilter(filter.value)}
          className={`${baseClass} rounded-lg font-medium transition-colors flex items-center gap-1 border ${
            tierFilter === filter.value
              ? filter.activeClass
              : `${inactiveClass} border-transparent`
          }`}
        >
          {filter.icon && <span>{filter.icon}</span>}
          {filter.label} ({filter.count})
        </button>
      ))}
    </div>
  );
};

export default TierFilterBar;
