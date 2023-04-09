import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  outdir: 'dist',
  target: 'esnext',
  format: 'esm',
  logLevel: 'info',
  bundle: true,
  sourcemap: true,
  minify: true,
  minifySyntax: true,
  external: ['zlib', 'https', 'fs', 'fastify', 'express', 'path']
});
