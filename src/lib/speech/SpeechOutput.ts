import { safeGetVoices } from './safe-get-voices';

export interface SpeakOptions {
  rate?: number;
  volume?: number;
  voiceName?: string;
  lang?: string;
}

let pendingVoicesChangedHandler: (() => void) | null = null;

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

export function isSpeechActive(): boolean {
  const synth = getSynth();
  return !!synth && (synth.speaking || synth.pending);
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

  const voices = safeGetVoices(synth);

  if (voices.length > 0) {
    console.debug(
      `[TTS] speak("${text}") — speaking: ${synth.speaking}, pending: ${synth.pending} → queued`,
    );
    synth.speak(buildUtterance(text, opts, voices));
    return;
  }

  // Voices not loaded yet — defer until voiceschanged fires
  if (pendingVoicesChangedHandler) {
    synth.removeEventListener(
      'voiceschanged',
      pendingVoicesChangedHandler,
    );
  }
  const handler = () => {
    pendingVoicesChangedHandler = null;
    synth.removeEventListener('voiceschanged', handler);
    const loadedVoices = safeGetVoices(synth);
    console.debug(
      `[TTS] speak("${text}") — deferred, voices now loaded → queued`,
    );
    synth.speak(buildUtterance(text, opts, loadedVoices));
  };
  pendingVoicesChangedHandler = handler;
  console.debug(
    `[TTS] speak("${text}") — voices not ready, waiting for voiceschanged`,
  );
  synth.addEventListener('voiceschanged', handler);
}

export function cancelSpeech(): void {
  const synth = getSynth();
  if (!synth) return;
  if (pendingVoicesChangedHandler) {
    synth.removeEventListener(
      'voiceschanged',
      pendingVoicesChangedHandler,
    );
    pendingVoicesChangedHandler = null;
  }
  if (synth.speaking || synth.pending) {
    console.debug(
      `[TTS] cancelSpeech() — speaking: ${synth.speaking}, pending: ${synth.pending} → cancelled`,
    );
    synth.cancel();
  } else {
    console.debug('[TTS] cancelSpeech() — idle, skipped');
  }
}

export function isSpeechOutputAvailable(): boolean {
  return !!getSynth();
}
