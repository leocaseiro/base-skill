//  @ts-check

import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import { tanstackConfig } from '@tanstack/eslint-config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

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
  {
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // Unicorn `recommended` is on above; these rules clash with React (PascalCase files,
      // `props`), TanStack Router (`$param` routes), and routine TS/React naming (`db`, `doc`).
      // Do not rename/destructure around third-party typings (e.g. `React.ComponentProps`,
      // Radix); disable rules instead of “fixing” imports or prop shapes to satisfy ESLint.
      'unicorn/filename-case': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-null': 'off',
      // Prefer explicit `./` in `new URL(..., import.meta.url)` (unicorn default is `never`).
      'unicorn/relative-url-style': ['error', 'always'],

      // Applies to every `eslint-disable-*` / `eslint-enable` line, including `unicorn/…` rules.
      'eslint-comments/require-description': 'error',

      'import/no-default-export': 'error',
      'import/no-cycle': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',

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
  // Prettier disables these in eslint-config-prettier; we re-enable after it.
  // For operator-linebreak, use `null` as the position so the rule’s built-in default
  // applies: `?` / `:` → "before" only; other operators use "after" (Prettier-friendly).
  // Passing `"before"` globally fights Prettier on `=`, `&&`, `&` in types, etc.
  {
    rules: {
      '@stylistic/multiline-ternary': ['error', 'always-multiline'],
      '@stylistic/operator-linebreak': [
        'error',
        null,
        {
          // Prettier often puts leading `|` / `&` in multiline union/intersection types.
          overrides: { '|': 'ignore', '&': 'ignore' },
        },
      ],
    },
  },
  {
    // Framework config files require `export default` by convention (Vite, Vitest,
    // Playwright, Knip); allow it only in these root-level config files.
    files: [
      'vite.config.ts',
      'vitest.config.ts',
      'playwright.config.ts',
      'knip.config.ts',
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
    ],
  },
];
