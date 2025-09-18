import { createRouter, protectedProcedure } from '../trpc';

/**
 * User router for handling user-related operations.
 * User management (getUser, updateUser, listUsers)
 */
export const userRouter = createRouter({
  getUser: protectedProcedure.query(async ({ ctx }) => {
    return {
      status: 200,
      message: 'User retrieved successfully',
      data: ctx.userToken,
    };
  }),
});
