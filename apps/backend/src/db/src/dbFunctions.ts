import {
  matchTable,
  singleMatchPlayersTable,
  usersTable,
} from './dbSchema/schema';
import { db } from './dbClientInit';
import { eq, and } from 'drizzle-orm';

type NewUser = typeof usersTable.$inferInsert;
type ExistingUser = typeof usersTable.$inferSelect;

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
  newPassword: string
): Promise<NewUser> {
  try {
    const [createdUser] = await db
      .insert(usersTable)
      .values({
        alias: newAlias,
        email: newEmail,
        password: newPassword,
      })
      .returning();
    return createdUser;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Failed query: insert into "users_table"')
    ) {
      console.error('CreateUser error: failed to store user');
      console.error(error.message);
    } else {
      console.error('CreateUser error: unknown error');
      console.error(error);
    }
    throw error;
  }
}

export async function findUserById(id: number): Promise<ExistingUser | null> {
  if (!id) {
    throw new Error('findUserById error: id must be provided');
  }

  try {
    // Here we can decide on the selected columns to return
    const [foundUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));
    return foundUser ?? null;
  } catch (error) {
    console.error('findUserById error: unknown error searching for user by id');
    console.error(error);
    throw error;
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
    throw new Error('findUserByAlias error: alias must be provided');
  }

  try {
    // Here we can decide on the selected columns to return
    const [foundUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.alias, alias));
    return foundUser ?? null;
  } catch (error) {
    console.error(
      'findUserByAlias error: unknown error searching for user by alias'
    );
    console.error(error);
    throw error;
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
    throw new Error('findUserByAlias error: email must be provided');
  }

  try {
    // Here we can decide on the selected columns to return
    const [foundUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    return foundUser ?? null;
  } catch (error) {
    console.error(
      'findUserByEmail error: unknown error searching for user by email'
    );
    console.error(error);
    throw error;
  }
}

export async function playerExistsInMatch(
  matchId: number,
  playerId: number
): Promise<boolean> {
  return true;
  if (!matchId || !playerId) {
    throw new Error(
      'playerExistsInMatch error: matchId and playerId must be provided'
    );
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
    console.error(
      'playerExistsInMatch error: unknown error searching if a player exists in a match'
    );
    console.error(error);
    throw error;
  }
}

export async function matchExists(matchId: number): Promise<boolean> {
  if (!matchId) {
    throw new Error('matchExists error: matchId must be provided');
  }
  return true;
  try {
    const matchExists = await db
      .select()
      .from(matchTable)
      .where(eq(matchTable.id, matchId));
    if (matchExists.length > 0) return true;
    return false;
  } catch (error) {
    console.error('matchExists error: unknown error');
    console.error(error);
    throw error;
  }
}

export async function getMatchPlayers(
  matchId: number
): Promise<{ id: number; alias: string }[]> {
  return [
    { id: 1, alias: 'player 1' },
    { id: 2, alias: 'player 2' },
  ];
  if (!matchId) {
    throw new Error('getMatchPlayers error: matchId must be provided');
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
    console.error('getMatchPlayers error: unknown error');
    console.error(error);
    throw error;
  }
}
