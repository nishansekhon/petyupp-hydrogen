import { useState, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';

const API_URL = API_BASE_URL + '/api';

/**
 * UNIFIED Store Search Hook
 * 
 * Single hook that ALL modals must use for store search.
 * Searches across both retail_stores AND partner_stores collections.
 * 
 * @param {string} type - 'all' | 'retail' | 'partner'
 * - 'all': Search both retail_stores and partner_stores
 * - 'retail': Search only retail_stores
 * - 'partner': Search only partner_stores
 * 
 * Usage:
 * const { results, loading, error, search, clearResults } = useStoreSearch('all');
 * 
 * // On search input change:
 * const handleSearchChange = (e) => {
 *   const query = e.target.value;
 *   setSearchQuery(query);
 *   search(query);
 * };
 */
export const useStoreSearch = (type = 'all') => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState({
    partnerCount: 0,
    retailCount: 0,
    source: 'unified'
  });

  const search = useCallback(async (query) => {
    // Clear results if query is too short
    if (!query || query.trim().length < 1) {
      setResults([]);
      setError(null);
      setMetadata({ partnerCount: 0, retailCount: 0, source: 'unified' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${API_URL}/stores/unified-search?q=${encodeURIComponent(query.trim())}&type=${type}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Check response status
      if (!response.ok) {
        throw new Error(`Search failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Normalize stores for consistent UI
        const normalizedStores = (data.stores || []).map(store => ({
          ...store,
          // Ensure consistent field names
          store_name: store.store_name || store.name || '',
          name: store.name || store.store_name || '',
          address: store.address || store.formatted_address || store.vicinity || 
            (store.area ? `${store.area}, ${store.city || 'Delhi'}` : ''),
          place_id: store.place_id || store.google_place_id || store.store_id || store._id,
          // Preserve source info
          _source: store._source,
          is_partner: store.is_partner || false,
          in_database: true
        }));
        
        setResults(normalizedStores);
        setMetadata({
          partnerCount: data.partner_count || 0,
          retailCount: data.retail_count || 0,
          source: data.source || 'unified'
        });
      } else {
        setError(data.error || 'Search failed');
        setResults([]);
      }
    } catch (err) {
      console.error('Store search error:', err);
      setError(err.message || 'Failed to search stores');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [type]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setMetadata({ partnerCount: 0, retailCount: 0, source: 'unified' });
  }, []);

  // For backwards compatibility with existing code
  return { 
    results, 
    loading, 
    error, 
    search, 
    clearResults,
    // Additional metadata
    metadata,
    partnerCount: metadata.partnerCount,
    retailCount: metadata.retailCount,
    // Legacy aliases
    isSearching: loading,
    searchStores: search,
    setResults
  };
};

/**
 * Verify store search API is working
 * Call this on app load to confirm search functionality
 */
export const verifyStoreSearch = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(
      `${API_URL}/stores/unified-search?q=test&verify=true`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('CRITICAL: Store search API is broken!', data);
      return false;
    }
    
    console.log('✓ Store search API verified:', data);
    return true;
  } catch (err) {
    console.error('CRITICAL: Store search API verification failed:', err);
    return false;
  }
};

export default useStoreSearch;
