import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

interface FakeBufferSource {
  buffer: AudioBuffer | null;
  start: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  addEventListener: (event: string, handler: () => void) => void;
  trigger: (event: string) => void;
}

interface FakeGain {
  gain: { value: number };
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

interface FakeContext {
  state: 'running' | 'suspended';
  currentTime: number;
  destination: object;
  resume: ReturnType<typeof vi.fn>;
  decodeAudioData: ReturnType<typeof vi.fn>;
  createBufferSource: () => FakeBufferSource;
  createGain: () => FakeGain;
}

const sources: FakeBufferSource[] = [];
let ctx: FakeContext;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  sources.length = 0;

  ctx = {
    state: 'running',
    currentTime: 0,
    destination: {},
    resume: vi.fn().mockResolvedValue(null),
    decodeAudioData: vi
      .fn()
      .mockResolvedValue({ duration: 0.1 } as AudioBuffer),
    createBufferSource: () => {
      const listeners: Record<string, () => void> = {};
      const source: FakeBufferSource = {
        buffer: null,
        start: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        addEventListener: (event, handler) => {
          listeners[event] = handler;
        },
        trigger: (event) => listeners[event]?.(),
      };
      sources.push(source);
      return source;
    },
    createGain: () => ({
      gain: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
  };

  vi.stubGlobal(
    'AudioContext',
    vi.fn().mockImplementation(() => ctx),
  );

  fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('createLowLatencySound', () => {
  it('decodes the buffer once and reuses it across plays', async () => {
    const { createLowLatencySound } = await import('./lowLatencySound');
    const sound = createLowLatencySound('/crack.mp3');

    sound.play();
    sound.play();
    sound.play();

    // Wait for the in-flight fetch+decode promise to resolve.
    await vi.waitFor(() => expect(sources.length).toBeGreaterThan(0));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(1);
  });

  it('throttles plays inside the throttle window', async () => {
    const { createLowLatencySound } = await import('./lowLatencySound');
    const sound = createLowLatencySound('/crack.mp3', {
      throttleMs: 100,
    });

    await sound.preload();

    ctx.currentTime = 0;
    sound.play();
    ctx.currentTime = 0.05; // 50ms — inside window
    sound.play();
    ctx.currentTime = 0.2; // 200ms — outside window
    sound.play();

    expect(sources).toHaveLength(2);
  });

  it('caps concurrent voices at maxConcurrent', async () => {
    const { createLowLatencySound } = await import('./lowLatencySound');
    const sound = createLowLatencySound('/crack.mp3', {
      maxConcurrent: 2,
    });

    await sound.preload();

    sound.play();
    sound.play();
    sound.play(); // dropped
    sound.play(); // dropped

    expect(sources).toHaveLength(2);

    // Free a voice and the next play should fire.
    sources[0]!.trigger('ended');
    sound.play();
    expect(sources).toHaveLength(3);
  });

  it('resumes a suspended AudioContext on play', async () => {
    const { createLowLatencySound } = await import('./lowLatencySound');
    ctx.state = 'suspended';

    const sound = createLowLatencySound('/crack.mp3');
    sound.play();

    expect(ctx.resume).toHaveBeenCalled();
  });

  it('silently ignores fetch errors', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false });
    const { createLowLatencySound } = await import('./lowLatencySound');
    const sound = createLowLatencySound('/missing.mp3');

    sound.play();
    await sound.preload();

    expect(sources).toHaveLength(0);
  });
});
