# Shopify Admin MCP — Gotchas & Usage Notes

## What's installed

- **Package:** [`shopify-mcp`](https://github.com/GeLi2001/shopify-mcp) (GeLi2001's implementation), pulled fresh via `npx -y shopify-mcp` per `.mcp.json` at repo root.
- **Auth:** client_credentials OAuth. Reads `SHOPIFY_CLIENT_ID` / `SHOPIFY_CLIENT_SECRET` from env (interpolated into `.mcp.json` args as `${VAR}`).
- **Token lifetime:** ~24h (`expires_in ≈ 86400s`). The MCP server auto-refreshes 5 minutes before expiry — no manual token management.
- **Shop:** `shopyupp.myshopify.com`.
- **Granted Admin API scopes:** `read_products`, `write_products`, `read_inventory`, `write_inventory`, `read_files`, `write_files`, `read_content`, `write_content`. (Query `currentAppInstallation { accessScopes { handle } }` to verify.)

### The 14 MCP tools

| Tool | Purpose |
|---|---|
| `get-products` | List/search products (`limit`, `searchTitle`) |
| `get-product-by-id` | Full product detail by GID |
| `create-product` | New product with options + metafields (no inventory) |
| `update-product` | Update fields/metafields/status/tags/SEO/collections/handle |
| `delete-product` | Delete product |
| `manage-product-variants` | Create/update variants (price, SKU, options, tracked — **no quantity**) |
| `delete-product-variants` | Delete variants |
| `manage-product-options` | Create/update/delete product options |
| `get-customers` | List customers |
| `get-customer-orders` | Orders for a customer |
| `update-customer` | Update customer fields |
| `get-orders` | List orders |
| `get-order-by-id` | Full order detail |
| `update-order` | Update order fields |

What's notably **absent**: any `urlRedirect*` tool, any inventory-quantity mutation, any metafield-only tool, any fulfillment / draft-order / discount tool.

## Gotchas

### 1. `update-product` truncates metafields in its response (writes DO persist)

`update-product` accepts a `metafields[]` array and correctly forwards it into Shopify's `productUpdate` mutation — metafields are persisted server-side. **But** the tool's response GraphQL selects `metafields(first: 10)`. Any product with ≥10 pre-existing metafields (typical once Air Reviews / Junip / theme / custom apps are installed) will have newly written metafields truncated from the returned payload.

**Never trust the `update-product` response to confirm a metafield write.** The absence of your metafield in the response does NOT mean the write failed.

Verified on 2026-04-24 against `water-buffalo-tendon-dog-chews-7-oz` (gid `7036883370117`): wrote `mcp_test/install_check = mcp_ok_2026-04-24`, it was absent from update-product response, was present on direct GraphQL query as `gid://shopify/Metafield/31284273840261`.

### 2. No dedicated metafield tools

GeLi2001's MCP (as of `1.0.8`) does **not** expose `get-metafields`, `set-metafield`, or `delete-metafield` as standalone tools. The only write path is piggybacking on `update-product`. There is no delete path at all.

### 3. Other mutations return correct payloads

`update-product` metafield truncation is specific to the product's `metafields` field selection. Tags / status / title / SEO / collection moves all round-trip correctly in the response.

### 4. No URL-redirect tooling in MCP

The MCP does not expose any `urlRedirect*` tool. `update-product` has a `redirectNewHandle` flag, but that only auto-creates a redirect when a product's own handle changes — it cannot create free-form many→one redirects needed for catalog consolidation (old deleted handles → new parent handles). Use `scripts/shopify-redirect.sh`.

**⚠️ Scope anomaly (unresolved as of 2026-04-24):** The `write_content` scope IS granted to this custom app (verified via `currentAppInstallation.accessScopes`), yet the `urlRedirects` query field and `urlRedirectCreate` mutation return `ACCESS_DENIED` across API versions 2024-10 → 2026-01. This blocks both the MCP's `redirectNewHandle` flag and the helper script. Likely resolution paths (not yet attempted): re-install the custom app in Shopify admin to re-apply scopes, or contact Shopify support about client_credentials OAuth apps and Online Store content objects. Until resolved, redirects for Phase 5 consolidation must be created manually in Shopify admin → Online Store → Navigation → URL Redirects.

### 5. No inventory-quantity mutation path in MCP

Verified by schema inspection 2026-04-24: neither `update-product` (no inventory field) nor `manage-product-variants` (only `tracked`/`sku`/`barcode`/`price` — no `inventoryQuantity`) can adjust stock levels. The `read_inventory`/`write_inventory` scopes are granted, so a direct Admin GraphQL helper (`inventoryAdjustQuantities` / `inventorySetQuantities`) would work — it just isn't surfaced through MCP. A `scripts/shopify-inventory.sh` helper is needed if Phase 5 requires stock manipulation; none exists yet.

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
| Manage variants / options (price, SKU, tracked — NOT quantity) | MCP |
| Update customer / order | MCP |
| **Any metafield read** | `scripts/shopify-metafield.sh` |
| **Any metafield write** (even if via update-product) | `scripts/shopify-metafield.sh` (write via MCP is invisible; script round-trips) |
| **Any metafield delete** | `scripts/shopify-metafield.sh` (MCP has no delete tool) |
| **URL redirect create/list/delete/get** | `scripts/shopify-redirect.sh` (MCP has no urlRedirect tool — see scope anomaly in §4) |
| **Inventory quantity adjustments** | ⚠️ no helper yet — MCP doesn't expose it; write a `scripts/shopify-inventory.sh` using `inventoryAdjustQuantities` when needed |

## Verifying a metafield write after the fact

If you already wrote via the MCP's `update-product` and want to confirm it persisted:

```bash
scripts/shopify-metafield.sh get <owner-gid> <namespace> <key>
# null means not written; object with id+value means written
```
