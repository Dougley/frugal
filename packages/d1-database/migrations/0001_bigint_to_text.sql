-- Migration number: 0001 	 2023-05-01T15:13:09.968Z
PRAGMA foreign_keys = OFF;
CREATE TABLE IF NOT EXISTS giveaways_temp (
  message_id TEXT NOT NULL PRIMARY KEY,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  end_time TIMESTAMP NOT NULL,
  prize TEXT NOT NULL,
  winners INTEGER NOT NULL,
  entry_count INTEGER NOT NULL DEFAULT 0,
  durable_object_id TEXT NOT NULL,
  UNIQUE (durable_object_id)
);
INSERT INTO giveaways_temp (
    message_id,
    guild_id,
    channel_id,
    end_time,
    prize,
    winners,
    entry_count,
    durable_object_id
  )
SELECT message_id,
  guild_id,
  channel_id,
  end_time,
  prize,
  winners,
  entry_count,
  durable_object_id
FROM giveaways;
DROP TABLE giveaways;
ALTER TABLE giveaways_temp
  RENAME TO giveaways;
PRAGMA foreign_keys = ON;