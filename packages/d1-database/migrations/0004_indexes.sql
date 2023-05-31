-- Migration number: 0004 	 2023-05-30T13:30:35.818Z
CREATE INDEX IF NOT EXISTS idx_guild_id ON giveaways (guild_id);
CREATE INDEX IF NOT EXISTS idx_channel_id ON giveaways (channel_id);
CREATE INDEX IF NOT EXISTS idx_durable_object_id ON giveaways (durable_object_id);