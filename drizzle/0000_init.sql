CREATE TABLE `buildings` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`client_id` text,
	`label` text NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`locality` text DEFAULT '' NOT NULL,
	`floors` integer DEFAULT 3 NOT NULL,
	`apartments` integer DEFAULT 11 NOT NULL,
	`residents` integer DEFAULT 24 NOT NULL,
	`price_bani` integer DEFAULT 0 NOT NULL,
	`visits_per_week` integer DEFAULT 2 NOT NULL,
	`hours_per_visit` real DEFAULT 1.5 NOT NULL,
	`checklist_template_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `buildings_org_idx` ON `buildings` (`org_id`);--> statement-breakpoint
CREATE TABLE `checklist_items` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`template_id` text NOT NULL,
	`text_ro` text NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `checklist_items_org_idx` ON `checklist_items` (`org_id`);--> statement-breakpoint
CREATE TABLE `checklist_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `checklist_templates_org_idx` ON `checklist_templates` (`org_id`);--> statement-breakpoint
CREATE TABLE `cleaners` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`worker_model` text NOT NULL,
	`hours_per_day` real DEFAULT 4 NOT NULL,
	`student_proof_expiry` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `cleaners_org_idx` ON `cleaners` (`org_id`);--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`contact` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `clients_org_idx` ON `clients` (`org_id`);--> statement-breakpoint
CREATE TABLE `contract_buildings` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`contract_id` text NOT NULL,
	`building_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `contract_buildings_org_idx` ON `contract_buildings` (`org_id`);--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`client_id` text NOT NULL,
	`start_date` text NOT NULL,
	`term_months` integer DEFAULT 12 NOT NULL,
	`notice_days` integer DEFAULT 60 NOT NULL,
	`price_bani` integer DEFAULT 0 NOT NULL,
	`indexation_note` text,
	`next_indexation_date` text,
	`signed_file_key` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `contracts_org_idx` ON `contracts` (`org_id`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`title` text NOT NULL,
	`tag` text DEFAULT 'research' NOT NULL,
	`file_key` text NOT NULL,
	`date` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `documents_org_idx` ON `documents` (`org_id`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`date` text NOT NULL,
	`category` text NOT NULL,
	`amount_bani` integer NOT NULL,
	`building_id` text,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `expenses_org_idx` ON `expenses` (`org_id`);--> statement-breakpoint
CREATE TABLE `issues` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`building_id` text,
	`source` text NOT NULL,
	`description` text NOT NULL,
	`photo_file_key` text,
	`status` text DEFAULT 'open' NOT NULL,
	`resolved_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `issues_org_idx` ON `issues` (`org_id`);--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`locality` text,
	`building_type` text,
	`message` text,
	`source` text DEFAULT 'public_page' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `leads_org_idx` ON `leads` (`org_id`);--> statement-breakpoint
CREATE TABLE `org_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`json` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orgs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`cui` text DEFAULT 'CUI RO00000000' NOT NULL,
	`locale_default` text DEFAULT 'en' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`visit_id` text NOT NULL,
	`file_key` text NOT NULL,
	`taken_at` integer NOT NULL,
	`kind` text DEFAULT 'after' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `photos_org_idx` ON `photos` (`org_id`);--> statement-breakpoint
CREATE INDEX `photos_visit_idx` ON `photos` (`visit_id`);--> statement-breakpoint
CREATE TABLE `prospects` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`label` text NOT NULL,
	`commune` text DEFAULT 'Giroc' NOT NULL,
	`floors` integer,
	`apartments_est` integer,
	`current_cleaner` text DEFAULT 'unknown' NOT NULL,
	`contact` text,
	`status` text DEFAULT 'spotted' NOT NULL,
	`quoted_price_bani` integer,
	`notes` text,
	`spotted_date` text,
	`converted_building_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `prospects_org_idx` ON `prospects` (`org_id`);--> statement-breakpoint
CREATE TABLE `protocols` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`building_id` text NOT NULL,
	`month` text NOT NULL,
	`pdf_file_key` text NOT NULL,
	`generated_at` integer NOT NULL,
	`signed` integer DEFAULT false NOT NULL,
	`signed_file_key` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `protocols_org_idx` ON `protocols` (`org_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`locale` text DEFAULT 'en' NOT NULL,
	`pin` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `users_org_idx` ON `users` (`org_id`);--> statement-breakpoint
CREATE TABLE `visit_items` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`visit_id` text NOT NULL,
	`checklist_item_id` text NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `visit_items_org_idx` ON `visit_items` (`org_id`);--> statement-breakpoint
CREATE INDEX `visit_items_visit_idx` ON `visit_items` (`visit_id`);--> statement-breakpoint
CREATE TABLE `visits` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`building_id` text,
	`cleaner_id` text,
	`type` text DEFAULT 'recurring' NOT NULL,
	`scheduled_date` text NOT NULL,
	`window` text DEFAULT 'am' NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`price_bani` integer,
	`location_label` text,
	`open_offer` integer DEFAULT false NOT NULL,
	`bonus_bani` integer,
	`started_at` integer,
	`finished_at` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `visits_org_idx` ON `visits` (`org_id`);--> statement-breakpoint
CREATE INDEX `visits_org_date_idx` ON `visits` (`org_id`,`scheduled_date`);