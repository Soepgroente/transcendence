import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env') }); // Changed it to process.cwd() because I think it makes it more clear it's at the root of the backend.

export default defineConfig({
  out: 'src/db/drizzle',
  schema: path.resolve(__dirname, 'src/dbSchema/schema.ts'),
  dialect: 'sqlite',
  dbCredentials: {
    url: path.resolve(__dirname, process.env.DB_FILE_NAME || 'database.sqlite'), // This will create the database file in the apps/backend/src/db folder, easily modifiable
  },
});
