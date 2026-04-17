import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Package, X, Search } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminAuthContext';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import axios from 'axios';

const API_URL = API_BASE_URL + '/api';
const BACKEND_URL = API_BASE_URL;

function BundlesPage() {
  const [bundles, setBundles] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const { getToken } = useAdmin();
  const { isDarkMode } = useAdminTheme();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    products: [],
    originalPrice: 0,
    bundlePrice: 0,
    discountPercent: 0,
    rating: 4.5,
    isActive: true,
    displayOrder: 0
  });

  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  useEffect(() => {
    fetchBundles();
    fetchProducts();
  }, []);

  const fetchBundles = async () => {
    try {
      const response = await axios.get(`${API_URL}/bundles`);
      setBundles(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch bundles:', error);
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/products`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleCreateBundle = () => {
    setEditingBundle(null);
    setFormData({
      name: '',
      description: '',
      image: '',
      products: [],
      originalPrice: 0,
      bundlePrice: 0,
      discountPercent: 0,
      rating: 4.5,
      isActive: true,
      displayOrder: 0
    });
    setShowModal(true);
  };

  const handleEditBundle = (bundle) => {
    setEditingBundle(bundle);
    setFormData({
      name: bundle.name,
      description: bundle.description || '',
      image: bundle.image,
      products: bundle.products || [],
      originalPrice: bundle.originalPrice,
      bundlePrice: bundle.bundlePrice,
      discountPercent: bundle.discountPercent,
      rating: bundle.rating,
      isActive: bundle.isActive,
      displayOrder: bundle.displayOrder || 0
    });
    setShowModal(true);
  };

  const handleDeleteBundle = async (bundleId, bundleName) => {
    if (!window.confirm(`Delete "${bundleName}"? This action cannot be undone.`)) return;

    try {
      await axios.delete(`${API_URL}/admin/bundles/${bundleId}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      setBundles(bundles.filter(b => b.id !== bundleId));
      alert('Bundle deleted successfully!');
    } catch (error) {
      console.error('Delete bundle failed:', error);
      alert(error.response?.data?.detail || 'Failed to delete bundle');
    }
  };

  const handleAddProduct = (product) => {
    const existingProduct = formData.products.find(p => p.productId === product.id);
    if (existingProduct) {
      // Increase quantity
      const updatedProducts = formData.products.map(p =>
        p.productId === product.id ? { ...p, quantity: p.quantity + 1 } : p
      );
      setFormData({ ...formData, products: updatedProducts });
    } else {
      // Add new product
      const updatedProducts = [...formData.products, { productId: product.id, quantity: 1 }];
      setFormData({ ...formData, products: updatedProducts });
    }
    calculatePrices([...formData.products, { productId: product.id, quantity: 1 }]);
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const handleRemoveProduct = (productId) => {
    const updatedProducts = formData.products.filter(p => p.productId !== productId);
    setFormData({ ...formData, products: updatedProducts });
    calculatePrices(updatedProducts);
  };

  const calculatePrices = (productList) => {
    let total = 0;
    productList.forEach(bundleProduct => {
      const product = products.find(p => p.id === bundleProduct.productId);
      if (product) {
        total += product.price * bundleProduct.quantity;
      }
    });
    
    const originalPrice = total;
    const bundlePrice = formData.bundlePrice || (originalPrice * 0.75); // Default 25% discount
    const discountPercent = originalPrice > 0 ? Math.round(((originalPrice - bundlePrice) / originalPrice) * 100) : 0;
    
    setFormData(prev => ({
      ...prev,
      originalPrice: Math.round(originalPrice),
      discountPercent
    }));
  };

  const handleBundlePriceChange = (price) => {
    const bundlePrice = parseFloat(price) || 0;
    const discountPercent = formData.originalPrice > 0 
      ? Math.round(((formData.originalPrice - bundlePrice) / formData.originalPrice) * 100) 
      : 0;
    
    setFormData(prev => ({
      ...prev,
      bundlePrice,
      discountPercent
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.image || formData.products.length === 0) {
      alert('Please fill in bundle name, image, and add at least one product');
      return;
    }

    try {
      const bundleData = {
        name: formData.name,
        description: formData.description,
        image: formData.image,
        products: formData.products,
        originalPrice: formData.originalPrice,
        bundlePrice: formData.bundlePrice,
        discountPercent: formData.discountPercent,
        rating: parseFloat(formData.rating),
        isActive: formData.isActive,
        displayOrder: parseInt(formData.displayOrder)
      };

      if (editingBundle) {
        // Update existing bundle
        await axios.patch(
          `${API_URL}/admin/bundles/${editingBundle.id}`,
          bundleData,
          {
            headers: {
              'Authorization': `Bearer ${getToken()}`,
              'Content-Type': 'application/json'
            }
          }
        );
        alert('Bundle updated successfully!');
      } else {
        // Create new bundle
        await axios.post(
          `${API_URL}/admin/bundles`,
          bundleData,
          {
            headers: {
              'Authorization': `Bearer ${getToken()}`,
              'Content-Type': 'application/json'
            }
          }
        );
        alert('Bundle created successfully!');
      }

      setShowModal(false);
      fetchBundles();
    } catch (error) {
      console.error('Failed to save bundle:', error);
      alert(error.response?.data?.detail || 'Failed to save bundle');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  const getProductPrice = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.price : 0;
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className={`text-xl ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>Loading bundles...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
            Bundle Management
          </h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>
            Create and manage product bundles
          </p>
        </div>
        <button
          onClick={handleCreateBundle}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg text-white font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Bundle
        </button>
      </div>

      {/* Bundles Grid */}
      {bundles.length === 0 ? (
        <div className={`text-center py-20 ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'} rounded-xl border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <Package className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-pearl-white/40' : 'text-gray-400'}`} />
          <p className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
            No bundles yet
          </p>
          <p className={`${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'} mb-4`}>
            Create your first bundle to get started
          </p>
          <button
            onClick={handleCreateBundle}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg text-white font-medium transition-colors"
          >
            Create Bundle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bundles.map((bundle) => (
            <motion.div
              key={bundle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl overflow-hidden border ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
              } shadow-sm hover:shadow-md transition-shadow`}
            >
              {/* Bundle Image */}
              <div className="relative h-36">
                <img
                  src={bundle.image}
                  alt={bundle.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 flex gap-1">
                  <span className="px-2 py-0.5 bg-teal-500 text-white text-[10px] font-bold rounded">
                    BUNDLE
                  </span>
                  <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">
                    SAVE {bundle.discountPercent}%
                  </span>
                </div>
                {!bundle.isActive && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">INACTIVE</span>
                  </div>
                )}
              </div>

              {/* Bundle Info */}
              <div className="p-4">
                <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  {bundle.name}
                </h3>
                <p className={`text-xs mb-3 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>
                  {bundle.products?.length || 0} items included
                </p>

                {/* Pricing */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-lg font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                    ₹{bundle.bundlePrice}
                  </span>
                  <span className={`text-sm line-through ${isDarkMode ? 'text-pearl-white/40' : 'text-gray-400'}`}>
                    ₹{bundle.originalPrice}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditBundle(bundle)}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDarkMode
                        ? 'bg-slate-700 hover:bg-slate-600 text-pearl-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteBundle(bundle.id, bundle.name)}
                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl ${
                isDarkMode ? 'bg-slate-800' : 'bg-white'
              } shadow-xl`}
            >
              {/* Modal Header */}
              <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
              }`}>
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  {editingBundle ? 'Edit Bundle' : 'Create New Bundle'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <X className={`w-5 h-5 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Bundle Name */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                    Bundle Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-slate-700 border-slate-600 text-pearl-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    placeholder="e.g., Happy Pup Starter Kit"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-slate-700 border-slate-600 text-pearl-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    placeholder="Brief description of the bundle"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                    Image URL *
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-slate-700 border-slate-600 text-pearl-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    placeholder="https://example.com/image.jpg"
                    required
                  />
                  {formData.image && (
                    <div className="mt-2">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Product Selector */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                    Products in Bundle *
                  </label>
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-400'}`} />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setShowProductDropdown(true);
                          }}
                          onFocus={() => setShowProductDropdown(true)}
                          className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                            isDarkMode
                              ? 'bg-slate-700 border-slate-600 text-pearl-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                          placeholder="Search products to add..."
                        />
                      </div>
                    </div>

                    {/* Dropdown */}
                    {showProductDropdown && productSearch && (
                      <div className={`absolute z-10 w-full mt-1 max-h-48 overflow-y-auto rounded-lg border ${
                        isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'
                      } shadow-lg`}>
                        {filteredProducts.length === 0 ? (
                          <div className={`p-4 text-center ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>
                            No products found
                          </div>
                        ) : (
                          filteredProducts.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => handleAddProduct(product)}
                              className={`w-full px-4 py-2 text-left transition-colors ${
                                isDarkMode
                                  ? 'hover:bg-slate-600 text-pearl-white'
                                  : 'hover:bg-gray-100 text-gray-900'
                              }`}
                            >
                              <div className="font-medium">{product.name}</div>
                              <div className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>
                                ₹{product.price}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Products */}
                  {formData.products.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {formData.products.map((bundleProduct) => (
                        <div
                          key={bundleProduct.productId}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            isDarkMode ? 'bg-slate-700' : 'bg-gray-100'
                          }`}
                        >
                          <div>
                            <div className={`font-medium ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                              {getProductName(bundleProduct.productId)}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>
                              Qty: {bundleProduct.quantity} × ₹{getProductPrice(bundleProduct.productId)} = ₹
                              {getProductPrice(bundleProduct.productId) * bundleProduct.quantity}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(bundleProduct.productId)}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      Original Price (Auto)
                    </label>
                    <input
                      type="number"
                      value={formData.originalPrice}
                      readOnly
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDarkMode
                          ? 'bg-slate-700/50 border-slate-600 text-pearl-white/60'
                          : 'bg-gray-50 border-gray-300 text-gray-500'
                      } cursor-not-allowed`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      Bundle Price *
                    </label>
                    <input
                      type="number"
                      value={formData.bundlePrice}
                      onChange={(e) => handleBundlePriceChange(e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDarkMode
                          ? 'bg-slate-700 border-slate-600 text-pearl-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      required
                      min="0"
                    />
                  </div>
                </div>

                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-teal-500/20' : 'bg-teal-50'}`}>
                  <div className={`text-sm font-semibold ${isDarkMode ? 'text-teal-400' : 'text-teal-700'}`}>
                    Discount: {formData.discountPercent}% OFF
                  </div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-teal-400/80' : 'text-teal-600'}`}>
                    Customers save ₹{formData.originalPrice - formData.bundlePrice}
                  </div>
                </div>

                {/* Rating & Active Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      Rating (1-5)
                    </label>
                    <input
                      type="number"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDarkMode
                          ? 'bg-slate-700 border-slate-600 text-pearl-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      min="1"
                      max="5"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      Status
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${
                          formData.isActive ? 'bg-teal-500' : isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
                        }`}></div>
                        <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          formData.isActive ? 'translate-x-5' : ''
                        }`}></div>
                      </div>
                      <span className={`text-sm ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                        {formData.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isDarkMode
                        ? 'bg-slate-700 hover:bg-slate-600 text-pearl-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg text-white font-medium transition-colors"
                  >
                    {editingBundle ? 'Update Bundle' : 'Create Bundle'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BundlesPage;
