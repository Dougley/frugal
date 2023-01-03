import { Log, LogLevel, Miniflare } from "miniflare";
import readline from "readline";
import { env } from "./env.js";

const applicationId = env.production.applicationId;

if (!process.env.CI) {
  // Confirm deployment with prompt
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const question = `⚠️ Are you sure you want to deploy globally?
This will update the commands in EVERY server your app (${applicationId}) has been added to.
Changes may take up to an hour to propagate.

Note that Slshx instantly deploys to just your test server whenever you change your code.

(y/N) `;
  const answer = await new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });
  rl.close();
  if (!answer.toLowerCase().startsWith("y")) process.exit(0);
}

// Start Miniflare to run Worker
const mf = new Miniflare({
  log: new Log(LogLevel.DEBUG),
  // Autoload configuration from the wrangler.toml file
  wranglerConfigPath: true,
  packagePath: true,
  envPath: true,
  // Manually define script as Miniflare doesn't currently respect top-level
  // `main` in `wrangler.toml`
  scriptPath: "dist/index.mjs",
  modules: true,
  // Build the worker in "deploy" mode, which includes Miniflare-specific
  // deployment code, but uses the production configuration.
  buildCommand: "node scripts/build.js deploy",
});

// Deploy commands globally
await mf.dispatchFetch("http://localhost:8787/discord?slshx_action=deploy", {
  method: "POST",
});

// Build the authorize URL
const url = new URL("https://discord.com/api/oauth2/authorize");
url.searchParams.set("client_id", applicationId);
url.searchParams.set("scope", "applications.commands");

// Log success
const green = (s) => `\x1b[32m${s}\x1b[39m`;
console.log(
  green("[slshx] Deployed! ✅  (changes may take up to an hour to propagate)")
);
if (!process.env.CI) {
  console.log(
    green(`[slshx] Add the application to your server here: ${url.toString()}`)
  );
}
