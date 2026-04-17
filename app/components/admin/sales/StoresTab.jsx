import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { 
  Filter, Store, RefreshCw, Star, ChevronLeft, ChevronRight, Search,
  Eye, Phone, MapPin, Edit2, CheckCircle, XCircle, Clock, Handshake,
  ChevronRight as Arrow, ExternalLink, Download, Smartphone, Layers
} from 'lucide-react';
import { StoresTabSkeleton } from './SalesSkeletons';

// Status configuration with colors and labels
const STATUS_CONFIG = {
  discovered: { label: 'Discovered', color: 'bg-slate-500', textColor: 'text-slate-300', bgLight: 'bg-slate-100', textLight: 'text-slate-700' },
  visited: { label: 'Visited', color: 'bg-blue-500', textColor: 'text-blue-300', bgLight: 'bg-blue-100', textLight: 'text-blue-700' },
  pitched: { label: 'Pitched', color: 'bg-yellow-500', textColor: 'text-yellow-300', bgLight: 'bg-yellow-100', textLight: 'text-yellow-700' },
  ordered: { label: 'Ordered', color: 'bg-orange-500', textColor: 'text-orange-300', bgLight: 'bg-orange-100', textLight: 'text-orange-700' },
  partner: { label: 'Partner', color: 'bg-teal-500', textColor: 'text-teal-300', bgLight: 'bg-teal-100', textLight: 'text-teal-700' },
  rejected: { label: 'Rejected', color: 'bg-red-500', textColor: 'text-red-300', bgLight: 'bg-red-100', textLight: 'text-red-700' },
  // Legacy status mappings
  not_visited: { label: 'Discovered', color: 'bg-slate-500', textColor: 'text-slate-300', bgLight: 'bg-slate-100', textLight: 'text-slate-700' },
  visited_interested: { label: 'Interested', color: 'bg-green-500', textColor: 'text-green-300', bgLight: 'bg-green-100', textLight: 'text-green-700' },
  visited_declined: { label: 'Declined', color: 'bg-red-500', textColor: 'text-red-300', bgLight: 'bg-red-100', textLight: 'text-red-700' },
  stocked: { label: 'Partner', color: 'bg-teal-500', textColor: 'text-teal-300', bgLight: 'bg-teal-100', textLight: 'text-teal-700' }
};

// Category configuration
const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'pet_store', label: 'Pet Store', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'vet_clinic', label: 'Vet Clinic', color: 'bg-emerald-500/20 text-emerald-400' },
  { value: 'dog_groomer', label: 'Dog Groomer', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'pet_spa', label: 'Pet Spa', color: 'bg-pink-500/20 text-pink-400' },
  { value: 'dog_boarding', label: 'Dog Boarding', color: 'bg-amber-500/20 text-amber-400' },
  { value: 'pet_shelter', label: 'Pet Shelter', color: 'bg-red-500/20 text-red-400' },
  { value: 'pet_cafe', label: 'Pet Cafe', color: 'bg-orange-500/20 text-orange-400' }
];

// Get category badge styling
const getCategoryBadge = (category) => {
  const cat = CATEGORY_OPTIONS.find(c => c.value === category);
  return cat?.color || 'bg-blue-500/20 text-blue-400';
};

// Get category label
const getCategoryLabel = (category) => {
  const cat = CATEGORY_OPTIONS.find(c => c.value === category);
  return cat?.label || 'Pet Store';
};

// Classify phone type
const classifyPhoneType = (phone, existingType) => {
  if (existingType) return existingType;
  if (!phone) return 'landline';
  const cleaned = phone.replace(/^\+91|[\s\-\(\)]/g, '');
  return (cleaned.length === 10 && /^[6789]/.test(cleaned)) ? 'mobile' : 'landline';
};

const StoresTab = ({
  isDarkMode,
  storesData,
  storeFilters,
  setStoreFilters,
  currentPage,
  setCurrentPage,
  loading,
  onRefresh,
  onSearch
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Debounce search input - trigger backend search after 300ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Trigger backend search when debounced value changes
  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedSearch);
    }
  }, [debouncedSearch, onSearch]);
  
  // Filter stores by category on frontend
  const filteredStores = storesData.stores?.filter(store => {
    if (!categoryFilter) return true;
    return (store.category || 'pet_store') === categoryFilter;
  }) || [];
  
  // Calculate funnel stats from filtered stores
  const calculateFunnelStats = (stores) => {
    const stats = {
      total: stores.length,
      discovered: 0,
      visited: 0,
      pitched: 0,
      ordered: 0,
      partner: 0,
      rejected: 0
    };
    stores.forEach(store => {
      const status = store.status || store.visit_status || 'discovered';
      if (status === 'not_visited' || status === 'discovered') stats.discovered++;
      else if (status === 'visited' || status === 'visited_interested') stats.visited++;
      else if (status === 'pitched') stats.pitched++;
      else if (status === 'ordered') stats.ordered++;
      else if (status === 'partner' || status === 'stocked') stats.partner++;
      else if (status === 'rejected' || status === 'visited_declined') stats.rejected++;
    });
    return stats;
  };
  
  const funnelStats = categoryFilter 
    ? calculateFunnelStats(filteredStores)
    : {
        total: storesData.totalStores || 0,
        discovered: storesData.statusCounts?.discovered || storesData.statusCounts?.not_visited || 0,
        visited: storesData.statusCounts?.visited || storesData.statusCounts?.visited_interested || 0,
        pitched: storesData.statusCounts?.pitched || 0,
        ordered: storesData.statusCounts?.ordered || 0,
        partner: storesData.statusCounts?.partner || storesData.statusCounts?.stocked || 0,
        rejected: storesData.statusCounts?.rejected || storesData.statusCounts?.visited_declined || 0
      };

  // CSV Export function
  const handleExportCSV = () => {
    const storesToExport = categoryFilter ? filteredStores : (storesData.stores || []);
    
    if (storesToExport.length === 0) {
      return;
    }
    
    // CSV Headers
    const headers = ['Name', 'Category', 'Phone', 'Phone Type', 'Email', 'Address', 'Area', 'City', 'Rating', 'Status', 'Google Place ID'];
    
    // Convert stores to CSV rows
    const rows = storesToExport.map(store => {
      const phoneType = classifyPhoneType(store.phone, store.phone_type);
      return [
        `"${(store.store_name || store.name || '').replace(/"/g, '""')}"`,
        getCategoryLabel(store.category || 'pet_store'),
        store.phone || '',
        phoneType,
        store.email || '',
        `"${(store.address || '').replace(/"/g, '""')}"`,
        store.area || '',
        store.city || 'Delhi',
        store.avg_rating || store.google_maps_rating || '',
        STATUS_CONFIG[store.status || store.visit_status]?.label || 'Discovered',
        store.place_id || store.google_place_id || ''
      ].join(',');
    });
    
    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    const catLabel = categoryFilter || 'all';
    link.href = url;
    link.download = `petyupp-leads-${catLabel}-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.discovered;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isDarkMode 
          ? `${config.color}/20 ${config.textColor}` 
          : `${config.bgLight} ${config.textLight}`
      }`}>
        {config.label}
      </span>
    );
  };

  // Stores to display - use category-filtered or all
  const displayStores = categoryFilter ? filteredStores : (storesData.stores || []);

  // Show skeleton while loading
  if (loading) {
    return <StoresTabSkeleton isDarkMode={isDarkMode} />;
  }

  return (
    <div className="space-y-4">
      {/* Funnel Stats Header */}
      <div className={`backdrop-blur-lg border rounded-2xl p-4 ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Sales Funnel
          </h3>
          <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            {funnelStats.total} total stores
          </span>
        </div>
        
        {/* Funnel Flow */}
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {[
            { key: 'discovered', label: 'Discovered', count: funnelStats.discovered, color: 'bg-slate-500' },
            { key: 'visited', label: 'Visited', count: funnelStats.visited, color: 'bg-blue-500' },
            { key: 'pitched', label: 'Pitched', count: funnelStats.pitched, color: 'bg-yellow-500' },
            { key: 'ordered', label: 'Ordered', count: funnelStats.ordered, color: 'bg-orange-500' },
            { key: 'partner', label: 'Partner', count: funnelStats.partner, color: 'bg-teal-500' }
          ].map((stage, idx, arr) => (
            <React.Fragment key={stage.key}>
              <button
                onClick={() => {
                  setStoreFilters(prev => ({ ...prev, status: stage.key }));
                  setCurrentPage(1);
                }}
                className={`flex flex-col items-center min-w-[80px] px-3 py-2 rounded-lg transition-all ${
                  storeFilters.status === stage.key
                    ? isDarkMode ? 'bg-slate-700 ring-2 ring-teal-500' : 'bg-gray-100 ring-2 ring-teal-500'
                    : isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full ${stage.color} flex items-center justify-center text-white font-bold text-sm mb-1`}>
                  {stage.count}
                </div>
                <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                  {stage.label}
                </span>
              </button>
              {idx < arr.length - 1 && (
                <Arrow size={16} className={`flex-shrink-0 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`} />
              )}
            </React.Fragment>
          ))}
          
          {/* Rejected (separate) */}
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-dashed border-slate-600">
            <button
              onClick={() => {
                setStoreFilters(prev => ({ ...prev, status: 'rejected' }));
                setCurrentPage(1);
              }}
              className={`flex flex-col items-center min-w-[70px] px-2 py-2 rounded-lg transition-all ${
                storeFilters.status === 'rejected'
                  ? isDarkMode ? 'bg-slate-700 ring-2 ring-red-500' : 'bg-gray-100 ring-2 ring-red-500'
                  : isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-xs mb-1">
                {funnelStats.rejected}
              </div>
              <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Rejected</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className={`backdrop-blur-lg border rounded-2xl overflow-hidden ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search stores by name, area, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            
            {/* Status Filter */}
            <select
              value={storeFilters.status}
              onChange={(e) => { setStoreFilters(prev => ({ ...prev, status: e.target.value })); setCurrentPage(1); }}
              className={`px-3 py-2 rounded-lg border text-sm ${
                isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">All Status</option>
              <option value="discovered">Discovered</option>
              <option value="visited">Visited</option>
              <option value="pitched">Pitched</option>
              <option value="ordered">Ordered</option>
              <option value="partner">Partner</option>
              <option value="rejected">Rejected</option>
            </select>
            
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className={`px-3 py-2 rounded-lg border text-sm ${
                isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              {CATEGORY_OPTIONS.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            
            {/* Area Filter */}
            <input
              type="text"
              placeholder="Filter by area"
              value={storeFilters.area}
              onChange={(e) => { setStoreFilters(prev => ({ ...prev, area: e.target.value })); setCurrentPage(1); }}
              className={`px-3 py-2 rounded-lg border text-sm w-40 ${
                isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            
            {/* Clear Filters */}
            {(storeFilters.status || storeFilters.area || storeFilters.zone || searchQuery || categoryFilter) && (
              <button
                onClick={() => { 
                  setStoreFilters({ zone: '', area: '', status: '', tier: '' }); 
                  setSearchQuery('');
                  setCategoryFilter('');
                  setCurrentPage(1); 
                }}
                className={`px-3 py-2 rounded-lg text-sm ${
                  isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                Clear
              </button>
            )}
            
            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              disabled={displayStores.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                isDarkMode 
                  ? 'bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white disabled:opacity-50' 
                  : 'bg-gray-100 border border-gray-300 text-gray-600 hover:bg-gray-200 disabled:opacity-50'
              }`}
              title="Export filtered stores to CSV"
            >
              <Download size={16} />
              Export CSV
            </button>
            
            {/* Refresh */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                title="Refresh"
              >
                <RefreshCw size={16} className={isDarkMode ? 'text-slate-400' : 'text-gray-500'} />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {displayStores.length === 0 ? (
          <div className={`p-12 text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            <Store className="mx-auto mb-3 opacity-50" size={40} />
            <p className="font-medium mb-1">No stores found</p>
            <p className="text-sm">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Store</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Contact</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Location</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Rating</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Status</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Last Visit</th>
                    <th className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                  {displayStores.map((store, idx) => {
                    const phoneType = classifyPhoneType(store.phone, store.phone_type);
                    return (
                    <tr key={store._id || store.id || idx} className={`${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'} transition-colors`}>
                      {/* Store Name + Category Badge */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                            <Store size={18} className={isDarkMode ? 'text-slate-400' : 'text-gray-500'} />
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {store.store_name || 'Unknown Store'}
                            </p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryBadge(store.category || 'pet_store')}`}>
                              {getCategoryLabel(store.category || 'pet_store')}
                            </span>
                          </div>
                        </div>
                      </td>
                      
                      {/* Contact with Phone Type */}
                      <td className="px-4 py-3">
                        {store.phone ? (
                          <a 
                            href={`tel:${store.phone}`}
                            className={`flex items-center gap-1.5 text-sm ${phoneType === 'mobile' ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-400 hover:text-slate-300'}`}
                          >
                            {phoneType === 'mobile' ? <Smartphone size={12} /> : <Phone size={12} />}
                            {store.phone}
                            <span className={`text-[9px] px-1 py-0.5 rounded ${phoneType === 'mobile' ? 'bg-emerald-500/20' : 'bg-slate-500/20'}`}>
                              {phoneType === 'mobile' ? 'Mobile' : 'Landline'}
                            </span>
                          </a>
                        ) : (
                          <span className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>No phone</span>
                        )}
                        {store.contact_person && (
                          <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            {store.contact_person}
                          </p>
                        )}
                      </td>
                      
                      {/* Location */}
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-1.5">
                          <MapPin size={12} className={`mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} />
                          <div>
                            <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{store.area || 'Unknown'}</p>
                            <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{store.zone || store.city || ''}</p>
                          </div>
                        </div>
                      </td>
                      
                      {/* Rating */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-yellow-500 fill-yellow-500" />
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {store.avg_rating?.toFixed(1) || '-'}
                          </span>
                          {store.total_reviews > 0 && (
                            <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                              ({store.total_reviews})
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* Status */}
                      <td className="px-4 py-3">
                        {getStatusBadge(store.status || store.visit_status || 'discovered')}
                      </td>
                      
                      {/* Last Visit */}
                      <td className="px-4 py-3">
                        {store.last_visited ? (
                          <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                            {new Date(store.last_visited).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        ) : (
                          <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Never</span>
                        )}
                      </td>
                      
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                            title="View details"
                          >
                            <Eye size={14} className={isDarkMode ? 'text-slate-400' : 'text-gray-500'} />
                          </button>
                          <button
                            className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                            title="Edit"
                          >
                            <Edit2 size={14} className={isDarkMode ? 'text-slate-400' : 'text-gray-500'} />
                          </button>
                          {store.google_maps_url && (
                            <a
                              href={store.google_maps_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                              title="Open in Maps"
                            >
                              <ExternalLink size={14} className={isDarkMode ? 'text-slate-400' : 'text-gray-500'} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className={`p-4 border-t flex items-center justify-between ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Showing {displayStores.length} of {storesData.totalStores} stores
                {storeFilters.status && ` • Status: ${STATUS_CONFIG[storeFilters.status]?.label || storeFilters.status}`}
                {categoryFilter && ` • Category: ${getCategoryLabel(categoryFilter)}`}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 disabled:opacity-50 ${
                    isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <span className={`px-3 py-1.5 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                  Page {currentPage} of {Math.ceil(storesData.totalStores / 20) || 1}
                </span>
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage >= Math.ceil(storesData.totalStores / 20)}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 disabled:opacity-50 ${
                    isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StoresTab;
