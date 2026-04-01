//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

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
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs['recommended-latest'].rules,
  },
  jsxA11y.flatConfigs.recommended,
  {
    rules: {
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
      'react/jsx-props-no-spreading': [
        'warn',
        {
          html: 'enforce',
          custom: 'enforce',
          explicitSpread: 'ignore',
        },
      ],
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
  {
    ignores: ['eslint.config.js', 'prettier.config.js'],
  },
]
