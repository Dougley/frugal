export const FEATURE_LIMITS = {
  GIVEAWAY_DURATION_DAYS: {
    FREE: 14,
    PREMIUM: 30,
  },
  CONCURRENT_GIVEAWAYS: {
    FREE: 5,
    PREMIUM: 20,
  },
  MAX_WINNERS: {
    FREE: 10,
    PREMIUM: 50,
  },
} as const;

export function checkFeatureLimit(
  subscription: { hasPremium: boolean },
  currentValue: number,
  freeLimit: number,
  premiumLimit: number
): { allowed: boolean; exceedsLimit: boolean; effectiveLimit: number } {
  const effectiveLimit = subscription.hasPremium ? premiumLimit : freeLimit;
  const allowed = currentValue <= effectiveLimit;
  return { allowed, exceedsLimit: !allowed, effectiveLimit };
}
