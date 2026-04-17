import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

const API_URL = API_BASE_URL + '/api';
const BACKEND_URL = API_BASE_URL;

// Pill label shown to users → category/tag value the API will match against.
// Labels without a populated match fall through to the "Coming soon" state.
const CATEGORIES = [
  { label: 'Natural Treats and Chews', query: 'Dog Treats' },
  { label: 'Yak Chews', query: 'Cheese Chews' },
  { label: 'Bully Sticks', query: 'Bully Sticks' },
  { label: 'Wooden Chews', query: 'Wooden Chews' },
  { label: 'Dog Toys', query: 'Dog Toys' },
  { label: 'Dog Diners', query: 'Dog feeder' },
  { label: 'Bowls and Buckets', query: 'Bowls & Feeders' },
  { label: 'Non-Skid Mats', query: 'Non-Skid Mats' },
];

const CategoryProductCard = ({ product, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.4 }}
    className="flex-shrink-0 w-[260px] snap-start"
  >
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 group flex flex-col h-full">
      <Link to={`/product/${product.slug || product.id}`} className="block flex-1">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img
            src={product.image_url?.startsWith('http') ? product.image_url : `${BACKEND_URL}${product.image_url}`}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
          <div className="flex items-center gap-1 mb-2">
            <Star size={13} className="text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-bold text-gray-900">{product.rating}</span>
            <span className="text-xs text-gray-400">({product.review_count})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-lg text-gray-900">
              ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
            </span>
            {product.original_price && (
              <span className="text-sm text-gray-400 line-through">
                ${typeof product.original_price === 'number' ? product.original_price.toFixed(2) : product.original_price}
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <button className="bg-[#06B6D4] text-white rounded-lg py-2 px-4 w-full text-sm font-medium hover:bg-[#0891B2] transition-colors">
          Add to Cart
        </button>
      </div>
    </div>
  </motion.div>
);

const ShopCategories = () => {
  const [active, setActive] = useState(CATEGORIES[0].label);
  const [cache, setCache] = useState({});
  const scrollRef = useRef(null);

  useEffect(() => {
    if (cache[active] !== undefined) return;
    const cat = CATEGORIES.find((c) => c.label === active);
    let cancelled = false;
    axios
      .get(`${API_URL}/products`, { params: { category: cat.query, limit: 10 } })
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data.slice(0, 5) : [];
        setCache((prev) => ({ ...prev, [active]: list }));
      })
      .catch(() => {
        if (!cancelled) setCache((prev) => ({ ...prev, [active]: [] }));
      });
    return () => {
      cancelled = true;
    };
  }, [active, cache]);

  const products = cache[active];
  const loaded = products !== undefined;

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: direction * 320, behavior: 'smooth' });
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 md:px-6">
      <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-6">Shop Our Categories</h2>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const isActive = cat.label === active;
          return (
            <button
              key={cat.label}
              onClick={() => setActive(cat.label)}
              className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-colors border ${
                isActive
                  ? 'bg-[#06B6D4] text-white border-[#06B6D4]'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-[#06B6D4] hover:text-[#06B6D4]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {loaded && products.length === 0 ? (
        <div className="py-16 text-center text-gray-500 text-sm">Coming soon</div>
      ) : (
        <div className="relative">
          <button
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 items-center justify-center hover:bg-gray-50"
          >
            <ChevronLeft size={18} className="text-gray-700" />
          </button>
          <button
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 items-center justify-center hover:bg-gray-50"
          >
            <ChevronRight size={18} className="text-gray-700" />
          </button>

          <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide snap-x pb-2">
            {loaded
              ? products.map((product, index) => (
                  <CategoryProductCard key={product.id} product={product} index={index} />
                ))
              : Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-[260px] h-[380px] bg-gray-100 rounded-2xl animate-pulse"
                  />
                ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopCategories;
