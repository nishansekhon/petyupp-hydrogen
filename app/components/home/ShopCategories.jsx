import React, { useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function adaptShopifyProduct(product) {
  const image = product.images?.nodes?.[0];
  const price = Number(product.priceRange?.minVariantPrice?.amount ?? 0);
  const compareAt = Number(product.compareAtPriceRange?.maxVariantPrice?.amount ?? 0);
  return {
    id: product.id,
    slug: product.handle,
    name: product.title,
    image_url: image?.url || '',
    price,
    original_price: compareAt > price ? compareAt : null,
  };
}

const CategoryProductCard = ({ product, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.4 }}
    className="flex-shrink-0 w-[260px] snap-start"
  >
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 group flex flex-col h-full">
      <Link to={`/products/${product.slug || product.id}`} className="block flex-1">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
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

const CATEGORY_MAP = [
  { label: 'Natural Treats and Chews', handle: 'dog-chews-and-treats' },
  { label: 'Yak Chews', handle: 'yak-chews' },
  { label: 'Dog Toys', handle: 'dog-toys' },
  { label: 'Dog Diners', handle: 'dog-diners' },
  { label: 'Bowls and Buckets', handle: 'dog-bowls' },
  { label: 'Non-Skid Mats', handle: 'non-skid-mats-for-dogs' },
];

const ShopCategories = ({ collections = [] }) => {
  const matched = CATEGORY_MAP
    .map(({handle, label}) => {
      const col = collections.find((c) => c.handle === handle);
      return col ? {...col, label} : null;
    })
    .filter(Boolean);

  const filtered = matched.length > 0
    ? matched
    : collections.map((c) => ({...c, label: c.title}));

  const withProducts = filtered.filter((c) => (c.products?.nodes?.length ?? 0) > 0);
  const [activeId, setActiveId] = useState(withProducts[0]?.id ?? filtered[0]?.id);
  const scrollRef = useRef(null);

  if (!filtered.length) return null;

  const active = filtered.find((c) => c.id === activeId) || filtered[0];
  const products = (active?.products?.nodes ?? []).map(adaptShopifyProduct);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: direction * 320, behavior: 'smooth' });
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 md:px-6">
      <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-6">Shop Our Categories</h2>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {filtered.map((c) => {
          const isActive = c.id === active.id;
          return (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-colors border ${
                isActive
                  ? 'bg-[#06B6D4] text-white border-[#06B6D4]'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-[#06B6D4] hover:text-[#06B6D4]'
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {products.length === 0 ? (
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
            {products.map((product, index) => (
              <CategoryProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopCategories;
