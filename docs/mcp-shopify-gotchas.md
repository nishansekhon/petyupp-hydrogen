# Shopify Admin MCP — Gotchas & Usage Notes

## What's installed

- **Package:** [`shopify-mcp`](https://github.com/GeLi2001/shopify-mcp) (GeLi2001's implementation), pulled fresh via `npx -y shopify-mcp` per `.mcp.json` at repo root.
- **Auth:** client_credentials OAuth. Reads `SHOPIFY_CLIENT_ID` / `SHOPIFY_CLIENT_SECRET` from env (interpolated into `.mcp.json` args as `${VAR}`).
- **Token lifetime:** ~24h (`expires_in ≈ 86400s`). The MCP server auto-refreshes 5 minutes before expiry — no manual token management.
- **Shop:** `shopyupp.myshopify.com`.
- **Tools surfaced (14):** `get-products`, `get-product-by-id`, `create-product`, `update-product`, `delete-product`, `manage-product-variants`, `delete-product-variants`, `manage-product-options`, `get-customers`, `get-customer-orders`, `update-customer`, `get-orders`, `get-order-by-id`, `update-order`.

## Gotchas

### 1. `update-product` truncates metafields in its response (writes DO persist)

`update-product` accepts a `metafields[]` array and correctly forwards it into Shopify's `productUpdate` mutation — metafields are persisted server-side. **But** the tool's response GraphQL selects `metafields(first: 10)`. Any product with ≥10 pre-existing metafields (typical once Air Reviews / Junip / theme / custom apps are installed) will have newly written metafields truncated from the returned payload.

**Never trust the `update-product` response to confirm a metafield write.** The absence of your metafield in the response does NOT mean the write failed.

Verified on 2026-04-24 against `water-buffalo-tendon-dog-chews-7-oz` (gid `7036883370117`): wrote `mcp_test/install_check = mcp_ok_2026-04-24`, it was absent from update-product response, was present on direct GraphQL query as `gid://shopify/Metafield/31284273840261`.

### 2. No dedicated metafield tools

GeLi2001's MCP (as of `1.0.8`) does **not** expose `get-metafields`, `set-metafield`, or `delete-metafield` as standalone tools. The only write path is piggybacking on `update-product`. There is no delete path at all.

### 3. Other mutations return correct payloads

`update-product` metafield truncation is specific to the product's `metafields` field selection. Tags / status / title / SEO / collection moves all round-trip correctly in the response.

## Patterns

### Metafield CRUD → use the helper script

Use `scripts/shopify-metafield.sh` for anything metafield-related. It uses the same client_credentials auth as the MCP and hits Admin GraphQL directly.

```bash
# Write
scripts/shopify-metafield.sh set gid://shopify/Product/7036883370117 \
  custom my_key single_line_text_field "some value"

# Read one
scripts/shopify-metafield.sh get gid://shopify/Product/7036883370117 custom my_key

# List all (up to 50)
scripts/shopify-metafield.sh list gid://shopify/Product/7036883370117

# Delete
scripts/shopify-metafield.sh delete gid://shopify/Product/7036883370117 custom my_key
```

### Everything else → use the MCP

For product creation/updates (non-metafield fields), variant/option management, orders, customers, and product deletion, the MCP tools return accurate payloads and should be preferred.

## When to use MCP vs the script

| Operation | Use |
|---|---|
| List/search products, orders, customers | MCP |
| Get product by ID (non-metafield fields) | MCP |
| Update product title / status / tags / SEO / collections | MCP |
| Create / delete product | MCP |
| Manage variants / options | MCP |
| Update customer / order | MCP |
| **Any metafield read** | script |
| **Any metafield write** (even if via update-product) | script (write via MCP is invisible; script round-trips) |
| **Any metafield delete** | script (MCP has no delete tool) |

## Verifying a metafield write after the fact

If you already wrote via the MCP's `update-product` and want to confirm it persisted:

```bash
scripts/shopify-metafield.sh get <owner-gid> <namespace> <key>
# null means not written; object with id+value means written
```
