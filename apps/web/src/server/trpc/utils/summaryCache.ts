/// <reference types="@dougley/types/summaries" />

/**
 * Summary caching utilities for R2 storage
 *
 * Provides helper functions to fetch giveaway summaries from R2
 * with Cloudflare cache layer for optimal performance.
 * Summaries are immutable once created, so they can be cached for 3 months.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";

/**
 * Zod schema for validating summary data from R2 storage
 */
const savedUserInformationSchema = z.object({
  id: z.string(),
  username: z.string(),
  discriminator: z.string().nullable(),
  avatar: z.string().nullable(),
});

const summaryOutputSchema = z.object({
  _version: z.literal(2),
  details: z.object({
    channel: z.string(),
    message: z.string(),
    prize: z.string(),
    winners: z.number(),
    originalWinners: z.array(z.string()),
    time: z.object({
      start: z.string(),
      end: z.string(),
    }),
  }),
  entries: z.array(savedUserInformationSchema),
});

/**
 * Result of fetching a summary from storage
 */
export type SummaryFetchResult = {
  summary: SummaryOutput;
  etag: string;
};

/**
 * Create a cache key for a summary
 */
function createCacheKey(summaryId: string): Request {
  return new Request(`https://fake-domain.com/giveaway-${summaryId}.json`, {
    method: "GET",
  });
}

/**
 * Get Cloudflare cache instance
 * @ts-expect-error - Cloudflare cache API
 */
function getCache(): Cache {
  // @ts-expect-error - Cloudflare cache API
  return caches.default as Cache;
}

/**
 * Cache a summary response for future requests
 *
 * Wraps cache.put in try-catch to prevent cache failures from breaking requests.
 * Cache failures are logged but don't propagate.
 */
async function cacheSummary(
  cache: Cache,
  cacheKey: Request,
  summary: SummaryOutput,
  etag: string
): Promise<void> {
  try {
    const response = new Response(JSON.stringify(summary), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=7776000", // 3 months
        etag,
      },
    });
    await cache.put(cacheKey, response.clone());
    console.log(`[Summaries] Cached ${cacheKey.url} with etag ${etag}`);
  } catch (error) {
    // Log cache failures but don't let them break the request
    console.warn("[Summaries] Failed to cache summary:", error);
  }
}

/**
 * Fetch a giveaway summary from R2 storage with caching
 *
 * This is the main utility for fetching summaries. It handles:
 * 1. Check Cloudflare cache first (instant response)
 * 2. Fall back to R2 storage if not cached
 * 3. Cache the result for future requests
 *
 * @param bucket - R2 bucket binding
 * @param summaryId - The giveaway/summary ID
 * @returns The summary data with etag
 * @throws TRPCError with NOT_FOUND if summary doesn't exist
 */
export async function fetchSummaryFromStorage(
  bucket: R2Bucket,
  summaryId: string
): Promise<SummaryFetchResult> {
  const cacheKey = createCacheKey(summaryId);
  const cache = getCache();

  // Try to get from cache first
  const cached = await cache.match(cacheKey);

  if (cached) {
    console.log(
      `[Summaries] Cache hit for ${summaryId} with etag ${cached.headers.get("etag")}`
    );
    const parsed = summaryOutputSchema.safeParse(await cached.json());
    if (!parsed.success) {
      console.warn(
        `[Summaries] Invalid cached summary for ${summaryId}:`,
        parsed.error
      );
      // Invalidate bad cache entry and fall through to R2 fetch
      await cache.delete(cacheKey);
    } else {
      return {
        summary: parsed.data,
        etag: cached.headers.get("etag") ?? "",
      };
    }
  }

  // Not in cache - fetch from R2
  const obj = await bucket.head(`giveaway-${summaryId}.json`);
  if (obj === null) {
    console.log(`[Summaries] Not found in R2: ${summaryId}`);
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Summary not found",
    });
  }

  // Get full object with body
  const fullObj = await bucket.get(`giveaway-${summaryId}.json`);
  if (fullObj === null) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Summary not found",
    });
  }

  const rawData = await fullObj.json();
  const parsed = summaryOutputSchema.safeParse(rawData);
  if (!parsed.success) {
    console.error(
      `[Summaries] Invalid summary data for ${summaryId}:`,
      parsed.error
    );
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Invalid summary data format",
    });
  }

  const summary = parsed.data;
  const etag = fullObj.etag ?? obj.etag ?? "";

  // Cache it for next time (non-blocking, errors caught internally)
  await cacheSummary(cache, cacheKey, summary, etag);

  return { summary, etag };
}

/**
 * Paginate an array of entries
 *
 * @param entries - Full array of entries
 * @param page - Page number (1-indexed)
 * @param limit - Number of items per page
 * @returns Paginated result with metadata
 */
export function paginateEntries<T>(
  entries: T[],
  page: number,
  limit: number
): {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
} {
  const total = entries.length;
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, total);
  const items = entries.slice(startIndex, endIndex);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      hasMore: endIndex < total,
    },
  };
}
