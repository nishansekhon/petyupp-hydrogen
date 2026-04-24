/**
 * Resource route: fetches minimal product data for the inline quick-add
 * CTA in the video modal. Consumed via useFetcher from VideoModal.
 *
 *   GET /api/product-for-modal?handle=<product-handle>
 *     → 200 { product: { id, title, priceRange, variants { nodes } } }
 *     → 400 { error: "Missing handle" }
 *     → 404 { error: "Product not found" }
 *     → 500 { error: "..." }
 */

const PRODUCT_FOR_MODAL_QUERY = `#graphql
  query ProductForModal($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      featuredImage {
        url
        altText
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      variants(first: 10) {
        nodes {
          id
          title
          availableForSale
          price {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

export async function loader({request, context}) {
  const url = new URL(request.url);
  const handle = url.searchParams.get('handle');
  if (!handle) {
    return json({error: 'Missing handle'}, {status: 400});
  }

  try {
    const {product} = await context.storefront.query(
      PRODUCT_FOR_MODAL_QUERY,
      {
        variables: {handle},
        cache: context.storefront.CacheLong(),
      },
    );
    if (!product) {
      return json({error: 'Product not found'}, {status: 404});
    }
    return json({product});
  } catch (err) {
    return json(
      {error: err?.message || 'Failed to load product'},
      {status: 500},
    );
  }
}
