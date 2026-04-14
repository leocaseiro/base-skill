// scripts/detect-buckets.mjs
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import picomatch from 'picomatch';

export const TRIGGERS = {
  prettier: ['**/*.{md,mdx,json,ts,tsx,js,mjs,cjs,css,yml,yaml}'],
  eslint: ['**/*.{ts,tsx,js,mjs,cjs}'],
  stylelint: ['src/**/*.css'],
  markdownlint: ['**/*.md'],
  actionlint: ['.github/workflows/**'],
  shellcheck: [
    '**/*.sh',
    '.husky/pre-commit',
    '.husky/pre-push',
    '.husky/post-merge',
  ],
  knip: ['**/*.{ts,tsx,js,mjs,cjs}', 'package.json'],
  typecheck: ['**/*.{ts,tsx}', 'tsconfig*.json'],
  unit: [
    'src/**/*.{ts,tsx,js,mjs,cjs}',
    '**/*.{test,spec}.{ts,tsx,js,mjs}',
    'vitest.config.*',
    'package.json',
    'tsconfig*.json',
  ],
  storybook: [
    '**/*.stories.*',
    'src/**/*.{ts,tsx,css}',
    '.storybook/**',
    'package.json',
  ],
  vr: ['**/*.stories.*', 'src/**/*.{ts,tsx,css}', 'public/**', 'e2e/**'],
  e2e: ['e2e/**', 'src/**', 'public/**', 'playwright.config.*'],
  build: [
    'src/**',
    'public/**',
    'vite.config.*',
    'tsconfig*.json',
    'package.json',
    'yarn.lock',
  ],
};

export const ALL_CHECKS = new Set(Object.keys(TRIGGERS));

const COMPILED = Object.fromEntries(
  Object.entries(TRIGGERS).map(([check, globs]) => [
    check,
    picomatch(globs, { dot: true }),
  ]),
);

export const detectChecks = (files) => {
  const result = new Set();
  for (const file of files) {
    for (const check of ALL_CHECKS) {
      if (result.has(check)) continue;
      if (COMPILED[check](file)) {
        // mdx carve-out: markdownlint does not run on .mdx
        if (check === 'markdownlint' && file.endsWith('.mdx')) continue;
        result.add(check);
      }
    }
  }
  return result;
};

const parseArgs = (argv) => {
  const args = {
    staged: false,
    base: null,
    forceAll: false,
    githubOutput: false,
    verbose: false,
    files: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--staged') args.staged = true;
    else if (arg === '--force-all') args.forceAll = true;
    else if (arg === '--github-output') args.githubOutput = true;
    else if (arg === '--verbose') args.verbose = true;
    else if (arg.startsWith('--base=')) args.base = arg.slice('--base='.length);
    else if (arg === '--files') {
      args.files = argv.slice(i + 1);
      break;
    } else if (arg === '--help' || arg === '-h') {
      process.stdout.write(
        [
          'Usage: detect-buckets.mjs [options]',
          '  --staged                use git staged files',
          '  --base=REF              diff against REF (merge-base)',
          '  --force-all             ignore diff, return every check',
          '  --github-output         write key=value to $GITHUB_OUTPUT',
          '  --verbose               print matching details to stderr',
          '  --files F1 F2 ...       explicit file list',
          '',
        ].join('\n'),
      );
      process.exit(0);
    }
  }
  return args;
};

const gitFiles = ({ staged, base }) => {
  if (staged) {
    const out = execFileSync('git', ['diff', '--name-only', '--cached'], {
      encoding: 'utf8',
    });
    return out.split('\n').filter(Boolean);
  }
  if (base) {
    let mergeBase;
    try {
      mergeBase = execFileSync('git', ['merge-base', 'HEAD', base], {
        encoding: 'utf8',
      }).trim();
    } catch {
      process.stderr.write(
        `detect-buckets: could not resolve base "${base}", assuming all checks\n`,
      );
      return null;
    }
    const out = execFileSync(
      'git',
      ['diff', '--name-only', `${mergeBase}..HEAD`],
      { encoding: 'utf8' },
    );
    return out.split('\n').filter(Boolean);
  }
  return [];
};

const writeGithubOutput = (checks) => {
  const outPath = process.env.GITHUB_OUTPUT;
  if (!outPath) {
    process.stderr.write(
      'detect-buckets: --github-output given but $GITHUB_OUTPUT unset\n',
    );
    process.exit(2);
  }
  const lines = [...ALL_CHECKS]
    .map((check) => `${check}=${checks.has(check) ? 'true' : 'false'}`)
    .join('\n');
  appendFileSync(outPath, `${lines}\n`);
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  let files;
  if (args.forceAll) {
    const checks = new Set(ALL_CHECKS);
    if (args.githubOutput) writeGithubOutput(checks);
    else process.stdout.write(`${[...checks].sort().join(' ')}\n`);
    return;
  }
  if (args.files) {
    files = args.files;
  } else {
    const fromGit = gitFiles({ staged: args.staged, base: args.base });
    if (fromGit === null) {
      const checks = new Set(ALL_CHECKS);
      if (args.githubOutput) writeGithubOutput(checks);
      else process.stdout.write(`${[...checks].sort().join(' ')}\n`);
      return;
    }
    files = fromGit;
  }
  if (args.verbose) {
    process.stderr.write(`detect-buckets: ${files.length} changed files\n`);
    for (const f of files) process.stderr.write(`  ${f}\n`);
  }
  const checks = detectChecks(files);
  if (args.githubOutput) writeGithubOutput(checks);
  else process.stdout.write(`${[...checks].sort().join(' ')}\n`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
