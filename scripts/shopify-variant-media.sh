#!/usr/bin/env bash
# Shopify variant-level media attach via direct Admin GraphQL.
#
# Why this script exists:
#   The GeLi2001 shopify-mcp tool does not surface productVariantAppendMedia
#   (or productCreateMedia). Variant-specific imagery — e.g. a flavor-specific
#   pack photo on himalayan-flavored-variety — requires those mutations to
#   break a variant out of inheriting the product's primary image. So we hit
#   the Admin GraphQL directly here.
#
# Workflow:
#   1. Resolve product GID from the variant GID (one query).
#   2. productCreateMedia → upload remote URL onto the product. Returns a
#      Media GID. Shopify processes the image asynchronously; we poll status
#      until it leaves PROCESSING (READY or FAILED) before appending.
#   3. productVariantAppendMedia → associate the new media GID with the
#      variant. After this the variant's primary image is the new media.
#
# Auth:
#   Same client_credentials OAuth flow as scripts/shopify-metafield.sh.
#   Reads SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET from env. Token fetched
#   fresh per run.
#
# Usage:
#   scripts/shopify-variant-media.sh \
#     --variant-id gid://shopify/ProductVariant/123 \
#     --media-url  https://res.cloudinary.com/.../foo.webp \
#     --alt-text   "Honey Cheese Chew 3.5oz pack"
#
# Output: prints JSON for each step (resolve, create, append) to stdout for
#   easy debugging. Exits non-zero on any userErrors or non-2xx HTTP.

set -euo pipefail

SHOP="${SHOPIFY_SHOP_DOMAIN:-shopyupp.myshopify.com}"
API_VERSION="${SHOPIFY_API_VERSION:-2026-01}"

: "${SHOPIFY_CLIENT_ID:?SHOPIFY_CLIENT_ID not set}"
: "${SHOPIFY_CLIENT_SECRET:?SHOPIFY_CLIENT_SECRET not set}"

VARIANT_ID=""
MEDIA_URL=""
ALT_TEXT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --variant-id) VARIANT_ID="$2"; shift 2 ;;
    --media-url)  MEDIA_URL="$2";  shift 2 ;;
    --alt-text)   ALT_TEXT="$2";   shift 2 ;;
    -h|--help)
      sed -n '2,/^set -euo/p' "$0" | sed 's/^# \{0,1\}//' | sed '$d'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$VARIANT_ID" && -n "$MEDIA_URL" && -n "$ALT_TEXT" ]] || {
  echo "missing required args; need --variant-id --media-url --alt-text" >&2
  exit 2
}

get_token() {
  curl -fsS -X POST "https://${SHOP}/admin/oauth/access_token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=client_credentials&client_id=${SHOPIFY_CLIENT_ID}&client_secret=${SHOPIFY_CLIENT_SECRET}" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])"
}

gql() {
  local token="$1" body="$2"
  curl -fsS -X POST "https://${SHOP}/admin/api/${API_VERSION}/graphql.json" \
    -H "X-Shopify-Access-Token: ${token}" \
    -H "Content-Type: application/json" \
    -d "${body}"
}

TOKEN=$(get_token)

# Step 1 — resolve product GID from variant GID.
echo "==> resolve product from variant: ${VARIANT_ID}"
RESOLVE_BODY=$(VG_ID="$VARIANT_ID" python3 -c "
import json, os
print(json.dumps({
  'query': 'query(\$id:ID!){node(id:\$id){... on ProductVariant{id product{id}}}}',
  'variables': {'id': os.environ['VG_ID']},
}))
")
RESOLVE_RES=$(gql "$TOKEN" "$RESOLVE_BODY")
echo "$RESOLVE_RES" | python3 -m json.tool

PRODUCT_ID=$(echo "$RESOLVE_RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
node = (d.get('data') or {}).get('node') or {}
prod = node.get('product') or {}
pid = prod.get('id')
if not pid:
    sys.stderr.write('failed to resolve product from variant\n')
    sys.exit(1)
print(pid)
")
echo "==> product: ${PRODUCT_ID}"

# Step 2 — productCreateMedia (uploads remote URL onto product).
echo "==> productCreateMedia url=${MEDIA_URL}"
CREATE_BODY=$(P_ID="$PRODUCT_ID" M_URL="$MEDIA_URL" M_ALT="$ALT_TEXT" python3 -c "
import json, os
print(json.dumps({
  'query': '''mutation Create(\$pid:ID!, \$media:[CreateMediaInput!]!){
    productCreateMedia(productId:\$pid, media:\$media){
      media{ ... on MediaImage { id status alt image{ url } } }
      mediaUserErrors{ field message code }
      product{ id }
    }
  }''',
  'variables': {
    'pid': os.environ['P_ID'],
    'media': [{
      'originalSource': os.environ['M_URL'],
      'alt': os.environ['M_ALT'],
      'mediaContentType': 'IMAGE',
    }],
  },
}))
")
CREATE_RES=$(gql "$TOKEN" "$CREATE_BODY")
echo "$CREATE_RES" | python3 -m json.tool

MEDIA_ID=$(echo "$CREATE_RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
pm = ((d.get('data') or {}).get('productCreateMedia') or {})
errs = pm.get('mediaUserErrors') or []
if errs:
    sys.stderr.write('mediaUserErrors: ' + json.dumps(errs) + '\n')
    sys.exit(1)
m = (pm.get('media') or [])
if not m or not m[0].get('id'):
    sys.stderr.write('no media id returned\n')
    sys.exit(1)
print(m[0]['id'])
")
echo "==> media: ${MEDIA_ID}"

# Poll media status until it leaves PROCESSING. Cap ~30s.
for i in 1 2 3 4 5 6 7 8 9 10; do
  STATUS_BODY=$(M_ID="$MEDIA_ID" python3 -c "
import json, os
print(json.dumps({
  'query': 'query(\$id:ID!){node(id:\$id){... on MediaImage{id status alt image{url}}}}',
  'variables': {'id': os.environ['M_ID']},
}))
")
  STATUS_RES=$(gql "$TOKEN" "$STATUS_BODY")
  STATUS=$(echo "$STATUS_RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
n = (d.get('data') or {}).get('node') or {}
print(n.get('status') or 'UNKNOWN')
")
  echo "   media status (attempt ${i}): ${STATUS}"
  case "$STATUS" in
    READY) break ;;
    FAILED)
      echo "media FAILED — aborting" >&2
      echo "$STATUS_RES" | python3 -m json.tool >&2
      exit 1
      ;;
    *) sleep 3 ;;
  esac
done

# Step 3 — productVariantAppendMedia.
echo "==> productVariantAppendMedia variant=${VARIANT_ID} media=${MEDIA_ID}"
APPEND_BODY=$(P_ID="$PRODUCT_ID" V_ID="$VARIANT_ID" M_ID="$MEDIA_ID" python3 -c "
import json, os
print(json.dumps({
  'query': '''mutation Append(\$pid:ID!, \$variantMedia:[ProductVariantAppendMediaInput!]!){
    productVariantAppendMedia(productId:\$pid, variantMedia:\$variantMedia){
      productVariants{ id media(first:10){ edges{ node{ ... on MediaImage{ id alt image{ url } } } } } }
      userErrors{ field message code }
    }
  }''',
  'variables': {
    'pid': os.environ['P_ID'],
    'variantMedia': [{
      'variantId': os.environ['V_ID'],
      'mediaIds': [os.environ['M_ID']],
    }],
  },
}))
")
APPEND_RES=$(gql "$TOKEN" "$APPEND_BODY")
echo "$APPEND_RES" | python3 -m json.tool

echo "$APPEND_RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
pa = (d.get('data') or {}).get('productVariantAppendMedia') or {}
errs = pa.get('userErrors') or []
if errs:
    sys.stderr.write('userErrors: ' + json.dumps(errs) + '\n')
    sys.exit(1)
print('OK')
"
