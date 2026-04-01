//  @ts-check

/** @type {import('prettier').Config} */
const config = {
  semi: true,
  singleQuote: true,
  // Trailing commas everywhere Prettier allows (matches prior ESLint `comma-dangle: always`).
  trailingComma: 'all',
  // Narrower than default 80 so signatures like `({ a, b }: LongType) =>` wrap consistently
  // with `prettier --check` (no ESLint `object-curly-newline`; that fights Prettier).
  printWidth: 72,
};

export default config;
