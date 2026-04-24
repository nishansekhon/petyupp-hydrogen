/**
 * Per-product metadata that isn't on the Shopify product yet
 * (attribute badges, short brand-voice description, trust row overrides,
 * FAQ entries). Keyed by productHandle.
 *
 * When Shopify metafields are populated with `custom.attribute_badges`
 * / `custom.trust_points` / etc., swap these fields to read from the
 * product's metafields instead; leave this map as a fallback.
 *
 * Use getProductMetadata(handle) — it returns sensible defaults for
 * products that aren't in the map yet.
 */

const DEFAULTS = {
  badges: ['Natural', 'Vet approved', '30-day guarantee'],
  shortDescription:
    'Premium natural treat from PetYupp. Ethically sourced, vet approved, and made without artificial additives.',
  faqs: [
    {
      question: 'How long does this last?',
      answer:
        'Depends on your dog. Power chewers typically finish in under an hour; moderate chewers stretch it across several sessions.',
    },
    {
      question: 'What if my dog doesn’t like it?',
      answer:
        '30-day guarantee. Email us and we’ll refund or swap for something your dog loves.',
    },
    {
      question: 'Where does it ship from?',
      answer:
        'We ship from our US warehouse. Orders over $49 ship free; most arrive in 1–3 business days.',
    },
  ],
};

const PRODUCT_METADATA = {
  'water-buffalo-tendon-dog-chews-7-oz': {
    badges: [
      'Natural',
      'Grain free',
      'Vet approved',
      'Made without hormones',
      'Long-lasting',
    ],
    shortDescription:
      'A premium single-ingredient chew sourced from grass-fed water buffalo. Supports dental health and gives power chewers hours of satisfaction.',
    faqs: [
      {
        question: 'How long does a tendon last?',
        answer:
          'Most dogs work a 7oz tendon down over multiple sessions across 1–2 weeks, depending on chew style and size.',
      },
      {
        question: 'Is it safe for senior or small dogs?',
        answer:
          'Yes — tendons are softer than bones and fully digestible. Always supervise and pick a size that fits your dog.',
      },
      {
        question: 'What about dogs with allergies?',
        answer:
          'Single ingredient (water buffalo tendon), so there are no common allergens like chicken, beef, or grain added.',
      },
      {
        question: 'How is it sourced?',
        answer:
          'Grass-fed, free-range water buffalo. No hormones, no added preservatives, no artificial color or flavor.',
      },
    ],
  },
};

export function getProductMetadata(handle) {
  const entry = PRODUCT_METADATA[handle];
  if (!entry) return DEFAULTS;
  return {
    badges: entry.badges ?? DEFAULTS.badges,
    shortDescription: entry.shortDescription ?? DEFAULTS.shortDescription,
    faqs: entry.faqs ?? DEFAULTS.faqs,
  };
}
