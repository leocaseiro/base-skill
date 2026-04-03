type SoundKey =
  | 'correct'
  | 'wrong'
  | 'round-complete'
  | 'game-complete';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

const SOUND_PATHS: Record<SoundKey, string> = {
  correct: `${base}/sounds/correct.mp3`,
  wrong: `${base}/sounds/wrong.mp3`,
  'round-complete': `${base}/sounds/round-complete.mp3`,
  'game-complete': `${base}/sounds/game-complete.mp3`,
};

let currentAudio: HTMLAudioElement | null = null;

export function playSound(key: SoundKey, volume = 0.8): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  const audio = new Audio(SOUND_PATHS[key]);
  audio.volume = volume;
  currentAudio = audio;
  void audio.play().catch(() => {
    console.error(`Failed to play sound ${key}`);
    // Ignore autoplay policy errors — sound is best-effort
  });
}
