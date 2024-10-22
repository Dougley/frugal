-- Migration number: 0000 	 2023-04-25T15:14:41.523Z
CREATE TABLE IF NOT EXISTS giveaways (
  message_id BIGINT NOT NULL PRIMARY KEY,
  guild_id BIGINT NOT NULL,
  channel_id BIGINT NOT NULL,
  end_time TIMESTAMP NOT NULL,
  prize TEXT NOT NULL,
  winners INTEGER NOT NULL,
  entry_count INTEGER NOT NULL DEFAULT 0,
  durable_object_id TEXT NOT NULL,
  UNIQUE (durable_object_id)
);