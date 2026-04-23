/**
 * PetYupp UGC Video Manifest — Single Source of Truth
 *
 * This file maps every Cloudinary UGC video to:
 *   - Cloudinary slug (matches filename without .mp4)
 *   - Product SKU / page handle (for PDP filtering)
 *   - Problem tag (for homepage & /real-dogs filtering)
 *   - Dog name + quote (for display)
 *   - Creator handle (for credit)
 *   - Rating (star count, 4 or 5)
 *   - homepageSlot (null for most, a problem-slug for the 6 picked for homepage)
 *
 * Three surfaces consume this:
 *   1. Homepage RealResultsRow     → filter: homepageSlot != null
 *   2. /real-dogs gallery page      → all, filterable by problem tag
 *   3. PDPs                         → filter: productHandle matches current product
 *
 * Adding a new clip: upload to Cloudinary `ugc/` folder, add one entry here.
 * No component code needs to change.
 */

export const ugcManifest = [

  // ========================================================================
  // HIMALAYAN GOURMET CHEESE CHEW (all sizes & flavors) — 18 clips
  // ========================================================================

  {
    slug: "Cheese_Chew_Ex-Large_itsmeandrookie_1",
    productHandle: "himalayan-gourmet-cheese-chew-extra-large",
    size: "xl",
    flavor: "original",
    dogName: "Rookie & Chewbacca",
    creator: "@itsmeandrookie",
    problemTag: "destructive-chewing",
    quote: "My power chewers destroyed every chew I tried. These held up perfectly.",
    rating: 5,
    homepageSlot: "destructive-chewing",
    audioQuality: "spoken-clear",
    useCase: ["homepage", "pdp", "gallery"]
  },
  {
    slug: "Cheese_Chew_Ex_large_itsmeandrookie_2",
    productHandle: "himalayan-gourmet-cheese-chew-large",
    size: "large",
    flavor: "original",
    dogName: "Zina",
    creator: "@itsmeandrookie",
    problemTag: "separation-anxiety",
    quote: "Zina's on the smaller side, so I sized up. She's absolutely obsessed.",
    rating: 5,
    homepageSlot: "separation-anxiety",
    audioQuality: "spoken-clear",
    useCase: ["homepage", "pdp", "gallery"]
  },
  {
    slug: "Cheese_Chew_Ex-large_leahfgregory",
    productHandle: "himalayan-gourmet-cheese-chew-extra-large",
    size: "xl",
    flavor: "original",
    dogName: "Leah's dog",
    creator: "@leahfgregory",
    problemTag: "destructive-chewing",
    quote: "He's a tough chewer — we can't hardly find anything that lasts. These are absolutely great.",
    rating: 5,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["pdp", "gallery"]
  },
  {
    slug: "Cheese_Chew_Honey_jaimeandjean",
    productHandle: "himalayan-gourmet-cheesy-chew-honey-flavor-3-5-oz",
    size: "standard",
    flavor: "honey",
    dogName: "Jaime & Jean's dog",
    creator: "@jaimeandjean",
    problemTag: "dental-health",
    quote: null, // music-only clip
    rating: 5,
    homepageSlot: null,
    audioQuality: "music-only",
    useCase: ["pdp", "gallery"]
  },
  {
    slug: "Cheese_Chew_Large_Micro__itsmeandrookie",
    productHandle: "himalayan-gourmet-cheese-chew-large",
    size: "large",
    flavor: "original",
    dogName: "Rookie & Chewbacca",
    creator: "@itsmeandrookie",
    problemTag: "hyperactivity",
    quote: "They had a blast with these chews and they lasted a really long time.",
    rating: 5,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["pdp", "gallery"]
  },
  {
    slug: "Cheese_Chew_Large_alliebug2382",
    productHandle: "himalayan-gourmet-cheese-chew-large",
    size: "large",
    flavor: "original",
    dogName: "Luna",
    creator: "@alliebug2382",
    problemTag: "destructive-chewing",
    quote: "These are very strong and heavy-duty. This will last her a couple of months.",
    rating: 5,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["pdp", "gallery"]
  },
  {
    slug: "Cheese_Chew_Large_bitter_melon_3",
    productHandle: "himalayan-gourmet-cheese-chew-large",
    size: "large",
    flavor: "original",
    dogName: null,
    creator: "@bitter_melon_3",
    problemTag: "hyperactivity",
    quote: "My puppy doesn't have all his molars yet, but as you can see, they're very excited.",
    rating: 4,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["pdp", "gallery"]
  },
  {
    slug: "Cheese_Chew_Medium_2girls3doods",
    productHandle: "himalayan-gourmet-cheese-chew-medium",
    size: "medium",
    flavor: "original",
    dogName: null,
    creator: "@2girls3doods",
    problemTag: "hyperactivity",
    quote: null, // audio clipped
    rating: 5,
    homepageSlot: null,
    audioQuality: "music-only",
    useCase: ["pdp", "gallery"]
  },
  {
    slug: "Cheese_Chew_Medium_crystalstill",
    productHandle: "himalayan-gourmet-cheese-chew-medium",
    size: "medium",
    flavor: "original",
    dogName: "Crystal's pups",
    creator: "@crystalstill",
    problemTag: "dental-health",
    quote: "Gluten, wheat, made all naturally. They love them — patiently waiting for theirs.",
    rating: 5,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["pdp", "gallery"]
  },
  {
    slug: "Cheese_Chew_Small_2girls3doods",
    productHandle: "himalayan-gourmet-cheese-chew",
    size: "small",
    flavor: "original",
    dogName: "Bear & Papito",
    creator: "@2girls3doods",
    problemTag: "dental-health",
    quote: "Grain-free, gluten-free, vet-recommended. Keeps them entertained and cleans their teeth.",
    rating: 5,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["pdp", "gallery"]
  },
  {
    slug: "Cheese_Chew_Small_crystalstill",
    productHandle: "himalayan-gourmet-cheese-chew",
    size: "small",
    flavor: "original",
    dogName: "Crystal's dogs",
    creator: "@crystalstill",
    problemTag: "hyperactivity",
    quote: "Both my dogs know exactly what these are and they love them.",
    rating: 5,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["pdp", "gallery"]
  },
  {
    slug: "Cheese_Chew_Small_momoandviv",
    productHandle: "himalayan-gourmet-cheese-chew",
    size: "small",
    flavor: "original",
    dogName: "Momo",
    creator: "@momoandviv",
    problemTag: "separation-anxiety",
    quote: "If Momo really likes a treat, she hides it. Talk about resource guarding — this chew is all hers.",
    rating: 5,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["pdp", "gallery"]
  },
  {
    slug: "Cheese_Chew_Small_nalajade",
    productHandle: "himalayan-gourmet-cheese-chew",
    size: "small",
    flavor: "original",
    dogName: "Nala & Jade",
    creator: "@nalajade",
    problemTag: "digestive-issues",
    quote: "Yak milk, lime juice, salt — all natural. No more tummy troubles.",
    rating: 4,
    homepageSlot: "digestive-issues",
    audioQuality: "spoken-clear",
    useCase: ["homepage", "pdp", "gallery"]
  },
  {
    slug: "Cheese_Chew_Small_pettypuerto",
    productHandle: "himalayan-gourmet-cheese-chew",
    size: "small",
    flavor: "original",
    dogName: "Bailey",
    creator: "@pettypuerto",
    problemTag: "hyperactivity",
    quote: "Look at these big ass dog treats! Bailey absolutely loves them.",
    rating: 5,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["pdp", "gallery"]
  },
  {
    slug: "Cheese_Chew_Strawberry_nancyhernandez76",
    productHandle: "himalayas-gourmet-cheesy-chew-strawberry-flavor-3-5-oz",
    size: "standard",
    flavor: "strawberry",
    dogName: "Nancy's dog",
    creator: "@nancyhernandez76",
    problemTag: "hyperactivity",
    quote: "He's very picky, but I think he likes it. Strawberry cheesecake chew for dogs — go shop.",
    rating: 4,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["pdp", "gallery"]
  },
  {
    slug: "Cheese_Chew_Strawberry_sakurapaws",
    productHandle: "himalayas-gourmet-cheesy-chew-strawberry-flavor-3-5-oz",
    size: "standard",
    flavor: "strawberry",
    dogName: "Evie",
    creator: "@sakurapaws",
    problemTag: "hyperactivity",
    quote: "My guys have tried the regular ones but never the flavored ones. Evie's ready to try.",
    rating: 5,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["pdp", "gallery"]
  },
  {
    slug: "Cheese_Chew_large_Lunathelabpuppy",
    productHandle: "himalayan-gourmet-cheese-chew-large",
    size: "large",
    flavor: "original",
    dogName: "Luna",
    creator: "@Lunathelabpuppy",
    problemTag: "destructive-chewing",
    quote: "As a destructive girl, 10 out of 10 — I would love to destroy these again.",
    rating: 5,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["pdp", "gallery"]
  },
  {
    slug: "Cheese_Chew_pumpkin_jaimeandjean",
    productHandle: "himalayan-gourmet-cheesy-chew-pumpkin-flavor-3-5-0z",
    size: "standard",
    flavor: "pumpkin",
    dogName: "Jaime & Jean's dog",
    creator: "@jaimeandjean",
    problemTag: "digestive-issues",
    quote: null, // music-only
    rating: 5,
    homepageSlot: null,
    audioQuality: "music-only",
    useCase: ["pdp", "gallery"]
  },
  {
    slug: "Cheese_chew_Peanut_Butter_jaimeandjean",
    productHandle: "himalayan-gourmet-cheese-chew-3-5-oz-peanut-butter-flavor",
    size: "standard",
    flavor: "peanut-butter",
    dogName: "Jaime & Jean's dog",
    creator: "@jaimeandjean",
    problemTag: "hyperactivity",
    quote: null, // music-only
    rating: 5,
    homepageSlot: null,
    audioQuality: "music-only",
    useCase: ["pdp", "gallery"]
  },
  {
    slug: "Cheese_chew_large_amytaylornyc",
    productHandle: "himalayan-gourmet-cheese-chew-large",
    size: "large",
    flavor: "original",
    dogName: null,
    creator: "@amytaylornyc",
    problemTag: "hyperactivity",
    quote: null, // audio clipped
    rating: 5,
    homepageSlot: null,
    audioQuality: "music-only",
    useCase: ["pdp", "gallery"]
  },
  {
    slug: "Cheese_chew_large_sammy.the.rottweil",
    productHandle: "himalayan-gourmet-cheese-chew-large",
    size: "large",
    flavor: "original",
    dogName: "Sammy",
    creator: "@sammy.the.rottweil",
    problemTag: "digestive-issues",
    quote: "Safe, super digestible. No worries about choking or blockages. High-quality protein from yak milk.",
    rating: 5,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["pdp", "gallery"]
  },
  {
    slug: "cheese_chew_large_ontheradiofish",
    productHandle: "himalayan-gourmet-cheese-chew-large",
    size: "large",
    flavor: "original",
    dogName: null,
    creator: "@ontheradiofish",
    problemTag: "dental-health",
    quote: "Great alternative to rawhide. Yak milk, cow milk, salt, lime juice — that's it.",
    rating: 5,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["pdp", "gallery"]
  },
  {
    slug: "cheese_chew_large_stumpychubs",
    productHandle: "himalayan-gourmet-cheese-chew-large",
    size: "large",
    flavor: "original",
    dogName: null,
    creator: "@stumpychubs",
    problemTag: "hyperactivity",
    quote: null, // music-only
    rating: 5,
    homepageSlot: null,
    audioQuality: "music-only",
    useCase: ["pdp", "gallery"]
  },
  // ========================================================================
  // COFFEE WOOD CHEW — 2 clips (SGS certified Vietnam supplier)
  // ========================================================================

  {
    slug: "Coffee_Wood_Small_buckyboy053",
    productHandle: "natural-repurposed-coffee-woods-dog-chew-small",
    size: "small",
    flavor: null,
    dogName: "Bucky",
    creator: "@buckyboy053",
    problemTag: "destructive-chewing",
    quote: null, // audio is dog-reaction-only
    rating: 5,
    homepageSlot: null,
    audioQuality: "music-only",
    useCase: ["pdp", "gallery"]
  },
  {
    slug: "Coffee_Wood_medium_quesothegs",
    productHandle: "natural-repurposed-coffee-woods-dog-chew-medium",
    size: "medium",
    flavor: null,
    dogName: "Queso & Ags",
    creator: "@quesothegs",
    problemTag: "destructive-chewing",
    quote: "Perfect for tough chewers, bored pups, and saving your furniture from bite marks.",
    rating: 5,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["pdp", "gallery"]
  },

  // ========================================================================
  // WATER BUFFALO HOOVES — 1 clip
  // ========================================================================

  {
    slug: "Hooves_20pcs_sakurapaws",
    productHandle: "water-buffalo-hooves-dog-chew-100-natural-dog-treats-no-artificial-color-flavor-20-pcs",
    size: "20pcs",
    flavor: null,
    dogName: "Sakura's guys",
    creator: "@sakurapaws",
    problemTag: "destructive-chewing",
    quote: "Single ingredient — just buffalo hooves. Great for heavy chewers and dogs with allergies.",
    rating: 5,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["pdp", "gallery"]
  },

  // ========================================================================
  // WATER BUFFALO HORNS — 1 clip (fur_babies_for_life)
  // ========================================================================

  {
    slug: "fur_babies_for_life",
    productHandle: "premium-free-range-grass-fed-buffalo-horns",
    size: "standard",
    flavor: null,
    dogName: "Brownie",
    creator: "@fur_babies_for_life",
    problemTag: "destructive-chewing",
    quote: "Huge, high in protein, long-lasting, and odor-free. Reduces plaque and tartar as they chew.",
    rating: 5,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["pdp", "gallery"]
  },

  // ========================================================================
  // REGULAR STAINLESS STEEL BOWL — 1 clip
  // ========================================================================

  {
    slug: "Regular_Bowl_3quart_texas_coastal_frenchies",
    productHandle: "stainless-steel-regular-feeding-bowl",
    size: "3-quart",
    flavor: null,
    dogName: "Texas Coastal Frenchies",
    creator: "@texas_coastal_frenchies",
    problemTag: null, // feeding product, no problem tag
    quote: "Frenchies have big heads — they need easy access. This 3-quart bowl is perfect.",
    rating: 5,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["pdp", "gallery"]
  },

  // ========================================================================
  // RIB BONE — 1 clip
  // ========================================================================

  {
    slug: "Rib_bone_5pcs_midnighttrainbull",
    productHandle: "water-buffalo-rib-bone-with-meat-dog-chews-pack-of-5",
    size: "5pcs",
    flavor: null,
    dogName: null,
    creator: "@midnighttrainbull",
    problemTag: "destructive-chewing",
    quote: null, // music-only
    rating: 5,
    homepageSlot: null,
    audioQuality: "music-only",
    useCase: ["pdp", "gallery"]
  },

  // ========================================================================
  // BEEF / BUFFALO TRACHEA BITES — 2 clips
  // ========================================================================

  {
    slug: "Teachea_bites_1lb__tinamtaylor",
    productHandle: "water-buffalo-trachea-bites-dog-chew-1-lb-100-natural-dog-treats",
    size: "1lb",
    flavor: null,
    dogName: "Niley & Lobo",
    creator: "@tinamtaylor",
    problemTag: "dental-health",
    quote: "Rich in protein, low in fat, easily digestible. Reduces plaque and tartar buildup.",
    rating: 5,
    homepageSlot: "dental-health",
    audioQuality: "spoken-clear",
    useCase: ["homepage", "pdp", "gallery"]
  },
  {
    slug: "Treachea_6inch_just_simply_karlie",
    productHandle: "100-natural-water-buffalo-trachea-dog-chew-6-inch-6-count",
    size: "6-inch",
    flavor: null,
    dogName: "Karlie's dogs",
    creator: "@just_simply_karlie",
    problemTag: "separation-anxiety",
    quote: "Anyone else feel guilty leaving their dogs? Beef tracheas — individually wrapped, not stinky.",
    rating: 5,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["pdp", "gallery"]
  },

  // ========================================================================
  // TRACHEA 6-INCH — 2 clips (morgangurrney, music-only)
  // ========================================================================

  {
    slug: "Trachea_6inch__morgangurrney_2",
    productHandle: "100-natural-water-buffalo-trachea-dog-chew-6-inch-6-count",
    size: "6-inch",
    flavor: null,
    dogName: null,
    creator: "@morgangurrney",
    problemTag: "joint-pain",
    quote: null,
    rating: 5,
    homepageSlot: null,
    audioQuality: "music-only",
    useCase: ["pdp", "gallery"]
  },
  {
    slug: "Trachea_6inch_morgangurrney_1",
    productHandle: "100-natural-water-buffalo-trachea-dog-chew-6-inch-6-count",
    size: "6-inch",
    flavor: null,
    dogName: null,
    creator: "@morgangurrney",
    problemTag: "joint-pain",
    quote: null,
    rating: 5,
    homepageSlot: null,
    audioQuality: "music-only",
    useCase: ["pdp", "gallery"]
  },

  // ========================================================================
  // WATER BUFFALO TENDON — 1 clip (AJ the Luxating Patella dog!)
  // Best Joint Pain testimonial in the entire library
  // ========================================================================

  {
    slug: "Tendon_7oz__leahfgregory",
    productHandle: "water-buffalo-tendon-dog-chews-7-oz",
    size: "7oz",
    flavor: null,
    dogName: "AJ",
    creator: "@leahfgregory",
    problemTag: "joint-pain",
    quote: "AJ has Luxating Patella — his kneecap pops out of place. These Water Buffalo tendons are great for joint health.",
    rating: 5,
    homepageSlot: "joint-pain",
    audioQuality: "spoken-clear",
    useCase: ["homepage", "pdp", "gallery"]
  },

  // ========================================================================
  // BULLY STICKS — 1 clip
  // ========================================================================

  {
    slug: "bullysticks_6inch_10Count__pettypuerto",
    productHandle: "plain-bully-sticks-pack-of-10-6-inch",
    size: "6-inch-10ct",
    flavor: null,
    dogName: "Bailey",
    creator: "@pettypuerto",
    problemTag: "dental-health",
    quote: "Single-ingredient bully sticks — and they're odor-free.",
    rating: 5,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["pdp", "gallery"]
  },

  // ========================================================================
  // BLUEBERRY CHEESE CHEW — 1 clip (audio clipped)
  // ========================================================================

  {
    slug: "blueberry_amytaylornyc",
    productHandle: "himalayan-gourmet-cheese-chew-blueberry-flavor-3-5-oz",
    size: "standard",
    flavor: "blueberry",
    dogName: null,
    creator: "@amytaylornyc",
    problemTag: "hyperactivity",
    quote: null,
    rating: 5,
    homepageSlot: null,
    audioQuality: "music-only",
    useCase: ["pdp", "gallery"]
  },

  // ========================================================================
  // STRAWBERRY (short clip, audio clipped)
  // ========================================================================

  {
    slug: "strawberry_amytaylornyc",
    productHandle: "himalayas-gourmet-cheesy-chew-strawberry-flavor-3-5-oz",
    size: "standard",
    flavor: "strawberry",
    dogName: null,
    creator: "@amytaylornyc",
    problemTag: "hyperactivity",
    quote: null,
    rating: 5,
    homepageSlot: null,
    audioQuality: "music-only",
    useCase: ["pdp", "gallery"]
  },

  // ========================================================================
  // PUMPKIN (music/unclear)
  // ========================================================================

  {
    slug: "pumpkin_midnighttrainbull",
    productHandle: "himalayan-gourmet-cheesy-chew-pumpkin-flavor-3-5-0z",
    size: "standard",
    flavor: "pumpkin",
    dogName: null,
    creator: "@midnighttrainbull",
    problemTag: "digestive-issues",
    quote: null,
    rating: 5,
    homepageSlot: null,
    audioQuality: "music-only",
    useCase: ["pdp", "gallery"]
  },

  // ========================================================================
  // ORIGINAL 10 CLIPS (already on homepage or reserves, from ugc/ folder)
  // These use the ugc-* naming convention
  // ========================================================================

  {
    slug: "ugc-aussie-power-chewer",
    productHandle: "himalayan-gourmet-cheese-chew-extra-large",
    size: "xl",
    flavor: "original",
    dogName: "Aussie power chewer",
    creator: "@unknown",
    problemTag: "destructive-chewing",
    quote: "Powerful chewer reaction — eyes wide, jaw strength on full display.",
    rating: 5,
    homepageSlot: null, // superseded by itsmeandrookie_1 with stronger quote
    audioQuality: "filter-heavy",
    useCase: ["gallery"]
  },
  {
    slug: "ugc-aussies-brand-testimonial",
    productHandle: "himalayan-gourmet-cheese-chew",
    size: "standard",
    flavor: "original",
    dogName: "Two Aussies",
    creator: "@unknown",
    problemTag: "separation-anxiety",
    quote: "Absolutely love these!",
    rating: 5,
    homepageSlot: null, // superseded by Zina (itsmeandrookie_2)
    audioQuality: "filter-heavy",
    useCase: ["gallery"]
  },
  {
    slug: "ugc-black-lab-cheese-chew-jealousy",
    productHandle: "himalayan-gourmet-cheese-chew",
    size: "standard",
    flavor: "original",
    dogName: "Lunar",
    creator: "@unknown",
    problemTag: "dental-health",
    quote: "Harder and harder to find safe chews. This one's clean — yak milk, salt, lime juice.",
    rating: 5,
    homepageSlot: null, // superseded by Teachea bites for dental-health
    audioQuality: "spoken-clear",
    useCase: ["gallery"]
  },
  {
    slug: "ugc-cheese-chew-packaging-hero",
    productHandle: "himalayan-gourmet-cheese-chew",
    size: "standard",
    flavor: "original",
    dogName: null,
    creator: "@unknown",
    problemTag: null,
    quote: "Brand packaging hero shot — logo + product + dog in frame.",
    rating: 5,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["gallery", "pdp"]
  },
  {
    slug: "ugc-chocolate-lab-yak-cheese-bed",
    productHandle: "himalayan-gourmet-cheese-chew",
    size: "standard",
    flavor: "original",
    dogName: "Chocolate lab",
    creator: "@unknown",
    problemTag: "hyperactivity",
    quote: "Engaged for hours. Super digestible, no choking or blockage worries.",
    rating: 5,
    homepageSlot: "hyperactivity",
    audioQuality: "no-filter",
    useCase: ["homepage", "gallery"]
  },
  {
    slug: "ugc-owner-dog-couch-chew-lifestyle",
    productHandle: "himalayan-gourmet-cheese-chew",
    size: "standard",
    flavor: "original",
    dogName: null,
    creator: "@unknown",
    problemTag: "separation-anxiety",
    quote: "Owner relaxing while dog stays occupied with chew.",
    rating: 5,
    homepageSlot: null,
    audioQuality: "no-filter",
    useCase: ["gallery"]
  },
  {
    slug: "ugc-owner-dog-strawberry-chew-reveal",
    productHandle: "himalayas-gourmet-cheesy-chew-strawberry-flavor-3-5-oz",
    size: "standard",
    flavor: "strawberry",
    dogName: null,
    creator: "@unknown",
    problemTag: null,
    quote: "Strawberry flavor package reveal.",
    rating: 5,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["gallery", "pdp"]
  },
  {
    slug: "ugc-pitbull-cheese-chew-story",
    productHandle: "himalayan-gourmet-cheese-chew",
    size: "standard",
    flavor: "original",
    dogName: null,
    creator: "@unknown",
    problemTag: "digestive-issues",
    quote: "Mom brought home a fancy cheese chew. Yak milk, lime juice, salt — all natural.",
    rating: 4,
    homepageSlot: null,
    audioQuality: "spoken-clear",
    useCase: ["gallery"]
  },
  {
    slug: "ugc-red-aussie-popcorn-chew-bite",
    productHandle: "himalayan-gourmet-cheese-chew",
    size: "standard",
    flavor: "original",
    dogName: null,
    creator: "@dancineyesratedrookie",
    problemTag: "destructive-chewing",
    quote: "Red merle Aussie — the bite moment. TikTok creator.",
    rating: 5,
    homepageSlot: null,
    audioQuality: "filter-heavy",
    useCase: ["gallery"]
  },
  {
    slug: "ugc-senior-lab-woven-chew",
    productHandle: "natural-water-buffalo-trachea-dog-chew-6-inch-12-count",
    size: "12pack",
    flavor: null,
    dogName: "Senior Lab",
    creator: "@unknown",
    problemTag: "joint-pain",
    quote: "Anyone else feel guilty leaving their dogs? Beef tracheas — individually wrapped, not stinky.",
    rating: 5,
    homepageSlot: null, // superseded by Tendon_7oz_leahfgregory (AJ) for joint-pain
    audioQuality: "spoken-clear",
    useCase: ["gallery", "pdp"]
  }

];

// ============================================================================
// HELPER FUNCTIONS — consumed by all three surfaces
// ============================================================================

const CLOUDINARY_BASE = "https://res.cloudinary.com/petyupp-lifestyle/video/upload";

/**
 * Generate Cloudinary URLs for a given video slug.
 * All UGC videos live at the Cloudinary root — no folder prefix.
 */
export function videoUrls(clip) {
  return {
    inline: `${CLOUDINARY_BASE}/f_auto,q_auto,vc_auto,w_600,ac_none/${clip.slug}.mp4`,
    modal: `${CLOUDINARY_BASE}/f_auto,q_auto,vc_auto,w_900/${clip.slug}.mp4`,
    poster: `${CLOUDINARY_BASE}/f_jpg,q_auto,w_600/${clip.slug}.jpg`
  };
}

/**
 * Homepage: returns the 6 clips marked as homepageSlot.
 * Ordered by problem tag (canonical order).
 */
export function getHomepageClips() {
  const order = [
    "destructive-chewing",
    "dental-health",
    "separation-anxiety",
    "joint-pain",
    "digestive-issues",
    "hyperactivity"
  ];
  return order
    .map(tag => ugcManifest.find(c => c.homepageSlot === tag))
    .filter(Boolean);
}

/**
 * Gallery page: returns all clips, optionally filtered by problem tag.
 * Excludes clips without quote unless includeMusicOnly is true.
 */
export function getGalleryClips({ problemTag = null, includeMusicOnly = true } = {}) {
  return ugcManifest
    .filter(c => c.useCase.includes("gallery"))
    .filter(c => !problemTag || c.problemTag === problemTag)
    .filter(c => includeMusicOnly || c.audioQuality === "spoken-clear");
}

/**
 * PDP: returns up to 3 clips for a product page, prioritizing:
 *   1. Clips with spoken quotes
 *   2. Clips matching the exact flavor/size if specified
 *   3. Clips from the homepage (high quality)
 */
export function getPdpClips(productHandle, { flavor = null, size = null, limit = 3 } = {}) {
  const all = ugcManifest.filter(c =>
    c.productHandle === productHandle &&
    c.useCase.includes("pdp")
  );

  // Score by match quality
  const scored = all.map(c => {
    let score = 0;
    if (c.audioQuality === "spoken-clear") score += 3;
    if (c.quote) score += 2;
    if (flavor && c.flavor === flavor) score += 5;
    if (size && c.size === size) score += 2;
    if (c.homepageSlot) score += 1;
    return { clip: c, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.clip);
}

/**
 * Gallery: returns distinct problem tags with clip counts (for filter UI).
 */
export function getProblemTagCounts() {
  const counts = {};
  ugcManifest.forEach(c => {
    if (c.problemTag) {
      counts[c.problemTag] = (counts[c.problemTag] || 0) + 1;
    }
  });
  return counts;
}
