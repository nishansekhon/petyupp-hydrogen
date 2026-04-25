import {Suspense, useEffect, useRef, useState} from 'react';
import {Await, Link, redirect, useLoaderData} from 'react-router';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {ProductItem} from '~/components/ProductItem';
import {ProductSkeletonGrid} from '~/components/ProductSkeleton';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {createSeoMeta, excerpt, SITE_URL} from '~/lib/seo';
import {getProductMetadata} from '~/lib/productMetadata';
import PdpGallery from '~/components/pdp/PdpGallery';
import PdpBuyBox from '~/components/pdp/PdpBuyBox';
import PdpAttributeBadges from '~/components/pdp/PdpAttributeBadges';
import PdpDescription from '~/components/pdp/PdpDescription';
import PdpTrustStrip from '~/components/pdp/PdpTrustStrip';
import PdpReviewsSection from '~/components/pdp/PdpReviewsSection';
import PdpUgcSection from '~/components/pdp/PdpUgcSection';
import PdpFaq from '~/components/pdp/PdpFaq';
import PdpStickyAddToCart from '~/components/pdp/PdpStickyAddToCart';

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data}) => {
  const product = data?.product;
  if (!product) return createSeoMeta({title: 'PetYupp'});
  const title = `${product.title} | PetYupp`;
  const description =
    excerpt(product.seo?.description || product.description, 155) ||
    `Shop ${product.title} at PetYupp — natural, vet-approved dog products.`;
  const image =
    product.selectedOrFirstAvailableVariant?.image?.url ||
    product.featuredImage?.url;
  return createSeoMeta({
    title,
    description,
    url: `${SITE_URL}/products/${product.handle}`,
    type: 'product',
    image,
  });
};

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {Route.LoaderArgs}
 */
async function loadCriticalData({context, params, request}) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    // Phase 5 catalog consolidation: archived/merged handles often have a
    // 301 stored in Shopify's URL redirects. Hydrogen doesn't consume those
    // automatically, so check here before falling through to 404.
    const pathname = new URL(request.url).pathname;
    const redirectResult = await storefront
      .query(URL_REDIRECT_QUERY, {
        variables: {path: `path:${pathname}`},
        cache: storefront.CacheNone(),
      })
      .catch(() => null);
    const match = redirectResult?.urlRedirects?.nodes?.[0];
    if (match?.target) {
      throw redirect(match.target, 301);
    }
    throw new Response(null, {status: 404});
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: product});

  return {
    product,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {Route.LoaderArgs}
 */
function loadDeferredData({context, params}) {
  const {storefront} = context;
  const {handle} = params;

  const recommendations = storefront
    .query(PRODUCT_RECOMMENDATIONS_QUERY, {variables: {handle}})
    .then((result) => result?.productRecommendations ?? [])
    .catch((error) => {
      console.error(error);
      return [];
    });

  return {recommendations};
}

function TitleStarsBlock({title, level = 'h1'}) {
  const Heading = level;
  return (
    <div>
      <p className="text-[10px] font-semibold text-[#06B6D4] tracking-widest uppercase mb-1">
        PetYupp
      </p>
      <Heading className="text-2xl lg:text-[28px] font-medium text-gray-900 leading-tight mb-2">
        {title}
      </Heading>
      <div className="flex items-center gap-2 text-sm">
        <span aria-label="4.8 out of 5 stars" className="text-yellow-400">
          ★★★★★
        </span>
        <span className="font-medium text-gray-900">4.8</span>
        <span className="text-gray-500">· 234 reviews</span>
      </div>
    </div>
  );
}

export default function Product() {
  /** @type {LoaderReturnData} */
  const {product, recommendations} = useLoaderData();
  const [quantity, setQuantity] = useState(1);
  const mobileAddToCartRef = useRef(null);
  const buyBoxEndRef = useRef(null);

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const {title, descriptionHtml} = product;
  const baseImages = product.images?.nodes ?? [];
  const variantImage = selectedVariant?.image;

  // Runtime detect "this product has variant-level imagery" by counting
  // distinct image URLs across all option values' firstSelectableVariant.
  // Storefront API doesn't expose ProductVariant.media (Admin-only), so
  // we use this signal to decide whether the gallery should scope to the
  // single variant.image (Phase 5.5b flavored-variety pattern) or fall
  // back to the product-level images array (Plain pattern, where every
  // variant inherits the same product hero).
  const variantImageUrls = new Set();
  productOptions?.forEach((opt) =>
    opt.optionValues.forEach((v) => {
      const u = v.firstSelectableVariant?.image?.url;
      if (u) variantImageUrls.add(u);
    }),
  );
  const productHasVariantImagery = variantImageUrls.size > 1;

  const productImages =
    variantImage?.url && baseImages[0]?.url !== variantImage.url
      ? [variantImage, ...baseImages.filter((img) => img?.url !== variantImage.url)]
      : baseImages;
  const metadata = getProductMetadata(product.handle);

  const productJsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: title,
    description: excerpt(product.description, 500),
    image: productImages.map((img) => img.url).filter(Boolean),
    brand: {'@type': 'Brand', name: 'PetYupp'},
    sku: selectedVariant?.sku || undefined,
    offers: selectedVariant?.price
      ? {
          '@type': 'Offer',
          price: selectedVariant.price.amount,
          priceCurrency: selectedVariant.price.currencyCode,
          availability: selectedVariant.availableForSale
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          url: `${SITE_URL}/products/${product.handle}`,
        }
      : undefined,
  };

  const buyBoxProps = {
    product,
    selectedVariant,
    productOptions,
    quantity,
    onQuantityChange: setQuantity,
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-6 pb-24 md:pb-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(productJsonLd)}}
      />
      <BackToAIAdvisor />
      <Breadcrumbs
        items={[
          {label: 'Home', to: '/'},
          {label: 'Products', to: '/collections/all'},
          {label: title},
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[60px_1fr_280px] gap-4 lg:gap-3.5 mt-4">
        {/* PdpGallery returns a Fragment of [ThumbRail, HeroSection]:
              - ThumbRail  → grid col 1 (lg only, hidden on mobile)
              - HeroSection → grid col 2; on mobile contains the horiz strip too
            Both share the same activeIndex state inside PdpGallery. */}
        <PdpGallery
          images={productImages}
          selectedVariant={selectedVariant}
          productHasVariantImagery={productHasVariantImagery}
          title={title}
        />

        {/* RIGHT column — desktop sticky buy-box aside.
            Spans rows 1+2 so it remains anchored through below-fold sections.
            Sticky lives on the aside itself with self-start so the aside is
            content-sized; its containing block is the grid parent. */}
        <aside className="hidden lg:block lg:row-span-2 lg:col-start-3 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <div className="flex flex-col gap-3.5">
            <TitleStarsBlock title={title} level="h1" />
            <PdpAttributeBadges badges={metadata.badges} />
            <PdpBuyBox {...buyBoxProps} />
          </div>
        </aside>

        {/* Below-the-fold content: spans cols 1+2 on desktop, full-width on mobile. */}
        <div className="lg:col-span-2 lg:col-start-1 flex flex-col gap-8 min-w-0">
          {/* Mobile-only in-flow buy area (between hero and UGC). */}
          <div className="lg:hidden flex flex-col gap-5">
            <TitleStarsBlock title={title} level="h1" />
            <PdpAttributeBadges badges={metadata.badges} />
            <PdpDescription
              shortDescription={metadata.shortDescription}
              fullDescriptionHtml={descriptionHtml}
            />
            <PdpBuyBox {...buyBoxProps} ref={mobileAddToCartRef} />
            {/* Sentinel for PdpStickyAddToCart's IntersectionObserver.
                Lives directly after the in-flow buy box so the sticky bar
                slides up only once the user has scrolled the entire buy
                box (including paired-products card) above the viewport. */}
            <div ref={buyBoxEndRef} aria-hidden />
            <PdpTrustStrip />
          </div>

          {/* Desktop: description below the gallery */}
          <div className="hidden lg:block">
            <h2 className="text-xl font-medium text-gray-900 mb-3">
              About this product
            </h2>
            <PdpDescription
              shortDescription={metadata.shortDescription}
              fullDescriptionHtml={descriptionHtml}
            />
          </div>

          <PdpUgcSection
            productHandle={product.handle}
            productTitle={title}
          />
          <PdpReviewsSection productTitle={title} />
          <PdpFaq faqs={metadata.faqs} />
        </div>
      </div>

      <RelatedProducts recommendations={recommendations} />

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price?.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity,
            },
          ],
        }}
      />

      <PdpStickyAddToCart
        sentinelRef={buyBoxEndRef}
        product={product}
        selectedVariant={selectedVariant}
        quantity={quantity}
      />
    </div>
  );
}

// Renders a 'back to AI recommendations' link only when the visitor still
// has a recent saved advisor conversation in sessionStorage. Checked on the
// client after mount to avoid hydration mismatches.
function BackToAIAdvisor() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.sessionStorage.getItem('petyupp_ai_results');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data.timestamp !== 'number') return;
      if (Date.now() - data.timestamp < 30 * 60 * 1000) {
        setShow(true);
      }
    } catch {}
  }, []);
  if (!show) return null;
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1 text-sm text-[#06B6D4] hover:underline mb-4"
    >
      ← Back to AI recommendations
    </Link>
  );
}

function RelatedProducts({recommendations}) {
  return (
    <section className="mt-16 pt-8 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        You May Also Like
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        <Suspense fallback={<ProductSkeletonGrid count={4} />}>
          <Await resolve={recommendations} errorElement={null}>
            {(items) => {
              const list = (items ?? []).slice(0, 4);
              if (list.length === 0) return null;
              return list.map((product) => (
                <ProductItem key={product.id} product={product} />
              ));
            }}
          </Await>
        </Suspense>
      </div>
    </section>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    images(first: 100) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    variants(first: 100) {
      nodes {
        id
        title
        availableForSale
        selectedOptions { name value }
        price { amount currencyCode }
        compareAtPrice { amount currencyCode }
        sellingPlanAllocations(first: 1) {
          nodes {
            sellingPlan { id name }
            priceAdjustments {
              price { amount currencyCode }
            }
          }
        }
      }
    }
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
`;

const URL_REDIRECT_QUERY = `#graphql
  query UrlRedirectLookup($path: String!) {
    urlRedirects(first: 1, query: $path) {
      nodes { id path target }
    }
  }
`;

const PRODUCT_RECOMMENDATIONS_QUERY = `#graphql
  query ProductRecommendations(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    productRecommendations(productHandle: $handle) {
      id
      handle
      title
      featuredImage {
        id
        altText
        url
        width
        height
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
    }
  }
`;

/** @typedef {import('./+types/products.$handle').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
