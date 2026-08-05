ALTER TABLE `buildings` ADD `public_code` text;--> statement-breakpoint
ALTER TABLE `buildings` ADD `public_page_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `cleaners` ADD `display_name` text;--> statement-breakpoint
ALTER TABLE `cleaners` ADD `photo_key` text;--> statement-breakpoint
ALTER TABLE `cleaners` ADD `intro_ro` text;--> statement-breakpoint
ALTER TABLE `cleaners` ADD `show_on_notice` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `issues` ADD `category` text DEFAULT 'altele' NOT NULL;--> statement-breakpoint
ALTER TABLE `issues` ADD `acknowledged_at` integer;--> statement-breakpoint
ALTER TABLE `issues` ADD `reporter_contact` text;