CREATE TABLE `annual_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`building_id` text NOT NULL,
	`year` integer NOT NULL,
	`pdf_file_key` text NOT NULL,
	`generated_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `annual_reports_org_idx` ON `annual_reports` (`org_id`);--> statement-breakpoint
CREATE INDEX `annual_reports_building_idx` ON `annual_reports` (`building_id`);--> statement-breakpoint
CREATE TABLE `building_elements` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`building_id` text NOT NULL,
	`key` text NOT NULL,
	`name_ro` text NOT NULL,
	`category` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `building_elements_org_idx` ON `building_elements` (`org_id`);--> statement-breakpoint
CREATE INDEX `building_elements_building_idx` ON `building_elements` (`building_id`);--> statement-breakpoint
CREATE TABLE `element_assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`building_element_id` text NOT NULL,
	`assessed_at` text NOT NULL,
	`assessed_by` text DEFAULT '' NOT NULL,
	`score` integer NOT NULL,
	`note_ro` text,
	`photo_keys` text,
	`source` text DEFAULT 'annual' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `element_assessments_org_idx` ON `element_assessments` (`org_id`);--> statement-breakpoint
CREATE INDEX `element_assessments_element_idx` ON `element_assessments` (`building_element_id`);--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`building_id` text NOT NULL,
	`occurred_at` text NOT NULL,
	`kind` text NOT NULL,
	`description_ro` text NOT NULL,
	`related_type` text,
	`related_id` text,
	`photo_keys` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `journal_entries_org_idx` ON `journal_entries` (`org_id`);--> statement-breakpoint
CREATE INDEX `journal_entries_building_idx` ON `journal_entries` (`building_id`);