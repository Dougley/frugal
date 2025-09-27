#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readdir, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const KV_BINDING = "KV_LOCALES";

// Environment detection
const isDev = process.env.npm_lifecycle_event?.includes(":dev") ?? false;
const wranglerEnv = process.env.WRANGLER_ENV || (isDev ? null : "staging");

/**
 * Execute wrangler command with proper error handling
 */
function executeWrangler(args) {
  return new Promise((resolve, reject) => {
    const process = spawn("pnpm", ["wrangler", ...args], {
      stdio: "pipe", // ahh, silence
      cwd: join(__dirname, ".."),
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Wrangler command failed with code ${code}`));
      }
    });
  });
}

/**
 * Load a TypeScript translation file using tsx/esm
 */
async function loadTranslationFile(filePath) {
  const locale = basename(filePath, extname(filePath));
  // Use tsx/esm to directly import TypeScript files
  const { register } = await import("tsx/esm/api");
  const dispose = register();
  try {
    const translation = await import(filePath);
    return {
      locale,
      data: translation.default,
    };
  } catch (error) {
    console.error(`Failed to load ${locale}:`, error.message);
    return null;
  } finally {
    // Dispose the tsx/esm registration to avoid memory leaks
    await dispose();
  }
}

/**
 * Upload a translation to KV
 */
async function uploadTranslation(locale, data) {
  const key = `locale:${locale}`;
  const tempFile = join(__dirname, `temp-${locale}-${Date.now()}.json`);

  await writeFile(tempFile, JSON.stringify(data, null, 2));

  const args = [
    "kv",
    "key",
    "put",
    key,
    "--path",
    tempFile,
    "--binding",
    KV_BINDING,
  ];

  // Add environment-specific flags
  if (isDev) {
    args.push("--local", "--persist-to", "../../.mf");
  } else if (wranglerEnv) {
    args.push("--env", wranglerEnv, "--remote");
  }

  await executeWrangler(args);
  console.log(`✅ Uploaded ${locale}`);
  // Clean up temporary file
  try {
    await unlink(tempFile);
  } catch (error) {
    console.error(
      `Failed to delete temporary file ${tempFile}:`,
      error.message
    );
  }
}

/**
 * Main sync function
 */
async function syncTranslations() {
  const envDisplay = isDev ? "local" : wranglerEnv || "staging (default)";
  console.log(`🚀 Syncing translations to ${envDisplay} KV...`);

  try {
    // Get all translation files
    const files = await readdir(join(__dirname, "../i18n"));
    const translationFiles = files
      .filter((file) => file.endsWith(".ts"))
      .map((file) => join(__dirname, "../i18n", file));

    console.log(`Found ${translationFiles.length} translation files`);

    // Load and upload all translations
    for (const filePath of translationFiles) {
      const translation = await loadTranslationFile(filePath);
      if (translation) {
        await uploadTranslation(translation.locale, translation.data);
      }
    }

    console.log("✅ Translation sync completed!");
  } catch (error) {
    console.error("❌ Sync failed:", error.message);
    process.exit(1);
  }
}

// Run sync
syncTranslations();
