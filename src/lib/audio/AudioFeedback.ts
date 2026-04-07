type SoundKey =
  | 'correct'
  | 'wrong'
  | 'round-complete'
  | 'game-complete'
  | 'tile-place';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

const SOUND_PATHS: Record<SoundKey, string> = {
  correct: `${base}/sounds/correct.mp3`,
  wrong: `${base}/sounds/wrong.mp3`,
  'round-complete': `${base}/sounds/round-complete.mp3`,
  'game-complete': `${base}/sounds/game-complete.mp3`,
  'tile-place': `${base}/sounds/tile-place.mp3`,
};

let currentAudio: HTMLAudioElement | null = null;
let currentResolve: (() => void) | null = null;
let queueTail: Promise<void> = Promise.resolve();

function playSoundInternal(
  key: SoundKey,
  volume: number,
): Promise<void> {
  currentAudio?.pause();
  currentAudio = null;

  const audio = new Audio(SOUND_PATHS[key]);
  audio.volume = volume;
  currentAudio = audio;

  return new Promise<void>((resolve) => {
    currentResolve = resolve;

    const cleanup = () => {
      if (currentResolve === resolve) currentResolve = null;
      if (currentAudio === audio) currentAudio = null;
      resolve();
    };

    audio.addEventListener('ended', cleanup, { once: true });
    audio.addEventListener('error', cleanup, { once: true });

    void audio.play().catch(() => {
      console.error(`Failed to play sound ${key}`);
      cleanup();
    });
  });
}

/**
 * Plays immediately, cancelling any current audio and resetting the queue.
 * Use for tile feedback (correct/wrong) where the latest sound always wins.
 */
export function playSound(key: SoundKey, volume = 0.8): void {
  currentResolve?.();
  currentResolve = null;
  queueTail = playSoundInternal(key, volume);
}

/**
 * Queues a sound to play after the current queue drains.
 * Use for phase sounds (round-complete, game-complete) so they don't cut off tile feedback.
 * Returns a promise that resolves when the queued sound **starts** (not ends).
 */
export function queueSound(key: SoundKey, volume = 0.8): Promise<void> {
  const startsAt = queueTail;
  queueTail = startsAt.then(() => playSoundInternal(key, volume));
  return startsAt;
}

/**
 * Returns a promise that resolves when all pending audio (current + queued) finishes.
 * Use to delay TTS until the audio queue is empty.
 */
export function whenSoundEnds(): Promise<void> {
  return queueTail;
}
