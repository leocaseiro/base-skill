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

const mode = process.argv[2];

if (mode !== 'test' && mode !== 'update') {
  console.error('Usage: node scripts/vr-docker.mjs <test|update>');
  process.exit(1);
}

// ── Check Docker is running ───────────────────────────────────────────────────
try {
  execSync('docker info', { stdio: 'ignore' });
} catch {
  console.warn(
    '\u001B[33m\u26A0 Docker not running \u2014 cannot execute VR tests.\u001B[0m',
  );
  process.exit(1);
}

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
const cwd = process.cwd();

const dockerArgs = [
  'run',
  '--rm',
  '--ipc=host',
  '-v',
  `${cwd}:/work`,
  '-w',
  '/work',
  '-e',
  'APP_BASE_URL=/',
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
