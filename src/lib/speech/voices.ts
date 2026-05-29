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

export type ResolveVoiceOptions = {
  /** The user's saved voice name (stored as preferredVoiceURI). */
  preferredVoiceName?: string;
  /** Target language for the utterance, e.g. 'en-AU'. */
  lang: string;
};

// Voices can arrive without a usable `lang` at runtime (see safe-get-voices);
// read it defensively so language matching never throws.
const langOf = (voice: SpeechSynthesisVoice): string =>
  (voice as { lang?: string }).lang ?? '';

const localServiceFirst = (
  a: SpeechSynthesisVoice,
  b: SpeechSynthesisVoice,
): number => Number(b.localService) - Number(a.localService);

/**
 * Pick the best voice for an utterance — device-aware and AU-first:
 * 1. the exact saved voice by name, if present on this device;
 * 2. else the best voice whose lang matches `lang` exactly (local first);
 * 3. else the best voice in the same language family, e.g. en-* (local first);
 * 4. else undefined — the caller leaves utterance.voice unset and relies on
 *    utterance.lang to bias the browser's own fallback.
 *
 * Voice names differ across devices, so step 1 can miss; steps 2–3 keep the
 * spoken accent on-target instead of dropping to the OS default (US) voice.
 */
export const resolveSpeechVoice = (
  voices: SpeechSynthesisVoice[],
  { preferredVoiceName, lang }: ResolveVoiceOptions,
): SpeechSynthesisVoice | undefined => {
  if (voices.length === 0) return undefined;

  if (preferredVoiceName) {
    const exact = voices.find((v) => v.name === preferredVoiceName);
    if (exact) return exact;
  }

  const target = lang.toLowerCase();
  const prefix = target.split('-')[0] ?? target;

  const exactLang = voices
    .filter((v) => langOf(v).toLowerCase() === target)
    .toSorted(localServiceFirst);
  if (exactLang[0]) return exactLang[0];

  const family = voices
    .filter((v) => langOf(v).toLowerCase().startsWith(prefix))
    .toSorted(localServiceFirst);
  return family[0];
};

/**
 * Resolve the spoken language, defaulting to the project's en-AU.
 * Chain: Settings.activeLanguage → UI language (when region-specific) → 'en-AU'.
 * A region-less 'en' maps to 'en-AU' so the browser biases the Australian
 * accent instead of falling back to a US default voice.
 */
export const resolveSpeechLang = ({
  activeLanguage,
  uiLanguage,
}: {
  activeLanguage?: string;
  uiLanguage?: string;
}): string => {
  const candidate = activeLanguage ?? uiLanguage;
  if (!candidate || candidate.toLowerCase() === 'en') return 'en-AU';
  return candidate;
};
