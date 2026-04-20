import {Suspense, useEffect, useState} from 'react';
import {Await, Link, useLoaderData} from 'react-router';
import {
  getSelectedProductOptions,
  Analytics,
  Money,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductImageGallery} from '~/components/ProductImageGallery';
import {ProductForm} from '~/components/ProductForm';
import {ProductItem} from '~/components/ProductItem';
import {ProductSkeletonGrid} from '~/components/ProductSkeleton';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {createSeoMeta, excerpt, SITE_URL} from '~/lib/seo';

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

export default function Product() {
  /** @type {LoaderReturnData} */
  const {product, recommendations} = useLoaderData();
  const [quantity, setQuantity] = useState(1);

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
  const productImages = product.images?.nodes ?? [];

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="md:sticky md:top-4 md:self-start">
          <ProductImageGallery
            variantImage={selectedVariant?.image}
            images={productImages}
          />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-[#06B6D4] tracking-widest uppercase mb-1">
            PetYupp
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-2">
            {title}
          </h1>
          <div className="flex items-center gap-2 text-sm mb-4">
            <span
              aria-label="4.8 out of 5 stars"
              className="text-yellow-400"
            >
              ★★★★★
            </span>
            <span className="font-semibold text-gray-900">4.8</span>
            <span className="text-gray-400">(234 reviews)</span>
            <span className="ml-1 inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded">
              ✓ Verified
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            {selectedVariant?.price ? (
              <span className="text-3xl font-extrabold text-gray-900">
                <Money data={selectedVariant.price} />
              </span>
            ) : null}
            {selectedVariant?.compareAtPrice &&
            Number(selectedVariant.compareAtPrice.amount) >
              Number(selectedVariant.price?.amount ?? 0) ? (
              <span className="text-lg text-gray-400 line-through">
                <Money data={selectedVariant.compareAtPrice} />
              </span>
            ) : null}
          </div>
          <p className="text-sm text-green-600 mt-1 font-medium">
            Free shipping on orders $49+
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {['✓ Dental Health', '✓ Vet Approved', '✓ Natural'].map((tag) => (
              <span
                key={tag}
                className="bg-green-50 text-green-800 text-xs font-medium px-3 py-1.5 rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="border-t border-gray-100 my-4" />
          <div
            aria-live="polite"
            className="inline-flex items-center gap-2 text-sm font-medium mb-4"
          >
            <span
              aria-hidden="true"
              className={`w-2 h-2 rounded-full ${
                selectedVariant?.availableForSale
                  ? 'bg-[#10B981]'
                  : 'bg-red-500'
              }`}
            />
            <span
              className={
                selectedVariant?.availableForSale
                  ? 'text-[#10B981]'
                  : 'text-red-600'
              }
            >
              {selectedVariant?.availableForSale ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
          <ProductForm
            productOptions={productOptions}
            selectedVariant={selectedVariant}
            quantity={quantity}
            onQuantityChange={setQuantity}
            priceLabel={
              selectedVariant?.price
                ? `$${Number(selectedVariant.price.amount).toFixed(2)}`
                : null
            }
          />
          <div className="grid grid-cols-4 gap-2 py-3 mt-3 border-t border-b border-gray-100 text-center">
            {[
              {icon: '🛡', label: 'Vet Approved'},
              {icon: '🚚', label: 'Free Ship $49+'},
              {icon: '↩', label: '30-Day Returns'},
              {icon: '🇺🇸', label: 'US Warehouse'},
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center">
                <span className="text-base mb-0.5" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="text-[10px] text-gray-500 leading-tight">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <p className="font-semibold text-gray-900 mb-3 uppercase text-xs tracking-wider">
              Details
            </p>
            <div
              className="text-gray-700 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{__html: descriptionHtml}}
            />
          </div>
        </div>
      </div>
      <RelatedProducts recommendations={recommendations} />
      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity,
            },
          ],
        }}
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
    images(first: 6) {
      nodes {
        id
        url
        altText
        width
        height
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
