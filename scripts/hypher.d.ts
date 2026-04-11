// Type shims for hypher + hyphenation.en-us (no @types available upstream).
// Used only by scripts/seed-word-library.ts at codegen time.

declare module 'hypher' {
  interface HypherLanguage {
    patterns: Record<string, string>;
    leftmin: number;
    rightmin: number;
    exceptions?: string;
  }
  export default class Hypher {
    constructor(language: HypherLanguage);
    hyphenate(word: string): string[];
    hyphenateText(str: string, minLength?: number): string;
  }
}

declare module 'hyphenation.en-us' {
  const language: {
    id: string;
    leftmin: number;
    rightmin: number;
    patterns: Record<string, string>;
    exceptions?: string;
  };
  export default language;
}
