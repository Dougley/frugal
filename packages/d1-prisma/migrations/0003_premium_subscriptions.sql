-- Migration number: 0003 	 2023-05-30T13:27:36.022Z
CREATE TABLE IF NOT EXISTS premium_subscriptions (
  stripe_customer_id TEXT NOT NULL PRIMARY KEY,
  stripe_subscription_id TEXT NOT NULL,
  discord_user_id TEXT,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_tier TEXT CHECK (subscription_tier IN ('basic', 'premium')) NOT NULL DEFAULT 'basic',
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  UNIQUE (discord_user_id)
);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_discord_user_id ON premium_subscriptions (discord_user_id);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_active ON premium_subscriptions (active);