import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Edit, Package, Search, Filter, Plus, Image as ImageIcon } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminAuthContext';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { useSearchParams, useNavigate } from 'react-router';
import EnhancedProductForm from '@/components/admin/EnhancedProductForm';
import axios from 'axios';
import { API_BASE_URL } from '@/utils/api';
import { toast } from 'react-toastify';

const API_URL = API_BASE_URL + '/api';
const BACKEND_URL = API_BASE_URL;

function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [focusField, setFocusField] = useState(null);
  const [issueType, setIssueType] = useState(null);
  const itemsPerPage = 15;
  const { getToken } = useAdmin();
  const { isDarkMode } = useAdminTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Handle closing form and return navigation
  const handleCloseProductForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
    setFocusField(null);
    setIssueType(null);
    
    // Check if we should navigate back to Marketing Hub
    const returnTo = sessionStorage.getItem('returnTo');
    const returnTab = sessionStorage.getItem('returnTab');
    if (returnTo) {
      sessionStorage.removeItem('returnTo');
      sessionStorage.removeItem('returnTab');
      // Include returnFrom=product to trigger SEO data refresh on Marketing Hub
      navigate(`${returnTo}?tab=${returnTab || 'seo'}&returnFrom=product`);
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
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setLoading(false);
    }
  };

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle auto-edit from SEO Fix Now button
  useEffect(() => {
    const editProductId = searchParams.get('edit');
    const focus = searchParams.get('focus');
    const issue = searchParams.get('issue');
    
    if (editProductId && products.length > 0) {
      const productToEdit = products.find(p => p.id === editProductId || p._id === editProductId);
      if (productToEdit) {
        setEditingProduct(productToEdit);
        setShowProductForm(true);
        setFocusField(focus || 'meta_description');
        setIssueType(issue || null);
        // Clear URL params
        searchParams.delete('edit');
        searchParams.delete('focus');
        searchParams.delete('issue');
        setSearchParams(searchParams);
      }
    }
  }, [products, searchParams, setSearchParams]);

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product =>
        product.category === categoryFilter
      );
    }

    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [products, searchQuery, categoryFilter]);

  const handleDeleteProduct = async (productId, productName) => {
    if (!confirm(`Delete "${productName}"? This action cannot be undone.`)) return;

    try {
      const response = await axios.delete(
        `${API_URL}/admin/products/${productId}`,
        {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        }
      );

      if (response.data.success) {
        setProducts(products.filter(p => p.id !== productId));
        alert('Product deleted successfully!');
      }
    } catch (error) {
      console.error('Delete product failed:', error);
      alert(error.response?.data?.detail || 'Failed to delete product');
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleProductFormSuccess = async () => {
    // Wait for products to be refetched before closing modal
    await fetchProducts();
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const handleRowClick = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleToggleTag = async (productId, tagName, value, event) => {
    event.stopPropagation(); // Prevent row click
    
    try {
      // Find the current product to get existing display tags
      const currentProduct = products.find(p => p.id === productId);
      const currentTags = currentProduct?.displayTags || {
        isOnSale: false,
        isBestseller: false,
        isNewLaunch: false,
        isBudgetFriendly: false,
        isFeatured: false
      };
      
      // Merge: only update the specific tag being toggled
      const displayTags = {
        ...currentTags,
        [tagName]: value
      };
      
      await axios.patch(
        `${API_URL}/admin/products/${productId}/display-tags`,
        { displayTags },
        {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Refresh products list
      await fetchProducts();
    } catch (error) {
      console.error('Failed to update tag:', error);
      console.error('Error details:', error.response?.data);
      alert(`Failed to update display tag: ${error.response?.data?.detail || error.message}`);
    }
  };

  // Get unique categories
  const categories = ['all', ...new Set(products.map(p => p.category))];

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className={`text-xl ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>Loading products...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>Product Management</h1>
          <p className={isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}>Manage products efficiently</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-sm flex items-center gap-2 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
            <Package size={16} />
            {products.length} Products
          </div>
          <button
            onClick={handleCreateProduct}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-bold rounded-lg hover:shadow-glow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Product
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className={`backdrop-blur-lg border rounded-xl p-4 mb-6 ${
        isDarkMode 
          ? 'bg-white/5 border-white/10' 
          : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDarkMode ? 'text-pearl-white/40' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search products by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 border rounded-lg text-sm transition-colors ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10 text-pearl-white placeholder:text-pearl-white/40 focus:border-cyber-lime'
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500'
                } focus:outline-none`}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <div className="relative">
              <Filter className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDarkMode ? 'text-pearl-white/40' : 'text-gray-400'}`} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 border rounded-lg text-sm appearance-none cursor-pointer transition-colors ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10 text-pearl-white focus:border-cyber-lime'
                    : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none`}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className={isDarkMode ? 'bg-obsidian' : 'bg-white'}>
                    {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className={`backdrop-blur-lg border rounded-xl overflow-hidden ${
        isDarkMode 
          ? 'bg-white/5 border-white/10' 
          : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? 'bg-white/5' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>Image</th>
                <th className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>Product Name</th>
                <th className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>Price</th>
                <th className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>Category</th>
                <th className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>Stock</th>
                <th className={`px-2 py-2 text-center text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`} title="On Sale">Sale</th>
                <th className={`px-2 py-2 text-center text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`} title="Bestseller">Best</th>
                <th className={`px-2 py-2 text-center text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`} title="New Launch">New</th>
                <th className={`px-2 py-2 text-center text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`} title="Budget Friendly">Budget</th>
                <th className={`px-4 py-2 text-center text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={isDarkMode ? 'divide-y divide-white/5' : 'divide-y divide-gray-200'}>
              {currentProducts.length === 0 ? (
                <tr>
                  <td colSpan="10" className={`px-4 py-8 text-center text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>
                    {searchQuery || categoryFilter !== 'all' ? 'No products found matching filters' : 'No products found'}
                  </td>
                </tr>
              ) : (
                currentProducts.map((product) => (
                  <tr 
                    key={product.id} 
                    className={`transition-colors cursor-pointer group ${
                      isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleRowClick(product)}
                  >
                    {/* Image */}
                    <td className="px-4 py-2">
                      <div className={`relative w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center ${
                        isDarkMode ? 'bg-white/5' : 'bg-gray-100'
                      }`}>
                        {product.image_url ? (
                          <img
                            src={product.image_url.startsWith('http') ? product.image_url : `${BACKEND_URL}${product.image_url}`}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4" style={{ color: isDarkMode ? 'rgba(255,255,255,0.4)' : '#9ca3af' }} />
                        )}
                      </div>
                    </td>

                    {/* Product Name */}
                    <td className="px-4 py-2">
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'} truncate max-w-[200px]`}>{product.name}</div>
                      <div className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>{product.weight}</div>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>₹{product.price}</span>
                        {product.original_price && (
                          <span className={`text-xs line-through ${isDarkMode ? 'text-pearl-white/40' : 'text-gray-400'}`}>
                            ₹{product.original_price}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-2">
                      <span className="inline-block px-2 py-0.5 bg-cyber-lime/20 text-cyber-lime text-xs font-medium rounded-full capitalize">
                        {product.category}
                      </span>
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                        (product.stock || 0) > 20 
                          ? 'bg-green-500/20 text-green-400' 
                          : (product.stock || 0) > 0 
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {product.stock || product.stock_quantity || 0}
                      </span>
                    </td>

                    {/* Sale Toggle */}
                    <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleToggleTag(product.id, 'isOnSale', !product.displayTags?.isOnSale, e)}
                        className={`w-6 h-6 text-xs rounded-full flex items-center justify-center transition-all ${
                          product.displayTags?.isOnSale
                            ? 'bg-red-500 text-white shadow-md shadow-red-500/40'
                            : 'bg-slate-700 text-slate-500 hover:bg-slate-600'
                        }`}
                        title="Toggle Sale"
                      >
                        {product.displayTags?.isOnSale ? '%' : ''}
                      </button>
                    </td>

                    {/* Bestseller Toggle */}
                    <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleToggleTag(product.id, 'isBestseller', !product.displayTags?.isBestseller, e)}
                        className={`w-6 h-6 text-xs rounded-full flex items-center justify-center transition-all ${
                          product.displayTags?.isBestseller
                            ? 'bg-yellow-500 text-white shadow-md shadow-yellow-500/40'
                            : 'bg-slate-700 text-slate-500 hover:bg-slate-600'
                        }`}
                        title="Toggle Bestseller"
                      >
                        {product.displayTags?.isBestseller ? '★' : ''}
                      </button>
                    </td>

                    {/* New Launch Toggle */}
                    <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleToggleTag(product.id, 'isNewLaunch', !product.displayTags?.isNewLaunch, e)}
                        className={`w-6 h-6 text-xs rounded-full flex items-center justify-center transition-all ${
                          product.displayTags?.isNewLaunch
                            ? 'bg-teal-500 text-white shadow-md shadow-teal-500/40'
                            : 'bg-slate-700 text-slate-500 hover:bg-slate-600'
                        }`}
                        title="Toggle New Launch"
                      >
                        {product.displayTags?.isNewLaunch ? '✦' : ''}
                      </button>
                    </td>

                    {/* Budget Friendly Toggle */}
                    <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleToggleTag(product.id, 'isBudgetFriendly', !product.displayTags?.isBudgetFriendly, e)}
                        className={`w-6 h-6 text-xs rounded-full flex items-center justify-center transition-all ${
                          product.displayTags?.isBudgetFriendly
                            ? 'bg-green-500 text-white shadow-md shadow-green-500/40'
                            : 'bg-slate-700 text-slate-500 hover:bg-slate-600'
                        }`}
                        title="Toggle Budget Friendly"
                      >
                        {product.displayTags?.isBudgetFriendly ? '₹' : ''}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        {/* Edit */}
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-1.5 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="p-1.5 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`px-4 py-3 border-t flex items-center justify-between ${
            isDarkMode 
              ? 'bg-white/5 border-white/10' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
              Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
            </div>
            <div className="flex gap-1.5 items-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 border rounded-lg text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10 text-pearl-white hover:bg-white/10'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <div className="px-3 py-1.5 bg-cyber-lime/20 border border-cyber-lime/30 rounded-lg text-xs text-cyber-lime font-medium">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 border rounded-lg text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10 text-pearl-white hover:bg-white/10'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <EnhancedProductForm
          product={editingProduct}
          focusField={focusField}
          issueType={issueType}
          onClose={handleCloseProductForm}
          onSuccess={() => {
            handleProductFormSuccess();
            if (focusField) {
              toast.success(`SEO ${focusField.replace('_', ' ')} updated! Score will improve.`);
              setFocusField(null);
              setIssueType(null);
            }
            // Handle return navigation after success
            const returnTo = sessionStorage.getItem('returnTo');
            const returnTab = sessionStorage.getItem('returnTab');
            if (returnTo) {
              sessionStorage.removeItem('returnTo');
              sessionStorage.removeItem('returnTab');
              // Include returnFrom=product to trigger SEO data refresh on Marketing Hub
              setTimeout(() => navigate(`${returnTo}?tab=${returnTab || 'seo'}&returnFrom=product`), 500);
            }
          }}
        />
      )}

      {products.length === 0 && (
        <div className={`text-center py-20 backdrop-blur-lg border rounded-xl mt-6 ${
          isDarkMode 
            ? 'bg-white/5 border-white/10' 
            : 'bg-white border-gray-200'
        }`}>
          <div className={`mb-4 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>No products found</div>
          <button
            onClick={handleCreateProduct}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-glow transition-all"
          >
            <Plus size={20} />
            Create Your First Product
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminProductsPage;
