CREATE TABLE `audits` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text DEFAULT 'admin@demo' NOT NULL,
	`action` text NOT NULL,
	`entity_type` text DEFAULT 'review' NOT NULL,
	`entity_id` text NOT NULL,
	`payload_json` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`address` text,
	`channel` text(50) NOT NULL,
	`status` text(20) DEFAULT 'active' NOT NULL,
	`avg_rating` real DEFAULT 0,
	`review_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`listing_name` text NOT NULL,
	`channel` text(20) NOT NULL,
	`type` text(20) NOT NULL,
	`status` text(20) NOT NULL,
	`overall_rating` real,
	`categories_json` text,
	`submitted_at` text NOT NULL,
	`guest_name` text NOT NULL,
	`public_review` text NOT NULL,
	`selected_for_web` integer DEFAULT 0 NOT NULL,
	`note` text,
	`tags_json` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `listings_slug_unique` ON `listings` (`slug`);--> statement-breakpoint
CREATE INDEX `reviews_listingId_idx` ON `reviews` (`listing_id`);--> statement-breakpoint
CREATE INDEX `reviews_channel_idx` ON `reviews` (`channel`);--> statement-breakpoint
CREATE INDEX `reviews_submittedAt_idx` ON `reviews` (`submitted_at`);--> statement-breakpoint
CREATE INDEX `reviews_selectedForWeb_idx` ON `reviews` (`selected_for_web`);