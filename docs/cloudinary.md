# Cloudinary — Credential Pattern for Dev Sessions

## Where the creds live

Cloudinary credentials for the **`petyupp-lifestyle`** cloud are stored as **secret environment variables in Oxygen production**, set via `npx shopify hydrogen env push` or the Hydrogen UI. They are intentionally **not** committed to the repo `.env`.

This means: `npx shopify hydrogen env pull` will skip them. The Shopify CLI prints `"environment variables marked as secret, so their values weren't pulled"`. There is no way to retrieve secret Oxygen values back to a dev environment via the CLI — by design.

## Dev-session workflow

For local scripts that need the Cloudinary **Admin API** (asset search, folder listing, public_id lookup before a Shopify upload):

1. Have the operator paste `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` inline into the session.
2. `export` them for that shell only — **do not write to `.env`**.
3. Cloud name is always `petyupp-lifestyle` post-consolidation. Hardcode or `export CLOUDINARY_CLOUD_NAME=petyupp-lifestyle`.

Example Admin API call:

```bash
curl -fsS -u "${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}" \
  -X POST "https://api.cloudinary.com/v1_1/petyupp-lifestyle/resources/search" \
  -H "Content-Type: application/json" \
  -d '{"expression":"folder:cheese-chew","max_results":100}'
```

Front-end / runtime image rendering does not need the Admin API — public delivery URLs (`https://res.cloudinary.com/petyupp-lifestyle/image/upload/...`) are unauthenticated.

## public_id ≠ folder path

Cloudinary's `public_id` does **not** include the asset folder. A file in the `cheese-chew` folder still has `public_id = petyupp-NNNN-...`, **not** `cheese-chew/petyupp-NNNN-...`. The folder is metadata used by the Admin search expression (`folder:cheese-chew`), not a path component of the public_id or delivery URL.

## Old PetYupp cloud

The legacy cloud `c-e37af05dc15bd52aeffd67c0800a95` is being decommissioned in **Phase 5.5c**. Eight admin-page references still pending migration. **Do not author new references against the old cloud** — always use `petyupp-lifestyle`.

## Related scripts

- `scripts/shopify-variant-media.sh` — uploads a Cloudinary URL onto a Shopify product and attaches it to a variant. Used in Phase 5.5b for himalayan-flavored-variety.
