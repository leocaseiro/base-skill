import { safeGetVoices } from './safe-get-voices';

export type VoiceGroup = {
  lang: string;
  label: string;
  voices: SpeechSynthesisVoice[];
};

export const isOnlineVoice = (voice: SpeechSynthesisVoice): boolean =>
  !voice.localService;

const displayNamesCache = new Map<string, Intl.DisplayNames | null>();

const getDisplayNames = (locale: string): Intl.DisplayNames | null => {
  if (displayNamesCache.has(locale))
    return displayNamesCache.get(locale) ?? null;
  try {
    const dn = new Intl.DisplayNames([locale], { type: 'language' });
    displayNamesCache.set(locale, dn);
    return dn;
  } catch {
    displayNamesCache.set(locale, null);
    return null;
  }
};

export const getVoiceLanguageLabel = (
  lang: string,
  displayLocale = 'en',
): string => {
  try {
    return getDisplayNames(displayLocale)?.of(lang) ?? lang;
  } catch {
    return lang;
  }
};

export const isVoiceAvailableInList = (
  voiceName: string,
  voices: SpeechSynthesisVoice[],
): boolean => voices.some((v) => v.name === voiceName);

export const filterVoicesForLanguage = (
  voices: SpeechSynthesisVoice[],
  lang: string,
): SpeechSynthesisVoice[] => {
  const prefix = lang.split('-')[0]?.toLowerCase() ?? lang;
  return voices.filter(
    (v) =>
      v.lang.toLowerCase().startsWith(lang.toLowerCase()) ||
      v.lang.toLowerCase().startsWith(prefix),
  );
};

export const groupVoicesByLanguage = (
  voices: SpeechSynthesisVoice[],
  displayLocale = 'en',
): VoiceGroup[] => {
  const map = new Map<string, SpeechSynthesisVoice[]>();
  for (const voice of voices) {
    const existing = map.get(voice.lang) ?? [];
    existing.push(voice);
    map.set(voice.lang, existing);
  }
  return [...map.entries()]
    .map(([lang, vs]) => ({
      lang,
      label: getVoiceLanguageLabel(lang, displayLocale),
      voices: vs.toSorted((a, b) => a.name.localeCompare(b.name)),
    }))
    .toSorted((a, b) => a.label.localeCompare(b.label));
};

export function getVoiceByName(
  name: string,
): SpeechSynthesisVoice | undefined {
  const synth = (
    globalThis as unknown as { speechSynthesis?: SpeechSynthesis }
  ).speechSynthesis;
  if (!synth) {
    return undefined;
  }
  return safeGetVoices(synth).find((v) => v.name === name);
}
