/// <reference types="node" />

import { glob } from "glob";
import { exec } from "node:child_process";
import * as readline from "node:readline";
import { promisify } from "node:util";
import { rimraf } from "rimraf";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const questionAsync = promisify(rl.question).bind(rl);
const execAsync = promisify(exec);

const migrationName = await questionAsync("Migration name: ");

console.log(`Creating migration ${migrationName}...`);
await execAsync(`pnpx wrangler d1 migrations create frugal ${migrationName}`);
await questionAsync(
  "Migration created. Edit prisma/schema.prisma and continue whenever you're ready. Hit enter to continue.",
);
rl.close();
const files = await glob(`migrations/*${migrationName}.sql`);
const latestMigration = files[files.length - 1];
if (latestMigration.startsWith("migrations/0001_")) {
  console.log(`Running 'prisma migrate diff' with ${latestMigration}...`);
  await execAsync(
    `pnpx prisma migrate diff --from-empty --to-schema-datamodel ./prisma/schema.prisma --script --output ${latestMigration}`,
  );
} else {
  console.log("Running 'wrangler d1 migrations apply'...");
  await execAsync("pnpx wrangler d1 migrations apply frugal --local");
  console.log(`Running 'prisma migrate diff' with ${latestMigration}...`);
  await execAsync(
    `pnpx prisma migrate diff --from-local-d1 --to-schema-datamodel ./prisma/schema.prisma --script --output ${latestMigration}`,
  );
}
console.log("Removing temporary files...");
await rimraf(".wrangler"); // the sqlite db we created earlier with 'wrangler d1 migrations apply'
console.log("Migration created!");
process.exit(0);
