import { sql } from "drizzle-orm";
import {
  index,
  int,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const giveaways = sqliteTable(
  "Giveaways",
  {
    messageId: text("message_id").primaryKey(),
    guildId: text("guild_id").notNull(),
    channelId: text("channel_id").notNull(),
    endTime: text("end_time").notNull(),
    prize: text("prize").notNull(),
    winners: int("winners").notNull(),
    entryCount: int("entry_count").notNull().default(0),
    durableObjectId: text("durable_object_id").notNull().unique(),
    description: text("description"),
    hostId: text("host_id").notNull(),
    state: text("state").notNull().default("NEW"),
  },
  (table) => [
    index("idx_giveaways_state").on(table.state),
    index("idx_durable_object_id").on(table.durableObjectId),
    index("idx_channel_id").on(table.channelId),
    index("idx_guild_id").on(table.guildId),
  ]
);

export const entries = sqliteTable(
  "Entries",
  {
    giveawayId: text("giveaway_id")
      .notNull()
      .references(() => giveaways.messageId, {
        onDelete: "cascade",
        onUpdate: "no action",
      }),
    userId: text("user_id").notNull(),
    winner: int("winner", { mode: "boolean" }).notNull().default(false),
    timestamp: text("timestamp").notNull().default(sql`CURRENT_TIMESTAMP`),
    avatar: text("avatar"),
    username: text("username").notNull(),
    discriminator: text("discriminator"),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.giveawayId] }),
    index("idx_entries_winner").on(table.winner, table.giveawayId),
    index("idx_entries_user_id").on(table.userId),
    index("idx_entries_giveaway_id").on(table.giveawayId),
  ]
);
