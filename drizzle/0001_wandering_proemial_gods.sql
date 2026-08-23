CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`search_id` text,
	`source_url` text NOT NULL,
	`report_type` text NOT NULL,
	`notes` text,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`search_id`) REFERENCES `searches`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_reports_user_created` ON `reports` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_searches_user_created` ON `searches` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_source_runs_search` ON `source_runs` (`search_id`);