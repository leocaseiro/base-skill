export interface SpeakOptions {
  rate?: number;
  volume?: number;
  voiceName?: string;
  lang?: string;
}

function getSynth(): SpeechSynthesis | undefined {
  return (
    globalThis as unknown as { speechSynthesis?: SpeechSynthesis }
  ).speechSynthesis;
}

function buildUtterance(
  text: string,
  options: SpeakOptions,
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(text);
  if (options.rate !== undefined) u.rate = options.rate;
  if (options.volume !== undefined) u.volume = options.volume;
  if (options.lang !== undefined) u.lang = options.lang;
  const voiceName = options.voiceName ?? 'Daniel';
  const voice = voices.find((v) => v.name === voiceName);
  if (voice) u.voice = voice;
  return u;
}

export function speak(
  text: string,
  options: SpeakOptions | string = {},
): void {
  const synth = getSynth();
  if (!synth) return;

  // Normalise: legacy callers may pass a voiceName string
  const opts: SpeakOptions =
    typeof options === 'string' ? { voiceName: options } : options;

  synth.cancel();

  const voices = synth.getVoices();

  if (voices.length > 0) {
    synth.speak(buildUtterance(text, opts, voices));
    return;
  }

  // Voices not loaded yet — defer until voiceschanged fires
  const handler = () => {
    synth.removeEventListener('voiceschanged', handler);
    const loadedVoices = synth.getVoices();
    synth.speak(buildUtterance(text, opts, loadedVoices));
  };
  synth.addEventListener('voiceschanged', handler);
}

export function cancelSpeech(): void {
  const synth = getSynth();
  if (!synth) return;
  synth.cancel();
}

export function isSpeechOutputAvailable(): boolean {
  return !!getSynth();
}
