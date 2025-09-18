import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../src/dbSchema/schema';

/* Create the database type to be used */
export type DbType = ReturnType<typeof drizzle<typeof schema>>;
