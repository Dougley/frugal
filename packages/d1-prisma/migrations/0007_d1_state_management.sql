-- Migration number: 0007    2024-10-03T12:18:13.158Z
ALTER TABLE giveaways
ADD COLUMN state TEXT NOT NULL DEFAULT 'NEW' CHECK (state IN ('NEW', 'OPEN', 'CLOSED', 'CANCELLED'));
--
CREATE INDEX IF NOT EXISTS idx_giveaways_state ON giveaways (state);