interface SpriteEntry {
  start: number;
  duration: number;
  loopable?: boolean;
}

export type PhonemeSprite = Record<string, SpriteEntry>;

// Resolve against Vite's BASE_URL so the sprite loads correctly when the app
// or Storybook is served from a subpath (e.g. GitHub Pages PR previews at
// /base-skill/pr/<n>/app/ or /docs/). Absolute paths like "/audio/..." would
// otherwise resolve to the domain root and 404.
const SPRITE_URL = `${import.meta.env.BASE_URL}audio/phonemes.mp3`;
const MANIFEST_URL = `${import.meta.env.BASE_URL}audio/phonemes.json`;

let audioCtx: AudioContext | null = null;
let bufferPromise: Promise<AudioBuffer> | null = null;
let spritePromise: Promise<PhonemeSprite> | null = null;
let currentSource: AudioBufferSourceNode | null = null;

const getContext = (): AudioContext => {
  audioCtx ??= new AudioContext();
  return audioCtx;
};

const loadSprite = (): Promise<PhonemeSprite> => {
  spritePromise ??= fetch(MANIFEST_URL).then(
    (r) => r.json() as Promise<PhonemeSprite>,
  );
  return spritePromise;
};

const loadBuffer = (): Promise<AudioBuffer> => {
  bufferPromise ??= (async () => {
    const ctx = getContext();
    const res = await fetch(SPRITE_URL);
    const arrayBuffer = await res.arrayBuffer();
    return ctx.decodeAudioData(arrayBuffer);
  })();
  return bufferPromise;
};

const stopCurrent = (): void => {
  if (currentSource === null) return;
  try {
    currentSource.stop();
  } catch {
    // already stopped
  }
  currentSource.disconnect();
  currentSource = null;
};

/**
 * Plays a single phoneme clip from the audio sprite. When `opts.sustain`
 * is true and the phoneme is marked loopable in the manifest, the clip
 * loops seamlessly until `stopPhoneme` is called — used by the grapheme
 * chip hover-to-blend UX. Silently skips on any load error or unknown IPA.
 */
export const playPhoneme = async (
  ipa: string,
  opts: { sustain?: boolean } = {},
): Promise<void> => {
  let sprite: PhonemeSprite;
  let buffer: AudioBuffer;
  try {
    [sprite, buffer] = await Promise.all([loadSprite(), loadBuffer()]);
  } catch {
    return;
  }
  const entry = sprite[ipa];
  if (!entry) return;

  stopCurrent();

  const ctx = getContext();
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      // proceed; playback may still work on user gesture
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);

  const startSec = entry.start / 1000;
  const durationSec = entry.duration / 1000;
  const shouldLoop = Boolean(opts.sustain && entry.loopable);

  if (shouldLoop) {
    source.loop = true;
    source.loopStart = startSec;
    source.loopEnd = startSec + durationSec;
    source.start(0, startSec);
  } else {
    source.start(0, startSec, durationSec);
  }

  currentSource = source;
  source.addEventListener('ended', () => {
    if (currentSource === source) {
      currentSource = null;
    }
  });
};

export const stopPhoneme = (): void => {
  stopCurrent();
};

export const __resetPhonemeAudioForTests = (): void => {
  stopCurrent();
  audioCtx = null;
  bufferPromise = null;
  spritePromise = null;
};
