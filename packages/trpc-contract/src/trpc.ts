import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './types';
import superjson from 'superjson';

// Initialize tRPC with the context type
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const disableJWT = true; //for development

export const createRouter = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure that checks if the user is authenticated.
 * It used to check if the user is logged in before allowing access to the procedure.
 * If not authenticated, it throws an UNAUTHORIZED error.
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!disableJWT && !ctx.userToken) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource.',
    });
  }
  return next(); //pass the context to the next resolver
});
