import { z } from 'zod';
import { createRouter, protectedProcedure, publicProcedure } from '../trpc';
import { tournamentNameSchema, tournamentInput } from '../schemas';

export const tournamentRouter = createRouter({
  create: protectedProcedure
    .input(tournamentInput)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.tournament.createTournament(
        input.name,
        ctx.userToken.id,
        input.playerLimit
      );
    }),

  join: protectedProcedure
    .input(z.object({ name: tournamentNameSchema }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.tournament.joinTournament(
        input.name,
        ctx.userToken.id
      );
    }),

  list: publicProcedure.query(async ({ ctx }) => {
    const tournaments = await ctx.services.tournament.listAllTournaments();
    if (tournaments) return tournaments;
    return [];
  }),

  get: protectedProcedure
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

  getPlayers: protectedProcedure
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

  start: protectedProcedure
    .input(z.object({ name: tournamentNameSchema }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.tournament.startTournament(input.name);
    }),

  getBracket: protectedProcedure
    .input(z.object({ name: tournamentNameSchema }))
    .query(async ({ input, ctx }) => {
      const bracket = await ctx.services.tournament.getTournamentBracket(
        input.name
      );
      if (!bracket) {
        throw new Error('No bracket found for this tournament');
      }
      return bracket || null;
    }),

  endTournament: protectedProcedure
    .input(
      z.object({ name: tournamentNameSchema, playerId: z.number().positive() })
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.services.tournament.endTournament(
        input.name,
        input.playerId
      );
    }),
});
