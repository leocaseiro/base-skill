import { RiTa } from 'rita';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { generateBreakdown } from './engine';

vi.mock('rita', () => ({
  RiTa: {
    hasWord: vi.fn(),
    analyze: vi.fn(),
  },
}));

const mockHasWord = vi.mocked(RiTa.hasWord);
const mockAnalyze = vi.mocked(RiTa.analyze);

afterEach(() => {
  vi.clearAllMocks();
});

describe('generateBreakdown', () => {
  it('produces IPA + phonemes for a known word', async () => {
    mockHasWord.mockReturnValue(true);
    mockAnalyze.mockReturnValue({
      phones: 'p-uh1 t-ih-ng',
      syllables: 'p-uh/t-ih-ng',
      stresses: '1/0',
      pos: 'vbg',
    });

    const result = await generateBreakdown('putting');

    expect(result.ritaKnown).toBe(true);
    expect(result.phonemes).toEqual(['p', 'ʊ', 't', 'ɪ', 'ŋ']);
    expect(result.ipa).toBe('pʊtɪŋ');
  });

  it('derives letter-space syllables from phoneme-space syllables', async () => {
    mockHasWord.mockReturnValue(true);
    mockAnalyze.mockReturnValue({
      phones: 'p-uh1 t-ih-ng',
      syllables: 'p-uh/t-ih-ng',
      stresses: '1/0',
      pos: 'vbg',
    });

    const result = await generateBreakdown('putting');

    expect(result.syllables.join('')).toBe('putting');
    expect(result.syllables).toHaveLength(2);
  });

  it('lowercases and trims the word before calling Rita', async () => {
    mockHasWord.mockReturnValue(true);
    mockAnalyze.mockReturnValue({
      phones: 'k-ae1 t',
      syllables: 'k-ae-t',
      stresses: '1',
      pos: 'nn',
    });

    await generateBreakdown('  CAT  ');

    expect(mockHasWord).toHaveBeenCalledWith('cat');
    expect(mockAnalyze).toHaveBeenCalledWith('cat');
  });

  it('uses the LTS fallback so rita-unknown words still get phonemes and syllables', async () => {
    // hasWord returns false (dictionary miss) but analyze's
    // letter-to-sound engine still produces a guess.
    mockHasWord.mockReturnValue(false);
    mockAnalyze.mockReturnValue({
      phones: 'p-r-ow1 th-ah s-ih-s',
      syllables: 'p-r-ow/th-ah/s-ih-s',
      stresses: '1/0/0',
      pos: 'nn',
    });

    const result = await generateBreakdown('prothesis');

    expect(result.ritaKnown).toBe(false);
    expect(result.phonemes.length).toBeGreaterThan(0);
    expect(result.syllables.length).toBeGreaterThan(0);
    expect(result.ipa).not.toBe('');
    expect(result.syllables.join('')).toBe('prothesis');
  });

  it('returns an empty breakdown only when analyze produces no phones', async () => {
    mockHasWord.mockReturnValue(false);
    mockAnalyze.mockReturnValue({
      phones: '',
      syllables: '',
      stresses: '',
      pos: '',
    });

    const result = await generateBreakdown('xzqxzq');

    expect(result.phonemes).toEqual([]);
    expect(result.syllables).toEqual([]);
    expect(result.ipa).toBe('');
    expect(result.ritaKnown).toBe(false);
  });

  it('falls back to an empty breakdown when analyze throws', async () => {
    mockHasWord.mockReturnValue(false);
    mockAnalyze.mockImplementation(() => {
      throw new Error('boom');
    });

    const result = await generateBreakdown('prothesis');

    expect(result.phonemes).toEqual([]);
    expect(result.syllables).toEqual([]);
  });
});
