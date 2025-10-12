import { and, eq } from 'drizzle-orm';
import { db } from '../db/src/dbClientInit';
import {
  tournamentPlayersTable,
  tournamentTable,
  matchTable,
  usersTable,
  singleMatchPlayersTable,
} from '@repo/db/dbSchema';
import { Match, Tournament } from '@repo/db/dbTypes';
import { TRPCError } from '@trpc/server';
import { User, TournamentBrackets } from '@repo/trpc/src/types';

async function insertTournament(
  name: string,
  ownerId: number,
  playerLimit: number
): Promise<Tournament> {
  try {
    const [tournament] = await db
      .insert(tournamentTable)
      .values({
        creator: ownerId,
        name: name,
        playerLimit: playerLimit,
        status: 'waiting',
      })
      .returning();
    return tournament;
  } catch (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create tournament',
      cause: error,
    });
  }
}

async function isPlayerInTournament(
  tournamentId: number,
  playerId: number
): Promise<boolean> {
  const [exist] = await db
    .select()
    .from(tournamentPlayersTable)
    .where(
      and(
        eq(tournamentPlayersTable.tournamentId, tournamentId),
        eq(tournamentPlayersTable.playerId, playerId)
      )
    );
  return !!exist;
}

/**
 * Get all players in a tournament
 * @param tournamentId
 * @returns array of players as User[]
 */
async function tournamentPlayers(tournamentId: number): Promise<User[]> {
  const result = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.alias,
    })
    .from(tournamentPlayersTable)
    .innerJoin(usersTable, eq(tournamentPlayersTable.playerId, usersTable.id))
    .where(eq(tournamentPlayersTable.tournamentId, tournamentId));
  return result;
}

async function addPlayerToTournament(tournamentId: number, playerId: number) {
  await db
    .insert(tournamentPlayersTable)
    .values({
      playerId: playerId,
      tournamentId: tournamentId,
    })
    .returning();
}

async function tournamentExists(tournamentName: string): Promise<Tournament> {
  const [tournament] = await db
    .select()
    .from(tournamentTable)
    .where(eq(tournamentTable.name, tournamentName));
  if (!tournament) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Tournament not found',
    });
  }
  return tournament;
}

async function getTournamentMatches(tournamentId: number): Promise<Match[]> {
  return db
    .select()
    .from(matchTable)
    .where(eq(matchTable.tournamentId, tournamentId))
    .orderBy(matchTable.id);
}
/**
 * Tournament service class
 * This class contains methods to create, join, list tournaments and get tournament players
 */
export class TournamentService {
  async createTournament(name: string, userId: number, playerLimit: number) {
    try {
      const tournament = await insertTournament(name, userId, playerLimit);
      console.log('Tournament created:', tournament);
      return tournament;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create tournament',
        cause: error,
      });
    }
  }

  /**
   * Join a tournament by name, there is some checks before adding the player to the tournament
   * 1. Check if the tournament exists
   * 2. Check if the tournament is still waiting for players
   * 3. Check if the player is already in the tournament
   * 4. Add the player to the tournament
   * 5. If the tournament is full, update the status to 'ready'
   * @param tournamentName
   * @param playerId
   */
  async joinTournament(tournamentName: string, playerId: number) {
    const tournament = await tournamentExists(tournamentName);
    if (tournament.status !== 'waiting') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Tournament already started',
      });
    }
    const isInTournament = await isPlayerInTournament(tournament.id, playerId);
    console.log('Is player in THIS tournament:', isInTournament);
    if (isInTournament) {
      return tournament;
    }
    try {
      await addPlayerToTournament(tournament.id, playerId);
      const players = await tournamentPlayers(tournament.id);
      if (players.length >= tournament.playerLimit) {
        // automatically start the tournament when full
        // await this.startTournament(tournamentName);
        console.log("Tournament is full, updating status to 'ready'");
        await db
          .update(tournamentTable)
          .set({ status: 'ready' })
          .where(eq(tournamentTable.name, tournamentName));
      }
      return tournament;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error adding player to tournament',
        cause: error,
      });
    }
  }

  // List all tournaments in the database
  async listAllTournaments(): Promise<Tournament[]> {
    try {
      return await db.select().from(tournamentTable);
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch tournaments',
        cause: error,
      });
    }
  }

  //TODO: modify return type should return players info[]
  //not sure if this function is needed
  async getTournamentPlayers(tournamentName: string) {
    const tournament = await tournamentExists(tournamentName);
    try {
      return await tournamentPlayers(tournament.id);
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch tournament players',
        cause: error,
      });
    }
  }

  /**
   * this function creates a match for a tournament and adds players to the match
   * @param tournamentId
   * @param playerIds
   * @returns
   */
  async matchMaking(tournamentId: number, playerIds: number[]): Promise<Match> {
    try {
      const [match] = await db
        .insert(matchTable)
        .values({
          tournamentId: tournamentId,
          maxPlayers: 2,
          victor: null,
        })
        .returning();
      // add players to match
      await db.insert(singleMatchPlayersTable).values([
        {
          matchId: match.id,
          playerId: playerIds[0],
          placement: 0,
        },
        {
          matchId: match.id,
          playerId: playerIds[1],
          placement: 0,
        },
      ]);
      return match;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create match',
        cause: error,
      });
    }
  }

  /**
   * Start a tournament by name, this will create the first round of matches and assign players to matches
   * @param tournamentName
   * @returns
   */
  async startTournament(tournamentName: string) {
    const tournament = await tournamentExists(tournamentName);
    if (tournament.status === 'ongoing') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Tournament already started',
      });
    }
    if (tournament.status !== 'ready') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Tournament not ready to start',
      });
    }
    try {
      //get players in the tournament
      const players = await tournamentPlayers(tournament.id);
      if (players.length < tournament.playerLimit) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Need ${tournament.playerLimit} players to start the tournament`,
        });
      }
      //need to create matches and assign players to matches
      const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

      const matchCount = tournament.playerLimit / 2;
      const createdMatches = [];

      for (let i = 0; i < matchCount; i++) {
        const player1 = shuffledPlayers[i * 2];
        const player2 = shuffledPlayers[i * 2 + 1];

        const match = await this.matchMaking(tournament.id, [
          player1.id,
          player2.id,
        ]);
        createdMatches.push({
          matchId: match.id,
          players: [player1, player2],
        });
      }

      await db
        .update(tournamentTable)
        .set({ status: 'ongoing' })
        .where(eq(tournamentTable.name, tournamentName));
      return createdMatches;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Retrieves the bracket for a tournament, including all matches and their participating players.
   * Each match includes its ID, players (with user alias and placement), victor (if decided), and status.
   *
   * @param tournamentName - The name of the tournament to fetch the bracket for.
   * @returns An object containing tournament details and an array of matches with player information.
   */
  async getTournamentBracket(
    tournamentName: string
  ): Promise<TournamentBrackets> {
    const tournament = await tournamentExists(tournamentName);

    const matches = await getTournamentMatches(tournament.id);
    if (tournament === null) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No bracket found for this tournament',
      });
    }

    const matchesWithPlayers = await Promise.all(
      matches.map(async (match) => {
        const players = await db
          .select({
            id: usersTable.id,
            userAlias: usersTable.alias,
            placement: singleMatchPlayersTable.placement,
          })
          .from(singleMatchPlayersTable)
          .innerJoin(
            usersTable,
            eq(singleMatchPlayersTable.playerId, usersTable.id)
          )
          .where(eq(singleMatchPlayersTable.matchId, match.id));

        const winner = match.victor
          ? (players.find((p) => p.id === match.victor) ?? null)
          : null;
        return {
          id: match.id,
          players: players,
          victor: winner,
          status: match.status,
        };
      })
    );
    return { tournament: tournament, matches: matchesWithPlayers };
  }

  async endTournament(tournamentName: string, playerId: number) {
    const tournament = await tournamentExists(tournamentName);
    if (tournament.status !== 'ongoing' && tournament.status !== 'ready') {
      return null;
    }
    const isInTournament = await isPlayerInTournament(tournament.id, playerId);
    if (!isInTournament) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You are not a participant of this tournament',
      });
    }
    try {
      await db
        .update(tournamentTable)
        .set({ status: 'completed', victor: playerId })
        .where(eq(tournamentTable.name, tournamentName));
      return { message: 'Tournament ended successfully' };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to end tournament',
        cause: error,
      });
    }
  }
}
