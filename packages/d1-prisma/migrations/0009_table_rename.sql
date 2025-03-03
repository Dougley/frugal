-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "entries";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "giveaways";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Entries" (
    "giveaway_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "winner" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatar" TEXT,
    "username" TEXT NOT NULL,
    "discriminator" TEXT,

    PRIMARY KEY ("user_id", "giveaway_id"),
    CONSTRAINT "Entries_giveaway_id_fkey" FOREIGN KEY ("giveaway_id") REFERENCES "Giveaways" ("message_id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "Giveaways" (
    "message_id" TEXT NOT NULL PRIMARY KEY,
    "guild_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "end_time" DATETIME NOT NULL,
    "prize" TEXT NOT NULL,
    "winners" INTEGER NOT NULL,
    "entry_count" INTEGER NOT NULL DEFAULT 0,
    "durable_object_id" TEXT NOT NULL,
    "description" TEXT,
    "host_id" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'NEW'
);

-- CreateIndex
CREATE INDEX "idx_entries_winner" ON "Entries"("winner", "giveaway_id");

-- CreateIndex
CREATE INDEX "idx_entries_user_id" ON "Entries"("user_id");

-- CreateIndex
CREATE INDEX "idx_entries_giveaway_id" ON "Entries"("giveaway_id");

-- CreateIndex
CREATE INDEX "idx_giveaways_state" ON "Giveaways"("state");

-- CreateIndex
CREATE INDEX "idx_durable_object_id" ON "Giveaways"("durable_object_id");

-- CreateIndex
CREATE INDEX "idx_channel_id" ON "Giveaways"("channel_id");

-- CreateIndex
CREATE INDEX "idx_guild_id" ON "Giveaways"("guild_id");
