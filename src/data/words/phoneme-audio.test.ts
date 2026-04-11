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
} from './phoneme-audio';
import type { PhonemeSprite } from './phoneme-audio';

const SPRITE: PhonemeSprite = {
  k: { start: 0, duration: 500 },
  ʃ: { start: 1000, duration: 600 },
};

interface StubAudio {
  src: string;
  currentTime: number;
  pause: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
}

const makeStubAudio = (): StubAudio => ({
  src: '',
  currentTime: 0,
  pause: vi.fn(),
  play: vi.fn<() => Promise<void>>().mockResolvedValue(),
});

let stubAudio: StubAudio;

beforeEach(() => {
  vi.useFakeTimers();
  stubAudio = makeStubAudio();
  vi.stubGlobal(
    'Audio',
    vi.fn((src: string) => {
      stubAudio.src = src;
      return stubAudio as unknown as HTMLAudioElement;
    }),
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(SPRITE),
      } as Response),
    ),
  );
  __resetPhonemeAudioForTests();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('playPhoneme', () => {
  it('seeks to the sprite offset and plays', async () => {
    await playPhoneme('k');
    expect(stubAudio.currentTime).toBe(0);
    expect(stubAudio.play).toHaveBeenCalledTimes(1);
  });

  it('seeks correctly for non-zero offsets (ms → seconds)', async () => {
    await playPhoneme('ʃ');
    expect(stubAudio.currentTime).toBe(1);
  });

  it('pauses after the clip duration elapses', async () => {
    await playPhoneme('k');
    expect(stubAudio.pause).toHaveBeenCalledTimes(1); // initial pre-play pause
    vi.advanceTimersByTime(500);
    expect(stubAudio.pause).toHaveBeenCalledTimes(2); // stop timer fired
  });

  it('no-ops on an IPA not present in the sprite', async () => {
    await playPhoneme('xxx');
    expect(stubAudio.play).not.toHaveBeenCalled();
  });

  it('caches the manifest fetch across calls', async () => {
    const fetchSpy = vi.mocked(globalThis.fetch);
    await playPhoneme('k');
    await playPhoneme('ʃ');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('swallows manifest fetch errors silently', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network'))),
    );
    __resetPhonemeAudioForTests();
    await expect(playPhoneme('k')).resolves.toBeUndefined();
    expect(stubAudio.play).not.toHaveBeenCalled();
  });
});
