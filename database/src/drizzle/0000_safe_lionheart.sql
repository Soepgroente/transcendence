CREATE TABLE `match_history_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mode` text NOT NULL,
	`victor` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`victor`) REFERENCES `user_table`(`alias`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_match_idx` ON `match_history_table` (`createdAt`,`mode`,`victor`);--> statement-breakpoint
CREATE TABLE `single_match_players_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`placement` integer DEFAULT -1 NOT NULL,
	`matchId` integer NOT NULL,
	FOREIGN KEY (`player`) REFERENCES `user_table`(`alias`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`matchId`) REFERENCES `match_history_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_participation_idx` ON `single_match_players_table` (`player`,`matchId`);--> statement-breakpoint
CREATE TABLE `user_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`alias` text NOT NULL,
	`name` text,
	`email` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_table_alias_unique` ON `user_table` (`alias`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_table_email_unique` ON `user_table` (`email`);