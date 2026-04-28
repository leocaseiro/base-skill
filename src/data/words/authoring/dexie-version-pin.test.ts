import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type PackageJson = {
  version?: string;
  dependencies?: Record<string, string>;
};

const readJson = (relativeToRepo: string): PackageJson => {
  const full = path.join(process.cwd(), relativeToRepo);
  return JSON.parse(readFileSync(full, 'utf8')) as PackageJson;
};

const rootPkg = readJson('package.json');
const rxdbPkg = readJson('node_modules/rxdb/package.json');
const dexiePkg = readJson('node_modules/dexie/package.json');

describe('dexie ↔ rxdb version pin invariant', () => {
  it("root package.json must pin dexie to rxdb's exact dexie pin", () => {
    const ourPin = rootPkg.dependencies?.['dexie'];
    const rxdbPin = rxdbPkg.dependencies?.['dexie'];
    expect(ourPin).toBeDefined();
    expect(rxdbPin).toBeDefined();
    expect(ourPin).toBe(rxdbPin);
  });

  it('only one resolved dexie exists, matching the rxdb pin', () => {
    const rxdbPin = rxdbPkg.dependencies?.['dexie'];
    expect(dexiePkg.version).toBe(rxdbPin);
  });
});
