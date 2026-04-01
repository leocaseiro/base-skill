export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: unknown) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function createSpeechRecognition(): SpeechRecognitionLike | null {
  if (!('window' in globalThis)) {
    return null;
  }
  const SR = (
    globalThis as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    }
  ).SpeechRecognition;
  const WSR = (
    globalThis as unknown as {
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    }
  ).webkitSpeechRecognition;
  const Ctor = SR ?? WSR;
  if (!Ctor) {
    return null;
  }
  return new Ctor();
}

export function isSpeechInputAvailable(): boolean {
  if (!('window' in globalThis)) {
    return false;
  }
  const w = globalThis as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return !!(w.SpeechRecognition ?? w.webkitSpeechRecognition);
}
