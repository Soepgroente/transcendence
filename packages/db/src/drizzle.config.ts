import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import path from 'path';

config({ path: path.resolve(__dirname, '../../../.env') });


export default defineConfig({
	out: './drizzle',
	schema: './src/db/schema.ts',
	dialect: 'sqlite',
	dbCredentials: {
		url: path.resolve(__dirname, '../../../', process.env.DB_FILE_NAME!)
	},
});