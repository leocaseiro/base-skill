import { afterEach, describe, expect, it, vi } from 'vitest';
import { cancelSpeech, speak } from './SpeechOutput';

const makeSynth = (voices: Partial<SpeechSynthesisVoice>[] = []) => ({
  cancel: vi.fn(),
  speak: vi.fn(),
  getVoices: vi.fn().mockReturnValue(voices),
});

describe('SpeechOutput', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('speak does not throw when speechSynthesis is undefined', () => {
    // eslint-disable-next-line unicorn/no-useless-undefined -- explicit undefined for vi.stubGlobal second argument
    vi.stubGlobal('speechSynthesis', undefined);
    expect(() => speak('hello')).not.toThrow();
  });

  it('cancelSpeech does not throw when speechSynthesis is undefined', () => {
    // eslint-disable-next-line unicorn/no-useless-undefined -- explicit undefined for vi.stubGlobal second argument
    vi.stubGlobal('speechSynthesis', undefined);
    expect(() => cancelSpeech()).not.toThrow();
  });

  it('speak sets utterance.voice when the named voice is found', () => {
    const danielVoice = { name: 'Daniel' } as SpeechSynthesisVoice;
    const synth = makeSynth([danielVoice]);
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        voice: SpeechSynthesisVoice | null = null;
        constructor(public text: string) {}
      },
    );
    speak('hello', 'Daniel');
    const utterance = synth.speak.mock.calls[0]?.[0] as {
      voice: SpeechSynthesisVoice | null;
    };
    expect(utterance.voice).toBe(danielVoice);
  });

  it('speak leaves utterance.voice unset when the named voice is not found', () => {
    const synth = makeSynth([]);
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        voice: SpeechSynthesisVoice | null = null;
        constructor(public text: string) {}
      },
    );
    speak('hello', 'UnknownVoice');
    const utterance = synth.speak.mock.calls[0]?.[0] as {
      voice: SpeechSynthesisVoice | null;
    };
    expect(utterance.voice).toBeNull();
  });

  it('speak defaults to Daniel voice', () => {
    const danielVoice = { name: 'Daniel' } as SpeechSynthesisVoice;
    const synth = makeSynth([danielVoice]);
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        voice: SpeechSynthesisVoice | null = null;
        constructor(public text: string) {}
      },
    );
    speak('hello');
    const utterance = synth.speak.mock.calls[0]?.[0] as {
      voice: SpeechSynthesisVoice | null;
    };
    expect(utterance.voice).toBe(danielVoice);
  });
});
