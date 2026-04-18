import React from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import HeroSlider from '@/components/HeroSlider';
import { OrganizationSchema, WebsiteSchema } from '@/components/SEOSchema';
import LatestBlogsSection from '@/components/LatestBlogsSection';
import BarkReelsSection from '@/components/BarkReelsSection';
import DogProblemSlider from '@/components/DogProblemSlider';
import QuickCategoryScroll from '@/components/QuickCategoryScroll';
import WhyPetYupp from '@/components/home/WhyPetYupp';
import TestimonialSlider from '@/components/home/TestimonialSlider';
import NewsletterSignup from '@/components/home/NewsletterSignup';
import ShopCategories from '@/components/home/ShopCategories';

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

function HomePage({ products = [], collections = [] }) {
  const featuredProducts = products.map(adaptShopifyProduct);

  const ProductCard = ({ product, index }) => (
    <motion.div
      key={product.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 group flex flex-col">
        <Link to={`/product/${product.slug || product.id}`} className="block flex-1">
          <div className="relative aspect-square overflow-hidden bg-gray-50">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {index === 0 && (
              <div className="absolute top-2 left-2 bg-[#06B6D4] text-white px-3 py-1 rounded-full text-xs font-bold shadow">
                BESTSELLER
              </div>
            )}
            {product.original_price && (
              <div className="absolute top-2 right-2 bg-[#10B981] text-white px-2 py-1 rounded-full text-xs font-bold">
                {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
              {product.name}
            </h3>
            {product.rating && (
              <div className="flex items-center gap-1 mb-2">
                <Star size={13} className="text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-bold text-gray-900">{product.rating}</span>
                <span className="text-xs text-gray-400">({product.review_count})</span>
              </div>
            )}
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

  return (
    <div className="min-h-screen bg-white">
      <OrganizationSchema />
      <WebsiteSchema />

      {/* Mobile Quick Categories */}
      <div className="md:hidden w-full bg-white">
        <QuickCategoryScroll />
      </div>

      {/* 1. Hero */}
      <HeroSlider />

      {/* 2. Dog Problem Slider - Desktop only */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 md:px-6 mt-12 mb-12">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
            What is your dog struggling with?
          </h2>
          <p className="text-gray-500 text-sm md:text-base">
            Find natural solutions matched to your dog's exact problem
          </p>
        </div>
        <DogProblemSlider />
      </div>

      {/* 3. Most Loved by Dogs This Month */}
      <div className="py-10 max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-black text-gray-900">Most Loved by Dogs This Month 🐾</h2>
          <Link to="/shop" className="text-[#06B6D4] hover:text-[#0891B2] text-sm font-semibold">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {featuredProducts.map((product, index) => (
            <ProductCard key={product.id + '-best'} product={product} index={index} />
          ))}
        </div>
      </div>

      {/* 3b. Shop Our Categories */}
      <ShopCategories collections={collections} />

      {/* 5. Why PetYupp comparison table */}
      <WhyPetYupp />

      {/* 6. Testimonials */}
      <TestimonialSlider />

      {/* 7. Dog Stories - See Why Dogs Love PetYupp */}
      <div className="bg-[#F9FAFB] py-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-2">
            See Why Dogs Love PetYupp 🐾
          </h2>
          <p className="text-gray-500 text-sm mb-8">Real dogs, real results</p>
          <BarkReelsSection />
        </div>
      </div>

      {/* 8. Newsletter - Join the Pack */}
      <NewsletterSignup />

      {/* 9. From Our Blog */}
      <div className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-black text-gray-900">From Our Blog</h2>
            <Link to="/blog" className="text-[#06B6D4] hover:text-[#0891B2] text-sm font-semibold">
              All Posts →
            </Link>
          </div>
          <LatestBlogsSection />
        </div>
      </div>
    </div>
  );
}

export default HomePage;
