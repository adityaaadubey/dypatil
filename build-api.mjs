import { build } from 'esbuild';

console.log('[build-api] Bundling server/api-entry.ts into standalone api/index.js for Vercel Serverless...');

try {
  await build({
    entryPoints: ['server/api-entry.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    outfile: 'api/index.js',
    external: ['better-sqlite3'],
    banner: {
      js: `import { createRequire as __createRequire } from 'module'; const require = __createRequire(import.meta.url);`
    }
  });
  console.log('[build-api] Successfully bundled api/index.js!');
} catch (err) {
  console.error('[build-api] Bundle error:', err);
  process.exit(1);
}
