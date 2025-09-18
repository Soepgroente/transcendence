import { z } from 'zod';
import { createRouter, protectedProcedure, publicProcedure } from '../trpc';
import { tournamentNameSchema, tournamentInput } from '../schemas';

export const tournamentRouter = createRouter({
  create: publicProcedure
    .input(tournamentInput)
    .mutation(async ({ input, ctx }) => {
      const userId = 1; //ctx.userToken?.id;
      return await ctx.services.tournament.createTournament(
        input.name,
        userId,
        input.playerLimit
      );
    }),

  join: protectedProcedure
    .input(z.object({ name: tournamentNameSchema }))
    .input(z.object({ playerId: z.number().positive() })) // temp for testing
    //ctx.userToken?.id;
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.tournament.joinTournament(
        input.name,
        input.playerId
      );
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const tournaments = await ctx.services.tournament.listAllTournaments();
    if (tournaments) return tournaments;
    return [];
  }),

  get: publicProcedure
    .input(z.object({ tournamentId: z.number().positive() }))
    .query(async ({ input, ctx }) => {
      const tournaments = await ctx.services.tournament.listAllTournaments();
      if (tournaments) {
        return (
          tournaments.find(
            (t: { id: number }) => t.id === input.tournamentId
          ) || null
        );
      }
      return null;
    }),

  getPlayers: publicProcedure
    .input(z.object({ name: tournamentNameSchema }))
    .query(async ({ input, ctx }) => {
      const players = await ctx.services.tournament.getTournamentPlayers(
        input.name
      );
      if (!players) {
        throw new Error('No players found for this tournament');
      }
      return players;
    }),

    start : protectedProcedure
    .input(z.object({ name: tournamentNameSchema }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.tournament.startTournament(input.name);
    }),
});
