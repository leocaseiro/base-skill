import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  __resetPhonemeAudioForTests,
  playPhoneme,
  stopPhoneme,
} from './phoneme-audio';
import type { PhonemeSprite } from './phoneme-audio';

const SPRITE: PhonemeSprite = {
  k: { start: 0, duration: 500 },
  ʃ: { start: 1000, duration: 600 },
  n: { start: 2000, duration: 400, loopable: true },
};

interface StubSource {
  buffer: AudioBuffer | null;
  loop: boolean;
  loopStart: number;
  loopEnd: number;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
}

interface StubContext {
  state: AudioContextState;
  destination: unknown;
  createBufferSource: ReturnType<typeof vi.fn>;
  decodeAudioData: ReturnType<typeof vi.fn>;
  resume: ReturnType<typeof vi.fn>;
}

let sources: StubSource[];
let ctx: StubContext;

const makeSource = (): StubSource => ({
  buffer: null,
  loop: false,
  loopStart: 0,
  loopEnd: 0,
  connect: vi.fn(),
  disconnect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  addEventListener: vi.fn(),
});

beforeEach(() => {
  sources = [];
  ctx = {
    state: 'running',
    destination: {},
    createBufferSource: vi.fn(() => {
      const s = makeSource();
      sources.push(s);
      return s as unknown as AudioBufferSourceNode;
    }),
    decodeAudioData: vi
      .fn<(buf: ArrayBuffer) => Promise<AudioBuffer>>()
      .mockResolvedValue({} as AudioBuffer),
    resume: vi.fn<() => Promise<void>>().mockResolvedValue(),
  };
  vi.stubGlobal(
    'AudioContext',
    vi.fn(() => ctx as unknown as AudioContext),
  );
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (url.endsWith('.json')) {
        return Promise.resolve({
          json: () => Promise.resolve(SPRITE),
        } as Response);
      }
      return Promise.resolve({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      } as Response);
    }),
  );
  __resetPhonemeAudioForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('playPhoneme', () => {
  it('creates a buffer source, seeks to the sprite offset, and starts playback', async () => {
    await playPhoneme('k');
    expect(sources).toHaveLength(1);
    expect(sources[0]!.start).toHaveBeenCalledWith(0, 0, 0.5);
    expect(sources[0]!.loop).toBe(false);
  });

  it('seeks correctly for non-zero offsets (ms → seconds)', async () => {
    await playPhoneme('ʃ');
    expect(sources[0]!.start).toHaveBeenCalledWith(0, 1, 0.6);
  });

  it('no-ops on an IPA not present in the sprite', async () => {
    await playPhoneme('xxx');
    expect(sources).toHaveLength(0);
  });

  it('loops the segment when sustain=true on a loopable phoneme', async () => {
    await playPhoneme('n', { sustain: true });
    const src = sources[0]!;
    expect(src.loop).toBe(true);
    expect(src.loopStart).toBe(2);
    expect(src.loopEnd).toBe(2.4);
    expect(src.start).toHaveBeenCalledWith(0, 2);
  });

  it('does not loop when sustain=true on a non-loopable phoneme', async () => {
    await playPhoneme('k', { sustain: true });
    expect(sources[0]!.loop).toBe(false);
    expect(sources[0]!.start).toHaveBeenCalledWith(0, 0, 0.5);
  });

  it('stops a previous source when starting a new one', async () => {
    await playPhoneme('k');
    await playPhoneme('ʃ');
    expect(sources[0]!.stop).toHaveBeenCalledTimes(1);
    expect(sources).toHaveLength(2);
  });

  it('caches the manifest fetch and decoded buffer across calls', async () => {
    const fetchSpy = vi.mocked(globalThis.fetch);
    await playPhoneme('k');
    await playPhoneme('ʃ');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(1);
  });

  it('swallows manifest fetch errors silently', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network'))),
    );
    __resetPhonemeAudioForTests();
    await expect(playPhoneme('k')).resolves.toBeUndefined();
    expect(sources).toHaveLength(0);
  });

  it('resumes a suspended audio context before playback', async () => {
    ctx.state = 'suspended';
    await playPhoneme('k');
    expect(ctx.resume).toHaveBeenCalledTimes(1);
  });
});

describe('stopPhoneme', () => {
  it('stops the currently playing source', async () => {
    await playPhoneme('n', { sustain: true });
    stopPhoneme();
    expect(sources[0]!.stop).toHaveBeenCalledTimes(1);
    expect(sources[0]!.disconnect).toHaveBeenCalledTimes(1);
  });

  it('is a no-op when nothing is playing', () => {
    expect(() => stopPhoneme()).not.toThrow();
  });
});
