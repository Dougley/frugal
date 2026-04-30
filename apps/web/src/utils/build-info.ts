/**
 * Build information utilities for accessing deployment metadata
 * This data comes from Cloudflare environment variables set during deployment
 */

import { createServerFn } from "@tanstack/react-start";

export interface BuildInfo {
  /** Git commit SHA (from RELEASE env var) */
  commitSha?: string;
  /** Cloudflare deployment version ID (from CF_VERSION_METADATA binding) */
  deploymentId?: string;
  /** Environment name (staging/production) */
  environment?: string;
  /** ISO timestamp when the build was created */
  buildTime?: string;
  /** GitHub repository (org/repo format) */
  repository?: string;
}

/**
 * Server function to get build information from Cloudflare environment variables
 * Only callable from server-side code (route loaders, beforeLoad, etc.)
 */
export const getBuildInfoFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const { env } = await import("cloudflare:workers");

    return {
      commitSha: env.RELEASE,
      deploymentId: env.CF_VERSION_METADATA?.id,
      environment: env.CLOUDFLARE_ENV || env.ENVIRONMENT,
      buildTime: env.BUILD_TIME,
      repository: env.REPOSITORY || "dougley/frugal",
    } satisfies BuildInfo;
  }
);

/**
 * Check if build info is available (has at least commit or deployment ID)
 */
export function hasBuildInfo(buildInfo: BuildInfo): boolean {
  return Boolean(buildInfo.commitSha || buildInfo.deploymentId);
}

/**
 * Get URLs for build transparency
 */
export function getBuildUrls(buildInfo: BuildInfo) {
  const repo = buildInfo.repository || "dougley/frugal";
  const repoUrl = `https://github.com/${repo}`;

  return {
    repository: repoUrl,
    commit: buildInfo.commitSha
      ? `${repoUrl}/commit/${buildInfo.commitSha}`
      : undefined,
    workflow: `${repoUrl}/actions/workflows/web-build.yml`,
  };
}
