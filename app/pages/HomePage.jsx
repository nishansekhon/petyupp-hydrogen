import React, { Suspense, lazy } from 'react';
import { Link } from 'react-router';
import HomepageHero from '@/components/home/HomepageHero';
import ProductCard from '@/components/ProductCard';
import { OrganizationSchema, WebsiteSchema } from '@/components/SEOSchema';
import DogProblemSlider from '@/components/DogProblemSlider';
import QuickCategoryScroll from '@/components/QuickCategoryScroll';
import WhyPetYupp from '@/components/home/WhyPetYupp';
import ShopCategories from '@/components/home/ShopCategories';

const TestimonialSlider = lazy(() => import('@/components/home/TestimonialSlider'));
const NewsletterSignup = lazy(() => import('@/components/home/NewsletterSignup'));
const BarkReelsSection = lazy(() => import('@/components/BarkReelsSection'));
const LatestBlogsSection = lazy(() => import('@/components/LatestBlogsSection'));

const SectionFallback = ({ height = 'min-h-[200px]' }) => (
  <div className={`${height} w-full bg-white`} aria-hidden="true" />
);

function withShopifyWidth(url, width) {
  if (!url || typeof url !== 'string') return url;
  try {
    const u = new URL(url);
    u.searchParams.set('width', String(width));
    return u.toString();
  } catch {
    return url;
  }
}

function adaptShopifyProduct(product) {
  const image = product.images?.nodes?.[0];
  const price = Number(product.priceRange?.minVariantPrice?.amount ?? 0);
  const compareAt = Number(product.compareAtPriceRange?.maxVariantPrice?.amount ?? 0);
  return {
    id: product.id,
    slug: product.handle,
    name: product.title,
    image_url: withShopifyWidth(image?.url, 400) || '',
    price,
    original_price: compareAt > price ? compareAt : null,
  };
}

function HomePage({ products = [], collections = [] }) {
  const featuredProducts = products.map(adaptShopifyProduct);

  return (
    <div className="min-h-screen bg-white">
      <OrganizationSchema />
      <WebsiteSchema />

      {/* Mobile Quick Categories */}
      <div className="md:hidden w-full bg-white">
        <QuickCategoryScroll />
      </div>

      {/* 1. Hero */}
      <HomepageHero />

      {/* 2. Dog Problem Slider */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8 md:pt-12 mb-12">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
            What does your dog need relief from?
          </h2>
          <p className="text-gray-500 text-sm md:text-base">
            Find natural relief matched to your dog's exact needs
          </p>
        </div>
        <DogProblemSlider />
      </div>

      {/* 3. Most loved this month */}
      <section id="homepage-products" className="py-10 max-w-7xl mx-auto px-4 md:px-6 scroll-mt-32">
        <div className="flex items-end justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Most loved this month
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Picked by real dog parents
            </p>
          </div>
          <Link
            to="/collections/all"
            className="text-sm text-[#06B6D4] hover:text-[#0891B2] font-medium whitespace-nowrap"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredProducts.map((product, index) => (
            <ProductCard key={product.id + '-best'} product={product} index={index} />
          ))}
        </div>
      </section>

      {/* 3b. Shop Our Categories */}
      <ShopCategories collections={collections} />

      {/* 5. Why PetYupp comparison table */}
      <WhyPetYupp />

      {/* 6. Testimonials */}
      <Suspense fallback={<SectionFallback height="min-h-[300px]" />}>
        <TestimonialSlider />
      </Suspense>

      {/* 7. Dog Stories - See Why Dogs Love PetYupp */}
      <div className="bg-[#F9FAFB] py-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-2">
            See Why Dogs Love PetYupp 🐾
          </h2>
          <p className="text-gray-500 text-sm mb-8">Real dogs, real results</p>
          <Suspense fallback={<SectionFallback />}>
            <BarkReelsSection />
          </Suspense>
        </div>
      </div>

      {/* 8. Newsletter - Join the Pack */}
      <Suspense fallback={<SectionFallback height="min-h-[240px]" />}>
        <NewsletterSignup />
      </Suspense>

      {/* 9. From Our Blog */}
      <div className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-black text-gray-900">From Our Blog</h2>
            <Link to="/blog" className="text-[#06B6D4] hover:text-[#0891B2] text-sm font-semibold">
              All Posts →
            </Link>
          </div>
          <Suspense fallback={<SectionFallback />}>
            <LatestBlogsSection />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
