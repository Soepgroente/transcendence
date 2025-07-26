import { type Context } from "@repo/trpc/src/context";
import { type CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";


/**
 * createTRPCContext function to create the context for tRPC.
 * This function is called for each request to set up the context.
 * @param param0 - Fastify context options
 * @param param0.req - Fastify request object
 * @param param0.res - Fastify response object
 * @returns db - Database connection, user - Optional user information
 */
export async function createTRPCContext({
  req,
  res:_res,
}: CreateFastifyContextOptions): Promise<Context> {
  const db = (req as any).server.db; // Access the db;
  let user = undefined;
  const token = req.headers.authorization; // Example: Get token from request headers
  // Example: Extract user from request headers or session
  if (token) {
    user = { id: "user-id", email: "" }; // replace with actual user extraction logic
  }
  return { db, user };
}
