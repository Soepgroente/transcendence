/**
 * authentication router
 * Handles user authentication operations such as login, logout, and registration.
 */
import { createRouter, publicProcedure } from "../trpc";
import { signUpInput } from "../schemas";

export const authRouter = createRouter({
  signUp: publicProcedure

    .input(signUpInput)
    .mutation(async ({ ctx, input }) => {
      //   const hashedPassword = return a hashed version of input.password
      // const user = await ctx.db.createUser({
      //     name: input.name,
      //     email: input.email,
      //     password: hashedPassword,
      // });
      //   return user;
      return { id: "new-user-id", email: input.email, name: input.name };
    }),

});
