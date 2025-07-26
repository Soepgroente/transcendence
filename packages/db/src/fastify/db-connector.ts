import 'dotenv/config';
import fastifyPlugin from 'fastify-plugin'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from '../db/schema'
import path from 'path';

/**
 * Database connector plugin for SQLite using Drizzle ORM
 * @param fastify - Fastify instance
 * @param options - Plugin options
 */

async function fastifydbConnector(fastify: FastifyInstance, _options: FastifyPluginOptions) {
	
  const dbFileName = process.env.DB_FILE_NAME! || 'local.db';
  const dbPath = path.resolve(__dirname, '../../../../', dbFileName);
  console.log("path in dbConnector: ", dbPath);
  const client = createClient({
    url: `file:${dbPath}`
  });
  const db = drizzle(client, { schema });
	fastify.decorate('db', db);
}

export default fastifyPlugin(fastifydbConnector);
