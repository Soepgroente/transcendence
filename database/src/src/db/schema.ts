import { AnySQLiteColumn, int, sqliteTable, text, uniqueIndex} from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"
import { users } from "./schema_tutorial";

export const usersTable = sqliteTable(
	"users_table", {
		id: int().primaryKey({ autoIncrement: true }),
		alias: text().notNull().unique(),
		name: text(),
		email: text().notNull().unique(),
});

export const matchHistoryTable = sqliteTable("match_history_table", {
	id: int().primaryKey({ autoIncrement: true }),
	mode: text().notNull(),
	victor: text().notNull().references((): AnySQLiteColumn => usersTable.alias),
	createdAt: int({ mode: 'timestamp' }).notNull(),
},
(table) => [
	uniqueIndex("unique_match_idx").on(
		table.createdAt,
		table.mode,
		table.victor,
	)
]);

export const singleMatchParticipantsTable = sqliteTable("single_match_players_table", {
	id: int().primaryKey({ autoIncrement: true }),
	player: text().notNull().references((): AnySQLiteColumn => usersTable.alias),
	score: int().notNull().default(0),
	placement: int().notNull().default(-1),
	matchId: int().notNull().references((): AnySQLiteColumn => matchHistoryTable.id),
},
(table) => [
	uniqueIndex("unique_participation_idx").on(
		table.player,
		table.matchId,
	)
])
