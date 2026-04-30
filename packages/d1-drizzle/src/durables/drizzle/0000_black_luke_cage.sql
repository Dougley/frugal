CREATE TABLE `Entries` (
	`user_id` text PRIMARY KEY NOT NULL,
	`winner` integer DEFAULT false NOT NULL,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`avatar` text,
	`username` text NOT NULL,
	`discriminator` text
);
--> statement-breakpoint
CREATE INDEX `idx_entries_winner` ON `Entries` (`winner`);