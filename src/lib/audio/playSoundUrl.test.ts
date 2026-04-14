import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

interface FakeAudio {
  src: string;
  volume: number;
  play: () => Promise<void>;
  pause: () => void;
  addEventListener: (
    event: string,
    handler: () => void,
    options?: { once?: boolean },
  ) => void;
  trigger: (event: string) => void;
}

const audios: FakeAudio[] = [];

beforeEach(() => {
  audios.length = 0;
  vi.stubGlobal(
    'Audio',
    vi.fn().mockImplementation((src: string) => {
      const listeners: Record<string, () => void> = {};
      const audio: FakeAudio = {
        src,
        volume: 1,
        play: vi.fn().mockResolvedValue(void 0),
        pause: vi.fn(),
        addEventListener: vi.fn(
          (event: string, handler: () => void) => {
            listeners[event] = handler;
          },
        ),
        trigger: (event: string) => {
          listeners[event]?.();
        },
      };
      audios.push(audio);
      return audio;
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('playSoundUrl', () => {
  it('plays an arbitrary URL', async () => {
    const { playSoundUrl } = await import('./AudioFeedback');
    playSoundUrl('/custom.mp3', 0.5);
    expect(audios).toHaveLength(1);
    expect(audios[0]!.src).toContain('custom.mp3');
    expect(audios[0]!.volume).toBe(0.5);
    expect(audios[0]!.play).toHaveBeenCalledTimes(1);
  });

  it('queueSoundUrl waits for prior audio', async () => {
    const { playSoundUrl, queueSoundUrl } =
      await import('./AudioFeedback');
    playSoundUrl('/first.mp3');
    const started = queueSoundUrl('/second.mp3');
    // Simulate the first audio finishing so the queue can advance
    audios[0]!.trigger('ended');
    await started;
    expect(audios).toHaveLength(2);
  });
});
