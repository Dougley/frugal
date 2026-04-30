import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

/**
 * ESM loader hooks to handle .sql files as raw text exports
 */
export async function load(url, context, nextLoad) {
  if (url.endsWith(".sql")) {
    const filePath = fileURLToPath(url);
    const content = await readFile(filePath, "utf-8");
    return {
      format: "module",
      shortCircuit: true,
      source: `export default ${JSON.stringify(content)};`,
    };
  }

  return nextLoad(url, context);
}
