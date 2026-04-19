import {Suspense, useState} from 'react';
import {Await, useLoaderData} from 'react-router';
import {
  getSelectedProductOptions,
  Analytics,
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
  const title = `PetYupp | ${product.title}`;
  const description =
    excerpt(product.seo?.description || product.description) ||
    `Shop ${product.title} at PetYupp — natural, vet-approved dog products.`;
  const image = product.selectedOrFirstAvailableVariant?.image?.url;
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
          <div className="mt-3">
            <ProductPrice
              price={selectedVariant?.price}
              compareAtPrice={selectedVariant?.compareAtPrice}
              size="lg"
            />
          </div>
          <div
            aria-live="polite"
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium"
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
          <div className="mt-6">
            <ProductForm
              productOptions={productOptions}
              selectedVariant={selectedVariant}
              quantity={quantity}
              onQuantityChange={setQuantity}
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {[
              '✓ Vet Approved',
              '🚚 Free Ship $49+',
              '↩ 30-Day Returns',
              '🇺🇸 Made in USA',
            ].map((label) => (
              <span
                key={label}
                className="text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="font-semibold text-gray-900 mb-2">Description</p>
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
