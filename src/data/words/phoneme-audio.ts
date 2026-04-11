interface SpriteEntry {
  start: number;
  duration: number;
}

export type PhonemeSprite = Record<string, SpriteEntry>;

const SPRITE_URL = '/audio/phonemes.mp3';
const MANIFEST_URL = '/audio/phonemes.json';

let audio: HTMLAudioElement | null = null;
let spritePromise: Promise<PhonemeSprite> | null = null;
let stopTimer: ReturnType<typeof setTimeout> | null = null;

const loadSprite = (): Promise<PhonemeSprite> => {
  spritePromise ??= fetch(MANIFEST_URL).then(
    (r) => r.json() as Promise<PhonemeSprite>,
  );
  return spritePromise;
};

const getAudio = (): HTMLAudioElement => {
  audio ??= new Audio(SPRITE_URL);
  return audio;
};

/**
 * Plays a single phoneme clip from the audio sprite. Silently skips if the
 * sprite is unloadable or the IPA is not in the manifest — this is a dev
 * demo helper, not a production playback primitive.
 */
export const playPhoneme = async (ipa: string): Promise<void> => {
  let sprite: PhonemeSprite;
  try {
    sprite = await loadSprite();
  } catch {
    return;
  }
  const entry = sprite[ipa];
  if (!entry) return;

  if (stopTimer !== null) {
    globalThis.clearTimeout(stopTimer);
    stopTimer = null;
  }

  const el = getAudio();
  el.pause();
  el.currentTime = entry.start / 1000;
  try {
    await el.play();
  } catch {
    return;
  }

  stopTimer = globalThis.setTimeout(() => {
    el.pause();
    stopTimer = null;
  }, entry.duration);
};

export const __resetPhonemeAudioForTests = (): void => {
  audio = null;
  spritePromise = null;
  if (stopTimer !== null) {
    globalThis.clearTimeout(stopTimer);
    stopTimer = null;
  }
};
