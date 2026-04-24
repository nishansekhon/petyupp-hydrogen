# Shopify Admin MCP — Gotchas & Usage Notes

## What's installed

- **Package:** [`shopify-mcp`](https://github.com/GeLi2001/shopify-mcp) (GeLi2001's implementation), pulled fresh via `npx -y shopify-mcp` per `.mcp.json` at repo root.
- **Auth:** client_credentials OAuth. Reads `SHOPIFY_CLIENT_ID` / `SHOPIFY_CLIENT_SECRET` from env (interpolated into `.mcp.json` args as `${VAR}`).
- **Token lifetime:** ~24h (`expires_in ≈ 86400s`). The MCP server auto-refreshes 5 minutes before expiry — no manual token management.
- **Shop:** `shopyupp.myshopify.com`.
- **Granted Admin API scopes:** `read_products`, `write_products`, `read_inventory`, `write_inventory`, `read_files`, `write_files`, `read_content`, `write_content`, `read_online_store_navigation`, `write_online_store_navigation`. (Query `currentAppInstallation { accessScopes { handle } }` to verify.) Notably NOT granted: `read_locations` — needed only for location *names*; the id is accessible via inventory relationships.

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

**Scope gotcha — `urlRedirects` needs its own scope:** Despite the Shopify admin UI grouping URL redirects under "Online Store pages" (which suggests `read_content`/`write_content`), the GraphQL API gates `urlRedirects` / `urlRedirectCreate` / `urlRedirectDelete` behind **`read_online_store_navigation` / `write_online_store_navigation`**. Granting only `write_content` yields `ACCESS_DENIED` with no hint at the mutation layer. See the Shopify access-scope reference: https://shopify.dev/docs/api/usage/access-scopes. First discovered 2026-04-24 when the helper was initially blocked; resolved by adding `read_online_store_navigation` + `write_online_store_navigation` to the custom app's manifest and re-releasing in the Dev Dashboard.

**Scope expansion — Update prompt vs reinstall:** When you add a new scope to a custom app that's already installed, Shopify presents an "Update" approval prompt to the shop owner (Apps → the app → accept new permissions). You do NOT need to uninstall and reinstall — accepting the Update prompt re-grants the scope set. A fresh OAuth token must be fetched afterwards (old client_credentials tokens cache the old scope set; on the MCP side the server auto-refreshes within ~5 min of expiry, or restart the MCP if you need it sooner).

### 5. No inventory-quantity mutation path in MCP

Verified by schema inspection 2026-04-24: neither `update-product` (no inventory field) nor `manage-product-variants` (only `tracked`/`sku`/`barcode`/`price` — no `inventoryQuantity`) can adjust stock levels. The `read_inventory`/`write_inventory` scopes are granted, so a direct Admin GraphQL helper works. Use `scripts/shopify-inventory.sh` — commands: `locations`, `get`, `set`, `adjust`. Smoke-tested 2026-04-25 end-to-end (read → set → read-back → adjust → restore) on `cotton-jute-toss-tug-dog-toy-with-genuine-leather-moose`.

**Scope gotcha — `locations` top-level field needs `read_locations`:** The scopes currently granted let you read location GIDs *through* inventory relationships (e.g. `productVariant.inventoryItem.inventoryLevels.edges.node.location.id`) but NOT through the top-level `locations(first: N)` query for anything beyond `id`. Location `name`, `isActive`, `address`, etc. all require `read_locations`. The helper's `locations` command is therefore id-only. To get a readable location list, either expand scopes or call `shopify-inventory.sh get <variant-gid>` on any variant to see the location GIDs it stocks at.

**⚠️ Prereq gotcha — freshly-created inventory items must be activated at a location before `set`/`adjust` works.** `productVariantsBulkCreate` creates the inventory item but doesn't stock it anywhere. `inventorySetQuantities` / `inventoryAdjustQuantities` then return *no userErrors* (which looks like success) but the inventoryLevel never materializes and subsequent reads show no stock at that location. Call `inventoryActivate(inventoryItemId, locationId)` first:

```graphql
mutation($i:ID!,$l:ID!){
  inventoryActivate(inventoryItemId:$i, locationId:$l){
    inventoryLevel{ id }
    userErrors{ field message }
  }
}
```

Variants that already have inventoryLevels at the location (i.e. have ever been stocked there) don't need reactivation. Discovered during the Phase 5 Himalayan consolidation when 14 freshly-bulk-created variants showed empty reads after an apparently-successful `set` cycle.

### 6. `Product.totalInventory` aggregate lags the variant-level sum

After migrating inventory onto 14 new variants on a parent, `product.totalInventory` reported 1203 units while summing `variant.inventoryQuantity` across all 15 variants returned 1253. The 50-unit gap wasn't real lost inventory — it was Shopify's cached aggregate being stale on freshly-activated inventory items. The variant-level sum is authoritative; `totalInventory` backfills within ~15 minutes (in practice, well under an hour).

**Rule:** when a Phase 5–style migration's integrity check needs "does the sum match pre-migration?", sum `variant.inventoryQuantity` yourself — don't trust `product.totalInventory` in the minutes right after an `inventoryActivate` + `inventorySetQuantities` cycle. The storefront and checkout APIs use the variant-level numbers, so this is a metric/display lag only, not an actual oversell risk.

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
| **URL redirect create/list/delete/get** | `scripts/shopify-redirect.sh` (MCP has no urlRedirect tool) |
| **Inventory quantity read** | `scripts/shopify-inventory.sh get <variant-gid>` |
| **Inventory quantity set (absolute)** | `scripts/shopify-inventory.sh set <variant-gid> <location-gid> <qty>` |
| **Inventory quantity adjust (delta)** | `scripts/shopify-inventory.sh adjust <variant-gid> <location-gid> <delta>` |
| **List location GIDs** | `scripts/shopify-inventory.sh locations` (id-only; `read_locations` needed for names) |

## Verifying a metafield write after the fact

If you already wrote via the MCP's `update-product` and want to confirm it persisted:

```bash
scripts/shopify-metafield.sh get <owner-gid> <namespace> <key>
# null means not written; object with id+value means written
```
