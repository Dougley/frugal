import type { TRPCRouterRecord } from "@trpc/server";

import { publicProcedure } from "~/server/trpc/instance";
import { getBuildInfoFn } from "~/utils/build-info";

/**
 * App metadata router - provides server-side environment data
 * Includes build info, etc.
 */
export const appMetadataRouter = {
  /**
   * Get build/deployment metadata from Cloudflare env
   */
  getBuildInfo: publicProcedure.query(() => getBuildInfoFn()),
} satisfies TRPCRouterRecord;
