#!/usr/bin/env node

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createI18n } from "@dougley/frugal-i18n";
import dotenv from "dotenv";
import { syncCommand } from "slash-up";
import { getPlatformProxy } from "wrangler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..");

// Environment detection
const isDev = process.env.npm_lifecycle_event?.includes(":dev") ?? false;
const wranglerEnv = process.env.WRANGLER_ENV || (isDev ? null : "staging");

// Setup environment
dotenv.config({ path: resolve(PROJECT_ROOT, ".dev.vars") });

/**
 * Initialize i18n with wrangler for command registration
 */
async function initializeI18n() {
  const proxy = await getPlatformProxy({
    persist: { path: resolve(PROJECT_ROOT, "../../.mf/v3") },
  });

  if (!proxy.env.KV_LOCALES) {
    throw new Error("KV_LOCALES binding not found");
  }

  return createI18n({
    kv: proxy.env.KV_LOCALES,
    defaultLanguage: "en-US",
  });
}

/**
 * Load slash-up configuration
 */
async function loadSlashUpConfig() {
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  const config = require(resolve(PROJECT_ROOT, "slash-up.config.js"));

  // Apply environment-specific config if available
  if (wranglerEnv && config.env?.[wranglerEnv]) {
    return { ...config, ...config.env[wranglerEnv] };
  }

  return config;
}

/**
 * Main registration function
 */
async function registerCommands() {
  const envDisplay = isDev ? "local" : wranglerEnv || "staging";
  console.log(`🚀 Registering commands for ${envDisplay}...`);

  try {
    // Initialize i18n and make it globally available
    const i18n = await initializeI18n();
    global.__FRUGAL_REGISTRATION_I18N__ = i18n;

    // Set registration environment flags
    process.env.FRUGAL_REGISTRATION_MODE = "true";
    process.env.FRUGAL_SUPPRESS_I18N_DEBUG = "true";

    // Load base config
    const baseConfig = await loadSlashUpConfig();

    // Register slash commands
    console.log("📝 Registering slash commands...");
    await syncCommand.handler({
      ...baseConfig,
      commandPath: "./src/commands/slash",
    });

    // Register message commands
    console.log("📝 Registering message commands...");
    await syncCommand.handler({
      ...baseConfig,
      commandPath: "./src/commands/message",
    });

    console.log("✅ Commands registered successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Registration failed:", error.message);
    process.exit(1);
  }
}

// Run registration
registerCommands();
