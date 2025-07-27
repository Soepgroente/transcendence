/**
 * authentication router
 * Handles user authentication operations such as login, logout, and registration.
 */
import { createRouter, publicProcedure } from "../trpc";
import { signUpInput } from "../schemas";

export const authRouter = createRouter({
  signUp: publicProcedure

    .input(signUpInput)
    .mutation(async ({ ctx: _ctx, input }) => { // added _ctx to indicate it's optional so that it doesn't give a warning during the build step
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
