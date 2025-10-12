import {
  tournamentTable,
  usersTable,
  tournamentPlayersTable,
  friendshipsTable,
  singleMatchPlayersTable,
  matchTable,
} from './dbSchema';

/**
 * Inferred types from the database schema
 * these types represent the shape of the data in each table
 * returning the type of a row in the respective table
 * e.g., ExistingUser represents a row in the usersTable
 */
export type ExistingUser = typeof usersTable.$inferSelect;
export type Tournament = typeof tournamentTable.$inferSelect;
export type TournamentPlayer = typeof tournamentPlayersTable.$inferSelect;
export type Friendship = typeof friendshipsTable.$inferSelect;
export type Match = typeof matchTable.$inferSelect;
export type MatchParticipation = typeof singleMatchPlayersTable.$inferSelect;

export interface MatchHistoryEntry {
  id: number;
  date: string | null;
  placement: number;
  participants: string[];
  isWin: boolean;
}

export interface TournamentHistoryEntry {
  id: number;
  date: string | null;
  tournamentName: string;
  playerLimit: number;
  isWin: boolean;
}

export interface AvailableMatch {
  id: number;
  maxPlayers: number;
  victor: number | null;
  tournamentId: number | null;
  playerCount: number;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
}