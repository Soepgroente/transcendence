import {
  AnySQLiteColumn,
  int,
  sqliteTable,
  text,
  uniqueIndex,
  check,
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Table for all the user data, I tried to fit in all the requirements for the user management major module,
 * for the match history of each user check below (add more fields like...)
 */
export const usersTable = sqliteTable('users_table', {
  id: int().primaryKey({ autoIncrement: true }),
  alias: text().notNull().unique(),
  password: text().notNull(),
  name: text(),
  email: text().notNull().unique(), // Do we want email to be a mandatory field?
  avatarPath: text().default('avatar_default'),
  backgroundPath: text().default('background_default'),
  // lastLoginTime: int({ mode: 'timestamp' }),
  // lastActivityTime: int({ mode: 'timestamp' }), // we can use this to display last seen status, I understand that online status will come from memory
});

/**
 * Table for all the friendships -> So that we don't have duplicates,
 * logic for bidirectional friendships "A+B is the same as B+A" will be in the backend, if there is need.
 * I chose userId and friendId instead of userA and userB because
 * the distinction and purpose seems easier to understand at first glance.
 */
export const friendshipsTable = sqliteTable(
  'friendships_table',
  {
    id: int().primaryKey({ autoIncrement: true }),
    userId: int()
      .notNull()
      .references((): AnySQLiteColumn => usersTable.id),
    friendId: int()
      .notNull()
      .references((): AnySQLiteColumn => usersTable.id),
  },
  (table) => [
    check('check_befriend_self', sql`${table.userId} != ${table.friendId}`),
    uniqueIndex('unique_friendship_idx').on(table.userId, table.friendId),
  ]
);

/**
 * Tournament table
 */
export const tournamentTable = sqliteTable('tournament_table', {
  id: int().primaryKey({ autoIncrement: true }),
  creator: int()
    .notNull()
    .references(() => usersTable.id),
  name: text().notNull().unique(),
  playerLimit: int().notNull(),
  status: text('status', {
    enum: ['waiting', 'ready', 'ongoing', 'completed'],
  }).default('waiting'),
  createdAt: text().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Tournament players table
 */
export const tournamentPlayersTable = sqliteTable(
  'tournament_participants_table',
  {
    id: int().primaryKey({ autoIncrement: true }),
    tournamentId: int()
      .notNull()
      .references(() => tournamentTable.id),
    playerId: int()
      .notNull()
      .references(() => usersTable.id),
  },
  (table) => [
    uniqueIndex('unique_tournament_participation_idx').on(
      table.tournamentId,
      table.playerId
    ),
  ]
);

/**
 * Match history table
 * tournamentId can be assigned if the match is part of a tournament
 */
export const matchTable = sqliteTable('match_table', {
  id: int().primaryKey({ autoIncrement: true }),
  tournamentId: int().references((): AnySQLiteColumn => tournamentTable.id),
  victor: int().references((): AnySQLiteColumn => usersTable.id), // This field will contain the player with placement 1 after the end of the match
  date: int({ mode: 'timestamp' }).notNull(),
});

/**
 * Data for each match (add more fields...), this can be used for the personal match history of each player
 * by also including the data from the referenced match in the matchTable.
 */
export const singleMatchPlayersTable = sqliteTable(
  'single_match_players_table',
  {
    id: int().primaryKey({ autoIncrement: true }),
    matchId: int()
      .notNull()
      .references((): AnySQLiteColumn => matchTable.id),
    playerId: int()
      .notNull()
      .references((): AnySQLiteColumn => usersTable.id),
    placement: int().notNull().default(0), // This will be the the position that players finish at, only position 1 will be considered a victory
  },
  (table) => [
    uniqueIndex('unique_match_participation_idx').on(
      table.playerId,
      table.matchId
    ),
  ]
);
