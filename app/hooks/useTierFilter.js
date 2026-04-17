import { useState, useMemo, useCallback } from 'react';

/**
 * Custom hook for tier filtering of stores
 * Shared between Sales Hub and Retail pages
 */
export const useTierFilter = (stores = []) => {
  const [tierFilter, setTierFilter] = useState('all');

  // Calculate tier counts from stores array
  const tierCounts = useMemo(() => {
    if (!stores || stores.length === 0) {
      return { all: 0, tier1: 0, tier2: 0, tier3: 0, tier4: 0 };
    }
    
    return {
      all: stores.length,
      tier1: stores.filter(s => s.tier === 'TIER1' || s.tier === 1 || s.tier === 'TIER 1').length,
      tier2: stores.filter(s => s.tier === 'TIER2' || s.tier === 2 || s.tier === 'TIER 2').length,
      tier3: stores.filter(s => s.tier === 'TIER3' || s.tier === 3 || s.tier === 'TIER 3').length,
      tier4: stores.filter(s => s.tier === 'TIER4' || s.tier === 4 || s.tier === 'TIER 4').length,
    };
  }, [stores]);

  // Filter stores by selected tier
  const filteredStores = useMemo(() => {
    if (!stores || tierFilter === 'all') return stores || [];
    
    const tierMap = {
      1: ['TIER1', 1, 'TIER 1'],
      2: ['TIER2', 2, 'TIER 2'],
      3: ['TIER3', 3, 'TIER 3'],
      4: ['TIER4', 4, 'TIER 4']
    };
    
    const validTiers = tierMap[tierFilter] || [];
    return stores.filter(s => validTiers.includes(s.tier));
  }, [stores, tierFilter]);

  // Reset filter to 'all'
  const resetFilter = useCallback(() => {
    setTierFilter('all');
  }, []);

  return {
    tierFilter,
    setTierFilter,
    tierCounts,
    filteredStores,
    resetFilter,
  };
};

export default useTierFilter;
