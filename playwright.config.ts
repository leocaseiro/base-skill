import { defineConfig, devices } from '@playwright/test';

const vrDocker = !!process.env['VR_DOCKER'];
/** Dedicated port so E2E never reuses `yarn dev` on :3000 (dev uses base `/base-skill/`; E2E serves `APP_BASE_URL=/` at root). */
const e2ePort = process.env['PLAYWRIGHT_E2E_PORT'] ?? '4174';
const e2eOrigin = `http://127.0.0.1:${e2ePort}`;
// Keep screenshot tests out of normal E2E (including CI) unless explicitly running VR.
// vr-docker.mjs sets VR_DOCKER=1; for host runs use PLAYWRIGHT_INCLUDE_VISUAL=1.
const includeVisualSpecs =
  process.env['VR_DOCKER'] === '1' ||
  process.env['PLAYWRIGHT_INCLUDE_VISUAL'] === '1';
const visualExclusion = includeVisualSpecs
  ? {}
  : { testIgnore: '**/visual.spec.ts' };

export default defineConfig({
  testDir: './e2e',
  snapshotPathTemplate:
    '{testDir}/__snapshots__/{testFilePath}/{arg}-{projectName}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: e2eOrigin,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      ...visualExclusion,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      ...visualExclusion,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      ...visualExclusion,
    },
  ],
  webServer: {
    command: vrDocker
      ? `npx serve dist/client -p ${e2ePort} -s`
      : `APP_BASE_URL=/ yarn build && cp dist/client/_shell.html dist/client/index.html && npx serve dist/client -p ${e2ePort} -s`,
    url: e2eOrigin,
    reuseExistingServer: !process.env['CI'],
    timeout: 120 * 1000,
  },
});
