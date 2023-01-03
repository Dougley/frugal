import sentryEsbuildPlugin from "@sentry/esbuild-plugin";
import { build } from "esbuild";
import { env } from "./env.js";

const argv = process.argv.slice(2);

// There are 3 modes: "development", "deploy" and "production".
// - "development" uses application configuration from the "development" key
//   in env.jsonc, whereas "deploy" and "production" use the "production" key
//   instead.
// - "development" includes the test server configuration for live-reloading
//   commands to a specific guild
// - "development" and "deploy" include Miniflare-specific code for deployment
//   to test and global servers.
// - "production" removes application secrets so they're not published
/** @type {"development" | "deploy" | "production"} */
const mode = argv[0];
const modes = ["development", "deploy", "production"];
if (!modes.includes(mode)) {
  throw new Error(`mode must be one of ${modes.join(", ")}`);
}
const useProductionApplication = mode !== "development";
const removeDeployCode = mode === "production";
const includeTestServer = mode === "development";

const testServerId = env.testServerId;
const application = useProductionApplication
  ? env?.production
  : env?.development;
const applicationId =
  application?.applicationId ?? process.env.DISCORD_APPLICATION_ID;
const applicationPublicKey =
  application?.applicationPublicKey ?? process.env.DISCORD_PUBLIC_KEY;
const applicationSecret =
  application?.applicationSecret ?? process.env.DISCORD_SECRET;
const applicationToken =
  application?.applicationToken ?? process.env.DISCORD_TOKEN;
const sentryDsn = env?.sentry.dsn ?? process.env.SENTRY_DSN ?? "";
const sentryAuthToken =
  env?.sentry.authToken ?? process.env.SENTRY_AUTH_TOKEN ?? "";
const sentryOrg = env?.sentry.org ?? process.env.SENTRY_ORG ?? "";
const sentryProject = env?.sentry.project ?? process.env.SENTRY_PROJECT ?? "";
const planetscaleHost =
  env?.planetscale.host ?? process.env.PLANETSCALE_HOST ?? "";
const planetscaleUser =
  env?.planetscale.user ?? process.env.PLANETSCALE_USER ?? "";
const planetscalePassword =
  env?.planetscale.password ?? process.env.PLANETSCALE_PASSWORD ?? "";
const summarySite = env?.summarySite ?? process.env.SUMMARY_SITE ?? "";

// Validate environment
function assert(name, value, warn = "") {
  if (value) return;
  if (!warn) throw new Error(`${name} must be set in env.jsonc`);
  console.warn(`⚠️ ${name} is not set in env.jsonc. ${warn}`);
}
if (mode === "development") {
  assert(
    "testServerId",
    testServerId,
    "You must include it to enable automatic reloading of commands."
  );
  assert("development.applicationId", applicationId);
  assert("development.applicationPublicKey", applicationPublicKey);
  assert("development.applicationSecret", applicationSecret);
  assert("development.applicationToken", applicationToken);
  assert("planetscale.host", planetscaleHost);
  assert("planetscale.user", planetscaleUser);
  assert("planetscale.password", planetscalePassword);
} else if (mode === "deploy") {
  assert("production.applicationId", applicationId);
  assert("production.applicationPublicKey", applicationPublicKey);
  assert("production.applicationSecret", applicationSecret);
} else if (mode === "production") {
  assert("sentry.dsn", sentryDsn, "You must include it to enable Sentry.");
  assert("production.applicationId", applicationId);
  assert("production.applicationPublicKey", applicationPublicKey);
  assert("production.applicationToken", applicationToken);
  assert("planetscale.host", planetscaleHost);
  assert("planetscale.user", planetscaleUser);
  assert("planetscale.password", planetscalePassword);
}

// Run esbuild
const define = {
  SLSHX_APPLICATION_ID: JSON.stringify(applicationId),
  SLSHX_APPLICATION_PUBLIC_KEY: JSON.stringify(applicationPublicKey),
  SLSHX_APPLICATION_TOKEN: JSON.stringify(applicationToken),
  SLSHX_APPLICATION_SECRET: removeDeployCode
    ? "undefined" // Don't publish secret
    : JSON.stringify(applicationSecret),
  SLSHX_TEST_SERVER_ID: includeTestServer
    ? JSON.stringify(testServerId)
    : "undefined",
  SENTRY_DSN: JSON.stringify(sentryDsn),
  PLANETSCALE_HOST: JSON.stringify(planetscaleHost),
  PLANETSCALE_USERNAME: JSON.stringify(planetscaleUser),
  PLANETSCALE_PASSWORD: JSON.stringify(planetscalePassword),
  SUMMARY_SITE: JSON.stringify(summarySite),
};
if (removeDeployCode) {
  // Force globalThis.MINIFLARE to be false, so esbuild can remove dead-code
  define["globalThis.MINIFLARE"] = "false";
}

await build({
  entryPoints: ["src/index.tsx"],
  outExtension: { ".js": ".mjs" },
  outdir: "dist",
  target: "esnext",
  format: "esm",
  logLevel: "info",
  bundle: true,
  sourcemap: true,
  jsxFactory: "createElement",
  jsxFragment: "Fragment",
  define,
  // Required to remove dead-code (e.g. `if (false) { ... }`)
  minifySyntax: removeDeployCode,
  minify: removeDeployCode,
  plugins:
    sentryAuthToken && sentryOrg && sentryProject && mode === "production"
      ? [
          sentryEsbuildPlugin({
            authToken: sentryAuthToken,
            org: sentryOrg,
            project: sentryProject,
            include: [{ ext: [".mjs", ".map"], paths: ["./dist"] }],
            finalize: false,
          }),
        ]
      : undefined,
});
