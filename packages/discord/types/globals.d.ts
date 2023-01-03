/* eslint-disable no-unused-vars */
export {};

declare global {
  // Replaced by esbuild when bundling, see scripts/build.js (do not edit)
  const SLSHX_APPLICATION_ID: string;
  const SLSHX_APPLICATION_PUBLIC_KEY: string;
  const SLSHX_APPLICATION_SECRET: string | undefined;
  const SLSHX_APPLICATION_TOKEN: string;
  const SLSHX_TEST_SERVER_ID: string | undefined;
  const SENTRY_DSN: string | undefined;
  const PLANETSCALE_HOST: string;
  const PLANETSCALE_USERNAME: string;
  const PLANETSCALE_PASSWORD: string;
  const SUMMARY_SITE: string;
}
