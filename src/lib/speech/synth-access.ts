export const getSynth = (): SpeechSynthesis | undefined =>
  (globalThis as unknown as { speechSynthesis?: SpeechSynthesis })
    .speechSynthesis;
