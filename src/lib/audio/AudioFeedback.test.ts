import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

describe('AudioFeedback', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates an Audio element with the correct src for "correct"', async () => {
    const playSpy = vi.fn().mockResolvedValue();
    const AudioMock = vi.fn().mockImplementation((src: string) => ({
      src,
      volume: 1,
      play: playSpy,
      pause: vi.fn(),
    }));
    vi.stubGlobal('Audio', AudioMock);

    const { playSound } = await import('./AudioFeedback');
    playSound('correct');

    expect(AudioMock).toHaveBeenCalledWith('/sounds/correct.mp3');
    expect(playSpy).toHaveBeenCalled();
  });

  it('creates an Audio element for "wrong"', async () => {
    const playSpy = vi.fn().mockResolvedValue();
    const AudioMock = vi.fn().mockImplementation((src: string) => ({
      src,
      volume: 1,
      play: playSpy,
      pause: vi.fn(),
    }));
    vi.stubGlobal('Audio', AudioMock);

    const { playSound } = await import('./AudioFeedback');
    playSound('wrong');

    expect(AudioMock).toHaveBeenCalledWith('/sounds/wrong.mp3');
  });

  it('sets volume on the audio element', async () => {
    let capturedVolume = 1;
    const AudioMock = vi.fn().mockImplementation(() => ({
      set volume(v: number) {
        capturedVolume = v;
      },
      get volume() {
        return capturedVolume;
      },
      play: vi.fn().mockResolvedValue(),
      pause: vi.fn(),
    }));
    vi.stubGlobal('Audio', AudioMock);

    const { playSound } = await import('./AudioFeedback');
    playSound('correct', 0.5);

    expect(capturedVolume).toBe(0.5);
  });
});
