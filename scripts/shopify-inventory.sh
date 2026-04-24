#!/usr/bin/env bash
# Shopify inventory quantity CRUD via direct Admin GraphQL.
#
# Why this script exists:
#   The GeLi2001 shopify-mcp tool (mounted in .mcp.json) does NOT expose any
#   inventory-quantity mutation. `update-product` has no inventory field, and
#   `manage-product-variants` only exposes `tracked`/`sku`/`barcode`/`price` —
#   there is no way to adjust available stock. The `write_inventory` scope IS
#   granted to the custom app, so a direct Admin GraphQL helper works.
#
# Auth:
#   Uses the same client_credentials OAuth flow the MCP uses. Reads
#   SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET from env. Token is fetched
#   fresh each run (24h TTL on Shopify side; we don't cache).
#
# Usage:
#   scripts/shopify-inventory.sh locations
#   scripts/shopify-inventory.sh get    <variant-gid>
#   scripts/shopify-inventory.sh set    <variant-gid> <location-gid> <qty>
#   scripts/shopify-inventory.sh adjust <variant-gid> <location-gid> <delta>
#
# Examples:
#   scripts/shopify-inventory.sh locations
#
#   scripts/shopify-inventory.sh get \
#     gid://shopify/ProductVariant/40802235613317
#
#   scripts/shopify-inventory.sh set \
#     gid://shopify/ProductVariant/40802235613317 \
#     gid://shopify/Location/62474355013 101
#
#   scripts/shopify-inventory.sh adjust \
#     gid://shopify/ProductVariant/40802235613317 \
#     gid://shopify/Location/62474355013 -5
#
# Notes:
#   - `get` reports `available` quantity at every location that stocks the item.
#   - `set` uses inventorySetQuantities with `ignoreCompareQuantity: true` —
#     this bypasses the optimistic-locking guard and is appropriate for a
#     manual CLI. Don't adapt this pattern for concurrent automation.
#   - `adjust` uses inventoryAdjustQuantities — `delta` may be negative.
#   - Both mutations tag the change with `reason: "correction"` so it appears
#     in Shopify's inventory history as a manual correction, not a sale/restock.
#   - Variant GID → inventoryItem GID is resolved internally before the
#     mutation, so callers only deal with variant + location GIDs.
#
# ⚠️ Prereq: freshly-created inventory items must be activated at the target
# location before `set` or `adjust` will work. `productVariantsBulkCreate`
# creates the inventory item but does NOT stock it anywhere — set/adjust
# appear to succeed (no userErrors) but the level never materializes and
# subsequent reads show no inventory at that location. Activate first:
#
#   curl -fsS -X POST "https://$SHOP/admin/api/2026-01/graphql.json" \
#     -H "X-Shopify-Access-Token: $TOKEN" -H "Content-Type: application/json" \
#     -d '{"query":"mutation($i:ID!,$l:ID!){inventoryActivate(inventoryItemId:$i,locationId:$l){inventoryLevel{id} userErrors{field message}}}","variables":{"i":"gid://shopify/InventoryItem/...","l":"gid://shopify/Location/..."}}'
#
# Discovered during Phase 5 Himalayan consolidation (2026-04-25). Variants
# that already have inventoryLevels at the location (i.e. have ever been
# stocked there) don't need reactivation.
#
# Required scope: write_inventory (+ read_inventory + read_products to resolve
#   variant.inventoryItem.id).

set -euo pipefail

SHOP="${SHOPIFY_SHOP_DOMAIN:-shopyupp.myshopify.com}"
API_VERSION="${SHOPIFY_API_VERSION:-2026-01}"

: "${SHOPIFY_CLIENT_ID:?SHOPIFY_CLIENT_ID not set}"
: "${SHOPIFY_CLIENT_SECRET:?SHOPIFY_CLIENT_SECRET not set}"

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

# Resolve a ProductVariant GID to its InventoryItem GID.
resolve_inventory_item() {
  local token="$1" vgid="$2"
  local body
  body=$(INV_VGID="$vgid" python3 -c "
import json, os
print(json.dumps({
  'query': 'query(\$id:ID!){productVariant(id:\$id){inventoryItem{id}}}',
  'variables': {'id': os.environ['INV_VGID']},
}))
")
  gql "$token" "$body" | python3 -c "
import sys, json
d = json.load(sys.stdin)
v = (d.get('data') or {}).get('productVariant')
if not v:
    print('error: could not resolve variant', file=sys.stderr)
    print(json.dumps(d), file=sys.stderr)
    sys.exit(1)
print(v['inventoryItem']['id'])
"
}

cmd="${1:-}"; shift || true
TOKEN=$(get_token)

case "$cmd" in
  locations)
    # NOTE: every Location field beyond `id` (name, isActive, address, etc.)
    # requires `read_locations` scope, which the current custom app does not
    # grant (only read/write_inventory). We select id only. To see which
    # location a specific variant lives at — including location.id via the
    # inventory relationship (accessible via inventory scopes) — use:
    #   scripts/shopify-inventory.sh get <variant-gid>
    # Add `read_locations` in the Shopify Dev Dashboard if you want names.
    body='{"query":"query{locations(first:50){edges{node{id}}}}"}'
    gql "$TOKEN" "$body" | python3 -m json.tool
    ;;
  get)
    vgid="$1"
    # Same read_locations caveat — we only select location.id, not name.
    body=$(INV_VGID="$vgid" python3 -c "
import json, os
print(json.dumps({
  'query': 'query(\$id:ID!){productVariant(id:\$id){id title sku inventoryItem{id tracked inventoryLevels(first:20){edges{node{location{id} quantities(names:[\"available\",\"on_hand\",\"committed\"]){name quantity}}}}}}}',
  'variables': {'id': os.environ['INV_VGID']},
}))
")
    gql "$TOKEN" "$body" | python3 -m json.tool
    ;;
  set)
    vgid="$1"; loc="$2"; qty="$3"
    item=$(resolve_inventory_item "$TOKEN" "$vgid")
    body=$(INV_ITEM="$item" INV_LOC="$loc" INV_QTY="$qty" python3 -c "
import json, os
print(json.dumps({
  'query': 'mutation Set(\$input:InventorySetQuantitiesInput!){inventorySetQuantities(input:\$input){inventoryAdjustmentGroup{reason changes{name delta quantityAfterChange}} userErrors{field message code}}}',
  'variables': {'input': {
    'reason': 'correction',
    'name': 'available',
    'ignoreCompareQuantity': True,
    'quantities': [{
      'inventoryItemId': os.environ['INV_ITEM'],
      'locationId': os.environ['INV_LOC'],
      'quantity': int(os.environ['INV_QTY']),
    }],
  }},
}))
")
    gql "$TOKEN" "$body" | python3 -m json.tool
    ;;
  adjust)
    vgid="$1"; loc="$2"; delta="$3"
    item=$(resolve_inventory_item "$TOKEN" "$vgid")
    body=$(INV_ITEM="$item" INV_LOC="$loc" INV_DELTA="$delta" python3 -c "
import json, os
print(json.dumps({
  'query': 'mutation Adj(\$input:InventoryAdjustQuantitiesInput!){inventoryAdjustQuantities(input:\$input){inventoryAdjustmentGroup{reason changes{name delta quantityAfterChange}} userErrors{field message code}}}',
  'variables': {'input': {
    'reason': 'correction',
    'name': 'available',
    'changes': [{
      'inventoryItemId': os.environ['INV_ITEM'],
      'locationId': os.environ['INV_LOC'],
      'delta': int(os.environ['INV_DELTA']),
    }],
  }},
}))
")
    gql "$TOKEN" "$body" | python3 -m json.tool
    ;;
  ""|-h|--help|help)
    sed -n '2,/^set -e/p' "$0" | sed 's/^# \{0,1\}//' | sed '$d'
    ;;
  *)
    echo "unknown command: $cmd" >&2
    echo "run: $0 help" >&2
    exit 2
    ;;
esac
