#!/usr/bin/env node
// scripts/vr-docker.mjs
// Runs Playwright VR tests inside the official Playwright Docker image.
// Usage:
//   node scripts/vr-docker.mjs test    — compare against baselines
//   node scripts/vr-docker.mjs update  — regenerate baselines

import { execSync, spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';

const PLAYWRIGHT_VERSION = '1.59.1';
const DOCKER_IMAGE = `mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble`;
// Named volume keeps Docker's node_modules (Linux binaries) separate from the
// host's node_modules (macOS binaries). Without this, Docker's yarn install
// overwrites @rollup/rollup-darwin-arm64 with Linux binaries, breaking the
// host's vite build used by subsequent E2E tests.
const VR_VOLUME_NAME = 'base-skill-vr-node-modules';

const mode = process.argv[2];

if (mode !== 'test' && mode !== 'update') {
  console.error('Usage: node scripts/vr-docker.mjs <test|update>');
  process.exit(1);
}

// ── Check Docker is running ───────────────────────────────────────────────────
try {
  execSync('docker info', { stdio: 'ignore' });
} catch {
  console.error('\n\u001B[31mError: Docker is not available.\u001B[0m');
  console.error(
    'yarn test:vr and yarn test:vr:update require a running Docker daemon (e.g. Docker Desktop).',
  );
  console.error(
    'Start Docker, confirm `docker info` works, then run this command again.\n',
  );
  process.exit(1);
}

// ── Pre-build on host (vite build in the container can fail; dist is mounted in) ─
const cwd = process.cwd();
console.log(
  '\u001B[36m\u25B6 Building app on host for Docker VR (APP_BASE_URL=/)\u001B[0m',
);
// `VITE_APP_VERSION=VR-TEST` keeps the header version string stable across
// releases — without this, every `chore(release)` bump invalidates VR
// baselines in the header strip.
execSync(
  'VITE_APP_VERSION=VR-TEST APP_BASE_URL=/ yarn build && cp dist/client/_shell.html dist/client/index.html',
  { stdio: 'inherit', cwd },
);

// ── Build the playwright command ──────────────────────────────────────────────
const playwrightArgs = [
  'npx',
  'playwright',
  'test',
  '--project=chromium',
  '--grep',
  '@visual',
];

if (mode === 'update') {
  playwrightArgs.push('--update-snapshots');
}

const shellCommand = [
  'yarn install --frozen-lockfile --prefer-offline',
  playwrightArgs.join(' '),
].join(' && ');

// ── Run inside Docker ─────────────────────────────────────────────────────────

const dockerArgs = [
  'run',
  '--rm',
  '--ipc=host',
  '-v',
  `${cwd}:/work`,
  '-v',
  `${VR_VOLUME_NAME}:/work/node_modules`,
  '-w',
  '/work',
  '-e',
  'APP_BASE_URL=/',
  '-e',
  'VR_DOCKER=1',
  ...(process.env['CI'] ? ['-e', 'CI=true'] : []),
  DOCKER_IMAGE,
  'bash',
  '-c',
  shellCommand,
];

console.log(
  `\u001B[36m\u25B6 Running VR tests in Docker (${mode} mode)...\u001B[0m`,
);

const result = spawnSync('docker', dockerArgs, { stdio: 'inherit' });

const exitCode = result.status ?? 1;

// ── On test failure: surface diff images ──────────────────────────────────────
if (mode === 'test' && exitCode !== 0) {
  const testResultsDir = path.join(cwd, 'test-results');
  const diffFiles = [];

  try {
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile() && entry.name.endsWith('-diff.png')) {
          diffFiles.push(full);
        }
      }
    };
    walk(testResultsDir);
  } catch {
    // test-results may not exist
  }

  if (diffFiles.length > 0) {
    console.error('\n\u001B[31m\u2717 Visual diffs detected:\u001B[0m');
    for (const f of diffFiles) {
      console.error(`  ${f}`);
    }
  }

  console.error(
    '\n\u001B[33mTo review the full report: yarn test:vr:report\u001B[0m',
  );
  console.error(
    '\u001B[33mIf the change is intentional, run: yarn test:vr:update\u001B[0m',
  );
}

process.exit(exitCode);
