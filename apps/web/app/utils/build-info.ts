/**
 * Build information utilities for accessing attestation and build metadata
 * This data comes from Cloudflare environment variables set during deployment
 */

import type { AppLoadContext } from "react-router";

export interface BuildInfo {
  release?: string;
  environment?: string;
  attestationId?: string;
  sbomAttestationId?: string;
  buildTime?: string;
  repository?: string;
}

/**
 * Get build information from Cloudflare environment variables
 * This is called server-side during SSR
 */
export function getBuildInfo(context: AppLoadContext): BuildInfo {
  const env = context.cloudflare?.env as any;

  return {
    release: env?.RELEASE,
    environment: env?.CLOUDFLARE_ENV || env?.ENVIRONMENT,
    attestationId: env?.ATTESTATION_ID,
    sbomAttestationId: env?.SBOM_ATTESTATION_ID,
    buildTime: env?.BUILD_TIME,
    repository: env?.REPOSITORY || "dougley/frugal",
  };
}

/**
 * Check if build verification is available
 */
export function isBuildVerificationAvailable(buildInfo: BuildInfo): boolean {
  return Boolean(buildInfo.release);
}

/**
 * Get verification commands for this build
 */
export function getVerificationCommands(buildInfo: BuildInfo): {
  buildProvenance: string;
  sbom: string;
} {
  const repo = buildInfo.repository || "dougley/frugal";

  return {
    buildProvenance: `gh attestation verify <artifact-path> \\
  -R ${repo} \\
  --signer-workflow .github/workflows/web-build.yml`,
    sbom: `gh attestation verify <artifact-path> \\
  -R ${repo} \\
  --predicate-type https://spdx.dev/Document/v2.3`,
  };
}
