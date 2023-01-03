import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "..", "env.jsonc");

/**
 * @typedef {Object} Application
 * @property {string} applicationId
 * @property {string} applicationPublicKey
 * @property {string} applicationSecret
 */

/**
 * @typedef {Object} Sentry
 * @property {string?} dsn
 * @property {string?} org
 * @property {string?} project
 * @property {string?} authToken
 */

/**
 * @typedef {Object} Env
 * @property {string} testServerId
 * @property {Application} development
 * @property {Application} production
 * @property {Sentry} sentry
 */

let envJson;
try {
  await fs.access(envPath);
  envJson = (await fs.readFile(envPath, "utf8"))
    .split("\n")
    // Remove "//" comments
    .map((line) => {
      if (line.trim().startsWith("//"))
        return line.replace(/\/\/.*$/, "").trim();
      return line;
    })
    .filter(Boolean)
    .join("\n");
} catch (error) {
  envJson = JSON.stringify({
    testServerId: null,
    development: {
      applicationId: null,
      applicationPublicKey: null,
      applicationSecret: null,
    },
    production: {
      applicationId: null,
      applicationPublicKey: null,
      applicationSecret: null,
    },
    sentry: {
      dsn: null,
      org: null,
      project: null,
      authToken: null,
    },
    planetscale: {
      host: null,
      user: null,
      password: null,
    },
  });
}

/**
 * @type {Env?}
 */
export const env = JSON.parse(envJson);
