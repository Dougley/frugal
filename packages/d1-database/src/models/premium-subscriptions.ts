import { ColumnType, Generated } from "kysely";

export interface PremiumSubscription {
  stripe_customer_id: string;
  discord_user_id: string | null;
  stripe_subscription_id: string | null;
  active: ColumnType<boolean, number | null, number | null>;
  subscription_tier: ColumnType<
    "basic" | "premium" | "free",
    "basic" | "premium" | "free" | null,
    "basic" | "premium" | "free" | null
  >;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}
