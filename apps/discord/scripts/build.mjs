import { sentryEsbuildPlugin } from '@sentry/esbuild-plugin';
import dotenv from 'dotenv';
import { build } from 'esbuild';

dotenv.config();

const sentrySourceMapPlugin = sentryEsbuildPlugin({
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  include: [{ ext: ['.mjs', '.map'], paths: ['./dist'] }],
  finalize: false
});

await build({
  entryPoints: ['src/index.ts'],
  outExtension: { '.js': '.mjs' },
  outdir: 'dist',
  target: 'esnext',
  format: 'esm',
  logLevel: 'info',
  bundle: true,
  sourcemap: true,
  platform: 'node',
  minify: process.env.NODE_ENV === 'production',
  minifySyntax: process.env.NODE_ENV === 'production',
  define: {
    DISCORD_APP_ID: JSON.stringify(process.env.DISCORD_APP_ID),
    DISCORD_PUBLIC_KEY: JSON.stringify(process.env.DISCORD_PUBLIC_KEY),
    DISCORD_BOT_TOKEN: JSON.stringify(process.env.DISCORD_BOT_TOKEN)
  },
  plugins: [...(process.env.NODE_ENV === 'production' ? [sentrySourceMapPlugin] : [])]
});
