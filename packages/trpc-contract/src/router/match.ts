import { TRPCError } from '@trpc/server';
import { createRouter, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const matchRouter = createRouter({
  create: protectedProcedure
    .input(z.object({ max_players: z.number().min(2).max(6) }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.match.createMultiplayerGame(
        ctx.userToken.id,
        input.max_players
      );
    }),
  //list all available matches
  list: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.services.match.getAvailableMatches();
  }),
  /**
   * Join an existing multiplayer game.
   * @input { matchId: number } - The ID of the match to join.
   * @returns The updated match information.
   * @throws Error if the player is already in the match or if joining fails.
   */
  joinGame: protectedProcedure
    .input(z.object({ matchId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (
        await ctx.services.dbServices.playerExistsInMatch(
          input.matchId,
          ctx.userToken.id
        )
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Player already in match',
        });
      }
      return await ctx.services.match.joinMultiplayerGame(
        input.matchId,
        ctx.userToken.id
      );
    }),
});
