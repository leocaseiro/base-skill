// RiTa's shipped types omit isKnownWord (a runtime alias for hasWord).
// Augment the module so engine.ts and engine.test.ts can call it without errors.
// We must use a class declaration here because RiTa is exported as a class in
// rita's types; unicorn/no-static-only-class is disabled for this reason.
declare module 'rita' {
  // eslint-disable-next-line unicorn/no-static-only-class -- module augmentation requires re-declaring the class; all members are static by rita's design
  class RiTa {
    static isKnownWord(word: string): boolean;
    static phones(input: string, options?: object): string;
    static syllables(input: string, options?: object): string;
  }
}
