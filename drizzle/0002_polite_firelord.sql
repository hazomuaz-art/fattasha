CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`search_id` text NOT NULL,
	`connector` text NOT NULL,
	`platform` text NOT NULL,
	`title` text NOT NULL,
	`page_url` text NOT NULL,
	`similarity` real NOT NULL,
	`match_type` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`search_id`) REFERENCES `searches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_matches_search` ON `matches` (`search_id`);--> statement-breakpoint
ALTER TABLE `searches` ADD `public_token` text;--> statement-breakpoint
ALTER TABLE `searches` ADD `public_expires_at` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `searches_public_token_unique` ON `searches` (`public_token`);--> statement-breakpoint
ALTER TABLE `source_runs` ADD `match_count` integer DEFAULT 0 NOT NULL;