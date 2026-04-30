CREATE TABLE `GuildActiveGiveaways` (
	`guild_id` text NOT NULL,
	`durable_object_id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_guild_active_giveaways_guild_id` ON `GuildActiveGiveaways` (`guild_id`);