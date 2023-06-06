-- Migration number: 0005 	 2023-06-01T17:49:21.541Z
ALTER TABLE premium_subscriptions
ADD COLUMN subscription_tier_new TEXT CHECK (
    subscription_tier_new IN ('free', 'basic', 'premium')
  ) NOT NULL DEFAULT 'free';
--
UPDATE premium_subscriptions
SET subscription_tier_new = subscription_tier;
--
ALTER TABLE premium_subscriptions DROP COLUMN subscription_tier;
--
ALTER TABLE premium_subscriptions
RENAME COLUMN subscription_tier_new TO subscription_tier;
--
ALTER TABLE premium_subscriptions
ADD COLUMN stripe_subscription_id_new TEXT;
--
UPDATE premium_subscriptions
SET stripe_subscription_id_new = stripe_subscription_id;
--
ALTER TABLE premium_subscriptions DROP COLUMN stripe_subscription_id;
--
ALTER TABLE premium_subscriptions
RENAME COLUMN stripe_subscription_id_new TO stripe_subscription_id;