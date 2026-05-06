CREATE TABLE `GiveawayTemplates` (
	`id` text PRIMARY KEY NOT NULL,
	`guild_id` text NOT NULL,
	`name` text NOT NULL,
	`prize` text,
	`winners` integer DEFAULT 1 NOT NULL,
	`duration_ms` integer NOT NULL,
	`description` text,
	`channel_id` text,
	`use_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_templates_guild_id` ON `GiveawayTemplates` (`guild_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_templates_guild_name` ON `GiveawayTemplates` (`guild_id`,`name`);--> statement-breakpoint
CREATE TABLE `GuildSettings` (
	`guild_id` text PRIMARY KEY NOT NULL,
	`default_channel_id` text,
	`ping_role_id` text,
	`required_roles` text DEFAULT '[]',
	`accent_color` text DEFAULT '#4c6ef5',
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
