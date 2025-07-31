import { AnySQLiteColumn, int, sqliteTable, text, uniqueIndex, check } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm";

/* Table for all the user data, I tried to fit in all the requirements for the user management major module,
for the match history of each user check below (add more fields like...) */
export const usersTable = sqliteTable(
	"users_table", {
		id: int().primaryKey({ autoIncrement: true }),
		alias: text().notNull().unique(),
    password: text().notNull(),
		name: text(),
		email: text().notNull().unique(),
    avatarPath: text().default('avatar_default'),
    backgroundPath: text().default('background_default'),
    lastLoginTime: int({ mode: 'timestamp' }),
    lastActivityTime: int({ mode: 'timestamp' }), // we can use this to display last seen status, I understand that online status will come from memory
    totalMatches: int().notNull().default(0),
    wins: int().notNull().default(0),
    losses: int().notNull().default(0),
});

/* Table for all the friendships -> So that we don't have duplicates,
logic for bidirectional friendships "A+B is the same as B+A" will be in the backend, if there is need.
I chose userId and friendId instead of userA and userB because
the distinction and purpose seems easier to understand at first glance. */
export const friendshipsTable = sqliteTable(
  "friendships_table", {
    id: int().primaryKey({ autoIncrement: true }),
    userId: int().notNull().references((): AnySQLiteColumn => usersTable.id),
    friendId: int().notNull().references((): AnySQLiteColumn => usersTable.id),
  },
  (table) => [
    check("check_befriend_self", sql`${table.userId} != ${table.friendId}`),
    uniqueIndex("unique_friendship_idx").on(
      table.userId,
      table.friendId
    )
  ]
)

/* Match history table (add more fields like...) */
export const matchHistoryTable = sqliteTable(
  "match_history_table", {
	id: int().primaryKey({ autoIncrement: true }),
	mode: text().notNull(),
	victor: int().notNull().references((): AnySQLiteColumn => usersTable.id),
	createdAt: int({ mode: 'timestamp' }).notNull(),
},
(table) => [
	uniqueIndex("unique_match_idx").on(
		table.createdAt,
		table.mode,
		table.victor,
		)
]);

/* Data for each match (add more fields...), this can be used for the personal match history of each player
by also including the data from the referenced match in the matchHistoryTable */
export const singleMatchParticipantsTable = sqliteTable(
  "single_match_players_table", {
	id: int().primaryKey({ autoIncrement: true }),
	player: int().notNull().references((): AnySQLiteColumn => usersTable.id),
	score: int().notNull().default(0),
	placement: int().notNull().default(-1),
	matchId: int().notNull().references((): AnySQLiteColumn => matchHistoryTable.id),
},
(table) => [
	uniqueIndex("unique_participation_idx").on(
		table.player,
		table.matchId,
		)
]);