import {
  AI_ADVISOR_SYSTEM_PROMPT,
  AI_ADVISOR_MODEL,
  AI_ADVISOR_MAX_TOKENS,
  AI_ADVISOR_MAX_HISTORY,
  AI_ADVISOR_MAX_MESSAGE_CHARS,
} from '~/lib/aiAdvisorPrompt';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const CATALOG_LIMIT = 250;
const MAX_RECOMMENDATIONS = 4;

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return null;
  if (raw.length === 0) return null;
  if (raw.length > AI_ADVISOR_MAX_HISTORY) {
    raw = raw.slice(-AI_ADVISOR_MAX_HISTORY);
  }
  const cleaned = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') return null;
    const {role, content} = entry;
    if (role !== 'user' && role !== 'assistant') return null;
    if (typeof content !== 'string') return null;
    const trimmed = content.trim();
    if (!trimmed) return null;
    cleaned.push({role, content: trimmed.slice(0, AI_ADVISOR_MAX_MESSAGE_CHARS)});
  }
  if (cleaned[0].role !== 'user') return null;
  return cleaned;
}

function extractText(payload) {
  const blocks = payload?.content;
  if (!Array.isArray(blocks)) return '';
  return blocks
    .filter((b) => b?.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

function parseAssistantJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {}
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }
  return null;
}

function formatCatalog(entries) {
  if (!entries?.length) return '';
  const lines = entries
    .map((p) => {
      const type = p?.productType ? ` [${p.productType}]` : '';
      const tags = Array.isArray(p?.tags) && p.tags.length
        ? ` {tags: ${p.tags.join(', ')}}`
        : '';
      return `- ${p.handle}: ${p.title}${type}${tags}`;
    })
    .join('\n');
  return `\n\nPRODUCT CATALOG (use these exact handles; do not invent new ones):\n${lines}`;
}

/**
 * @param {import('react-router').ActionFunctionArgs} args
 */
export async function action({request, context}) {
  if (request.method !== 'POST') {
    return json({error: 'Method not allowed'}, {status: 405});
  }

  const apiKey = context?.env?.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(
      {
        error:
          'AI advisor not configured. Set ANTHROPIC_API_KEY in the Oxygen environment.',
      },
      {status: 503},
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({error: 'Invalid JSON body'}, {status: 400});
  }

  const messages = sanitizeMessages(body?.messages);
  if (!messages) {
    return json(
      {error: 'messages must be a non-empty alternating user/assistant array'},
      {status: 400},
    );
  }

  // 1) Fetch the catalog so we can list real handles in the system prompt.
  let catalogEntries = [];
  try {
    const result = await context.storefront.query(PRODUCT_CATALOG_QUERY, {
      cache: context.storefront.CacheLong(),
    });
    catalogEntries = result?.products?.nodes ?? [];
  } catch (error) {
    console.error('AI advisor catalog fetch failed:', error);
  }

  const validHandles = new Set(catalogEntries.map((p) => p.handle));
  const systemText = AI_ADVISOR_SYSTEM_PROMPT + formatCatalog(catalogEntries);

  // 2) Call Anthropic.
  let upstream;
  try {
    upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: AI_ADVISOR_MODEL,
        max_tokens: AI_ADVISOR_MAX_TOKENS,
        system: [
          {
            type: 'text',
            text: systemText,
            // Catalog push combined with the base prompt is now >2048 tokens
            // on Sonnet 4.6, so this breakpoint will actually cache on the
            // second and subsequent requests (same catalog bytes).
            cache_control: {type: 'ephemeral'},
          },
        ],
        messages,
      }),
    });
  } catch (error) {
    console.error('AI advisor upstream fetch failed:', error);
    return json({error: 'Advisor is unreachable right now.'}, {status: 502});
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '');
    console.error(
      'AI advisor upstream error:',
      upstream.status,
      detail.slice(0, 500),
    );
    const status = upstream.status === 429 ? 429 : 502;
    return json(
      {
        error:
          upstream.status === 429
            ? 'Advisor is busy — try again in a moment.'
            : 'Advisor is taking a break.',
      },
      {status},
    );
  }

  const payload = await upstream.json().catch(() => null);
  const text = extractText(payload);
  const parsed = parseAssistantJson(text);

  // 3) Validate recommended handles against the catalog and fetch product
  //    details in parallel.
  const rawRecs = Array.isArray(parsed?.products) ? parsed.products : [];
  const picked = [];
  const seen = new Set();
  for (const rec of rawRecs) {
    const handle = typeof rec?.handle === 'string' ? rec.handle.trim() : '';
    if (!handle || seen.has(handle)) continue;
    if (validHandles.size > 0 && !validHandles.has(handle)) continue;
    seen.add(handle);
    picked.push({
      handle,
      reason: typeof rec?.reason === 'string' ? rec.reason.trim() : '',
    });
    if (picked.length >= MAX_RECOMMENDATIONS) break;
  }

  const productDetails = await Promise.all(
    picked.map((rec) =>
      context.storefront
        .query(PRODUCT_BY_HANDLE_QUERY, {
          variables: {handle: rec.handle},
          cache: context.storefront.CacheLong(),
        })
        .then((r) => r?.product ?? null)
        .catch((error) => {
          console.error(
            'AI advisor product fetch failed:',
            rec.handle,
            error,
          );
          return null;
        }),
    ),
  );

  const enrichedProducts = picked
    .map((rec, i) => {
      const product = productDetails[i];
      if (!product) return null;
      const fallbackImage = product.images?.nodes?.[0] ?? null;
      return {
        handle: product.handle,
        title: product.title,
        url: `/products/${product.handle}`,
        image: product.featuredImage ?? fallbackImage,
        price: product.priceRange?.minVariantPrice ?? null,
        variantId: product.selectedOrFirstAvailableVariant?.id ?? null,
        available:
          product.selectedOrFirstAvailableVariant?.availableForSale ?? false,
        reason: rec.reason,
      };
    })
    .filter(Boolean);

  return json({
    intro: typeof parsed?.intro === 'string' ? parsed.intro.trim() : '',
    products: enrichedProducts,
    raw: text,
    usage: payload?.usage ?? null,
  });
}

// Resource route — no UI on GET.
export function loader() {
  return new Response('Not found', {status: 404});
}

const PRODUCT_CATALOG_QUERY = `#graphql
  query AIAdvisorCatalog(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: ${CATALOG_LIMIT}, sortKey: TITLE) {
      nodes {
        handle
        title
        productType
        tags
      }
    }
  }
`;

const PRODUCT_BY_HANDLE_QUERY = `#graphql
  query AIAdvisorProduct(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      handle
      title
      featuredImage {
        id
        url
        altText
        width
        height
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
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      selectedOrFirstAvailableVariant(
        selectedOptions: []
        ignoreUnknownOptions: true
        caseInsensitiveMatch: true
      ) {
        id
        availableForSale
      }
    }
  }
`;
