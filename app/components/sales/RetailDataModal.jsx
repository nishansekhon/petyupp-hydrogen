import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Store, Plus, Search, ChevronDown, ChevronUp, Trash2, 
  Edit2, Package, Save, ShoppingBag, Phone, Eye, AlertCircle,
  Check, Minus, ChevronLeft, ChevronRight, Calendar, RefreshCw
} from 'lucide-react';
import { API_BASE_URL } from '@/utils/api';
import { useStoreSearch } from '@/hooks/useStoreSearch';

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

const VISIT_OUTCOMES = [
  { value: 'sale_made', label: 'Sale Made', showSales: true, locksVisits: false },
  { value: 'pitched', label: 'Pitched (No Sale)', showSales: false, locksVisits: false },
  { value: 'follow_up', label: 'Follow-up Needed', showSales: false, locksVisits: false },
  { value: 'phone_order', label: 'Phone/WhatsApp Order', showSales: true, locksVisits: true }
];

const STOCK_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'med', label: 'Med' },
  { value: 'high', label: 'High' }
];

const ENGAGE_OPTIONS = [
  { value: 'cold', label: 'Cold' },
  { value: 'ok', label: 'OK' },
  { value: 'good', label: 'Good' }
];

const DISCOUNT_BUTTONS = [15, 20, 40, 50];

const RetailDataModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData = [], 
  period = { label: 'Today' },
  partnerStores = [],
  initialDate
}) => {
  // Date state for historical data entry
  const [selectedDate, setSelectedDate] = useState(() => initialDate || getLocalDateString());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  
  // View state: 'summary' | 'select_store' | 'entry_form'
  const [currentView, setCurrentView] = useState('summary');
  const [storeData, setStoreData] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [editingStoreIndex, setEditingStoreIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    salesMade: true,
    visitOnly: true,
    orderOnly: true,
    otherSales: true
  });
  
  // Other Sale modal state
  const [showOtherSaleModal, setShowOtherSaleModal] = useState(false);
  const [otherSale, setOtherSale] = useState({
    buyer_name: '',
    buyer_type: 'ngo',
    phone: '',
    location: '',
    products: [],
    notes: ''
  });
  const [otherSalesList, setOtherSalesList] = useState([]);
  
  // Available products for selection
  const [availableProducts, setAvailableProducts] = useState([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  
  // Consignment Stock state
  const [consignmentStock, setConsignmentStock] = useState([]);
  const [loadingConsignmentStock, setLoadingConsignmentStock] = useState(false);
  const [showQuickRestock, setShowQuickRestock] = useState(false);
  const [quickRestockForm, setQuickRestockForm] = useState({
    product_id: '',
    product_name: '',
    quantity: 1,
    cost_per_unit: 0,
    notes: ''
  });
  
  // UNIFIED STORE SEARCH - Use the centralized hook
  const { 
    results: searchResults, 
    loading: searchLoading, 
    search: searchStores, 
    clearResults: clearSearchResults 
  } = useStoreSearch('all'); // Search both partner and retail stores

  // Entry form state
  const [entryForm, setEntryForm] = useState({
    store_id: '',
    store_name: '',
    tier: 'SILVER',
    visits: 1,
    visit_outcome: 'sale_made',
    orders: 0,
    units: 0,
    revenue: 0,
    stock: 'med',
    engage: 'ok',
    reorder_percent: 50,
    notes: '',
    products: [],
    consignment_products: [] // Track consignment stock sales
  });

  // Fetch data for selected date from the API
  const fetchDataForDate = useCallback(async (dateStr) => {
    setLoadingData(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/sales/retail/period-data?type=daily&key=${dateStr}`);
      const result = await response.json();
      
      if (result.success && result.data && result.data.stores && result.data.stores.length > 0) {
        setStoreData(result.data.stores);
      } else {
        // NO DATA for this date - start with EMPTY state (CRITICAL FIX)
        setStoreData([]);
      }
      
      // Also fetch Other Sales for this date
      if (result.success && result.data && result.data.other_sales) {
        setOtherSalesList(result.data.other_sales);
      } else {
        setOtherSalesList([]);
      }
    } catch (error) {
      console.error('Error fetching data for date:', error);
      // On error, also start empty
      setStoreData([]);
      setOtherSalesList([]);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Initialize data - fetch from API based on date
  useEffect(() => {
    if (isOpen) {
      const dateToUse = initialDate || getLocalDateString();
      setSelectedDate(dateToUse);
      setCurrentView('summary');
      setSelectedStore(null);
      setEditingStoreIndex(null);
      fetchProducts();
      // Clear any previous search results
      clearSearchResults();
      fetchDataForDate(dateToUse);
    }
  }, [isOpen, initialDate, fetchDataForDate, clearSearchResults]);

  // Refetch data when date changes
  useEffect(() => {
    if (isOpen && selectedDate) {
      fetchDataForDate(selectedDate);
    }
  }, [selectedDate, isOpen, fetchDataForDate]);

  // Navigate dates
  const navigateDate = (direction) => {
    const date = parseDateString(selectedDate);
    date.setDate(date.getDate() + direction);
    const today = new Date();
    if (date <= today) {
      const newDateStr = getLocalDateString(date);
      // Check if date is more than 90 days old
      const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
      if (daysDiff > 90) {
        if (!window.confirm(`You are entering data for ${formatDateDisplay(newDateStr)} (${daysDiff} days ago). Continue?`)) {
          return;
        }
      }
      setSelectedDate(newDateStr);
    }
  };

  // Handle date picker change
  const handleDateChange = (e) => {
    const newDateStr = e.target.value;
    const today = new Date();
    const selectedDateObj = parseDateString(newDateStr);
    
    if (selectedDateObj > today) {
      alert('Cannot select future dates');
      return;
    }
    
    // Check if date is more than 90 days old
    const daysDiff = Math.floor((today - selectedDateObj) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
      if (!window.confirm(`You are entering data for ${formatDateDisplay(newDateStr)} (${daysDiff} days ago). Continue?`)) {
        return;
      }
    }
    
    setSelectedDate(newDateStr);
    setShowDatePicker(false);
  };

  // Fetch available products
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      const data = await response.json();
      setAvailableProducts(data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  // Fetch consignment stock for a partner
  const fetchConsignmentStock = useCallback(async (partnerId, partnerName) => {
    setLoadingConsignmentStock(true);
    try {
      const token = localStorage.getItem('adminToken');
      // Try fetching by partner ID first, then by name
      let response = await fetch(`${API_BASE_URL}/api/v1/partner-stock/by-partner/${encodeURIComponent(partnerId)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let data = await response.json();
      
      // If no products found by ID, try by name
      if (data.success && data.products.length === 0 && partnerName) {
        response = await fetch(`${API_BASE_URL}/api/v1/partner-stock/by-partner/${encodeURIComponent(partnerName)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        data = await response.json();
      }
      
      if (data.success) {
        setConsignmentStock(data.products || []);
      } else {
        setConsignmentStock([]);
      }
    } catch (error) {
      console.error('Failed to fetch consignment stock:', error);
      setConsignmentStock([]);
    } finally {
      setLoadingConsignmentStock(false);
    }
  }, []);

  // Handle Quick Restock
  const handleQuickRestock = async () => {
    if (!quickRestockForm.product_id || quickRestockForm.quantity <= 0) {
      alert('Please select a product and enter quantity');
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/v1/partner-stock/quick-restock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          partner_id: entryForm.store_id,
          partner_name: entryForm.store_name,
          ...quickRestockForm
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowQuickRestock(false);
        setQuickRestockForm({ product_id: '', product_name: '', quantity: 1, cost_per_unit: 0, notes: '' });
        // Refresh consignment stock
        fetchConsignmentStock(entryForm.store_id, entryForm.store_name);
      } else {
        alert(data.error || 'Failed to add stock');
      }
    } catch (error) {
      console.error('Failed to quick restock:', error);
      alert('Failed to add stock');
    }
  };

  // Update consignment product quantity sold
  const updateConsignmentProductQty = (productId, qtySold) => {
    setEntryForm(prev => {
      const existingIdx = prev.consignment_products.findIndex(p => p.product_id === productId);
      const stockItem = consignmentStock.find(s => s.product_id === productId);
      
      if (!stockItem) return prev;
      
      const newConsignmentProducts = [...prev.consignment_products];
      const qty = parseInt(qtySold) || 0;
      const revenue = qty * (stockItem.unit_price || 0);
      
      if (existingIdx >= 0) {
        if (qty > 0) {
          newConsignmentProducts[existingIdx] = {
            product_id: productId,
            product_name: stockItem.product_name,
            quantity_sold: qty,
            unit_price: stockItem.unit_price,
            revenue: revenue,
            stock_available: stockItem.quantity_remaining
          };
        } else {
          newConsignmentProducts.splice(existingIdx, 1);
        }
      } else if (qty > 0) {
        newConsignmentProducts.push({
          product_id: productId,
          product_name: stockItem.product_name,
          quantity_sold: qty,
          unit_price: stockItem.unit_price,
          revenue: revenue,
          stock_available: stockItem.quantity_remaining
        });
      }
      
      // Calculate totals from consignment products
      const totalConsignmentRevenue = newConsignmentProducts.reduce((sum, p) => sum + (p.revenue || 0), 0);
      const totalConsignmentUnits = newConsignmentProducts.reduce((sum, p) => sum + (p.quantity_sold || 0), 0);
      
      // Calculate regular products totals
      const regularRevenue = prev.products.reduce((sum, p) => sum + ((parseInt(p.qty) || 0) * (parseFloat(p.price) || 0)), 0);
      const regularUnits = prev.products.reduce((sum, p) => sum + (parseInt(p.qty) || 0), 0);
      
      return {
        ...prev,
        consignment_products: newConsignmentProducts,
        revenue: totalConsignmentRevenue + regularRevenue,
        units: totalConsignmentUnits + regularUnits,
        orders: newConsignmentProducts.length > 0 || prev.products.length > 0 ? Math.max(prev.orders, 1) : prev.orders
      };
    });
  };

  // UNIFIED SEARCH: Trigger search when query changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentView === 'select_store') {
        if (searchQuery && searchQuery.trim()) {
          console.log('Unified search triggered for:', searchQuery);
          searchStores(searchQuery);
        } else {
          // Clear results when search is empty
          clearSearchResults();
        }
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentView, searchStores, clearSearchResults]);
  
  // Clear search results when view changes
  useEffect(() => {
    if (currentView !== 'select_store') {
      clearSearchResults();
    }
  }, [currentView, clearSearchResults]);

  // Use search results from unified hook - these are already filtered by backend
  const allPartnerStores = searchResults.length > 0 ? searchResults : (partnerStores || []);

  // Group stores by outcome - improved logic using visit_outcome field
  const groupedStores = {
    salesMade: storeData.filter(s => {
      // If visit_outcome is explicitly 'sale_made', or if visits > 0 AND orders > 0
      if (s.visit_outcome === 'sale_made') return true;
      return (s.visits || 0) > 0 && (s.orders || 0) > 0;
    }),
    visitOnly: storeData.filter(s => {
      // If visit_outcome is 'pitched' or 'follow_up', or if visits > 0 AND orders = 0
      if (s.visit_outcome === 'pitched' || s.visit_outcome === 'follow_up') return true;
      if (s.visit_outcome) return false; // Has other explicit outcome
      return (s.visits || 0) > 0 && (s.orders || 0) === 0;
    }),
    orderOnly: storeData.filter(s => {
      // If visit_outcome is 'phone_order', or if visits = 0 AND orders > 0
      if (s.visit_outcome === 'phone_order') return true;
      if (s.visit_outcome) return false; // Has other explicit outcome
      return (s.visits || 0) === 0 && (s.orders || 0) > 0;
    })
  };

  // Get outcome label for display
  const getOutcomeLabel = (store) => {
    const outcome = VISIT_OUTCOMES.find(o => o.value === store.visit_outcome);
    if (outcome) return outcome.label;
    // Fallback based on data
    if ((store.visits || 0) > 0 && (store.orders || 0) === 0) return 'Visited, No Sale';
    if ((store.visits || 0) === 0 && (store.orders || 0) > 0) return 'Phone Order';
    return '';
  };

  // Get tier badge styling
  const getTierBadge = (tier) => {
    switch (tier) {
      case 'GOLD':
        return 'bg-amber-500/20 text-amber-400';
      case 'PLATINUM':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-slate-500/20 text-slate-300';
    }
  };

  // Calculate totals
  const totals = {
    visits: storeData.reduce((sum, s) => sum + (parseInt(s.visits) || 0), 0),
    orders: storeData.reduce((sum, s) => sum + (parseInt(s.orders) || 0), 0),
    units: storeData.reduce((sum, s) => sum + (parseInt(s.units) || 0), 0),
    revenue: storeData.reduce((sum, s) => sum + (parseFloat(s.revenue) || 0), 0)
  };
  
  // Add Other Sales to totals
  const otherSalesTotals = {
    orders: otherSalesList.length,
    units: otherSalesList.reduce((sum, s) => sum + (s.products?.reduce((psum, p) => psum + (p.quantity || 0), 0) || 0), 0),
    revenue: otherSalesList.reduce((sum, s) => sum + (parseFloat(s.total_revenue) || 0), 0)
  };
  
  // Combined totals for display
  const combinedTotals = {
    visits: totals.visits,
    orders: totals.orders + otherSalesTotals.orders,
    units: totals.units + otherSalesTotals.units,
    revenue: totals.revenue + otherSalesTotals.revenue
  };

  // Handle saving other sale
  const handleSaveOtherSale = async () => {
    if (!otherSale.buyer_name || otherSale.products.length === 0) {
      alert('Please fill buyer name and select a product');
      return;
    }
    
    const totalRevenue = otherSale.products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);
    
    const saleData = {
      date: selectedDate,
      sale_type: 'other',
      buyer: {
        name: otherSale.buyer_name,
        type: otherSale.buyer_type,
        phone: otherSale.phone,
        location: otherSale.location
      },
      products: otherSale.products,
      total_revenue: totalRevenue,
      notes: otherSale.notes
    };
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/retail/other-sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add to local list immediately
        setOtherSalesList(prev => [...prev, { ...saleData, id: data.id }]);
        setShowOtherSaleModal(false);
        setOtherSale({
          buyer_name: '',
          buyer_type: 'ngo',
          phone: '',
          location: '',
          products: [],
          notes: ''
        });
      } else {
        alert(data.error || 'Failed to save sale');
      }
    } catch (error) {
      console.error('Error saving other sale:', error);
      alert('Failed to save sale');
    }
  };

  // Handle delete other sale
  const handleDeleteOtherSale = async (saleId, index) => {
    if (!window.confirm('Remove this sale?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/retail/other-sales/${saleId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        setOtherSalesList(prev => prev.filter((_, i) => i !== index));
      }
    } catch (error) {
      console.error('Error deleting other sale:', error);
      // Still remove from local state
      setOtherSalesList(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Get stores available for adding (not in today's data)
  // Use allPartnerStores which uses fetched stores if prop is empty
  const availableStores = allPartnerStores.filter(ps => {
    // Get the store name for matching - this is the most reliable identifier
    const psStoreName = (ps.store_name || ps.name || '').toLowerCase().trim();
    
    // Get all possible IDs from the partner/retail store
    const psIds = [
      ps.place_id,
      ps.google_place_id,
      ps.id,
      ps._id,
      ps.store_id
    ].filter(Boolean).map(id => String(id).toLowerCase().trim());
    
    // Check if this store is already in today's data
    const isAlreadyAdded = storeData.some(sd => {
      const sdStoreName = (sd.store_name || '').toLowerCase().trim();
      
      // First check: exact name match (most reliable)
      if (psStoreName && sdStoreName && psStoreName === sdStoreName) {
        return true;
      }
      
      // Second check: ID match
      const sdIds = [
        sd.store_id,
        sd.place_id,
        sd.google_place_id,
        sd.id,
        sd._id
      ].filter(Boolean).map(id => String(id).toLowerCase().trim());
      
      // Check if any IDs match
      return psIds.some(psId => sdIds.includes(psId));
    });
    
    return !isAlreadyAdded;
  });

  // When searchQuery changes and we're on select_store view, the useEffect above handles fetching
  // The filteredAvailableStores just uses what we fetched (already filtered by backend)
  const filteredAvailableStores = availableStores;

  // Handle store selection
  const handleSelectStore = (store) => {
    const storeId = store.place_id || store.id || store.store_name;
    const storeName = store.store_name || store.name;
    
    const newEntry = {
      store_id: storeId,
      store_name: storeName,
      tier: store.tier || 'SILVER',
      visits: 1,
      visit_outcome: 'sale_made',
      orders: 0,
      units: 0,
      revenue: 0,
      stock: 'med',
      engage: 'ok',
      reorder_percent: 50,
      notes: '',
      products: [],
      consignment_products: []
    };
    setEntryForm(newEntry);
    setSelectedStore(store);
    setEditingStoreIndex(null);
    setCurrentView('entry_form');
    setSearchQuery('');
    
    // Fetch consignment stock for this partner
    fetchConsignmentStock(storeId, storeName);
  };

  // Handle edit store
  const handleEditStore = (store, index) => {
    setEntryForm({ ...store, consignment_products: store.consignment_products || [] });
    setSelectedStore(store);
    setEditingStoreIndex(index);
    setCurrentView('entry_form');
    
    // Fetch consignment stock for this partner
    const storeId = store.store_id || store.place_id || store.id || store.store_name;
    const storeName = store.store_name;
    fetchConsignmentStock(storeId, storeName);
  };

  // Handle delete store
  const handleDeleteStore = (index) => {
    if (window.confirm('Remove this store from today\'s activity?')) {
      setStoreData(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Handle visit outcome change
  const handleOutcomeChange = (outcome) => {
    const outcomeConfig = VISIT_OUTCOMES.find(o => o.value === outcome);
    setEntryForm(prev => ({
      ...prev,
      visit_outcome: outcome,
      visits: outcomeConfig?.locksVisits ? 0 : (prev.visits || 1),
      // Clear sales data if outcome doesn't show sales
      ...(outcomeConfig?.showSales ? {} : { orders: 0, units: 0, revenue: 0, products: [] })
    }));
  };

  // Calculate units and revenue from products
  const calculateFromProducts = useCallback((products) => {
    if (!products || products.length === 0) return { units: 0, revenue: 0 };
    const units = products.reduce((sum, p) => sum + (parseInt(p.qty) || 0), 0);
    const revenue = products.reduce((sum, p) => sum + ((parseInt(p.qty) || 0) * (parseFloat(p.price) || 0)), 0);
    return { units, revenue };
  }, []);

  // Update entry form products
  const updateProduct = (productIndex, field, value) => {
    setEntryForm(prev => {
      const newProducts = [...prev.products];
      newProducts[productIndex] = { ...newProducts[productIndex], [field]: value };
      
      // Recalculate revenue for this product
      if (field === 'qty' || field === 'price') {
        const qty = field === 'qty' ? value : newProducts[productIndex].qty;
        const price = field === 'price' ? value : newProducts[productIndex].price;
        newProducts[productIndex].revenue = (parseInt(qty) || 0) * (parseFloat(price) || 0);
      }
      
      const { units, revenue } = calculateFromProducts(newProducts);
      return { ...prev, products: newProducts, units, revenue };
    });
  };

  // Apply discount to product
  const applyDiscount = (productIndex, discountPercent) => {
    setEntryForm(prev => {
      const newProducts = [...prev.products];
      const mrp = newProducts[productIndex].mrp || newProducts[productIndex].price;
      const newPrice = Math.round(mrp * (1 - discountPercent / 100));
      newProducts[productIndex] = { 
        ...newProducts[productIndex], 
        price: newPrice,
        revenue: (parseInt(newProducts[productIndex].qty) || 0) * newPrice
      };
      const { units, revenue } = calculateFromProducts(newProducts);
      return { ...prev, products: newProducts, units, revenue };
    });
  };

  // Reset to MRP
  const resetToMRP = (productIndex) => {
    setEntryForm(prev => {
      const newProducts = [...prev.products];
      const mrp = newProducts[productIndex].mrp;
      newProducts[productIndex] = { 
        ...newProducts[productIndex], 
        price: mrp,
        revenue: (parseInt(newProducts[productIndex].qty) || 0) * mrp
      };
      const { units, revenue } = calculateFromProducts(newProducts);
      return { ...prev, products: newProducts, units, revenue };
    });
  };

  // Add product to entry
  const handleAddProduct = (product) => {
    const mrp = product.original_price || product.mrp || product.price || 0;
    const newProduct = {
      product_id: product.id || product._id,
      product_name: product.name,
      qty: 1,
      price: mrp,
      mrp: mrp,
      revenue: mrp
    };
    
    setEntryForm(prev => {
      const newProducts = [...prev.products, newProduct];
      const { units, revenue } = calculateFromProducts(newProducts);
      return { 
        ...prev, 
        products: newProducts, 
        units, 
        revenue,
        orders: prev.orders || 1 
      };
    });
    setShowProductPicker(false);
    setProductSearch('');
  };

  // Remove product from entry
  const removeProduct = (index) => {
    setEntryForm(prev => {
      const newProducts = prev.products.filter((_, i) => i !== index);
      const { units, revenue } = calculateFromProducts(newProducts);
      return { ...prev, products: newProducts, units, revenue };
    });
  };

  // Save entry form to store data
  const handleSaveEntry = () => {
    if (editingStoreIndex !== null) {
      setStoreData(prev => prev.map((s, i) => i === editingStoreIndex ? { ...entryForm } : s));
    } else {
      setStoreData(prev => [...prev, { ...entryForm }]);
    }
    setCurrentView('summary');
    setSelectedStore(null);
    setEditingStoreIndex(null);
  };

  // Save all data
  const handleSave = async () => {
    setSaving(true);
    try {
      // Calculate KPIs
      const kpis = {
        avg_order_value: combinedTotals.orders > 0 ? Math.round(combinedTotals.revenue / combinedTotals.orders) : 0,
        conversion_rate: totals.visits > 0 ? Math.round((totals.orders / totals.visits) * 100) : 0,
        stores_visited: storeData.filter(s => (s.visits || 0) > 0).length
      };
      
      // Pass selectedDate to the onSave handler
      await onSave({ 
        stores: storeData, 
        totals: combinedTotals, 
        kpis,
        other_sales: otherSalesList,
        selectedDate: selectedDate  // Pass the date for the parent to use
      });
    } finally {
      setSaving(false);
    }
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!isOpen) return null;

  // Calculate savings for products display
  const calculateSavings = (products) => {
    if (!products || products.length === 0) return { totalSavings: 0, avgDiscount: 0 };
    let totalSavings = 0;
    let totalMRP = 0;
    products.forEach(p => {
      const qty = parseInt(p.qty) || 0;
      const mrp = parseFloat(p.mrp) || 0;
      const price = parseFloat(p.price) || 0;
      totalSavings += qty * (mrp - price);
      totalMRP += qty * mrp;
    });
    const avgDiscount = totalMRP > 0 ? Math.round((totalSavings / totalMRP) * 100) : 0;
    return { totalSavings, avgDiscount };
  };

  // Render Summary View
  const renderSummaryView = () => (
    <>
      {/* Header with Date Picker */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-teal-500/20 rounded-lg">
            <Store className="w-4 h-4 text-teal-400" />
          </div>
          <span className="text-base font-semibold text-white">Retail Data</span>
        </div>
        
        {/* Date Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateDate(-1)}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
            title="Previous day"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 text-sm font-medium rounded-lg transition-colors"
            >
              <Calendar className="w-4 h-4" />
              {formatDateDisplay(selectedDate)}
            </button>
            
            {showDatePicker && (
              <div className="absolute top-full right-0 mt-1 z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    handleDateChange(e);
                    setShowDatePicker(false);
                  }}
                  onBlur={() => setTimeout(() => setShowDatePicker(false), 150)}
                  max={getLocalDateString()}
                  autoFocus
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
            )}
          </div>
          
          <button
            onClick={() => navigateDate(1)}
            disabled={selectedDate === getLocalDateString()}
            className={`p-1.5 rounded-lg transition-colors ${
              selectedDate === getLocalDateString()
                ? 'text-slate-600 cursor-not-allowed'
                : 'hover:bg-slate-700 text-slate-400'
            }`}
            title="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('select_store')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Store
          </button>
          <button
            onClick={() => setShowOtherSaleModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Other Sale
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="px-4 py-2 bg-slate-700/50 text-center">
        <span className="text-sm text-slate-300">
          <span className="font-semibold text-white">{combinedTotals.visits}</span> Visits • 
          <span className="font-semibold text-white ml-1">{combinedTotals.orders}</span> Orders • 
          <span className="font-semibold text-white ml-1">{combinedTotals.units}</span> Units • 
          <span className="font-semibold text-teal-400 ml-1">₹{combinedTotals.revenue.toLocaleString()}</span> Revenue
        </span>
      </div>

      {/* Grouped Sections */}
      <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
        {/* Loading State */}
        {loadingData && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-teal-400 animate-spin" />
            <span className="ml-3 text-slate-400 text-sm">Loading data for {formatDateDisplay(selectedDate)}...</span>
          </div>
        )}

        {!loadingData && (
          <>
        {/* Sales Made Section (Green) */}
        {groupedStores.salesMade.length > 0 && (
          <div className="bg-green-900/20 border-l-4 border-green-400 rounded-r-lg overflow-hidden">
            <button
              onClick={() => toggleSection('salesMade')}
              className="w-full flex items-center justify-between p-3 hover:bg-green-900/30 transition-colors"
            >
              <span className="text-sm font-medium text-green-400">
                🟢 SALES MADE ({groupedStores.salesMade.length} store{groupedStores.salesMade.length !== 1 ? 's' : ''})
              </span>
              {expandedSections.salesMade ? <ChevronUp className="w-4 h-4 text-green-400" /> : <ChevronDown className="w-4 h-4 text-green-400" />}
            </button>
            {expandedSections.salesMade && (
              <div className="px-3 pb-3 space-y-2">
                {groupedStores.salesMade
                  .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
                  .map((store, idx) => {
                    const originalIndex = storeData.findIndex(s => s.store_id === store.store_id);
                    return (
                      <div key={store.store_id || idx} className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white">{store.store_name}</span>
                          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${getTierBadge(store.tier)}`}>{store.tier}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-green-400 font-medium">₹{(store.revenue || 0).toLocaleString()}</span>
                          <span className="text-xs text-slate-400">({store.orders || 0} order{store.orders !== 1 ? 's' : ''})</span>
                          <button onClick={() => handleEditStore(store, originalIndex)} className="p-1 hover:bg-slate-700 rounded" title="Edit">
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          <button onClick={() => handleDeleteStore(originalIndex)} className="p-1 hover:bg-slate-700 rounded" title="Delete">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Visit Only Section (Yellow) */}
        {groupedStores.visitOnly.length > 0 && (
          <div className="bg-yellow-900/20 border-l-4 border-yellow-400 rounded-r-lg overflow-hidden">
            <button
              onClick={() => toggleSection('visitOnly')}
              className="w-full flex items-center justify-between p-3 hover:bg-yellow-900/30 transition-colors"
            >
              <span className="text-sm font-medium text-yellow-400">
                🟡 VISIT ONLY ({groupedStores.visitOnly.length} store{groupedStores.visitOnly.length !== 1 ? 's' : ''})
              </span>
              {expandedSections.visitOnly ? <ChevronUp className="w-4 h-4 text-yellow-400" /> : <ChevronDown className="w-4 h-4 text-yellow-400" />}
            </button>
            {expandedSections.visitOnly && (
              <div className="px-3 pb-3 space-y-2">
                {groupedStores.visitOnly.map((store, idx) => {
                  const originalIndex = storeData.findIndex(s => s.store_id === store.store_id);
                  return (
                    <div key={store.store_id || idx} className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white">{store.store_name}</span>
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${getTierBadge(store.tier)}`}>{store.tier}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-yellow-400">{getOutcomeLabel(store)}</span>
                        <button onClick={() => handleEditStore(store, originalIndex)} className="p-1 hover:bg-slate-700 rounded" title="Edit">
                          <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <button onClick={() => handleDeleteStore(originalIndex)} className="p-1 hover:bg-slate-700 rounded" title="Delete">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Order Only Section (Blue) */}
        {groupedStores.orderOnly.length > 0 && (
          <div className="bg-blue-900/20 border-l-4 border-blue-400 rounded-r-lg overflow-hidden">
            <button
              onClick={() => toggleSection('orderOnly')}
              className="w-full flex items-center justify-between p-3 hover:bg-blue-900/30 transition-colors"
            >
              <span className="text-sm font-medium text-blue-400">
                🔵 ORDER ONLY ({groupedStores.orderOnly.length} store{groupedStores.orderOnly.length !== 1 ? 's' : ''})
              </span>
              {expandedSections.orderOnly ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-blue-400" />}
            </button>
            {expandedSections.orderOnly && (
              <div className="px-3 pb-3 space-y-2">
                {groupedStores.orderOnly
                  .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
                  .map((store, idx) => {
                    const originalIndex = storeData.findIndex(s => s.store_id === store.store_id);
                    return (
                      <div key={store.store_id || idx} className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white">{store.store_name}</span>
                          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${getTierBadge(store.tier)}`}>{store.tier}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-blue-400 font-medium">₹{(store.revenue || 0).toLocaleString()}</span>
                          <span className="text-xs text-slate-400">(Phone Order)</span>
                          <button onClick={() => handleEditStore(store, originalIndex)} className="p-1 hover:bg-slate-700 rounded" title="Edit">
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          <button onClick={() => handleDeleteStore(originalIndex)} className="p-1 hover:bg-slate-700 rounded" title="Delete">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Other Sales Section (Purple) */}
        {otherSalesList.length > 0 && (
          <div className="bg-purple-900/20 border-l-4 border-purple-400 rounded-r-lg overflow-hidden">
            <button
              onClick={() => toggleSection('otherSales')}
              className="w-full flex items-center justify-between p-3 hover:bg-purple-900/30 transition-colors"
            >
              <span className="text-sm font-medium text-purple-400">
                🟣 OTHER SALES ({otherSalesList.length} sale{otherSalesList.length !== 1 ? 's' : ''})
              </span>
              {expandedSections.otherSales ? <ChevronUp className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4 text-purple-400" />}
            </button>
            {expandedSections.otherSales && (
              <div className="px-3 pb-3 space-y-2">
                {otherSalesList
                  .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
                  .map((sale, idx) => (
                    <div key={sale.id || idx} className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-medium rounded-full uppercase">
                          {sale.buyer?.type || 'OTHER'}
                        </span>
                        <span className="text-sm text-white">{sale.buyer?.name}</span>
                        {sale.buyer?.location && (
                          <span className="text-xs text-slate-400">{sale.buyer.location}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-purple-400 font-medium">₹{(sale.total_revenue || 0).toLocaleString()}</span>
                        <span className="text-xs text-slate-400">
                          ({sale.products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0} units)
                        </span>
                        <button onClick={() => handleDeleteOtherSale(sale.id, idx)} className="p-1 hover:bg-slate-700 rounded" title="Delete">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {storeData.length === 0 && otherSalesList.length === 0 && (
          <div className="text-center py-8">
            <Store className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No retail activity for {formatDateDisplay(selectedDate)}</p>
            <p className="text-slate-500 text-xs mt-1">Click &quot;+ Add Store&quot; to record visits or orders</p>
            <button
              onClick={() => setCurrentView('select_store')}
              className="mt-4 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add First Store
            </button>
          </div>
        )}
        </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-3 border-t border-slate-700 bg-slate-800/50">
        <span className="text-xs text-slate-400">
          {formatDateDisplay(selectedDate)} • {storeData.length} stores{otherSalesList.length > 0 ? ` + ${otherSalesList.length} other` : ''} • ₹{combinedTotals.revenue.toLocaleString()} total
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loadingData}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save for {formatDateDisplay(selectedDate)}</>}
          </button>
        </div>
      </div>
    </>
  );

  // Render Store Selection View
  const renderStoreSelection = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-teal-400" />
          <span className="text-base font-semibold text-white">Select Store to Add</span>
        </div>
        <button onClick={() => setCurrentView('summary')} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors">
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stores by name, area, or phone..."
            autoFocus
            className="w-full pl-9 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
          />
          {searchLoading && (
            <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400 animate-spin" />
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          💡 Type to search both retail and partner stores
        </p>
      </div>

      {/* Store List */}
      <div className="p-3 max-h-[50vh] overflow-y-auto space-y-2">
        {/* Loading State */}
        {searchLoading && filteredAvailableStores.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-teal-400 animate-spin" />
            <span className="ml-3 text-slate-400 text-sm">Searching stores...</span>
          </div>
        )}

        {/* Results */}
        {!searchLoading && filteredAvailableStores.length > 0 ? (
          filteredAvailableStores.map((store, idx) => {
            // Build full address for display
            const fullAddress = store.address || store.formatted_address || store.vicinity || 
              (store.area ? `${store.area}${store.city ? `, ${store.city}` : ', Delhi'}` : '');
            
            return (
              <button
                key={store.place_id || store.id || idx}
                onClick={() => handleSelectStore(store)}
                className="w-full p-3 hover:bg-slate-700/70 bg-slate-800/30 rounded-xl border border-slate-700 hover:border-teal-500 transition-all text-left group"
              >
                {/* Store Header: Name + Rating/Tier + Source Badge */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{store.store_name || store.name}</span>
                    {store.tier && (
                      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${getTierBadge(store.tier)}`}>{store.tier}</span>
                    )}
                    {/* Source badge */}
                    {store._source === 'partner' && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-teal-500/20 text-teal-400">Partner</span>
                    )}
                  </div>
                  {store.rating && (
                    <span className="text-sm text-amber-400 font-medium">★ {store.rating}</span>
                  )}
                </div>
                
                {/* Address */}
                {fullAddress && (
                  <p className="text-sm text-slate-400">{fullAddress}</p>
                )}
                
                {/* Phone */}
                {store.phone && (
                  <p className="text-sm text-emerald-400 mt-1">📞 {store.phone}</p>
                )}
              </button>
            );
          })
        ) : !searchLoading && (
          <div className="text-center py-8">
            <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">
              {searchQuery 
                ? 'No stores match your search' 
                : 'Type to search for stores'}
            </p>
            <p className="text-slate-500 text-xs mt-2">
              Search by store name, area, or phone number
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {filteredAvailableStores.length > 0 && `${filteredAvailableStores.length} stores found`}
          </span>
          <button
            onClick={() => setCurrentView('summary')}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Back to Summary
          </button>
        </div>
      </div>
    </>
  );

  // Render Entry Form View
  const renderEntryForm = () => {
    const outcomeConfig = VISIT_OUTCOMES.find(o => o.value === entryForm.visit_outcome);
    const showSalesInfo = outcomeConfig?.showSales || false;
    const visitsLocked = outcomeConfig?.locksVisits || false;
    const { totalSavings, avgDiscount } = calculateSavings(entryForm.products);

    // Get outcome color indicator
    const getOutcomeColor = () => {
      switch (entryForm.visit_outcome) {
        case 'sale_made': return 'bg-green-500';
        case 'pitched':
        case 'follow_up': return 'bg-yellow-500';
        case 'phone_order': return 'bg-blue-500';
        default: return 'bg-slate-500';
      }
    };

    return (
      <>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getOutcomeColor()}`} />
            <span className="text-base font-semibold text-white">{entryForm.store_name}</span>
            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${getTierBadge(entryForm.tier)}`}>{entryForm.tier}</span>
          </div>
          <div className="flex items-center gap-2">
            {editingStoreIndex !== null && (
              <button 
                onClick={() => {
                  if (window.confirm('Delete this store entry?')) {
                    handleDeleteStore(editingStoreIndex);
                    setCurrentView('summary');
                  }
                }}
                className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                title="Delete entry"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            )}
            <button onClick={() => setCurrentView('summary')} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Visit Info Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide">Visit Info</h4>
            
            {/* Row 1: Visits & Outcome */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Visits</label>
                <input
                  type="number"
                  min="0"
                  value={entryForm.visits}
                  onChange={(e) => setEntryForm(prev => ({ ...prev, visits: parseInt(e.target.value) || 0 }))}
                  disabled={visitsLocked}
                  className={`w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500 ${visitsLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {visitsLocked && <p className="text-[10px] text-yellow-400 mt-1">Locked: Phone/WhatsApp orders have 0 visits</p>}
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Visit Outcome</label>
                <select
                  value={entryForm.visit_outcome}
                  onChange={(e) => handleOutcomeChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500"
                >
                  {VISIT_OUTCOMES.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Stock, Engage, Reorder */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Stock</label>
                <select
                  value={entryForm.stock}
                  onChange={(e) => setEntryForm(prev => ({ ...prev, stock: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500"
                >
                  {STOCK_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Engage</label>
                <select
                  value={entryForm.engage}
                  onChange={(e) => setEntryForm(prev => ({ ...prev, engage: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500"
                >
                  {ENGAGE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Reorder %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={entryForm.reorder_percent}
                  onChange={(e) => setEntryForm(prev => ({ ...prev, reorder_percent: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Notes</label>
              <input
                type="text"
                value={entryForm.notes}
                onChange={(e) => setEntryForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Sales Info Section (Conditional) */}
          {showSalesInfo && (
            <div className="space-y-3 pt-3 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-2">
                  <Package className="w-4 h-4" /> Sales Info
                </h4>
                <button
                  onClick={() => setShowProductPicker(true)}
                  className="flex items-center gap-1 px-2 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 text-xs rounded transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Product
                </button>
              </div>

              {/* Order Summary Row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Orders</label>
                  <input
                    type="number"
                    min="0"
                    value={entryForm.orders}
                    onChange={(e) => setEntryForm(prev => ({ ...prev, orders: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Units</label>
                  <input
                    type="number"
                    min="0"
                    value={entryForm.units}
                    onChange={(e) => setEntryForm(prev => ({ ...prev, units: parseInt(e.target.value) || 0 }))}
                    readOnly={entryForm.products.length > 0}
                    className={`w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500 ${entryForm.products.length > 0 ? 'opacity-70' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Revenue</label>
                  <input
                    type="number"
                    min="0"
                    value={entryForm.revenue}
                    onChange={(e) => setEntryForm(prev => ({ ...prev, revenue: parseFloat(e.target.value) || 0 }))}
                    readOnly={entryForm.products.length > 0}
                    className={`w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-teal-500 ${entryForm.products.length > 0 ? 'opacity-70' : ''}`}
                  />
                </div>
              </div>

              {/* Products List */}
              {entryForm.products.length > 0 && (
                <div className="space-y-2">
                  {entryForm.products.map((product, idx) => {
                    const discount = product.mrp > 0 ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
                    const savings = (product.qty || 0) * ((product.mrp || 0) - (product.price || 0));
                    
                    return (
                      <div key={idx} className="bg-slate-700/50 p-3 rounded-lg space-y-2">
                        {/* Product Header */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white font-medium">{product.product_name}</span>
                          <button onClick={() => removeProduct(idx)} className="p-1 hover:bg-slate-600 rounded">
                            <X className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                        
                        {/* Product Fields */}
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">QTY</label>
                            <input
                              type="number"
                              min="1"
                              value={product.qty}
                              onChange={(e) => updateProduct(idx, 'qty', parseInt(e.target.value) || 1)}
                              className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-sm text-white focus:outline-none focus:border-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">PRICE</label>
                            <input
                              type="number"
                              min="0"
                              value={product.price}
                              onChange={(e) => updateProduct(idx, 'price', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-sm text-white focus:outline-none focus:border-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">MRP</label>
                            <input
                              type="text"
                              value={`₹${product.mrp}`}
                              readOnly
                              className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm text-slate-400"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">REVENUE</label>
                            <input
                              type="text"
                              value={`₹${product.revenue?.toLocaleString() || 0}`}
                              readOnly
                              className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-sm text-teal-400 font-medium"
                            />
                          </div>
                        </div>

                        {/* Quick Discount Buttons */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {DISCOUNT_BUTTONS.map(d => (
                            <button
                              key={d}
                              onClick={() => applyDiscount(idx, d)}
                              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                                discount === d 
                                  ? 'bg-teal-500 text-white' 
                                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                              }`}
                            >
                              -{d}%
                            </button>
                          ))}
                          <button
                            onClick={() => resetToMRP(idx)}
                            className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                              product.price === product.mrp 
                                ? 'bg-teal-500 text-white' 
                                : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                            }`}
                          >
                            MRP
                          </button>
                        </div>

                        {/* Savings Display */}
                        {savings > 0 && (
                          <p className="text-[10px] text-yellow-400">
                            💰 Saving ₹{savings.toLocaleString()} ({discount}% off)
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {/* Total Line */}
                  <div className="flex items-center justify-between p-2 bg-slate-700 rounded-lg">
                    <span className="text-xs text-slate-400">
                      Total: {totalSavings > 0 ? `Saved ₹${totalSavings.toLocaleString()} (${avgDiscount}% avg)` : 'No discounts applied'}
                    </span>
                    <span className="text-sm font-semibold text-teal-400">₹{entryForm.revenue.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Empty Products State */}
              {entryForm.products.length === 0 && (
                <div className="text-center py-4 bg-slate-700/30 rounded-lg">
                  <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No products added</p>
                  <p className="text-[10px] text-slate-500">Add products for auto-calculated totals, or enter manually above</p>
                </div>
              )}
            </div>
          )}

          {/* Consignment Stock Section (when partner has stock) */}
          {showSalesInfo && (
            <div className="space-y-3 pt-3 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-400" /> Consignment Stock
                </h4>
                <button
                  onClick={() => setShowQuickRestock(!showQuickRestock)}
                  className="flex items-center gap-1 px-2 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 text-xs rounded transition-colors"
                >
                  <Plus className="w-3 h-3" /> Quick Restock
                </button>
              </div>

              {/* Quick Restock Form */}
              {showQuickRestock && (
                <div className="bg-slate-700/50 p-3 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-500 mb-0.5">Product</label>
                      <select
                        value={quickRestockForm.product_id}
                        onChange={(e) => {
                          const product = availableProducts.find(p => (p.id || p._id) === e.target.value);
                          setQuickRestockForm(prev => ({
                            ...prev,
                            product_id: e.target.value,
                            product_name: product?.name || '',
                            cost_per_unit: product?.original_price || product?.price || 0
                          }));
                        }}
                        className="w-full px-2 py-1.5 bg-slate-600 border border-slate-500 rounded text-sm text-white focus:outline-none focus:border-teal-500"
                      >
                        <option value="">Select product...</option>
                        {availableProducts.map(p => (
                          <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={quickRestockForm.quantity}
                        onChange={(e) => setQuickRestockForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                        className="w-full px-2 py-1.5 bg-slate-600 border border-slate-500 rounded text-sm text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Cost/Unit</label>
                      <input
                        type="number"
                        min="0"
                        value={quickRestockForm.cost_per_unit}
                        onChange={(e) => setQuickRestockForm(prev => ({ ...prev, cost_per_unit: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-2 py-1.5 bg-slate-600 border border-slate-500 rounded text-sm text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowQuickRestock(false)}
                      className="px-3 py-1 text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleQuickRestock}
                      className="px-3 py-1 bg-teal-500 hover:bg-teal-600 text-white text-xs rounded transition-colors"
                    >
                      Add Stock
                    </button>
                  </div>
                </div>
              )}

              {/* Consignment Stock Loading */}
              {loadingConsignmentStock && (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="w-5 h-5 text-teal-400 animate-spin" />
                  <span className="ml-2 text-xs text-slate-400">Loading stock...</span>
                </div>
              )}

              {/* Consignment Stock List */}
              {!loadingConsignmentStock && consignmentStock.length > 0 && (
                <div className="space-y-2">
                  {consignmentStock.map((stock) => {
                    const soldEntry = entryForm.consignment_products.find(p => p.product_id === stock.product_id);
                    const qtySold = soldEntry?.quantity_sold || 0;
                    const exceedsStock = qtySold > stock.quantity_remaining;
                    
                    return (
                      <div key={stock.product_id} className="bg-slate-700/50 p-2 rounded-lg">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{stock.product_name}</p>
                            <p className="text-[10px] text-slate-400">
                              Stock: {stock.quantity_remaining} • ₹{stock.unit_price}/unit
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-[60px]">
                              <input
                                type="number"
                                min="0"
                                value={qtySold}
                                onChange={(e) => updateConsignmentProductQty(stock.product_id, e.target.value)}
                                placeholder="0"
                                className={`w-full px-2 py-1 text-center bg-slate-600 border rounded text-sm text-white focus:outline-none ${
                                  exceedsStock ? 'border-orange-500' : 'border-slate-500 focus:border-teal-500'
                                }`}
                              />
                            </div>
                            <div className="text-right min-w-[60px]">
                              <p className="text-sm font-medium text-teal-400">
                                ₹{(qtySold * stock.unit_price).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        {exceedsStock && (
                          <p className="text-[10px] text-orange-400 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Exceeds current stock ({stock.quantity_remaining} available)
                          </p>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Consignment Total */}
                  {entryForm.consignment_products.length > 0 && (
                    <div className="flex items-center justify-between p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <span className="text-xs text-orange-400">
                        Consignment Sales: {entryForm.consignment_products.reduce((sum, p) => sum + p.quantity_sold, 0)} units
                      </span>
                      <span className="text-sm font-semibold text-orange-400">
                        ₹{entryForm.consignment_products.reduce((sum, p) => sum + p.revenue, 0).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* No Consignment Stock */}
              {!loadingConsignmentStock && consignmentStock.length === 0 && (
                <div className="text-center py-4 bg-slate-700/30 rounded-lg">
                  <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No consignment stock at this store</p>
                  <p className="text-[10px] text-slate-500">Use Quick Restock to add stock, or enter sales above</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t border-slate-700 bg-slate-800/50">
          <button
            onClick={() => setCurrentView('summary')}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEntry}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            {editingStoreIndex !== null ? 'Update Entry' : 'Add Entry'}
          </button>
        </div>

        {/* Product Picker Modal */}
        {showProductPicker && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
            <div className="bg-slate-800 rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden border border-slate-700">
              <div className="flex items-center justify-between p-3 border-b border-slate-700">
                <span className="text-sm font-medium text-white">Add Product</span>
                <button onClick={() => setShowProductPicker(false)} className="p-1 hover:bg-slate-700 rounded">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="p-3 border-b border-slate-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div className="p-2 max-h-60 overflow-y-auto space-y-1">
                {availableProducts
                  .filter(p => !productSearch || (p.name || '').toLowerCase().includes(productSearch.toLowerCase()))
                  .filter(p => !entryForm.products.some(ep => ep.product_id === (p.id || p._id)))
                  .map((product, idx) => (
                    <button
                      key={product.id || idx}
                      onClick={() => handleAddProduct(product)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-slate-700 rounded-lg transition-colors text-left"
                    >
                      {product.image_url ? (
                        <img src={product.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-600 rounded flex items-center justify-center">
                          <Package className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{product.name}</p>
                        <p className="text-xs text-slate-400">MRP ₹{product.original_price || product.mrp || product.price || 0}</p>
                      </div>
                      <Plus className="w-4 h-4 text-teal-400" />
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="relative bg-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {currentView === 'summary' && renderSummaryView()}
        {currentView === 'select_store' && renderStoreSelection()}
        {currentView === 'entry_form' && renderEntryForm()}
      </div>

      {/* Other Sale Modal */}
      {showOtherSaleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowOtherSaleModal(false)}>
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-slate-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-purple-400">🏢</span>
                Add Other Sale
              </h3>
              <button onClick={() => setShowOtherSaleModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Buyer Name */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Buyer Name *</label>
                <input
                  type="text"
                  value={otherSale.buyer_name}
                  onChange={(e) => setOtherSale({...otherSale, buyer_name: e.target.value})}
                  placeholder="e.g., Love for Life Charitable Society"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              
              {/* Buyer Type */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Buyer Type</label>
                <select
                  value={otherSale.buyer_type}
                  onChange={(e) => setOtherSale({...otherSale, buyer_type: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="ngo">NGO</option>
                  <option value="shelter">Animal Shelter</option>
                  <option value="bulk">Bulk Buyer</option>
                  <option value="event">Event/Exhibition</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              {/* Phone & Location in row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={otherSale.phone}
                    onChange={(e) => setOtherSale({...otherSale, phone: e.target.value})}
                    placeholder="+91 99999 99999"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Location</label>
                  <input
                    type="text"
                    value={otherSale.location}
                    onChange={(e) => setOtherSale({...otherSale, location: e.target.value})}
                    placeholder="City, State"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              
              {/* Product Selection */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Product *</label>
                <select
                  onChange={(e) => {
                    const product = availableProducts.find(p => (p._id || p.id) === e.target.value);
                    if (product) {
                      setOtherSale({
                        ...otherSale,
                        products: [{
                          product_id: product._id || product.id,
                          name: product.name,
                          quantity: 1,
                          price: product.price || product.sell_price || product.original_price || 0
                        }]
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select Product</option>
                  {availableProducts.map(p => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.name} - ₹{p.price || p.sell_price || p.original_price || 0}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Quantity and Price */}
              {otherSale.products.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Quantity *</label>
                    <input
                      type="number"
                      value={otherSale.products[0]?.quantity || 1}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value) || 1;
                        const updated = [...otherSale.products];
                        updated[0] = {...updated[0], quantity: qty};
                        setOtherSale({...otherSale, products: updated});
                      }}
                      min="1"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Price</label>
                    <input
                      type="number"
                      value={otherSale.products[0]?.price || 0}
                      onChange={(e) => {
                        const price = parseFloat(e.target.value) || 0;
                        const updated = [...otherSale.products];
                        updated[0] = {...updated[0], price: price};
                        setOtherSale({...otherSale, products: updated});
                      }}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Total</label>
                    <div className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-green-400 font-semibold">
                      ₹{((otherSale.products[0]?.quantity || 0) * (otherSale.products[0]?.price || 0)).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Notes */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Notes</label>
                <input
                  type="text"
                  value={otherSale.notes}
                  onChange={(e) => setOtherSale({...otherSale, notes: e.target.value})}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowOtherSaleModal(false)}
                className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOtherSale}
                disabled={!otherSale.buyer_name || otherSale.products.length === 0}
                className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Save Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetailDataModal;
