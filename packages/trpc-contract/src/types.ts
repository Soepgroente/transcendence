// It defines the context type used in tRPC routers

import { GameState, PlayerAction } from './types/gameState';


export interface Services {
  jwtUtils: {
    sign: (id: number, email: string) => string;
  };
  auth: {
    signUp: (name: string, email: string, password: string) => Promise<any>;
    signIn: (email: string, password: string) => Promise<any>;
  };
  dbServices: {
    findUserById: (id: number) => Promise<any>;
    getMatchPlayers: (
      matchId: number
    ) => Promise<{ id: number; alias: string }[]>;
    playerExistsInMatch: (
      matchId: number,
      playerId: number
    ) => Promise<boolean>;
    matchExists: (matchId: number) => Promise<boolean>;
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
    joinTournament: (tournamentName: string, playerId: number) => Promise<any>;
    listAllTournaments: () => Promise<any>;
    getTournamentPlayers: (tournamentName: string) => Promise<any>;
    startTournament: (tournamentName: string) => Promise<any>;
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
}
