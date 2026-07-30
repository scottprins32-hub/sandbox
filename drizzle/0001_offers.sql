CREATE TABLE `offers` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`prospect_id` text,
	`client_name` text NOT NULL,
	`building_label` text NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`floors` integer DEFAULT 3 NOT NULL,
	`apartments` integer DEFAULT 11 NOT NULL,
	`residents` integer DEFAULT 24 NOT NULL,
	`visits_per_week` integer DEFAULT 2 NOT NULL,
	`hours_per_visit` real DEFAULT 1.5 NOT NULL,
	`price_bani` integer NOT NULL,
	`valid_until` text NOT NULL,
	`pdf_file_key` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `offers_org_idx` ON `offers` (`org_id`);