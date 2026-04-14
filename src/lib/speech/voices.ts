import { safeGetVoices } from './safe-get-voices';

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
  const voices = safeGetVoices(synth);
  const prefix = lang.split('-')[0]?.toLowerCase() ?? lang;
  return voices.filter(
    (v) =>
      v.lang.toLowerCase().startsWith(lang.toLowerCase()) ||
      v.lang.toLowerCase().startsWith(prefix),
  );
}
