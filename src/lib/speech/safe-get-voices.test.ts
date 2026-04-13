import { afterEach, describe, expect, it, vi } from 'vitest';
import { safeGetVoices } from './safe-get-voices';

describe('safeGetVoices', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns voices when getVoices() works normally', () => {
    const voice = {
      name: 'Daniel',
      lang: 'en-AU',
    } as SpeechSynthesisVoice;
    const synth = {
      getVoices: vi.fn().mockReturnValue([voice]),
    } as unknown as SpeechSynthesis;
    expect(safeGetVoices(synth)).toEqual([voice]);
  });

  it('filters out null entries', () => {
    const voice = {
      name: 'Daniel',
      lang: 'en-AU',
    } as SpeechSynthesisVoice;
    const synth = {
      getVoices: vi.fn().mockReturnValue([null, voice, null]),
    } as unknown as SpeechSynthesis;
    expect(safeGetVoices(synth)).toEqual([voice]);
  });

  it('filters out undefined entries', () => {
    const voice = {
      name: 'Samantha',
      lang: 'en-US',
    } as SpeechSynthesisVoice;
    const synth = {
      getVoices: vi.fn().mockReturnValue([undefined, voice]),
    } as unknown as SpeechSynthesis;
    expect(safeGetVoices(synth)).toEqual([voice]);
  });

  it('filters out entries without a string name', () => {
    const good = {
      name: 'Daniel',
      lang: 'en-AU',
    } as SpeechSynthesisVoice;
    const bad = { lang: 'en-US' } as unknown as SpeechSynthesisVoice;
    const synth = {
      getVoices: vi.fn().mockReturnValue([good, bad]),
    } as unknown as SpeechSynthesis;
    expect(safeGetVoices(synth)).toEqual([good]);
  });

  it('returns empty array when getVoices() throws', () => {
    const synth = {
      getVoices: vi.fn().mockImplementation(() => {
        throw new Error('iOS Brave crash');
      }),
    } as unknown as SpeechSynthesis;
    expect(safeGetVoices(synth)).toEqual([]);
  });

  it('returns empty array when getVoices() returns empty', () => {
    const synth = {
      getVoices: vi.fn().mockReturnValue([]),
    } as unknown as SpeechSynthesis;
    expect(safeGetVoices(synth)).toEqual([]);
  });
});
