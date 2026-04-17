import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for multi-selection of stores
 * Used for bulk actions like Add to Database, Create Route
 */
export const useStoreSelection = (stores = []) => {
  const [selectedIds, setSelectedIds] = useState([]);

  // Toggle a single store selection
  const toggleSelection = useCallback((storeId) => {
    setSelectedIds(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  }, []);

  // Select all stores (pass array of IDs)
  const selectAll = useCallback((storeIds) => {
    setSelectedIds(storeIds);
  }, []);

  // Select all visible stores from the stores array
  const selectAllVisible = useCallback(() => {
    const ids = stores.map(s => s.place_id || s.id || s.store_name);
    setSelectedIds(ids);
  }, [stores]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Check if a store is selected
  const isSelected = useCallback((storeId) => {
    return selectedIds.includes(storeId);
  }, [selectedIds]);

  // Get selected store objects
  const selectedStores = useMemo(() => {
    return stores.filter(s => {
      const id = s.place_id || s.id || s.store_name;
      return selectedIds.includes(id);
    });
  }, [stores, selectedIds]);

  return {
    selectedIds,
    selectedCount: selectedIds.length,
    selectedStores,
    toggleSelection,
    selectAll,
    selectAllVisible,
    clearSelection,
    isSelected,
  };
};

export default useStoreSelection;
