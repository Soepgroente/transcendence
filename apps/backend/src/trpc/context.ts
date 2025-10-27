import { UserToken, type Context } from '@repo/trpc/src/types';
import { jwtUtils, createNewUser, signIn } from '../auth'; // Adjust the import path as necessary
import { type CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { db } from '../db/src/dbClientInit';
import {
  findUserById,
  getMatchPlayers,
  playerExistsInMatch,
  matchExists,
  getUserMatchHistory,
  getUserTournamentHistory,
  getUserFriends,
  getUserAvatar,
  updateUserAvatar,
} from '../db/src/dbFunctions';
import { GameStateManager } from '../game_server/game-state-manager';
import { TournamentService } from '../tournament/tournament';
import { MatchService } from '../tournament/match';

// const disableJWT = false; //for development,
const gameStateManager = new GameStateManager();
const tournamentService = new TournamentService();
const matchService = new MatchService();

/**
 * Parses the JWT token from the Authorization header.
 * @param authHeader - The Authorization header from the request.
 * @returns The JWT token if present, otherwise null.
 */
function parseToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove "Bearer " prefix
}

/**
 * createTRPCContext function to create the context for tRPC.
 * This function is called for each request to set up the context.
 * @param param0 - Fastify context options
 * @param param0.req - Fastify request object
 * @param param0.res - Fastify response object
 * @returns db - Database connection, user - Optional user information
 */
export async function createTRPCContext({
  req,
  res,
}: CreateFastifyContextOptions): Promise<Context> {
  let userToken: UserToken | undefined;
  // 1. HTTP requests (headers)
  const token = parseToken(req.headers.authorization);
  if (token) {
    try {
      userToken = jwtUtils.verify(token) as UserToken;
    } catch (error) {
      console.error('JWT verification failed:', error);
    }
  }
  const services = {
    jwtUtils: {
      sign: jwtUtils.sign,
    },
    auth: {
      signUp: createNewUser,
      signIn: signIn,
    },
    dbServices: {
      findUserById: findUserById,
      getMatchPlayers: getMatchPlayers,
      playerExistsInMatch: playerExistsInMatch,
      matchExists: matchExists,
      getUserMatchHistory: getUserMatchHistory,
      getUserTournamentHistory: getUserTournamentHistory,
      getUserFriends: getUserFriends,
      getUserAvatar: getUserAvatar,
      updateUserAvatar: updateUserAvatar,
    },
    gameStateManager: {
      subscribe: gameStateManager.subscribe.bind(gameStateManager),
      initGameState: gameStateManager.initGameState.bind(gameStateManager),
      getGameState: gameStateManager.getGameState.bind(gameStateManager),
      handlePlayerAction:
        gameStateManager.handlePlayerAction.bind(gameStateManager),
    },
    tournament: tournamentService,
    match: matchService,
  };

  // let user = { id: 1, email: 'example11758728678904@example.com', name: '' }; // default guest user
  // return { db, services, userToken, user};
  return { db, services, userToken };
}