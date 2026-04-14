import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  detectChecks,
  TRIGGERS,
  ALL_CHECKS,
} from './detect-buckets.mjs';

describe('TRIGGERS', () => {
  it('exposes every atomic check', () => {
    expect([...ALL_CHECKS].toSorted()).toEqual(
      [
        'actionlint',
        'build',
        'e2e',
        'eslint',
        'knip',
        'markdownlint',
        'prettier',
        'shellcheck',
        'storybook',
        'stylelint',
        'typecheck',
        'unit',
        'vr',
      ].toSorted(),
    );
  });
});

describe('detectChecks — positive cases', () => {
  const cases = [
    ['README.md', ['prettier', 'markdownlint']],
    ['docs/foo.md', ['prettier', 'markdownlint']],
    ['docs/foo.mdx', ['prettier']], // mdx excluded from markdownlint
    [
      'src/components/Button.tsx',
      [
        'prettier',
        'eslint',
        'knip',
        'typecheck',
        'unit',
        'storybook',
        'vr',
        'e2e',
        'build',
      ],
    ],
    [
      'src/lib/game-engine/reducer.ts',
      [
        'prettier',
        'eslint',
        'knip',
        'typecheck',
        'unit',
        'storybook',
        'vr',
        'e2e',
        'build',
      ],
    ],
    [
      'src/components/Button.css',
      ['prettier', 'stylelint', 'storybook', 'vr', 'e2e', 'build'],
    ],
    [
      'src/components/Button.stories.tsx',
      [
        'prettier',
        'eslint',
        'knip',
        'typecheck',
        'unit',
        'storybook',
        'vr',
        'e2e',
        'build',
      ],
    ],
    [
      'src/components/Button.test.tsx',
      [
        'prettier',
        'eslint',
        'knip',
        'typecheck',
        'unit',
        'storybook',
        'vr',
        'e2e',
        'build',
      ],
    ],
    [
      'e2e/landing.spec.ts',
      ['prettier', 'eslint', 'knip', 'typecheck', 'unit', 'vr', 'e2e'],
    ],
    ['public/favicon.svg', ['vr', 'e2e', 'build']],
    ['.github/workflows/ci.yml', ['prettier', 'actionlint']],
    ['.husky/pre-push', ['shellcheck']],
    ['scripts/foo.sh', ['shellcheck']],
    [
      'package.json',
      ['prettier', 'knip', 'unit', 'storybook', 'build'],
    ],
    ['yarn.lock', ['build']],
    ['tsconfig.json', ['prettier', 'typecheck', 'unit', 'build']],
    [
      'vite.config.ts',
      ['prettier', 'eslint', 'knip', 'typecheck', 'build'],
    ],
    [
      'vitest.config.ts',
      ['prettier', 'eslint', 'knip', 'typecheck', 'unit'],
    ],
    [
      'playwright.config.ts',
      ['prettier', 'eslint', 'knip', 'typecheck', 'e2e'],
    ],
    [
      '.storybook/main.ts',
      ['prettier', 'eslint', 'knip', 'typecheck', 'storybook'],
    ],
  ];

  it.each(cases)('%s triggers %j', (file, expected) => {
    const result = detectChecks([file]);
    expect([...result].toSorted()).toEqual([...expected].toSorted());
  });
});

describe('detectChecks — union semantics', () => {
  it('multi-file input unions the triggers', () => {
    const result = detectChecks([
      'README.md',
      'src/components/Button.css',
    ]);
    expect(result).toContain('markdownlint');
    expect(result).toContain('stylelint');
    expect(result).toContain('vr');
  });
});

describe('detectChecks — negative cases', () => {
  it('unknown file extension triggers nothing', () => {
    expect([...detectChecks(['something.unknown'])]).toEqual([]);
  });

  it('empty input returns empty set', () => {
    expect([...detectChecks([])]).toEqual([]);
  });

  it('README.md does not trigger stylelint or unit', () => {
    const result = detectChecks(['README.md']);
    expect(result).not.toContain('stylelint');
    expect(result).not.toContain('unit');
    expect(result).not.toContain('typecheck');
  });

  it('mdx file does not trigger markdownlint', () => {
    const result = detectChecks(['src/components/Foo.stories.mdx']);
    expect(result).not.toContain('markdownlint');
    expect(result).toContain('prettier');
  });
});

const SCRIPT = path.resolve(
  process.cwd(),
  'scripts/detect-buckets.mjs',
);

const runCli = (args) =>
  execFileSync('node', [SCRIPT, ...args], { encoding: 'utf8' }).trim();

describe('CLI — --files mode', () => {
  it('prints space-separated checks for an explicit file list', () => {
    const out = runCli(['--files', 'README.md']);
    expect(out.split(/\s+/).toSorted()).toEqual([
      'markdownlint',
      'prettier',
    ]);
  });

  it('--force-all emits every check', () => {
    const out = runCli(['--force-all']);
    const checks = out.split(/\s+/).toSorted();
    expect(checks).toContain('e2e');
    expect(checks).toContain('build');
    expect(checks).toContain('prettier');
    expect(checks.length).toBe(13);
  });

  it('empty --files input prints empty line', () => {
    const out = runCli(['--files']);
    expect(out).toBe('');
  });

  it('--github-output writes key=value to the file in $GITHUB_OUTPUT', () => {
    const outPath = path.join(
      process.env.RUNNER_TEMP || '/tmp',
      `detect-buckets-test-${process.pid}.txt`,
    );
    execFileSync('node', [SCRIPT, '--force-all', '--github-output'], {
      env: { ...process.env, GITHUB_OUTPUT: outPath },
      encoding: 'utf8',
    });
    const contents = readFileSync(outPath, 'utf8');
    expect(contents).toMatch(/^prettier=true$/m);
    expect(contents).toMatch(/^e2e=true$/m);
    expect(contents).toMatch(/^build=true$/m);
  });
});
