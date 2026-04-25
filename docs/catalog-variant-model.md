# Catalog Variant Model — Post Phase 5 + 5.5a Reshape

Updated 2026-04-25 after Phase 5.5b shipped. The pre-Phase-5 catalog used a "separate product per size/flavor" pattern for Himalayan items. That pattern is **obsolete** for the Himalayan family. New work should target the post-consolidation shape described here.

## Current Himalayan family shape

### `himalayan-gourmet-cheese-chew` — Plain

True multi-variant product. **6 size variants** on the `Size` option:

| Size | Price |
|---|---|
| Small 3.5oz | $24.99 |
| Medium | $29.99 |
| Large | $34.99 |
| Extra Large | $44.99 |
| Nuggets 3.5oz | $18.99 |
| Nuggets 0.5lb | $27.99 |

History:
- Built via Phase 5 consolidation stages 1–5 — commits `2b0e5eb` → `26afe8d`.
- Re-tiered in `7fd147c` (Size normalization across price segments).
- Price ladder cleaned + 1lb dead-end archived in `61995d3` (Phase 5.5b).

### `himalayan-flavored-variety` — Flavored

True multi-variant product. **8 flavor variants** on the `Flavor` option, each with its own variant-level pack image:

Blueberry · Honey · Mint · Peanut Butter · Pumpkin · Strawberry · Flax Seed · Turmeric & Ashwagandha

History:
- Split out from Plain in `efa0321` (Phase 5.5a).
- Variant-level imagery wired in Phase 5.5b: `03410a4` (Shopify-side, via `productCreateMedia + productVariantAppendMedia`) and `b4d0459` (Hydrogen-side, threading `selectedVariant.image` into `PdpGallery`).

## Apply the same pattern to remaining Phase 5 family splits

Cheek roll, tail-wrapped, collagen sticks, and horns are still segmented as separate products per size. Convert each to one parent product with `Size` variants, mirroring the Phase 5 stage layout:

1. Parent options + variants (`2b0e5eb`)
2. Inventory migration (`6b0f1c8`)
3. URL redirects (`2b080f6`)
4. Archive source products (`d6462e4`)
5. Update `ugcManifest` handle references (`26afe8d`)

## What is *not* (yet) a variant

- **Pack-count chews** (`plain-bully-sticks-pack-of-10-6-inch`, `water-buffalo-rib-bone-…-pack-of-5`, `water-buffalo-trachea-bites-…-1-lb-…-20-pcs`, etc.) remain separate products per pack count. No consolidation planned yet.
- **Bowls / diners / silicone mats** already use true variants on `Size` or `Color`. No change needed.

## Implications for code

- **Conversion UI** that keys off variants (value-ladder chip, size switcher, subscribe-to-largest nudges) now has live coverage on Himalayan Plain and Flavored.
- **`PdpBuyBox.jsx` per-unit-price math** (commit `6ddded3`) still has *no* live coverage on the pack-count path — no multi-variant product currently uses "Pack of N" naming. That gap survives the reshape.
- **PDP variant image** must be threaded as `selectedVariant.image` into `PdpGallery` for any product with variant-level imagery (see `b4d0459`). Otherwise the gallery only shows product-level images and swatch clicks won't swap the hero.

Always re-verify catalog shape via Storefront API before designing around it. Phase 5 / 5.5 are still in flight; further reshape is likely.

## Related scripts

- `scripts/shopify-metafield.sh` — metafield CRUD.
- `scripts/shopify-redirect.sh` — URL redirects (used in stage 3).
- `scripts/shopify-inventory.sh` — inventory mutations (used in stage 2).
- `scripts/shopify-variant-media.sh` — variant-level imagery (used in Phase 5.5b).
