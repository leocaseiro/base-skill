import { readFileSync } from 'node:fs';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string };

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
  plugins: [tsconfigPaths({ projects: ['./tsconfig.json'] })],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
    exclude: ['e2e/**', 'node_modules/**'],
    setupFiles: ['./src/test-setup.ts'],
    // coverage: {
    //   provider: 'v8',
    //   include: ['src/**/*.{ts,tsx}'],
    //   exclude: ['src/**/*.test.{ts,tsx}', 'src/routeTree.gen.ts'],
    //   thresholds: {
    //     lines: 80,
    //     functions: 80,
    //     branches: 75,
    //     statements: 80,
    //   },
    // },
  },
});
