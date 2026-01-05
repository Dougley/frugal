import type { EntitlementType } from "discord-api-types/v10";

export type PremiumSource = "guild" | "user" | "none";

export interface SubscriptionStatus {
  hasPremium: boolean;
  source: PremiumSource;
  isLifetime: boolean;
  expiresAt: string | null;
  entitlementType: EntitlementType | null;
  entitlementId: string | null;
  skuId: string | null;
  isTest: boolean;
}

export type PremiumCheckInput = {
  userId: string;
  guildId: string | null;
};
