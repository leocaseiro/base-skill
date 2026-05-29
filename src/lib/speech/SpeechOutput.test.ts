import { afterEach, describe, expect, it, vi } from 'vitest';
import { cancelSpeech, speak } from './SpeechOutput';

const makeSynth = (
  voices: Partial<SpeechSynthesisVoice>[] = [],
  { speaking = false, pending = false } = {},
) => ({
  cancel: vi.fn(),
  speak: vi.fn(),
  speaking,
  pending,
  getVoices: vi.fn().mockReturnValue(voices),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
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

  it('speak sets utterance.voice when the named voice is found via SpeakOptions', () => {
    const danielVoice = { name: 'Daniel' } as SpeechSynthesisVoice;
    const synth = makeSynth([danielVoice]);
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        voice: SpeechSynthesisVoice | null = null;
        rate = 1;
        volume = 1;
        lang = '';
        constructor(public text: string) {}
      },
    );
    speak('hello', { voiceName: 'Daniel' });
    const utterance = synth.speak.mock.calls[0]?.[0] as {
      voice: SpeechSynthesisVoice | null;
    };
    expect(utterance.voice).toBe(danielVoice);
  });

  it('speak sets utterance.voice when a legacy voiceName string is passed', () => {
    const danielVoice = { name: 'Daniel' } as SpeechSynthesisVoice;
    const synth = makeSynth([danielVoice]);
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        voice: SpeechSynthesisVoice | null = null;
        rate = 1;
        volume = 1;
        lang = '';
        constructor(public text: string) {}
      },
    );
    speak('hello', 'Daniel');
    const utterance = synth.speak.mock.calls[0]?.[0] as {
      voice: SpeechSynthesisVoice | null;
    };
    expect(utterance.voice).toBe(danielVoice);
  });

  it('speak falls back to a target-language voice when the named voice is missing', () => {
    const karen = {
      name: 'Karen',
      lang: 'en-AU',
      localService: true,
    } as SpeechSynthesisVoice;
    const synth = makeSynth([karen]);
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        voice: SpeechSynthesisVoice | null = null;
        rate = 1;
        volume = 1;
        lang = '';
        constructor(public text: string) {}
      },
    );
    speak('hello', { voiceName: 'UnknownVoice', lang: 'en-AU' });
    const utterance = synth.speak.mock.calls[0]?.[0] as {
      voice: SpeechSynthesisVoice | null;
    };
    expect(utterance.voice).toBe(karen);
  });

  it('speak leaves utterance.voice unset when no voice matches the language', () => {
    const pt = {
      name: 'Luciana',
      lang: 'pt-BR',
      localService: true,
    } as SpeechSynthesisVoice;
    const synth = makeSynth([pt]);
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        voice: SpeechSynthesisVoice | null = null;
        rate = 1;
        volume = 1;
        lang = '';
        constructor(public text: string) {}
      },
    );
    speak('hello', { voiceName: 'UnknownVoice', lang: 'en-AU' });
    const utterance = synth.speak.mock.calls[0]?.[0] as {
      voice: SpeechSynthesisVoice | null;
    };
    expect(utterance.voice).toBeNull();
  });

  it('speak picks the best target-language voice when no voiceName is provided', () => {
    const karen = {
      name: 'Karen',
      lang: 'en-AU',
      localService: true,
    } as SpeechSynthesisVoice;
    const synth = makeSynth([karen]);
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        voice: SpeechSynthesisVoice | null = null;
        rate = 1;
        volume = 1;
        lang = '';
        constructor(public text: string) {}
      },
    );
    speak('hello');
    const utterance = synth.speak.mock.calls[0]?.[0] as {
      voice: SpeechSynthesisVoice | null;
    };
    expect(utterance.voice).toBe(karen);
  });

  it('speak sets utterance.lang from options.lang', () => {
    const synth = makeSynth([
      { name: 'Karen', lang: 'en-AU' } as SpeechSynthesisVoice,
    ]);
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        voice: SpeechSynthesisVoice | null = null;
        rate = 1;
        volume = 1;
        lang = '';
        constructor(public text: string) {}
      },
    );
    speak('hello', { lang: 'en-AU' });
    const utterance = synth.speak.mock.calls[0]?.[0] as {
      lang: string;
    };
    expect(utterance.lang).toBe('en-AU');
  });

  it('speak applies rate and volume from SpeakOptions', () => {
    const synth = makeSynth([
      { name: 'Daniel' } as SpeechSynthesisVoice,
    ]);
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        voice: SpeechSynthesisVoice | null = null;
        rate = 1;
        volume = 1;
        lang = '';
        constructor(public text: string) {}
      },
    );
    speak('hello', { rate: 1.5, volume: 0.5 });
    const utterance = synth.speak.mock.calls[0]?.[0] as {
      rate: number;
      volume: number;
    };
    expect(utterance.rate).toBe(1.5);
    expect(utterance.volume).toBe(0.5);
  });

  it('speak does not call synth.cancel()', () => {
    const synth = makeSynth([
      { name: 'Daniel' } as SpeechSynthesisVoice,
    ]);
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        voice: SpeechSynthesisVoice | null = null;
        rate = 1;
        volume = 1;
        lang = '';
        constructor(public text: string) {}
      },
    );
    speak('hello');
    expect(synth.cancel).not.toHaveBeenCalled();
  });

  it('cancelSpeech calls synth.cancel() when synth.speaking is true', () => {
    const synth = makeSynth([], { speaking: true });
    vi.stubGlobal('speechSynthesis', synth);
    cancelSpeech();
    expect(synth.cancel).toHaveBeenCalledOnce();
  });

  it('cancelSpeech calls synth.cancel() when synth.pending is true', () => {
    const synth = makeSynth([], { pending: true });
    vi.stubGlobal('speechSynthesis', synth);
    cancelSpeech();
    expect(synth.cancel).toHaveBeenCalledOnce();
  });

  it('cancelSpeech does not call synth.cancel() when nothing is speaking or pending', () => {
    const synth = makeSynth([], { speaking: false, pending: false });
    vi.stubGlobal('speechSynthesis', synth);
    cancelSpeech();
    expect(synth.cancel).not.toHaveBeenCalled();
  });

  it('speak defers via voiceschanged when getVoices() returns empty', () => {
    const addListenerSpy = vi.fn();
    const synth = {
      cancel: vi.fn(),
      speak: vi.fn(),
      getVoices: vi.fn().mockReturnValue([]),
      addEventListener: addListenerSpy,
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal('speechSynthesis', synth);
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        voice: SpeechSynthesisVoice | null = null;
        rate = 1;
        volume = 1;
        lang = '';
        constructor(public text: string) {}
      },
    );
    speak('hello');
    expect(synth.speak).not.toHaveBeenCalled();
    expect(addListenerSpy).toHaveBeenCalledWith(
      'voiceschanged',
      expect.any(Function),
    );
  });
});
