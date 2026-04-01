import type { KnipConfig } from 'knip';

/**
 * Focus on `package.json` ↔ code: unused deps, missing deps, binaries.
 * (Unused files/exports are a separate cleanup; ESLint covers TS/JS style.)
 */
const config: KnipConfig = {
  include: [
    'dependencies',
    'devDependencies',
    'unlisted',
    'binaries',
    'unresolved',
  ],
  entry: [
    'src/routeTree.gen.ts',
    'src/**/*.ts',
    'src/**/*.tsx',
    'src/styles.css',
    'vite.config.ts',
    'vitest.config.ts',
    'playwright.config.ts',
    'eslint.config.js',
    'e2e/**/*.ts',
  ],
  project: ['**/*.{js,mjs,cjs,ts,mts,cts,tsx}'],
  ignore: ['**/*.test.ts', '**/*.test.tsx', 'src/test-setup.ts'],
  ignoreDependencies: [
    // Only referenced from CSS `@import url('…')` / `@plugin` (Knip does not resolve these).
    '@fontsource-variable/geist',
    'shadcn',
    'tw-animate-css',
    // RxDB Dexie adapter expects `dexie` at runtime; app imports only `rxdb/plugins/storage-dexie`.
    'dexie',
    // Optional direct pins for TanStack Start / router tooling (not always imported from app TS).
    '@tanstack/react-router-ssr-query',
    '@tanstack/router-plugin',
    // Vitest coverage provider (CLI-only).
    '@vitest/coverage-v8',
  ],
};

export default config;
