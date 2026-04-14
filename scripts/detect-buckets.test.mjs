import { describe, it, expect } from 'vitest';
import { detectChecks, TRIGGERS, ALL_CHECKS } from './detect-buckets.mjs';

describe('TRIGGERS', () => {
  it('exposes every atomic check', () => {
    expect([...ALL_CHECKS].sort()).toEqual(
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
      ].sort(),
    );
  });
});

describe('detectChecks — positive cases', () => {
  const cases = [
    ['README.md', ['prettier', 'markdownlint']],
    ['docs/foo.md', ['prettier', 'markdownlint']],
    ['docs/foo.mdx', ['prettier']], // mdx excluded from markdownlint
    ['src/components/Button.tsx', ['prettier', 'eslint', 'knip', 'typecheck', 'unit', 'storybook', 'vr', 'e2e', 'build']],
    ['src/lib/game-engine/reducer.ts', ['prettier', 'eslint', 'knip', 'typecheck', 'unit', 'storybook', 'vr', 'e2e', 'build']],
    ['src/components/Button.css', ['stylelint', 'storybook', 'vr', 'e2e', 'build']],
    ['src/components/Button.stories.tsx', ['prettier', 'eslint', 'knip', 'typecheck', 'unit', 'storybook', 'vr', 'e2e', 'build']],
    ['src/components/Button.test.tsx', ['prettier', 'eslint', 'knip', 'typecheck', 'unit', 'storybook', 'vr', 'e2e', 'build']],
    ['e2e/landing.spec.ts', ['prettier', 'eslint', 'knip', 'typecheck', 'unit', 'vr', 'e2e']],
    ['public/favicon.svg', ['vr', 'e2e', 'build']],
    ['.github/workflows/ci.yml', ['prettier', 'actionlint']],
    ['.husky/pre-push', ['shellcheck']],
    ['scripts/foo.sh', ['shellcheck']],
    ['package.json', ['prettier', 'knip', 'unit', 'storybook', 'build']],
    ['yarn.lock', ['build']],
    ['tsconfig.json', ['prettier', 'typecheck', 'unit', 'build']],
    ['vite.config.ts', ['prettier', 'eslint', 'knip', 'typecheck', 'build']],
    ['vitest.config.ts', ['prettier', 'eslint', 'knip', 'typecheck', 'unit']],
    ['playwright.config.ts', ['prettier', 'eslint', 'knip', 'typecheck', 'e2e']],
    ['.storybook/main.ts', ['prettier', 'eslint', 'knip', 'typecheck', 'storybook']],
  ];

  it.each(cases)('%s triggers %j', (file, expected) => {
    const result = detectChecks([file]);
    expect([...result].sort()).toEqual([...expected].sort());
  });
});

describe('detectChecks — union semantics', () => {
  it('multi-file input unions the triggers', () => {
    const result = detectChecks(['README.md', 'src/components/Button.css']);
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
