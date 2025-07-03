#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const I18N_DIR = join(__dirname, "../i18n");
const KV_BINDING = "KV_LOCALES";
const TEMP_DIR = join(__dirname, "../.temp");

/**
 * Execute a command with proper error handling
 */
function executeCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: ["inherit", "pipe", "pipe"],
      cwd: join(__dirname, ".."),
      ...options,
    });

    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(
          new Error(`${command} command failed with code ${code}: ${stderr}`)
        );
      }
    });
  });
}

/**
 * Execute wrangler command with proper error handling
 */
function executeWrangler(args) {
  return executeCommand("pnpm", ["wrangler", ...args]);
}

/**
 * Load a TypeScript translation file using tsx
 */
async function loadTranslationFile(filePath) {
  try {
    // Extract the locale from the filename (e.g., en-US.ts -> en-US)
    const locale = basename(filePath, extname(filePath));

    console.log(`📁 Loading ${locale}...`);

    // Ensure temp directory exists
    if (!existsSync(TEMP_DIR)) {
      await mkdir(TEMP_DIR, { recursive: true });
    }

    // Create a temporary loader script
    const loaderPath = join(TEMP_DIR, `load-${locale}.mjs`);
    const loaderContent = `
import translation from '../i18n/${locale}.ts';
console.log(JSON.stringify(translation));
`;

    await writeFile(loaderPath, loaderContent);

    try {
      // Use tsx to execute the loader
      const { stdout } = await executeCommand("pnpm", ["tsx", loaderPath]);
      const translationData = JSON.parse(stdout.trim());

      // Clean up
      await unlink(loaderPath);

      return {
        locale,
        data: translationData,
      };
    } catch (tsxError) {
      // Clean up on error
      try {
        await unlink(loaderPath);
      } catch (_cleanupError) {
        // Ignore cleanup errors
      }

      throw new Error(
        `Failed to load translation with tsx: ${tsxError.message}`
      );
    }
  } catch (error) {
    console.warn(`Failed to load translation file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Get all translation files from the i18n directory
 */
async function getTranslationFiles() {
  try {
    const files = await readdir(I18N_DIR);
    return files
      .filter((file) => file.endsWith(".ts"))
      .map((file) => join(I18N_DIR, file));
  } catch (error) {
    throw new Error(`Failed to read i18n directory: ${error.message}`);
  }
}

/**
 * Upload a translation to KV
 */
async function uploadTranslation(locale, data, environment = null) {
  const key = `locale:${locale}`;
  const value = JSON.stringify(data, null, 2);

  console.log(`📤 Uploading translation for locale: ${locale}`);

  // Ensure temp directory exists
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }

  // Write value to a temporary file
  const valuePath = join(TEMP_DIR, `value-${locale}.json`);
  await writeFile(valuePath, value, "utf-8");

  const args = [
    "kv",
    "key",
    "put",
    key,
    "--path",
    valuePath,
    "--binding",
    KV_BINDING,
  ];

  // Add environment flag if specified
  if (environment) {
    args.push("--env", environment);
  }

  // Add local flags for development environment
  if (!environment || environment === "development") {
    args.push("--local", "--persist-to", "../../.mf");
  }

  try {
    console.log(
      "🔧 Debug - wrangler command:",
      ["pnpm", "wrangler", ...args].join(" ")
    );
    await executeWrangler(args);
    console.log(`✅ Successfully uploaded ${locale}`);

    // Clean up temp file
    await unlink(valuePath);
  } catch (error) {
    console.error(`❌ Failed to upload ${locale}:`, error.message);

    // Clean up temp file on error
    try {
      await unlink(valuePath);
    } catch (_cleanupError) {
      // Ignore cleanup errors
    }

    throw error;
  }
}

/**
 * List all current translations in KV
 */
async function listKVTranslations(environment = null) {
  console.log("📋 Listing current translations in KV...");

  const args = [
    "kv",
    "key",
    "list",
    "--binding",
    KV_BINDING,
    "--prefix",
    "locale:",
  ];

  if (environment) {
    args.push("--env", environment);
  }

  // Add local flags for development environment
  if (!environment || environment === "development") {
    args.push("--local", "--persist-to", "../../.mf");
  }

  try {
    const { stdout } = await executeWrangler(args);
    const keys = JSON.parse(stdout);
    return keys.map((item) => item.name.replace("locale:", ""));
  } catch (error) {
    console.warn("Failed to list KV translations:", error.message);
    return [];
  }
}

/**
 * Delete a translation from KV
 */
async function deleteTranslation(locale, environment = null) {
  const key = `locale:${locale}`;

  console.log(`🗑️  Deleting translation for locale: ${locale}`);

  const args = ["kv", "key", "delete", key, "--binding", KV_BINDING];

  if (environment) {
    args.push("--env", environment);
  }

  // Add local flags for development environment
  if (!environment || environment === "development") {
    args.push("--local", "--persist-to", "../../.mf");
  }

  try {
    await executeWrangler(args);
    console.log(`✅ Successfully deleted ${locale}`);
  } catch (error) {
    console.error(`❌ Failed to delete ${locale}:`, error.message);
  }
}

/**
 * Main sync function
 */
async function syncTranslations(options = {}) {
  const { environment = null, dryRun = false, clean = false } = options;

  console.log("🚀 Starting translation sync to KV...");
  console.log(`Environment: ${environment || "development"}`);
  console.log(
    `Storage: ${!environment || environment === "development" ? "Local KV (../../.mf)" : "Remote KV"}`
  );
  console.log(`Dry run: ${dryRun ? "Yes" : "No"}`);
  console.log(`Clean sync: ${clean ? "Yes" : "No"}`);
  console.log("");

  try {
    // Get all translation files
    const translationFiles = await getTranslationFiles();
    console.log(`Found ${translationFiles.length} translation file(s)`);

    // Load all translations
    const translations = [];
    for (const filePath of translationFiles) {
      const translation = await loadTranslationFile(filePath);
      if (translation) {
        translations.push(translation);
        console.log(`📁 Loaded ${translation.locale}`);
      }
    }

    if (translations.length === 0) {
      console.log("⚠️  No valid translations found to sync");
      return;
    }

    // Get current KV translations if doing a clean sync
    let currentLocales = [];
    if (clean) {
      currentLocales = await listKVTranslations(environment);
      console.log(`Current locales in KV: ${currentLocales.join(", ")}`);
    }

    if (dryRun) {
      console.log("\n🔍 DRY RUN - Would perform the following actions:");
      translations.forEach(({ locale }) => {
        console.log(`  - Upload translation: ${locale}`);
      });

      if (clean) {
        const toDelete = currentLocales.filter(
          (locale) => !translations.find((t) => t.locale === locale)
        );
        toDelete.forEach((locale) => {
          console.log(`  - Delete translation: ${locale}`);
        });
      }

      console.log("\nRun without --dry-run to execute these actions.");
      return;
    }

    // Upload translations
    for (const { locale, data } of translations) {
      await uploadTranslation(locale, data, environment);
    }

    // Clean up removed translations if requested
    if (clean) {
      const toDelete = currentLocales.filter(
        (locale) => !translations.find((t) => t.locale === locale)
      );

      for (const locale of toDelete) {
        await deleteTranslation(locale, environment);
      }
    }

    console.log("\n🎉 Translation sync completed successfully!");
    console.log(`📊 Synced ${translations.length} translation(s)`);
  } catch (error) {
    console.error("\n❌ Sync failed:", error.message);
    process.exit(1);
  }
}

// CLI interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    environment: null,
    dryRun: false,
    clean: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--env":
      case "-e":
        options.environment = args[++i];
        break;
      case "--dry-run":
      case "-d":
        options.dryRun = true;
        break;
      case "--clean":
      case "-c":
        options.clean = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
📚 Translation KV Sync Script

Usage: node kv-i18n-sync.mjs [options]

Options:
  -e, --env <environment>    Target environment (production, staging)
  -d, --dry-run             Show what would be done without executing
  -c, --clean               Remove translations not found in local files
  -h, --help                Show this help message

Examples:
  node kv-i18n-sync.mjs                    # Sync to development
  node kv-i18n-sync.mjs --env production   # Sync to production
  node kv-i18n-sync.mjs --dry-run          # Preview changes
  node kv-i18n-sync.mjs --clean            # Clean sync (remove unused)

The script looks for translation files in ../i18n/ and uploads them to
the KV_LOCALES namespace using wrangler.

Key structure in KV: locale:<locale-name>
Value: JSON representation of the translation object
`);
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  syncTranslations(options);
}

export {
  deleteTranslation,
  listKVTranslations,
  syncTranslations,
  uploadTranslation,
};
