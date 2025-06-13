#!/usr/bin/env node

import { createI18n } from '@dougley/frugal-i18n';
import dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { syncCommand } from 'slash-up';
import { fileURLToPath } from 'url';
import { getPlatformProxy } from 'wrangler';

// === CONSTANTS ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

const CONFIG_PATHS = {
  env: resolve(PROJECT_ROOT, '.dev.vars'),
  slashUp: resolve(PROJECT_ROOT, 'slash-up.config.js'),
  wranglerData: resolve(PROJECT_ROOT, '../../.mf/v3'),
  tempConfig: resolve(PROJECT_ROOT, '.temp-config.cjs')
};

const ENVIRONMENT_FLAGS = {
  registrationMode: 'FRUGAL_REGISTRATION_MODE',
  suppressDebug: 'FRUGAL_SUPPRESS_I18N_DEBUG'
};

const GLOBAL_KEYS = {
  registrationI18n: '__FRUGAL_REGISTRATION_I18N__'
};

// === SETUP ===
dotenv.config({ path: CONFIG_PATHS.env });

// === I18N INITIALIZATION ===
/**
 * Initialize i18n with wrangler for command registration
 * @returns {Promise<import('@dougley/frugal-i18n').I18nInstance>} Configured i18n instance
 * @throws {Error} If initialization fails
 */
async function initializeI18n() {
  console.log('🔧 Initializing i18n for command registration...');

  try {
    const proxy = await getPlatformProxy({
      persist: { path: CONFIG_PATHS.wranglerData }
    });

    if (!proxy.env.KV_LOCALES) {
      throw new Error('KV_LOCALES binding not found in wrangler environment');
    }

    const i18n = createI18n({
      kv: proxy.env.KV_LOCALES,
      defaultLanguage: 'en-US'
    });

    console.log('✅ i18n initialized successfully');
    return i18n;
  } catch (error) {
    console.error('❌ Failed to initialize i18n:', error.message);
    throw error;
  }
}

/**
 * Configure global variables for command registration
 * @param {import('@dougley/frugal-i18n').I18nInstance} i18n - Initialized i18n instance
 */
function setupRegistrationEnvironment(i18n) {
  console.log('🔧 Setting up registration environment...');

  try {
    // Make i18n available to commands during registration
    global[GLOBAL_KEYS.registrationI18n] = i18n;

    // Set environment flags
    process.env[ENVIRONMENT_FLAGS.registrationMode] = 'true';
    process.env[ENVIRONMENT_FLAGS.suppressDebug] = 'true';

    console.log('✅ Registration environment configured');
  } catch (error) {
    console.error('❌ Failed to setup registration environment:', error.message);
    throw error;
  }
}

// === CONFIGURATION HANDLING ===
/**
 * Parse command line arguments to extract environment name
 * @param {string[]} args - Command line arguments
 * @returns {string | null} Environment name or null if not specified
 */
function parseEnvironmentFromArgs(args) {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Handle --env flag or -e flag
    if ((arg === '--env' || arg === '-e') && args[i + 1]) {
      return args[i + 1];
    }

    // Handle --env=value format
    if (arg.startsWith('--env=')) {
      const value = arg.split('=')[1];
      return value || null;
    }

    // First non-flag argument is assumed to be environment
    if (!arg.startsWith('-') && i === 0) {
      return arg;
    }
  }

  return null;
}

/**
 * Load and parse the slash-up configuration file
 * Uses temporary file approach to handle CommonJS imports in ES module context
 * @returns {Promise<object>} The parsed configuration object
 * @throws {Error} If configuration loading fails
 */
async function loadSlashUpConfiguration() {
  console.log('📝 Loading slash-up configuration...');

  try {
    const fs = await import('fs/promises');
    const { createRequire } = await import('module');

    // Read the CommonJS config and create temporary file
    const configContent = await fs.readFile(CONFIG_PATHS.slashUp, 'utf-8');
    await fs.writeFile(CONFIG_PATHS.tempConfig, configContent);

    // Use require to load CommonJS config
    const require = createRequire(import.meta.url);
    delete require.cache[CONFIG_PATHS.tempConfig]; // Clear cache for fresh load

    const config = require(CONFIG_PATHS.tempConfig);
    console.log('✅ Configuration loaded successfully');
    return config;
  } catch (error) {
    throw new Error(`Failed to load slash-up configuration: ${error.message}`);
  } finally {
    // Clean up temporary file
    await cleanupTempFile();
  }
}

/**
 * Apply environment-specific configuration overrides
 * @param {object} baseConfig - Base slash-up configuration
 * @param {string | null} environment - Environment name to apply
 * @returns {object} Final configuration with environment overrides
 */
function applyEnvironmentConfiguration(baseConfig, environment) {
  if (!environment || !baseConfig.env?.[environment]) {
    return baseConfig;
  }

  console.log(`🔧 Applying ${environment} environment configuration`);
  return { ...baseConfig, ...baseConfig.env[environment] };
}

/**
 * Clean up temporary configuration file
 */
async function cleanupTempFile() {
  try {
    const fs = await import('fs/promises');
    await fs.unlink(CONFIG_PATHS.tempConfig);
  } catch {
    // Ignore cleanup errors - file might not exist
  }
}

// === COMMAND REGISTRATION ===
/**
 * Register Discord commands using slash-up programmatically
 * @param {string[]} args - Command line arguments
 * @throws {Error} If registration fails
 */
async function registerCommands(args) {
  console.log('🚀 Registering Discord commands...');

  try {
    const environment = parseEnvironmentFromArgs(args);
    const baseConfig = await loadSlashUpConfiguration();
    const finalConfig = applyEnvironmentConfiguration(baseConfig, environment);

    // Execute the registration using slash-up's programmatic API
    await syncCommand.handler(finalConfig);
    console.log('✅ Commands registered successfully');
  } catch (error) {
    console.error('❌ Command registration failed:', error.message);
    throw error;
  }
}

// === MAIN EXECUTION ===
/**
 * Main execution function - coordinates the entire registration process
 */
async function main() {
  console.log('🎯 Starting Discord command registration...\n');

  try {
    // Initialize i18n with wrangler access
    const i18n = await initializeI18n();
    console.log('');

    // Set up global environment for command registration
    setupRegistrationEnvironment(i18n);
    console.log('');

    // Parse arguments and register commands
    const args = process.argv.slice(2);
    await registerCommands(args);

    console.log('\n🎉 Command registration completed successfully!');
  } catch (error) {
    console.error('\n💥 Command registration failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
