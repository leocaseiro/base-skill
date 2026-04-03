type SoundKey =
  | 'correct'
  | 'wrong'
  | 'round-complete'
  | 'game-complete';

const SOUND_PATHS: Record<SoundKey, string> = {
  correct: '/sounds/correct.mp3',
  wrong: '/sounds/wrong.mp3',
  'round-complete': '/sounds/round-complete.mp3',
  'game-complete': '/sounds/game-complete.mp3',
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
    // Ignore autoplay policy errors — sound is best-effort
  });
}
