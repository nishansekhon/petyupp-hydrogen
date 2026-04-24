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
  'himalayan-gourmet-cheese-chew': {
    badges: [
      'Yak milk',
      'Single ingredient',
      'Vet approved',
      'Long-lasting',
      'Multi-size available',
    ],
    shortDescription:
      'Traditional Himalayan yak milk, hard-pressed into a long-lasting chew. Keeps big chewers busy for days — single ingredient, no hide, no artificial additives.',
    faqs: [
      {
        question: 'How long does a cheese chew last?',
        answer:
          'Most moderate chewers stretch one chew across several days; heavy chewers get a few hours. Freezing it first extends chew time even further.',
      },
      {
        question: 'Is it safe for senior or small dogs?',
        answer:
          'Softer than bone but still firm — best for adult dogs with healthy teeth. For seniors or small dogs, size down or soak briefly in warm water before giving.',
      },
      {
        question: 'How is it made?',
        answer:
          'Traditional Himalayan recipe: yak milk, lime juice, a pinch of salt. Hard-pressed and air-dried — nothing else. No preservatives, no flavorings, no hide.',
      },
      {
        question: 'What do I do with the small end piece?',
        answer:
          'Microwave it for 30–45 seconds until it puffs up into a cheese puff. Safer than letting your dog gulp a hard piece, and it’s the best part.',
      },
    ],
  },
  'water-buffalo-trachea-dog-chews-bite-size-8-oz': {
    badges: [
      'Single ingredient',
      'Natural joint support',
      'Dental chew',
      'Grain free',
      'Vet approved',
    ],
    shortDescription:
      'Bite-size trachea pieces — naturally rich in glucosamine and chondroitin from the cartilage. A dental chew that doubles as easy joint support for everyday dogs.',
    faqs: [
      {
        question: 'How long do they last?',
        answer:
          'Bite-size pieces are meant as a daily treat, not an all-day chew. One or two give a quick dental-scraping session and a small joint-support boost.',
      },
      {
        question: 'Are they safe for senior or small dogs?',
        answer:
          'Yes — trachea is soft, flexible cartilage that small mouths and older teeth handle well. Supervise and match portion size to your dog’s weight.',
      },
      {
        question: 'Where does the joint support come from?',
        answer:
          'Trachea is cartilage, naturally rich in glucosamine and chondroitin. It’s food, not a supplement — a gentle everyday source, not a medical dose.',
      },
      {
        question: 'Any chicken, beef, or grain added?',
        answer:
          'Single ingredient: water buffalo trachea. No common allergens like chicken, beef, or grain, and no artificial preservatives, colors, or flavors.',
      },
    ],
  },
  'water-buffalo-trachea-bites-dog-chew-1-lb-100-natural-dog-treats': {
    badges: [
      'Grass-fed',
      'Made without hormones',
      'Single ingredient',
      'Natural joint support',
      'Bulk pack',
    ],
    shortDescription:
      'A one-pound stash of grass-fed water buffalo trachea bites. Soft dental chew and natural cartilage-sourced joint support — single ingredient, nothing added.',
    faqs: [
      {
        question: 'How long does a 1 lb bag last?',
        answer:
          'Depends how often you treat. As a daily dental bite, most medium dogs stretch a 1 lb bag across 4–6 weeks. It stores well in a cool, dry cupboard.',
      },
      {
        question: 'Safe for senior or small dogs?',
        answer:
          'Yes — trachea cartilage is soft and flexible, so older teeth and small jaws manage it well. Break larger pieces into smaller bites for toy breeds.',
      },
      {
        question: 'Where is it sourced?',
        answer:
          'Grass-fed, free-range water buffalo. No added hormones, no artificial preservatives, no fillers — just the trachea, cleaned and gently dried.',
      },
      {
        question: 'Do they smell?',
        answer:
          'Mild, meaty scent — not fishy or offensive. Air-dried low and slow, so the bag stays fairly odor-free between uses.',
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
