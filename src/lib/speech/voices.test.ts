import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  filterVoicesForLanguage,
  getVoiceByName,
  getVoiceLanguageLabel,
  groupVoicesByLanguage,
  isOnlineVoice,
  isVoiceAvailableInList,
} from './voices';

describe('isOnlineVoice', () => {
  it('returns true when localService is false', () => {
    const voice = { localService: false } as SpeechSynthesisVoice;
    expect(isOnlineVoice(voice)).toBe(true);
  });

  it('returns false when localService is true', () => {
    const voice = { localService: true } as SpeechSynthesisVoice;
    expect(isOnlineVoice(voice)).toBe(false);
  });
});

describe('getVoiceLanguageLabel', () => {
  it('returns friendly name for en-US', () => {
    expect(getVoiceLanguageLabel('en-US')).toBe('American English');
  });

  it('returns friendly name for en-GB', () => {
    expect(getVoiceLanguageLabel('en-GB')).toBe('British English');
  });

  it('returns friendly name for en-AU', () => {
    expect(getVoiceLanguageLabel('en-AU')).toBe('Australian English');
  });

  it('returns the lang code when of() returns undefined', () => {
    const spy = vi
      .spyOn(Intl.DisplayNames.prototype, 'of')
      .mockImplementation(() => undefined as unknown as string);
    expect(getVoiceLanguageLabel('en-FAKE')).toBe('en-FAKE');
    spy.mockRestore();
  });
});

describe('filterVoicesForLanguage', () => {
  const voices = [
    { name: 'Karen', lang: 'en-AU', localService: true },
    { name: 'Daniel', lang: 'en-GB', localService: true },
    { name: 'Samantha', lang: 'en-US', localService: true },
    { name: 'Luciana', lang: 'pt-BR', localService: true },
    { name: 'Joana', lang: 'pt-PT', localService: true },
  ] as SpeechSynthesisVoice[];

  it('returns all en-* voices for "en" locale', () => {
    const result = filterVoicesForLanguage(voices, 'en');
    expect(result.map((v) => v.name)).toEqual([
      'Karen',
      'Daniel',
      'Samantha',
    ]);
  });

  it('returns pt-BR and pt-PT voices for "pt-BR" locale', () => {
    const result = filterVoicesForLanguage(voices, 'pt-BR');
    expect(result.map((v) => v.name)).toEqual(['Luciana', 'Joana']);
  });

  it('returns empty array when no voices match', () => {
    const result = filterVoicesForLanguage(voices, 'de');
    expect(result).toHaveLength(0);
  });
});

describe('groupVoicesByLanguage', () => {
  it('groups voices by lang', () => {
    const voices = [
      { name: 'Karen', lang: 'en-AU', localService: true },
      { name: 'Daniel', lang: 'en-GB', localService: true },
      { name: 'Samantha', lang: 'en-US', localService: true },
    ] as SpeechSynthesisVoice[];
    const groups = groupVoicesByLanguage(voices);
    expect(groups).toHaveLength(3);
  });

  it('sorts groups alphabetically by friendly language label', () => {
    const voices = [
      { name: 'Samantha', lang: 'en-US', localService: true },
      { name: 'Karen', lang: 'en-AU', localService: true },
      { name: 'Daniel', lang: 'en-GB', localService: true },
    ] as SpeechSynthesisVoice[];
    const groups = groupVoicesByLanguage(voices);
    // sorted-invariant: labels appear in localeCompare-sorted order,
    // regardless of which exact Intl.DisplayNames strings the host produces
    const labels = groups.map((g) => g.label);
    expect(labels).toEqual(
      [...labels].toSorted((a, b) => a.localeCompare(b)),
    );
  });

  it('sorts voices within a group alphabetically by name', () => {
    const voices = [
      { name: 'Zoe', lang: 'en-AU', localService: false },
      { name: 'Aaron', lang: 'en-AU', localService: true },
      { name: 'Karen', lang: 'en-AU', localService: true },
    ] as SpeechSynthesisVoice[];
    const [group] = groupVoicesByLanguage(voices);
    expect(group!.voices.map((v) => v.name)).toEqual([
      'Aaron',
      'Karen',
      'Zoe',
    ]);
  });

  it('puts multiple voices with same lang in one group', () => {
    const voices = [
      { name: 'Karen', lang: 'en-AU', localService: true },
      { name: 'Zoe', lang: 'en-AU', localService: false },
    ] as SpeechSynthesisVoice[];
    const groups = groupVoicesByLanguage(voices);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.voices).toHaveLength(2);
  });

  it('assigns friendly label via getVoiceLanguageLabel', () => {
    const voices = [
      { name: 'Karen', lang: 'en-AU', localService: true },
    ] as SpeechSynthesisVoice[];
    const [group] = groupVoicesByLanguage(voices);
    expect(group!.label).toBe('Australian English');
  });

  it('returns empty array for empty input', () => {
    expect(groupVoicesByLanguage([])).toHaveLength(0);
  });
});

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

describe('isVoiceAvailableInList', () => {
  const voices = [
    { name: 'Karen' },
    { name: 'Samantha' },
    { name: 'Daniel' },
  ] as SpeechSynthesisVoice[];

  it('returns true when the voice name matches an entry in the list', () => {
    expect(isVoiceAvailableInList('Samantha', voices)).toBe(true);
  });

  it('returns false when the voice name does not match any entry', () => {
    expect(isVoiceAvailableInList('Fake', voices)).toBe(false);
  });

  it('returns false for an empty list', () => {
    expect(isVoiceAvailableInList('Samantha', [])).toBe(false);
  });
});
