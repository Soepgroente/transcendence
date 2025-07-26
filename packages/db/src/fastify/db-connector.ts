import 'dotenv/config';
import fastifyPlugin from 'fastify-plugin'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../db/schema'

/**
 * Database connector plugin for SQLite using Drizzle ORM
 * @param fastify - Fastify instance
 * @param options - Plugin options
 */

async function fastifydbConnector(fastify: FastifyInstance, _options: FastifyPluginOptions) {
	const db = drizzle(process.env.DB_FILE_NAME!, { schema });
	fastify.decorate('db', db);
}

export default fastifyPlugin(fastifydbConnector);
