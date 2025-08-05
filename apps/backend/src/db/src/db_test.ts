
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { eq } from 'drizzle-orm';
import { friendshipsTable, matchHistoryTable, singleMatchParticipantsTable, usersTable } from './db_schema/schema';
import { reset } from 'drizzle-seed';
import path from 'path';

console.log(__dirname);

config({ path: path.resolve(__dirname, '../../../../../.env') }); // This works only if the .env used is in the root of the project, process.cwd() can also be used with different path resolution. It depends on the project structure and where the .env file will be stored or if there will be multiple.

const dbFilePath = path.resolve(__dirname, '../', process.env.DB_FILE_NAME!);

const client = createClient({
  url: `file:${dbFilePath}`
});

const db = drizzle(client);
type NewMatch = typeof matchHistoryTable.$inferInsert;
type NewParticipant = typeof singleMatchParticipantsTable.$inferInsert;

async function main() {

  try {
    await db.select().from(usersTable);
    await db.select().from(matchHistoryTable);
    await db.select().from(singleMatchParticipantsTable);
    console.log('Database exists');
    // console.log(users2);
  } catch (error) {
    if (error instanceof Error && (error.message.includes('no such table') || error.message.includes('no such column'))) {
      console.log('Database doesn\'t include all the necessary tables and columns, you might need to run "npm run db:generate and npm run db:migrate"');
      process.exit(1);
    } else {
      console.log('Unknown error');
      console.log(error);
      process.exit(2);
    }
  }

  /* Reset the tables (doesn't reset the ids) */
  // await reset(db, { usersTable });
  // await reset(db, {matchHistoryTable });
  // await reset(db, { singleMatchParticipantsTable });
  /* or */
  // await db.delete(singleMatchParticipantsTable);
  // await db.delete(matchHistoryTable);
  // await db.delete(usersTable);

  /* Test user entries */
  try {
    await db.insert(usersTable).values({ alias: `first${Date.now()}`, password: `pass${Date.now()}`, name: "name_1", email: `example1${Date.now()}@example.com` });
    await db.insert(usersTable).values({ alias: `second${Date.now()}`, password: `pass${Date.now()}`, name: "name_2", email: `example2${Date.now()}@example.com` });
    await db.insert(usersTable).values({ alias: `third${Date.now()}`, password: `pass${Date.now()}`, name: "name_3", email: `example3${Date.now()}@example.com` });
    await db.insert(usersTable).values({ alias: `fourth${Date.now()}`, password: `pass${Date.now()}`, name: "name_4", email: `example4${Date.now()}@example.com` });
    // error user
    // await db.insert(usersTable).values({ alias: "fifth", password: `pass${Date.now()}`, name: "name_5", email: "example@example.com"});
    // await db.insert(usersTable).values({ alias: "sixth", password: `pass${Date.now()}`, name: "name_6", email: "example@example.com"});
  } catch (error) {
    if (error instanceof Error && error.message.includes('Failed query: insert into "users_table"')) {
      console.log('! Failed to store user !');
      console.log(error.message);
      process.exit(3);
    }
  }
  const users_3 = await db.select().from(usersTable);
  console.log('Getting all users from the database: ', users_3);


  // Capture all user ids in an array
  const allIds = (await db.select({ id: usersTable.id }).from(usersTable).orderBy(usersTable.id)).map(u => u.id);
  const allIdsLength = allIds.length;

  /* Test friendships, it creates a friendship between the 2 last added users, in this case we don't delete so it shouldn't break.
  It then shows all friendships */
  try {
    await db.insert(friendshipsTable).values({ userId: allIds[allIdsLength - 1], friendId: allIds[allIdsLength - 2] });
    // error friendship
    // await db.insert(friendshipsTable).values({ userId: allIds[allIdsLength], friendId: allIds[allIdsLength - 2] });
    // await db.insert(friendshipsTable).values({ userId: allIds[allIdsLength - 2], friendId: allIds[allIdsLength - 2] });
  } catch (error) {
    if (error instanceof Error) {
      console.log('! Failed to create friendship !');
      console.log(error.message);
      process.exit(4);
    }
    console.log('Database error');
    process.exit(99);
  }
  const friendships = await db.select().from(friendshipsTable);
  console.log('Getting all friendships from the database: ', friendships);


  /* Test match history entries */
  const randomId1 = allIds[Math.floor(Math.random() * allIds.length)];
  const match: NewMatch = { mode: "2v2", victor: randomId1, createdAt: new Date() };
  // error match
  // match = { mode: "3v3", victor: "sec", createdAt: new Date() };
  let allInsertedIds;
  let lastMatchId;
  try {
    allInsertedIds = await db.insert(matchHistoryTable).values(match).returning({ id: matchHistoryTable.id });
    lastMatchId = allInsertedIds[0]?.id;
    if (lastMatchId === undefined) {
      throw new Error('Failed to retrieve match id');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Failed query: insert into "match_history_table"')) {
      console.log('! Failed to store match because the victor doesn\'t correlate to an existing alias !');
      console.log(error.message);
      process.exit(5);
    }
    console.log('Database error');
    process.exit(99);
  }
  const matches_1 = await db.select().from(matchHistoryTable);
  console.log('Getting all matches from the database: ', matches_1);

  /* Test participants entries */
  let randomId2 = allIds[Math.floor(Math.random() * allIds.length)];
  while (randomId2 === randomId1) {
    randomId2 = allIds[Math.floor(Math.random() * allIds.length)];
  }
  const participant1: NewParticipant = { player: randomId1, score: 5, placement: 1, matchId: lastMatchId };
  const participant2: NewParticipant = { player: randomId2, score: 3, placement: 2, matchId: lastMatchId };
  try {
    await db.insert(singleMatchParticipantsTable).values(participant1);
    await db.insert(singleMatchParticipantsTable).values(participant2);
    // error participant
    // const participant3: NewParticipant = { player: 1, score: 5, placement: 1, matchId: 1};
    // const participant4: NewParticipant = { player: 1, score: 5, placement: 2, matchId: 1};
    // await db.insert(singleMatchParticipantsTable).values(participant3);
    // await db.insert(singleMatchParticipantsTable).values(participant4);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Failed query: insert into "single_match_players_table"')) {
      console.log('! Failed to store participant !');
      console.log(error.message);
      process.exit(6);
    }
  }

  /* Show participant info for a match, there is probably a better way to do it */
  const participants_1 = await db.select({ alias: usersTable.alias })
    .from(singleMatchParticipantsTable)
    .innerJoin(usersTable, eq(singleMatchParticipantsTable.player, usersTable.id))
    .where(eq(singleMatchParticipantsTable.matchId, lastMatchId));
  console.log('Showing participant info for matchId: ', lastMatchId);
  console.log(participants_1);
  console.log(`${participants_1[0].alias}: ${participant1.score}`);
  console.log(`${participants_1[1].alias}: ${participant2.score}`);
  const victor = await db.select({ alias: usersTable.alias })
    .from(matchHistoryTable)
    .innerJoin(usersTable, eq(matchHistoryTable.victor, usersTable.id))
    .where(eq(matchHistoryTable.id, lastMatchId))
  console.log(`Victor: ${victor[0]?.alias}`);
  console.log()
  // const users_4 = await db.all(sql`SELECT * FROM user_table`);
  // console.log('Result from SQL-like query: ', users_4);
};

main();
