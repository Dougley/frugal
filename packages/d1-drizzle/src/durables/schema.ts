import { sql } from "drizzle-orm";
import {
  index,
  int,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const entries = sqliteTable(
  "Entries",
  {
    userId: text("user_id").notNull(),
    winner: int("winner", { mode: "boolean" }).notNull().default(false),
    timestamp: text("timestamp").notNull().default(sql`CURRENT_TIMESTAMP`),
    avatar: text("avatar"),
    username: text("username").notNull(),
    discriminator: text("discriminator"),
  },
  (table) => [
    primaryKey({ columns: [table.userId] }),
    index("idx_entries_winner").on(table.winner),
  ]
);
