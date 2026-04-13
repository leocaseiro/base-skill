/**
 * Safely retrieve voices from SpeechSynthesis.
 *
 * iOS Brave returns broken/undefined voice objects from getVoices().
 * This helper filters out null, undefined, and entries without a valid
 * `.name` property, and catches getVoices() throwing entirely.
 */
export const safeGetVoices = (
  synth: SpeechSynthesis,
): SpeechSynthesisVoice[] => {
  try {
    // Cast to unknown[] first: iOS Brave returns null/undefined entries at
    // runtime despite the TypeScript types declaring SpeechSynthesisVoice[].
    return (synth.getVoices() as unknown[]).filter(
      (v): v is SpeechSynthesisVoice =>
        v != null &&
        typeof v === 'object' &&
        typeof (v as SpeechSynthesisVoice).name === 'string',
    );
  } catch {
    return [];
  }
};
