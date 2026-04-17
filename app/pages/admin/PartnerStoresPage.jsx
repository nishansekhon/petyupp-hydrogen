import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Store, Plus, Edit, Trash2, Search, MapPin, Phone, Clock, Image as ImageIcon, Package, X, Upload, Check, ChevronLeft, Loader2 } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminAuthContext';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { API_BASE_URL } from '@/utils/api';
import { toast } from 'sonner';
import { useStoreSearch } from '@/hooks/useStoreSearch';
import EditPartnerModal from '@/components/sales/EditPartnerModal';
import InlineEditCell from '@/components/sales/InlineEditCell';

const API_URL = API_BASE_URL + '/api';

function PartnerStoresPage() {
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false); // Use shared modal for editing
  const [products, setProducts] = useState([]);
  const [seeding, setSeeding] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { getToken } = useAdmin();
  const { isDarkMode } = useAdminTheme();
  const navigate = useNavigate();

  // New state for store selection flow
  const [addStep, setAddStep] = useState('select'); // 'select' | 'form'
  const [retailSearchQuery, setRetailSearchQuery] = useState('');
  const [selectedRetailStore, setSelectedRetailStore] = useState(null);
  
  // UNIFIED STORE SEARCH - Use centralized hook (searches only retail stores for partner selection)
  const { 
    results: retailStores, 
    loading: loadingRetailStores, 
    search: searchRetailStores,
    clearResults: clearRetailSearch
  } = useStoreSearch('retail'); // Only search retail stores (not already partners)

  // Form state
  const [formData, setFormData] = useState({
    store_name: '',
    address: '',
    area: '',
    city: 'Delhi',
    pincode: '',
    phone: '',
    hours: '',
    latitude: '',
    longitude: '',
    status: 'active',
    images: [],
    products: [],
    testimonial: '',
    ownerName: '',
    distance_km: 0,
    google_place_id: '',
    rating: '',
    source_store_id: ''
  });
  
  const [newImageUrl, setNewImageUrl] = useState('');

  // Partner Stock State
  const [showStockModal, setShowStockModal] = useState(false);
  const [partnerStock, setPartnerStock] = useState(null);
  const [loadingStock, setLoadingStock] = useState(false);
  const [newStock, setNewStock] = useState({
    product_id: '',
    product_name: '',
    quantity: 0,
    cost_per_unit: 0,
    given_date: new Date().toISOString().slice(0, 10),
    notes: ''
  });

  useEffect(() => {
    fetchStores();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredStores(stores.filter(store =>
        store.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.area?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.city?.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } else {
      setFilteredStores(stores);
    }
  }, [stores, searchQuery]);

  // UNIFIED SEARCH: Trigger search when retail search query changes (debounced)
  useEffect(() => {
    if (!showForm || addStep !== 'select') return;
    
    const timer = setTimeout(() => {
      if (retailSearchQuery && retailSearchQuery.trim()) {
        searchRetailStores(retailSearchQuery);
      } else {
        clearRetailSearch();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [retailSearchQuery, showForm, addStep, searchRetailStores, clearRetailSearch]);

  // Filter out stores that are already partners from search results
  const availableRetailStores = retailStores.filter(s => {
    const partnerIds = stores.map(p => p.google_place_id || p.source_store_id).filter(Boolean);
    const storeId = s.place_id || s._id;
    return !partnerIds.includes(storeId);
  });

  const handleSelectRetailStore = (store) => {
    setSelectedRetailStore(store);
    
    // Get the full address - prioritize the most complete version
    const fullAddress = store.address || store.formatted_address || store.vicinity || '';
    
    // Map retail store fields to partner form
    // Handle hours - it might be an object or string
    let hoursStr = '';
    if (store.hours) {
      hoursStr = typeof store.hours === 'string' ? store.hours : JSON.stringify(store.hours);
    } else if (store.opening_hours) {
      hoursStr = typeof store.opening_hours === 'string' 
        ? store.opening_hours 
        : (store.opening_hours.weekday_text || []).join(', ');
    }
    
    // Log for debugging
    console.log('Selected retail store:', {
      name: store.store_name || store.name,
      fullAddress: fullAddress,
      place_id: store.place_id || store.google_place_id
    });
    
    setFormData({
      store_name: store.store_name || store.name || '',
      address: fullAddress,
      area: store.area || '',
      city: store.city || 'Delhi',
      pincode: store.pincode || '',
      phone: store.phone || store.formatted_phone_number || '',
      hours: hoursStr,
      latitude: store.latitude || store.lat || store.geometry?.location?.lat || '',
      longitude: store.longitude || store.lon || store.lng || store.geometry?.location?.lng || '',
      status: 'active',
      images: [],
      products: [],
      testimonial: '',
      ownerName: '',
      distance_km: 0,
      google_place_id: store.place_id || store.google_place_id || '',
      rating: store.rating || store.avg_rating || '',
      source_store_id: store._id || ''
    });
    setAddStep('form');
  };

  const handleManualEntry = () => {
    setSelectedRetailStore(null);
    resetForm();
    setAddStep('form');
  };

  const openAddModal = () => {
    setShowForm(true);
    setEditingStore(null);
    setAddStep('select');
    setRetailSearchQuery('');
    setSelectedRetailStore(null);
    resetForm();
    clearRetailSearch(); // Clear previous search results
  };

  const fetchStores = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/partner-stores`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      // Sort by created_at descending (newest first)
      const sortedStores = (response.data.stores || []).sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
        return dateB - dateA; // Descending order (newest first)
      });
      setStores(sortedStores);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  // Fetch partner stock when editing a store
  const fetchPartnerStock = useCallback(async (partnerId) => {
    if (!partnerId) return;
    setLoadingStock(true);
    try {
      const response = await fetch(`${API_URL}/partner-inventory/${partnerId}`);
      const data = await response.json();
      if (data.success) {
        setPartnerStock(data.inventory);
      } else {
        setPartnerStock(null);
      }
    } catch (error) {
      console.error('Error fetching partner stock:', error);
      setPartnerStock(null);
    } finally {
      setLoadingStock(false);
    }
  }, []);

  // Effect to fetch stock when editing store changes
  useEffect(() => {
    if (editingStore?.store_id) {
      fetchPartnerStock(editingStore.store_id);
    } else {
      setPartnerStock(null);
    }
  }, [editingStore, fetchPartnerStock]);

  const handleGiveStock = async () => {
    if (!newStock.product_id || !newStock.quantity) {
      toast.error('Please select product and enter quantity');
      return;
    }
    
    const stockData = {
      partner_id: editingStore.store_id,
      partner_name: editingStore.store_name || editingStore.name,
      product_id: newStock.product_id,
      product_name: newStock.product_name,
      quantity: newStock.quantity,
      cost_per_unit: newStock.cost_per_unit,
      total_value: newStock.quantity * newStock.cost_per_unit,
      given_date: newStock.given_date,
      notes: newStock.notes
    };
    
    try {
      const response = await fetch(`${API_URL}/partner-inventory/give-stock`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(stockData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Stock given to partner!');
        fetchPartnerStock(editingStore.store_id);
        setNewStock({
          product_id: '',
          product_name: '',
          quantity: 0,
          cost_per_unit: 0,
          given_date: new Date().toISOString().slice(0, 10),
          notes: ''
        });
        setShowStockModal(false);
      } else {
        toast.error(data.error || 'Failed to give stock');
      }
    } catch (error) {
      console.error('Error giving stock:', error);
      toast.error('Failed to give stock');
    }
  };

  const formatStockDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // Inline edit handler for stock entries (uses InlineEditCell component)
  const handleUpdateStockEntry = async (productId, field, newValue) => {
    if (!editingStore?.store_id) return false;
    
    const item = partnerStock?.items?.find(i => i.product_id === productId);
    if (!item) return false;

    const quantity = field === 'qty' ? newValue : item.quantity;
    const costPerUnit = field === 'cost' ? newValue : item.cost_per_unit;

    try {
      const response = await fetch(`${API_URL}/v1/partner-stock/update-entry`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          partner_id: editingStore.store_id,
          product_id: productId,
          quantity: quantity,
          cost_per_unit: costPerUnit
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setPartnerStock(prev => {
          if (!prev) return prev;
          const updatedItems = prev.items.map(i =>
            i.product_id === productId
              ? { ...i, quantity, cost_per_unit: costPerUnit, total_value: quantity * costPerUnit }
              : i
          );
          return {
            ...prev,
            items: updatedItems,
            total_quantity: data.new_totals?.total_quantity ?? prev.total_quantity,
            total_value: data.new_totals?.total_value ?? prev.total_value
          };
        });
        toast.success('Stock updated');
        return true;
      } else {
        toast.error(data.error || 'Failed to update');
        return false;
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
      return false;
    }
  };

  const handleSeedStores = async () => {
    if (!confirm('This will seed 6 default partner stores. Continue?')) return;
    setSeeding(true);
    try {
      const response = await axios.post(`${API_URL}/admin/partner-stores/seed`, {}, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      alert(response.data.message);
      fetchStores();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to seed stores');
    } finally {
      setSeeding(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Ensure address is the full address from selected store or form
    const fullAddress = formData.address || selectedRetailStore?.address || selectedRetailStore?.formatted_address || '';
    
    // Include google_place_id and source_store_id from selected retail store
    const submitData = {
      ...formData,
      address: fullAddress,
      google_place_id: formData.google_place_id || selectedRetailStore?.place_id || selectedRetailStore?.google_place_id || '',
      source_store_id: formData.source_store_id || selectedRetailStore?._id || ''
    };
    
    // Log data being submitted for debugging
    console.log('Submitting partner store data:', {
      store_name: submitData.store_name,
      address: submitData.address,
      google_place_id: submitData.google_place_id,
      area: submitData.area,
      city: submitData.city
    });
    
    // Check for duplicate (only for new stores, not editing)
    if (!editingStore) {
      const existingPartner = stores.find(s => {
        // Check by google_place_id if available
        if (submitData.google_place_id && s.google_place_id === submitData.google_place_id) {
          return true;
        }
        // Fallback check by name + area for stores without place_id
        const sameName = s.store_name?.toLowerCase() === submitData.store_name?.toLowerCase();
        const sameArea = s.area?.toLowerCase() === submitData.area?.toLowerCase();
        return sameName && sameArea;
      });
      
      if (existingPartner) {
        toast.error(`"${existingPartner.store_name}" is already a partner store`);
        return;
      }
    }
    
    try {
      if (editingStore) {
        const response = await axios.put(`${API_URL}/admin/partner-stores/${editingStore.store_id}`, submitData, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        toast.success('Partner store updated!');
      } else {
        const response = await axios.post(`${API_URL}/admin/partner-stores`, submitData, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        console.log('Partner store created:', response.data);
        toast.success(`${submitData.store_name} added as partner!`);
      }
      setShowForm(false);
      setEditingStore(null);
      setSelectedRetailStore(null);
      setAddStep('select');
      resetForm();
      fetchStores();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.detail || error.response?.data?.error || 'Failed to save store');
    }
  };

  const handleDelete = async (storeId, storeName) => {
    if (!confirm(`Delete "${storeName}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_URL}/admin/partner-stores/${storeId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      toast.success(`${storeName} removed from partners`);
      fetchStores();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete store');
    }
  };

  // Use shared EditPartnerModal for editing
  const handleEdit = (store) => {
    setEditingStore(store);
    setShowEditModal(true);
  };

  // Handle save from the shared modal
  const handleEditModalSave = (updatedStore) => {
    // Refresh the stores list
    fetchStores();
    setShowEditModal(false);
    setEditingStore(null);
  };

  const resetForm = () => {
    setFormData({
      store_name: '',
      address: '',
      area: '',
      city: 'Delhi',
      pincode: '',
      phone: '',
      hours: '',
      latitude: '',
      longitude: '',
      status: 'active',
      images: [],
      products: [],
      testimonial: '',
      ownerName: '',
      distance_km: 0
    });
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setUploadingImage(true);
    let uploadedCount = 0;
    
    for (const file of files) {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('folder', 'partner-stores');

      try {
        // Use backend endpoint for authenticated Cloudinary upload
        const response = await fetch(`${API_URL}/admin/upload/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          },
          body: formDataUpload
        });
        const data = await response.json();
        if (data.success && data.url) {
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, data.url]
          }));
          uploadedCount++;
        } else if (data.error) {
          console.error('Upload error:', data.error);
          toast.error(`Upload failed: ${data.error}`);
        }
      } catch (error) {
        console.error('Upload failed:', error);
        toast.error('Failed to upload image. Please try again.');
      }
    }
    
    setUploadingImage(false);
    if (uploadedCount > 0) {
      toast.success(`${uploadedCount} image${uploadedCount > 1 ? 's' : ''} uploaded successfully`);
    }
    
    // Reset file input
    e.target.value = '';
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const toggleProduct = (product) => {
    const exists = formData.products.find(p => p.name === product.name);
    if (exists) {
      setFormData(prev => ({
        ...prev,
        products: prev.products.filter(p => p.name !== product.name)
      }));
    } else {
      // Get image URL from multiple possible sources
      const imageUrl = product.images?.[0]?.url || product.images?.[0] || product.image_url || product.image || '';
      setFormData(prev => ({
        ...prev,
        products: [...prev.products, {
          name: product.name,
          size: product.weight || product.size || '',
          price: product.price || product.original_price || 0,
          image: imageUrl
        }]
      }));
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-obsidian' : 'bg-gray-50'}`}>
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-obsidian text-pearl-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Back Navigation */}
      <button
        onClick={() => navigate('/admin/sales?tab=partners')}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-teal-400 transition-colors mb-4 group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Sales Hub</span>
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/20 rounded-lg">
            <Store className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Partner Stores</h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage PetYupp retail partner stores
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {stores.length === 0 && (
            <button
              onClick={handleSeedStores}
              disabled={seeding}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
            >
              {seeding ? 'Seeding...' : '🌱 Seed Default Stores'}
            </button>
          )}
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Plus size={18} />
            Add Store
          </button>
        </div>
      </div>

      {/* Search */}
      <div className={`relative mb-6`}>
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search stores by name, area, or city..."
          className={`w-full pl-12 pr-4 py-3 rounded-xl outline-none border transition-colors ${
            isDarkMode 
              ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:border-teal-500' 
              : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-teal-500'
          }`}
        />
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStores.map((store) => (
          <motion.div
            key={store.store_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl overflow-hidden border ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50 hover:border-teal-500/50' : 'bg-white border-gray-200 hover:border-teal-500'} transition-colors`}
          >
            {/* Store Image */}
            <div className="relative h-40 bg-gradient-to-br from-slate-700 to-slate-800">
              {store.images?.[0] ? (
                <img src={store.images[0]} alt={store.store_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Store size={48} className="text-slate-500" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  store.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                }`}>
                  {store.status || 'active'}
                </span>
              </div>
              <div className="absolute bottom-2 left-2">
                <span className="px-2 py-1 bg-teal-500 text-white rounded text-xs font-medium">
                  Partner
                </span>
              </div>
            </div>

            {/* Store Info */}
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1">{store.store_name || store.name}</h3>
              <div className="space-y-1 text-sm">
                <div className={`flex items-start gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">
                    {store.address || `${store.area}, ${store.city}`}
                  </span>
                </div>
                {store.phone && (
                  <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <Phone size={14} />
                    <span>{store.phone}</span>
                  </div>
                )}
                {store.hours && (
                  <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <Clock size={14} />
                    <span>{store.hours}</span>
                  </div>
                )}
                <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Package size={14} />
                  <span>{store.products?.length || 0} products</span>
                </div>
                <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <ImageIcon size={14} />
                  <span>{store.images?.length || 0} images</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(store)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                    isDarkMode ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setEditingStore(store);
                    setShowStockModal(true);
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                    isDarkMode ? 'bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 border border-teal-500/30' : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200'
                  }`}
                >
                  <Package size={14} />
                  Stock
                </button>
                <button
                  onClick={() => handleDelete(store.store_id, store.store_name)}
                  className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredStores.length === 0 && !loading && (
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <Store size={48} className="mx-auto mb-4 opacity-50" />
          <p>No partner stores found</p>
          <p className="text-sm mt-2">Click &quot;Add Store&quot; or &quot;Seed Default Stores&quot; to get started</p>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl ${isDarkMode ? 'bg-obsidian-light' : 'bg-white'}`}
          >
            {/* Step 1: Store Selection (only for new stores, not editing) */}
            {!editingStore && addStep === 'select' && (
              <>
                <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10 bg-inherit">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-500/20 rounded-lg">
                      <Store className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Add Partner Store</h2>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Step 1: Select from existing stores
                      </p>
                    </div>
                  </div>
                  <button onClick={() => { setShowForm(false); setEditingStore(null); }}>
                    <X size={24} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                  </button>
                </div>

                {/* Search Input */}
                <div className="p-4 border-b border-white/10">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={retailSearchQuery}
                      onChange={(e) => setRetailSearchQuery(e.target.value)}
                      placeholder="Search stores by name, area, or phone..."
                      autoFocus
                      className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none border transition-colors ${
                        isDarkMode 
                          ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:border-teal-500' 
                          : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-teal-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Store List */}
                <div className="p-4 max-h-[50vh] overflow-y-auto">
                  {loadingRetailStores ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                      <span className={`ml-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Searching stores...
                      </span>
                    </div>
                  ) : availableRetailStores.length > 0 ? (
                    <div className="space-y-2">
                      {availableRetailStores.map((store, idx) => {
                        // Build full address for display
                        const fullAddress = store.address || store.formatted_address || store.vicinity || 
                          (store.area ? `${store.area}${store.city ? `, ${store.city}` : ', Delhi'}` : '');
                        
                        return (
                          <button
                            key={store.place_id || store._id || idx}
                            type="button"
                            onClick={() => handleSelectRetailStore(store)}
                            className={`w-full p-3 rounded-xl border transition-all text-left group ${
                              isDarkMode 
                                ? 'bg-slate-800/30 border-slate-700 hover:border-teal-500 hover:bg-slate-700/50' 
                                : 'bg-gray-50 border-gray-200 hover:border-teal-500 hover:bg-teal-50'
                            }`}
                          >
                            {/* Store Header: Name + Rating */}
                            <div className="flex items-center justify-between mb-1">
                              <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {store.store_name || store.name}
                              </span>
                              {store.rating && (
                                <span className="text-sm text-amber-400 font-medium">★ {store.rating}</span>
                              )}
                            </div>
                            
                            {/* Address */}
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {fullAddress}
                            </p>
                            
                            {/* Phone */}
                            {store.phone && (
                              <p className="text-sm text-emerald-400 mt-1">
                                📞 {store.phone}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Store size={48} className={`mx-auto mb-3 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        {retailSearchQuery ? 'No stores match your search' : 'Type to search for stores'}
                      </p>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Search by store name, area, or phone number
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer with Manual Entry Option */}
                <div className={`p-4 border-t ${isDarkMode ? 'border-white/10 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleManualEntry}
                      className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-teal-400' : 'text-gray-500 hover:text-teal-600'} transition-colors`}
                    >
                      Or enter store details manually →
                    </button>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {availableRetailStores.length} stores found
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Form (only for adding new stores, editing uses modal) */}
            {addStep === 'form' && (
              <>
                <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10 bg-inherit">
                  <div className="flex items-center gap-3">
                    {selectedRetailStore && (
                      <button
                        type="button"
                        onClick={() => {
                          setAddStep('select');
                          setSelectedRetailStore(null);
                          resetForm();
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        <ChevronLeft size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                      </button>
                    )}
                    <div>
                      <h2 className="text-lg font-bold">
                        Confirm Store Details
                      </h2>
                      {selectedRetailStore && (
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Step 2: Review and add as partner
                        </p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => { setShowForm(false); setEditingStore(null); }}>
                    <X size={24} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                  </button>
                </div>

                {/* Selected Store Banner */}
                {selectedRetailStore && (
                  <div className={`mx-4 mt-4 p-3 rounded-lg border ${
                    isDarkMode ? 'bg-teal-500/10 border-teal-500/30' : 'bg-teal-50 border-teal-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-teal-500" />
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                        Selected: {selectedRetailStore.store_name || selectedRetailStore.name}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-teal-400/70' : 'text-teal-600'}`}>
                      Data pre-filled from store database. Review and make any necessary changes.
                    </p>
                  </div>
                )}

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Store Name *</label>
                  <input
                    type="text"
                    value={formData.store_name}
                    onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                    required
                    className={`w-full px-3 py-2 rounded-lg outline-none ${
                      isDarkMode ? 'bg-obsidian border border-white/10' : 'bg-gray-100'
                    }`}
                    placeholder="Ram Pet Shop"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Address *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    className={`w-full px-3 py-2 rounded-lg outline-none ${
                      isDarkMode ? 'bg-obsidian border border-white/10' : 'bg-gray-100'
                    }`}
                    placeholder="Shop No. 5, Guru Nanak Market"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Area *</label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    required
                    className={`w-full px-3 py-2 rounded-lg outline-none ${
                      isDarkMode ? 'bg-obsidian border border-white/10' : 'bg-gray-100'
                    }`}
                    placeholder="Moti Nagar"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg outline-none ${
                      isDarkMode ? 'bg-obsidian border border-white/10' : 'bg-gray-100'
                    }`}
                    placeholder="Delhi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg outline-none ${
                      isDarkMode ? 'bg-obsidian border border-white/10' : 'bg-gray-100'
                    }`}
                    placeholder="110015"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg outline-none ${
                      isDarkMode ? 'bg-obsidian border border-white/10' : 'bg-gray-100'
                    }`}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hours</label>
                  <input
                    type="text"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg outline-none ${
                      isDarkMode ? 'bg-obsidian border border-white/10' : 'bg-gray-100'
                    }`}
                    placeholder="Mon-Sun: 9:00 AM - 9:00 PM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg outline-none ${
                      isDarkMode ? 'bg-obsidian border border-white/10' : 'bg-gray-100'
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg outline-none ${
                      isDarkMode ? 'bg-obsidian border border-white/10' : 'bg-gray-100'
                    }`}
                    placeholder="28.664199"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg outline-none ${
                      isDarkMode ? 'bg-obsidian border border-white/10' : 'bg-gray-100'
                    }`}
                    placeholder="77.139599"
                  />
                </div>
              </div>
              
              {/* Missing coordinates warning */}
              {(!formData.latitude || !formData.longitude) && (
                <div className={`flex items-start gap-2 p-2 rounded-lg ${
                  isDarkMode ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'
                }`}>
                  <span className="text-amber-500 text-sm">⚠️</span>
                  <div className={`text-xs ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                    <p className="font-medium">Coordinates missing</p>
                    <p className={isDarkMode ? 'text-amber-400/80' : 'text-amber-600'}>
                      Distance calculation requires lat/lon. Find on Google Maps by right-clicking the location.
                    </p>
                  </div>
                </div>
              )}

              {/* Images */}
              <div>
                <label className="block text-sm font-medium mb-2">Store Images</label>
                
                {/* Existing images grid with delete option */}
                {formData.images && formData.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`Store ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-700"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = formData.images.filter((_, i) => i !== index);
                            setFormData(prev => ({...prev, images: newImages}));
                          }}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 text-xs bg-teal-500 text-white px-1 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* URL Input for adding new image */}
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    placeholder="Paste Cloudinary or image URL..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className={`flex-1 p-3 rounded-lg text-sm ${
                      isDarkMode 
                        ? 'bg-obsidian border border-white/10 text-white placeholder-gray-500'
                        : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newImageUrl && newImageUrl.trim()) {
                        const currentImages = formData.images || [];
                        setFormData(prev => ({
                          ...prev, 
                          images: [...currentImages, newImageUrl.trim()]
                        }));
                        setNewImageUrl('');
                      }
                    }}
                    disabled={!newImageUrl || !newImageUrl.trim()}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
                
                {/* File Upload Button */}
                <div className="flex items-center gap-2">
                  <label className={`flex-1 ${uploadingImage ? 'cursor-wait' : 'cursor-pointer'}`}>
                    <div className={`p-3 rounded-lg text-center text-sm border-2 border-dashed transition-colors ${
                      uploadingImage
                        ? 'border-teal-500 bg-teal-500/10'
                        : isDarkMode 
                          ? 'border-slate-600 hover:border-teal-500 text-slate-400 hover:text-teal-400'
                          : 'border-gray-300 hover:border-teal-500 text-gray-500 hover:text-teal-600'
                    }`}>
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-5 h-5 mx-auto mb-1 animate-spin text-teal-500" />
                          <span className="text-teal-500">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mx-auto mb-1" />
                          <span>Click to upload images directly</span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Upload images directly or paste a Cloudinary URL. First image will be the primary display.
                </p>
              </div>

              {/* Products */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Products Available</label>
                  <label className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                    <input
                      type="checkbox"
                      checked={formData.products.length === products.slice(0, 20).length && products.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Select all products
                          const allProducts = products.slice(0, 20).map(product => ({
                            name: product.name,
                            size: product.weight || product.size || '',
                            price: product.price || product.original_price || 0,
                            image: product.images?.[0]?.url || product.images?.[0] || product.image_url || product.image || ''
                          }));
                          setFormData(prev => ({ ...prev, products: allProducts }));
                        } else {
                          // Deselect all
                          setFormData(prev => ({ ...prev, products: [] }));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-400 text-teal-500 focus:ring-teal-500"
                    />
                    <span className={`text-xs ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                      Select All ({Math.min(products.length, 20)})
                    </span>
                  </label>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {products.slice(0, 20).map((product) => {
                    const isSelected = formData.products.find(p => p.name === product.name);
                    return (
                      <div
                        key={product.id}
                        onClick={() => toggleProduct(product)}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-teal-500/20 border border-teal-500'
                            : isDarkMode ? 'bg-obsidian hover:bg-white/5' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                          isSelected ? 'bg-teal-500 border-teal-500' : 'border-gray-400'
                        }`}>
                          {isSelected && <Check size={14} className="text-white" />}
                        </div>
                        {(product.images?.[0]?.url || product.images?.[0] || product.image_url || product.image) && (
                          <img 
                            src={product.images?.[0]?.url || product.images?.[0] || product.image_url || product.image} 
                            alt="" 
                            className="w-8 h-8 rounded object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <span className="text-sm">{product.name}</span>
                        <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          ₹{product.price || product.original_price}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Selected: {formData.products.length} products
                </p>
              </div>

              {/* Stock with Partner Section - Only show when editing */}
              {editingStore && (
                <div className="mt-2 pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Package className="w-4 h-4 text-teal-400" />
                      Stock with Partner
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowStockModal(true)}
                      className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
                    >
                      Manage Stock →
                    </button>
                  </div>
                  
                  {loadingStock ? (
                    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-teal-500" />
                    </div>
                  ) : partnerStock && partnerStock.total_quantity > 0 ? (
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-teal-400">₹{partnerStock.total_value?.toLocaleString()}</span>
                          <span className="text-sm text-slate-400 ml-2">({partnerStock.total_quantity} units)</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Last given: {formatStockDate(partnerStock.last_updated)}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-slate-400">
                        {partnerStock.items?.length} product(s) in stock
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                      <p className="text-slate-500 text-sm">No stock given yet</p>
                      <button
                        type="button"
                        onClick={() => setShowStockModal(true)}
                        className="mt-2 text-xs text-teal-400 hover:text-teal-300"
                      >
                        + Give Stock
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Owner Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg outline-none ${
                      isDarkMode ? 'bg-obsidian border border-white/10' : 'bg-gray-100'
                    }`}
                    placeholder="Rajesh Kumar"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.distance_km}
                    onChange={(e) => setFormData({ ...formData, distance_km: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-3 py-2 rounded-lg outline-none ${
                      isDarkMode ? 'bg-obsidian border border-white/10' : 'bg-gray-100'
                    }`}
                    placeholder="0.5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Testimonial</label>
                <textarea
                  value={formData.testimonial}
                  onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
                  rows={2}
                  className={`w-full px-3 py-2 rounded-lg outline-none resize-none ${
                    isDarkMode ? 'bg-obsidian border border-white/10' : 'bg-gray-100'
                  }`}
                  placeholder="Customer feedback about PetYupp products..."
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingStore(null); }}
                  className={`flex-1 py-3 rounded-lg font-medium ${
                    isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium"
                >
                  Add as Partner
                </button>
              </div>
            </form>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Stock Management Modal */}
      {showStockModal && editingStore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowStockModal(false)}>
          <div 
            className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl border border-slate-700 max-h-[80vh] overflow-y-auto shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-400" />
                Manage Stock - {editingStore?.store_name}
              </h3>
              <button onClick={() => setShowStockModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Current Stock */}
            {partnerStock?.items?.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-400 mb-2">Current Stock with Partner</h4>
                <p className="text-xs text-slate-500 mb-2">Click on Qty or Value to edit inline</p>
                <div className="bg-slate-900/50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs text-slate-400">Product</th>
                        <th className="px-3 py-2 text-right text-xs text-slate-400">Qty</th>
                        <th className="px-3 py-2 text-right text-xs text-slate-400">Value</th>
                        <th className="px-3 py-2 text-right text-xs text-slate-400">Given</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnerStock.items.map((item, idx) => (
                        <tr key={idx} className="border-t border-slate-700/50">
                          <td className="px-3 py-2 text-sm text-white">{item.product_name}</td>
                          <td className="px-3 py-2 text-sm text-right">
                            <InlineEditCell
                              value={item.quantity}
                              displayValue={item.quantity}
                              type="number"
                              onSave={(newValue) => handleUpdateStockEntry(item.product_id, 'qty', newValue)}
                              className="text-slate-300"
                              title="Click to edit quantity"
                            />
                          </td>
                          <td className="px-3 py-2 text-sm text-right">
                            <InlineEditCell
                              value={item.cost_per_unit || 0}
                              displayValue={`₹${item.total_value?.toLocaleString()}`}
                              type="currency"
                              onSave={(newValue) => handleUpdateStockEntry(item.product_id, 'cost', newValue)}
                              className="text-teal-400"
                              title={`₹${item.cost_per_unit || 0}/unit - Click to edit`}
                            />
                          </td>
                          <td className="px-3 py-2 text-sm text-right text-slate-500">{formatStockDate(item.given_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-700/30">
                      <tr>
                        <td className="px-3 py-2 text-sm font-medium text-white">Total</td>
                        <td className="px-3 py-2 text-sm text-right font-medium text-white">{partnerStock.total_quantity}</td>
                        <td className="px-3 py-2 text-sm text-right font-medium text-teal-400">₹{partnerStock.total_value?.toLocaleString()}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
            
            {/* Add New Stock */}
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Give New Stock</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Product</label>
                    <select
                      value={newStock.product_id}
                      onChange={(e) => {
                        const product = products.find(p => (p._id || p.id) === e.target.value);
                        setNewStock({
                          ...newStock,
                          product_id: e.target.value,
                          product_name: product?.name || '',
                          cost_per_unit: product?.cost_price || product?.price || 0
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="">Select Product</option>
                      {products.map(p => (
                        <option key={p._id || p.id} value={p._id || p.id}>
                          {p.name} - ₹{p.cost_price || p.price}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={newStock.quantity}
                      onChange={(e) => setNewStock({...newStock, quantity: parseInt(e.target.value) || 0})}
                      min="1"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Cost/Unit</label>
                    <input
                      type="number"
                      value={newStock.cost_per_unit}
                      onChange={(e) => setNewStock({...newStock, cost_per_unit: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Total Value</label>
                    <div className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-teal-400 font-medium">
                      ₹{((newStock.quantity || 0) * (newStock.cost_per_unit || 0)).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Date Given</label>
                  <input
                    type="date"
                    value={newStock.given_date}
                    onChange={(e) => setNewStock({...newStock, given_date: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Notes (optional)</label>
                  <input
                    type="text"
                    value={newStock.notes}
                    onChange={(e) => setNewStock({...newStock, notes: e.target.value})}
                    placeholder="e.g., Initial stock, Restock, etc."
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowStockModal(false)}
                className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGiveStock}
                disabled={!newStock.product_id || !newStock.quantity}
                className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Give Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Edit Partner Modal */}
      {showEditModal && editingStore && (
        <EditPartnerModal
          store={editingStore}
          products={products}
          onClose={() => {
            setShowEditModal(false);
            setEditingStore(null);
          }}
          onSave={handleEditModalSave}
        />
      )}
    </div>
  );
}

export default PartnerStoresPage;
