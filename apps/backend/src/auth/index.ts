export { jwtUtils } from './jwt';
import { TRPCError } from '@trpc/server';
import { findUserByEmail, createUser } from '../db/src/dbFunctions';
import { jwtUtils } from './jwt';
import { hashPassword, verifyPassword } from './password';

/**
 * It checks if the user already exists by email, hashes the password,
 * creates the user in the database, and returns the user details along with a JWT token.
 * @param name - The name of the new user
 * @param email - The email of the new user
 * @param password - The password of the new user
 * @returns An object containing user details and a JWT token
 */
export async function createNewUser(
  name: string,
  email: string,
  password: string
) {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new TRPCError({
      code: 'CONFLICT',
      message: 'User with this email already exists',
    });
  }
  const passwordHash = await hashPassword(password);
  const user = await createUser(name, email, passwordHash);
  if (!user || !user.id) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'User creation failed',
    });
  }
  const token = jwtUtils.sign(user.id, user.email);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.alias,
    },
    token,
  };
}

/**
 * It finds the user by email, verifies the password,
 * @param email - The email of the user trying to sign in
 * @param password - The password of the user trying to sign in
 * @returns An object containing user details and a JWT token
 */
export async function signIn(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'User not found',
    });
  }
  if (user.googleId) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED', 
      message: 'Please log in with Google' 
    });
  }
  const isPasswordValid = await verifyPassword(user.password, password);
  if (!isPasswordValid) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid password',
    });
  }
  const token = jwtUtils.sign(user.id, user.email);
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.alias, // Assuming alias is used as the name
    },
    token,
  };
}
