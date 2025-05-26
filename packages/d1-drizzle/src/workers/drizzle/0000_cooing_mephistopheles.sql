CREATE TABLE `Entries` (
	`giveaway_id` text NOT NULL,
	`user_id` text NOT NULL,
	`winner` integer DEFAULT false NOT NULL,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`avatar` text,
	`username` text NOT NULL,
	`discriminator` text,
	PRIMARY KEY(`user_id`, `giveaway_id`),
	FOREIGN KEY (`giveaway_id`) REFERENCES `Giveaways`(`message_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_entries_winner` ON `Entries` (`winner`,`giveaway_id`);--> statement-breakpoint
CREATE INDEX `idx_entries_user_id` ON `Entries` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_entries_giveaway_id` ON `Entries` (`giveaway_id`);--> statement-breakpoint
CREATE TABLE `Giveaways` (
	`message_id` text PRIMARY KEY NOT NULL,
	`guild_id` text NOT NULL,
	`channel_id` text NOT NULL,
	`end_time` text NOT NULL,
	`prize` text NOT NULL,
	`winners` integer NOT NULL,
	`entry_count` integer DEFAULT 0 NOT NULL,
	`durable_object_id` text NOT NULL,
	`description` text,
	`host_id` text NOT NULL,
	`state` text DEFAULT 'NEW' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Giveaways_durable_object_id_unique` ON `Giveaways` (`durable_object_id`);--> statement-breakpoint
CREATE INDEX `idx_giveaways_state` ON `Giveaways` (`state`);--> statement-breakpoint
CREATE INDEX `idx_durable_object_id` ON `Giveaways` (`durable_object_id`);--> statement-breakpoint
CREATE INDEX `idx_channel_id` ON `Giveaways` (`channel_id`);--> statement-breakpoint
CREATE INDEX `idx_guild_id` ON `Giveaways` (`guild_id`);