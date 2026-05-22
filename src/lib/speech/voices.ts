import { safeGetVoices } from './safe-get-voices';

export type VoiceGroup = {
  lang: string;
  label: string;
  voices: SpeechSynthesisVoice[];
};

export const isOnlineVoice = (voice: SpeechSynthesisVoice): boolean =>
  !voice.localService;

export const getVoiceLanguageLabel = (lang: string): string => {
  try {
    const dn = new Intl.DisplayNames(['en'], { type: 'language' });
    return dn.of(lang) ?? lang;
  } catch {
    return lang;
  }
};

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
): VoiceGroup[] => {
  const map = new Map<string, SpeechSynthesisVoice[]>();
  for (const voice of voices) {
    const existing = map.get(voice.lang) ?? [];
    existing.push(voice);
    map.set(voice.lang, existing);
  }
  return [...map.entries()].map(([lang, vs]) => ({
    lang,
    label: getVoiceLanguageLabel(lang),
    voices: vs,
  }));
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

export function getVoicesForLanguage(
  lang: string,
): SpeechSynthesisVoice[] {
  const synth = (
    globalThis as unknown as { speechSynthesis?: SpeechSynthesis }
  ).speechSynthesis;
  if (!synth) {
    return [];
  }
  return filterVoicesForLanguage(safeGetVoices(synth), lang);
}
