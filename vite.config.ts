import { createRequire } from 'node:module';

import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';

import { tanstackStart } from '@tanstack/react-start/plugin/vite';

import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';
import { version } from './package.json';

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
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
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
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
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
      },
      manifest: false,
    }),
  ],
});

export default config;
