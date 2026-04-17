import React, { useState } from 'react';
import { Search, MapPin, Star, Phone, Check, AlertCircle, Target, ChevronLeft, ChevronRight, X, List, LayoutGrid, RefreshCw, Layers, Smartphone } from 'lucide-react';
import { getTierColor, getTierIcon } from '@/utils/storeUtils';
import { TierFilterBar } from '@/components/retail';

// Category options with smart default queries
const CATEGORY_OPTIONS = [
  { value: 'pet_store', label: 'Pet Store', query: 'pet store', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'vet_clinic', label: 'Vet Clinic', query: 'veterinary clinic', color: 'bg-emerald-500/20 text-emerald-400' },
  { value: 'dog_groomer', label: 'Dog Groomer', query: 'dog grooming salon', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'pet_spa', label: 'Pet Spa', query: 'pet spa grooming', color: 'bg-pink-500/20 text-pink-400' },
  { value: 'dog_boarding', label: 'Dog Boarding', query: 'dog boarding kennel', color: 'bg-amber-500/20 text-amber-400' },
  { value: 'pet_shelter', label: 'Pet Shelter', query: 'dog shelter rescue', color: 'bg-red-500/20 text-red-400' },
  { value: 'pet_cafe', label: 'Pet Cafe', query: 'pet friendly cafe', color: 'bg-orange-500/20 text-orange-400' }
];

// Quick presets for easy selection
const QUICK_PRESETS = [
  { label: 'Pet Stores', category: 'pet_store', query: 'pet store' },
  { label: 'Vet Clinics', category: 'vet_clinic', query: 'veterinary clinic' },
  { label: 'Groomers', category: 'dog_groomer', query: 'dog grooming salon' },
  { label: 'Pet Spas', category: 'pet_spa', query: 'pet spa grooming' },
  { label: 'Boarding', category: 'dog_boarding', query: 'dog boarding kennel' },
  { label: 'Shelters', category: 'pet_shelter', query: 'dog shelter rescue' },
  { label: 'Pet Cafes', category: 'pet_cafe', query: 'pet friendly cafe' }
];

// Get category badge color
const getCategoryBadge = (category) => {
  const cat = CATEGORY_OPTIONS.find(c => c.value === category || c.label === category);
  return cat ? cat.color : 'bg-blue-500/20 text-blue-400';
};

// Get category display label
const getCategoryLabel = (category) => {
  const cat = CATEGORY_OPTIONS.find(c => c.value === category);
  return cat ? cat.label : category || 'Pet Store';
};

// Classify phone type: Mobile if starts with 6,7,8,9 after removing +91 and is 10 digits
const classifyPhoneType = (phone) => {
  if (!phone) return 'landline';
  // Remove country code, spaces, dashes, parentheses
  const cleaned = phone.replace(/^\+91|[\s\-\(\)]/g, '');
  if (cleaned.length === 10 && /^[6789]/.test(cleaned)) {
    return 'mobile';
  }
  return 'landline';
};

// Delhi NCR Areas with VERIFIED pincodes (India Post data)
const DELHI_AREAS = [
  // West Delhi
  { name: 'Dwarka', pincode: '110075' },
  { name: 'Dwarka Sector 6', pincode: '110075' },
  { name: 'Dwarka Sector 10', pincode: '110075' },
  { name: 'Dwarka Sector 19', pincode: '110075' },
  { name: 'Tilak Nagar', pincode: '110018' },
  { name: 'Janakpuri', pincode: '110058' },
  { name: 'Uttam Nagar', pincode: '110059' },
  { name: 'Rajouri Garden', pincode: '110027' },
  { name: 'Karol Bagh', pincode: '110005' },
  { name: 'Vikaspuri', pincode: '110018' },
  { name: 'Patel Nagar', pincode: '110008' },
  { name: 'Rajinder Nagar', pincode: '110060' },
  { name: 'Punjabi Bagh', pincode: '110026' },
  { name: 'Kirti Nagar', pincode: '110015' },
  { name: 'Moti Nagar', pincode: '110015' },
  { name: 'Paschim Vihar', pincode: '110063' },
  // Central Delhi
  { name: 'Connaught Place', pincode: '110001' },
  // South Delhi
  { name: 'Lajpat Nagar', pincode: '110024' },
  { name: 'Saket', pincode: '110017' },
  { name: 'Vasant Kunj', pincode: '110070' },
  { name: 'Hauz Khas', pincode: '110016' },
  { name: 'Nehru Place', pincode: '110019' },
  { name: 'Greater Kailash', pincode: '110048' },
  { name: 'Defence Colony', pincode: '110024' },
  { name: 'Green Park', pincode: '110016' },
  { name: 'South Extension', pincode: '110049' },
  { name: 'Malviya Nagar', pincode: '110017' },
  // North Delhi
  { name: 'Rohini', pincode: '110085' },
  { name: 'Rohini Sector 7', pincode: '110085' },
  { name: 'Rohini Sector 11', pincode: '110085' },
  { name: 'Rohini Sector 24', pincode: '110085' },
  { name: 'Pitampura', pincode: '110034' },
  { name: 'Shalimar Bagh', pincode: '110088' },
  { name: 'Model Town', pincode: '110009' },
  { name: 'Ashok Vihar', pincode: '110052' },
  // East Delhi
  { name: 'Mayur Vihar Phase 1', pincode: '110091' },
  { name: 'Mayur Vihar Phase 2', pincode: '110091' },
  { name: 'Preet Vihar', pincode: '110092' },
  { name: 'Laxmi Nagar', pincode: '110092' },
  { name: 'Shahdara', pincode: '110032' },
  { name: 'Dilshad Garden', pincode: '110095' },
  { name: 'Vivek Vihar', pincode: '110095' },
  { name: 'Vasundhara Enclave', pincode: '110096' },
  // Noida
  { name: 'Noida Sector 18', pincode: '201301' },
  { name: 'Noida Sector 62', pincode: '201309' },
  // Gurgaon
  { name: 'Gurgaon Sector 14', pincode: '122001' },
  { name: 'Gurgaon Sector 29', pincode: '122001' },
  { name: 'MG Road Gurgaon', pincode: '122002' },
  { name: 'DLF Phase 1', pincode: '122002' },
  // Ghaziabad
  { name: 'Indirapuram', pincode: '201014' },
  { name: 'Vaishali', pincode: '201010' },
  { name: 'Kaushambi', pincode: '201010' },
  { name: 'Ghaziabad', pincode: '201001' },
  // Others
  { name: 'Faridabad', pincode: '121001' },
  { name: 'Najafgarh', pincode: '110043' },
  { name: 'Mundka', pincode: '110041' },
  { name: 'Narela', pincode: '110040' }
];

const HuntTab = ({
  isDarkMode,
  huntData,
  storesData,
  searchForm,
  setSearchForm,
  isSearching,
  filteredAreas,
  showAreaDropdown,
  setShowAreaDropdown,
  handleAreaSearch,
  selectArea,
  handleSearch,
  handleGoogleSearch,
  showGoogleSearchButton,
  isGoogleSearching,
  resultsViewMode,
  setResultsViewMode,
  tierFilter,
  setTierFilter,
  selectedStores,
  setSelectedStores,
  showTierGuide,
  setShowTierGuide,
  viewType,
  setViewType,
  sortBy,
  setSortBy,
  handleAddStore,
  handleAddSelectedToDatabase,
  setActiveTab
}) => {
  // Track last search params for visual feedback
  const [lastSearchParams, setLastSearchParams] = useState(null);
  // Track stores being added (loading state)
  const [addingStores, setAddingStores] = useState(new Set());
  // Track stores added during this session
  const [sessionAddedStores, setSessionAddedStores] = useState(new Set());

  // Compute if settings have changed (derived state, not useEffect)
  const settingsChanged = lastSearchParams 
    ? (searchForm.query !== lastSearchParams.query || 
       searchForm.area !== lastSearchParams.area || 
       searchForm.radius !== lastSearchParams.radius ||
       searchForm.pincode !== lastSearchParams.pincode)
    : false;

  // Wrapper for handleSearch to track params
  const onSearch = () => {
    console.log('Search clicked with:', searchForm);
    setLastSearchParams({ ...searchForm });
    handleSearch();
  };

  // Helper function to deduplicate results by place_id
  // Helper function to deduplicate results by place_id or store_name
  const deduplicateResults = (results) => {
    if (!results || !Array.isArray(results)) return [];
    const seen = new Set();
    return results.filter((store) => {
      // Use place_id if available, otherwise use store_name + address combo
      const key = store.place_id || `${store.store_name}_${store.address || store.area}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  // Helper function to filter results by tier
  const getFilteredResults = (results, filter) => {
    const dedupedResults = deduplicateResults(results);
    if (filter === 'all') return dedupedResults;
    
    // Handle both numeric (1, 2, 3, 4) and string ('TIER1', 'TIER2') formats
    return dedupedResults.filter(store => {
      if (typeof filter === 'number') {
        return store.tier === filter || store.tier === `TIER${filter}`;
      }
      return store.tier === filter;
    });
  };

  // Helper function to get sorted results
  const getSortedResults = (results) => {
    const tierOrder = { 'TIER1': 1, 'TIER2': 2, 'TIER3': 3, 'TIER4': 4, null: 5, undefined: 5 };
    return [...results].sort((a, b) => {
      if (sortBy.field === 'tier') {
        const diff = tierOrder[a.tier] - tierOrder[b.tier];
        return sortBy.direction === 'asc' ? diff : -diff;
      }
      if (sortBy.field === 'name') {
        const nameA = a.store_name || '';
        const nameB = b.store_name || '';
        return sortBy.direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (sortBy.field === 'rating') {
        const ratingA = a.avg_rating || 0;
        const ratingB = b.avg_rating || 0;
        return sortBy.direction === 'asc' ? ratingA - ratingB : ratingB - ratingA;
      }
      return 0;
    });
  };

  // Check if store is in database
  const isStoreInDatabase = (store) => {
    const storeId = store.place_id || store.id;
    // Check both property names - backend uses 'already_added', some code uses 'in_database'
    return store.in_database || store.already_added || sessionAddedStores.has(storeId);
  };

  // Handle adding a single store to database
  const handleAddSingleStore = async (store, e) => {
    e.stopPropagation(); // Prevent row selection
    const storeId = store.place_id || store.id;
    
    if (addingStores.has(storeId)) return; // Already adding
    
    setAddingStores(prev => new Set([...prev, storeId]));
    
    try {
      await handleAddStore(store);
      setSessionAddedStores(prev => new Set([...prev, storeId]));
    } catch (error) {
      console.error('Failed to add store:', error);
    } finally {
      setAddingStores(prev => {
        const next = new Set(prev);
        next.delete(storeId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Compact Budget Stats Bar */}
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${
        isDarkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-gray-50/50 border border-gray-200/50'
      }`}>
        {/* Left: Hunt Label */}
        <div className="flex items-center gap-2">
          <span className="text-base">🎯</span>
          <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
            Google Places API Budget
          </span>
        </div>
        
        {/* Right: Budget Stats Only */}
        <div className="flex items-center gap-4 text-sm">
          {/* Budget */}
          <div className="flex items-center gap-1.5">
            <span className="text-base">💰</span>
            <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Budget:</span>
            <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              ₹{huntData.budgetInfo?.monthlyBudget?.toLocaleString() || '5,000'}
            </span>
          </div>
          
          <span className={isDarkMode ? 'text-slate-600' : 'text-gray-300'}>|</span>
          
          {/* Used */}
          <div className="flex items-center gap-1.5">
            <span className="text-base">💸</span>
            <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Used:</span>
            <span className="font-semibold text-orange-400">
              ₹{huntData.budgetInfo?.usedThisMonth?.toFixed(2) || '0.00'}
            </span>
          </div>
          
          <span className={isDarkMode ? 'text-slate-600' : 'text-gray-300'}>|</span>
          
          {/* Cache */}
          <div className="flex items-center gap-1.5">
            <span className="text-base">💾</span>
            <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Cache:</span>
            <span className="font-semibold text-green-400">
              {huntData.cacheStats?.hitRate?.toFixed(0) || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Search Form - Compact */}
      <div className={`backdrop-blur-lg border rounded-xl p-4 ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔍</span>
          <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Search Leads</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3">
          {/* Category Dropdown - New First Field */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              <Layers className="inline w-3 h-3 mr-1" />Category
            </label>
            <select
              value={searchForm.category || 'pet_store'}
              onChange={(e) => {
                const selectedCat = CATEGORY_OPTIONS.find(c => c.value === e.target.value);
                setSearchForm(prev => ({
                  ...prev,
                  category: e.target.value,
                  query: selectedCat ? selectedCat.query : prev.query
                }));
              }}
              className={`w-full px-3 py-2 rounded-xl border text-sm ${
                isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
              style={{ minWidth: '140px' }}
            >
              {CATEGORY_OPTIONS.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Search Query</label>
            <input
              type="text"
              placeholder="pet store, vet clinic"
              value={searchForm.query}
              onChange={(e) => setSearchForm(prev => ({ ...prev, query: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>State</label>
            <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
              isDarkMode ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-purple-50 text-purple-600 border border-purple-200'
            }`}>
              🏛️ New Delhi
            </div>
          </div>
          <div className="relative">
            <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Area *</label>
            <input
              type="text"
              placeholder="Tilak Nagar"
              value={searchForm.area}
              onChange={(e) => handleAreaSearch(e.target.value)}
              onFocus={() => setShowAreaDropdown(true)}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            {showAreaDropdown && filteredAreas.length > 0 && (
              <div className={`absolute z-50 w-full mt-1 max-h-48 overflow-auto rounded-lg border shadow-lg ${
                isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'
              }`}>
                {filteredAreas.map((area, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectArea(area)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-teal-500/20 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {area.name} - {area.pincode}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Radius</label>
            <select
              value={searchForm.radius}
              onChange={(e) => {
                const newRadius = parseInt(e.target.value);
                setSearchForm(prev => ({ ...prev, radius: newRadius }));
              }}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              } ${settingsChanged ? 'ring-2 ring-orange-500' : ''}`}
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={15}>15 km</option>
              <option value={20}>20 km</option>
            </select>
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Pincode</label>
            <input
              type="text"
              placeholder="110059"
              maxLength="6"
              value={searchForm.pincode}
              onChange={(e) => setSearchForm(prev => ({ ...prev, pincode: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </div>
        
        {/* Quick Category Presets */}
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_PRESETS.map(preset => (
            <button
              key={preset.category}
              onClick={() => setSearchForm(prev => ({
                ...prev,
                category: preset.category,
                query: preset.query
              }))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                searchForm.category === preset.category
                  ? 'border-teal-500 text-teal-400 bg-teal-500/10'
                  : isDarkMode 
                    ? 'bg-slate-800 border-slate-600 text-slate-300 hover:border-teal-500/50 hover:text-teal-400'
                    : 'bg-gray-50 border-gray-300 text-gray-600 hover:border-teal-500/50 hover:text-teal-500'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onSearch}
            disabled={isSearching}
            className={`px-5 py-2 text-white font-semibold rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 ${
              settingsChanged 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 ring-2 ring-green-400' 
                : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500'
            }`}
          >
            {isSearching ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search size={16} />
                {settingsChanged 
                  ? 'Search Again' 
                  : `Search (Est. ₹${huntData.cacheStats ? ((1 - huntData.cacheStats.hitRate/100) * 2.66).toFixed(2) : '2.66'})`
                }
              </>
            )}
          </button>
          {huntData.cacheStats && (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
              {huntData.cacheStats.hitRate.toFixed(0)}% cached
            </span>
          )}
          <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
            💡 Each search costs ~₹0.50
          </span>
        </div>
      </div>

      {/* Search Results */}
      {huntData.searchResults.length > 0 && (
        <div className={`backdrop-blur-lg border rounded-2xl p-5 ${
          isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
        }`}>
          {/* Bulk Actions Bar - Shows when stores are selected */}
          {selectedStores.length > 0 && (
            <div className={`flex items-center justify-between p-3 rounded-lg mb-4 ${
              isDarkMode ? 'bg-blue-900/40 border border-blue-500/40' : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => setSelectedStores([])}
                  className="w-4 h-4 accent-teal-500 cursor-pointer"
                />
                <span className={`text-sm font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  {selectedStores.length} store{selectedStores.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedStores([])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    isDarkMode 
                      ? 'border-slate-500 text-slate-300 hover:bg-slate-700' 
                      : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Clear Selection
                </button>
                <button
                  onClick={handleAddSelectedToDatabase}
                  disabled={addingStores.size > 0}
                  className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 disabled:cursor-wait rounded-lg text-sm text-white font-semibold flex items-center gap-2 transition-colors"
                >
                  {addingStores.size > 0 ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>+ Add {selectedStores.length} to Database</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Results Header with Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              {/* Select All Checkbox */}
              <input
                type="checkbox"
                checked={selectedStores.length > 0 && selectedStores.length === getFilteredResults(huntData.searchResults, tierFilter).length}
                onChange={() => {
                  const filteredResults = getFilteredResults(huntData.searchResults, tierFilter);
                  const allIds = filteredResults.map(s => s.place_id || s.id);
                  if (selectedStores.length === filteredResults.length) {
                    setSelectedStores([]);
                  } else {
                    setSelectedStores(allIds);
                  }
                }}
                className="w-4 h-4 accent-teal-500 cursor-pointer"
                title="Select all"
              />
              <span className="text-lg">📍</span>
              <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Search Results ({getFilteredResults(huntData.searchResults, tierFilter).length})
              </h3>
              {huntData.cached && (
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">From Cache</span>
              )}
              <button
                onClick={() => setShowTierGuide(!showTierGuide)}
                className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}
              >
                ℹ️ Tier Guide
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className={`flex items-center rounded-lg p-1 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                <button
                  onClick={() => setViewType('list')}
                  className={`p-1.5 rounded ${viewType === 'list' ? 'bg-teal-500 text-white' : isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setViewType('grid')}
                  className={`p-1.5 rounded ${viewType === 'grid' ? 'bg-teal-500 text-white' : isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
                >
                  <LayoutGrid size={16} />
                </button>
              </div>

              {/* Sort By */}
              <select
                value={`${sortBy.field}-${sortBy.direction}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-');
                  setSortBy({ field, direction });
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="tier-asc">Tier (Best First)</option>
                <option value="tier-desc">Tier (Lowest First)</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="rating-desc">Rating (Highest)</option>
                <option value="rating-asc">Rating (Lowest)</option>
              </select>
              
              {/* Compact/Full Toggle */}
              <div className={`flex items-center rounded-lg overflow-hidden border ${isDarkMode ? 'border-slate-600' : 'border-gray-300'}`}>
                <button
                  onClick={() => setResultsViewMode('compact')}
                  className={`px-3 py-1.5 text-xs font-medium ${
                    resultsViewMode === 'compact' 
                      ? 'bg-teal-500 text-white' 
                      : isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Compact
                </button>
                <button
                  onClick={() => setResultsViewMode('full')}
                  className={`px-3 py-1.5 text-xs font-medium ${
                    resultsViewMode === 'full' 
                      ? 'bg-teal-500 text-white' 
                      : isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Full View
                </button>
              </div>
            </div>
          </div>

          {/* Tier Guide Popover */}
          {showTierGuide && (
            <div className={`mb-4 p-4 rounded-xl border ${isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex justify-between items-start mb-2">
                <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>AI Tier Classification</h4>
                <button onClick={() => setShowTierGuide(false)} className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-lg">⭐</span>
                  <div>
                    <p className="font-bold text-yellow-500">TIER 1 - Premium</p>
                    <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>4.5+ rating, high-end, likely to stock</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-lg">🟡</span>
                  <div>
                    <p className="font-bold text-orange-500">TIER 2 - High Value</p>
                    <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>Good rating, established, good potential</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-lg">🔶</span>
                  <div>
                    <p className="font-bold text-blue-500">TIER 3 - Medium</p>
                    <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>Average store, needs evaluation</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-lg">❌</span>
                  <div>
                    <p className="font-bold text-gray-500">TIER 4 - Low Priority</p>
                    <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>Low rating or not ideal fit</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tier Filter Bar */}
          <TierFilterBar 
            tierFilter={tierFilter}
            setTierFilter={setTierFilter}
            results={deduplicateResults(huntData.searchResults)}
            isDarkMode={isDarkMode}
          />

          {/* Results Display */}
          {resultsViewMode === 'compact' ? (
            // Compact Grid View (6 cards max) with checkboxes
            <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 ${viewType === 'list' ? 'md:grid-cols-1' : ''}`}>
              {getSortedResults(getFilteredResults(huntData.searchResults, tierFilter).slice(0, 6)).map((store, idx) => {
                const storeId = store.place_id || store.id;
                const isSelected = selectedStores.includes(storeId);
                const inDatabase = isStoreInDatabase(store);
                const isAdding = addingStores.has(storeId);
                
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-teal-500 ring-2 ring-teal-500/30'
                        : isDarkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'
                    } ${isDarkMode ? 'hover:border-slate-500' : 'hover:border-gray-300'}`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setSelectedStores(selectedStores.filter(id => id !== storeId));
                          } else {
                            setSelectedStores([...selectedStores, storeId]);
                          }
                        }}
                        className="w-4 h-4 mt-0.5 accent-teal-500 cursor-pointer flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {store.store_name}
                        </p>
                      </div>
                      {store.tier && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white flex-shrink-0" style={{ backgroundColor: getTierColor(store.tier) }}>
                          {getTierIcon(store.tier)} {store.tier}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      {store.address}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      {store.avg_rating && (
                        <span className="flex items-center gap-1">
                          <Star size={10} className="text-yellow-500 fill-yellow-500" />
                          {store.avg_rating.toFixed(1)}
                        </span>
                      )}
                      {/* Add to Database Button */}
                      <div className="ml-auto">
                        {inDatabase ? (
                          <span className="text-green-400 text-xs">✓ In DB</span>
                        ) : (
                          <button
                            onClick={(e) => handleAddSingleStore(store, e)}
                            disabled={isAdding}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                              isAdding
                                ? 'bg-teal-700 text-teal-300 cursor-wait'
                                : 'bg-teal-500 hover:bg-teal-400 text-white'
                            }`}
                          >
                            {isAdding ? '...' : '+ Add'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Full View - Compact 2-line rows with checkboxes
            <div className="space-y-1">
              {getSortedResults(getFilteredResults(huntData.searchResults, tierFilter)).map((store, idx) => {
                const storeId = store.place_id || store.id;
                const isSelected = selectedStores.includes(storeId);
                const inDatabase = isStoreInDatabase(store);
                const isAdding = addingStores.has(storeId);
                const truncateAddress = (addr, max) => addr && addr.length > max ? addr.substring(0, max) + '...' : addr || '';
                const phoneType = classifyPhoneType(store.phone);
                const storeCategory = store.category || searchForm.category || 'pet_store';
                
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 px-3 py-2 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-teal-500 ring-1 ring-teal-500/30 bg-teal-500/10'
                        : isDarkMode ? 'bg-slate-700/30 border-slate-600/50 hover:border-slate-500' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          setSelectedStores(selectedStores.filter(id => id !== storeId));
                        } else {
                          setSelectedStores([...selectedStores, storeId]);
                        }
                      }}
                      className="w-4 h-4 mt-1 accent-teal-500 cursor-pointer flex-shrink-0"
                    />
                    
                    {/* Store Info */}
                    <div className="flex-1 min-w-0">
                      {/* Line 1: Name, Category Badge, Rating, Area, Tier, Add Button */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span 
                          className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                          style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {store.store_name}
                        </span>
                        {/* Category Badge */}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryBadge(storeCategory)}`}>
                          {getCategoryLabel(storeCategory)}
                        </span>
                        {/* Source Badge */}
                        {store.source === 'database' ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-600 text-white">
                            DB
                          </span>
                        ) : store.source === 'google' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-600 text-white">
                            Google
                          </span>
                        )}
                        {store.avg_rating && (
                          <span className="flex items-center gap-1 text-amber-400 text-sm">
                            <Star size={12} className="fill-amber-400" />
                            {store.avg_rating.toFixed(1)}
                          </span>
                        )}
                        <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          📍 {store.area || 'Delhi'}{store.city ? `, ${store.city}` : ''}
                        </span>
                        {store.tier && (
                          <span 
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                            style={{ backgroundColor: getTierColor(store.tier) }}
                          >
                            {getTierIcon(store.tier)} {store.tier}
                          </span>
                        )}
                        
                        {/* Add to Database Button */}
                        {inDatabase ? (
                          <span className="px-2.5 py-1 bg-slate-700 text-slate-400 rounded text-xs font-medium">
                            ✓ In Database
                          </span>
                        ) : (
                          <button
                            onClick={(e) => handleAddSingleStore(store, e)}
                            disabled={isAdding}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                              isAdding
                                ? 'bg-teal-700 text-teal-300 cursor-wait'
                                : 'bg-teal-500 hover:bg-teal-400 text-white'
                            }`}
                          >
                            {isAdding ? (
                              <span className="flex items-center gap-1">
                                <RefreshCw size={10} className="animate-spin" />
                                Adding...
                              </span>
                            ) : (
                              '+ Add'
                            )}
                          </button>
                        )}
                      </div>
                      
                      {/* Line 2: Address, Phone */}
                      <div className="flex items-center justify-between gap-4 mt-1">
                        <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {truncateAddress(store.address, 70)}
                        </span>
                        {store.phone && (
                          <span className={`text-xs flex items-center gap-1 flex-shrink-0 ${phoneType === 'mobile' ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {phoneType === 'mobile' ? <Smartphone size={10} /> : <Phone size={10} />}
                            {store.phone}
                            <span className={`text-[9px] px-1 py-0.5 rounded ${phoneType === 'mobile' ? 'bg-emerald-500/20' : 'bg-slate-500/20'}`}>
                              {phoneType === 'mobile' ? 'Mobile' : 'Landline'}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {getFilteredResults(huntData.searchResults, tierFilter).length === 0 && (
            <div className={`text-center py-8 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              No stores found for selected tier filter.
            </div>
          )}
          
          {/* Google Search Button - DB-first approach */}
          {showGoogleSearchButton && handleGoogleSearch && (
            <div className={`mt-6 pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="text-center">
                <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  {huntData.searchResults.length > 0 
                    ? `Found ${huntData.searchResults.length} stores in your database. Want to discover more?`
                    : 'No stores found in database. Search Google Places to discover new stores.'}
                </p>
                <button
                  onClick={handleGoogleSearch}
                  disabled={isGoogleSearching}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 mx-auto ${
                    isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  } ${isGoogleSearching ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {isGoogleSearching ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Searching Google...
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      Search Google for More Stores
                    </>
                  )}
                </button>
                <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                  Uses Google Places API (charged per search)
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HuntTab;
