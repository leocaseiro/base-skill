export function getVoicesForLanguage(
  lang: string,
): SpeechSynthesisVoice[] {
  const synth = (
    globalThis as unknown as { speechSynthesis?: SpeechSynthesis }
  ).speechSynthesis;
  if (!synth) {
    return [];
  }
  const voices = synth.getVoices();
  const prefix = lang.split('-')[0]?.toLowerCase() ?? lang;
  return voices.filter(
    (v) =>
      v.lang.toLowerCase().startsWith(lang.toLowerCase()) ||
      v.lang.toLowerCase().startsWith(prefix),
  );
}
