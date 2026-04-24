#!/usr/bin/env bash
# Shopify metafield CRUD via direct Admin GraphQL.
#
# Why this script exists:
#   The GeLi2001 shopify-mcp tool (mounted in .mcp.json) CAN write metafields
#   via its update-product tool, but its GraphQL response query hardcodes
#   metafields(first: 10). Products with >=10 pre-existing metafields (common
#   with Air Reviews / Junip / theme / custom apps installed) will have newly
#   written metafields truncated from the response, making it look like the
#   write failed. It didn't. But you also cannot verify via MCP, and there
#   is no delete-metafield tool exposed. Use this script for metafield CRUD.
#
# Auth:
#   Uses the same client_credentials OAuth flow the MCP uses. Reads
#   SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET from env. Token is fetched
#   fresh each run (24h TTL on Shopify side; we don't cache).
#
# Usage:
#   scripts/shopify-metafield.sh set    <owner-gid> <namespace> <key> <type> <value>
#   scripts/shopify-metafield.sh get    <owner-gid> <namespace> <key>
#   scripts/shopify-metafield.sh list   <owner-gid> [limit=50]
#   scripts/shopify-metafield.sh delete <owner-gid> <namespace> <key>
#
# Examples:
#   scripts/shopify-metafield.sh set \
#     gid://shopify/Product/7036883370117 \
#     custom tab_block_title_1 single_line_text_field "Description"
#
#   scripts/shopify-metafield.sh get \
#     gid://shopify/Product/7036883370117 custom tab_block_title_1
#
#   scripts/shopify-metafield.sh delete \
#     gid://shopify/Product/7036883370117 custom tab_block_title_1
#
# Types: single_line_text_field, multi_line_text_field, number_integer,
#        number_decimal, boolean, json, rich_text_field, date, date_time,
#        url, list.single_line_text_field, list.product_reference, etc.
#        See https://shopify.dev/docs/apps/build/custom-data/metafields/types

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

cmd="${1:-}"; shift || true
TOKEN=$(get_token)

case "$cmd" in
  set)
    owner="$1"; ns="$2"; key="$3"; type="$4"; value="$5"
    body=$(MF_OWNER="$owner" MF_NS="$ns" MF_KEY="$key" MF_TYPE="$type" MF_VALUE="$value" \
      python3 -c "
import json, os
print(json.dumps({
  'query': 'mutation Set(\$mf:[MetafieldsSetInput!]!){metafieldsSet(metafields:\$mf){metafields{id namespace key type value} userErrors{field message}}}',
  'variables': {'mf': [{
    'ownerId': os.environ['MF_OWNER'],
    'namespace': os.environ['MF_NS'],
    'key': os.environ['MF_KEY'],
    'type': os.environ['MF_TYPE'],
    'value': os.environ['MF_VALUE'],
  }]},
}))
")
    gql "$TOKEN" "$body" | python3 -m json.tool
    ;;
  get)
    owner="$1"; ns="$2"; key="$3"
    body=$(python3 -c "import json; print(json.dumps({'query': 'query(\$id:ID!){node(id:\$id){... on Product{metafield(namespace:\"${ns}\",key:\"${key}\"){id namespace key type value}} ... on ProductVariant{metafield(namespace:\"${ns}\",key:\"${key}\"){id namespace key type value}} ... on Customer{metafield(namespace:\"${ns}\",key:\"${key}\"){id namespace key type value}} ... on Collection{metafield(namespace:\"${ns}\",key:\"${key}\"){id namespace key type value}} ... on Order{metafield(namespace:\"${ns}\",key:\"${key}\"){id namespace key type value}}}}', 'variables': {'id': '${owner}'}}))")
    gql "$TOKEN" "$body" | python3 -m json.tool
    ;;
  list)
    owner="$1"; limit="${2:-50}"
    body=$(python3 -c "import json; print(json.dumps({'query': 'query(\$id:ID!){node(id:\$id){... on Product{metafields(first:${limit}){edges{node{id namespace key type value}}}} ... on ProductVariant{metafields(first:${limit}){edges{node{id namespace key type value}}}} ... on Customer{metafields(first:${limit}){edges{node{id namespace key type value}}}} ... on Collection{metafields(first:${limit}){edges{node{id namespace key type value}}}} ... on Order{metafields(first:${limit}){edges{node{id namespace key type value}}}}}}', 'variables': {'id': '${owner}'}}))")
    gql "$TOKEN" "$body" | python3 -m json.tool
    ;;
  delete)
    owner="$1"; ns="$2"; key="$3"
    body=$(python3 -c "import json; print(json.dumps({'query': 'mutation Del(\$mf:[MetafieldIdentifierInput!]!){metafieldsDelete(metafields:\$mf){deletedMetafields{key namespace ownerId} userErrors{field message}}}', 'variables': {'mf': [{'ownerId': '${owner}', 'namespace': '${ns}', 'key': '${key}'}]}}))")
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
