import type { drizzleD1 } from "@dougley/frugal-drizzle/workers";
import {
  and,
  desc,
  eq,
  gt,
  isNull,
  lte,
  or,
  Schema,
} from "@dougley/frugal-drizzle/workers";
import { EntitlementType } from "discord-api-types/v10";

import type { PremiumCheckInput, SubscriptionStatus } from "./types";

function activeEntitlementWhere({
  currentTime,
  guildId,
  userId,
}: {
  currentTime: string;
  userId?: string;
  guildId?: string;
}) {
  const base = [
    eq(Schema.entitlements.deleted, false),
    lte(Schema.entitlements.startsAt, currentTime),
    or(
      isNull(Schema.entitlements.endsAt),
      gt(Schema.entitlements.endsAt, currentTime)
    ),
  ];

  if (guildId) {
    return and(...base, eq(Schema.entitlements.guildId, guildId));
  }

  if (userId) {
    return and(...base, eq(Schema.entitlements.userId, userId));
  }

  throw new Error("Must provide either guildId or userId");
}

export function compareEntitlementsForSelection(
  left: {
    id: string;
    endsAt: string | null;
    updatedAt: string;
    createdAt: string;
  },
  right: {
    id: string;
    endsAt: string | null;
    updatedAt: string;
    createdAt: string;
  }
) {
  const leftLifetime = left.endsAt == null;
  const rightLifetime = right.endsAt == null;

  if (leftLifetime !== rightLifetime) return leftLifetime ? -1 : 1;

  if (!leftLifetime && !rightLifetime) {
    // Later end-time wins.
    if (left.endsAt !== right.endsAt) {
      const leftEndsAt = left.endsAt;
      const rightEndsAt = right.endsAt;

      if (leftEndsAt == null || rightEndsAt == null) {
        return leftEndsAt == null ? -1 : 1;
      }

      return leftEndsAt > rightEndsAt ? -1 : 1;
    }
  }

  if (left.updatedAt !== right.updatedAt) {
    return left.updatedAt > right.updatedAt ? -1 : 1;
  }

  if (left.createdAt !== right.createdAt) {
    return left.createdAt > right.createdAt ? -1 : 1;
  }

  if (left.id !== right.id) return left.id > right.id ? -1 : 1;

  return 0;
}

function entitlementSelectionOrderBy() {
  // Deterministic ordering in database:
  // - Lifetime entitlements first (endsAt IS NULL)
  // - Otherwise furthest endsAt
  // - Tie break: updatedAt, createdAt, id
  return [
    desc(isNull(Schema.entitlements.endsAt)),
    desc(Schema.entitlements.endsAt),
    desc(Schema.entitlements.updatedAt),
    desc(Schema.entitlements.createdAt),
    desc(Schema.entitlements.id),
  ];
}

async function getSubscriptionStatusForSubject(
  subject: { userId?: string; guildId?: string },
  drizzle: ReturnType<typeof drizzleD1>
): Promise<SubscriptionStatus> {
  const currentTime = new Date().toISOString();

  const source = subject.guildId ? "guild" : subject.userId ? "user" : "none";

  const selector = drizzle
    .select({
      id: Schema.entitlements.id,
      skuId: Schema.entitlements.skuId,
      type: Schema.entitlements.type,
      endsAt: Schema.entitlements.endsAt,
    })
    .from(Schema.entitlements)
    .where(
      activeEntitlementWhere({
        currentTime,
        guildId: subject.guildId,
        userId: subject.userId,
      })
    )
    .orderBy(...entitlementSelectionOrderBy())
    .limit(1);

  const entitlements = await selector;

  if (entitlements.length === 0) {
    return {
      hasPremium: false,
      source: "none",
      isLifetime: false,
      expiresAt: null,
      entitlementType: null,
      entitlementId: null,
      skuId: null,
      isTest: false,
    };
  }

  const entitlement = entitlements[0];
  const isLifetime = entitlement.endsAt == null;
  const entitlementType = entitlement.type as EntitlementType;
  const isTest = entitlementType === EntitlementType.TestModePurchase;

  return {
    hasPremium: true,
    source,
    isLifetime,
    expiresAt: entitlement.endsAt ?? null,
    entitlementType,
    entitlementId: entitlement.id,
    skuId: entitlement.skuId,
    isTest,
  };
}

export async function getUserSubscriptionStatus(
  userId: string,
  drizzle: ReturnType<typeof drizzleD1>
): Promise<SubscriptionStatus> {
  return getSubscriptionStatusForSubject({ userId }, drizzle);
}

export async function getGuildSubscriptionStatus(
  guildId: string,
  drizzle: ReturnType<typeof drizzleD1>
): Promise<SubscriptionStatus> {
  return getSubscriptionStatusForSubject({ guildId }, drizzle);
}

export async function getPremiumStatus(
  input: PremiumCheckInput,
  drizzle: ReturnType<typeof drizzleD1>
): Promise<SubscriptionStatus> {
  // User-first, then guild
  const userStatus = await getUserSubscriptionStatus(input.userId, drizzle);
  if (userStatus.hasPremium) return userStatus;

  if (input.guildId) {
    return getGuildSubscriptionStatus(input.guildId, drizzle);
  }

  return userStatus;
}
