import { count, eq, isNull } from 'drizzle-orm';
import { db } from '../db/src/dbClientInit';
import { matchTable, singleMatchPlayersTable } from '@repo/db/dbSchema';
import { TRPCError } from '@trpc/server';
import { AvailableMatch } from '@repo/db/dbTypes';
import { TournamentService } from './tournament';
import { GameStateManager } from '../game_server/game-state-manager';
import { getMatchPlayers } from '../db/src';

export class MatchService {
  private static instance: MatchService;

  static getInstance(): MatchService {
    if (!MatchService.instance) {
      MatchService.instance = new MatchService();
    }
    return MatchService.instance;
  }

  async createMultiplayerGame(playerId: number, maxPlayers: number) {
    // Logic to create a match in the database
    const [match] = await db
      .insert(matchTable)
      .values({
        tournamentId: null,
        maxPlayers: maxPlayers,
        victor: null,
      })
      .returning();

    // add first player
    await db.insert(singleMatchPlayersTable).values({
      matchId: match.id,
      playerId: playerId,
      placement: 0,
    });
    return match;
  }

  /**
   * retrieve a match by its ID, including the current player count.
   * @param matchId ID of the match to find
   * @returns The match with player count
   * @throws TRPCError if match not found
   */
  static async findMatchById(matchId: number): Promise<AvailableMatch> {
    const [match] = await db
      .select({
        id: matchTable.id,
        maxPlayers: matchTable.maxPlayers,
        victor: matchTable.victor,
        tournamentId: matchTable.tournamentId,
        date: matchTable.date,
        playerCount: count(singleMatchPlayersTable.id).as('playerCount'),
        status: matchTable.status,
      })
      .from(matchTable)
      .where(eq(matchTable.id, matchId))
      .leftJoin(
        singleMatchPlayersTable,
        eq(matchTable.id, singleMatchPlayersTable.matchId)
      )
      .groupBy(matchTable.id);
    if (!match)
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Match not found',
      });
    return match;
  }

    async joinMultiplayerGame(matchId: number, playerId: number): Promise<AvailableMatch> {
    const match = await MatchService.findMatchById(matchId);

    if (match.playerCount >= match.maxPlayers) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Match is full',
      });
    }

    await db.insert(singleMatchPlayersTable).values({
      matchId: matchId,
      playerId: playerId,
      placement: 0,
    });
    if (match.playerCount + 1 === match.maxPlayers) {
      match.status = 'ready';
      const matchPlayers = await getMatchPlayers(matchId);
      await GameStateManager.getInstance().initGameState(matchId, matchPlayers);

    }
    return match;
  }

  /**
   * List all available matches with player counts.
   * @returns List of available matches with player counts
   * A match is considered available if it has no victor (not finished)
   * and has less than the maximum number of players.
   * If a match is full (playerCount == maxPlayers), its status is set to 'ready'.
   * Otherwise, the status from the database is used.
   */
  async getAvailableMatches(): Promise<AvailableMatch[]> {
    try {
      const matches = await db
        .select({
          id: matchTable.id,
          tournamentId: matchTable.tournamentId,
          maxPlayers: matchTable.maxPlayers,
          victor: matchTable.victor,
          date: matchTable.date,
          playerCount: count(singleMatchPlayersTable.id).as('playerCount'),
          status: matchTable.status,
        })
        .from(matchTable)
        .leftJoin(
          singleMatchPlayersTable,
          eq(matchTable.id, singleMatchPlayersTable.matchId)
        )
        .where(isNull(matchTable.victor))
        .groupBy(matchTable.id);

      return matches.map((match) => ({
        id: match.id,
        playerCount: match.playerCount,
        victor: match.victor,
        tournamentId: match.tournamentId,
        maxPlayers: match.maxPlayers,
        status: match.maxPlayers === match.playerCount ? 'ready' : match.status,
      }));
    } catch (error) {
      console.error('error getting matches:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'error getting available matches',
      });
    }
  }

  static async updateMatchStatus(
    matchId: number,
    status: 'waiting' | 'playing' | 'finished',
    winnerId?: number
  ) {
    await db
      .update(matchTable)
      .set({ status: status, victor: winnerId ?? null })
      .where(eq(matchTable.id, matchId))
      .execute();

    const match = await MatchService.findMatchById(matchId);

    if (
      status === 'finished' &&
      match.tournamentId &&
      winnerId &&
      tournamentService
    ) {
      await tournamentService.handleTournamentMatchCompletion(
        match.tournamentId,
        matchId,
        winnerId
      );
    }
    return match;
  }
}

const tournamentService = TournamentService.getInstance();

export async function updateMatchStatus(
  matchId: number,
  status: 'waiting' | 'playing' | 'finished',
  winnerId?: number
) {
  await db
    .update(matchTable)
    .set({ status: status, victor: winnerId ?? null })
    .where(eq(matchTable.id, matchId));

  const match = await MatchService.findMatchById(matchId);

  if (
    status === 'finished' &&
    match.tournamentId &&
    winnerId &&
    tournamentService
  ) {
    await tournamentService.handleTournamentMatchCompletion(
      match.tournamentId,
      matchId,
      winnerId
    );
  }
  return match;
}
