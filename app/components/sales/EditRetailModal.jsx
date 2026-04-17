import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';
import { Package, Plus, Trash2, Search, X, Check, RefreshCw, Store, BarChart3, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const API_BASE = API_BASE_URL;

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

const EditRetailModal = ({ isOpen, onClose, period, stores, onSave, initialDate }) => {
  // Date state for historical data entry
  const [selectedDate, setSelectedDate] = useState(() => initialDate || getLocalDateString());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  
  const [storeData, setStoreData] = useState([]);
  const [availableStores, setAvailableStores] = useState([]);
  const [showStorePicker, setShowStorePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  // Product tracking states
  const [storeProducts, setStoreProducts] = useState({});
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [selectedStoreForProduct, setSelectedStoreForProduct] = useState(null);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  const fetchAvailableStores = useCallback(async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/v1/partner-stores`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await response.json();
      
      // Handle different response structures
      let stores = [];
      if (data.success && data.stores) {
        stores = data.stores;
      } else if (Array.isArray(data)) {
        stores = data;
      } else if (data.stores) {
        stores = data.stores;
      }
      
      console.log('EditRetailModal: Fetched partner stores:', stores.length);
      setAvailableStores(stores);
    } catch (error) {
      console.error('Error fetching partner stores:', error);
      setAvailableStores([]);
    }
  }, []);

  // Fixed: Properly fetch products with error handling
  const fetchAvailableProducts = useCallback(async () => {
    setLoadingProducts(true);
    console.log('Fetching products from:', `${API_BASE}/api/products`);
    
    try {
      const response = await fetch(`${API_BASE}/api/products`);
      const data = await response.json();
      console.log('Products API response:', data);
      
      // Handle different response structures
      const productsList = Array.isArray(data) ? data : (data.products || data.data || []);
      console.log('Parsed products list:', productsList.length, 'products');
      
      setAvailableProducts(productsList);
      
      if (productsList.length === 0) {
        console.warn('No products returned from API, trying alternate endpoint...');
        // Try alternate endpoint
        const altResponse = await fetch(`${API_BASE}/api/v1/products`);
        const altData = await altResponse.json();
        const altProducts = Array.isArray(altData) ? altData : (altData.products || []);
        console.log('Alternate endpoint products:', altProducts.length);
        setAvailableProducts(altProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setAvailableProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Fetch data for selected date from the API
  const fetchDataForDate = useCallback(async (dateStr) => {
    setLoadingData(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/sales/retail/period-data?type=daily&key=${dateStr}`);
      const result = await response.json();
      
      if (result.success && result.data && result.data.stores && result.data.stores.length > 0) {
        const productsMap = {};
        const storeDataList = result.data.stores.map(s => {
          const storeId = s.store?.store_id || s.store_id || `store_${Date.now()}`;
          
          if (s.products && Array.isArray(s.products)) {
            productsMap[storeId] = s.products;
          }
          
          return {
            store_id: storeId,
            store_name: s.store?.store_name || s.store_name || 'Unknown Store',
            tier: s.store?.tier || s.tier || 'SILVER',
            visits: s.funnel?.visits_this_week || s.visits || 0,
            orders: s.funnel?.orders_placed || s.orders || 0,
            units: s.summary?.total_sold_units || s.units || 0,
            revenue: s.summary?.total_revenue || s.revenue || 0,
            placements: s.placements || 0,
            stockLevel: s.funnel?.stock_level || s.stockLevel || 'Medium',
            ownerEngagement: s.ownerEngagement || 'Neutral',
            reorderPercent: s.funnel?.reorder_rate || s.reorderPercent || 50,
            notes: s.notes || ''
          };
        });
        
        setStoreData(storeDataList);
        setStoreProducts(productsMap);
      } else {
        // NO DATA for this date - start with EMPTY state (CRITICAL FIX)
        setStoreData([]);
        setStoreProducts({});
      }
    } catch (error) {
      console.error('Error fetching data for date:', error);
      // On error, also start empty
      setStoreData([]);
      setStoreProducts({});
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailableStores();
  }, [fetchAvailableStores]);

  // Reset date and fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      const dateToUse = initialDate || getLocalDateString();
      setSelectedDate(dateToUse);
      fetchDataForDate(dateToUse);
    }
  }, [isOpen, initialDate, fetchDataForDate]);

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

  // Auto-calculate store metrics when products change
  useEffect(() => {
    if (Object.keys(storeProducts).length > 0) {
      setStoreData(prev => prev.map(store => {
        const products = storeProducts[store.store_id] || [];
        if (products.length > 0) {
          const totalUnits = products.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
          const totalRevenue = products.reduce((sum, p) => sum + ((parseInt(p.quantity) || 0) * (parseFloat(p.price) || 0)), 0);
          return { ...store, units: totalUnits, revenue: totalRevenue };
        }
        return store;
      }));
    }
  }, [storeProducts]);

  const addStore = (store) => {
    const storeId = store._id || store.store_id || store.id;
    
    if (storeData.find(s => s.store_id === storeId)) {
      alert('Store already added');
      return;
    }
    
    setStoreData(prev => [...prev, {
      store_id: storeId,
      store_name: store.store_name || store.name || 'Unknown Store',
      tier: store.tier || 'SILVER',
      visits: 0, orders: 0, units: 0, revenue: 0, placements: 0,
      stockLevel: 'Medium', ownerEngagement: 'Neutral', reorderPercent: 50, notes: ''
    }]);
    
    setStoreProducts(prev => ({ ...prev, [storeId]: [] }));
    setShowStorePicker(false);
    setSearchQuery('');
  };

  const removeStore = (storeId) => {
    setStoreData(prev => prev.filter(s => s.store_id !== storeId));
    setStoreProducts(prev => {
      const newProducts = { ...prev };
      delete newProducts[storeId];
      return newProducts;
    });
  };

  const updateStoreField = (storeId, field, value) => {
    setStoreData(prev => prev.map(s => 
      s.store_id === storeId ? { ...s, [field]: value } : s
    ));
  };

  // Product management
  const openAddProductModal = (storeId) => {
    setSelectedStoreForProduct(storeId);
    setShowProductPicker(true);
    setProductSearch('');
    fetchAvailableProducts(); // Fetch products when modal opens
  };

  const addProductToStore = (product) => {
    // For retail, use original_price (MRP) because retail partners buy at MRP, not discounted price
    // API returns: price (sale price), original_price (MRP)
    const mrp = product.original_price || product.originalPrice || product.mrp || product.price || 0;
    
    const newProduct = {
      productId: product.id || product._id || product.productId,
      productName: product.name || product.productName,
      sku: product.sku || product.productId || 'N/A',
      quantity: 1,
      price: mrp,              // For retail, default to MRP (editable)
      mrp: mrp,                // Reference - original MRP
      originalPrice: mrp,      // Backup reference
      image: product.image || product.image_url || product.images?.[0]?.url || null
    };

    setStoreProducts(prev => ({
      ...prev,
      [selectedStoreForProduct]: [...(prev[selectedStoreForProduct] || []), newProduct]
    }));
    setShowProductPicker(false);
    setSelectedStoreForProduct(null);
  };

  const removeProductFromStore = (storeId, productIndex) => {
    setStoreProducts(prev => ({
      ...prev,
      [storeId]: (prev[storeId] || []).filter((_, index) => index !== productIndex)
    }));
  };

  const updateProductField = (storeId, productIndex, field, value) => {
    setStoreProducts(prev => ({
      ...prev,
      [storeId]: (prev[storeId] || []).map((product, index) =>
        index === productIndex ? { ...product, [field]: value } : product
      )
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave = storeData.map(store => ({
        ...store,
        products: storeProducts[store.store_id] || []
      }));
      
      // Calculate KPIs for the period
      const kpis = {
        avg_order_value: totals.orders > 0 ? Math.round(totals.revenue / totals.orders) : 0,
        conversion_rate: totals.visits > 0 ? Math.round((totals.orders / totals.visits) * 100) : 0,
        reorder_rate: totals.avgReorder || 0
      };
      
      // Pass selectedDate to the onSave handler
      await onSave({ 
        stores: dataToSave, 
        totals, 
        kpis,
        selectedDate: selectedDate  // Pass the date for the parent to use
      });
    } finally {
      setSaving(false);
    }
  };

  // Calculate totals
  const totals = {
    visits: storeData.reduce((sum, s) => sum + (parseInt(s.visits) || 0), 0),
    orders: storeData.reduce((sum, s) => sum + (parseInt(s.orders) || 0), 0),
    units: storeData.reduce((sum, s) => sum + (parseInt(s.units) || 0), 0),
    revenue: storeData.reduce((sum, s) => sum + (parseInt(s.revenue) || 0), 0),
    avgReorder: storeData.length > 0 ? Math.round(storeData.reduce((sum, s) => sum + (parseInt(s.reorderPercent) || 0), 0) / storeData.length) : 0
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-xl w-full max-w-3xl max-h-[85vh] overflow-hidden border border-slate-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
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
          
          <button onClick={onClose} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-120px)] p-3">
          {/* Loading State */}
          {loadingData && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-teal-400 animate-spin" />
              <span className="ml-3 text-slate-400 text-sm">Loading data for {formatDateDisplay(selectedDate)}...</span>
            </div>
          )}

          {!loadingData && (
            <>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Store className="w-4 h-4 text-teal-400" />
                  Store Performance
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Track visits, orders, and product sales</p>
              </div>
              <button
                onClick={() => setShowStorePicker(!showStorePicker)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Store
              </button>
            </div>

          {/* Store Picker */}
          {showStorePicker && (
            <div className="bg-slate-900/50 border border-teal-500/30 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-white">Select Store</h4>
                <button onClick={() => setShowStorePicker(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search stores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-xs placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {availableStores.filter(st => {
                  const storeId = st.id || st._id || st.store_id;
                  const alreadyAdded = storeData.find(sd => sd.store_id === storeId);
                  const matchesSearch = !searchQuery || (st.store_name || st.name || '').toLowerCase().includes(searchQuery.toLowerCase());
                  return matchesSearch && !alreadyAdded;
                }).map((store, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => addStore(store)} 
                    className="flex items-center justify-between p-2 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white">{store.store_name || store.name}</span>
                      {store.tier && (
                        <span className={`px-1.5 py-0.5 text-[10px] rounded ${
                          store.tier === 'GOLD' ? 'bg-amber-500/20 text-amber-400' :
                          store.tier === 'PLATINUM' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-slate-500/20 text-slate-300'
                        }`}>{store.tier}</span>
                      )}
                    </div>
                    <span className="text-xs text-teal-400">Add →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Store Cards */}
          {storeData.length === 0 ? (
            <div className="text-center py-8 bg-slate-800/30 rounded-lg border border-dashed border-slate-600">
              <Store className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No retail activity for {formatDateDisplay(selectedDate)}</p>
              <p className="text-xs text-slate-500 mt-1">Click &quot;+ Add Store&quot; to begin tracking</p>
              <button 
                onClick={() => setShowStorePicker(true)} 
                className="mt-4 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add First Store
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {storeData.map((store, idx) => (
                <div key={idx} className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
                  {/* Store Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm">{store.store_name}</span>
                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                        store.tier === 'GOLD' ? 'bg-amber-500/20 text-amber-400' :
                        store.tier === 'PLATINUM' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-slate-400/20 text-slate-300'
                      }`}>{store.tier}</span>
                    </div>
                    <button
                      onClick={() => removeStore(store.store_id)}
                      className="p-1 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Store Metrics Row */}
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase block mb-0.5">Visits</label>
                      <input
                        type="number"
                        value={store.visits || ''}
                        onChange={(e) => updateStoreField(store.store_id, 'visits', e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs text-center focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase block mb-0.5">Orders</label>
                      <input
                        type="number"
                        value={store.orders || ''}
                        onChange={(e) => updateStoreField(store.store_id, 'orders', e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs text-center focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-teal-400 uppercase block mb-0.5">Units</label>
                      <input
                        type="number"
                        value={store.units || ''}
                        onChange={(e) => updateStoreField(store.store_id, 'units', e.target.value)}
                        placeholder="0"
                        readOnly={(storeProducts[store.store_id] || []).length > 0}
                        className={`w-full px-2 py-1.5 border rounded text-xs text-center focus:outline-none ${
                          (storeProducts[store.store_id] || []).length > 0
                            ? 'bg-teal-500/20 border-teal-500/30 text-teal-400 cursor-not-allowed'
                            : 'bg-teal-500/10 border-teal-500/30 text-teal-400 focus:border-teal-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-teal-400 uppercase block mb-0.5">Revenue</label>
                      <input
                        type="number"
                        value={store.revenue || ''}
                        onChange={(e) => updateStoreField(store.store_id, 'revenue', e.target.value)}
                        placeholder="0"
                        readOnly={(storeProducts[store.store_id] || []).length > 0}
                        className={`w-full px-2 py-1.5 border rounded text-xs text-center focus:outline-none ${
                          (storeProducts[store.store_id] || []).length > 0
                            ? 'bg-teal-500/20 border-teal-500/30 text-teal-400 cursor-not-allowed'
                            : 'bg-teal-500/10 border-teal-500/30 text-teal-400 focus:border-teal-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase block mb-0.5">Place</label>
                      <input
                        type="number"
                        value={store.placements || ''}
                        onChange={(e) => updateStoreField(store.store_id, 'placements', e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs text-center focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  {/* Second Row - Stock, Engagement, Reorder, Notes */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase block mb-0.5">Stock</label>
                      <select
                        value={store.stockLevel || 'Medium'}
                        onChange={(e) => updateStoreField(store.store_id, 'stockLevel', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs focus:outline-none focus:border-teal-500"
                      >
                        <option value="High">🟢 High</option>
                        <option value="Medium">🟡 Med</option>
                        <option value="Low">🔴 Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase block mb-0.5">Engage</label>
                      <select
                        value={store.ownerEngagement || 'Neutral'}
                        onChange={(e) => updateStoreField(store.store_id, 'ownerEngagement', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs focus:outline-none focus:border-teal-500"
                      >
                        <option value="Positive">😊 Good</option>
                        <option value="Neutral">😐 OK</option>
                        <option value="Negative">😞 Bad</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase block mb-0.5">Reorder%</label>
                      <input
                        type="number"
                        value={store.reorderPercent || ''}
                        onChange={(e) => updateStoreField(store.store_id, 'reorderPercent', e.target.value)}
                        placeholder="50"
                        className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs text-center focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase block mb-0.5">Notes</label>
                      <input
                        type="text"
                        value={store.notes || ''}
                        onChange={(e) => updateStoreField(store.store_id, 'notes', e.target.value)}
                        placeholder="Notes..."
                        className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs focus:outline-none focus:border-teal-500 placeholder-slate-500"
                      />
                    </div>
                  </div>

                  {/* Product Sales Section */}
                  <div className="border-t border-slate-700/50 pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Products
                      </span>
                      <button
                        onClick={() => openAddProductModal(store.store_id)}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] text-teal-400 hover:bg-teal-500/10 rounded transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
                    </div>

                    {(storeProducts[store.store_id] || []).length === 0 ? (
                      <div className="text-center py-2 text-xs text-slate-500">
                        No products • Click Add
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(storeProducts[store.store_id] || []).map((product, pIdx) => {
                          const mrp = product.mrp || product.originalPrice || product.price;
                          const discountPercent = mrp > 0 && product.price < mrp 
                            ? Math.round((1 - product.price / mrp) * 100) 
                            : 0;
                          
                          return (
                            <div key={pIdx} className="bg-slate-700/30 rounded p-2">
                              {/* Product Name Row */}
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-white truncate flex-1">{product.productName}</span>
                                <button
                                  onClick={() => removeProductFromStore(store.store_id, pIdx)}
                                  className="p-0.5 hover:bg-red-500/20 rounded text-red-400 ml-2"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              
                              {/* Quantity, Price, MRP, Revenue Row */}
                              <div className="grid grid-cols-4 gap-2 items-end">
                                {/* Quantity */}
                                <div>
                                  <label className="text-[9px] text-slate-500 uppercase block mb-0.5">Qty</label>
                                  <input
                                    type="number"
                                    value={product.quantity}
                                    onChange={(e) => updateProductField(store.store_id, pIdx, 'quantity', parseInt(e.target.value) || 0)}
                                    className="w-full px-1.5 py-1 bg-slate-600 border border-slate-500 rounded text-white text-xs text-center focus:outline-none focus:border-teal-500"
                                  />
                                </div>
                                
                                {/* Price (Editable) */}
                                <div>
                                  <label className="text-[9px] text-slate-500 uppercase block mb-0.5">
                                    Price
                                    {discountPercent > 0 && (
                                      <span className="text-green-400 ml-1">-{discountPercent}%</span>
                                    )}
                                  </label>
                                  <input
                                    type="number"
                                    value={product.price}
                                    onChange={(e) => updateProductField(store.store_id, pIdx, 'price', parseInt(e.target.value) || 0)}
                                    className="w-full px-1.5 py-1 bg-slate-600 border border-slate-500 rounded text-white text-xs text-center focus:outline-none focus:border-teal-500"
                                  />
                                </div>
                                
                                {/* MRP Reference (Read-only) */}
                                <div>
                                  <label className="text-[9px] text-slate-500 uppercase block mb-0.5">MRP</label>
                                  <div className={`px-1.5 py-1 bg-slate-700/50 border border-slate-600 rounded text-xs text-center ${
                                    discountPercent > 0 ? 'text-slate-400 line-through' : 'text-slate-300'
                                  }`}>
                                    ₹{mrp}
                                  </div>
                                </div>
                                
                                {/* Revenue (Auto-calculated) */}
                                <div>
                                  <label className="text-[9px] text-teal-400 uppercase block mb-0.5">Revenue</label>
                                  <div className="px-1.5 py-1 bg-teal-500/20 border border-teal-500/30 rounded text-teal-400 text-xs text-center font-medium">
                                    ₹{((product.quantity || 0) * (product.price || 0)).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Quick Discount Buttons */}
                              <div className="flex items-center gap-1 mt-2">
                                <span className="text-[9px] text-slate-500">Quick:</span>
                                {[15, 20, 40, 50].map(discount => (
                                  <button
                                    key={discount}
                                    onClick={() => {
                                      const discountedPrice = Math.round(mrp * (1 - discount / 100));
                                      updateProductField(store.store_id, pIdx, 'price', discountedPrice);
                                    }}
                                    className={`px-1.5 py-0.5 text-[9px] rounded transition-colors ${
                                      discountPercent === discount
                                        ? 'bg-green-500 text-white'
                                        : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                                    }`}
                                  >
                                    -{discount}%
                                  </button>
                                ))}
                                <button
                                  onClick={() => updateProductField(store.store_id, pIdx, 'price', mrp)}
                                  className={`px-1.5 py-0.5 text-[9px] rounded transition-colors ${
                                    product.price === mrp
                                      ? 'bg-slate-500 text-white'
                                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                                  }`}
                                >
                                  MRP
                                </button>
                              </div>
                              
                              {/* Discount Savings Badge */}
                              {discountPercent > 0 && (
                                <div className="mt-1.5">
                                  <span className="text-[9px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                                    💰 Saving ₹{((mrp - product.price) * (product.quantity || 0)).toLocaleString()} ({discountPercent}% off)
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* Products Summary with Discount */}
                        {(() => {
                          const products = storeProducts[store.store_id] || [];
                          const totalMRP = products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.mrp || p.originalPrice || p.price || 0)), 0);
                          const totalRevenue = products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);
                          const totalSavings = totalMRP - totalRevenue;
                          const avgDiscount = totalMRP > 0 ? Math.round((1 - totalRevenue / totalMRP) * 100) : 0;
                          
                          return (
                            <div className="flex justify-between items-center pt-2 border-t border-slate-600/50 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400">Total:</span>
                                {totalSavings > 0 && (
                                  <span className="text-green-400 text-[10px]">
                                    Saved ₹{totalSavings.toLocaleString()} ({avgDiscount}% avg)
                                  </span>
                                )}
                              </div>
                              <span className="text-teal-400 font-medium">₹{totalRevenue.toLocaleString()}</span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Compact Totals */}
          {storeData.length > 0 && (
            <div className="bg-slate-800/30 rounded-lg p-3 mt-3">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-white">Totals</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                <div className="text-center p-2 bg-slate-700/50 rounded">
                  <p className="text-lg font-bold text-white">{totals.visits}</p>
                  <p className="text-[10px] text-slate-400">Visits</p>
                </div>
                <div className="text-center p-2 bg-slate-700/50 rounded">
                  <p className="text-lg font-bold text-white">{totals.orders}</p>
                  <p className="text-[10px] text-slate-400">Orders</p>
                </div>
                <div className="text-center p-2 bg-slate-700/50 rounded">
                  <p className="text-lg font-bold text-white">{totals.units}</p>
                  <p className="text-[10px] text-slate-400">Units</p>
                </div>
                <div className="text-center p-2 bg-teal-500/20 rounded">
                  <p className="text-lg font-bold text-teal-400">₹{totals.revenue.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400">Revenue</p>
                </div>
                <div className="text-center p-2 bg-slate-700/50 rounded">
                  <p className="text-lg font-bold text-white">{totals.avgReorder}%</p>
                  <p className="text-[10px] text-slate-400">Reorder</p>
                </div>
              </div>
            </div>
          )}
          </>
          )}
        </div>

        {/* Modern Footer */}
        <div className="flex items-center justify-between p-3 border-t border-slate-700 bg-slate-800/50">
          <div className="text-xs text-slate-400">
            {formatDateDisplay(selectedDate)} • {storeData.length} store{storeData.length !== 1 ? 's' : ''} • ₹{totals.revenue.toLocaleString()} total
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save for {formatDateDisplay(selectedDate)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Compact Product Picker Modal */}
      {showProductPicker && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
          onClick={() => setShowProductPicker(false)}
        >
          <div 
            className="bg-slate-800 rounded-lg w-full max-w-sm max-h-[60vh] overflow-hidden border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-700">
              <span className="text-sm font-medium text-white">Add Product</span>
              <button onClick={() => setShowProductPicker(false)} className="p-1 hover:bg-slate-700 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Search */}
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Product List */}
            <div className="overflow-y-auto max-h-[40vh] px-3 pb-3">
              {loadingProducts ? (
                <div className="text-center py-6">
                  <RefreshCw className="w-6 h-6 text-teal-400 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Loading products...</p>
                </div>
              ) : availableProducts.length === 0 ? (
                <div className="text-center py-6">
                  <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No products found</p>
                  <p className="text-xs text-slate-500 mt-1">Check API connection</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {availableProducts
                    .filter(p => !productSearch || (p.name || '').toLowerCase().includes(productSearch.toLowerCase()))
                    .map((product, idx) => (
                      <button
                        key={idx}
                        onClick={() => addProductToStore(product)}
                        className="w-full flex items-center gap-2 p-2 hover:bg-slate-700 rounded-lg text-left transition-colors"
                      >
                        {product.image_url || product.image || product.images?.[0]?.url ? (
                          <img src={product.image_url || product.image || product.images[0]?.url} alt="" className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-slate-600 rounded flex items-center justify-center">
                            <Package className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{product.name}</p>
                          <p className="text-xs text-slate-400">MRP ₹{product.original_price || product.originalPrice || product.mrp || product.price || 0}</p>
                        </div>
                        <Plus className="w-4 h-4 text-teal-400 flex-shrink-0" />
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditRetailModal;
