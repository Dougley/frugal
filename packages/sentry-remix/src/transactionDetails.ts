import { matchServerRoutes, type RouteMatch } from "@remix-run/server-runtime/dist/routeMatching";
import { type ServerRoute } from "@remix-run/server-runtime/dist/routes";
import { type TransactionSource } from "@sentry/types";

// https://github.com/remix-run/remix/blob/97999d02493e8114c39d48b76944069d58526e8d/packages/remix-server-runtime/server.ts#L573-L586
const isIndexRequestUrl = (url: URL): boolean => {
  for (const parameter of url.searchParams.getAll("index")) {
    // only use bare `?index` params without a value
    // ✅ /foo?index
    // ✅ /foo?index&index=123
    // ✅ /foo?index=123&index
    // ❌ /foo?index=123
    if (parameter === "") {
      return true;
    }
  }

  return false;
};

// https://github.com/remix-run/remix/blob/97999d02493e8114c39d48b76944069d58526e8d/packages/remix-server-runtime/server.ts#L588-L596
const getRequestMatch = (url: URL, matches: RouteMatch<ServerRoute>[]): RouteMatch<ServerRoute> => {
  const match = matches.slice(-1)[0];

  if (match === undefined) {
    throw new Error("No match found in the array. This should never occur.");
  }

  if (!isIndexRequestUrl(url) && match.route.id.endsWith("/index")) {
    const nextMatch = matches.slice(-2)[0];

    if (nextMatch === undefined) {
      throw new Error("No match found in the array. This should never occur.");
    }

    return nextMatch;
  }

  return match;
};

/**
 * Get transaction name from routes and url
 */
export const getTransactionDetails = (
  routes: ServerRoute[],
  url: URL
): { name: string; source: TransactionSource; params?: { [key: string]: string | undefined } } => {
  const matches = matchServerRoutes(routes, url.pathname);
  const match = matches && getRequestMatch(url, matches);
  return match === null
    ? { name: url.pathname, source: "url" }
    : { name: match.route.id, source: "route", params: match.params };
};