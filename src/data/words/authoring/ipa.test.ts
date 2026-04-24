import { describe, expect, it } from 'vitest';
import { normalizeIpa } from './ipa';

describe('normalizeIpa', () => {
  it('returns an already-clean value untouched', () => {
    expect(normalizeIpa('pʊtɪŋ')).toBe('pʊtɪŋ');
  });

  it('strips wrapping slashes', () => {
    expect(normalizeIpa('/pʊtɪŋ/')).toBe('pʊtɪŋ');
  });

  it('strips slashes anywhere in the string', () => {
    expect(normalizeIpa('/pʊ/tɪŋ/')).toBe('pʊtɪŋ');
  });

  it('strips all whitespace including non-breaking spaces', () => {
    expect(normalizeIpa(' / pʊtɪŋ / ')).toBe('pʊtɪŋ');
    expect(normalizeIpa('pʊt\tɪŋ')).toBe('pʊtɪŋ');
    expect(normalizeIpa('pʊt ɪŋ')).toBe('pʊtɪŋ');
  });

  it('strips primary and secondary stress marks (shipped data uses none)', () => {
    expect(normalizeIpa('/ˈprɒθɪsɪs/')).toBe('prɒθɪsɪs');
    expect(normalizeIpa('/ˌɪnfəˈmeɪʃən/')).toBe('ɪnfəmeɪʃən');
  });

  it('preserves length marks (ː) — shipped data uses them', () => {
    expect(normalizeIpa('/biːt/')).toBe('biːt');
    expect(normalizeIpa('æŋriː')).toBe('æŋriː');
  });

  it('returns empty string for empty or whitespace-only input', () => {
    expect(normalizeIpa('')).toBe('');
    expect(normalizeIpa('   ')).toBe('');
    expect(normalizeIpa('//')).toBe('');
    expect(normalizeIpa('ˈˌ')).toBe('');
  });
});
