import {
  friendshipsTable,
  matchTable,
  singleMatchPlayersTable,
  tournamentPlayersTable,
  tournamentTable,
  usersTable,
} from '@repo/db/dbSchema';
import { db } from './dbClientInit';
import { eq, and, inArray } from 'drizzle-orm';
import { ExistingUser, Match, MatchHistoryEntry, TournamentHistoryEntry } from '@repo/db/dbTypes';
import { TRPCError } from '@trpc/server';


/**
 * Create and return a user, [createdUser] is destructuring the array returned from returning(),
 * and capturing the first element. It returns because it might be needed to use info from the new entry
 * @param newAlias alias of the new user
 * @param newEmail email of the new user
 * @param newPassword password of the new user
 * @returns The user data or throws an error
 */
export async function createUser(
  newAlias: string,
  newEmail: string,
  newPassword: string,
  newGoogleId?: string
): Promise<ExistingUser> {
  try {
    const [createdUser] = await db
      .insert(usersTable)
      .values({
        alias: newAlias,
        email: newEmail,
        password: newPassword,
        googleId: newGoogleId
      })
      .returning();
    return createdUser;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Failed query: insert into "users_table"')
    ) {
      console.error('createUser error: failed to store user');
      console.error(error.message);
    } else {
      console.error('createUser error');
      console.error(error);
    }
    throw error;
  }
}

export async function findUserById(id: number): Promise<ExistingUser | null> {
  if (!id) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'findUserById error: Provide user ID',
      cause: 'User ID is not valid',
    });
  }

  try {
    // Here we can decide on the selected columns to return
    const [foundUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));
    return foundUser ?? null;
  } catch (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'findUserById error',
      cause: error,
    });
  }
}

/**
 * Search for an existing user with its alias
 * @param alias alias of existing user
 * @returns The user data or null or throws an error
 */
export async function findUserByAlias(
  alias: string
): Promise<ExistingUser | null> {
  if (!alias) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'findUserByAlias error: Provide user alias',
      cause: 'User alias is not valid',
    });
  }

  try {
    // Here we can decide on the selected columns to return
    const [foundUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.alias, alias));
    return foundUser ?? null;
  } catch (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'findUserByAlias error',
      cause: error,
    });
  }
}

/**
 * Search for an existing user with its alias
 * @param email email of existing user
 * @returns The user data or null or throws an error
 */
export async function findUserByEmail(
  email: string
): Promise<ExistingUser | null> {
  if (!email) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'findUserByEmail error: email address must be provided',
      cause: 'email address is not valid',
    });
  }

  try {
    // Here we can decide on the selected columns to return
    const [foundUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    return foundUser ?? null;
  } catch (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'findUserByEmail error',
      cause: error,
    });
  }
}

export async function playerExistsInMatch(
  matchId: number,
  playerId: number
): Promise<boolean> {
  if (!matchId || !playerId) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'playerExistsInMatch error: match ID and player ID must be provided',
      cause: 'match ID and/or player ID not valid',
    });
  }
  try {
    const playerExists = await db
      .select()
      .from(singleMatchPlayersTable)
      .where(
        and(
          eq(singleMatchPlayersTable.matchId, matchId),
          eq(singleMatchPlayersTable.playerId, playerId)
        )
      );
    if (playerExists.length > 0) return true;
    return false;
  } catch (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'playerExistsInMatch error',
      cause: error,
    });
  }
}

export async function matchExists(matchId: number): Promise<boolean> {
  if (!matchId) {
     throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'matchExists error: match ID must be provided',
      cause: 'match ID is not valid',
    });
  }
  try {
    const matchExists = await db
      .select()
      .from(matchTable)
      .where(eq(matchTable.id, matchId));
    if (matchExists.length > 0) return true;
    return false;
  } catch (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'matchExists error',
      cause: error,
    });
  }
}

export async function getMatchPlayers(
  matchId: number
): Promise<{ id: number; alias: string }[]> {
  if (!matchId) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'getMatchPlayers error: match ID must be provided',
      cause: 'match ID is not valid',
    });
  }
  try {
    const matchPlayers = await db
      .select({ id: singleMatchPlayersTable.playerId, alias: usersTable.alias })
      .from(singleMatchPlayersTable)
      .innerJoin(
        usersTable,
        eq(singleMatchPlayersTable.playerId, usersTable.id)
      )
      .where(eq(singleMatchPlayersTable.matchId, matchId));
    return matchPlayers ?? [];
  } catch (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'getMatchPlayers error',
      cause: error,
    });
  }
}

/**
 * Get the match history of a specific user
 * @param userId The id of the user we need the match history of
 * @returns A MatchHistoryEntry[] with all the relevant matches, dates, participants, placement, win-loss boolean
 */

export async function getUserMatchHistory(userId: number): Promise<MatchHistoryEntry[]> {
  if (!userId) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'getUserMatchHistory error: user ID must be provided',
      cause: 'user ID is not valid',
    });
  }
  try {
    const userMatches = await db
      .select({ 
        matchId: singleMatchPlayersTable.matchId,
        date: matchTable.date,
        placement: singleMatchPlayersTable.placement,
      })
      .from(singleMatchPlayersTable)
      .innerJoin(matchTable, eq(singleMatchPlayersTable.matchId, matchTable.id))
      .where(eq(singleMatchPlayersTable.playerId, userId));

    const matchIds = userMatches.map(m => m.matchId);
    
    const participants = await db
      .select({ 
        matchId: singleMatchPlayersTable.matchId,
        participantId: singleMatchPlayersTable.playerId,
        alias: usersTable.alias
      })
      .from(singleMatchPlayersTable)
      .innerJoin(usersTable, eq(singleMatchPlayersTable.playerId, usersTable.id))
      .where(inArray(singleMatchPlayersTable.matchId, matchIds));
      
      const entries: MatchHistoryEntry[] = [];
      for (const match of userMatches) {
        const participantsAlias = participants.filter(p => p.matchId === match.matchId).map(p => p.alias);
        entries.push({
          id: match.matchId,
          date: match.date,
          placement: match.placement,
          participants: participantsAlias,
          isWin: match.placement === 1
        })
    }
    return entries;
  } catch (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'getUserMatchHistory error',
      cause: error,
    });
  }
}

export async function getUserTournamentHistory(userId: number): Promise<TournamentHistoryEntry[]> {
  if (!userId) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'getUserMatchHistory error: user ID must be provided',
      cause: 'user ID is not valid',
    });
  }
  try {
    const userTournaments = await db
      .select({ 
        tournamentId: tournamentPlayersTable.tournamentId,
        date: tournamentTable.date,
        tournamentName: tournamentTable.name,
        victor: tournamentTable.victor,
        playerLimit: tournamentTable.playerLimit,
        status: tournamentTable.status,
      })
      .from(tournamentTable)
      .innerJoin(tournamentPlayersTable, eq(tournamentPlayersTable.tournamentId, tournamentTable.id))
      .where(and(
        eq(tournamentTable.status, 'completed'),
        eq(tournamentPlayersTable.playerId, userId)));
    
    const entries: TournamentHistoryEntry[] = [];
    for (const tournament of userTournaments) {
      entries.push({
        id: tournament.tournamentId,
        date: tournament.date,
        tournamentName: tournament.tournamentName,
        playerLimit: tournament.playerLimit,
        isWin: tournament.victor === userId,
      })
    }
    return entries;
  } catch (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'getUserMatchHistory error',
      cause: error,
    });
  }
}

export async function getUserFriends(userId: number): Promise<{alias: string}[]> {
  if (!userId) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'getUserFriends error: user ID must be provided',
      cause: 'user ID is not valid',
    });
  }
  try {
    const friends = await db
      .select({
        alias: usersTable.alias,
      })
      .from(friendshipsTable)
      .innerJoin(usersTable, eq(friendshipsTable.friendId, usersTable.id))
      .where(eq(friendshipsTable.userId, userId));

    return friends;
  } catch (error) {
    throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'getUserFriends error',
          cause: error,
    });
  }
}

export async function getUserAvatar(userId: number): Promise<string> {
  if (!userId) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'getUserAvatar error: user ID must be provided',
      cause: 'user ID is not valid',
    });
  }
  try {
    const [imgPath] = await db
      .select({
        avatarPath: usersTable.avatarPath
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    
    return imgPath.avatarPath;
  } catch (error) {
    throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'getAvatarPath error',
          cause: error,
    });
  }
}

export async function updateUserAvatar(userId: number, newPath: string): Promise<string> {
  if (!userId || !newPath) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'updateUserAvatar error: user ID and new path must be provided',
      cause: 'user ID is not valid',
    });
  }
  try {
    const [updatedAvatarPath] = await db
      .update(usersTable)
      .set({ avatarPath: newPath })
      .where(eq(usersTable.id, userId))
      .returning({ avatarPath: usersTable.avatarPath });
    
    return updatedAvatarPath.avatarPath;
  } catch (error) {
    throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'updateAvatarPath error',
          cause: error,
    });
  }
}

export async function updateUser2FASecret(userId: number, secret: string) {
  try {
    await db
      .update(usersTable)
      .set({ twofa_secret: secret })
      .where(eq(usersTable.id, userId));
  } catch (error) {
    console.error('updateUser2FASecret error:', error);
    throw error;
  }
}

export async function enableUser2FA(userId: number) {
  try {
    await db
      .update(usersTable)
      .set({ twofa_enabled: 1 })
      .where(eq(usersTable.id, userId));
  } catch (error) {
    console.error('enableUser2FA error:', error);
    throw error;
  }
}

export async function disableUser2FA(userId: number) {
  try {
    await db
      .update(usersTable)
      .set({ twofa_secret: null, twofa_enabled: 0 })
      .where(eq(usersTable.id, userId));
  } catch (error) {
    console.error('disableUser2FA error:', error);
    throw error;
  }}
