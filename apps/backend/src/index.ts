/// <reference path="../../../packages/db/types/fastify.d.ts" />

import { config } from 'dotenv'
import { buildServer } from './server';
import { usersTable } from '@repo/db';
import path from 'path';

config({ path: path.resolve(__dirname, '../../../.env') });

const start = async () => {
  try {
    const fastify = await buildServer();

  try {
      const tableInfo = await fastify.db.run('PRAGMA table_info(users_table)');
      console.log('Table info:', tableInfo);

      const existingUsers = await fastify.db.select().from(usersTable);
      console.log('Existing users:', existingUsers);
    
      const user = {
        name: `User.${Date.now()}`,
        alias: `Johnny.${Date.now()}`,
        email: `john@example.com.${Date.now()}`,
      };
      const result = await fastify.db.insert(usersTable).values(user).returning();
      console.log('New user created: ' ,result);
      const users = await fastify.db.select().from(usersTable);
      console.log('Getting all users from the database: ', users)
      console.log('✅ Database connection verified!');
    } catch (dbErr: any) {
      console.error('Error details:', {
        message: dbErr.message,
        code: dbErr.code,
        detail: dbErr.detail
    });
  }
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log("🚀 Server running at http://localhost:3000");
  } catch (err) {
    // fastify.log.error(err); Perhaps we keep this if we separate the build and start steps in different try catch blocks
    console.error(err);
    process.exit(1);
  }
};

start();
