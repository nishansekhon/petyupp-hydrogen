/**
 * Per-product paired-product mapping for PDP cross-link cards.
 * Add an entry keyed by productHandle whenever a product has a clear
 * "look at this related variant family" companion (e.g. Plain ↔ Flavored).
 */
export const PAIRED_PRODUCTS = {
  'himalayan-gourmet-cheese-chew': {
    pairedHandle: 'himalayan-flavored-variety',
    pairedTitle: 'Try the Flavored Variety',
    label: 'Looking for flavored?',
    thumbnailVariant: 'flavored',
  },
  'himalayan-flavored-variety': {
    pairedHandle: 'himalayan-gourmet-cheese-chew',
    pairedTitle: 'See the Original',
    label: 'Prefer plain?',
    thumbnailVariant: 'plain',
  },
};
