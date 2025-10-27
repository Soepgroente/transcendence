import { TRPCError } from '@trpc/server';
import { createRouter, protectedProcedure } from '../trpc';
import z from 'zod';

/**
 * User router for handling user-related operations.
 * User management (getUser, updateUser, listUsers)
 */
export const userRouter = createRouter({
  getUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.services.dbServices.findUserById(ctx.userToken.id);
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }
    return {
      status: 200,
      message: 'User fetched successfully',
      data: { id: user.id, email: user.email, name: user.alias, twofa_enabled: user.twofa_enabled},
    };
  }),

  getUserMatchHistory: protectedProcedure.query(async ({ ctx }) => {
    try {
      const history = await ctx.services.dbServices.getUserMatchHistory(ctx.userToken.id);
      return {
        status: 200,
        message: 'User match history fetched successfully',
        data: history,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error in fetching user match history'
      });
    }
  }),

  getUserTournamentHistory: protectedProcedure.query(async ({ ctx }) => {
    try {
      const history = await ctx.services.dbServices.getUserTournamentHistory(ctx.userToken.id);
      return {
        status: 200,
        message: 'User tournament history fetched successfully',
        data: history,
      }
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error in fetching user tournament history'
      });
    }
  }),

  getUserFriends: protectedProcedure.query(async ({ ctx }) => {
    try {
      const friends = await ctx.services.dbServices.getUserFriends(ctx.userToken.id);
      return {
        status: 200,
        message: 'User friends list fetched successfully',
        data: friends,
      }
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error in fetching user friends list'
      });
    }
  }),

    getUserAvatar: protectedProcedure.query(async ({ ctx }) => {
    try {
      const avatarPath = await ctx.services.dbServices.getUserAvatar(ctx.userToken.id);
      return {
        status: 200,
        message: 'User avatar path fetched successfully',
        data: avatarPath,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error in fetching user avatar path'
      });
    }
  }),

  updateUserAvatar: protectedProcedure
    .input(z.object({ newPath: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const newAvatarPath = await ctx.services.dbServices.updateUserAvatar(
          ctx.userToken.id,
          input.newPath
        );
        return {
          status: 200,
          message: 'User avatar path updated successfully',
          data: newAvatarPath,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error in updating user avatar path'
        });
      }
    }),

    updateUserAlias: protectedProcedure
    .input(z.object({ alias: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const newAlias = await ctx.services.dbServices.updateUserAlias(
          ctx.userToken.id,
          input.alias
        );
        return {
          status: 200,
          message: 'User alias updated successfully',
          data: newAlias,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error in updating user alias'
        });
      }
    }),

    updateUserEmail: protectedProcedure
    .input(z.object({ email: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const newEmail = await ctx.services.dbServices.updateUserEmail(
          ctx.userToken.id,
          input.email
        );
        return {
          status: 200,
          message: 'User email address updated successfully',
          data: newEmail,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error in updating user email address'
        });
      }
    }),

    updateUserPassword: protectedProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const success = await ctx.services.dbServices.updateUserPassword(
          ctx.userToken.id,
          input.password
        );
        return {
          status: 200,
          message: 'User password updated successfully',
          data: success,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error in updating user password'
        });
      }
    }),
});
