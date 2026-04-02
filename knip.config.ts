import type { KnipConfig } from 'knip';

/**
 * Focus on `package.json` ↔ code: unused deps, missing deps, binaries.
 * (Unused files/exports are a separate cleanup; ESLint covers TS/JS style.)
 */
const config: KnipConfig = {
  ignoreWorkspaces: ['worktrees/**'],
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
    'src/**/*.demo.tsx',
    'src/**/*.stories.tsx',
    'src/**/*.mdx',
    'src/styles.css',
    '.storybook/main.ts',
    '.storybook/preview.tsx',
    '.storybook/**/*.ts',
    '.storybook/**/*.tsx',
    'vite.config.ts',
    'vitest.config.ts',
    'playwright.config.ts',
    'eslint.config.js',
    'e2e/**/*.ts',
  ],
  project: [
    'src/**/*.{js,mjs,cjs,ts,mts,cts,tsx}',
    '.storybook/**/*.{ts,tsx}',
    'e2e/**/*.ts',
    '*.{js,mjs,cjs,ts,mts,cts}',
  ],
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
    // Storybook / MDX (resolved via Storybook; not direct app imports).
    '@storybook/react',
    '@storybook/blocks',
    '@mdx-js/react',
    // CI / local Storybook test runner (shell scripts reference npx; keep as devDeps).
    'http-server',
    'wait-on',
    // ESLint flat config imports (provided via @tanstack/eslint-config / peers).
    '@stylistic/eslint-plugin',
    'eslint-plugin-import-x',
    'typescript-eslint',
  ],
};

export default config;
