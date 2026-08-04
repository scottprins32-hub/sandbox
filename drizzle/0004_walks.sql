CREATE TABLE `checkpoints` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`building_id` text NOT NULL,
	`label_ro` text NOT NULL,
	`code` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `checkpoints_org_idx` ON `checkpoints` (`org_id`);--> statement-breakpoint
CREATE INDEX `checkpoints_building_idx` ON `checkpoints` (`building_id`);--> statement-breakpoint
CREATE INDEX `checkpoints_code_idx` ON `checkpoints` (`org_id`,`code`);--> statement-breakpoint
CREATE TABLE `control_walks` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`building_id` text NOT NULL,
	`visit_id` text,
	`cleaner_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `control_walks_org_idx` ON `control_walks` (`org_id`);--> statement-breakpoint
CREATE INDEX `control_walks_building_idx` ON `control_walks` (`building_id`);--> statement-breakpoint
CREATE TABLE `walk_checkpoints` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`control_walk_id` text NOT NULL,
	`checkpoint_id` text NOT NULL,
	`scanned_at` integer NOT NULL,
	`condition` text NOT NULL,
	`note` text,
	`photo_keys` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `walk_checkpoints_org_idx` ON `walk_checkpoints` (`org_id`);--> statement-breakpoint
CREATE INDEX `walk_checkpoints_walk_idx` ON `walk_checkpoints` (`control_walk_id`);--> statement-breakpoint
CREATE TABLE `walk_findings` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`control_walk_id` text NOT NULL,
	`checkpoint_id` text,
	`category` text NOT NULL,
	`severity` text NOT NULL,
	`description_ro` text NOT NULL,
	`photo_keys` text,
	`reported_at` integer NOT NULL,
	`reported_to` text DEFAULT 'none' NOT NULL,
	`resolved_at` integer,
	`resolution_note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `walk_findings_org_idx` ON `walk_findings` (`org_id`);--> statement-breakpoint
CREATE INDEX `walk_findings_walk_idx` ON `walk_findings` (`control_walk_id`);