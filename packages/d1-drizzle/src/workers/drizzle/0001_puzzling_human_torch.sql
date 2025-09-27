CREATE TABLE `Entitlements` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`sku_id` text NOT NULL,
	`user_id` text,
	`guild_id` text,
	`type` integer NOT NULL,
	`deleted` integer DEFAULT false NOT NULL,
	`starts_at` text NOT NULL,
	`ends_at` text,
	`consumed` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_entitlements_guild_id` ON `Entitlements` (`guild_id`);--> statement-breakpoint
CREATE INDEX `idx_entitlements_user_id` ON `Entitlements` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_entitlements_sku_id` ON `Entitlements` (`sku_id`);--> statement-breakpoint
CREATE INDEX `idx_entitlements_type` ON `Entitlements` (`type`);--> statement-breakpoint
CREATE INDEX `idx_entitlements_deleted` ON `Entitlements` (`deleted`);--> statement-breakpoint
CREATE INDEX `idx_entitlements_active` ON `Entitlements` (`deleted`,`starts_at`,`ends_at`);--> statement-breakpoint
CREATE TABLE `SubscriptionEvents` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`event_type` text NOT NULL,
	`event_data` text,
	`processed` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`processed_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_subscription_events_entity` ON `SubscriptionEvents` (`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_subscription_events_type` ON `SubscriptionEvents` (`event_type`);--> statement-breakpoint
CREATE INDEX `idx_subscription_events_processed` ON `SubscriptionEvents` (`processed`);--> statement-breakpoint
CREATE INDEX `idx_subscription_events_created` ON `SubscriptionEvents` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_subscription_events_unprocessed` ON `SubscriptionEvents` (`processed`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_subscription_events_type_entity` ON `SubscriptionEvents` (`event_type`,`entity_id`);