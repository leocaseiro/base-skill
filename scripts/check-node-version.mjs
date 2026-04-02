/**
 * Ensures the active Node major matches `.nvmrc` (same source as CI `setup-node`).
 * Override: SKIP_NODE_VERSION_CHECK=1
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.env.SKIP_NODE_VERSION_CHECK !== '1') {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const raw = readFileSync(path.join(root, '.nvmrc'), 'utf8').trim();
  const major = Number(/^(\d+)/.exec(raw)?.[1]);
  if (!Number.isFinite(major)) {
    throw new TypeError(
      'check-node-version: could not read a numeric Node major from .nvmrc',
    );
  }

  const currentMajor = Number(process.version.slice(1).split('.')[0]);
  if (currentMajor !== major) {
    throw new Error(
      `check-node-version: Node ${currentMajor}.x is active; .nvmrc requires ${major}.x (CI uses node-version-file: .nvmrc). Try: nvm use`,
    );
  }
}
