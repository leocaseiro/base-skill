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

  it('aborts an in-flight playPhoneme whose buffer load resolves after stopPhoneme', async () => {
    // Regression: on Android the sprite decode is slow enough that a
    // finger-lift fires stopPhoneme() before playPhoneme's await resolves.
    // Without generation-guarding the late resolution would start a
    // loopable source that nothing is left to stop → `a,a,a,a` forever.
    let resolveDecode: ((buf: AudioBuffer) => void) | null = null;
    ctx.decodeAudioData = vi.fn(
      () =>
        new Promise<AudioBuffer>((resolve) => {
          resolveDecode = resolve;
        }),
    );
    __resetPhonemeAudioForTests();
    const playPromise = playPhoneme('n', { sustain: true });
    // Let the fetch chain reach ctx.decodeAudioData so resolveDecode is bound.
    await vi.waitFor(() =>
      expect(ctx.decodeAudioData).toHaveBeenCalled(),
    );
    stopPhoneme();
    resolveDecode!({} as AudioBuffer);
    await playPromise;
    expect(sources).toHaveLength(0);
  });
});

describe('auto-stop guards', () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;

  interface FakeEventTarget {
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
    dispatch: (type: string) => void;
    _listeners: Map<string, Set<() => void>>;
  }

  const makeTarget = (): FakeEventTarget => {
    const listeners = new Map<string, Set<() => void>>();
    return {
      _listeners: listeners,
      addEventListener: vi.fn((type: string, fn: () => void) => {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type)!.add(fn);
      }),
      removeEventListener: vi.fn((type: string, fn: () => void) => {
        listeners.get(type)?.delete(fn);
      }),
      dispatch: (type: string) => {
        for (const fn of listeners.get(type) ?? []) fn();
      },
    };
  };

  let fakeDoc: FakeEventTarget & { hidden: boolean };
  let fakeWin: FakeEventTarget;

  beforeEach(() => {
    fakeDoc = Object.assign(makeTarget(), { hidden: false });
    fakeWin = makeTarget();
    vi.stubGlobal('document', fakeDoc);
    vi.stubGlobal('window', fakeWin);
  });

  afterEach(() => {
    vi.stubGlobal('document', originalDocument);
    vi.stubGlobal('window', originalWindow);
  });

  it('stops playback when the document becomes hidden', async () => {
    await playPhoneme('n', { sustain: true });
    expect(sources[0]!.stop).not.toHaveBeenCalled();
    fakeDoc.hidden = true;
    fakeDoc.dispatch('visibilitychange');
    expect(sources[0]!.stop).toHaveBeenCalledTimes(1);
  });

  it('does not stop on visibilitychange when the document is still visible', async () => {
    await playPhoneme('n', { sustain: true });
    fakeDoc.hidden = false;
    fakeDoc.dispatch('visibilitychange');
    expect(sources[0]!.stop).not.toHaveBeenCalled();
  });

  it('stops playback when the window blurs', async () => {
    await playPhoneme('n', { sustain: true });
    fakeWin.dispatch('blur');
    expect(sources[0]!.stop).toHaveBeenCalledTimes(1);
  });

  it('stops playback on pagehide (iOS Safari backgrounding)', async () => {
    await playPhoneme('n', { sustain: true });
    fakeWin.dispatch('pagehide');
    expect(sources[0]!.stop).toHaveBeenCalledTimes(1);
  });

  it('installs listeners only once across multiple playPhoneme calls', async () => {
    await playPhoneme('k');
    await playPhoneme('n', { sustain: true });
    await playPhoneme('ʃ');
    expect(fakeDoc.addEventListener).toHaveBeenCalledTimes(1);
    // blur + pagehide → two listeners on window
    expect(fakeWin.addEventListener).toHaveBeenCalledTimes(2);
  });

  it('__resetPhonemeAudioForTests removes listeners and allows re-installation', async () => {
    await playPhoneme('k');
    __resetPhonemeAudioForTests();
    expect(fakeDoc.removeEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    );
    expect(fakeWin.removeEventListener).toHaveBeenCalledWith(
      'blur',
      expect.any(Function),
    );
    expect(fakeWin.removeEventListener).toHaveBeenCalledWith(
      'pagehide',
      expect.any(Function),
    );
    await playPhoneme('k');
    expect(fakeDoc.addEventListener).toHaveBeenCalledTimes(2);
  });
});
