// It defines the context type used in tRPC routers

import { GameState, PlayerAction } from './types/gameState';
import { ExistingUser, MatchHistoryEntry, TournamentHistoryEntry, Tournament } from '@repo/db/dbTypes';

export interface Services {
  jwtUtils: {
    sign: (id: number, email: string) => string;
  };
  auth: {
    signUp: (name: string, email: string, password: string) => Promise<any>;
    signIn: (email: string, password: string) => Promise<any>;
  };
  dbServices: {
    findUserById: (id: number) => Promise<ExistingUser | null>;
    getMatchPlayers: (
      matchId: number
    ) => Promise<{ id: number; alias: string }[]>;
    playerExistsInMatch: (
      matchId: number,
      playerId: number
    ) => Promise<boolean>;
    matchExists: (matchId: number) => Promise<boolean>;
    getUserMatchHistory: (userId: number) => Promise<MatchHistoryEntry[]>;
    getUserTournamentHistory: (userId: number) => Promise<TournamentHistoryEntry[]>;
    getUserFriends: (userId: number) => Promise<{ alias: string }[]>;
    getUserAvatar: (userId: number) => Promise<string>;
    updateUserAvatar: (userId: number, newPath: string) => Promise<string>;
    updateUserAlias: (userId: number, newAlias: string) => Promise<string>;
    updateUserEmail: (userId: number, newEmail: string) => Promise<string>;
    updateUserPassword: (userId: number, newPassword: string) => Promise<boolean>;
    createFriendship: (user: number, friend: string) => Promise<boolean>;
  };
  gameStateManager: {
    subscribe: (
      matchId: number,
      callback: (state: GameState) => void
    ) => () => void;
    initGameState: (
      matchId: number,
      players: { id: number; alias: string }[]
    ) => Promise<GameState>;
    getGameState: (matchId: number) => GameState | null;
    handlePlayerAction: (action: PlayerAction) => void;
  };
  tournament: {
    createTournament: (
      name: string,
      userId: number,
      playerLimit: number
    ) => Promise<any>;
    joinTournament: (
      tournamentName: string,
      playerId: number
    ) => Promise<Tournament | null>;
    listAllTournaments: () => Promise<Tournament[]>;
    getTournamentPlayers: (tournamentName: string) => Promise<any>;
    startTournament: (tournamentName: string) => Promise<any>;
    getTournamentBracket: (
      tournamentId: number
    ) => Promise<TournamentBrackets>;
    // endTournament: (tournamentName: string, playerId: number) => Promise<any>;
    subscribeToBracketUpdates: (
      tournamentName: number,
      callback: (bracket: TournamentBrackets) => void
    ) => () => void;
  };
  match: {
    createMultiplayerGame: (
      playerId: number,
      maxPlayers: number
    ) => Promise<any>;
    getAvailableMatches: () => Promise<any>;
    joinMultiplayerGame: (matchId: number, playerId: number) => Promise<any>;
  };
}

export interface Context {
  db: any; // Replace with actual database connection type
  services: Services;
  userToken: UserToken | undefined; // Optional, if logged in
}

export interface UserToken {
  id: number;
  email: string;
}

// generic response type for API responses
export interface Response<T> {
  status: number;
  message: string;
  data: T;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  twofa_enabled: number | null;
}
export interface TournamentPlayer {
  id: number;
  userAlias: string;
  placement: number;
}

export interface TournamentMatches {
  id: number;
  players: TournamentPlayer[];
  victor: TournamentPlayer | null;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
}

export interface TournamentRound {
  round: number;
  name: string;
  matches: TournamentMatches[];
  matchesCompleted: number;
  totalMatches: number;
  status: 'pending' | 'in_progress' | 'completed';
}
export interface TournamentBrackets {
  tournament: Tournament;
  matches: TournamentMatches[];
  rounds: TournamentRound[];
}
