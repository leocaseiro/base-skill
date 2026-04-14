// scripts/detect-buckets.mjs
import picomatch from 'picomatch';

export const TRIGGERS = {
  prettier: ['**/*.{md,mdx,json,ts,tsx,js,mjs,cjs,css,yml,yaml}'],
  eslint: ['**/*.{ts,tsx,js,mjs,cjs}'],
  stylelint: ['src/**/*.css'],
  markdownlint: ['**/*.md'],
  actionlint: ['.github/workflows/**'],
  shellcheck: [
    '**/*.sh',
    '.husky/pre-commit',
    '.husky/pre-push',
    '.husky/post-merge',
  ],
  knip: ['**/*.{ts,tsx,js,mjs,cjs}', 'package.json'],
  typecheck: ['**/*.{ts,tsx}', 'tsconfig*.json'],
  unit: [
    'src/**/*.{ts,tsx,js,mjs,cjs}',
    '**/*.{test,spec}.{ts,tsx,js,mjs}',
    'vitest.config.*',
    'package.json',
    'tsconfig*.json',
  ],
  storybook: [
    '**/*.stories.*',
    'src/**/*.{ts,tsx,css}',
    '.storybook/**',
    'package.json',
  ],
  vr: ['**/*.stories.*', 'src/**/*.{ts,tsx,css}', 'public/**', 'e2e/**'],
  e2e: ['e2e/**', 'src/**', 'public/**', 'playwright.config.*'],
  build: [
    'src/**',
    'public/**',
    'vite.config.*',
    'tsconfig*.json',
    'package.json',
    'yarn.lock',
  ],
};

export const ALL_CHECKS = new Set(Object.keys(TRIGGERS));

const COMPILED = Object.fromEntries(
  Object.entries(TRIGGERS).map(([check, globs]) => [
    check,
    picomatch(globs, { dot: true }),
  ]),
);

export const detectChecks = (files) => {
  const result = new Set();
  for (const file of files) {
    for (const check of ALL_CHECKS) {
      if (result.has(check)) continue;
      if (COMPILED[check](file)) {
        // mdx carve-out: markdownlint does not run on .mdx
        if (check === 'markdownlint' && file.endsWith('.mdx')) continue;
        result.add(check);
      }
    }
  }
  return result;
};
