import { build } from 'esbuild';
import dotenv from 'dotenv';

dotenv.config();

await build({
  entryPoints: ['src/index.ts'],
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
  }
});
