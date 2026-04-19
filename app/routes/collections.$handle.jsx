import {
  Form,
  Link,
  redirect,
  useLoaderData,
  useSearchParams,
} from 'react-router';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {ProductItem} from '~/components/ProductItem';
import {createSeoMeta, excerpt, SITE_URL} from '~/lib/seo';

function humanizeHandle(handle) {
  return (handle ?? '')
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const SORT_OPTIONS = {
  featured: {label: 'Featured', sortKey: 'BEST_SELLING', reverse: false},
  'price-asc': {label: 'Price: Low to High', sortKey: 'PRICE', reverse: false},
  'price-desc': {label: 'Price: High to Low', sortKey: 'PRICE', reverse: true},
  newest: {label: 'Newest', sortKey: 'CREATED', reverse: true},
};

function CollectionToolbar({productCount}) {
  const [searchParams] = useSearchParams();
  const currentSort = resolveSort(searchParams);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <p className="text-sm text-gray-600">
        Showing <span className="font-semibold text-gray-900">{productCount}</span>{' '}
        {productCount === 1 ? 'product' : 'products'}
      </p>
      <Form method="get" className="flex items-center gap-2">
        <label
          htmlFor="sort-by"
          className="text-sm text-gray-600 whitespace-nowrap"
        >
          Sort by:
        </label>
        <select
          id="sort-by"
          name="sort_by"
          defaultValue={currentSort}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white hover:border-gray-400 focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4] focus:outline-none transition-colors"
        >
          {Object.entries(SORT_OPTIONS).map(([value, option]) => (
            <option key={value} value={value}>
              {option.label}
            </option>
          ))}
        </select>
        <noscript>
          <button
            type="submit"
            className="text-sm px-3 py-2 rounded-lg bg-[#06B6D4] text-white"
          >
            Apply
          </button>
        </noscript>
      </Form>
    </div>
  );
}

function resolveSort(searchParams) {
  const key = searchParams.get('sort_by');
  return SORT_OPTIONS[key] ? key : 'featured';
}

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data, params}) => {
  const collection = data?.collection;
  if (collection) {
    const title = `PetYupp | ${collection.title}`;
    const description =
      excerpt(collection.description) ||
      `Shop the ${collection.title} collection at PetYupp — natural, vet-approved dog products.`;
    return createSeoMeta({
      title,
      description,
      url: `${SITE_URL}/collections/${collection.handle}`,
    });
  }
  const fallbackTitle = humanizeHandle(params.handle);
  return createSeoMeta({
    title: `PetYupp | ${fallbackTitle}`,
    description: `We're curating the best products for ${fallbackTitle}. Check back soon.`,
    url: `${SITE_URL}/collections/${params.handle}`,
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
  const url = new URL(request.url);
  const sortKey = resolveSort(url.searchParams);
  const sort = SORT_OPTIONS[sortKey];
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  if (!handle) {
    throw redirect('/collections');
  }

  let collection = null;
  try {
    const result = await storefront.query(COLLECTION_QUERY, {
      variables: {
        handle,
        sortKey: sort.sortKey,
        reverse: sort.reverse,
        ...paginationVariables,
      },
    });
    collection = result?.collection ?? null;
  } catch (error) {
    console.error('Collection query failed:', error);
  }

  if (!collection) {
    const {products} = await storefront.query(FALLBACK_PRODUCTS_QUERY);
    return {
      collection: null,
      fallbackTitle: humanizeHandle(handle),
      recommendedProducts: products?.nodes ?? [],
    };
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {
    collection,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {Route.LoaderArgs}
 */
function loadDeferredData({context}) {
  return {};
}

export default function Collection() {
  /** @type {LoaderReturnData} */
  const {collection, fallbackTitle, recommendedProducts} = useLoaderData();

  if (!collection) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            {label: 'Home', to: '/'},
            {label: 'Collections', to: '/collections'},
            {label: fallbackTitle},
          ]}
        />
        <div className="text-center py-10 mb-8 rounded-2xl bg-gray-50 border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {fallbackTitle}
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto mb-6">
            We&rsquo;re curating the best products for {fallbackTitle}. Check
            back soon!
          </p>
          <Link
            to="/collections/all"
            className="inline-block px-6 py-3 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-white font-semibold transition-colors"
          >
            Browse All Products
          </Link>
        </div>
        {recommendedProducts?.length ? (
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
              You might like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {recommendedProducts.slice(0, 4).map((product) => (
                <ProductItem key={product.id} product={product} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          {label: 'Home', to: '/'},
          {label: 'Collections', to: '/collections'},
          {label: collection.title},
        ]}
      />
      <h1 className="text-3xl font-bold mb-2 text-gray-900">{collection.title}</h1>
      {collection.description && (
        <p className="text-gray-600 mb-4 max-w-2xl">{collection.description}</p>
      )}
      <CollectionToolbar productCount={collection.products?.nodes?.length ?? 0} />
      <PaginatedResourceSection
        connection={collection.products}
        resourcesClassName="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
      >
        {({node: product, index}) => (
          <ProductItem
            key={product.id}
            product={product}
            loading={index < 8 ? 'eager' : undefined}
          />
        )}
      </PaginatedResourceSection>
      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
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
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        sortKey: $sortKey,
        reverse: $reverse
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
`;

const FALLBACK_PRODUCTS_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query FallbackCollectionProducts(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: BEST_SELLING) {
      nodes {
        ...ProductItem
      }
    }
  }
`;

/** @typedef {import('./+types/collections.$handle').Route} Route */
/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
