import { readFileSync } from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Register the ESM loader hooks
register("./sql-loader-hooks.mjs", pathToFileURL("./scripts/"));

// Also patch require.extensions for CJS compatibility
// This handles the case where tsx/esbuild-kit uses CJS require
const Module = await import("node:module");
const _originalRequire = Module.default.prototype.require;

Module.default._extensions[".sql"] = (module, filename) => {
  const content = readFileSync(filename, "utf-8");
  module.exports = content;
};
