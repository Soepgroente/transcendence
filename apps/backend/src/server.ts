import Fastify from "fastify";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { appRouter } from "@repo/trpc";
import { createTRPCContext } from "./trpc/context";
import { fastifydbConnector } from "@repo/db"

// Create a Fastify instance
const fastifyInstance = Fastify({
  logger: true,
});

/**
 * Register the tRPC plugin with Fastify
 * and set the prefix for the tRPC routes.
 * This allows you to access the tRPC endpoints and handle all endpoints there.
 */

export async function buildServer() {
	await fastifyInstance.register(fastifydbConnector);
	
	await fastifyInstance.register(fastifyTRPCPlugin, {
	  prefix: "/trpc",
	  trpcOptions: { router: appRouter, createContext: createTRPCContext },
	});

  await fastifyInstance.ready();

  return fastifyInstance;
}
