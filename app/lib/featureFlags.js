/**
 * Build-time feature flags.
 *
 * These are simple constants — no runtime source (env, cookies, edge config).
 * Flip a value here and redeploy to toggle a feature.
 */
export const FEATURES = {
  /**
   * Shopify Subscriptions app integration.
   *
   * When false: subscription UI renders in a disabled "Coming soon" state
   * but all cart mutations go through as one-time purchases.
   *
   * To activate:
   *   1. Install the Shopify Subscriptions app in the Shopify admin.
   *   2. Create a Selling Plan Group for eligible products (weekly/monthly).
   *   3. Flip this flag to true.
   *   4. Verify sellingPlanAllocations returns data in the Storefront API.
   */
  SUBSCRIPTIONS_ENABLED: false,
};
