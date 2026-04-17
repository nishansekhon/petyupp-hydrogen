import React from 'react';
import { Star, Phone, Check } from 'lucide-react';
import { getTierColor, getTierIcon, formatRating, isInDatabase, getStoreId, formatPhone } from '../../utils/storeUtils';

/**
 * StoreCard component - displays a store in grid/card format
 * Used in Sales Hub search results
 * 
 * Props:
 * - store: Store object with name, address, tier, rating, phone, etc.
 * - isSelected: Boolean indicating if store is selected
 * - onSelect: Function called when store is clicked/selected
 * - showCheckbox: Boolean to show/hide checkbox
 * - isDarkMode: Boolean for theme
 */
const StoreCard = ({ 
  store, 
  isSelected = false, 
  onSelect, 
  showCheckbox = false,
  isDarkMode = true 
}) => {
  const storeId = getStoreId(store);
  const inDb = isInDatabase(store);
  
  return (
    <div 
      onClick={onSelect}
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected 
          ? 'border-teal-500 bg-teal-500/10' 
          : isDarkMode 
            ? 'bg-slate-700/50 border-slate-600 hover:border-slate-500' 
            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {showCheckbox && (
            <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
              isSelected 
                ? 'bg-teal-500 border-teal-500' 
                : isDarkMode ? 'border-slate-500' : 'border-gray-300'
            }`}>
              {isSelected && <Check size={12} className="text-white" />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p 
              className={`text-sm font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              title={store.store_name || store.name}
            >
              {store.store_name || store.name}
            </p>
            <p 
              className={`text-xs truncate ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
              title={store.address}
            >
              {store.address}
            </p>
          </div>
        </div>
        {store.tier && (
          <span 
            className="ml-2 px-1.5 py-0.5 rounded text-xs font-bold text-white flex-shrink-0" 
            style={{ backgroundColor: getTierColor(store.tier) }}
          >
            {getTierIcon(store.tier)} {store.tier}
          </span>
        )}
      </div>
      <div className={`flex items-center gap-3 text-xs ${showCheckbox ? 'ml-7' : ''}`}>
        {(store.avg_rating || store.rating) && (
          <span className="flex items-center gap-1">
            <Star size={10} className="text-yellow-500 fill-yellow-500" />
            {formatRating(store.avg_rating || store.rating)}
          </span>
        )}
        {store.phone && (
          <span className="flex items-center gap-1">
            <Phone size={10} className={isDarkMode ? 'text-slate-400' : 'text-gray-400'} />
            {formatPhone(store.phone)}
          </span>
        )}
        <span className={inDb ? 'text-green-400' : 'text-blue-400'}>
          {inDb ? '✓ In DB' : 'New'}
        </span>
      </div>
    </div>
  );
};

export default StoreCard;
