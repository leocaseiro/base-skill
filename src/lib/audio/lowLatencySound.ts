/**
 * Low-latency one-shot sound player built on the Web Audio API.
 *
 * Why not `new Audio(url).play()` for rapid feedback?
 *
 * - HTMLAudioElement starts a fresh decode + buffer pipeline every play. On
 *   Android Chromium that costs ~100-300ms of perceptible delay before the
 *   first sample reaches the speaker, which feels broken on a tap-to-crack
 *   game.
 * - Web Audio decodes the asset **once** into an AudioBuffer and triggers
 *   playback via an AudioBufferSourceNode that schedules samples directly,
 *   eliminating the decode-on-play cost.
 *
 * `createLowLatencySound(url)` returns a `play()` you can call as fast as
 * the user taps. A throttle and a per-sound concurrency cap keep rapid taps
 * from collapsing into a buzzing wall of overlapping audio.
 *
 * Designed for single-shot effects (crack, pop, chime) — not music or
 * looping audio. Errors during fetch/decode degrade silently so a missing
 * asset never breaks the game; the next caller just gets no sound.
 */

interface LowLatencyOptions {
  /**
   * Minimum milliseconds between plays. Calls inside the window become
   * no-ops. Defaults to 0 (no throttle).
   */
  throttleMs?: number;
  /**
   * Maximum simultaneous voices for this sound. Older voices are kept
   * playing; new ones beyond the cap are dropped. Defaults to 4 — enough
   * to feel layered without becoming a buzz.
   */
  maxConcurrent?: number;
  /** Volume in [0, 1]. Defaults to 0.8. */
  volume?: number;
}

export interface LowLatencySound {
  /** Trigger one play. Cheap to call repeatedly. */
  play: () => void;
  /** Force-decode the buffer now (e.g. on mount). Optional. */
  preload: () => Promise<void>;
}

let sharedCtx: AudioContext | null = null;

const getSharedContext = (): AudioContext | null => {
  // Guard for SSR / tests where AudioContext is absent.
  const Ctor = (
    globalThis as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    }
  ).AudioContext;
  const Fallback = (
    globalThis as unknown as {
      webkitAudioContext?: typeof AudioContext;
    }
  ).webkitAudioContext;
  const Resolved = Ctor ?? Fallback;
  if (!Resolved) return null;
  sharedCtx ??= new Resolved();
  return sharedCtx;
};

export const createLowLatencySound = (
  url: string,
  options: LowLatencyOptions = {},
): LowLatencySound => {
  const throttleMs = options.throttleMs ?? 0;
  const maxConcurrent = options.maxConcurrent ?? 4;
  const volume = options.volume ?? 0.8;

  let bufferPromise: Promise<AudioBuffer | null> | null = null;
  let decodedBuffer: AudioBuffer | null = null;
  let lastPlayedAt = Number.NEGATIVE_INFINITY;
  let activeVoices = 0;

  const loadBuffer = (): Promise<AudioBuffer | null> => {
    if (bufferPromise !== null) return bufferPromise;
    const ctx = getSharedContext();
    if (!ctx) {
      bufferPromise = Promise.resolve(null);
      return bufferPromise;
    }
    bufferPromise = (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const arrayBuffer = await res.arrayBuffer();
        const buffer = await ctx.decodeAudioData(arrayBuffer);
        decodedBuffer = buffer;
        return buffer;
      } catch {
        return null;
      }
    })();
    return bufferPromise;
  };

  const triggerPlay = (
    buffer: AudioBuffer,
    ctx: AudioContext,
  ): void => {
    if (activeVoices >= maxConcurrent) return;
    activeVoices += 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.value = volume;

    source.connect(gain);
    gain.connect(ctx.destination);

    source.addEventListener('ended', () => {
      activeVoices = Math.max(0, activeVoices - 1);
      source.disconnect();
      gain.disconnect();
    });

    source.start(0);
  };

  const play = (): void => {
    const ctx = getSharedContext();
    if (!ctx) return;

    const now = ctx.currentTime * 1000;
    if (throttleMs > 0 && now - lastPlayedAt < throttleMs) return;
    lastPlayedAt = now;

    // Resume on user gesture (autoplay policy on Chrome/Safari/Android).
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    if (decodedBuffer !== null) {
      triggerPlay(decodedBuffer, ctx);
      return;
    }

    void loadBuffer().then((buffer) => {
      if (!buffer) return;
      const liveCtx = getSharedContext();
      if (!liveCtx) return;
      triggerPlay(buffer, liveCtx);
    });
  };

  const preload = async (): Promise<void> => {
    await loadBuffer();
  };

  return { play, preload };
};

export const __resetLowLatencyAudioForTests = (): void => {
  sharedCtx = null;
};
