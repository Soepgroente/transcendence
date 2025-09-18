/* THIS FILE CONTAINS SEVERAL SEPARATE TESTS,
EACH SECTION HAS A COMMENT ABOVE IT, SEPARATE SECTIONS CAN BE
COMMENTED OUT IF YOU DON'T WANT TO RUN ALL THE DIFFERENT TESTS */
import { eq } from 'drizzle-orm';
import {
  friendshipsTable,
  matchTable,
  singleMatchPlayersTable,
  tournamentPlayersTable,
  tournamentTable,
  usersTable,
} from './dbSchema/schema';
import { reset } from 'drizzle-seed';
import { db } from './dbClientInit';
import {
  createUser,
  findUserByAlias,
  findUserByEmail,
  findUserById,
  playerExistsInMatch,
  matchExists,
  getMatchPlayers,
} from './dbFunctions';
import * as readline from 'readline/promises';
import { match } from 'assert';
import { configDotenv } from 'dotenv';

console.log(__dirname);

type NewMatch = typeof matchTable.$inferInsert;
type NewParticipant = typeof singleMatchPlayersTable.$inferInsert;

interface functionEntry {
  name: string;
  fn: () => Promise<void>;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function getTestInput(input: string): Promise<string> {
  const answer = await rl.question(input);
  return answer;
}

async function testDbExistence() {
  try {
    await db.select().from(usersTable);
    await db.select().from(matchTable);
    await db.select().from(singleMatchPlayersTable);
    await db.select().from(friendshipsTable);
    await db.select().from(tournamentTable);
    await db.select().from(tournamentPlayersTable);
    console.log('Database exists');
    // console.log(users2);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('no such table') ||
        error.message.includes('no such column'))
    ) {
      console.log(
        'Database doesn\'t include all the necessary tables and columns, you might need to run "npm run db:generate and npm run db:migrate"'
      );
      process.exit(1);
    } else {
      console.log('Unknown error');
      console.log(error);
      process.exit(2);
    }
  }
}

/* Test user entries */
async function testUserEntries() {
  console.log('-------------Testing user entries------------');
  try {
    await createUser(
      `first${Date.now()}`,
      `example1${Date.now()}@example.com`,
      `pass${Date.now()}`
    );
    await createUser(
      `second${Date.now()}`,
      `example2${Date.now()}@example.com`,
      `pass${Date.now()}`
    );
    await createUser(
      `third${Date.now()}`,
      `example3${Date.now()}@example.com`,
      `pass${Date.now()}`
    );
    await createUser(
      `fourth${Date.now()}`,
      `example4${Date.now()}@example.com`,
      `pass${Date.now()}`
    );
  } catch (error) {
    process.exit(3);
  }

  const users_3 = await db.select().from(usersTable);
  console.log('Getting all users from the database: ', users_3);
  console.log('---------------------------------------------');
}

/* Another test user entry to test dbFuctions*/
async function testDbFunctions() {
  console.log('-------------Testing db functions------------');
  const testUserAlias = `testUser${Date.now()}`;
  const testUserEmail = `exampleEmail${Date.now()}`;
  const testUserPassword = `pass${Date.now()}`;
  const createdUser = await createUser(
    testUserAlias,
    testUserEmail,
    testUserPassword
  );
  console.log('createdUser: ', createdUser.id);
  /* Test findUser */
  console.log('-------findUserByAlias---------');
  let foundUser = await findUserByAlias(testUserAlias);
  console.log(foundUser);
  console.log('-------------------------------');
  console.log('-------findUserByEmail---------');
  foundUser = await findUserByEmail(testUserEmail);
  console.log(foundUser);
  console.log('-------------------------------');
  console.log('-------findUserById---------');
  if (foundUser) {
    const foundUserId = await findUserById(foundUser.id);
    console.log(foundUserId);
  }
  console.log('---------------------------------------------');
}

/* Test friendships, it creates a friendship between the 2 last added users, in this case we don't delete so it shouldn't break.
It then shows all friendships */
async function testFriendships() {
  console.log('-------------Testing friendships------------');
  const allIds = (
    await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .orderBy(usersTable.id)
  ).map((u) => u.id);
  const allIdsLength = allIds.length;
  try {
    await db
      .insert(friendshipsTable)
      .values({
        userId: allIds[allIdsLength - 1],
        friendId: allIds[allIdsLength - 2],
      });
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
  console.log('---------------------------------------------');
}

/* Test match history entries */
async function testMatchHistory() {
  console.log('-------------Testing match history------------');
  const allIds = (
    await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .orderBy(usersTable.id)
  ).map((u) => u.id);
  const randomId1 = allIds[Math.floor(Math.random() * allIds.length)];
  const match: NewMatch = { date: new Date() };
  // error match
  // match = { victor: "sec", date: new Date() };
  let allInsertedIds;
  let lastMatchId;
  try {
    allInsertedIds = await db
      .insert(matchTable)
      .values(match)
      .returning({ id: matchTable.id });
    lastMatchId = allInsertedIds[0]?.id;
    const matchExistence = await matchExists(lastMatchId);
    console.log(`Match ${lastMatchId} exists: ${matchExistence}`);
    if (lastMatchId === undefined) {
      throw new Error('Failed to retrieve match id');
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Failed query: insert into "match_history_table"')
    ) {
      console.log(
        "! Failed to store match because the victor doesn't correlate to an existing alias !"
      );
      console.log(error.message);
      process.exit(5);
    }
    console.log('Database error');
    process.exit(99);
  }
  const matches_1 = await db.select().from(matchTable);
  console.log('Getting all matches from the database: ', matches_1);
  console.log('---------------------------------------------');
}

/* Test participants entries */
async function testMatchPlayers() {
  console.log('-------------Testing match players------------');
  const allIds = (
    await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .orderBy(usersTable.id)
  ).map((u) => u.id);
  const allIdsLength = allIds.length;
  const randomId1 = allIds[Math.floor(Math.random() * allIdsLength)];
  let randomId2 = allIds[Math.floor(Math.random() * allIdsLength)];
  const matches = await db.select().from(matchTable);
  const lastMatchId = matches[matches.length - 1].id;
  while (randomId2 === randomId1) {
    randomId2 = allIds[Math.floor(Math.random() * allIdsLength)];
  }
  const participant1: NewParticipant = {
    playerId: randomId1,
    placement: 1,
    matchId: lastMatchId,
  };
  const participant2: NewParticipant = {
    playerId: randomId2,
    placement: 2,
    matchId: lastMatchId,
  };
  try {
    const [p1] = await db
      .insert(singleMatchPlayersTable)
      .values(participant1)
      .returning();
    const [p2] = await db
      .insert(singleMatchPlayersTable)
      .values(participant2)
      .returning();
    console.log('p1:', p1.playerId);
    console.log('p2:', p2.playerId);
    await db
      .update(matchTable)
      .set({ victor: participant1.playerId })
      .where(eq(matchTable.id, lastMatchId));
    // error participant
    // const participant3: NewParticipant = { playerId: 1, placement: 1, matchId: 1};
    // const participant4: NewParticipant = { playerId: 1, placement: 2, matchId: 1};
    // await db.insert(singleMatchPlayersTable).values(participant3);
    // await db.insert(singleMatchPlayersTable).values(participant4);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes(
        'Failed query: insert into "single_match_players_table"'
      )
    ) {
      console.log('! Failed to store participant !');
      console.log(error.message);
      process.exit(6);
    }
  }

  /* Show participant info for a match, there is probably a better way to do it */
  const participants_1 = await getMatchPlayers(lastMatchId);
  console.log('Showing participant info for matchId: ', lastMatchId);
  console.log(participants_1);
  console.log(`${participants_1[0].alias}: ${participant1.placement}`);
  console.log(`${participants_1[1].alias}: ${participant2.placement}`);
  const [confirmVictor] = await db
    .select({ victor: matchTable.victor })
    .from(matchTable)
    .where(eq(matchTable.id, lastMatchId));
  console.log(`\nConfirming victor for added match: ${confirmVictor.victor}`);
  // const users_4 = await db.all(sql`SELECT * FROM user_table`);
  // console.log('Result from SQL-like query: ', users_4);
  // const playerExists = await playerExistsInMatch(7, 19);
  // console.log(`playerId 19 exists in matchId 7: ${playerExists}`);
  console.log('---------------------------------------------');
}

const dbTests: Record<string, functionEntry> = {
  '1': { name: 'Test user entries', fn: testUserEntries },
  '2': { name: 'Test db functions', fn: testDbFunctions },
  '3': { name: 'Test friendships', fn: testFriendships },
  '4': { name: 'Test match history', fn: testMatchHistory },
  '5': { name: 'Test match players', fn: testMatchPlayers },
  all: {
    name: 'All tests',
    fn: async () => {
      await testUserEntries();
      await testDbFunctions();
      await testFriendships();
      await testMatchHistory();
      await testMatchPlayers();
    },
  },
};

async function testMenu() {
  console.log('-------------db tests------------');
  Object.entries(dbTests).forEach(([key, test]) => {
    console.log(`${key}: ${test.name}`);
  });
  console.log('---------------------------------');
}

async function main() {
  await testDbExistence();
  /* Reset the tables (doesn't reset the ids) */
  await reset(db, { usersTable });
  await reset(db, { matchTable });
  await reset(db, { singleMatchPlayersTable });
  await reset(db, { friendshipsTable });
  await reset(db, { tournamentTable });
  await reset(db, { tournamentPlayersTable });
  /* or */
  // await db.delete(singleMatchPlayersTable);
  // await db.delete(matchTable);
  // await db.delete(usersTable);

  await testMenu();
  const input = await getTestInput('Choose a test: ');
  const test = dbTests[input];
  if (test) {
    console.log(`Executing: ${test.name}`);
    await test.fn();
  } else {
    console.log('Invalid option');
  }
  rl.close();
}

main();
