export function speak(text: string): void {
  const synth = (globalThis as unknown as { speechSynthesis?: SpeechSynthesis })
    .speechSynthesis;
  if (!synth) {
    return;
  }
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  synth.speak(u);
}

export function cancelSpeech(): void {
  const synth = (globalThis as unknown as { speechSynthesis?: SpeechSynthesis })
    .speechSynthesis;
  if (!synth) {
    return;
  }
  synth.cancel();
}

export function isSpeechOutputAvailable(): boolean {
  return !!(globalThis as unknown as { speechSynthesis?: SpeechSynthesis })
    .speechSynthesis;
}
