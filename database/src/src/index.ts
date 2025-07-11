import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { eq, sql } from 'drizzle-orm';
import { matchHistoryTable, singleMatchParticipantsTable, usersTable } from './db/schema';
import { seed, reset } from 'drizzle-seed';

const db = drizzle(process.env.DB_FILE_NAME!);
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
			process.exit(2);
		}
	}
	
	await reset(db, { usersTable });
	await reset(db, { singleMatchParticipantsTable });
	// Pseudorandom seed
	// await seed(db, { usersTable }, { seed: 1 });



	/* Test user entries */
	try {
		await db.insert(usersTable).values({ alias: "first", name: "name_1", email: "example1@example.com"});
		await db.insert(usersTable).values({ alias: "second", name: "name_2", email: "example2@example.com"});
		await db.insert(usersTable).values({ alias: "third", name: "name_3", email: "example3@example.com"});
		await db.insert(usersTable).values({ alias: "fourth", name: "name_4", email: "example4@example.com"});
		// error user
		// await db.insert(usersTable).values({ alias: "fourth", name: "name_4", email: "example4@example.com"});
	} catch (error) {
		if (error instanceof Error && error.message.includes('Failed query: insert into "users_table"')) {
			console.log('! Failed to store user !');
			console.log (error.message);
			process.exit(3);
		}
	}

	const users_3 = await db.select().from(usersTable);
	console.log('Getting all users from the database: ', users_3);


	
	/* Test match history entries */
	let match: NewMatch = { mode: "2v2", victor: "second", createdAt: new Date() };
	// error match
	// match = { mode: "3v3", victor: "sec", createdAt: new Date() };
	try {
		await db.insert(matchHistoryTable).values(match);
	} catch (error) {
		if (error instanceof Error && error.message.includes('Failed query: insert into "match_history_table"')) {
			console.log('! Failed to store match because the victor doesn\'t correlate to an existing alias !');
			console.log(error.message);
			process.exit(4);
		}
	}
	const matches_1 = await db.select().from(matchHistoryTable);
	console.log('Getting all matches from the database: ', matches_1);



	/* Test participants entries */
	const participant1: NewParticipant = { player: "first", score: 3, placement: 2, matchId: 1};
	const participant2: NewParticipant = { player: "second", score: 5, placement: 1, matchId: 1};
	try {
		await db.insert(singleMatchParticipantsTable).values(participant1);
		await db.insert(singleMatchParticipantsTable).values(participant2);
		// error participant
		// const participant3: NewParticipant = { player: "second", score: 5, placement: 1, matchId: 1};
		// await db.insert(singleMatchParticipantsTable).values(participant3);
	} catch (error) {
		if (error instanceof Error && error.message.includes('Failed query: insert into "single_match_players_table"')) {
			console.log('! Failed to store participant !');
			console.log(error.message);
			process.exit(5);
		}
	}
	const participants_1 = await db.select().from(singleMatchParticipantsTable).where(eq(singleMatchParticipantsTable.matchId, 1));
	console.log('Showing participant info for matchId: ', 1);
	console.log(participants_1);
	// const users_4 = await db.all(sql`SELECT * FROM user_table`);
	// console.log('Result from SQL-like query: ', users_4);
};

main();

