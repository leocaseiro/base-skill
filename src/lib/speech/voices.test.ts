import { afterEach, describe, expect, it, vi } from 'vitest';
import { getVoiceByName } from './voices';

describe('getVoiceByName', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the matching voice when found', () => {
    const danielVoice = { name: 'Daniel' } as SpeechSynthesisVoice;
    vi.stubGlobal('speechSynthesis', {
      getVoices: vi
        .fn()
        .mockReturnValue([danielVoice, { name: 'Samantha' }]),
    });
    expect(getVoiceByName('Daniel')).toBe(danielVoice);
  });

  it('returns undefined when voice is not found', () => {
    vi.stubGlobal('speechSynthesis', {
      getVoices: vi.fn().mockReturnValue([{ name: 'Samantha' }]),
    });
    expect(getVoiceByName('Daniel')).toBeUndefined();
  });

  it('returns undefined when speechSynthesis is unavailable', () => {
    // eslint-disable-next-line unicorn/no-useless-undefined -- explicit undefined for vi.stubGlobal second argument
    vi.stubGlobal('speechSynthesis', undefined);
    expect(getVoiceByName('Daniel')).toBeUndefined();
  });
});
