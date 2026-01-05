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

export const entitlements = sqliteTable(
  "Entitlements",
  {
    id: text("id").primaryKey(),
    applicationId: text("application_id").notNull(),
    skuId: text("sku_id").notNull(),
    userId: text("user_id"),
    guildId: text("guild_id"),
    type: int("type").notNull(),
    deleted: int("deleted", { mode: "boolean" }).notNull().default(false),
    startsAt: text("starts_at").notNull(),
    endsAt: text("ends_at"),
    consumed: int("consumed", { mode: "boolean" }),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_entitlements_guild_id").on(table.guildId),
    index("idx_entitlements_user_id").on(table.userId),
    index("idx_entitlements_sku_id").on(table.skuId),
    index("idx_entitlements_type").on(table.type),
    index("idx_entitlements_deleted").on(table.deleted),
    index("idx_entitlements_active").on(
      table.deleted,
      table.startsAt,
      table.endsAt
    ),
  ]
);

export const subscriptionEvents = sqliteTable(
  "SubscriptionEvents",
  {
    id: text("id").primaryKey(),
    entityId: text("entity_id").notNull(),
    eventType: text("event_type").notNull(),
    eventData: text("event_data", { mode: "json" }),
    processed: int("processed", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    processedAt: text("processed_at"),
  },
  (table) => [
    index("idx_subscription_events_entity").on(table.entityId),
    index("idx_subscription_events_type").on(table.eventType),
    index("idx_subscription_events_processed").on(table.processed),
    index("idx_subscription_events_created").on(table.createdAt),
    index("idx_subscription_events_unprocessed").on(
      table.processed,
      table.createdAt
    ),
    index("idx_subscription_events_type_entity").on(
      table.eventType,
      table.entityId
    ),
  ]
);

export const guildActiveGiveaways = sqliteTable(
  "GuildActiveGiveaways",
  {
    guildId: text("guild_id").notNull(),
    durableObjectId: text("durable_object_id").primaryKey(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_guild_active_giveaways_guild_id").on(table.guildId)]
);
