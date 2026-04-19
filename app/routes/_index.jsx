import {useLoaderData} from 'react-router';
import HomePage from '../pages/HomePage';
import {createSeoMeta, SITE_URL} from '~/lib/seo';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return createSeoMeta({
    title:
      'PetYupp | Natural Dog Chews & Treats – Happier Dogs Start Here',
    description:
      "Premium natural dog chews, treats & supplies matched to your dog's exact need. Vet approved. Free shipping on orders $49+. Shop by problem or product.",
    url: SITE_URL,
  });
};

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader(args) {
  const criticalData = await loadCriticalData(args);
  return {...criticalData};
}

/**
 * @param {Route.LoaderArgs}
 */
async function loadCriticalData({context}) {
  const [productsResult, collectionsResult] = await Promise.all([
    context.storefront.query(HOMEPAGE_PRODUCTS_QUERY),
    context.storefront.query(HOMEPAGE_COLLECTIONS_QUERY),
  ]);

  return {
    products: productsResult?.products?.nodes ?? [],
    collections: collectionsResult?.collections?.nodes ?? [],
  };
}

const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PetYupp',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  sameAs: [
    'https://instagram.com/petyupp',
    'https://www.tiktok.com/@petyupp',
    'https://www.youtube.com/@petyupp',
  ],
};

export default function Homepage() {
  /** @type {LoaderReturnData} */
  const {products, collections} = useLoaderData();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(ORGANIZATION_JSON_LD)}}
      />
      <HomePage products={products} collections={collections} />
    </>
  );
}

const HOMEPAGE_PRODUCTS_QUERY = `#graphql
  fragment HomepageProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 4) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
  }
  query HomepageProducts($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 8, sortKey: BEST_SELLING) {
      nodes {
        ...HomepageProduct
      }
    }
  }
`;

const HOMEPAGE_COLLECTIONS_QUERY = `#graphql
  fragment HomepageCollectionProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 1) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
  }
  fragment HomepageCollection on Collection {
    id
    title
    handle
    image {
      id
      url
      altText
      width
      height
    }
    products(first: 4) {
      nodes {
        ...HomepageCollectionProduct
      }
    }
  }
  query HomepageCollections($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 50) {
      nodes {
        ...HomepageCollection
      }
    }
  }
`;

/** @typedef {import('./+types/_index').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
