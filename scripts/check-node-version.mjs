/**
 * Ensures the active Node major matches `.nvmrc` (same source as CI `setup-node`).
 * Override: SKIP_NODE_VERSION_CHECK=1
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.env.SKIP_NODE_VERSION_CHECK === '1') {
  process.exit(0);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const raw = readFileSync(join(root, '.nvmrc'), 'utf8').trim();
const major = Number(/^(\d+)/.exec(raw)?.[1]);
if (!Number.isFinite(major)) {
  console.error(
    'check-node-version: could not read a numeric Node major from .nvmrc',
  );
  process.exit(1);
}

const currentMajor = Number(process.version.slice(1).split('.')[0]);
if (currentMajor !== major) {
  console.error(
    `check-node-version: Node ${currentMajor}.x is active; .nvmrc requires ${major}.x (CI uses node-version-file: .nvmrc). Try: nvm use`,
  );
  process.exit(1);
}
