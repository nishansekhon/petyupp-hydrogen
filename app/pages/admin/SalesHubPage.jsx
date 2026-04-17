import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { 
  Search, Store, MapPin, TrendingUp, DollarSign, Users, RefreshCw, 
  Filter, ChevronLeft, ChevronRight, Star, Phone, X, Plus, CheckCircle,
  AlertCircle, ExternalLink, Target, Zap, Calendar, BarChart3, Eye, IndianRupee, Check,
  Route, Receipt, Edit3, ShoppingCart, CheckCircle2, MessageCircle, Handshake, List, LayoutGrid
} from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';

// Import shared hooks and components
import { useStoreSearch, useTierFilter, useStoreSelection } from '@/hooks';
import { StoreCard, TierFilterBar } from '@/components/retail';
import { getTierColor, getTierIcon, getStoreId } from '@/utils/storeUtils';

// Import Sales modals for inline editing
import { EditEcommerceDataModal, RetailDataModal, RevenueTargetModal } from '@/components/sales';

// Import extracted tab components
import { HuntTab, StoresTab, RoutesTab, PipelineTab, PartnersTab, DailySalesTab } from '@/components/admin/sales';
import ReportsTab from '@/components/sales/ReportsTab';
import PartnerStockTab from '@/components/sales/PartnerStockTab';
import EditPartnerModal from '@/components/sales/EditPartnerModal';
import ShoutoutGeneratorModal from '@/components/sales/ShoutoutGeneratorModal';

const API_URL = API_BASE_URL + '/api';

// Delhi NCR Areas for autocomplete
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

// Note: getTierColor and getTierIcon are now imported from @/utils/storeUtils

const SalesHubPage = () => {
  const { isDarkMode } = useAdminTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'hunt');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Global Stats with period support
  const [globalStats, setGlobalStats] = useState({
    totalStores: 0, partnersAdded: 0, targetPercent: 0, targetGoal: 0, ecomRevenue: 0, retailRevenue: 0
  });
  const [statsView, setStatsView] = useState('monthly'); // daily, weekly, monthly, quarterly, yearly, ytd
  const [statsDate, setStatsDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Tab-specific states
  const [huntData, setHuntData] = useState({ budgetInfo: null, cacheStats: null, searchResults: [], recentSearches: [] });
  const [storesData, setStoresData] = useState({ stores: [], totalStores: 0, tierCounts: {} });
  const [routesData, setRoutesData] = useState({ routes: [], stats: {} });
  const [pipelineData, setPipelineData] = useState({ funnel: {}, conversions: {}, activeStores: [] });
  const [intelligenceData, setIntelligenceData] = useState({ summary: null, ecomData: null, retailData: null });

  // Filters & Pagination
  const [storeFilters, setStoreFilters] = useState({ zone: '', area: '', status: '', tier: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [routeFilters, setRouteFilters] = useState({ date: '', status: '' });

  // Search form state
  const [searchForm, setSearchForm] = useState({
    query: 'pet store', state: 'New Delhi', pincode: '110018', area: 'Tilak Nagar', radius: 5
  });
  const [isSearching, setIsSearching] = useState(false);
  
  // Area autocomplete state
  const [areaList, setAreaList] = useState(DELHI_AREAS);
  const [filteredAreas, setFilteredAreas] = useState([]);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  
  // Results view state - compact (6 cards) or full (all cards with filters)
  const [resultsViewMode, setResultsViewMode] = useState('full'); // Default to Full View for better visibility
  const [tierFilter, setTierFilter] = useState('all');
  const [selectedStores, setSelectedStores] = useState([]);
  const [showTierGuide, setShowTierGuide] = useState(false);
  const [viewType, setViewType] = useState('list'); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState({ field: 'tier', direction: 'asc' }); // sorting
  const [showGoogleSearchButton, setShowGoogleSearchButton] = useState(false); // DB-first: show Google search option
  const [isGoogleSearching, setIsGoogleSearching] = useState(false); // Loading state for Google search

  // Daily Sales Tab - Date selector and modal states
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // YYYY-MM-DD format in local timezone
  });
  const [dailySalesData, setDailySalesData] = useState({ ecom: null, retail: null });
  const [showECommerceModal, setShowECommerceModal] = useState(false);
  const [showRetailModal, setShowRetailModal] = useState(false);
  const [dailySalesLoading, setDailySalesLoading] = useState(false);

  // Partners Tab states
  const [partners, setPartners] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [partnersStats, setPartnersStats] = useState({ total: 0, newThisMonth: 0, active: 0, revenueThisMonth: 0 });
  const [partnersSearch, setPartnersSearch] = useState('');
  const [partnersFilter, setPartnersFilter] = useState('all');
  
  // Edit Partner Modal state
  const [showEditPartnerModal, setShowEditPartnerModal] = useState(false);
  const [selectedPartnerForEdit, setSelectedPartnerForEdit] = useState(null);
  const [productsForModal, setProductsForModal] = useState([]);
  
  // Shoutout Generator Modal state
  const [showShoutoutModal, setShowShoutoutModal] = useState(false);
  const [selectedPartnerForShoutout, setSelectedPartnerForShoutout] = useState(null);

  // Weekly Overview states
  const [weeklyOverview, setWeeklyOverview] = useState(null);
  const [weeklyOverviewLoading, setWeeklyOverviewLoading] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);

  // View By dropdown state for Daily Sales tab
  const [viewBy, setViewBy] = useState('daily'); // 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'ytd'
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    // Find the Sunday of the current week
    const day = now.getDay();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - day);
    sunday.setHours(0, 0, 0, 0);
    
    // Calculate week number based on Sunday-Saturday weeks
    const year = now.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const daysSinceJan1 = Math.floor((sunday - jan1) / 86400000);
    const weekNum = Math.floor(daysSinceJan1 / 7) + 1;
    
    // Zero-pad week number for consistent format (W01, W02, etc.)
    return `${year}-W${String(weekNum).padStart(2, '0')}`;
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedQuarter, setSelectedQuarter] = useState(() => {
    const now = new Date();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    return `${now.getFullYear()}-Q${quarter}`;
  });
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  // Generate week options for current year (Sunday-Saturday format)
  const getWeekOptions = () => {
    const options = [];
    const now = new Date();
    const year = now.getFullYear();
    
    // Start from Jan 1st of the year
    const jan1 = new Date(year, 0, 1);
    
    // Week 1 always starts Jan 1 (even if partial)
    let weekStart = new Date(jan1);
    let weekNum = 1;
    
    // Calculate end of week 1 (next Saturday after Jan 1, or Jan 1 if it's Saturday)
    let weekEnd;
    if (jan1.getDay() === 6) {
      // Jan 1 is Saturday - Week 1 is just Jan 1
      weekEnd = new Date(jan1);
    } else {
      // Week 1 ends on the first Saturday
      weekEnd = new Date(jan1);
      weekEnd.setDate(jan1.getDate() + (6 - jan1.getDay()));
    }
    
    // Add Week 1 (with zero-padded week number)
    options.push({
      value: `${year}-W${String(weekNum).padStart(2, '0')}`,
      label: `Week ${weekNum} (${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
    });
    
    // Generate remaining weeks (Sunday-Saturday)
    weekNum++;
    weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() + 1); // Move to Sunday
    
    while (weekStart.getFullYear() === year) {
      weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Saturday
      
      // Don't include weeks that start in next year
      if (weekStart.getFullYear() !== year) break;
      
      // Zero-pad week number for consistent format
      options.push({
        value: `${year}-W${String(weekNum).padStart(2, '0')}`,
        label: `Week ${weekNum} (${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
      });
      
      weekNum++;
      weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() + 1); // Move to next Sunday
    }
    
    // Return in reverse order (most recent first)
    return options.reverse();
  };

  // Generate month options
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      options.push({
        value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });
    }
    return options;
  };

  // Generate quarter options
  const getQuarterOptions = () => {
    const options = [];
    const now = new Date();
    const year = now.getFullYear();
    for (let y = year; y >= year - 1; y--) {
      for (let q = 4; q >= 1; q--) {
        if (y === year && q > Math.ceil((now.getMonth() + 1) / 3)) continue;
        const months = ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec'];
        options.push({
          value: `${y}-Q${q}`,
          label: `Q${q} ${y} (${months[q - 1]})`
        });
      }
    }
    return options;
  };

  // Generate year options
  const getYearOptions = () => {
    const options = [];
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= currentYear - 2; y--) {
      options.push({
        value: y,
        label: `${y}`
      });
    }
    return options;
  };

  // Get label for current view period
  const getViewLabel = () => {
    switch (viewBy) {
      case 'daily': return formatDateDisplay(selectedDate);
      case 'weekly': {
        const opt = getWeekOptions().find(o => o.value === selectedWeek);
        return opt ? opt.label : selectedWeek;
      }
      case 'monthly': {
        const opt = getMonthOptions().find(o => o.value === selectedMonth);
        return opt ? opt.label : selectedMonth;
      }
      case 'quarterly': {
        const opt = getQuarterOptions().find(o => o.value === selectedQuarter);
        return opt ? opt.label : selectedQuarter;
      }
      case 'yearly': {
        return `Jan 1 - Dec 31, ${selectedYear}`;
      }
      case 'ytd': {
        const now = new Date();
        return `Jan 1 - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${now.getFullYear()}`;
      }
      default: return 'Today';
    }
  };

  // Get period key for API calls
  const getPeriodKey = () => {
    switch (viewBy) {
      case 'daily': return selectedDate;
      case 'weekly': return selectedWeek;
      case 'monthly': return selectedMonth;
      case 'quarterly': return selectedQuarter;
      case 'yearly': return `${selectedYear}`;
      case 'ytd': return `${new Date().getFullYear()}-YTD`;
      default: return selectedDate;
    }
  };

  // Helper: Get today's date in YYYY-MM-DD format (local timezone)
  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper: Parse YYYY-MM-DD string to Date object (avoiding timezone issues)
  const parseDateString = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Helper: Format date for display
  const formatDateDisplay = (dateStr) => {
    const date = parseDateString(dateStr);
    const today = new Date();
    const todayStr = getLocalDateString(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);
    
    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Navigate dates
  const navigateDate = (direction) => {
    const date = parseDateString(selectedDate);
    date.setDate(date.getDate() + direction);
    const today = new Date();
    if (date <= today) {
      setSelectedDate(getLocalDateString(date));
    }
  };

  // Current period object for modals
  const currentPeriod = {
    value: selectedDate,
    label: formatDateDisplay(selectedDate),
    start: parseDateString(selectedDate),
    end: parseDateString(selectedDate)
  };

  // Tab configuration with Lucide React icons
  const tabs = [
    { id: 'hunt', Icon: Search, label: 'Hunt' },
    { id: 'stores', Icon: Store, label: 'Stores' },
    { id: 'routes', Icon: Route, label: 'Routes' },
    { id: 'partners', Icon: Handshake, label: 'Partners' },
    { id: 'dailysales', Icon: IndianRupee, label: 'Daily Sales' },
    { id: 'partner-stock', Icon: Receipt, label: 'Partner Stock' },
    { id: 'reports', Icon: BarChart3, label: 'Reports' },
  ];

  // Calculate tier counts from search results
  const getTierCounts = (results) => {
    if (!results || results.length === 0) return { tier1: 0, tier2: 0, tier3: 0, tier4: 0 };
    return {
      tier1: results.filter(s => s.tier === 'TIER1' || s.tier === 1).length,
      tier2: results.filter(s => s.tier === 'TIER2' || s.tier === 2).length,
      tier3: results.filter(s => s.tier === 'TIER3' || s.tier === 3).length,
      tier4: results.filter(s => s.tier === 'TIER4' || s.tier === 4).length,
    };
  };

  // Filter results by tier
  const getFilteredResults = (results, filter) => {
    if (!results || filter === 'all') return results || [];
    const tierMap = { 1: ['TIER1', 1], 2: ['TIER2', 2], 3: ['TIER3', 3], 4: ['TIER4', 4] };
    const validTiers = tierMap[filter] || [];
    return results.filter(s => validTiers.includes(s.tier));
  };

  // Toggle store selection
  const toggleStoreSelection = (storeId) => {
    setSelectedStores(prev =>
      prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]
    );
  };

  // Select all visible stores
  const selectAllVisible = () => {
    const filtered = getFilteredResults(huntData.searchResults, tierFilter);
    const ids = filtered.map(s => s.place_id || s.id || s.store_name);
    setSelectedStores(ids);
  };

  // Clear selection
  const clearSelection = () => setSelectedStores([]);

  // State for adding stores to database
  const [isAddingToDB, setIsAddingToDB] = useState(false);

  // Sort stores by field
  const sortStores = (stores, sortConfig) => {
    if (!sortConfig.field) return stores;
    
    return [...stores].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortConfig.field) {
        case 'name':
          aVal = (a.store_name || '').toLowerCase();
          bVal = (b.store_name || '').toLowerCase();
          break;
        case 'tier':
          const tierOrder = { 'TIER1': 1, 'TIER2': 2, 'TIER3': 3, 'TIER4': 4 };
          aVal = tierOrder[a.tier] || 5;
          bVal = tierOrder[b.tier] || 5;
          break;
        case 'rating':
          aVal = a.avg_rating || 0;
          bVal = b.avg_rating || 0;
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (field) => {
    setSortBy(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Add selected stores to database
  const handleAddToDatabase = async () => {
    if (selectedStores.length === 0) {
      alert('No stores selected');
      return;
    }

    setIsAddingToDB(true);

    try {
      const token = localStorage.getItem('adminToken');
      
      // Get full store data for selected stores
      const selectedStoreData = huntData.searchResults
        .filter(store => selectedStores.includes(store.place_id || store.id || store.store_name))
        .map(store => ({
          google_place_id: store.place_id || store.google_place_id,
          store_name: store.name || store.store_name,
          address: store.formatted_address || store.address,
          latitude: store.geometry?.location?.lat || store.latitude,
          longitude: store.geometry?.location?.lng || store.longitude,
          phone: store.formatted_phone_number || store.phone || null,
          website: store.website || null,
          avg_rating: store.rating || store.avg_rating || 0,
          google_reviews_count: store.user_ratings_total || store.google_reviews_count || 0,
          store_type: 'pet_shop',
          opening_hours: store.opening_hours || null
        }));

      if (selectedStoreData.length === 0) {
        alert('Could not find store data for selected stores');
        setIsAddingToDB(false);
        return;
      }

      const response = await fetch(`${API_URL}/retail/stores/add-multiple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          stores: selectedStoreData,
          area: searchForm.area || 'Unknown',
          zone: searchForm.state || 'Delhi NCR',
          priority_level: 'medium'
        })
      });

      const result = await response.json();

      if (result.success) {
        // Mark added stores as "in_database" in the UI
        setHuntData(prev => ({
          ...prev,
          searchResults: prev.searchResults.map(store => {
            const storeId = store.place_id || store.id || store.store_name;
            if (selectedStores.includes(storeId)) {
              return { ...store, in_database: true };
            }
            return store;
          })
        }));

        // Clear selection
        setSelectedStores([]);

        // Show success message
        alert(`✅ ${result.stores_added} stores added to database${result.stores_skipped > 0 ? `. ${result.stores_skipped} were already in database.` : ''}`);
      } else {
        alert('Failed to add stores: ' + (result.detail || result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding stores to database:', error);
      alert('Failed to add stores to database. Please try again.');
    } finally {
      setIsAddingToDB(false);
    }
  };

  // Load areas from API on mount
  useEffect(() => {
    loadAllAreas();
  }, []);

  const loadAllAreas = async () => {
    try {
      const response = await axios.get(`${API_URL}/areas-list`);
      const areas = response.data.areas?.map(a => ({
        name: a.area,
        pincode: a.pincode
      })) || [];
      
      if (areas.length > 0) {
        setAreaList(areas);
      }
    } catch (error) {
      console.log('Using fallback area list');
    }
  };

  // Area input change handler with autocomplete
  const handleAreaInputChange = (value) => {
    setSearchForm(prev => ({ ...prev, area: value }));
    
    if (value.length > 0) {
      const filtered = areaList.filter(a =>
        a.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredAreas(filtered.slice(0, 8));
      setShowAreaDropdown(filtered.length > 0);
    } else {
      setFilteredAreas([]);
      setShowAreaDropdown(false);
    }
  };

  // Select area from dropdown
  const selectArea = (selectedArea) => {
    setSearchForm(prev => ({ ...prev, area: selectedArea.name, pincode: selectedArea.pincode }));
    setShowAreaDropdown(false);
  };

  // Area search handler (alias for handleAreaInputChange for compatibility)
  const handleAreaSearch = handleAreaInputChange;

  // Add store to database from search results
  const handleAddStore = async (store) => {
    try {
      const token = localStorage.getItem('adminToken');
      // Classify phone type
      const classifyPhoneType = (phone) => {
        if (!phone) return 'landline';
        const cleaned = phone.replace(/^\+91|[\s\-\(\)]/g, '');
        return (cleaned.length === 10 && /^[6789]/.test(cleaned)) ? 'mobile' : 'landline';
      };
      
      const payload = {
        store_name: store.store_name,
        address: store.address,
        phone: store.phone,
        place_id: store.place_id,
        avg_rating: store.avg_rating,
        tier: store.tier,
        area: store.area || searchForm.area,
        zone: store.zone || 'West Delhi',
        latitude: store.latitude,
        longitude: store.longitude,
        category: store.category || searchForm.category || 'pet_store',
        phone_type: classifyPhoneType(store.phone)
      };
      const response = await axios.post(`${API_URL}/retail/stores`, payload, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (response.data.success) {
        // Show success toast
        toast.success(`${store.store_name || 'Store'} added to database!`);
        
        // IMMEDIATELY update local state to show "In Database" without re-fetching
        setHuntData(prev => ({
          ...prev,
          searchResults: prev.searchResults.map(s =>
            (s.place_id === store.place_id || s.id === store.place_id)
              ? {...s, in_database: true, inDatabase: true}
              : s
          )
        }));
        
        return true;
      } else {
        toast.error(response.data.error || 'Failed to add store');
        return false;
      }
    } catch (error) {
      console.error('Failed to add store:', error);
      toast.error('Failed to add store');
      return false;
    }
  };

  // Add multiple selected stores to database
  const handleAddSelectedToDatabase = async () => {
    try {
      const storesToAdd = huntData.searchResults.filter(
        store => selectedStores.includes(store.place_id || store.id) && !store.in_database
      );
      
      if (storesToAdd.length === 0) {
        toast.info('All selected stores are already in database');
        return;
      }
      
      // Classify phone type helper
      const classifyPhoneType = (phone) => {
        if (!phone) return 'landline';
        const cleaned = phone.replace(/^\+91|[\s\-\(\)]/g, '');
        return (cleaned.length === 10 && /^[6789]/.test(cleaned)) ? 'mobile' : 'landline';
      };
      
      let addedCount = 0;
      const addedPlaceIds = [];
      
      for (const store of storesToAdd) {
        const token = localStorage.getItem('adminToken');
        try {
          const response = await axios.post(`${API_URL}/retail/stores`, {
            store_name: store.store_name,
            address: store.address,
            phone: store.phone,
            place_id: store.place_id,
            avg_rating: store.avg_rating,
            tier: store.tier,
            area: store.area || searchForm.area,
            zone: store.zone || 'West Delhi',
            latitude: store.latitude,
            longitude: store.longitude,
            category: store.category || searchForm.category || 'pet_store',
            phone_type: classifyPhoneType(store.phone)
          }, { headers: { Authorization: `Bearer ${token}` } });
          
          if (response.data.success) {
            addedCount++;
            addedPlaceIds.push(store.place_id);
          }
        } catch (e) {
          console.error('Failed to add store:', store.store_name, e);
        }
      }
      
      if (addedCount > 0) {
        toast.success(`${addedCount} store${addedCount !== 1 ? 's' : ''} added to database!`);
        
        // IMMEDIATELY update local state for all added stores
        setHuntData(prev => ({
          ...prev,
          searchResults: prev.searchResults.map(s =>
            addedPlaceIds.includes(s.place_id)
              ? {...s, in_database: true, inDatabase: true}
              : s
          )
        }));
      }
      
      setSelectedStores([]);
    } catch (error) {
      console.error('Failed to add selected stores:', error);
      toast.error('Failed to add stores');
    }
  };

  // Update URL when tab changes
  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  // Fetch global stats on mount
  useEffect(() => {
    fetchGlobalStats();
    fetchTabData(activeTab);
  }, []);

  // Fetch tab-specific data when tab changes
  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab, currentPage, storeFilters, routeFilters]);

  const fetchGlobalStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Fetch hub stats with period filter
      const hubStatsRes = await fetch(`${API_URL}/admin/sales/hub-stats?view=${statsView}&date=${statsDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json());
      
      if (hubStatsRes.success) {
        setGlobalStats({
          totalStores: hubStatsRes.total_stores || 0,
          partnersAdded: hubStatsRes.partners_added || 0,
          targetPercent: hubStatsRes.target_percent || 0,
          targetGoal: hubStatsRes.target_goal || 0,
          ecomRevenue: hubStatsRes.ecom_revenue || 0,
          retailRevenue: hubStatsRes.retail_revenue || 0,
          periodLabel: hubStatsRes.period?.label || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch global stats:', error);
    }
  };
  
  // Refetch stats when view or date changes
  useEffect(() => {
    fetchGlobalStats();
  }, [statsView, statsDate]);

  const fetchTabData = async (tab) => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');

    try {
      switch (tab) {
        case 'hunt':
          await fetchHuntData(token);
          break;
        case 'stores':
          await fetchStoresData(token);
          break;
        case 'routes':
          await fetchRoutesData(token);
          break;
        case 'intelligence':
          await fetchIntelligenceData();
          break;
      }
    } catch (error) {
      console.error(`Failed to fetch ${tab} data:`, error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHuntData = async (token) => {
    try {
      const [usageRes, cacheRes] = await Promise.all([
        axios.get(`${API_URL}/admin/api-usage/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/admin/cache/performance`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const googlePlacesStats = usageRes.data.stats?.google_places || {};
      const cachePerf = cacheRes.data.metrics?.cache_performance || {};

      setHuntData(prev => ({
        ...prev,
        budgetInfo: {
          monthlyBudget: googlePlacesStats.monthly_budget_inr || 5000,
          usedThisMonth: googlePlacesStats.cost_this_month_inr || 0,
          callsThisMonth: googlePlacesStats.calls_this_month || 0,
          costPerCall: 2.66
        },
        cacheStats: {
          hitRate: cachePerf.cache_hit_rate || 0,
          callsReduced: cachePerf.api_calls_reduced_percent || 0
        }
      }));
    } catch (error) {
      console.error('Failed to fetch hunt data:', error);
    }
  };

  const fetchStoresData = async (token, searchQuery = '') => {
    try {
      const params = new URLSearchParams({ limit: '20', offset: String((currentPage - 1) * 20) });
      if (storeFilters.zone) params.append('zone', storeFilters.zone);
      if (storeFilters.area) params.append('area', storeFilters.area);
      if (storeFilters.status) params.append('status', storeFilters.status);
      if (searchQuery) params.append('search', searchQuery);

      const response = await axios.get(`${API_URL}/retail/stores?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const stores = response.data.stores || [];
      const tierCounts = {
        tier1: stores.filter(s => s.tier === 'TIER1' || s.tier === 'TIER 1').length,
        tier2: stores.filter(s => s.tier === 'TIER2' || s.tier === 'TIER 2').length,
        tier3: stores.filter(s => s.tier === 'TIER3' || s.tier === 'TIER 3').length,
        tier4: stores.filter(s => s.tier === 'TIER4' || s.tier === 'TIER 4').length
      };
      
      // Calculate status counts for funnel
      const statusCounts = response.data.status_counts || {
        discovered: stores.filter(s => s.status === 'discovered' || s.visit_status === 'not_visited').length,
        visited: stores.filter(s => s.status === 'visited' || s.visit_status === 'visited_interested').length,
        pitched: stores.filter(s => s.status === 'pitched').length,
        ordered: stores.filter(s => s.status === 'ordered').length,
        partner: stores.filter(s => s.status === 'partner' || s.visit_status === 'stocked').length,
        rejected: stores.filter(s => s.status === 'rejected' || s.visit_status === 'visited_declined').length
      };

      setStoresData({
        stores,
        totalStores: response.data.total_stores || stores.length,
        tierCounts,
        statusCounts
      });
    } catch (error) {
      console.error('Failed to fetch stores data:', error);
    }
  };

  const fetchRoutesData = async (token) => {
    try {
      const params = new URLSearchParams();
      if (routeFilters.date) params.append('date', routeFilters.date);
      if (routeFilters.status) params.append('status', routeFilters.status);

      const response = await fetch(`${API_URL}/retail/routes?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      const routes = data.routes || [];

      setRoutesData({
        routes,
        stats: {
          total: routes.length,
          assignedToday: routes.filter(r => r.route_status === 'assigned').length,
          inProgress: routes.filter(r => r.route_status === 'in_progress').length,
          completed: routes.filter(r => r.route_status === 'completed').length
        }
      });
    } catch (error) {
      console.error('Failed to fetch routes data:', error);
    }
  };

  const fetchPipelineData = async (token) => {
    try {
      const retailRes = await fetch(`${API_BASE_URL}/api/v1/sales/intelligence/retail`);
      const retailData = await retailRes.json();

      const storesRes = await axios.get(`${API_URL}/retail/stores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const stores = storesRes.data.stores || [];

      const visited = stores.filter(s => s.visit_status !== 'not_visited').length;
      const pitched = stores.filter(s => s.visit_status === 'visited_interested' || s.visit_status === 'stocked').length;
      const ordered = stores.filter(s => s.visit_status === 'stocked').length;

      setPipelineData({
        funnel: {
          totalStores: stores.length,
          visited,
          pitched,
          ordered,
          reorderRate: ordered > 0 ? 70 : 0
        },
        conversions: {
          visitToPitch: visited > 0 ? Math.round((pitched / visited) * 100) : 0,
          pitchToOrder: pitched > 0 ? Math.round((ordered / pitched) * 100) : 0,
          reorderRate: 70
        },
        activeStores: stores.filter(s => s.visit_status === 'stocked').slice(0, 5),
        pendingStores: stores.filter(s => s.visit_status === 'not_visited').length
      });
    } catch (error) {
      console.error('Failed to fetch pipeline data:', error);
    }
  };

  const fetchIntelligenceData = async () => {
    try {
      const [summaryRes, retailRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/sales/intelligence/summary`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/v1/sales/intelligence/retail`).then(r => r.json())
      ]);

      setIntelligenceData({
        summary: summaryRes,
        retailData: retailRes
      });
    } catch (error) {
      console.error('Failed to fetch intelligence data:', error);
    }
  };

  // Fetch weekly overview with targets and actuals
  const fetchWeeklyOverview = useCallback(async () => {
    setWeeklyOverviewLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/weekly-overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setWeeklyOverview(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch weekly overview:', error);
    } finally {
      setWeeklyOverviewLoading(false);
    }
  }, []);

  // Fetch weekly overview on mount and when intelligence tab is active
  useEffect(() => {
    fetchWeeklyOverview();
  }, [fetchWeeklyOverview]);

  // Fetch sales data for selected period (supports daily, weekly, monthly, quarterly, yearly, ytd)
  const fetchDailySalesData = useCallback(async () => {
    setDailySalesLoading(true);
    try {
      // Determine the period key based on viewBy
      let periodKey;
      switch (viewBy) {
        case 'daily': periodKey = selectedDate; break;
        case 'weekly': periodKey = selectedWeek; break;
        case 'monthly': periodKey = selectedMonth; break;
        case 'quarterly': periodKey = selectedQuarter; break;
        case 'yearly': periodKey = `${selectedYear}`; break;
        case 'ytd': periodKey = `${new Date().getFullYear()}-YTD`; break;
        default: periodKey = selectedDate;
      }
      
      const [ecomRes, retailRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/sales/ecommerce/period-data?type=${viewBy}&key=${periodKey}`).then(r => r.json()),
        fetch(`${API_BASE_URL}/api/v1/sales/retail/period-data?type=${viewBy}&key=${periodKey}`).then(r => r.json())
      ]);

      console.log('=== SALES DATA FETCH ===');
      console.log('Period:', viewBy, periodKey);
      console.log('Retail Response:', retailRes);
      console.log('Retail Data:', retailRes.data);
      console.log('Retail Totals:', retailRes.data?.totals);

      setDailySalesData({
        ecom: ecomRes.success ? ecomRes.data : null,
        retail: retailRes.success ? retailRes.data : null,
        daysCount: ecomRes.data?.days_count || retailRes.data?.days_count || 0
      });
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
      setDailySalesData({ ecom: null, retail: null, daysCount: 0 });
    } finally {
      setDailySalesLoading(false);
    }
  }, [viewBy, selectedDate, selectedWeek, selectedMonth, selectedQuarter, selectedYear]);

  // Fetch sales data when period changes or tab is active
  useEffect(() => {
    if (activeTab === 'dailysales') {
      fetchDailySalesData();
    }
  }, [activeTab, viewBy, selectedDate, selectedWeek, selectedMonth, selectedQuarter, selectedYear, fetchDailySalesData]);

  // Fetch partners when Partners tab is active
  const fetchPartners = useCallback(async () => {
    setPartnersLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/v1/partner-stores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.stores || data) {
        const storesList = data.stores || data;
        setPartners(storesList);
        
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newThisMonth = storesList.filter(store => {
          const createdAt = new Date(store.created_at || store.createdAt);
          return createdAt >= firstOfMonth;
        }).length;
        
        const activePartners = storesList.filter(store => 
          store.status === 'active' || store.status === 'Active' || store.isActive !== false
        ).length;
        
        const revenueThisMonth = storesList.reduce((sum, store) => 
          sum + (store.monthlyRevenue || store.revenue || 0), 0
        );
        
        setPartnersStats({ 
          total: storesList.length, 
          newThisMonth, 
          active: activePartners, 
          revenueThisMonth 
        });
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setPartnersLoading(false);
    }
  }, []);

  // Fetch products for the Edit Partner Modal
  const fetchProductsForModal = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();
      if (data) {
        setProductsForModal(Array.isArray(data) ? data : (data.products || []));
      }
    } catch (error) {
      console.error('Error fetching products for modal:', error);
    }
  }, []);

  // Handler to open Edit Partner Modal
  const handleEditPartner = useCallback((partner) => {
    setSelectedPartnerForEdit(partner);
    setShowEditPartnerModal(true);
    // Fetch products if not already loaded
    if (productsForModal.length === 0) {
      fetchProductsForModal();
    }
  }, [productsForModal.length, fetchProductsForModal]);

  // Handler when partner is saved
  const handlePartnerSaved = useCallback((updatedPartner) => {
    // Update the partner in the local state
    setPartners(prev => prev.map(p => 
      (p.store_id || p._id) === (updatedPartner.store_id || updatedPartner._id) 
        ? { ...p, ...updatedPartner } 
        : p
    ));
    setShowEditPartnerModal(false);
    setSelectedPartnerForEdit(null);
    // Optionally refresh the full list
    fetchPartners();
  }, [fetchPartners]);

  // Handler to open Shoutout Generator Modal
  const handleShoutoutPartner = useCallback((partner) => {
    setSelectedPartnerForShoutout(partner);
    setShowShoutoutModal(true);
  }, []);

  useEffect(() => {
    if (activeTab === 'partners') {
      fetchPartners();
    }
  }, [activeTab, fetchPartners]);

  // Filtered partners computed value
  const filteredPartners = partners.filter(partner => {
    const searchLower = partnersSearch.toLowerCase();
    const matchesSearch = !partnersSearch ||
      (partner.store_name || partner.name || '').toLowerCase().includes(searchLower) ||
      (partner.area || '').toLowerCase().includes(searchLower) ||
      (partner.city || '').toLowerCase().includes(searchLower);
    
    const matchesFilter = partnersFilter === 'all' ||
      (partner.area || '').toLowerCase().replace(/\s+/g, '-') === partnersFilter;
    
    return matchesSearch && matchesFilter;
  });

  // Handler to open Retail modal with fresh partner data
  const handleOpenRetailModal = async () => {
    // Fetch partners if not already loaded
    if (partners.length === 0) {
      console.log('Fetching partners before opening modal...');
      await fetchPartners();
    }
    setShowRetailModal(true);
  };

  // Handler for E-Commerce modal save
  const handleEcommerceSave = async (data) => {
    try {
      // Use the date from the modal if provided, otherwise fall back to page date
      const saveDate = data.selectedDate || selectedDate;
      const savePeriod = {
        value: saveDate,
        label: data.selectedDate ? 'Custom' : currentPeriod.label,
        start: parseDateString(saveDate),
        end: parseDateString(saveDate)
      };
      
      const requestBody = {
        period_type: 'daily',
        period_key: saveDate,
        period_label: savePeriod.label,
        start_date: savePeriod.start,
        end_date: savePeriod.end,
        products: data.products,
        funnel_totals: data.totals,
        kpis: data.kpis,
        summary: {
          total_target_units: data.totals.target_units || 0,
          total_sold_units: data.totals.units_sold || 0,
          total_revenue: data.totals.revenue || 0,
          total_profit: data.totals.profit || 0
        }
      };
      
      const response = await fetch(`${API_BASE_URL}/api/v1/sales/ecommerce/period-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      // Clone response BEFORE reading to avoid "body already used" error
      // This is needed because rrweb recorder intercepts fetch and may clone response
      const responseClone = response.clone();
      
      // Read response body from clone
      let result;
      try {
        result = await responseClone.json();
      } catch (jsonError) {
        console.error('Failed to parse response JSON:', jsonError);
        result = { success: response.ok, message: response.ok ? 'Saved' : 'Save failed' };
      }

      if (response.ok && result.success) {
        setShowECommerceModal(false);
        // If user saved for a different date, update the page's selectedDate
        if (data.selectedDate && data.selectedDate !== selectedDate) {
          setSelectedDate(data.selectedDate);
        }
        await fetchDailySalesData();
        await fetchIntelligenceData();
        toast.success('E-commerce data saved successfully!');
      } else {
        throw new Error(result.message || result.error || 'Save failed');
      }
    } catch (error) {
      console.error('Error saving e-commerce data:', error);
      toast.error('Failed to save e-commerce data: ' + error.message);
    }
  };

  // Handler for Retail modal save
  const handleRetailSave = async (data) => {
    try {
      // Use the date from the modal if provided, otherwise fall back to page date
      const saveDate = data.selectedDate || selectedDate;
      const savePeriod = {
        value: saveDate,
        label: data.selectedDate ? 'Custom' : currentPeriod.label,
        start: parseDateString(saveDate),
        end: parseDateString(saveDate)
      };
      
      const requestBody = {
        period_type: 'daily',
        period_key: saveDate,
        period_label: savePeriod.label,
        start_date: savePeriod.start?.toISOString() || saveDate,
        end_date: savePeriod.end?.toISOString() || saveDate,
        stores: data.stores || [],
        kpis: data.kpis || {},
        totals: data.totals || {}
      };
      
      const response = await fetch(`${API_BASE_URL}/api/v1/sales/retail/period-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      // Clone response BEFORE reading to avoid "body already used" error
      // This is needed because rrweb recorder intercepts fetch and may clone response
      const responseClone = response.clone();
      
      // Read response body from clone
      let result;
      try {
        result = await responseClone.json();
      } catch (jsonError) {
        console.error('Failed to parse response JSON:', jsonError);
        result = { success: response.ok, message: response.ok ? 'Saved' : 'Save failed' };
      }

      if (response.ok && result.success) {
        setShowRetailModal(false);
        // If user saved for a different date, update the page's selectedDate
        if (data.selectedDate && data.selectedDate !== selectedDate) {
          setSelectedDate(data.selectedDate);
        }
        await fetchDailySalesData();
        await fetchIntelligenceData();
        toast.success('Retail data saved successfully!');
      } else {
        throw new Error(result.message || result.detail || 'Save failed');
      }
    } catch (error) {
      console.error('Error saving retail data:', error);
      toast.error('Failed to save retail data: ' + error.message);
    }
  };

  // DB-FIRST SEARCH: Search our database first, then optionally Google
  const handleSearch = async () => {
    console.log('=== DB-FIRST SEARCH STARTED ===');
    console.log('Search params:', searchForm);
    setIsSearching(true);
    setShowGoogleSearchButton(false);
    
    try {
      const token = localStorage.getItem('adminToken');
      
      // STEP 1: Search our retail_stores database FIRST
      const params = new URLSearchParams();
      if (searchForm.query) params.append('q', searchForm.query);
      if (searchForm.area) params.append('area', searchForm.area);
      if (searchForm.pincode) params.append('pincode', searchForm.pincode);
      params.append('limit', '50');
      
      console.log('Searching database first...');
      const dbResponse = await axios.get(`${API_URL}/retail/stores/search-db?${params}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      const dbResults = (dbResponse.data.stores || []).map(s => ({
        ...s,
        source: 'database',
        in_database: true,
        inDatabase: true
      }));
      
      console.log(`Found ${dbResults.length} stores in database`);
      
      // Show fallback message if area filter didn't match
      if (dbResponse.data.fallback_used && dbResponse.data.message) {
        toast.info(dbResponse.data.message, { duration: 4000 });
      }
      
      // Show DB results immediately
      setHuntData(prev => ({
        ...prev,
        searchResults: dbResults,
        cached: false,
        searchSource: 'database',
        fallbackUsed: dbResponse.data.fallback_used
      }));
      
      // Show option to search Google for more stores
      setShowGoogleSearchButton(true);
      
    } catch (error) {
      console.error('DB search failed:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
      console.log('=== DB SEARCH COMPLETED ===');
    }
  };
  
  // Google Places API search - only called when user clicks "Search Google"
  const handleGoogleSearch = async () => {
    console.log('=== GOOGLE SEARCH STARTED ===');
    setIsGoogleSearching(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      
      const requestBody = {
        search_query: searchForm.query,
        city: 'New Delhi',
        area: searchForm.area,
        radius_km: searchForm.radius,
        pincode: searchForm.pincode || undefined
      };
      
      const response = await axios.post(`${API_URL}/retail/stores/search-google`, requestBody, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      const googleResults = (response.data.results || response.data.stores || []).map(s => ({
        ...s,
        source: 'google'
      }));
      
      console.log(`Google returned ${googleResults.length} stores`);
      
      // Get existing place_ids from current results
      const existingPlaceIds = new Set(
        huntData.searchResults.map(s => s.place_id || s.google_place_id).filter(Boolean)
      );
      
      // Filter out duplicates from Google results
      const newGoogleResults = googleResults.filter(s => {
        const placeId = s.place_id || s.google_place_id;
        return placeId && !existingPlaceIds.has(placeId);
      });
      
      console.log(`${newGoogleResults.length} new stores from Google (after dedup)`);
      
      // Combine: DB results first, then new Google results
      setHuntData(prev => ({
        ...prev,
        searchResults: [...prev.searchResults, ...newGoogleResults],
        tierBreakdown: response.data.tier_breakdown || {},
        cached: response.data.cached,
        searchSource: 'combined'
      }));
      
      // Hide the Google search button after search
      setShowGoogleSearchButton(false);
      
      if (newGoogleResults.length === 0) {
        toast.info('No new stores found on Google');
      } else {
        toast.success(`Found ${newGoogleResults.length} new stores from Google`);
      }
      
    } catch (error) {
      console.error('Google search failed:', error);
      toast.error('Google search failed. Please try again.');
    } finally {
      setIsGoogleSearching(false);
      console.log('=== GOOGLE SEARCH COMPLETED ===');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGlobalStats();
    await fetchTabData(activeTab);
    setRefreshing(false);
  };

  const formatCurrency = (amount) => '₹' + Math.round(amount || 0).toLocaleString('en-IN');

  // Render Quick Stats Bar - Modern Lucide Icons
  // Stats Bar date navigation helpers
  const navigateStatsDate = (direction) => {
    const date = new Date(statsDate);
    switch (statsView) {
      case 'daily':
        date.setDate(date.getDate() + direction);
        break;
      case 'weekly':
        date.setDate(date.getDate() + (direction * 7));
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + direction);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + (direction * 3));
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + direction);
        break;
      default:
        date.setDate(date.getDate() + direction);
    }
    setStatsDate(date.toISOString().split('T')[0]);
  };

  const getStatsDateDisplayLabel = () => {
    const date = new Date(statsDate);
    switch (statsView) {
      case 'daily':
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'monthly':
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'quarterly':
        const quarter = Math.ceil((date.getMonth() + 1) / 3);
        return `Q${quarter} ${date.getFullYear()}`;
      case 'yearly':
        return date.getFullYear().toString();
      case 'ytd':
        return `YTD ${date.getFullYear()}`;
      default:
        return date.toLocaleDateString();
    }
  };

  const getTargetColor = (percent) => {
    if (percent >= 100) return 'text-green-400';
    if (percent >= 75) return 'text-teal-400';
    if (percent >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const renderQuickStats = () => (
    <div className={`backdrop-blur-lg border rounded-xl p-3 mb-4 ${
      isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
    }`}>
      {/* Date View Selector Row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Left: View Selector & Date Navigation */}
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>View:</span>
          <select
            value={statsView}
            onChange={(e) => setStatsView(e.target.value)}
            className={`px-2.5 py-1.5 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${
              isDarkMode 
                ? 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600' 
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
            <option value="ytd">Year to Date</option>
          </select>
          
          {/* Date Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateStatsDate(-1)}
              className={`p-1.5 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <ChevronLeft size={18} />
            </button>
            <span className={`px-2 text-sm font-medium min-w-[120px] text-center ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {getStatsDateDisplayLabel()}
            </span>
            <input
              type="date"
              value={statsDate}
              onChange={(e) => setStatsDate(e.target.value)}
              className={`w-5 h-5 opacity-0 cursor-pointer absolute`}
              style={{ marginLeft: '-24px' }}
            />
            <button className={`p-1 rounded ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}>
              <Calendar size={16} />
            </button>
            <button
              onClick={() => navigateStatsDate(1)}
              className={`p-1.5 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Right: Stats */}
        <div className="flex items-center gap-4 text-sm">
          {/* Total Stores */}
          <div className="flex items-center gap-1.5">
            <Store size={16} className="text-teal-400" />
            <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Stores:</span>
            <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {globalStats.totalStores}
            </span>
          </div>
          
          <span className={isDarkMode ? 'text-slate-600' : 'text-gray-300'}>|</span>
          
          {/* Partners Added */}
          <div className="flex items-center gap-1.5">
            <Handshake size={16} className="text-purple-400" />
            <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Partners:</span>
            <span className="font-semibold text-purple-400">
              +{globalStats.partnersAdded}
            </span>
          </div>
          
          <span className={isDarkMode ? 'text-slate-600' : 'text-gray-300'}>|</span>
          
          {/* Target */}
          <div className="flex items-center gap-1.5">
            <Target size={16} className={getTargetColor(globalStats.targetPercent)} />
            <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Target:</span>
            <span className={`font-semibold ${getTargetColor(globalStats.targetPercent)}`}>
              {globalStats.targetPercent}%
            </span>
            <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
              ({globalStats.partnersAdded}/{globalStats.targetGoal})
            </span>
          </div>
          
          <span className={isDarkMode ? 'text-slate-600' : 'text-gray-300'}>|</span>
          
          {/* E-Commerce Revenue */}
          <div className="flex items-center gap-1.5">
            <ShoppingCart size={16} className="text-blue-400" />
            <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>E-Com:</span>
            <span className="font-semibold text-blue-400">
              {formatCurrency(globalStats.ecomRevenue)}
            </span>
          </div>
          
          <span className={isDarkMode ? 'text-slate-600' : 'text-gray-300'}>|</span>
          
          {/* Retail Revenue */}
          <div className="flex items-center gap-1.5">
            <Store size={16} className="text-green-400" />
            <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>Retail:</span>
            <span className="font-semibold text-green-400">
              {formatCurrency(globalStats.retailRevenue)}
            </span>
          </div>
          
          {/* Live Badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 rounded-lg">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-400">Live</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Hunt Tab
  // HuntTab - extracted to components/admin/sales/HuntTab.js

    // Render Stores Tab
  // StoresTab - extracted to components/admin/sales/StoresTab.js

    // Render Routes Tab
  // RoutesTab - extracted to components/admin/sales/RoutesTab.js

    // Render Pipeline Tab
  // PipelineTab - extracted to components/admin/sales/PipelineTab.js

    // Render Partners Tab
  // PartnersTab - extracted to components/admin/sales/PartnersTab.js

    // DailySalesTab - extracted to components/admin/sales/DailySalesTab.js

    return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <span>🏪</span> Sales Hub
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Manage retail prospecting, stores, routes, and sales pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${
              isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-200'
            }`}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {renderQuickStats()}

      {/* Tab Navigation - Modern Lucide Icons */}
      <div className={`border-b mb-6 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const TabIcon = tab.Icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
                  activeTab === tab.id
                    ? 'text-teal-400 border-teal-400'
                    : `${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} border-transparent`
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'hunt' && (
          <HuntTab
            isDarkMode={isDarkMode}
            huntData={huntData}
            storesData={storesData}
            searchForm={searchForm}
            setSearchForm={setSearchForm}
            isSearching={isSearching}
            filteredAreas={filteredAreas}
            showAreaDropdown={showAreaDropdown}
            setShowAreaDropdown={setShowAreaDropdown}
            handleAreaSearch={handleAreaSearch}
            selectArea={selectArea}
            handleSearch={handleSearch}
            handleGoogleSearch={handleGoogleSearch}
            showGoogleSearchButton={showGoogleSearchButton}
            isGoogleSearching={isGoogleSearching}
            resultsViewMode={resultsViewMode}
            setResultsViewMode={setResultsViewMode}
            tierFilter={tierFilter}
            setTierFilter={setTierFilter}
            selectedStores={selectedStores}
            setSelectedStores={setSelectedStores}
            showTierGuide={showTierGuide}
            setShowTierGuide={setShowTierGuide}
            viewType={viewType}
            setViewType={setViewType}
            sortBy={sortBy}
            setSortBy={setSortBy}
            handleAddStore={handleAddStore}
            handleAddSelectedToDatabase={handleAddSelectedToDatabase}
            setActiveTab={setActiveTab}
            loading={loading}
          />
        )}
        {activeTab === 'stores' && (
          <StoresTab
            isDarkMode={isDarkMode}
            storesData={storesData}
            storeFilters={storeFilters}
            setStoreFilters={setStoreFilters}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            loading={loading}
            onSearch={(searchQuery) => {
              const token = localStorage.getItem('adminToken');
              if (token) {
                fetchStoresData(token, searchQuery);
              }
            }}
          />
        )}
        {activeTab === 'routes' && (
          <RoutesTab
            isDarkMode={isDarkMode}
            routesData={routesData}
            loading={loading}
          />
        )}
        {activeTab === 'pipeline' && (
          <PipelineTab
            isDarkMode={isDarkMode}
            pipelineData={pipelineData}
            setActiveTab={setActiveTab}
            loading={loading}
          />
        )}
        {activeTab === 'partners' && (
          <PartnersTab
            isDarkMode={isDarkMode}
            partnersStats={partnersStats}
            partnersSearch={partnersSearch}
            setPartnersSearch={setPartnersSearch}
            partnersFilter={partnersFilter}
            setPartnersFilter={setPartnersFilter}
            filteredPartners={filteredPartners}
            partnersLoading={partnersLoading}
            fetchPartners={fetchPartners}
            onEditPartner={handleEditPartner}
            onShoutoutPartner={handleShoutoutPartner}
          />
        )}
        {activeTab === 'dailysales' && (
          <DailySalesTab
            isDarkMode={isDarkMode}
            dailySalesData={dailySalesData}
            globalStats={globalStats}
            weeklyOverview={weeklyOverview}
            pipelineData={pipelineData}
            viewBy={viewBy}
            setViewBy={setViewBy}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedWeek={selectedWeek}
            setSelectedWeek={setSelectedWeek}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedQuarter={selectedQuarter}
            setSelectedQuarter={setSelectedQuarter}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            navigateDate={navigateDate}
            getLocalDateString={getLocalDateString}
            formatDateDisplay={formatDateDisplay}
            getWeekOptions={getWeekOptions}
            getMonthOptions={getMonthOptions}
            getQuarterOptions={getQuarterOptions}
            getYearOptions={getYearOptions}
            getViewLabel={getViewLabel}
            formatCurrency={formatCurrency}
            setShowRetailModal={setShowRetailModal}
            setShowECommerceModal={setShowECommerceModal}
            setShowTargetModal={setShowTargetModal}
            handleOpenRetailModal={handleOpenRetailModal}
            fetchDailySalesData={fetchDailySalesData}
            loading={dailySalesLoading}
          />
        )}
        {activeTab === 'reports' && (
          <ReportsTab isDarkMode={isDarkMode} />
        )}
        {activeTab === 'partner-stock' && (
          <PartnerStockTab />
        )}
      </div>

      {/* E-Commerce Edit Modal */}
      <EditEcommerceDataModal
        isOpen={showECommerceModal}
        onClose={() => setShowECommerceModal(false)}
        period={currentPeriod}
        ecomProducts={dailySalesData.ecom?.products || []}
        onSave={handleEcommerceSave}
        initialDate={selectedDate}
      />

      {/* Retail Edit Modal - Using new 3-View Architecture */}
      <RetailDataModal
        isOpen={showRetailModal}
        onClose={() => setShowRetailModal(false)}
        period={currentPeriod}
        onSave={handleRetailSave}
        initialDate={selectedDate}
      />

      {/* Revenue Target Modal */}
      <RevenueTargetModal
        isOpen={showTargetModal}
        onClose={() => setShowTargetModal(false)}
        weekInfo={weeklyOverview?.week_info}
        onSave={fetchWeeklyOverview}
      />

      {/* Edit Partner Modal */}
      {showEditPartnerModal && selectedPartnerForEdit && (
        <EditPartnerModal
          store={selectedPartnerForEdit}
          products={productsForModal}
          onClose={() => {
            setShowEditPartnerModal(false);
            setSelectedPartnerForEdit(null);
          }}
          onSave={handlePartnerSaved}
        />
      )}

      {/* Shoutout Generator Modal */}
      {showShoutoutModal && selectedPartnerForShoutout && (
        <ShoutoutGeneratorModal
          partner={selectedPartnerForShoutout}
          onClose={() => {
            setShowShoutoutModal(false);
            setSelectedPartnerForShoutout(null);
          }}
        />
      )}
    </div>
  );
};

export default SalesHubPage;
