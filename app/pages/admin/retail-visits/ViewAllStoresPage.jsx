import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { motion } from 'framer-motion';
import { Store, RefreshCw, MapPin, Phone, Star, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import axios from 'axios';

const API_URL = API_BASE_URL + '/api';

function ViewAllStoresPage() {
  const { isDarkMode } = useAdminTheme();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalStores, setTotalStores] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    zone: '',
    area: '',
    status: ''
  });
  const [selectedStore, setSelectedStore] = useState(null);
  const limit = 20;

  useEffect(() => {
    fetchStores();
  }, [currentPage, filters]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        limit,
        offset: (currentPage - 1) * limit
      });
      
      if (filters.zone) params.append('zone', filters.zone);
      if (filters.area) params.append('area', filters.area);
      if (filters.status) params.append('status', filters.status);

      const response = await axios.get(
        `${API_URL}/retail/stores?${params}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      setStores(response.data.stores || []);
      setTotalStores(response.data.total_stores || 0);
    } catch (error) {
      console.error('Fetch stores error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ zone: '', area: '', status: '' });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalStores / limit);

  return (
    <div>
      <div className="mb-8">
        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
          🏪 View All Stores
        </h1>
        <p className={`mt-2 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
          Manage all stores in your database ({totalStores} total)
        </p>
      </div>

      <div className={`${
        isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
      } rounded-2xl p-4 mb-6`}>
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className={isDarkMode ? 'text-pearl-white' : 'text-gray-900'} />
          <span className={`font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
            Filters
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.zone}
            onChange={(e) => handleFilterChange('zone', e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              isDarkMode
                ? 'bg-white/5 border-white/10 text-pearl-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-purple-500`}
          >
            <option value="">All Zones</option>
            <option value="West Delhi">West Delhi</option>
            <option value="North Delhi">North Delhi</option>
            <option value="South Delhi">South Delhi</option>
            <option value="East Delhi">East Delhi</option>
          </select>

          <input
            type="text"
            placeholder="Area (e.g. Uttam Nagar)"
            value={filters.area}
            onChange={(e) => handleFilterChange('area', e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              isDarkMode
                ? 'bg-white/5 border-white/10 text-pearl-white placeholder-pearl-white/40'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-purple-500`}
          />

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              isDarkMode
                ? 'bg-white/5 border-white/10 text-pearl-white'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-purple-500`}
          >
            <option value="">All Status</option>
            <option value="not_visited">Not Visited</option>
            <option value="visited_interested">Interested</option>
            <option value="visited_declined">Declined</option>
            <option value="stocked">Stocked</option>
          </select>

          <button
            onClick={clearFilters}
            className={`px-4 py-2 rounded-lg font-semibold ${
              isDarkMode
                ? 'bg-white/10 text-pearl-white hover:bg-white/20'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            } transition-colors`}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className={`${
          isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
        } rounded-2xl p-8 text-center`}>
          <RefreshCw className={`animate-spin mx-auto mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`} size={32} />
          <p className={isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}>
            Loading stores...
          </p>
        </div>
      ) : stores.length === 0 ? (
        <div className={`${
          isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
        } rounded-2xl p-8 text-center`}>
          <Store className={`mx-auto mb-2 ${isDarkMode ? 'text-pearl-white/40' : 'text-gray-400'}`} size={48} />
          <p className={isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}>
            No stores found. Try adjusting your filters or search for stores first.
          </p>
        </div>
      ) : (
        <>
          <div className={`${
            isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
          } rounded-2xl overflow-hidden mb-6`}>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className={isDarkMode ? 'bg-white/5' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      Store Name
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      Phone
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      Area / Zone
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      Rating
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      Status
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store) => (
                    <tr
                      key={store._id}
                      className={`border-t ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'} transition-colors cursor-pointer`}
                      onClick={() => setSelectedStore(store)}
                    >
                      <td className="px-4 py-4">
                        <div>
                          <p className={`font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                            {store.store_name}
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                            {store.store_type}
                          </p>
                        </div>
                      </td>
                      <td className={`px-4 py-4 text-sm ${isDarkMode ? 'text-pearl-white/70' : 'text-gray-700'}`}>
                        {store.phone || 'N/A'}
                      </td>
                      <td className={`px-4 py-4 text-sm ${isDarkMode ? 'text-pearl-white/70' : 'text-gray-700'}`}>
                        <div>{store.area}</div>
                        <div className="text-xs opacity-70">{store.zone}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-yellow-500 fill-yellow-500" />
                          <span className={`text-sm font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                            {store.avg_rating?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          store.visit_status === 'not_visited'
                            ? 'bg-blue-500/20 text-blue-500'
                            : store.visit_status === 'visited_interested'
                            ? 'bg-green-500/20 text-green-500'
                            : store.visit_status === 'stocked'
                            ? 'bg-purple-500/20 text-purple-500'
                            : 'bg-gray-500/20 text-gray-500'
                        }`}>
                          {store.visit_status?.replace('_', ' ') || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStore(store);
                          }}
                          className={`text-sm font-semibold ${
                            isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                          }`}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y" style={{borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : undefined}}>
              {stores.map((store) => (
                <div
                  key={store._id}
                  className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setSelectedStore(store)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      {store.store_name}
                    </h3>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${
                      store.visit_status === 'not_visited'
                        ? 'bg-blue-500/20 text-blue-500'
                        : 'bg-green-500/20 text-green-500'
                    }`}>
                      {store.visit_status?.replace('_', ' ')}
                    </span>
                  </div>
                  <p className={`text-xs mb-2 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                    {store.area}, {store.zone}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      <span>{store.avg_rating?.toFixed(1)}</span>
                    </div>
                    {store.phone && (
                      <div className="flex items-center gap-1">
                        <Phone size={12} />
                        {store.phone}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
              Page {currentPage} of {totalPages} ({totalStores} total stores)
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                  currentPage === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : isDarkMode
                    ? 'bg-white/10 text-pearl-white hover:bg-white/20'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } transition-colors`}
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                  currentPage === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : isDarkMode
                    ? 'bg-white/10 text-pearl-white hover:bg-white/20'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } transition-colors`}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {selectedStore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedStore(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${
              isDarkMode ? 'bg-gray-900 border border-white/10' : 'bg-white'
            } rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`sticky top-0 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'} p-6 flex items-center justify-between`}>
              <h2 className={`text-2xl font-black ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                Store Details
              </h2>
              <button
                onClick={() => setSelectedStore(null)}
                className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  {selectedStore.store_name}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                  {selectedStore.store_type}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>Phone</p>
                  <p className={isDarkMode ? 'text-pearl-white' : 'text-gray-900'}>{selectedStore.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>Rating</p>
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    <span>{selectedStore.avg_rating?.toFixed(1) || 'N/A'}</span>
                    <span className={`text-sm ${isDarkMode ? 'text-pearl-white/40' : 'text-gray-500'}`}>
                      ({selectedStore.google_reviews_count || 0} reviews)
                    </span>
                  </div>
                </div>
                <div>
                  <p className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>Area</p>
                  <p className={isDarkMode ? 'text-pearl-white' : 'text-gray-900'}>{selectedStore.area}</p>
                </div>
                <div>
                  <p className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>Zone</p>
                  <p className={isDarkMode ? 'text-pearl-white' : 'text-gray-900'}>{selectedStore.zone}</p>
                </div>
                <div>
                  <p className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>Visit Status</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                    selectedStore.visit_status === 'not_visited'
                      ? 'bg-blue-500/20 text-blue-500'
                      : 'bg-green-500/20 text-green-500'
                  }`}>
                    {selectedStore.visit_status?.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <p className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>Total Visits</p>
                  <p className={isDarkMode ? 'text-pearl-white' : 'text-gray-900'}>{selectedStore.total_visits || 0}</p>
                </div>
              </div>

              <div>
                <p className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>Address</p>
                <p className={isDarkMode ? 'text-pearl-white' : 'text-gray-900'}>{selectedStore.address}</p>
              </div>

              {selectedStore.website && (
                <div>
                  <p className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>Website</p>
                  <a href={selectedStore.website} target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">
                    {selectedStore.website}
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default ViewAllStoresPage;
