import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';
import { AlertCircle, Trash2, Package, Plus, X, Check, RefreshCw, ShoppingCart, Search, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

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

const EditEcommerceDataModal = ({ isOpen, onClose, period, ecomProducts, onSave, initialDate }) => {
  // Date state for historical data entry
  const [selectedDate, setSelectedDate] = useState(() => initialDate || getLocalDateString());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  
  const [productData, setProductData] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [adSpendOnlyProducts, setAdSpendOnlyProducts] = useState({});
  const [saving, setSaving] = useState(false);
  const [kpis, setKpis] = useState({
    avg_order_value: 500,
    customer_acquisition_cost: 100,
    return_rate: 2.0,
    repeat_customer_rate: 30.0,
    _auto_aov: 0,
    _auto_cac: 0
  });

  const fetchAvailableProducts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/products`);
      const data = await response.json();
      const products = Array.isArray(data) ? data : (data.products || []);
      setAvailableProducts(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      setAvailableProducts([]);
    }
  }, []);

  // Fetch data for selected date from the API
  const fetchDataForDate = useCallback(async (dateStr) => {
    setLoadingData(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/sales/ecommerce/period-data?type=daily&key=${dateStr}`);
      const result = await response.json();
      
      if (result.success && result.data && result.data.products && result.data.products.length > 0) {
        const adSpendOnlyMap = {};
        const products = result.data.products.map((item, index) => {
          if (item.adSpendOnly) {
            adSpendOnlyMap[index] = true;
          }
          
          return {
            product_id: item.product?.product_id || item.product_id,
            sku: item.product?.sku || item.sku || 'N/A',
            name: item.product?.product_name || item.product_name || item.name || 'Unknown Product',
            weight: item.product?.weight || item.weight || 'N/A',
            sell_price: item.product?.ecom_sell_price || item.ecom_sell_price || item.sell_price || 0,
            sale_price: item.sale_price || item.product?.ecom_sell_price || item.ecom_sell_price || item.sell_price || 0,
            cogs: item.product?.ecom_cogs || item.ecom_cogs || item.cogs || 0,
            margin: item.product?.ecom_margin || item.ecom_margin || item.margin || 0,
            target_units: item.target_units || 20,
            impressions: item.funnel?.impressions || item.impressions || 0,
            clicks: item.funnel?.clicks || item.clicks || 0,
            ad_spend: item.funnel?.ad_spend || item.ad_spend || 0,
            add_to_cart: item.funnel?.add_to_cart || item.add_to_cart || 0,
            checkouts: item.funnel?.checkouts || item.checkouts || 0,
            orders: item.funnel?.orders || item.orders || 0,
            units_sold: item.sold_units || item.units_sold || 0,
            adSpendOnly: item.adSpendOnly || false
          };
        });
        setProductData(products);
        setAdSpendOnlyProducts(adSpendOnlyMap);
      } else {
        // NO DATA for this date - start with EMPTY state (CRITICAL FIX)
        setProductData([]);
        setAdSpendOnlyProducts({});
      }
    } catch (error) {
      console.error('Error fetching data for date:', error);
      // On error, also start empty
      setProductData([]);
      setAdSpendOnlyProducts({});
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailableProducts();
  }, [fetchAvailableProducts]);

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

  const toggleAdSpendOnly = (index) => {
    const isCurrentlyAdSpendOnly = adSpendOnlyProducts[index];
    
    setAdSpendOnlyProducts(prev => ({
      ...prev,
      [index]: !isCurrentlyAdSpendOnly
    }));
    
    if (!isCurrentlyAdSpendOnly) {
      setProductData(prev => prev.map((p, i) => {
        if (i !== index) return p;
        return { ...p, clicks: 0, add_to_cart: 0, checkouts: 0, orders: 0, units_sold: 0 };
      }));
    }
  };

  const addProduct = (product) => {
    const productId = product.id || product._id || product.product_id;
    const productSku = product.sku || product.slug || `SKU-${productId?.toString().slice(-6)}`;
    
    const alreadyExists = productData.some(p => {
      const existingId = p.product_id;
      return existingId && productId && existingId === productId;
    });
    
    if (alreadyExists) {
      alert('Product already added');
      return;
    }
    
    setProductData(prev => [...prev, {
      product_id: productId,
      sku: productSku,
      name: product.name || product.product_name || 'Unknown Product',
      weight: product.weight || '',
      sell_price: product.price || product.sell_price || 0,
      sale_price: product.price || product.sell_price || 0,
      cogs: product.cogs || Math.round((product.price || product.sell_price || 0) * 0.6),
      margin: product.margin || Math.round((product.price || product.sell_price || 0) * 0.4),
      impressions: 0, clicks: 0, ad_spend: 0, add_to_cart: 0, checkouts: 0, orders: 0, units_sold: 0, target_units: 20
    }]);
    setShowProductPicker(false);
    setSearchQuery('');
  };

  const removeProduct = (index) => {
    setProductData(prev => prev.filter((_, i) => i !== index));
    setAdSpendOnlyProducts(prev => {
      const newMap = {};
      Object.keys(prev).forEach(key => {
        const keyNum = parseInt(key);
        if (keyNum < index) newMap[keyNum] = prev[keyNum];
        else if (keyNum > index) newMap[keyNum - 1] = prev[keyNum];
      });
      return newMap;
    });
  };

  const updateProduct = (index, field, value) => {
    setProductData(prev => prev.map((p, i) => {
      if (i !== index) return p;
      const parsedValue = field === 'sale_price' || field === 'sell_price' || field === 'ad_spend'
        ? parseFloat(value) || 0 
        : parseInt(value) || 0;
      return { ...p, [field]: parsedValue };
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Calculate product-level revenue with fallback: units * price, or orders * price if no units
      const dataToSave = productData.map((product, index) => {
        const units = product.units_sold || 0;
        const orders = product.orders || 0;
        const price = product.sale_price || product.sell_price || 0;
        const cogs = product.cogs || 0;
        const margin = product.margin || (price - cogs);
        
        // Revenue: prefer units * price, fallback to orders * price if units is 0
        const revenue = units > 0 ? (units * price) : (orders * price);
        const profit = units > 0 ? (units * margin) : (orders * margin);
        
        return {
          ...product,
          adSpendOnly: adSpendOnlyProducts[index] || false,
          revenue,
          profit,
          sell_price: price,
          sale_price: price
        };
      });
      
      const productsWithData = dataToSave.filter(p => 
        p.product_id || p.sku || p.ad_spend > 0 || p.impressions > 0 || 
        p.clicks > 0 || p.add_to_cart > 0 || p.checkouts > 0 || p.orders > 0 || p.units_sold > 0
      );

      // Recalculate totals from the processed products to ensure consistency
      const finalProducts = productsWithData.length > 0 ? productsWithData : dataToSave;
      
      const calculatedTotals = {
        impressions: finalProducts.reduce((sum, p) => sum + (p.impressions || 0), 0),
        clicks: finalProducts.reduce((sum, p) => sum + (p.clicks || 0), 0),
        ad_spend: finalProducts.reduce((sum, p) => sum + (p.ad_spend || 0), 0),
        add_to_cart: finalProducts.reduce((sum, p) => sum + (p.add_to_cart || 0), 0),
        checkouts: finalProducts.reduce((sum, p) => sum + (p.checkouts || 0), 0),
        orders: finalProducts.reduce((sum, p) => sum + (p.orders || 0), 0),
        units_sold: finalProducts.reduce((sum, p) => sum + (p.units_sold || 0), 0),
        target_units: finalProducts.reduce((sum, p) => sum + (p.target_units || 0), 0),
        revenue: finalProducts.reduce((sum, p) => sum + (p.revenue || 0), 0),
        profit: finalProducts.reduce((sum, p) => sum + (p.profit || 0), 0),
        click_rate,
        cart_rate,
        checkout_rate,
        conversion_rate
      };

      // Pass selectedDate to the onSave handler
      await onSave({ 
        products: finalProducts, 
        kpis, 
        totals: calculatedTotals,
        selectedDate: selectedDate  // Pass the date for the parent to use
      });
    } finally {
      setSaving(false);
    }
  };

  const totals = {
    impressions: productData.reduce((sum, p) => sum + (p.impressions || 0), 0),
    clicks: productData.reduce((sum, p) => sum + (p.clicks || 0), 0),
    ad_spend: productData.reduce((sum, p) => sum + (p.ad_spend || 0), 0),
    add_to_cart: productData.reduce((sum, p) => sum + (p.add_to_cart || 0), 0),
    checkouts: productData.reduce((sum, p) => sum + (p.checkouts || 0), 0),
    orders: productData.reduce((sum, p) => sum + (p.orders || 0), 0),
    units_sold: productData.reduce((sum, p) => sum + (p.units_sold || 0), 0),
    revenue: productData.reduce((sum, p) => {
      const units = p.units_sold || 0;
      const orders = p.orders || 0;
      const price = p.sale_price || p.sell_price || 0;
      // Revenue: prefer units * price, fallback to orders * price
      return sum + (units > 0 ? (units * price) : (orders * price));
    }, 0)
  };

  const click_rate = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(1) : 0;
  const cart_rate = totals.impressions > 0 ? ((totals.add_to_cart / totals.impressions) * 100).toFixed(1) : 0;
  const checkout_rate = totals.impressions > 0 ? ((totals.checkouts / totals.impressions) * 100).toFixed(1) : 0;
  const conversion_rate = totals.impressions > 0 ? ((totals.orders / totals.impressions) * 100).toFixed(2) : 0;

  const autoAOV = totals.orders > 0 ? parseFloat((totals.revenue / totals.orders).toFixed(2)) : 0;
  const autoCAC = totals.orders > 0 ? parseFloat((totals.ad_spend / totals.orders).toFixed(2)) : 0;

  useEffect(() => {
    setKpis(prev => ({
      ...prev,
      _auto_aov: autoAOV,
      _auto_cac: autoCAC,
      avg_order_value: prev._auto_aov === 0 ? autoAOV : prev.avg_order_value,
      customer_acquisition_cost: prev._auto_cac === 0 ? autoCAC : prev.customer_acquisition_cost
    }));
  }, [autoAOV, autoCAC]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-slate-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Header with Date Picker */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">E-Commerce Data</h2>
              <p className="text-xs text-slate-400">Track product performance</p>
            </div>
          </div>
          
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
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

        {/* Content with scroll */}
        <div className="overflow-y-auto max-h-[calc(85vh-140px)] p-4">
          {/* Loading State */}
          {loadingData && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-teal-400 animate-spin" />
              <span className="ml-3 text-slate-400 text-sm">Loading data for {formatDateDisplay(selectedDate)}...</span>
            </div>
          )}

          {!loadingData && (
            <>
              {/* Compact Section Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-teal-400" />
                    Product Metrics
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Track impressions, ad spend, and sales</p>
                </div>
                <button
                  onClick={() => setShowProductPicker(!showProductPicker)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Product
                </button>
              </div>

              {/* Product Picker */}
              {showProductPicker && (
                <div className="bg-slate-900/50 border border-teal-500/30 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-white">Select Product</h4>
                    <button onClick={() => setShowProductPicker(false)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-xs placeholder-slate-400 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {availableProducts.filter(p => {
                      const searchLower = searchQuery.toLowerCase();
                      const alreadyAdded = productData.find(pd => pd.product_id === (p.id || p._id));
                      return !alreadyAdded && (!searchQuery || (p.name || '').toLowerCase().includes(searchLower));
                    }).map((product, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => addProduct(product)} 
                        className="flex items-center justify-between p-2 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                      >
                        <span className="text-xs text-white">{product.name || product.product_name}</span>
                        <span className="text-xs text-teal-400">₹{product.price || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {productData.length === 0 && (
                <div className="text-center py-12 bg-slate-800/30 rounded-lg border border-dashed border-slate-600">
                  <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">No products tracked for {formatDateDisplay(selectedDate)}</p>
                  <p className="text-slate-500 text-xs mt-1">Click &quot;+ Add Product&quot; to start tracking</p>
                  <button
                    onClick={() => setShowProductPicker(true)}
                    className="mt-4 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Product
                  </button>
                </div>
              )}

              {/* Compact Product Cards */}
              {productData.length > 0 && (
                <div className="space-y-3">
            {productData.map((product, idx) => {
              const isAdSpendOnly = adSpendOnlyProducts[idx];
              
              return (
                <div 
                  key={idx} 
                  className={`bg-slate-800/50 rounded-lg p-3 border ${
                    isAdSpendOnly ? 'border-amber-500/30' : 'border-slate-700/50'
                  }`}
                >
                  {/* Product Header - Single Row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm">{product.name}</span>
                      <span className="px-1.5 py-0.5 bg-slate-600 text-slate-300 text-xs rounded">{product.sku}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                        <span className={`${isAdSpendOnly ? 'text-amber-400' : 'text-slate-400'}`}>Ad Only</span>
                        <div 
                          className={`relative w-8 h-4 rounded-full transition-colors ${
                            isAdSpendOnly ? 'bg-amber-500' : 'bg-slate-600'
                          }`}
                          onClick={() => toggleAdSpendOnly(idx)}
                        >
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${
                            isAdSpendOnly ? 'translate-x-4' : 'translate-x-0.5'
                          }`} />
                        </div>
                      </label>
                      <button
                        onClick={() => removeProduct(idx)}
                        className="p-1 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Ad Spend Only Indicator */}
                  {isAdSpendOnly && (
                    <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-400">
                      <AlertCircle className="w-3 h-3" />
                      Tracking ad spend only - no sales
                    </div>
                  )}

                  {/* Compact Input Grid - All in One Row */}
                  <div className="grid grid-cols-8 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase block mb-0.5">Impr</label>
                      <input
                        type="number"
                        value={product.impressions || ''}
                        onChange={(e) => updateProduct(idx, 'impressions', e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs text-center focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-amber-400 uppercase block mb-0.5">Ad ₹</label>
                      <input
                        type="number"
                        step="0.01"
                        value={product.ad_spend || ''}
                        onChange={(e) => updateProduct(idx, 'ad_spend', e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 text-xs text-center focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] uppercase block mb-0.5 ${isAdSpendOnly ? 'text-slate-600' : 'text-slate-500'}`}>Clicks</label>
                      <input
                        type="number"
                        value={product.clicks || ''}
                        onChange={(e) => updateProduct(idx, 'clicks', e.target.value)}
                        disabled={isAdSpendOnly}
                        placeholder="0"
                        className={`w-full px-2 py-1.5 border rounded text-xs text-center focus:outline-none ${
                          isAdSpendOnly 
                            ? 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed' 
                            : 'bg-slate-700 border-slate-600 text-white focus:border-teal-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] uppercase block mb-0.5 ${isAdSpendOnly ? 'text-slate-600' : 'text-slate-500'}`}>Cart</label>
                      <input
                        type="number"
                        value={product.add_to_cart || ''}
                        onChange={(e) => updateProduct(idx, 'add_to_cart', e.target.value)}
                        disabled={isAdSpendOnly}
                        placeholder="0"
                        className={`w-full px-2 py-1.5 border rounded text-xs text-center focus:outline-none ${
                          isAdSpendOnly 
                            ? 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed' 
                            : 'bg-slate-700 border-slate-600 text-white focus:border-teal-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] uppercase block mb-0.5 ${isAdSpendOnly ? 'text-slate-600' : 'text-slate-500'}`}>Chkout</label>
                      <input
                        type="number"
                        value={product.checkouts || ''}
                        onChange={(e) => updateProduct(idx, 'checkouts', e.target.value)}
                        disabled={isAdSpendOnly}
                        placeholder="0"
                        className={`w-full px-2 py-1.5 border rounded text-xs text-center focus:outline-none ${
                          isAdSpendOnly 
                            ? 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed' 
                            : 'bg-slate-700 border-slate-600 text-white focus:border-teal-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] uppercase block mb-0.5 ${isAdSpendOnly ? 'text-slate-600' : 'text-slate-500'}`}>Orders</label>
                      <input
                        type="number"
                        value={product.orders || ''}
                        onChange={(e) => updateProduct(idx, 'orders', e.target.value)}
                        disabled={isAdSpendOnly}
                        placeholder="0"
                        className={`w-full px-2 py-1.5 border rounded text-xs text-center focus:outline-none ${
                          isAdSpendOnly 
                            ? 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed' 
                            : 'bg-slate-700 border-slate-600 text-white focus:border-teal-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] uppercase block mb-0.5 ${isAdSpendOnly ? 'text-slate-600' : 'text-slate-500'}`}>Units</label>
                      <input
                        type="number"
                        value={product.units_sold || ''}
                        onChange={(e) => updateProduct(idx, 'units_sold', e.target.value)}
                        disabled={isAdSpendOnly}
                        placeholder="0"
                        className={`w-full px-2 py-1.5 border rounded text-xs text-center focus:outline-none ${
                          isAdSpendOnly 
                            ? 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed' 
                            : 'bg-slate-700 border-slate-600 text-white focus:border-teal-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-teal-400 uppercase block mb-0.5">Price</label>
                      <input
                        type="number"
                        value={product.sale_price || ''}
                        onChange={(e) => updateProduct(idx, 'sale_price', e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1.5 bg-teal-500/10 border border-teal-500/30 rounded text-teal-400 text-xs text-center focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  {/* Revenue Row - Compact */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
                    <span className="text-xs text-slate-400">Revenue:</span>
                    <span className={`text-xs font-medium ${isAdSpendOnly ? 'text-slate-500' : 'text-teal-400'}`}>
                      {isAdSpendOnly ? '₹0 (Ad Only)' : (() => {
                        const units = product.units_sold || 0;
                        const orders = product.orders || 0;
                        const price = product.sale_price || product.sell_price || 0;
                        const revenue = units > 0 ? (units * price) : (orders * price);
                        const source = units > 0 ? 'units' : (orders > 0 ? 'orders' : '');
                        return `₹${revenue.toLocaleString()}${source === 'orders' ? ' (from orders)' : ''}`;
                      })()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          )}

          {/* Compact Funnel Summary - only show when there's data */}
          {productData.length > 0 && (
          <div className="mt-4 bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <h4 className="text-xs font-medium text-slate-400 mb-2">Funnel Summary</h4>
            <div className="flex items-center justify-between gap-1">
              {[
                { label: 'Impr', value: totals.impressions },
                { label: 'Clicks', value: totals.clicks, rate: click_rate },
                { label: 'Cart', value: totals.add_to_cart, rate: cart_rate },
                { label: 'Chkout', value: totals.checkouts, rate: checkout_rate },
                { label: 'Orders', value: totals.orders, rate: conversion_rate, highlight: true }
              ].map((item, idx) => (
                <React.Fragment key={item.label}>
                  {idx > 0 && <span className="text-slate-600 text-xs">→</span>}
                  <div className={`text-center px-2 py-1.5 rounded flex-1 ${
                    item.highlight ? 'bg-teal-500/20' : 'bg-slate-700/50'
                  }`}>
                    <span className={`block text-sm font-semibold ${item.highlight ? 'text-teal-400' : 'text-white'}`}>
                      {item.value.toLocaleString()}
                    </span>
                    <span className="block text-[10px] text-slate-400">{item.label}</span>
                    {item.rate !== undefined && (
                      <span className="block text-[10px] text-teal-400">{item.rate}%</span>
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>
            
            {/* Quick Stats Row */}
            <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-700/50">
              <div className="text-center px-2 py-1.5 bg-amber-500/10 rounded">
                <span className="block text-sm font-semibold text-amber-400">₹{totals.ad_spend.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400">Ad Spend</span>
              </div>
              <div className="text-center px-2 py-1.5 bg-slate-700/50 rounded">
                <span className="block text-sm font-semibold text-white">{totals.units_sold}</span>
                <span className="text-[10px] text-slate-400">Units</span>
              </div>
              <div className="text-center px-2 py-1.5 bg-teal-500/10 rounded">
                <span className="block text-sm font-semibold text-teal-400">₹{totals.revenue.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400">Revenue</span>
              </div>
              <div className="text-center px-2 py-1.5 bg-slate-700/50 rounded">
                <span className={`block text-sm font-semibold ${
                  totals.ad_spend > 0 && totals.revenue > totals.ad_spend ? 'text-teal-400' : 'text-amber-400'
                }`}>
                  {totals.ad_spend > 0 ? (totals.revenue / totals.ad_spend).toFixed(2) : '0.00'}x
                </span>
                <span className="text-[10px] text-slate-400">ROAS</span>
              </div>
            </div>
          </div>
          )}
          </>
          )}
        </div>

        {/* Modern Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700 bg-slate-800/50">
          <div className="text-xs text-slate-400">
            {formatDateDisplay(selectedDate)} • {productData.length} product{productData.length !== 1 ? 's' : ''} • 
            Total: ₹{totals.revenue.toLocaleString()}
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
              disabled={saving || loadingData}
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
    </div>
  );
};

export default EditEcommerceDataModal;
