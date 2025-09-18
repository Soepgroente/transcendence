import { config } from 'dotenv';
import path from 'path';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

config({ path: path.resolve(process.cwd(), '.env') }); // This works only if the .env used is in the root of the backend.

const dbFilePath = path.resolve(__dirname, '../', process.env.DB_FILE_NAME!);

const client = createClient({
  url: `file:${dbFilePath}`,
});

export const db = drizzle(client);
