/**
 * authentication router
 * Handles user authentication operations such as login, logout, and registration.
 */
import { createRouter, publicProcedure } from '../trpc';
import { signUpInput, loginInput } from '../schemas';

export const authRouter = createRouter({
  /**
   * signUp procedure handles user registration.
   * It validates the input and creates a new user in the database.
   * If successful, it returns a response with user details and a JWT token.
   * If the user already exists, it throws a conflict error.
   * If user creation fails, it throws an internal server error.
   */
  signUp: publicProcedure
    .input(signUpInput)
    .mutation(({ ctx, input }) =>
      ctx.services.auth.signUp(input.name, input.email, input.password)
    ),

  /**
   * login procedure handles user login.
   * It checks the email is registered and the password is correct.
   * If successful, it returns a response with user details and a JWT token.
   * If the user is not found, it throws a not found error.
   */
  login: publicProcedure
    .input(loginInput)
    .mutation(({ ctx, input }) =>
      ctx.services.auth.signIn(input.email, input.password)
    ),
});
