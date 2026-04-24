#!/usr/bin/env bash
# Shopify URL redirect CRUD via direct Admin GraphQL.
#
# Why this script exists:
#   The GeLi2001 shopify-mcp tool (mounted in .mcp.json) does NOT expose any
#   urlRedirect* tools. Its only redirect-adjacent feature is the
#   `redirectNewHandle` flag on update-product, which only auto-creates a
#   redirect when a product's own handle changes. For Phase 5 catalog
#   consolidation we need to create redirects from deleted/merged-away handles
#   to the new parent handles — a free-form many→one mapping the MCP can't
#   express. Use this script for urlRedirect CRUD.
#
# Auth:
#   Uses the same client_credentials OAuth flow the MCP uses. Reads
#   SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET from env. Token is fetched
#   fresh each run (24h TTL on Shopify side; we don't cache).
#
# Usage:
#   scripts/shopify-redirect.sh create <from-path> <to-target>
#   scripts/shopify-redirect.sh list   [limit=50]
#   scripts/shopify-redirect.sh delete <redirect-gid>
#   scripts/shopify-redirect.sh get    <from-path>
#
# Examples:
#   scripts/shopify-redirect.sh create \
#     /products/himalayan-cheese-small /products/himalayan-cheese
#
#   scripts/shopify-redirect.sh get /products/himalayan-cheese-small
#
#   scripts/shopify-redirect.sh list 100
#
#   scripts/shopify-redirect.sh delete gid://shopify/UrlRedirect/123456789
#
# Path format:
#   <from-path> must start with a leading slash (Shopify requirement).
#   <to-target> is either a same-store relative path (e.g. /products/xyz)
#   or a full external URL (https://...). Same-store paths are recommended
#   for catalog consolidation.
#
# Required scope: write_content (+ read_content to list/get).
#   Verify via: query { currentAppInstallation { accessScopes { handle } } }

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
  create)
    from="$1"; to="$2"
    body=$(RD_FROM="$from" RD_TO="$to" python3 -c "
import json, os
print(json.dumps({
  'query': 'mutation Create(\$r:UrlRedirectInput!){urlRedirectCreate(urlRedirect:\$r){urlRedirect{id path target} userErrors{field message}}}',
  'variables': {'r': {
    'path': os.environ['RD_FROM'],
    'target': os.environ['RD_TO'],
  }},
}))
")
    gql "$TOKEN" "$body" | python3 -m json.tool
    ;;
  list)
    limit="${1:-50}"
    body=$(python3 -c "import json; print(json.dumps({'query': 'query{urlRedirects(first:${limit}){edges{node{id path target}} pageInfo{hasNextPage endCursor}}}'}))")
    gql "$TOKEN" "$body" | python3 -m json.tool
    echo "# Note: pagination not yet implemented. If hasNextPage=true, raise limit or add cursor support." >&2
    ;;
  delete)
    gid="$1"
    body=$(RD_GID="$gid" python3 -c "
import json, os
print(json.dumps({
  'query': 'mutation Del(\$id:ID!){urlRedirectDelete(id:\$id){deletedUrlRedirectId userErrors{field message}}}',
  'variables': {'id': os.environ['RD_GID']},
}))
")
    gql "$TOKEN" "$body" | python3 -m json.tool
    ;;
  get)
    from="$1"
    body=$(RD_FROM="$from" python3 -c "
import json, os
print(json.dumps({
  'query': 'query(\$q:String!){urlRedirects(first:5,query:\$q){edges{node{id path target}}}}',
  'variables': {'q': 'path:' + os.environ['RD_FROM']},
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
