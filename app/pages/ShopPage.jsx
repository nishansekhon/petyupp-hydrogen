import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Search, X } from 'lucide-react';
import axios from 'axios';
import ProductCard from '@/components/ProductCard';
import { API_BASE_URL } from '@/utils/api';

const API_URL = API_BASE_URL + '/api';

const CATEGORIES = [
  { id: 'ALL', name: 'All Products' },
  { id: 'calming', name: 'Calming Treats' },
  { id: 'dental', name: 'Dental Chews' },
  { id: 'power-chews', name: 'Power Chews' },
  { id: 'joint-support', name: 'Joint Support' },
  { id: 'gut-health', name: 'Gut Health' },
  { id: 'bundles', name: 'Starter Bundles' },
];

const CONCERNS = [
  { id: 'separation-anxiety', name: 'Separation Anxiety' },
  { id: 'dental-health', name: 'Dental Health' },
  { id: 'destructive-chewing', name: 'Destructive Chewing' },
  { id: 'joint-pain', name: 'Joint Pain' },
  { id: 'digestive-issues', name: 'Digestive Issues' },
  { id: 'hyperactivity', name: 'Hyperactivity' },
];

function ShopPage() {
  useEffect(() => {
    document.title = 'Shop Natural Dog Products | PetYupp';
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'ALL');
  const [selectedConcern, setSelectedConcern] = useState(searchParams.get('concern') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');

  useEffect(() => { fetchProducts(); }, [selectedCategory, selectedConcern, search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (selectedConcern) params.append('concern', selectedConcern);
      if (search) params.append('search', search);
      const url = params.toString() ? `${API_URL}/products?${params}` : `${API_URL}/products`;
      const response = await axios.get(url);
      setProducts(response.data);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  };

  const clearFilters = () => {
    setSelectedCategory('ALL'); setSelectedConcern(''); setSearch('');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-white">
      <div>
        <div className="sticky top-[var(--nav-height)] z-40 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h1 className="text-lg font-black text-gray-900">Shop <span className="text-[#06B6D4]">PetYupp</span></h1>
              <div className="flex-1 max-w-xs relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search products..." value={search}
                  onChange={(e) => { setSearch(e.target.value); }}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent outline-none bg-gray-50" />
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all border ${
                    selectedCategory === cat.id ? 'bg-[#06B6D4] text-white border-[#06B6D4]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#06B6D4] hover:text-[#06B6D4]'
                  }`}>{cat.name}</button>
              ))}
              <div className="w-px bg-gray-200 mx-1" />
              {CONCERNS.map((concern) => (
                <button key={concern.id} onClick={() => setSelectedConcern(selectedConcern === concern.id ? '' : concern.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all border ${
                    selectedConcern === concern.id ? 'bg-[#10B981] text-white border-[#10B981]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#10B981] hover:text-[#10B981]'
                  }`}>{concern.name}</button>
              ))}
              {(selectedCategory !== 'ALL' || selectedConcern || search) && (
                <button onClick={clearFilters} className="px-3 py-1.5 text-xs font-semibold rounded-full text-red-500 border border-red-200 hover:bg-red-50 transition-all flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-2 text-xs text-gray-500">
          {loading ? 'Loading...' : `${products.length} products`}
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-16">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {[...Array(10)].map((_, i) => <div key={i} className="rounded-2xl aspect-square animate-pulse bg-gray-100" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">🐾</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No products found</h3>
              <button onClick={clearFilters} className="px-5 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-xl font-semibold text-sm">Clear Filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {products.map((product, index) => <ProductCard key={product.id} product={product} index={index} showBadges={true} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShopPage;
