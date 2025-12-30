import { and, type drizzleD1, eq, sql } from "@dougley/frugal-drizzle/workers";
import * as Schema from "@dougley/frugal-drizzle/workers/schema.js";
import dayjs from "dayjs";
import { EntitlementType } from "discord-api-types/v10";

/**
 * Subscription status for a user or guild
 */
export interface SubscriptionStatus {
  hasPremium: boolean;
  isLifetime: boolean;
  expiresAt: string | null;
  entitlementType: EntitlementType | null;
  isTest: boolean;
}

/**
 * Enhanced subscription status with readable labels
 */
export interface DetailedSubscriptionStatus extends SubscriptionStatus {
  statusLabel: string;
  isPremiumIndicator: string;
  expiresInDays: number | null;
}

/**
 * Feature limits for free and premium tiers
 */
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

/**
 * Check if a user has an active premium subscription
 * @param userId - Discord user ID
 * @param drizzle - Database connection
 * @returns Promise<SubscriptionStatus>
 */
export async function checkUserSubscription(
  userId: string,
  drizzle: ReturnType<typeof drizzleD1>
): Promise<SubscriptionStatus> {
  const currentTime = new Date().toISOString();

  // Query for active user entitlements
  const entitlements = await drizzle
    .select()
    .from(Schema.entitlements)
    .where(
      and(
        eq(Schema.entitlements.userId, userId),
        eq(Schema.entitlements.deleted, false),
        sql`${Schema.entitlements.startsAt} <= ${currentTime}`,
        // Check if it's either a lifetime entitlement (no end date) or hasn't expired yet
        sql`${Schema.entitlements.endsAt} IS NULL OR ${Schema.entitlements.endsAt} > ${currentTime}`
      )
    )
    .limit(1);

  if (entitlements.length === 0) {
    return {
      hasPremium: false,
      isLifetime: false,
      expiresAt: null,
      entitlementType: null,
      isTest: false,
    };
  }

  const entitlement = entitlements[0];
  const isLifetime = !entitlement.endsAt;
  const isTest = entitlement.type === EntitlementType.TestModePurchase;

  return {
    hasPremium: true,
    isLifetime,
    expiresAt: entitlement.endsAt,
    entitlementType: entitlement.type,
    isTest,
  };
}

/**
 * Check if a guild has an active premium subscription
 * @param guildId - Discord guild ID
 * @param drizzle - Database connection
 * @returns Promise<SubscriptionStatus>
 */
export async function checkGuildSubscription(
  guildId: string,
  drizzle: ReturnType<typeof drizzleD1>
): Promise<SubscriptionStatus> {
  const currentTime = new Date().toISOString();

  // Query for active guild entitlements
  const entitlements = await drizzle
    .select()
    .from(Schema.entitlements)
    .where(
      and(
        eq(Schema.entitlements.guildId, guildId),
        eq(Schema.entitlements.deleted, false),
        sql`${Schema.entitlements.startsAt} <= ${currentTime}`,
        // Check if it's either a lifetime entitlement (no end date) or hasn't expired yet
        sql`${Schema.entitlements.endsAt} IS NULL OR ${Schema.entitlements.endsAt} > ${currentTime}`
      )
    )
    .limit(1);

  if (entitlements.length === 0) {
    return {
      hasPremium: false,
      isLifetime: false,
      expiresAt: null,
      entitlementType: null,
      isTest: false,
    };
  }

  const entitlement = entitlements[0];
  const isLifetime = !entitlement.endsAt;
  const isTest = entitlement.type === EntitlementType.TestModePurchase;

  return {
    hasPremium: true,
    isLifetime,
    expiresAt: entitlement.endsAt,
    entitlementType: entitlement.type,
    isTest,
  };
}

/**
 * Check if either a user or guild has premium access
 * Guild subscription takes precedence over user subscription
 * @param userId - Discord user ID
 * @param guildId - Discord guild ID (optional for DMs)
 * @param drizzle - Database connection
 * @returns Promise<SubscriptionStatus>
 */
export async function checkPremiumAccess(
  userId: string,
  guildId: string | null,
  drizzle: ReturnType<typeof drizzleD1>
): Promise<SubscriptionStatus> {
  // First check guild subscription if we're in a guild
  if (guildId) {
    const guildSubscription = await checkGuildSubscription(guildId, drizzle);
    if (guildSubscription.hasPremium) {
      return guildSubscription;
    }
  }

  // Fall back to user subscription
  return await checkUserSubscription(userId, drizzle);
}

/**
 * Get detailed subscription status with human-readable labels
 * @param subscription - Base subscription status
 * @returns DetailedSubscriptionStatus with formatted labels
 */
export function getDetailedSubscriptionStatus(
  subscription: SubscriptionStatus
): DetailedSubscriptionStatus {
  let statusLabel: string;
  let isPremiumIndicator: string;
  let expiresInDays: number | null = null;

  if (!subscription.hasPremium) {
    statusLabel = "Free";
    isPremiumIndicator = "";
  } else if (subscription.isLifetime) {
    statusLabel = "Premium (Lifetime)";
    isPremiumIndicator = "Premium";
  } else if (subscription.expiresAt) {
    // Calculate expiry date
    const expiryDate = new Date(subscription.expiresAt);
    const msUntilExpiry = expiryDate.getTime() - Date.now();
    expiresInDays = Math.floor(msUntilExpiry / (1000 * 60 * 60 * 24));

    // Use dayjs for consistent date formatting (avoids hydration mismatch)
    const formattedDate = dayjs(expiryDate).format("YYYY-MM-DD");
    statusLabel = `Premium (Expires ${formattedDate})`;

    // Check if expiring soon (within 7 days)
    if (expiresInDays <= 7 && expiresInDays > 0) {
      isPremiumIndicator = `Premium (Expires in ${expiresInDays} day${expiresInDays === 1 ? "" : "s"})`;
    } else {
      isPremiumIndicator = "Premium";
    }
  } else {
    statusLabel = "Premium";
    isPremiumIndicator = "Premium";
  }

  // Add test indicator if applicable
  if (subscription.isTest) {
    statusLabel += " [Test]";
    isPremiumIndicator += " [Test]";
  }

  return {
    ...subscription,
    statusLabel,
    isPremiumIndicator,
    expiresInDays,
  };
}

/**
 * Check if a subscription allows a specific feature limit
 * @param subscription - Subscription status
 * @param currentValue - Current value being requested
 * @param freeLimit - Maximum allowed for free tier
 * @param premiumLimit - Maximum allowed for premium tier
 * @returns { allowed: boolean, exceedsLimit: boolean, effectiveLimit: number }
 */
export function checkFeatureLimit(
  subscription: SubscriptionStatus,
  currentValue: number,
  freeLimit: number,
  premiumLimit: number
): { allowed: boolean; exceedsLimit: boolean; effectiveLimit: number } {
  const effectiveLimit = subscription.hasPremium ? premiumLimit : freeLimit;
  const allowed = currentValue <= effectiveLimit;
  const exceedsLimit = !allowed;

  return { allowed, exceedsLimit, effectiveLimit };
}
