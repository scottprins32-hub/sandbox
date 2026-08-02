CREATE TABLE `building_obligations` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`building_id` text NOT NULL,
	`obligation_key` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`last_done_at` text,
	`next_due_at` text,
	`responsible` text DEFAULT 'us' NOT NULL,
	`contractor_id` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `building_obligations_org_idx` ON `building_obligations` (`org_id`);--> statement-breakpoint
CREATE INDEX `building_obligations_building_idx` ON `building_obligations` (`building_id`);--> statement-breakpoint
CREATE TABLE `building_services` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`building_id` text NOT NULL,
	`service_line_id` text NOT NULL,
	`price_bani` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`started_at` text,
	`ended_at` text,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `building_services_org_idx` ON `building_services` (`org_id`);--> statement-breakpoint
CREATE INDEX `building_services_building_idx` ON `building_services` (`building_id`);--> statement-breakpoint
CREATE TABLE `compliance_events` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`building_obligation_id` text NOT NULL,
	`kind` text NOT NULL,
	`occurred_at` text NOT NULL,
	`performed_by` text DEFAULT 'scara' NOT NULL,
	`contractor_id` text,
	`cost_bani` integer,
	`document_file_key` text,
	`photo_keys` text,
	`note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `compliance_events_org_idx` ON `compliance_events` (`org_id`);--> statement-breakpoint
CREATE INDEX `compliance_events_bo_idx` ON `compliance_events` (`building_obligation_id`);--> statement-breakpoint
CREATE TABLE `contractors` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`name` text NOT NULL,
	`trade` text NOT NULL,
	`phone` text,
	`email` text,
	`authorisation_note` text,
	`rating` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `contractors_org_idx` ON `contractors` (`org_id`);--> statement-breakpoint
CREATE TABLE `service_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`key` text NOT NULL,
	`name_ro` text NOT NULL,
	`name_en` text NOT NULL,
	`unit` text NOT NULL,
	`default_price_bani` integer NOT NULL,
	`cost_model` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `service_lines_org_idx` ON `service_lines` (`org_id`);--> statement-breakpoint
ALTER TABLE `buildings` ADD `has_gas` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `buildings` ADD `has_lift` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `buildings` ADD `has_playground` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `buildings` ADD `has_basement` integer DEFAULT false NOT NULL;