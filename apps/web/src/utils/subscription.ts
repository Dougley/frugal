import type { SubscriptionStatus } from "@dougley/frugal-subscriptions";
import {
  FEATURE_LIMITS,
  getGuildSubscriptionStatus,
  getPremiumStatus,
  getUserSubscriptionStatus,
} from "@dougley/frugal-subscriptions";
import dayjs from "dayjs";

export type { SubscriptionStatus } from "@dougley/frugal-subscriptions";

export interface DetailedSubscriptionStatus extends SubscriptionStatus {
  statusKey:
    | "subscription.status.free"
    | "subscription.status.premium"
    | "subscription.status.premium_lifetime"
    | "subscription.status.premium_expires";
  premiumIndicatorKey:
    | "subscription.indicator.none"
    | "subscription.indicator.premium"
    | "subscription.indicator.premium_expires_soon";
  expiresInDays: number | null;
  formattedExpiryDate: string | null;
}

export { FEATURE_LIMITS };

export async function checkUserSubscription(
  userId: string,
  drizzle: Parameters<typeof getUserSubscriptionStatus>[1]
) {
  return getUserSubscriptionStatus(userId, drizzle);
}

export async function checkGuildSubscription(
  guildId: string,
  drizzle: Parameters<typeof getGuildSubscriptionStatus>[1]
) {
  return getGuildSubscriptionStatus(guildId, drizzle);
}

export async function checkPremiumAccess(
  userId: string,
  guildId: string | null,
  drizzle: Parameters<typeof getPremiumStatus>[1]
) {
  return getPremiumStatus({ userId, guildId }, drizzle);
}

/**
 * Get detailed subscription status with human-readable labels
 * @param subscription - Base subscription status
 * @returns DetailedSubscriptionStatus with formatted labels
 */
export function getDetailedSubscriptionStatus(
  subscription: SubscriptionStatus
): DetailedSubscriptionStatus {
  let statusKey: DetailedSubscriptionStatus["statusKey"];
  let premiumIndicatorKey: DetailedSubscriptionStatus["premiumIndicatorKey"];
  let expiresInDays: number | null = null;
  let formattedExpiryDate: string | null = null;

  if (!subscription.hasPremium) {
    statusKey = "subscription.status.free";
    premiumIndicatorKey = "subscription.indicator.none";
  } else if (subscription.isLifetime) {
    statusKey = "subscription.status.premium_lifetime";
    premiumIndicatorKey = "subscription.indicator.premium";
  } else if (subscription.expiresAt) {
    const expiryDate = new Date(subscription.expiresAt);
    const msUntilExpiry = expiryDate.getTime() - Date.now();
    expiresInDays = Math.floor(msUntilExpiry / (1000 * 60 * 60 * 24));

    // Use dayjs for consistent date formatting (avoids hydration mismatch)
    formattedExpiryDate = dayjs(expiryDate).format("YYYY-MM-DD");
    statusKey = "subscription.status.premium_expires";

    premiumIndicatorKey =
      expiresInDays <= 7 && expiresInDays > 0
        ? "subscription.indicator.premium_expires_soon"
        : "subscription.indicator.premium";
  } else {
    statusKey = "subscription.status.premium";
    premiumIndicatorKey = "subscription.indicator.premium";
  }

  return {
    ...subscription,
    statusKey,
    premiumIndicatorKey,
    expiresInDays,
    formattedExpiryDate,
  };
}
