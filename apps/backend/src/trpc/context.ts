import { type Context } from '@repo/trpc/src/types';
import { jwtUtils } from '../auth/jwt'; // Adjust the import path as necessary
import { createNewUser, signIn } from '../auth/';
import { type CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { db } from '../db/src/dbClientInit';
import {
  getMatchPlayers,
  playerExistsInMatch,
  matchExists,
} from '../db/src/dbFunctions';
import { GameStateManager } from '../game/game-state-manager';
import { TournamentService } from '../tournament/tournament';

const disableJWT = true; //for development,
const gameStateManager = new GameStateManager();
const tournamentService = new TournamentService();
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
  let userToken = null;
  const token = parseToken(req.headers.authorization);
  if (token && !disableJWT) {
    try {
      userToken = jwtUtils.verify(token); // Verify the JWT token
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
      // Add database-related services here
      getMatchPlayers: getMatchPlayers,
      playerExistsInMatch: playerExistsInMatch,
      matchExists: matchExists,
    },
    gameStateManager: {
      subscribe: gameStateManager.subscribe.bind(gameStateManager),
      initGameState: gameStateManager.initGameState.bind(gameStateManager),
      getGameState: gameStateManager.getGameState.bind(gameStateManager),
      handlePlayerAction:
        gameStateManager.handlePlayerAction.bind(gameStateManager),
    },
    tournament: tournamentService,
  };
  return { db, services, userToken };
}
