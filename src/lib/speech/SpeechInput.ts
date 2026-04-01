export type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((ev: unknown) => void) | null
  onerror: ((ev: unknown) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

export function createSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const SR = (
    window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike
      webkitSpeechRecognition?: new () => SpeechRecognitionLike
    }
  ).SpeechRecognition;
  const WSR = (
    window as unknown as {
      webkitSpeechRecognition?: new () => SpeechRecognitionLike
    }
  ).webkitSpeechRecognition;
  const Ctor = SR ?? WSR;
  if (!Ctor) {
    return null;
  }
  return new Ctor();
}

export function isSpeechInputAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const w = window as unknown as {
    SpeechRecognition?: unknown
    webkitSpeechRecognition?: unknown
  };
  return !!(w.SpeechRecognition ?? w.webkitSpeechRecognition);
}
