import type { TRPCRouterRecord } from "@trpc/server";

import { publicProcedure } from "~/server/trpc/instance";
import type { BuildInfo } from "~/utils/build-info";

/**
 * App metadata router - provides server-side environment data
 * Includes build info, etc.
 */
export const appMetadataRouter = {
  /**
   * Get build/deployment metadata from Cloudflare env
   */
  getBuildInfo: publicProcedure.query(async (): Promise<BuildInfo> => {
    const { env } = await import("cloudflare:workers");

    return {
      commitSha: env.RELEASE,
      deploymentId: env.CF_VERSION_METADATA?.id,
      environment: env.CLOUDFLARE_ENV || env.ENVIRONMENT,
      buildTime: env.BUILD_TIME,
      repository: env.REPOSITORY || "dougley/frugal",
    };
  }),
} satisfies TRPCRouterRecord;
