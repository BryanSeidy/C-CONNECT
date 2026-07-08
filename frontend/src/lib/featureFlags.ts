/**
 * Feature flags — MVP scope gating.
 *
 * Some frontend modules call backend endpoints that don't exist yet (no
 * route/controller/table on the Laravel side). Rather than ship a screen
 * that silently 404s, gate it here and show an honest "coming soon" state.
 *
 * Flip a flag to `true` once the corresponding backend contract lands —
 * see docs/repartition-implementation-4-agents.md §11 for the agreed MVP
 * scope and what's explicitly deferred.
 */
export const FEATURES = {
  /** No ReviewController / reviews table on the backend yet (services/reviews.ts -> 404). */
  productReviews: false,
  /** No /matching route on the backend; matching.ts was dead code and has been removed. */
  advancedMatching: false,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURES[flag];
}
