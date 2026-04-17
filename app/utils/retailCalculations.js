/**
 * Retail Calculations Utility
 * 
 * SINGLE SOURCE OF TRUTH for all retail data calculations.
 * This file handles all field name variations from the backend API.
 * 
 * Backend may return data with different field names:
 * - total_revenue / totalRevenue / revenue
 * - total_orders / totalOrders / orders
 * - total_units / totalUnits / units
 * 
 * This utility normalizes all variations into a consistent format.
 */

/**
 * Calculate retail totals from any retail data structure
 * Handles all field name variations and data structures
 * 
 * @param {Object} retailData - Retail data object from API
 * @returns {Object} { revenue: number, orders: number, units: number }
 */
export const calculateRetailTotals = (retailData) => {
  if (!retailData) return { revenue: 0, orders: 0, units: 0 };

  // Handle direct values (check all possible field names)
  let revenue = 
    retailData.total_revenue ?? 
    retailData.totalRevenue ?? 
    retailData.revenue ?? 
    null;
    
  let orders = 
    retailData.total_orders ?? 
    retailData.totalOrders ?? 
    retailData.orders ?? 
    null;
    
  let units = 
    retailData.total_units ?? 
    retailData.totalUnits ?? 
    retailData.units ?? 
    null;

  // If direct values not found, try aggregating from stores array
  if (revenue === null && retailData.stores && Array.isArray(retailData.stores)) {
    revenue = retailData.stores.reduce((sum, store) => {
      const storeRevenue = parseFloat(store.revenue) || 
                          parseFloat(store.total_revenue) || 
                          parseFloat(store.totalRevenue) || 0;
      return sum + storeRevenue;
    }, 0);
  }

  if (orders === null && retailData.stores && Array.isArray(retailData.stores)) {
    orders = retailData.stores.reduce((sum, store) => {
      const storeOrders = parseInt(store.orders) || 
                         parseInt(store.total_orders) || 
                         parseInt(store.totalOrders) || 0;
      return sum + storeOrders;
    }, 0);
  }

  if (units === null && retailData.stores && Array.isArray(retailData.stores)) {
    units = retailData.stores.reduce((sum, store) => {
      const storeUnits = parseInt(store.units) || 
                        parseInt(store.total_units) || 
                        parseInt(store.totalUnits) || 0;
      return sum + storeUnits;
    }, 0);
  }

  // Ensure we return numbers (convert null to 0)
  return {
    revenue: parseFloat(revenue) || 0,
    orders: parseInt(orders) || 0,
    units: parseInt(units) || 0
  };
};

/**
 * Calculate retail totals from a stores array directly
 * 
 * @param {Array} stores - Array of store objects
 * @returns {Object} { revenue: number, orders: number, units: number }
 */
export const calculateRetailTotalsFromStores = (stores) => {
  if (!stores || !Array.isArray(stores) || stores.length === 0) {
    return { revenue: 0, orders: 0, units: 0 };
  }

  return stores.reduce((totals, store) => {
    const storeRevenue = parseFloat(store.revenue) || 
                        parseFloat(store.total_revenue) || 
                        parseFloat(store.totalRevenue) || 0;
    const storeOrders = parseInt(store.orders) || 
                       parseInt(store.total_orders) || 
                       parseInt(store.totalOrders) || 0;
    const storeUnits = parseInt(store.units) || 
                      parseInt(store.total_units) || 
                      parseInt(store.totalUnits) || 0;

    return {
      revenue: totals.revenue + storeRevenue,
      orders: totals.orders + storeOrders,
      units: totals.units + storeUnits
    };
  }, { revenue: 0, orders: 0, units: 0 });
};

/**
 * Format currency value for display
 * 
 * @param {number} value - The value to format
 * @param {string} currency - Currency symbol (default: ₹)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = '₹') => {
  const num = parseFloat(value) || 0;
  if (num >= 100000) {
    return `${currency}${(num / 100000).toFixed(1)}L`;
  } else if (num >= 1000) {
    return `${currency}${(num / 1000).toFixed(1)}K`;
  }
  return `${currency}${num.toFixed(0)}`;
};

/**
 * Get normalized retail data from any API response structure
 * This handles the various formats returned by daily, weekly, monthly, yearly endpoints
 * 
 * @param {Object} apiResponse - Raw API response
 * @param {string} periodType - 'daily' | 'weekly' | 'monthly' | 'yearly'
 * @returns {Object} Normalized retail data with totals
 */
export const normalizeRetailData = (apiResponse, periodType = 'daily') => {
  if (!apiResponse) return { totals: { revenue: 0, orders: 0, units: 0 }, stores: [] };

  // The API might return data directly or nested under 'retail' or 'data'
  const data = apiResponse.retail || apiResponse.data || apiResponse;
  
  // Calculate totals
  const totals = calculateRetailTotals(data);
  
  // Get stores array if present
  const stores = data.stores || [];

  return {
    totals,
    stores,
    period: data.period || periodType,
    raw: data
  };
};

export default {
  calculateRetailTotals,
  calculateRetailTotalsFromStores,
  formatCurrency,
  normalizeRetailData
};
