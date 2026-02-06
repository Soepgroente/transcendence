import { and, eq } from 'drizzle-orm';
import { db } from '../db/src';
import {
  tournamentPlayersTable,
  tournamentTable,
  matchTable,
  usersTable,
  singleMatchPlayersTable,
} from '@repo/db/dbSchema';
import { Match, Tournament } from '@repo/db/dbTypes';
import { TRPCError } from '@trpc/server';
import {
  User,
  TournamentBrackets,
  TournamentMatches,
  TournamentRound,
} from '@repo/trpc';
import { EventEmitter } from 'events';

async function insertTournament(
  name: string,
  ownerId: number,
  playerLimit: number
): Promise<Tournament> {
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
      twofa_enabled: usersTable.twofa_enabled,
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

async function tournamentById(id: number) {
  const [tournament] = await db
    .select()
    .from(tournamentTable)
    .where(eq(tournamentTable.id, id));
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
export class TournamentService extends EventEmitter {
  private static instance: TournamentService;

  private bracketState = new Map<number, TournamentBrackets>();

  constructor() {
    super();
    this.setMaxListeners(20);
  }

  static getInstance(): TournamentService {
    if (!TournamentService.instance) {
      TournamentService.instance = new TournamentService();
    }
    return TournamentService.instance;
  }

  subscribeToBracketUpdates(
    tournamentId: number,
    callback: (state: TournamentBrackets) => void
  ) {
    const stateName = `bracket:${tournamentId}`;
    this.on(stateName, callback);
    return () => {
      this.off(stateName, callback);
    };
  }

  private async emitBracketUpdate(tournamentId: number) {
    const bracket = await this.getTournamentBracket(tournamentId);
    this.emit(`bracket:${tournamentId}`, bracket);
  }
  cleanupCompletedTournament(tournamentId: number) {
    this.bracketState.delete(tournamentId);
  }

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
      if (players.length === tournament.playerLimit) {
        console.log("Tournament is full, updating status to 'ready'");
        await db
          .update(tournamentTable)
          .set({ status: 'ready' })
          .where(eq(tournamentTable.name, tournamentName));

        this.startTournament(tournamentName);
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
   * also update the tournament status to 'ongoing'
   * and emit the bracket update to subscribers
   * @param tournamentName
   * @returns array of created matches with player info
   */
  //TODO: if this is a private method reduce valiadation checks
  //also return not needed if its auto started
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
   * Get the tournament bracket including matches and their players.
   * This method first checks if the bracket is cached in memory.
   * If not, it fetches the tournament and its matches from the database,
   * constructs the bracket structure, caches it, and returns it.
   * The bracket includes rounds calculated based on the number of players and match completions.
   * @param tournamentName - The name of the tournament to fetch the bracket for.
   * @returns A promise that resolves to the TournamentBrackets object containing tournament details and matches.
   * @throws TRPCError if the tournament is not found or if there is an internal server error.
   */
  async getTournamentBracket(
    tournamentId: number
  ): Promise<TournamentBrackets> {
    let bracket = this.bracketState.get(tournamentId);
    const tournament = await tournamentById(tournamentId);
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
    const rounds = this.calculateUpdateRounds(
      tournament.playerLimit,
      matchesWithPlayers
    );
    bracket = {
      tournament,
      matches: matchesWithPlayers,
      rounds: rounds,
    };
    this.bracketState.set(tournament.id, bracket);

    return bracket;
  }

  private async endTournament(tournamentName: string, winnerId: number) {
    const tournament = await tournamentExists(tournamentName);
    if (tournament.status !== 'ongoing') {
      return null;
    }
    const bracket = this.bracketState.get(tournament.id);
    if (bracket) {
      bracket.tournament.status = 'completed';
      bracket.tournament.victor = winnerId;
    }
    try {
      await db
        .update(tournamentTable)
        .set({ status: 'completed', victor: winnerId })
        .where(eq(tournamentTable.name, tournamentName));
      await this.emitBracketUpdate(tournament.id);
      return true;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to end tournament',
        cause: error,
      });
    }
  }

  /**
   * Update the bracket state in memory after a match is completed.
   * @param tournamentId
   * @param matchId
   * @param winnerId
   */
  private async updateBracketState(
    tournamentId: number,
    matchId: number,
    winnerId: number
  ) {
    let bracket = this.bracketState.get(tournamentId);
    if (!bracket) {
      bracket = await this.getTournamentBracket(tournamentId);
    } else {
      const matchToUpdate = bracket.matches.find((m) => m.id === matchId);
      if (matchToUpdate) {
        matchToUpdate.status = 'finished';
        matchToUpdate.victor =
          matchToUpdate.players.find((p) => p.id === winnerId) || null;
      }
      bracket.rounds = this.calculateUpdateRounds(
        bracket.tournament.playerLimit,
        bracket.matches
      );
    }
    this.bracketState.set(tournamentId, bracket);
  }

  /**
   * Handle the completion of a match within a tournament.
   * This method updates the match status, updates the bracket state,
   * checks if the tournament can progress to the next round, and emits
   * bracket updates to subscribers.
   * @param matchId
   * @param winnerId
   * @returns
   */
  async handleTournamentMatchCompletion(
    tournamentId: number,
    matchId: number,
    winnerId: number
  ) {
    try {
      await this.updateBracketState(tournamentId, matchId, winnerId);
      await this.checkAndProgressTournament(tournamentId);
      this.isAllRoundsCompleted(tournamentId, winnerId);
      await this.getTournamentBracket(tournamentId);

      await this.emitBracketUpdate(tournamentId);
    } catch (error) {
      console.error('Error handling match completion:', error);
    }
  }

  isAllRoundsCompleted(tournamentId: number, winnerId: number): boolean {
    const bracket = this.bracketState.get(tournamentId);
    if (!bracket) return false;
    const finalRound = bracket.rounds[bracket.rounds.length - 1];

    if (finalRound && finalRound.status === 'completed') {
      this.endTournament(bracket.tournament.name, winnerId);
      console.log('Tournament completed:', bracket.tournament.name);
      return true;
    }
    return false;
  }
  /**
   * Check if the current round is completed and progress the tournament to the next round if applicable.
   *
   * @param tournamentId
   * @returns
   */
  private async checkAndProgressTournament(tournamentId: number) {
    const bracket = this.bracketState.get(tournamentId);
    if (!bracket || bracket.tournament.status !== 'ongoing') {
      console.log('No bracket found in state, cannot progress tournament');
      return;
    }

    for (let i = 0; i < bracket.rounds.length - 1; i++) {
      const currentRound = bracket.rounds[i];
      const nextRound = bracket.rounds[i + 1];
      if (
        currentRound.status === 'completed' &&
        nextRound.status === 'pending'
      ) {
        console.log('Current round completed, progressing to next round');
        const winners = currentRound.matches
          .filter((m) => m.victor !== null)
          .map((m) => m.victor!.id);
        console.log('Winners advancing to next round:', winners);
        if (winners.length === 1) {
          console.log(
            'This is the final match, tournament should be completed'
          );
          // Final match completed, tournament should be completed
          await this.endTournament(bracket.tournament.name, winners[0]);
        } else if (winners.length > 1) {
          //create next round
          console.log('Creating next round of matches');
          await this.createNextRound(tournamentId, winners);
        }
      }
    }
    return;
  }

  /**
   * Create the next round of matches in the tournament using the provided winner IDs.
   * @param tournamentId
   * @param winnerIds  An array of player IDs who won their matches in the current round.
   */
  private async createNextRound(tournamentId: number, winnerIds: number[]) {
    const matchCount = winnerIds.length / 2;
    for (let i = 0; i < matchCount; i++) {
      const player1Id = winnerIds[i * 2];
      const player2Id = winnerIds[i * 2 + 1];
      const match = await this.matchMaking(tournamentId, [
        player1Id,
        player2Id,
      ]);
      console.log('Created next round match:', match);
    }

    await this.getTournamentBracket(tournamentId);
  }

  /**
   * Calculate the rounds of the tournament based on the number of players and matches.
   * Will update the status of each round based on match completions.
   * @param playerCount number of players in the tournament
   * @param matches list of matches in the tournament
   * @returns array of TournamentRound
   */
  private calculateUpdateRounds(
    playerCount: number,
    matches: TournamentMatches[]
  ): TournamentRound[] {
    //e.g. for 8 players: 3 rounds (Quarterfinals, Semifinals, Finals)
    const totalRounds = Math.log2(playerCount);
    const rounds: TournamentRound[] = [];
    let matchIndex = 0;

    for (let round = 1; round <= totalRounds; round++) {
      const matchesInRound = playerCount / Math.pow(2, round);
      const roundMatches: TournamentMatches[] = [];

      for (let i = 0; i < matchesInRound; i++) {
        if (matches[matchIndex]) {
          roundMatches.push(matches[matchIndex]);
          matchIndex++;
        } else {
          // Future match - placeholder
          roundMatches.push({
            id: -1,
            players: [
              { id: -1, userAlias: 'TBD', placement: 0 },
              { id: -1, userAlias: 'TBD', placement: 0 },
            ],
            victor: null,
            status: 'waiting',
          });
        }
      }

      const status = this.getRoundStatus(roundMatches);
      const completedMatches = roundMatches.filter(
        (m) => m.status === 'finished' && m.victor !== null
      ).length;
      //TODO: is completedMatches correct needed?
      rounds.push({
        round: round,
        name: this.getRoundName(round, totalRounds),
        matches: roundMatches,
        matchesCompleted: completedMatches,
        totalMatches: matchesInRound,
        status: status,
      });
    }
    return rounds;
  }

  private getRoundName(round: number, totalRounds: number): string {
    if (round === totalRounds) return 'FINALS';
    if (round === totalRounds - 1) return 'SEMI-FINALS';
    if (round === totalRounds - 2) return 'QUARTER-FINALS';
    if (round === totalRounds - 3) return 'ROUND OF 16';
    return `${round}`;
  }

  /**
   * Determine the status of a tournament round based on its matches.
   * @param matches Array of matches in the round
   * @returns 'pending' | 'in_progress' | 'completed'
   */
  private getRoundStatus(
    matches: TournamentMatches[]
  ): 'pending' | 'in_progress' | 'completed' {
    const hasRealMatches = matches.some((m) => m.id !== -1);
    if (!hasRealMatches) return 'pending';

    const allCompleted = matches.every(
      (m) => m.victor !== null && m.status === 'finished'
    );
    if (allCompleted) return 'completed';

    return 'in_progress';
  }
}
