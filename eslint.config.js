//  @ts-check

import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import stylisticPlugin from '@stylistic/eslint-plugin';
import { tanstackConfig } from '@tanstack/eslint-config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import tseslint from 'typescript-eslint';

// Note: eslint-plugin-tailwindcss v3 is incompatible with Tailwind CSS v4
// Tailwind v4 removed the `./resolveConfig` subpath export that this plugin requires.
// Re-enable once eslint-plugin-tailwindcss adds Tailwind v4 support.

export default [
  ...tanstackConfig,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  // eslint-plugin-react-hooks v7 ships a flat config under configs.flat
  // but the top-level recommended-latest still uses the legacy string array format,
  // so we construct the flat config object manually here.
  {
    plugins: {
      'react-hooks': reactHooks,
      // Only `require-description`: unicorn has no equivalent for mandatory `-- <why>` on disables.
      'eslint-comments': eslintComments,
    },
    rules: reactHooks.configs['recommended-latest'].rules,
  },
  jsxA11y.flatConfigs.recommended,
  eslintPluginUnicorn.configs.recommended,
  // Global plugin registry — makes plugins available to all subsequent config objects.
  // ESLint v9 flat config requires plugins to be declared in each config object that
  // uses their rules; registering here (no rules) satisfies that requirement globally.
  {
    plugins: {
      import: importPlugin,
      '@stylistic': stylisticPlugin,
      '@typescript-eslint': tseslint.plugin,
    },
  },
  {
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // Unicorn `recommended` is on above; these rules clash with React (PascalCase files,
      // `props`), TanStack Router (`$param` routes), and routine TS/React naming (`db`, `doc`).
      // Do not rename/destructure around third-party typings (e.g. `React.ComponentProps`,
      // Radix); disable rules instead of "fixing" imports or prop shapes to satisfy ESLint.
      'unicorn/filename-case': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-null': 'off',
      // Prefer explicit `./` in `new URL(..., import.meta.url)` (unicorn default is `never`).
      'unicorn/relative-url-style': ['error', 'always'],

      // Applies to every `eslint-disable-*` / `eslint-enable` line, including `unicorn/…` rules.
      'eslint-comments/require-description': 'error',

      'import/no-default-export': 'error',
      'import/no-cycle': 'off',
      'pnpm/json-enforce-catalog': 'off',

      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // Layout (semicolons, quotes, commas, spacing, arrows) is handled by Prettier +
      // eslint-config-prettier. Trailing commas: `trailingComma: 'all'` in prettier.config.js.
      'arrow-body-style': ['error', 'as-needed'],

      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],
      'react/jsx-max-depth': ['warn', { max: 5 }],
      'react/no-unstable-nested-components': 'error',
      'react/no-array-index-key': 'warn',
      // Shadcn/Radix wrappers use `{...props}` with `ComponentProps<typeof Primitive>`;
      // enforcing no-spread would require per-file disables or unnatural APIs.
      'react/jsx-props-no-spreading': 'off',
      'react/no-unknown-property': 'error',
    },
  },
  // TypeScript-specific rules scoped to TS/TSX files — these require the TypeScript
  // parser (set up by tanstackConfig) and must not run on plain JS or config files.
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['src/**/*.ts', '!src/**/*.tsx'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
    },
  },
  eslintConfigPrettier,
  {
    // Framework config files require `export default` by convention (Vite, Vitest,
    // Playwright, Knip, lint-staged); allow it only in these root-level config files.
    files: [
      'vite.config.ts',
      'vitest.config.ts',
      'playwright.config.ts',
      'knip.config.ts',
      '.lintstagedrc.mjs',
    ],
    rules: {
      'import/no-default-export': 'off',
    },
  },
  {
    // TanStack Router output; ships with undescribed blanket eslint-disable
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      '**/routeTree.gen.ts',
      '.specstory/**',
      '.lintstagedrc.mjs',
      // Git worktrees are separate checkouts; fix/lint from repo root targets main tree only.
      'worktrees/**',
    ],
  },
];
