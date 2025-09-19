import { TRPCError } from '@trpc/server';
import { createRouter, protectedProcedure, publicProcedure } from '../trpc';
import { PlayerAction, PlayerActionSchema } from '../types/gameState';
import { z } from 'zod';
import { GameState } from '../types/gameState';
import { observable } from '@trpc/server/observable';

export const gameRouter = createRouter({
  /**
   * Initializes a new match with the given matchId.
   * This sets up the initial game state and notifies all subscribed clients.
   * @input { matchId: string } - The ID of the match to initialize.
   * @returns { success: boolean, gameState: GameState } - The result of the initialization and the initial game state.
   */
  //temporary make it publicProcedure
  initializeMatch: publicProcedure
    .input(z.object({ matchId: z.number() }))// match name
    .mutation(async ({ input, ctx }) => {
      try {
        const players = await ctx.services.dbServices.getMatchPlayers(
          input.matchId
        );
        const gameState = ctx.services.gameStateManager.initGameState(
          input.matchId,
          players
        );
        return { success: true, gameState };
      } catch (error) {
        console.error('Error initializing match:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to initialize match',
        });
      }
      // Get real players from database
    }),

  /**
   * Subscription to game state updates.
   * Clients can subscribe to this to receive real-time updates.
   * @input { matchId: string } - The ID of the match to subscribe to.
   * @returns An observable that emits GameState updates.
   */
  subscribeToGameState: protectedProcedure
    .input(z.object({ matchId: z.number() }))
    .subscription(({ input, ctx }) => {
      return observable<GameState>((emit) => {
        console.log(`Client subscribed to game state`);
        // Immediately send the current game state upon subscription
        try {
          const gameState = ctx.services.gameStateManager.getGameState(
            input.matchId
          );
          if (gameState) {
            console.log('emitting initial game state');
            emit.next(gameState);
          } else {
            console.log('there is a game state');
          }
          const unsubscribe = ctx.services.gameStateManager.subscribe(
            input.matchId,
            (gameState) => {
              console.log(
                `Emitting game state update for match ${input.matchId}`
              );
              emit.next(gameState);
            }
          );
          return unsubscribe;
        } catch (err) {
          emit.error(err);
        }
      });
    }),

  /**
   * Handles a player's action within a match.
   * Validates the action and updates the game state accordingly.
   * @input { matchId: string, playerId: string, actionType: string} - The player's action details.
   * @returns { success: boolean } - The result of the action handling.
   */
  sentPlayerAction: protectedProcedure
    .input(PlayerActionSchema)
    .mutation(async ({ ctx, input }) => {
      //here should check if the game is exist
      const action: PlayerAction = {
        ...input,
        // playerId: ctx.userToken.id,
        // playerId: input.playerId, // Temporary hardcoded playerId for testing
      };
      const playerExists = await ctx.services.dbServices.playerExistsInMatch(
        action.matchId,
        action.playerId!
      );
      if (!playerExists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Player does not exist in this match',
        });
      }
      const matchExists = await ctx.services.dbServices.matchExists(
        input.matchId
      );
      if (!matchExists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Match does not exist',
        });
      }
      const gameState = ctx.services.gameStateManager.getGameState(
        input.matchId
      );
      if (!gameState) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Match not found' });
      }
      ctx.services.gameStateManager.handlePlayerAction(action);
      return { success: true };
    }),
});
