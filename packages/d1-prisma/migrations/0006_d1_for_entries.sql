-- Migration number: 0006 	 2023-06-08T14:42:13.129Z
ALTER TABLE giveaways
ADD COLUMN host_id TEXT NOT NULL;
--
CREATE TABLE IF NOT EXISTS "entries"
(
  giveaway_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  winner BOOLEAN NOT NULL DEFAULT FALSE,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  avatar TEXT,
  username TEXT NOT NULL,
  discriminator TEXT,
  CONSTRAINT fk_giveaway_id FOREIGN KEY (giveaway_id) REFERENCES giveaways (message_id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, giveaway_id)
);
--
CREATE INDEX IF NOT EXISTS idx_entries_giveaway_id ON entries (giveaway_id);
--
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries (user_id);
--
CREATE INDEX IF NOT EXISTS idx_entries_winner ON entries (winner, giveaway_id);
--
CREATE TRIGGER IF NOT EXISTS trg_entries_add
AFTER
INSERT ON entries BEGIN
UPDATE giveaways
SET entry_count = entry_count + 1
WHERE message_id = NEW.giveaway_id;
END;
--
CREATE TRIGGER IF NOT EXISTS trg_entries_delete
AFTER DELETE ON entries BEGIN
UPDATE giveaways
SET entry_count = entry_count - 1
WHERE message_id = OLD.giveaway_id;
END;