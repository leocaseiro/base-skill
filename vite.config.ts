import { createRequire } from 'node:module';
import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';

import { tanstackStart } from '@tanstack/react-start/plugin/vite';

import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { version } from './package.json';
import type { Plugin } from 'vite';

const base = process.env['APP_BASE_URL'] ?? '/base-skill/';

const require = createRequire(import.meta.url);
const pragmaticBase =
  '@atlaskit/pragmatic-drag-and-drop/dist/esm/entry-point/element';
const pragmaticElementAdapter = require.resolve(
  `${pragmaticBase}/adapter.js`,
);
const pragmaticPreserveOffset = require.resolve(
  `${pragmaticBase}/preserve-offset-on-source.js`,
);
const pragmaticSetCustomPreview = require.resolve(
  `${pragmaticBase}/set-custom-native-drag-preview.js`,
);

/**
 * Custom workbox plugin that generates the service worker after the client
 * build completes. Replaces vite-plugin-pwa which does not work correctly
 * in Vite 7 builder mode (sharedPlugins=true overwrites configResolved so
 * the ssr=true flag prevents SW generation).
 */
const workboxPlugin = (): Plugin => ({
  name: 'workbox-sw-generator',
  buildApp: {
    order: 'post',
    async handler(builder) {
      const clientEnv = builder.environments['client'];
      if (!clientEnv?.isBuilt) return;
      const outDir = clientEnv.config.build.outDir;
      const { generateSW } = await import('workbox-build');
      const result = await generateSW({
        swDest: path.join(outDir, 'sw.js'),
        globDirectory: outDir,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: `${base}index.html`,
        // Exclude PR preview paths so the production SW does not hijack
        // navigations to /base-skill/pr/<N>/app|docs/.
        navigateFallbackDenylist: [/\/api\//, /\/pr\//],
        cleanupOutdatedCaches: true,
        mode: 'production',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      });
      console.log(
        `[workbox] Generated sw.js — ${result.count} files, ${Math.round(result.size / 1024)} kB`,
      );
    },
  },
});

const config = defineConfig({
  base,
  resolve: {
    alias: {
      '@atlaskit/pragmatic-drag-and-drop/element/adapter':
        pragmaticElementAdapter,
      '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source':
        pragmaticPreserveOffset,
      '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview':
        pragmaticSetCustomPreview,
    },
  },
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(
      process.env['VITE_APP_VERSION'] ?? version,
    ),
  },
  ssr: {
    // workbox-window ships only CJS; bundle it so the SSR server can import it
    noExternal: ['workbox-window'],
  },
  plugins: [
    devtools(),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart({
      spa: { enabled: true },
      router: {
        // eslint-disable-next-line unicorn/prefer-string-raw -- vite config file
        routeFileIgnorePattern: '(test|spec)\\.(ts|tsx)$',
      },
    }),
    viteReact(),
    workboxPlugin(),
  ],
});

export default config;
