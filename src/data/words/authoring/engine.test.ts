import { RiTa } from 'rita';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { generateBreakdown } from './engine';

vi.mock('rita', () => ({
  RiTa: {
    isKnownWord: vi.fn(),
    phones: vi.fn(),
    syllables: vi.fn(),
  },
}));

const mockIsKnownWord = vi.mocked(RiTa.isKnownWord);

const mockPhones = vi.mocked(RiTa.phones);

const mockSyllables = vi.mocked(RiTa.syllables);

afterEach(() => {
  vi.clearAllMocks();
});

describe('generateBreakdown', () => {
  it('returns an empty breakdown when RitaJS does not know the word', async () => {
    mockIsKnownWord.mockReturnValue(false);

    const result = await generateBreakdown('xyzzy');

    expect(result).toEqual({
      word: 'xyzzy',
      ipa: '',
      syllables: [],
      phonemes: [],
      ritaKnown: false,
    });
    expect(mockPhones).not.toHaveBeenCalled();
  });

  it('produces IPA + phonemes for a known word', async () => {
    mockIsKnownWord.mockReturnValue(true);
    mockPhones.mockReturnValue('p-uh1 t-ih-ng');
    mockSyllables.mockReturnValue('p-uh/t-ih-ng');

    const result = await generateBreakdown('putting');

    expect(result.ritaKnown).toBe(true);
    expect(result.phonemes).toEqual(['p', 'ʊ', 't', 'ɪ', 'ŋ']);
    expect(result.ipa).toBe('pʊtɪŋ');
  });

  it('derives letter-space syllables from phoneme-space syllables', async () => {
    mockIsKnownWord.mockReturnValue(true);
    mockPhones.mockReturnValue('p-uh1 t-ih-ng');
    mockSyllables.mockReturnValue('p-uh/t-ih-ng');

    const result = await generateBreakdown('putting');

    expect(result.syllables.join('')).toBe('putting');
    expect(result.syllables).toHaveLength(2);
  });

  it('lowercases and trims the word before calling Rita', async () => {
    mockIsKnownWord.mockReturnValue(true);
    mockPhones.mockReturnValue('k-ae1 t');
    mockSyllables.mockReturnValue('k-ae-t');

    await generateBreakdown('  CAT  ');

    expect(mockIsKnownWord).toHaveBeenCalledWith('cat');
    expect(mockPhones).toHaveBeenCalledWith('cat', { silent: true });
  });
});
