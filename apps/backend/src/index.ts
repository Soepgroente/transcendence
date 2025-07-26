/// <reference path="../../../packages/db/types/fastify.d.ts" />


import { buildServer } from "./server";
// import { usersTable } from "@repo/db";



const start = async () => {
  try {
    const fastify = await buildServer();

  // try {
    //   await fastify.db.select().from(usersTable).limit(1); // Test query
    //   console.log('✅ Database connection verified!');
    // } catch (dbErr: any) {
    //   console.error('❌ Database test failed:', dbErr.message);
    // }

    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log("🚀 Server running at http://localhost:3000");
  } catch (err) {
    // fastify.log.error(err); Perhaps we keep this if we separate the build and start steps in different try catch blocks
    console.error(err);
    process.exit(1);
  }
};

start();
