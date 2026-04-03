import { getVoiceByName } from './voices';

export function speak(text: string, voiceName = 'Daniel'): void {
  const synth = (
    globalThis as unknown as { speechSynthesis?: SpeechSynthesis }
  ).speechSynthesis;
  if (!synth) {
    return;
  }
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = getVoiceByName(voiceName);
  if (voice) {
    u.voice = voice;
  }
  synth.speak(u);
}

export function cancelSpeech(): void {
  const synth = (
    globalThis as unknown as { speechSynthesis?: SpeechSynthesis }
  ).speechSynthesis;
  if (!synth) {
    return;
  }
  synth.cancel();
}

export function isSpeechOutputAvailable(): boolean {
  return !!(
    globalThis as unknown as { speechSynthesis?: SpeechSynthesis }
  ).speechSynthesis;
}
