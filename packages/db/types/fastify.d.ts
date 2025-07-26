import { FastifyInstance } from 'fastify'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../src/db/schema'

declare module 'fastify' {
	interface FastifyInstance {
		db: ReturnType<typeof drizzle<typeof schema>> 
	}
}