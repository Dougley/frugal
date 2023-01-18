-- Migration number: 0000 	 2022-12-22T18:37:44.689Z

CREATE TABLE IF NOT EXISTS guilds (
  id BIGINT NOT NULL PRIMARY KEY,
  premium BOOLEAN NOT NULL DEFAULT FALSE,
  emoji_id TEXT,
  emoji_name TEXT,
  embed_color TEXT
);

CREATE TABLE IF NOT EXISTS giveaways (
  message_id BIGINT NOT NULL PRIMARY KEY,
  guild_id BIGINT NOT NULL,
  channel_id BIGINT NOT NULL,
  end_time TIMESTAMP NOT NULL,
  winner_count INTEGER NOT NULL,
  durable_object_id TEXT NOT NULL,
  prize TEXT NOT NULL
);