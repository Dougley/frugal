declare namespace Cloudflare {
  interface Env {
    // Better Auth secrets
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL?: string;

    // Discord OAuth secrets
    DISCORD_CLIENT_ID: string;
    DISCORD_CLIENT_SECRET: string;
    DISCORD_APP_ID?: string;

    // Sentry (optional)
    SENTRY_DSN?: string;

    // KV namespace for Better Auth secondary storage (sessions, rate limits)
    AUTH_KV: KVNamespace;

    // D1 database (shared Frugal database)
    D1: D1Database;

    // R2 storage bucket
    STORAGE: R2Bucket;

    // Version metadata for Sentry releases and deployment tracking
    CF_VERSION_METADATA: { id: string };

    // Build metadata (optional, set during deployment)
    RELEASE?: string;
    CLOUDFLARE_ENV?: string;
    ENVIRONMENT?: string;
    BUILD_TIME?: string;
    REPOSITORY?: string;
  }
}

/**
 * Vite client-side environment variable augmentation
 */
interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_ENVIRONMENT?: string;
  readonly VITE_RELEASE?: string;
  readonly VITE_SITE_URL: string;
  readonly VITE_DISCORD_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.mdx" {
  import type { MDXProps } from "mdx/types";
  import type { Frontmatter } from "~/lib/content";

  export const frontmatter: Frontmatter;

  export default function MDXContent(props: MDXProps): JSX.Element;
}
