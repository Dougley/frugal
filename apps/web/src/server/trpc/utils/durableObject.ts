/**
 * Durable Object client utilities for TRPC procedures
 *
 * Provides helper functions to create TRPC clients for communicating
 * with the GiveawayStateV3 Durable Object.
 */

import {
  type StateRouter,
  transformer,
} from "@dougley/frugal-savestate/client";
import { createTRPCClient, httpBatchLink } from "@trpc/client";

/**
 * Environment type for Durable Object bindings
 * Import the full Env type from worker-configuration.d.ts in actual usage
 */
type DOEnv = {
  GIVEAWAY_STATE: DurableObjectNamespace;
};

/**
 * Create a TRPC client for the GiveawayStateV3 Durable Object
 *
 * This client communicates with a specific giveaway's Durable Object
 * using TRPC over the fetch-based DO stub.
 *
 * @param env - Environment with GIVEAWAY_STATE binding
 * @param giveawayId - The Durable Object ID string (from durableObjectId column)
 * @returns TRPC client for StateRouter procedures
 *
 * @example
 * ```ts
 * const { env } = await import("cloudflare:workers");
 * const doClient = createDOClient(env, giveawayId);
 *
 * // Query operations
 * const entries = await doClient.getEntriesPaginated.query({ page: 1, limit: 25 });
 *
 * // Mutation operations
 * await doClient.updateGiveaway.mutate({ prize: "New Prize", winners: 3 });
 * await doClient.endGiveaway.mutate();
 * const winners = await doClient.drawWinners.mutate(5);
 * ```
 */
export function createDOClient(env: DOEnv, giveawayId: string) {
  const id = env.GIVEAWAY_STATE.idFromString(giveawayId);
  const stub = env.GIVEAWAY_STATE.get(id);

  return createTRPCClient<StateRouter>({
    links: [
      httpBatchLink({
        transformer,
        url: "http://localhost:8787/trpc",
        fetch: stub.fetch.bind(stub) as unknown as typeof fetch,
      }),
    ],
  });
}

/**
 * Create a TRPC client for a brand-new GiveawayStateV3 Durable Object.
 *
 * Uses `newUniqueId()` instead of `idFromString()` — call this when starting
 * a new giveaway, not when looking up an existing one.
 *
 * @param env - Environment with GIVEAWAY_STATE binding
 * @returns The hex ID string and the TRPC client
 */
export function createNewDOClient(env: DOEnv): {
  idString: string;
  client: DOClient;
} {
  const id = env.GIVEAWAY_STATE.newUniqueId();
  const stub = env.GIVEAWAY_STATE.get(id);

  const client = createTRPCClient<StateRouter>({
    links: [
      httpBatchLink({
        transformer,
        url: "http://localhost:8787/trpc",
        fetch: stub.fetch.bind(stub) as unknown as typeof fetch,
      }),
    ],
  });

  return { idString: id.toString(), client };
}

/**
 * Type of the TRPC client returned by createDOClient
 * Useful for function signatures that accept a client
 */
export type DOClient = ReturnType<typeof createDOClient>;
