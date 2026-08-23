CREATE TABLE `searches` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`sha256` text NOT NULL,
	`width` integer,
	`height` integer,
	`object_key` text NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`searched_sources` integer DEFAULT 0 NOT NULL,
	`available_sources` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `source_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`search_id` text NOT NULL,
	`connector` text NOT NULL,
	`status` text NOT NULL,
	`result_url` text,
	`detail` text,
	`duration_ms` integer NOT NULL,
	FOREIGN KEY (`search_id`) REFERENCES `searches`(`id`) ON UPDATE no action ON DELETE cascade
);
