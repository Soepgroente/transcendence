import Fastify from 'fastify';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { appRouter } from '@repo/trpc';
import { createTRPCContext } from './trpc/context';
import websocket from '@fastify/websocket';
import { setupGoogleAuthRoutes } from './auth/google';
import pino from 'pino';
import cookie from '@fastify/cookie';
// Create a Fastify instance
const fastifyInstance = Fastify({
  disableRequestLogging: true,
  logger: {
    level: 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
  },
});

fastifyInstance.register(cookie);

/**
 * Register the tRPC plugin with Fastify
 * and set the prefix for the tRPC routes.
 * This allows you to access the tRPC endpoints and handle all endpoints there.
 */
fastifyInstance.register(websocket);

fastifyInstance.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  useWSS: true,
  keepAlive: {
    enabled: true,
    pingMs: 30000,
    pongWaitMs: 5000,
  },
  trpcOptions: { router: appRouter, createContext: createTRPCContext },
});

fastifyInstance.register(import('@fastify/cors'), {
  origin: ['http://localhost:3000', 'http://localhost:8080'], // allow frontend origins
  credentials: true,
});

setupGoogleAuthRoutes(fastifyInstance);

export function buildServer() {
  return fastifyInstance;
}
