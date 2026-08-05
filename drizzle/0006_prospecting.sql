CREATE TABLE `prospect_contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`prospect_id` text NOT NULL,
	`role` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`source` text DEFAULT 'avizier' NOT NULL,
	`consent_note` text,
	`informed_at` integer,
	`do_not_contact` integer DEFAULT false NOT NULL,
	`captured_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `prospect_contacts_org_idx` ON `prospect_contacts` (`org_id`);--> statement-breakpoint
CREATE INDEX `prospect_contacts_prospect_idx` ON `prospect_contacts` (`prospect_id`);--> statement-breakpoint
CREATE TABLE `prospect_events` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`prospect_id` text NOT NULL,
	`kind` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`summary` text,
	`outcome` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `prospect_events_org_idx` ON `prospect_events` (`org_id`);--> statement-breakpoint
CREATE INDEX `prospect_events_prospect_idx` ON `prospect_events` (`prospect_id`);--> statement-breakpoint
CREATE TABLE `prospect_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`prospect_id` text NOT NULL,
	`file_key` text NOT NULL,
	`kind` text NOT NULL,
	`taken_at` integer NOT NULL,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `prospect_photos_org_idx` ON `prospect_photos` (`org_id`);--> statement-breakpoint
CREATE INDEX `prospect_photos_prospect_idx` ON `prospect_photos` (`prospect_id`);--> statement-breakpoint
CREATE TABLE `routes` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`park_at_label` text,
	`park_at_lat` real,
	`park_at_lng` real,
	`est_buildings` integer,
	`order_index` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `routes_org_idx` ON `routes` (`org_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_prospects` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`label` text NOT NULL,
	`commune` text DEFAULT 'Giroc' NOT NULL,
	`floors` integer,
	`apartments_est` integer,
	`current_cleaner` text DEFAULT 'unknown' NOT NULL,
	`contact` text,
	`status` text DEFAULT 'de_vizitat' NOT NULL,
	`quoted_price_bani` integer,
	`notes` text,
	`spotted_date` text,
	`converted_building_id` text,
	`route_id` text,
	`street` text,
	`number` text,
	`lat` real,
	`lng` real,
	`entrances` integer,
	`ownership` text DEFAULT 'necunoscut' NOT NULL,
	`access` text DEFAULT 'necunoscut' NOT NULL,
	`incumbent` text DEFAULT 'necunoscut' NOT NULL,
	`incumbent_name` text,
	`assembly_month` integer,
	`first_seen_at` integer,
	`last_touch_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_prospects`("id", "org_id", "label", "commune", "floors", "apartments_est", "current_cleaner", "contact", "status", "quoted_price_bani", "notes", "spotted_date", "converted_building_id", "created_at", "updated_at") SELECT "id", "org_id", "label", "commune", "floors", "apartments_est", "current_cleaner", "contact", "status", "quoted_price_bani", "notes", "spotted_date", "converted_building_id", "created_at", "updated_at" FROM `prospects`;--> statement-breakpoint
DROP TABLE `prospects`;--> statement-breakpoint
ALTER TABLE `__new_prospects` RENAME TO `prospects`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `prospects_org_idx` ON `prospects` (`org_id`);--> statement-breakpoint
CREATE INDEX `prospects_route_idx` ON `prospects` (`route_id`);--> statement-breakpoint
UPDATE `prospects` SET `status` = 'de_vizitat' WHERE `status` = 'spotted';--> statement-breakpoint
UPDATE `prospects` SET `status` = 'contactat' WHERE `status` = 'contacted';--> statement-breakpoint
UPDATE `prospects` SET `status` = 'oferta_trimisa' WHERE `status` = 'quoted';--> statement-breakpoint
UPDATE `prospects` SET `status` = 'castigat' WHERE `status` = 'won';--> statement-breakpoint
UPDATE `prospects` SET `status` = 'pierdut' WHERE `status` = 'lost';--> statement-breakpoint
UPDATE `prospects` SET `first_seen_at` = `created_at` WHERE `first_seen_at` IS NULL;--> statement-breakpoint
UPDATE `prospects` SET `last_touch_at` = `updated_at` WHERE `last_touch_at` IS NULL;
