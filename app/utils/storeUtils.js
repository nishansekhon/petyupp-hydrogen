/**
 * Store utilities - shared between Sales Hub and Retail pages
 * Tier classification, formatting, badge colors
 */

// Tier badge background colors (Tailwind classes)
export const getTierBadgeClass = (tier) => {
  const tierNum = typeof tier === 'string' ? parseInt(tier.replace(/\D/g, '')) : tier;
  
  const colors = {
    1: 'bg-yellow-500 text-black',
    2: 'bg-orange-500 text-white',
    3: 'bg-blue-500 text-white',
    4: 'bg-gray-500 text-white',
  };
  return colors[tierNum] || colors[3];
};

// Tier hex colors for inline styles
export const getTierColor = (tier) => {
  const tierStr = String(tier).toUpperCase();
  const colors = {
    'TIER1': '#EAB308', // yellow-500
    'TIER2': '#F97316', // orange-500
    'TIER3': '#3B82F6', // blue-500
    'TIER4': '#6B7280', // gray-500
    '1': '#EAB308',
    '2': '#F97316',
    '3': '#3B82F6',
    '4': '#6B7280',
  };
  return colors[tierStr] || '#6B7280';
};

// Tier icon (emoji)
export const getTierIcon = (tier) => {
  const tierStr = String(tier).toUpperCase();
  const icons = {
    'TIER1': '⭐', 'TIER2': '🟡', 'TIER3': '🔶', 'TIER4': '❌',
    '1': '⭐', '2': '🟡', '3': '🔶', '4': '❌',
  };
  return icons[tierStr] || '•';
};

// Tier label
export const getTierLabel = (tier) => {
  const tierNum = typeof tier === 'string' ? parseInt(tier.replace(/\D/g, '')) : tier;
  return `TIER${tierNum}`;
};

// Tier description
export const getTierDescription = (tier) => {
  const tierNum = typeof tier === 'string' ? parseInt(tier.replace(/\D/g, '')) : tier;
  const descriptions = {
    1: 'Premium - High rating, many reviews, strong conversion potential',
    2: 'High Value - Good rating, decent reviews, reasonable prospect',
    3: 'Medium - Average rating, fewer reviews, requires more effort',
    4: 'Low Priority - Low rating or minimal data, deprioritize',
  };
  return descriptions[tierNum] || descriptions[3];
};

// Status badge class
export const getStatusBadgeClass = (status) => {
  const statusLower = String(status).toLowerCase();
  
  if (statusLower === 'in_database' || statusLower === 'in db' || statusLower === 'indatabase') {
    return 'bg-teal-500/20 text-teal-400';
  }
  if (statusLower === 'new') {
    return 'bg-blue-500/20 text-blue-400';
  }
  return 'bg-yellow-500/20 text-yellow-400';
};

// Format rating display
export const formatRating = (rating, reviewCount) => {
  if (!rating && rating !== 0) return 'N/A';
  const ratingStr = typeof rating === 'number' ? rating.toFixed(1) : rating;
  if (reviewCount) return `${ratingStr} (${reviewCount})`;
  return ratingStr;
};

// Check if store is in database
export const isInDatabase = (store) => {
  return store.in_database || 
         store.inDatabase || 
         store.status === 'In DB' || 
         store.status === 'in_database' ||
         store.status === 'inDatabase';
};

// Get unique store ID (different APIs return different fields)
export const getStoreId = (store) => {
  return store.place_id || store.id || store.store_id || store.store_name;
};

// Format phone number - can display full or truncated
export const formatPhone = (phone, truncate = false) => {
  if (!phone) return null;
  if (truncate) return phone.slice(-4);
  // Clean and format phone number
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  return phone;
};

// Format address (truncate if too long)
export const formatAddress = (address, maxLength = 50) => {
  if (!address) return 'Address not available';
  if (address.length <= maxLength) return address;
  return address.substring(0, maxLength) + '...';
};
