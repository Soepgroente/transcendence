import { sqliteTable as table } from "drizzle-orm/sqlite-core"
// import * as t from "drizzle-orm/sqlite-core"
import { int, text, uniqueIndex, index }from "drizzle-orm/sqlite-core"
import { AnySQLiteColumn } from "drizzle-orm/sqlite-core"

function generateUniqueString(length: number = 12): string {
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let uniqueString = "";

	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length);
		uniqueString += characters[randomIndex];
	}

	return uniqueString;
}

export const users = table(
	"users", {
		id: int().primaryKey({ autoIncrement: true }),
		firstName: text("first_name").notNull(),
		lastName: text("last_name").notNull(),
		email: text().notNull(),
		invitee: int().references((): AnySQLiteColumn => users.id),
		role: text().$type<"guest" | "user" | "admin">().default("guest"),
	},
	(table) => [
		uniqueIndex("email_idx").on(table.email)
	]
);

export const posts = table(
	"posts",  {
		id: int().primaryKey({ autoIncrement: true }),
		slug: text().$default(() => generateUniqueString(16)),
		title: text(),
		ownerId: int("owner_id").references((): AnySQLiteColumn => users.id),
	},
	(table) => [
		uniqueIndex("slug_index").on(table.slug),
		index("title_index").on(table.title),
	]
);

export const comments = table(
	"comments", {
		id: int().primaryKey({ autoIncrement: true }),
		text: text({ length: 256 }),
		postId: int("post_id").references((): AnySQLiteColumn => posts.id),
		ownerId: int("owner_id").references((): AnySQLiteColumn => users.id),
	}
);
