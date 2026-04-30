/**
 * Client-safe exports for use in web applications.
 *
 * This module only exports types and the transformer, avoiding any
 * imports from drizzle durables that include SQL migrations which
 * can't be parsed by Vite.
 */

export type { StateRouter } from "./router";
export { transformer } from "./transformer";
