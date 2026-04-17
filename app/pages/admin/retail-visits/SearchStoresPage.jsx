import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { motion } from 'framer-motion';
import { Search, Plus, RefreshCw, MapPin, Phone, Star, CheckCircle, AlertCircle, X, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { TierCriteriaInfo } from '@/components/TierCriteriaInfo';
import { ScoringBreakdownPanel } from '@/components/ScoringBreakdownPanel';

const API_URL = API_BASE_URL + '/api';

function SearchStoresPage() {
  const { isDarkMode } = useAdminTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('pet store');
  const [state, setState] = useState('New Delhi');
  const [pincode, setPincode] = useState('');
  const [area, setArea] = useState('Tilak Nagar');
  const [radius, setRadius] = useState(5);
  const [allResults, setAllResults] = useState([]); // Store ALL results from search
  const [results, setResults] = useState([]); // Displayed results (filtered)
  const [selectedStores, setSelectedStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingStores, setAddingStores] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [cacheHit, setCacheHit] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPincodeSuggestions, setShowPincodeSuggestions] = useState(false);
  const [pincodeSuggestions, setPincodeSuggestions] = useState([]);
  
  // NEW: Area Auto-Complete
  const [areaList, setAreaList] = useState([]);
  const [filteredAreas, setFilteredAreas] = useState([]);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  
  // NEW: Market Segmentation state
  const [tierFilter, setTierFilter] = useState(null);  // null, TIER1, TIER2, TIER3
  const [sortBy, setSortBy] = useState('tier');  // tier, rating, distance
  const [tierBreakdown, setTierBreakdown] = useState({});
  
  // NEW: Route Creation - Track stores selected for route
  const [selectedForRoute, setSelectedForRoute] = useState([]);
  
  // NEW: Budget & Cost Preview state
  const [budgetInfo, setBudgetInfo] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  const [showCostConfirmModal, setShowCostConfirmModal] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [searchCacheStatus, setSearchCacheStatus] = useState(null);
  const [isBudgetMinimized, setIsBudgetMinimized] = useState(true); // Default to minimized

  // Delhi NCR Pincodes Database (Medium scope - common pincodes)
  const delhiPincodes = [
    { code: '110001', area: 'Connaught Place', name: 'ITO, Connaught Place' },
    { code: '110002', area: 'Kasturba Nagar', name: 'Daryaganj, Kasturba Nagar' },
    { code: '110003', area: 'Darya Ganj', name: 'Darya Ganj' },
    { code: '110005', area: 'Karol Bagh', name: 'Karol Bagh' },
    { code: '110006', area: 'Rajinder Nagar', name: 'Rajinder Nagar' },
    { code: '110007', area: 'Ranjit Nagar', name: 'Motia Khan, Ranjit Nagar' },
    { code: '110008', area: 'Patel Nagar', name: 'Patel Nagar' },
    { code: '110009', area: 'R K Puram', name: 'R K Puram' },
    { code: '110010', area: 'Sadar Bazar', name: 'Sadar Bazar' },
    { code: '110012', area: 'Pahar Ganj', name: 'Pahar Ganj' },
    { code: '110015', area: 'New Delhi', name: 'Ajmeri Gate' },
    { code: '110016', area: 'Shadipur', name: 'Shadipur' },
    { code: '110017', area: 'Saket', name: 'Saket, South Delhi' },
    { code: '110018', area: 'Lajpat Nagar', name: 'Lajpat Nagar' },
    { code: '110019', area: 'Safdarjung', name: 'Safdarjung Enclave' },
    { code: '110020', area: 'Sarai Rohilla', name: 'Sarai Rohilla' },
    { code: '110021', area: 'Delhi Cantt', name: 'Delhi Cantt' },
    { code: '110024', area: 'Kaka Nagar', name: 'Kaka Nagar' },
    { code: '110025', area: 'Nehru Place', name: 'Nehru Place' },
    { code: '110026', area: 'Hauz Khas', name: 'Hauz Khas' },
    { code: '110029', area: 'Lajpat Nagar', name: 'Lajpat Nagar' },
    { code: '110030', area: 'Lodhi Colony', name: 'Lodhi Colony' },
    { code: '110037', area: 'Rohini', name: 'Rohini Sector 7' },
    { code: '110044', area: 'Pitampura', name: 'Pitampura' },
    { code: '110045', area: 'Shalimar Bagh', name: 'Shalimar Bagh' },
    { code: '110046', area: 'Model Town', name: 'Model Town' },
    { code: '110047', area: 'Wazirabad', name: 'Wazirabad' },
    { code: '110052', area: 'Keshav Puram', name: 'Keshav Puram' },
    { code: '110058', area: 'Rajouri Garden', name: 'Rajouri Garden' },
    { code: '110059', area: 'Uttam Nagar', name: 'Uttam Nagar' },
    { code: '110062', area: 'Dwarka', name: 'Dwarka Sector 10' },
    { code: '110063', area: 'Najafgarh', name: 'Najafgarh' },
    { code: '110065', area: 'Janakpuri', name: 'Janakpuri' },
    { code: '110075', area: 'Dwarka', name: 'Dwarka Sector 19' },
    { code: '110077', area: 'Dwarka', name: 'Dwarka Sector 6' },
    { code: '110085', area: 'Rohini', name: 'Rohini Sector 24' },
    { code: '110086', area: 'Mundka', name: 'Mundka' },
    { code: '110088', area: 'Rohini', name: 'Rohini Sector 11' },
    { code: '110091', area: 'Narela', name: 'Narela' }
  ];

  // Handle pincode input change with suggestions
  const handlePincodeChange = (value) => {
    setPincode(value);
    
    if (value.length > 0) {
      const filtered = delhiPincodes.filter(p => 
        p.code.startsWith(value) || 
        p.area.toLowerCase().includes(value.toLowerCase()) ||
        p.name.toLowerCase().includes(value.toLowerCase())
      );
      setPincodeSuggestions(filtered.slice(0, 8)); // Show max 8 suggestions
      setShowPincodeSuggestions(filtered.length > 0);
    } else {
      setPincodeSuggestions([]);
      setShowPincodeSuggestions(false);
    }
  };

  // Handle pincode selection from suggestions
  const handlePincodeSelect = (selectedPincode) => {
    setPincode(selectedPincode.code);
    setArea(selectedPincode.area); // Auto-fill area
    setShowPincodeSuggestions(false);
    showToast(`📍 Pincode ${selectedPincode.code} selected - ${selectedPincode.area}`, 'success');
  };

  // NEW: Helper functions for tier display
  const getTierColor = (tier) => {
    const colors = {
      'TIER1': '#00D084',  // Green
      'TIER2': '#FFB800',  // Yellow
      'TIER3': '#FF8C00',  // Orange
      'TIER4': '#EF4444'   // Red
    };
    return colors[tier] || '#9CA3AF';
  };

  const getTierIcon = (tier) => {
    const icons = {
      'TIER1': '⭐',
      'TIER2': '🟡',
      'TIER3': '🔶',
      'TIER4': '❌'
    };
    return icons[tier] || '•';
  };

  // Filter and sort results based on tier selection and sort order (CLIENT-SIDE)

  // Delhi NCR Areas for autocomplete fallback
  const DELHI_AREAS = [
    { name: 'Dwarka', pincode: '110075' },
    { name: 'Dwarka Sector 6', pincode: '110077' },
    { name: 'Dwarka Sector 10', pincode: '110062' },
    { name: 'Dwarka Sector 19', pincode: '110075' },
    { name: 'Tilak Nagar', pincode: '110018' },
    { name: 'Janakpuri', pincode: '110065' },
    { name: 'Uttam Nagar', pincode: '110059' },
    { name: 'Rajouri Garden', pincode: '110058' },
    { name: 'Karol Bagh', pincode: '110005' },
    { name: 'Connaught Place', pincode: '110001' },
    { name: 'Lajpat Nagar', pincode: '110018' },
    { name: 'Saket', pincode: '110017' },
    { name: 'Vasant Kunj', pincode: '110070' },
    { name: 'Hauz Khas', pincode: '110026' },
    { name: 'Nehru Place', pincode: '110019' },
    { name: 'Greater Kailash', pincode: '110048' },
    { name: 'Defence Colony', pincode: '110024' },
    { name: 'Green Park', pincode: '110016' },
    { name: 'South Extension', pincode: '110049' },
    { name: 'Malviya Nagar', pincode: '110017' },
    { name: 'Rohini', pincode: '110037' },
    { name: 'Rohini Sector 7', pincode: '110037' },
    { name: 'Rohini Sector 11', pincode: '110088' },
    { name: 'Rohini Sector 24', pincode: '110085' },
    { name: 'Pitampura', pincode: '110044' },
    { name: 'Shalimar Bagh', pincode: '110052' },
    { name: 'Model Town', pincode: '110033' },
    { name: 'Ashok Vihar', pincode: '110052' },
    { name: 'Paschim Vihar', pincode: '110087' },
    { name: 'Vikaspuri', pincode: '110018' },
    { name: 'Patel Nagar', pincode: '110008' },
    { name: 'Rajinder Nagar', pincode: '110006' },
    { name: 'Punjabi Bagh', pincode: '110026' },
    { name: 'Kirti Nagar', pincode: '110015' },
    { name: 'Moti Nagar', pincode: '110015' },
    { name: 'Mayur Vihar Phase 1', pincode: '110091' },
    { name: 'Mayur Vihar Phase 2', pincode: '110091' },
    { name: 'Preet Vihar', pincode: '110092' },
    { name: 'Laxmi Nagar', pincode: '110092' },
    { name: 'Shahdara', pincode: '110032' },
    { name: 'Dilshad Garden', pincode: '110095' },
    { name: 'Vivek Vihar', pincode: '110095' },
    { name: 'Vasundhara Enclave', pincode: '110096' },
    { name: 'Noida Sector 18', pincode: '201301' },
    { name: 'Noida Sector 62', pincode: '201309' },
    { name: 'Gurgaon Sector 14', pincode: '122001' },
    { name: 'Gurgaon Sector 29', pincode: '122001' },
    { name: 'MG Road Gurgaon', pincode: '122002' },
    { name: 'DLF Phase 1', pincode: '122002' },
    { name: 'Indirapuram', pincode: '201014' },
    { name: 'Vaishali', pincode: '201010' },
    { name: 'Kaushambi', pincode: '201010' },
    { name: 'Ghaziabad', pincode: '201001' },
    { name: 'Faridabad', pincode: '121001' },
    { name: 'Najafgarh', pincode: '110043' },
    { name: 'Mundka', pincode: '110086' },
    { name: 'Narela', pincode: '110040' }
  ];

  // LOAD ALL AREAS ON MOUNT
  React.useEffect(() => {
    loadAllAreas();
  }, []);

  const loadAllAreas = async () => {
    try {
      const response = await axios.get(`${API_URL}/areas-list`);
      const areas = response.data.areas.map(a => ({
        name: a.area,
        pincode: a.pincode
      }));
      
      // If API returns empty, use fallback list
      if (areas.length === 0) {
        console.log('⚠️ API returned empty areas, using fallback list');
        setAreaList(DELHI_AREAS);
      } else {
        setAreaList(areas);
      }
      console.log('✅ Loaded areas:', areas.length || DELHI_AREAS.length);
    } catch (error) {
      console.error('Error loading areas, using fallback:', error);
      setAreaList(DELHI_AREAS);
    }
  };

  // FILTER AREAS AS USER TYPES
  const handleAreaInputChange = (value) => {
    setArea(value);
    
    if (value.length > 0) {
      const filtered = areaList.filter(a =>
        a.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredAreas(filtered);
      setShowAreaDropdown(true);
    } else {
      setFilteredAreas([]);
      setShowAreaDropdown(false);
    }
  };

  // SELECT AREA FROM DROPDOWN
  const selectArea = (selectedArea) => {
    setArea(selectedArea.name);
    setPincode(selectedArea.pincode);
    setShowAreaDropdown(false);
    console.log(`✅ Selected: ${selectedArea.name} (${selectedArea.pincode})`);
  };


  React.useEffect(() => {
    let filtered = allResults;
    
    // Apply tier filter
    if (tierFilter !== null) {
      filtered = allResults.filter(store => store.tier === tierFilter);
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'tier') {
        // Sort by tier (TIER1 first, then TIER2, TIER3, TIER4)
        const tierOrder = { 'TIER1': 1, 'TIER2': 2, 'TIER3': 3, 'TIER4': 4 };
        return (tierOrder[a.tier] || 99) - (tierOrder[b.tier] || 99);
      } else if (sortBy === 'rating') {
        // Sort by rating (highest first)
        return (b.rating || 0) - (a.rating || 0);
      } else if (sortBy === 'distance') {
        // Sort by distance (closest first) - placeholder, actual distance not available
        return 0;
      }
      return 0;
    });
    
    setResults(sorted);
  }, [tierFilter, sortBy, allResults]);

  // Back navigation handler
  const handleBack = () => {
    navigate('/admin/retail-visits');
  };

  // Toggle store selection for route creation
  const toggleStoreForRoute = (storeId) => {
    setSelectedForRoute(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  // Navigate to route creation with selected stores
  const handleCreateRouteWithStores = () => {
    if (selectedForRoute.length === 0) {
      showToast('Please select at least one store', 'error');
      return;
    }
    
    // Get selected store details
    const storesForRoute = results.filter(store => 
      selectedForRoute.includes(store.google_place_id)
    );
    
    // Navigate to create route page with state
    navigate('/admin/retail-visits/routes/create', {
      state: {
        selectedStores: storesForRoute,
        area: area || 'Selected Area',
        zone: state || 'Selected Zone',
        searchQuery: searchQuery
      }
    });
  };

  // Keyboard navigation handler
  const handleKeyDown = (e) => {
    // ESC key - go back
    if (e.key === 'Escape') {
      // If modal is open, close it; otherwise go back
      if (showCostConfirmModal) {
        setShowCostConfirmModal(false);
      } else {
        handleBack();
      }
    }
    
    // Enter key - submit search (only if not in textarea and modal not open)
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && !showCostConfirmModal) {
      e.preventDefault();
      handleSearchClick(e);
    }
  };

  // Fetch budget and cache stats on mount
  React.useEffect(() => {
    fetchBudgetInfo();
  }, []);

  // Add keyboard event listener
  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCostConfirmModal]); // Re-attach when modal state changes

  const fetchBudgetInfo = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Fetch API usage stats and cache performance
      const [usageResponse, cacheResponse] = await Promise.all([
        axios.get(`${API_URL}/admin/api-usage/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/admin/cache/performance`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (usageResponse.data.success) {
        const googlePlacesStats = usageResponse.data.stats.google_places || {};
        setBudgetInfo({
          monthlyBudget: googlePlacesStats.monthly_budget_inr || 5000,
          usedThisMonth: googlePlacesStats.cost_this_month_inr || 0,
          callsThisMonth: googlePlacesStats.calls_this_month || 0,
          costPerCall: 2.66 // ₹2.66 per Google Places API call
        });
      }

      if (cacheResponse.data.success) {
        const cachePerf = cacheResponse.data.metrics.cache_performance || {};
        setCacheStats({
          hitRate: cachePerf.cache_hit_rate || 0,
          callsReduced: cachePerf.api_calls_reduced_percent || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch budget info:', error);
    }
  };

  const calculateEstimatedCost = () => {
    if (!budgetInfo || !cacheStats) return 2.66;
    
    const cacheHitProbability = cacheStats.hitRate / 100;
    const cacheMissProbability = 1 - cacheHitProbability;
    
    // Expected cost = (probability of cache miss) * (cost per API call)
    const expectedCost = cacheMissProbability * budgetInfo.costPerCall;
    return expectedCost;
  };

  const handleSearchClick = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    try {
      // STEP 1: Check cache status BEFORE search (query MongoDB directly via backend)
      const cacheCheckResponse = await axios.post(
        `${API_URL}/retail/cache-check`,
        {
          search_query: searchQuery,
          city: 'New Delhi',
          area: area || '',
          radius_km: radius
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        }
      );
      
      const cacheResult = cacheCheckResponse.data;
      
      console.log('🔍 Cache Check Result:', {
        exists: cacheResult.exists,
        estimated_cost: cacheResult.estimated_cost,
        metadata: cacheResult.metadata
      });
      
      // STEP 2: Set cache status for confirmation modal
      if (cacheResult.exists) {
        setSearchCacheStatus({
          exists: true,
          cache_key: cacheResult.cache_key,
          metadata: cacheResult.metadata,
          estimatedCost: 0 // ₹0 because it's cached
        });
        setEstimatedCost(0);
      } else {
        setSearchCacheStatus({
          exists: false,
          estimatedCost: cacheResult.estimated_cost || 2.66
        });
        setEstimatedCost(cacheResult.estimated_cost || 2.66);
      }
      
    } catch (error) {
      console.error('Cache check error:', error);
      // If cache check fails, assume not cached
      setEstimatedCost(2.66);
      setSearchCacheStatus({
        exists: false,
        estimatedCost: 2.66
      });
    }
    
    // STEP 3: Show cost confirmation modal
    setShowCostConfirmModal(true);
  };

  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setSearchPerformed(true);
    setSelectedStores([]);
    setTierFilter(null); // Reset tier filter on new search

    try {
      const token = localStorage.getItem('adminToken');
      
      // Don't send tier filter to backend - we'll filter client-side
      const response = await axios.post(
        `${API_URL}/retail/stores/search-google`,
        {
          search_query: searchQuery,
          city: 'New Delhi', // HARDCODED - Always "New Delhi" for consistent cache keys
          area,
          radius_km: radius,
          pincode: pincode || undefined // Include pincode if provided
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      // Store ALL results for client-side filtering
      const fetchedResults = response.data.results || response.data.stores || [];
      setAllResults(fetchedResults);
      setResults(fetchedResults); // Initially show all
      setTierBreakdown(response.data.tier_breakdown || {});
      setCacheHit(response.data.cached);
      
      const count = response.data.count || response.data.results_count || 0;
      const costSaved = response.data.cached ? ' 💰 Saved ₹2.66' : '';
      showToast(
        `Found ${count} stores${response.data.cached ? ' (from cache)' + costSaved : ''}`,
        'success'
      );
    } catch (error) {
      console.error('Search error:', error);
      showToast('Failed to search stores', 'error');
      setAllResults([]);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStore = (storeId) => {
    setSelectedStores(prev =>
      prev.includes(storeId)
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  const handleSelectAll = () => {
    const availableStores = results.filter(s => !s.in_database);
    if (selectedStores.length === availableStores.length) {
      setSelectedStores([]);
    } else {
      setSelectedStores(availableStores.map(s => s.google_place_id));
    }
  };

  const handleAddToDatabase = async () => {
    if (selectedStores.length === 0) {
      showToast('Please select at least one store', 'error');
      return;
    }

    setAddingStores(true);

    try {
      const token = localStorage.getItem('adminToken');
      const storesToAdd = results.filter(s => selectedStores.includes(s.google_place_id));

      const response = await axios.post(
        `${API_URL}/retail/stores/add-multiple`,
        {
          stores: storesToAdd,
          area: area || state,
          zone: 'West Delhi',
          priority_level: 'medium'
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      showToast(
        `${response.data.stores_added} stores added successfully!`,
        'success'
      );

      await handleSearch({ preventDefault: () => {} });
      setSelectedStores([]);
    } catch (error) {
      console.error('Add stores error:', error);
      showToast('Failed to add stores to database', 'error');
    } finally {
      setAddingStores(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2">
            <X size={16} />
          </button>
        </motion.div>
      )}

      {/* Back Button & Breadcrumb Navigation */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
            isDarkMode
              ? 'bg-white/5 text-blue-400 hover:bg-white/10 border border-white/10'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
          }`}
        >
          <ArrowLeft size={18} />
          Back to Retail Visits
        </button>
        
        {/* Breadcrumb */}
        <div className={`flex items-center gap-2 mt-3 text-sm ${
          isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'
        }`}>
          <button 
            onClick={() => navigate('/admin/marketing')}
            className={`hover:underline ${isDarkMode ? 'hover:text-pearl-white' : 'hover:text-gray-900'}`}
          >
            Home
          </button>
          <span>›</span>
          <button 
            onClick={handleBack}
            className={`hover:underline ${isDarkMode ? 'hover:text-pearl-white' : 'hover:text-gray-900'}`}
          >
            Retail Visits
          </button>
          <span>›</span>
          <span className={isDarkMode ? 'text-pearl-white font-semibold' : 'text-gray-900 font-semibold'}>
            Search Stores
          </span>
        </div>
      </div>

      <div className="mb-8">
        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
          🔍 Search Stores
        </h1>
        <p className={`mt-2 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
          Find pet stores using Google Places and add them to your database
        </p>
      </div>

      <form onSubmit={handleSearch} className={`${
        isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
      } rounded-2xl p-6 mb-6`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
              Search Query
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. pet store, vet clinic"
              tabIndex={1}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 text-pearl-white placeholder-pearl-white/40'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
              State
            </label>
            <div className={`w-full px-4 py-2 rounded-lg border ${
              isDarkMode
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                : 'bg-purple-50 border-purple-200 text-purple-600'
            } font-semibold flex items-center gap-2`}>
              <span>🏛️</span>
              <span>New Delhi</span>
              <span className={`text-xs font-normal ml-auto ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>(Fixed)</span>
            </div>
          </div>

          <div className="relative">
            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
              Pincode <span className="text-xs font-normal opacity-60">(Optional)</span>
            </label>
            <input
              type="text"
              value={pincode}
              onChange={(e) => handlePincodeChange(e.target.value)}
              onFocus={() => pincode && setShowPincodeSuggestions(true)}
              onBlur={() => setTimeout(() => setShowPincodeSuggestions(false), 200)}
              placeholder="e.g. 110059"
              maxLength="6"
              tabIndex={3}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 text-pearl-white placeholder-pearl-white/40'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
            />
            
            {/* Pincode Suggestions Dropdown */}
            {showPincodeSuggestions && pincodeSuggestions.length > 0 && (
              <div className={`absolute z-50 w-full mt-1 rounded-lg shadow-xl border overflow-hidden ${
                isDarkMode
                  ? 'bg-gray-800 border-white/10'
                  : 'bg-white border-gray-200'
              }`}>
                <div className={`px-3 py-2 text-xs font-semibold border-b ${
                  isDarkMode ? 'bg-white/5 border-white/10 text-pearl-white/60' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}>
                  📍 Select Pincode
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {pincodeSuggestions.map((p) => (
                    <button
                      key={p.code}
                      type="button"
                      onMouseDown={() => handlePincodeSelect(p)}
                      className={`w-full px-4 py-3 text-left border-b transition-colors ${
                        isDarkMode
                          ? 'border-white/5 hover:bg-white/10'
                          : 'border-gray-100 hover:bg-purple-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`font-bold text-sm ${
                            isDarkMode ? 'text-cyan-400' : 'text-purple-600'
                          }`}>{p.code}</span>
                          <span className={`ml-2 text-sm ${
                            isDarkMode ? 'text-pearl-white' : 'text-gray-900'
                          }`}>{p.name}</span>
                        </div>
                        <MapPin size={14} className={isDarkMode ? 'text-pearl-white/40' : 'text-gray-400'} />
                      </div>
                      <div className={`text-xs mt-1 ${
                        isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'
                      }`}>
                        Area: {p.area}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {pincode && (
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>
                💡 Type pincode to see suggestions or leave blank for area-based search
              </p>
            )}
          </div>

          <div className="relative">
            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
              Area *
            </label>
            <input
              type="text"
              value={area}
              onChange={(e) => handleAreaInputChange(e.target.value)}
              onFocus={() => {
                if (area.length > 0 && filteredAreas.length > 0) {
                  setShowAreaDropdown(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowAreaDropdown(false), 200);
              }}
              placeholder="Type area name..."
              autoComplete="off"
              tabIndex={4}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 text-pearl-white placeholder-pearl-white/40'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
            />
            
            {/* AUTO-COMPLETE DROPDOWN */}
            {showAreaDropdown && filteredAreas.length > 0 && (
              <div className={`absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border shadow-lg z-50 ${
                isDarkMode
                  ? 'bg-gray-800 border-white/10'
                  : 'bg-white border-gray-300'
              }`}>
                {filteredAreas.map((a, idx) => (
                  <div
                    key={idx}
                    onMouseDown={() => selectArea(a)}
                    className={`px-4 py-3 cursor-pointer flex items-center justify-between border-b transition-colors ${
                      isDarkMode
                        ? 'border-white/5 hover:bg-white/10'
                        : 'border-gray-100 hover:bg-purple-50'
                    }`}
                  >
                    <span className={`font-medium text-sm ${
                      isDarkMode ? 'text-cyan-400' : 'text-purple-600'
                    }`}>
                      {a.name}
                    </span>
                    <span className={`text-xs ${
                      isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'
                    }`}>
                      {a.pincode}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {pincode && area && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                <CheckCircle size={12} />
                {pincode === '110018' ? 'Tilak Nagar' : `${area}`} - {pincode}
              </p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
              Radius (km)
            </label>
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              tabIndex={5}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 text-pearl-white [&>option]:bg-gray-800 [&>option]:text-pearl-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={15}>15 km</option>
              <option value={20}>20 km</option>
            </select>
          </div>
        </div>

        {/* Budget & Cost Info Box */}
        {budgetInfo && cacheStats && (
          <div className={`mb-4 rounded-xl border transition-all ${
            isDarkMode 
              ? 'bg-gradient-to-br from-blue-500/10 to-green-500/10 border-blue-500/30' 
              : 'bg-gradient-to-br from-blue-50 to-green-50 border-blue-200'
          } ${isBudgetMinimized ? 'p-3' : 'p-5'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">💰</span>
                <h3 className={`text-sm font-bold uppercase tracking-wide ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  Budget & Cost Info
                </h3>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsBudgetMinimized(!isBudgetMinimized);
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-white/10 text-pearl-white/60' 
                    : 'hover:bg-gray-200 text-gray-600'
                }`}
                title={isBudgetMinimized ? 'Expand' : 'Minimize'}
              >
                {isBudgetMinimized ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronUp size={18} />
                )}
              </button>
            </div>

            {!isBudgetMinimized ? (
              <>
                {/* Budget Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-white/10">
                  <div>
                    <p className={`text-xs uppercase tracking-wide mb-1 ${
                      isDarkMode ? 'text-pearl-white/50' : 'text-gray-500'
                    }`}>
                      Monthly Budget
                    </p>
                    <p className={`text-lg font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      ₹{budgetInfo.monthlyBudget.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-wide mb-1 ${
                      isDarkMode ? 'text-pearl-white/50' : 'text-gray-500'
                    }`}>
                      Used This Month
                    </p>
                    <p className={`text-lg font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      ₹{budgetInfo.usedThisMonth.toFixed(2)}{' '}
                      <span className={`text-xs font-normal ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        ({((budgetInfo.usedThisMonth / budgetInfo.monthlyBudget) * 100).toFixed(2)}%)
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-wide mb-1 ${
                      isDarkMode ? 'text-pearl-white/50' : 'text-gray-500'
                    }`}>
                      Remaining
                    </p>
                    <p className={`text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                      ₹{(budgetInfo.monthlyBudget - budgetInfo.usedThisMonth).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div>
                  <h4 className={`text-xs uppercase tracking-wide mb-3 ${
                    isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'
                  }`}>
                    Per Search Cost:
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className={isDarkMode ? 'text-pearl-white/70' : 'text-gray-700'}>
                        ✅ If cached ({cacheStats.hitRate.toFixed(1)}% chance)
                      </span>
                      <strong className={isDarkMode ? 'text-green-400' : 'text-green-600'}>₹0</strong>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className={isDarkMode ? 'text-pearl-white/70' : 'text-gray-700'}>
                        🔍 If new search ({(100 - cacheStats.hitRate).toFixed(1)}%)
                      </span>
                      <strong className={isDarkMode ? 'text-orange-400' : 'text-orange-600'}>
                        ₹{budgetInfo.costPerCall.toFixed(2)}
                      </strong>
                    </div>
                    <div className={`flex items-center justify-between p-2 rounded-lg border-l-3 ${
                      isDarkMode 
                        ? 'bg-blue-500/10 border-blue-400' 
                        : 'bg-blue-100 border-blue-500'
                    }`}>
                      <span className={`text-sm font-semibold ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-700'
                      }`}>
                        📊 Expected average
                      </span>
                      <strong className={`text-base ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                        ₹{calculateEstimatedCost().toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Minimized View - Single Line */
              <div className={`flex items-center justify-between text-sm ${
                isDarkMode ? 'text-pearl-white/80' : 'text-gray-700'
              }`}>
                <div className="flex items-center gap-4">
                  <span>
                    Budget: <strong className={isDarkMode ? 'text-pearl-white' : 'text-gray-900'}>
                      ₹{budgetInfo.monthlyBudget.toFixed(0)}
                    </strong>
                  </span>
                  <span className="text-gray-400">|</span>
                  <span>
                    Used: <strong className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>
                      ₹{budgetInfo.usedThisMonth.toFixed(2)}
                    </strong>
                  </span>
                  <span className="text-gray-400">|</span>
                  <span>
                    Est. Cost: <strong className={isDarkMode ? 'text-green-400' : 'text-green-600'}>
                      ₹{calculateEstimatedCost().toFixed(2)}
                    </strong>
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                }`}>
                  {cacheStats.hitRate.toFixed(0)}% cached
                </span>
              </div>
            )}
          </div>
        )}

        <motion.button
          type="button"
          onClick={handleSearchClick}
          disabled={loading}
          tabIndex={6}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className={`px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold flex items-center gap-2 hover:shadow-lg transition-all ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="animate-spin" size={18} />
              Searching...
            </>
          ) : (
            <>
              <Search size={18} />
              Search Stores 
              {budgetInfo && (
                <span className="text-xs opacity-80">
                  (Est. ₹{calculateEstimatedCost().toFixed(2)})
                </span>
              )}
            </>
          )}
        </motion.button>
        
        {/* Keyboard Shortcuts Helper */}
        <div className={`mt-3 text-xs flex items-center gap-4 ${
          isDarkMode ? 'text-pearl-white/50' : 'text-gray-500'
        }`}>
          <span>💡 Keyboard Shortcuts:</span>
          <span><kbd className={`px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`}>Tab</kbd> Navigate fields</span>
          <span><kbd className={`px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`}>Enter</kbd> Search</span>
          <span><kbd className={`px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`}>Esc</kbd> Go back</span>
        </div>
      </form>

      {searchPerformed && (
        <div>
          <div className={`${
            isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
          } rounded-t-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3`}>
            <div className="flex items-center gap-3">
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                Search Results ({results.length})
              </h2>
              {cacheHit && (
                <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-500 text-xs font-semibold">
                  From Cache
                </span>
              )}
            </div>

            {results.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className={`text-sm font-semibold ${
                    isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                  }`}
                >
                  {selectedStores.length === results.filter(s => !s.in_database).length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>

                <motion.button
                  onClick={handleAddToDatabase}
                  disabled={selectedStores.length === 0 || addingStores}
                  whileHover={{ scale: (selectedStores.length === 0 || addingStores) ? 1 : 1.02 }}
                  whileTap={{ scale: (selectedStores.length === 0 || addingStores) ? 1 : 0.98 }}
                  className={`px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold flex items-center gap-2 ${
                    selectedStores.length === 0 || addingStores ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {addingStores ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Add {selectedStores.length} to Database
                    </>
                  )}
                </motion.button>

                <motion.button
                  onClick={handleCreateRouteWithStores}
                  disabled={selectedForRoute.length === 0}
                  whileHover={{ scale: selectedForRoute.length === 0 ? 1 : 1.02 }}
                  whileTap={{ scale: selectedForRoute.length === 0 ? 1 : 0.98 }}
                  className={`px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold flex items-center gap-2 ${
                    selectedForRoute.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <MapPin size={16} />
                  Create Route ({selectedForRoute.length})
                </motion.button>
              </div>
            )}
          </div>

          {/* NEW: Tier Criteria Information Card */}
          {Object.keys(tierBreakdown).length > 0 && (
            <TierCriteriaInfo />
          )}

          {/* NEW: Tier Filter Buttons */}
          {Object.keys(tierBreakdown).length > 0 && (
            <div className={`${
              isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
            } border-t-0 p-4`}>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-pearl-white/70' : 'text-gray-700'}`}>
                    Filter by Potential:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setTierFilter(null)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      tierFilter === null
                        ? isDarkMode
                          ? 'bg-purple-500/30 text-purple-300 border-2 border-purple-400'
                          : 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                        : isDarkMode
                        ? 'bg-white/5 text-pearl-white/60 border border-white/10 hover:bg-white/10'
                        : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    All Shops ({(tierBreakdown.TIER1 || 0) + (tierBreakdown.TIER2 || 0) + (tierBreakdown.TIER3 || 0) + (tierBreakdown.TIER4 || 0)})
                  </button>
                  <button
                    onClick={() => setTierFilter('TIER1')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-1 ${
                      tierFilter === 'TIER1'
                        ? 'bg-green-500/30 text-green-300 border-2 border-green-400'
                        : 'bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20'
                    }`}
                  >
                    ⭐ TIER 1 ({tierBreakdown.TIER1 || 0})
                  </button>
                  <button
                    onClick={() => setTierFilter('TIER2')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-1 ${
                      tierFilter === 'TIER2'
                        ? 'bg-yellow-500/30 text-yellow-300 border-2 border-yellow-400'
                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20'
                    }`}
                  >
                    🟡 TIER 2 ({tierBreakdown.TIER2 || 0})
                  </button>
                  <button
                    onClick={() => setTierFilter('TIER3')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-1 ${
                      tierFilter === 'TIER3'
                        ? 'bg-orange-500/30 text-orange-300 border-2 border-orange-400'
                        : 'bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20'
                    }`}
                  >
                    🔶 TIER 3 ({tierBreakdown.TIER3 || 0})
                  </button>
                  <button
                    onClick={() => setTierFilter('TIER4')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-1 ${
                      tierFilter === 'TIER4'
                        ? 'bg-red-500/30 text-red-300 border-2 border-red-400'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                    }`}
                  >
                    ❌ TIER 4 ({tierBreakdown.TIER4 || 0})
                  </button>
                </div>
                
                {/* Sort Options */}
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-pearl-white/70' : 'text-gray-700'}`}>
                    Sort by:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                      isDarkMode
                        ? 'bg-white/5 border-white/10 text-pearl-white [&>option]:bg-gray-800 [&>option]:text-pearl-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  >
                    <option value="tier">Tier (Best First)</option>
                    <option value="rating">Rating (Highest First)</option>
                    <option value="distance">Distance (Closest First)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className={`${
              isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
            } border-t-0 rounded-b-2xl p-8 text-center`}>
              <RefreshCw className={`animate-spin mx-auto mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`} size={32} />
              <p className={isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}>
                Searching stores...
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className={`${
              isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
            } border-t-0 rounded-b-2xl p-8 text-center`}>
              <AlertCircle className={`mx-auto mb-2 ${isDarkMode ? 'text-pearl-white/40' : 'text-gray-400'}`} size={48} />
              <p className={isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}>
                No stores found. Try adjusting your search criteria.
              </p>
            </div>
          ) : (
            <div className={`${
              isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
            } border-t-0 rounded-b-2xl overflow-hidden`}>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className={isDarkMode ? 'bg-white/5' : 'bg-gray-50'}>
                    <tr>
                      <th className="px-2 py-2 text-left w-10">
                        <input 
                          type="checkbox" 
                          className="rounded"
                          checked={selectedStores.length === results.filter(s => !s.in_database).length && results.filter(s => !s.in_database).length > 0}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th className={`px-2 py-2 text-center text-xs font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                        <span title="Select for route creation">📍 Route</span>
                      </th>
                      <th className={`px-2 py-2 text-left text-xs font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                        Tier
                      </th>
                      <th className={`px-2 py-2 text-left text-xs font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                        Store Name
                      </th>
                      <th className={`px-2 py-2 text-left text-xs font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                        Owner
                      </th>
                      <th className={`px-2 py-2 text-left text-xs font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                        Website
                      </th>
                      <th className={`px-2 py-2 text-left text-xs font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                        Phone
                      </th>
                      <th className={`px-2 py-2 text-left text-xs font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                        Address
                      </th>
                      <th className={`px-2 py-2 text-left text-xs font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                        Rating
                      </th>
                      <th className={`px-2 py-2 text-left text-xs font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((store) => (
                      <tr
                        key={store.google_place_id}
                        className={`border-t ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}
                      >
                        <td className="px-2 py-2">
                          <input
                            type="checkbox"
                            checked={selectedStores.includes(store.google_place_id)}
                            onChange={() => handleSelectStore(store.google_place_id)}
                            disabled={store.in_database}
                            className="rounded"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedForRoute.includes(store.google_place_id)}
                            onChange={() => toggleStoreForRoute(store.google_place_id)}
                            className="rounded"
                            title="Select for route creation"
                          />
                        </td>
                        <td className="px-2 py-2">
                          {store.tier && (
                            <div className="flex flex-col gap-0.5">
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold text-white w-fit"
                                style={{ backgroundColor: getTierColor(store.tier) }}
                              >
                                {getTierIcon(store.tier)} {store.tier}
                              </span>
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                                {store.qualification_score || 'N/A'}/100
                              </span>
                            </div>
                          )}
                        </td>
                        {/* Store Name */}
                        <td className="px-2 py-2">
                          <div>
                            <p className={`text-sm font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                              {store.store_name}
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                              {store.store_type}
                            </p>
                          </div>
                        </td>
                        
                        {/* Owner */}
                        <td className={`px-2 py-2 text-xs ${isDarkMode ? 'text-pearl-white/70' : 'text-gray-700'}`}>
                          {store.owner_name ? (
                            <div className="flex flex-col">
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                                {store.owner_name}
                              </span>
                              {store.owner_source && (
                                <span className={`text-xs ${isDarkMode ? 'text-pearl-white/40' : 'text-gray-500'}`}>
                                  ({store.owner_source})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className={`text-xs italic ${isDarkMode ? 'text-pearl-white/40' : 'text-gray-500'}`}>
                              N/A
                            </span>
                          )}
                        </td>
                        
                        {/* Website */}
                        <td className={`px-2 py-2 text-xs ${isDarkMode ? 'text-pearl-white/70' : 'text-gray-700'}`}>
                          {store.website ? (
                            <div className="flex items-center gap-1">
                              <a
                                href={store.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${
                                  isDarkMode 
                                    ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                                    : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200'
                                }`}
                              >
                                🌐
                              </a>
                            </div>
                          ) : (
                            <span className={`text-xs italic ${isDarkMode ? 'text-pearl-white/40' : 'text-gray-500'}`}>
                              N/A
                            </span>
                          )}
                        </td>
                        
                        {/* Phone */}
                        <td className={`px-2 py-2 text-xs ${isDarkMode ? 'text-pearl-white/70' : 'text-gray-700'}`}>
                          {store.phone ? (
                            <div className="flex items-center gap-1">
                              <a
                                href={`tel:${store.phone}`}
                                className={`inline-flex items-center gap-1 font-mono text-xs ${
                                  isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                                }`}
                              >
                                <Phone size={10} />
                                {store.phone.slice(-4)}
                              </a>
                            </div>
                          ) : (
                            <span className={`text-xs italic ${isDarkMode ? 'text-pearl-white/40' : 'text-gray-500'}`}>
                              N/A
                            </span>
                          )}
                        </td>
                        
                        {/* Address */}
                        <td className={`px-2 py-2 text-xs ${isDarkMode ? 'text-pearl-white/70' : 'text-gray-700'}`}>
                          <div className="flex items-start gap-1 max-w-xs">
                            <MapPin size={10} className="mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2 text-xs">{store.address}</span>
                          </div>
                        </td>
                        
                        {/* Rating */}
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                            <span className={`text-xs font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                              {store.avg_rating ? store.avg_rating.toFixed(1) : 'N/A'}
                            </span>
                            {store.google_reviews_count > 0 && (
                              <span className={`text-xs ${isDarkMode ? 'text-pearl-white/40' : 'text-gray-500'}`}>
                                ({store.google_reviews_count})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          {store.in_database ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-500 text-xs font-semibold">
                              <CheckCircle size={10} />
                              In DB
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-500 text-xs font-semibold">
                              New
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-gray-200" style={{borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : undefined}}>
                {results.map((store) => (
                  <div key={store.google_place_id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={selectedStores.includes(store.google_place_id)}
                            onChange={() => handleSelectStore(store.google_place_id)}
                            disabled={store.in_database}
                            className="rounded"
                            title="Add to database"
                          />
                          <span className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>DB</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={selectedForRoute.includes(store.google_place_id)}
                            onChange={() => toggleStoreForRoute(store.google_place_id)}
                            className="rounded"
                            title="Select for route creation"
                          />
                          <span className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>📍</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className={`font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                            {store.store_name}
                          </h3>
                          {store.in_database ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-semibold whitespace-nowrap ml-2">
                              <CheckCircle size={12} />
                              In DB
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-500 text-xs font-semibold whitespace-nowrap ml-2">
                              New
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mb-2 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                          {store.address}
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                            <span className={isDarkMode ? 'text-pearl-white' : 'text-gray-900'}>
                              {store.avg_rating.toFixed(1)}
                            </span>
                          </div>
                          {store.phone && (
                            <div className={`flex items-center gap-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                              <Phone size={12} />
                              {store.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* NEW: Testing Section */}
          {searchPerformed && results.length > 0 && (
            <ScoringBreakdownPanel results={results} />
          )}
        </div>
      )}

      {/* Cost Confirmation Modal */}
      {showCostConfirmModal && budgetInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-md rounded-2xl shadow-2xl ${
              isDarkMode 
                ? 'bg-gray-800 border border-white/10' 
                : 'bg-white border border-gray-200'
            }`}
          >
            {/* Modal Header */}
            <div className={`p-6 border-b ${
              isDarkMode ? 'border-white/10' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-xl font-bold flex items-center gap-2 ${
                  isDarkMode ? 'text-pearl-white' : 'text-gray-900'
                }`}>
                  <span>🔍</span> Confirm Search
                </h3>
                <button
                  onClick={() => setShowCostConfirmModal(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'hover:bg-white/10 text-pearl-white/60' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Search Details */}
              <div className={`p-4 rounded-lg ${
                isDarkMode ? 'bg-white/5' : 'bg-gray-50'
              }`}>
                <p className={`text-sm mb-2 ${
                  isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'
                }`}>
                  Search Details:
                </p>
                <div className="space-y-1">
                  <p className={`text-sm ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                    <strong>Query:</strong> {searchQuery}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                    <strong>Location:</strong> New Delhi{area ? `, ${area}` : ''}
                  </p>
                  {pincode && (
                    <p className={`text-sm ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      <strong>Pincode:</strong> {pincode}
                    </p>
                  )}
                  <p className={`text-sm ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                    <strong>Radius:</strong> {radius} km
                  </p>
                </div>
              </div>

              {/* Cost Estimate - Shows if query is cached or not */}
              {searchCacheStatus && searchCacheStatus.exists ? (
                // CACHED - Show green box with Safe to Search badge
                <div className={`p-4 rounded-lg border-2 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/50' 
                    : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400'
                }`}>
                  {/* Safe to Search Badge at Top */}
                  <div className={`flex items-center justify-center gap-2 mb-3 px-3 py-1.5 rounded-full ${
                    isDarkMode ? 'bg-green-500/30' : 'bg-green-200'
                  }`}>
                    <CheckCircle size={16} className={isDarkMode ? 'text-green-300' : 'text-green-700'} />
                    <span className={`text-xs font-bold uppercase tracking-wide ${
                      isDarkMode ? 'text-green-300' : 'text-green-700'
                    }`}>
                      ✅ Safe to Search
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">⚡</span>
                    <h4 className={`text-sm font-bold ${
                      isDarkMode ? 'text-green-400' : 'text-green-700'
                    }`}>
                      {searchCacheStatus.source === 'database' 
                        ? 'IN DATABASE CACHE (PERSISTENT)' 
                        : 'THIS QUERY IS CACHED!'}
                    </h4>
                  </div>
                  
                  {/* Show cache source */}
                  {searchCacheStatus.source === 'database' && (
                    <p className={`text-xs mb-2 ${
                      isDarkMode ? 'text-green-300/80' : 'text-green-600'
                    }`}>
                      💾 Saved from previous searches - survives deployments
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold ${
                      isDarkMode ? 'text-green-400' : 'text-green-700'
                    }`}>
                      Cost:
                    </span>
                    <span className={`text-2xl font-bold ${
                      isDarkMode ? 'text-green-300' : 'text-green-700'
                    }`}>
                      ₹0 ✅
                    </span>
                  </div>
                  {searchCacheStatus.metadata && (
                    <div className={`space-y-1 text-xs ${
                      isDarkMode ? 'text-green-300/80' : 'text-green-700/80'
                    }`}>
                      <p>• Results will load instantly from cache</p>
                      <p>• No API call required</p>
                      <p>• Cache age: {searchCacheStatus.metadata.age_minutes || 0} minutes</p>
                    </div>
                  )}
                </div>
              ) : (
                // NOT CACHED - Show orange box
                <div className={`p-4 rounded-lg border-2 ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/50' 
                    : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-400'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🔍</span>
                    <h4 className={`text-sm font-bold ${
                      isDarkMode ? 'text-orange-400' : 'text-orange-700'
                    }`}>
                      NEW SEARCH REQUIRED
                    </h4>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold ${
                      isDarkMode ? 'text-orange-400' : 'text-orange-700'
                    }`}>
                      Estimated Cost:
                    </span>
                    <span className={`text-2xl font-bold ${
                      isDarkMode ? 'text-orange-300' : 'text-orange-700'
                    }`}>
                      ₹{estimatedCost.toFixed(2)}
                    </span>
                  </div>
                  <div className={`space-y-1 text-xs ${
                    isDarkMode ? 'text-orange-300/80' : 'text-orange-700/80'
                  }`}>
                    <p>• This query is not in cache</p>
                    <p>• Will make API call to Google Places</p>
                    <p>• Results will be cached for future use</p>
                  </div>
                </div>
              )}

              {/* Budget Status - Only show if NOT cached (cached queries are free) */}
              {!(searchCacheStatus && searchCacheStatus.exists) && (
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-white/5' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${
                      isDarkMode ? 'text-pearl-white/70' : 'text-gray-700'
                    }`}>
                      Budget Remaining:
                    </span>
                    <span className={`text-lg font-bold ${
                      isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      ₹{(budgetInfo.monthlyBudget - budgetInfo.usedThisMonth).toFixed(2)}
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${
                    (budgetInfo.usedThisMonth / budgetInfo.monthlyBudget) < 0.8 
                      ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                      : (isDarkMode ? 'text-yellow-400' : 'text-yellow-600')
                  }`}>
                    <CheckCircle size={16} />
                    <span className="font-semibold">
                      {(budgetInfo.usedThisMonth / budgetInfo.monthlyBudget) < 0.8 
                        ? '✅ SAFE TO SEARCH' 
                        : '⚠️ APPROACHING BUDGET LIMIT'
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`p-6 border-t flex gap-3 ${
              isDarkMode ? 'border-white/10' : 'border-gray-200'
            }`}>
              <button
                onClick={() => setShowCostConfirmModal(false)}
                tabIndex={2}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                  isDarkMode 
                    ? 'bg-white/5 hover:bg-white/10 text-pearl-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCostConfirmModal(false);
                  handleSearch();
                }}
                tabIndex={1}
                autoFocus
                className={`flex-1 px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all ${
                  searchCacheStatus && searchCacheStatus.exists
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500'
                } text-white`}
              >
                {searchCacheStatus && searchCacheStatus.exists ? (
                  <>⚡ Get Cached Results</>
                ) : (
                  <>Proceed with Search</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default SearchStoresPage;
