CREATE TABLE `facebook_users` (
	`facebook_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_login_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_facebook_users_user` ON `facebook_users` (`user_id`);
