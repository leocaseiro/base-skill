import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const workspaceRoot = fileURLToPath(new URL('..', import.meta.url));

/**
 * Storybook-only Vite config. The app root `vite.config.ts` pulls in TanStack Start, which
 * overrides Rollup `input` and prevents the preview build from emitting `iframe.html`.
 */
export default defineConfig({
  plugins: [
    // Resolve from this file’s project root — not `process.cwd()` — so `yarn storybook`
    // works from git worktrees (otherwise `../tsconfig.json` becomes `worktrees/tsconfig.json`).
    tsconfigPaths({
      projects: [path.resolve(workspaceRoot, 'tsconfig.json')],
    }),
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(workspaceRoot, 'src'),
      '#': path.resolve(workspaceRoot, 'src'),
      '@storybook/blocks': '@storybook/addon-docs/blocks',
    },
  },
});
