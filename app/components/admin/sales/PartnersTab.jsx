import React, { useState } from 'react';
import { Link } from 'react-router';
import { Search, Store, TrendingUp, CheckCircle2, IndianRupee, Users, RefreshCw, MapPin, ExternalLink, Edit3, Phone, MessageCircle, Megaphone, Package } from 'lucide-react';
import { PartnersTabSkeleton } from './SalesSkeletons';
import QuickRestockModal from '../../sales/QuickRestockModal';

const PartnersTab = ({
  isDarkMode,
  partnersStats,
  partnersSearch,
  setPartnersSearch,
  partnersFilter,
  setPartnersFilter,
  filteredPartners,
  partnersLoading,
  fetchPartners,
  onEditPartner, // New prop for direct edit
  onShoutoutPartner // New prop for shoutout generator
}) => {
  // Quick Restock modal state
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockPartner, setRestockPartner] = useState(null);

  const handleOpenRestock = (partner) => {
    setRestockPartner(partner);
    setShowRestockModal(true);
  };

  const handleRestockSuccess = () => {
    // Show success message - could use toast if available
    alert('Stock added successfully!');
  };

  // Show skeleton while loading
  if (partnersLoading) {
    return <PartnersTabSkeleton isDarkMode={isDarkMode} />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 rounded-lg">
              <Store className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{partnersStats.total}</p>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Total Partners</p>
            </div>
          </div>
        </div>
        <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{partnersStats.newThisMonth}</p>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>New This Month</p>
            </div>
          </div>
        </div>
        <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">{partnersStats.active}</p>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Active Partners</p>
            </div>
          </div>
        </div>
        <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <IndianRupee className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">₹{partnersStats.revenueThisMonth.toLocaleString()}</p>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Revenue This Month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Actions Row */}
      <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search partners by name, area..."
                value={partnersSearch}
                onChange={(e) => setPartnersSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-teal-500 ${
                  isDarkMode 
                    ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            <select
              value={partnersFilter}
              onChange={(e) => setPartnersFilter(e.target.value)}
              className={`px-4 py-2 border rounded-lg focus:outline-none focus:border-teal-500 ${
                isDarkMode 
                  ? 'bg-slate-700/50 border-slate-600 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
            >
              <option value="all">All Areas</option>
              <option value="moti-nagar">Moti Nagar</option>
              <option value="vikaspuri">Vikaspuri</option>
              <option value="karol-bagh">Karol Bagh</option>
              <option value="dwarka">Dwarka</option>
              <option value="uttam-nagar">Uttam Nagar</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchPartners} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${partnersLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link 
              to="/admin/partner-stores" 
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Manage All Partners
            </Link>
          </div>
        </div>
      </div>

      {/* Partners Grid */}
      <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'}`}>
        <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700/50' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <Users className="w-5 h-5 text-teal-400" />
            Partner Stores
          </h3>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{filteredPartners.length} partners found</p>
        </div>
        
        {partnersLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="text-center py-12">
            <Store className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`} />
            <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>No partners found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredPartners.map((partner) => (
              <div 
                key={partner.store_id || partner._id} 
                className={`rounded-xl border overflow-hidden hover:border-teal-500/50 transition-colors ${
                  isDarkMode ? 'bg-slate-700/30 border-slate-600/50' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`relative h-32 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                  {partner.images?.[0] || partner.photos?.[0] ? (
                    <img 
                      src={partner.images?.[0] || partner.photos?.[0]} 
                      alt={partner.store_name || partner.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className={`w-12 h-12 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} />
                    </div>
                  )}
                  <span className="absolute top-2 right-2 px-2 py-1 bg-teal-500 text-white text-xs font-medium rounded">Partner</span>
                </div>
                <div className="p-4">
                  <h4 className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {partner.store_name || partner.name}
                  </h4>
                  <p className={`text-sm flex items-center gap-1 mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    <MapPin className="w-3 h-3" />
                    {partner.area || partner.location}, {partner.city || 'New Delhi'}
                  </p>
                  <div className={`flex items-center gap-4 mt-3 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    <span>{partner.products?.length || 0} products</span>
                    {partner.partnerSince && <span>Since {partner.partnerSince}</span>}
                  </div>
                </div>
                <div className="px-4 pb-4 flex gap-2">
                  <button 
                    onClick={() => onEditPartner && onEditPartner(partner)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isDarkMode 
                        ? 'bg-slate-600 hover:bg-slate-500 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleOpenRestock(partner)}
                    className="px-3 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 rounded-lg flex items-center justify-center transition-colors border border-teal-500/30"
                    title="Add consignment stock"
                  >
                    <Package className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onShoutoutPartner && onShoutoutPartner(partner)}
                    className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg flex items-center justify-center transition-colors border border-purple-500/30"
                    title="Generate welcome shoutout"
                  >
                    <Megaphone className="w-4 h-4" />
                  </button>
                  {partner.phone && (
                    <>
                      <a 
                        href={`tel:${partner.phone}`}
                        className="px-3 py-2 bg-teal-500/20 hover:bg-teal-500/30 rounded-lg text-teal-400 text-sm transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <a 
                        href={`https://wa.me/${partner.phone?.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 text-sm transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Restock Modal */}
      <QuickRestockModal
        isOpen={showRestockModal}
        onClose={() => setShowRestockModal(false)}
        partnerName={restockPartner?.store_name || restockPartner?.name || ''}
        partnerId={restockPartner?.store_id || restockPartner?._id}
        onSuccess={handleRestockSuccess}
        title="Add Stock"
      />
    </div>
  );
};

export default PartnersTab;
