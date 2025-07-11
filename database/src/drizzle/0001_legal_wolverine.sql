ALTER TABLE `user_table` RENAME TO `users_table`;--> statement-breakpoint
DROP INDEX `user_table_alias_unique`;--> statement-breakpoint
DROP INDEX `user_table_email_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_table_alias_unique` ON `users_table` (`alias`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_table_email_unique` ON `users_table` (`email`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_match_history_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mode` text NOT NULL,
	`victor` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`victor`) REFERENCES `users_table`(`alias`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_match_history_table`("id", "mode", "victor", "createdAt") SELECT "id", "mode", "victor", "createdAt" FROM `match_history_table`;--> statement-breakpoint
DROP TABLE `match_history_table`;--> statement-breakpoint
ALTER TABLE `__new_match_history_table` RENAME TO `match_history_table`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `unique_match_idx` ON `match_history_table` (`createdAt`,`mode`,`victor`);--> statement-breakpoint
CREATE TABLE `__new_single_match_players_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`placement` integer DEFAULT -1 NOT NULL,
	`matchId` integer NOT NULL,
	FOREIGN KEY (`player`) REFERENCES `users_table`(`alias`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`matchId`) REFERENCES `match_history_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_single_match_players_table`("id", "player", "score", "placement", "matchId") SELECT "id", "player", "score", "placement", "matchId" FROM `single_match_players_table`;--> statement-breakpoint
DROP TABLE `single_match_players_table`;--> statement-breakpoint
ALTER TABLE `__new_single_match_players_table` RENAME TO `single_match_players_table`;--> statement-breakpoint
CREATE UNIQUE INDEX `unique_participation_idx` ON `single_match_players_table` (`player`,`matchId`);