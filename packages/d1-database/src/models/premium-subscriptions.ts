import { ColumnType } from "kysely";

export interface PremiumSubscription {
  stripe_customer_id: string;
  discord_user_id: ColumnType<string | null, string | null, string | null>;
  stripe_subscription_id: ColumnType<string | null, string | null, string | null>;
  active: ColumnType<boolean, number | null, number | null>;
  subscription_tier: ColumnType<
    "basic" | "premium" | "free",
    "basic" | "premium" | "free" | null,
    "basic" | "premium" | "free" | null
  >;
  created_at: ColumnType<Date, string, null>;
  updated_at: ColumnType<Date, string, string>;
}
