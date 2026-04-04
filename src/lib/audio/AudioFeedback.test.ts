import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const mockPlay = () => Promise.resolve();

function makeAudioMock(onEnded?: { ref: (() => void) | null }) {
  return vi.fn().mockImplementation((src: string) => ({
    src,
    volume: 1,
    play: vi.fn().mockImplementation(mockPlay),
    pause: vi.fn(),
    addEventListener: vi
      .fn()
      .mockImplementation((event: string, cb: () => void) => {
        if (event === 'ended' && onEnded) onEnded.ref = cb;
      }),
  }));
}

describe('AudioFeedback', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates an Audio element with the correct src for "correct"', async () => {
    vi.stubGlobal('Audio', makeAudioMock());
    const { playSound } = await import('./AudioFeedback');
    playSound('correct');
    const AudioMock = globalThis.Audio as ReturnType<typeof vi.fn>;
    expect(AudioMock).toHaveBeenCalledWith('/sounds/correct.mp3');
  });

  it('creates an Audio element for "wrong"', async () => {
    vi.stubGlobal('Audio', makeAudioMock());
    const { playSound } = await import('./AudioFeedback');
    playSound('wrong');
    const AudioMock = globalThis.Audio as ReturnType<typeof vi.fn>;
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
      play: vi.fn().mockImplementation(mockPlay),
      pause: vi.fn(),
      addEventListener: vi.fn(),
    }));
    vi.stubGlobal('Audio', AudioMock);

    const { playSound } = await import('./AudioFeedback');
    playSound('correct', 0.5);

    expect(capturedVolume).toBe(0.5);
  });

  it('queueSound plays after the current sound ends', async () => {
    const playOrder: string[] = [];
    const endedHolder: { ref: (() => void) | null } = { ref: null };

    const AudioMock = vi.fn().mockImplementation((src: string) => ({
      src,
      volume: 1,
      play: vi.fn().mockImplementation(() => {
        playOrder.push(src);
        return Promise.resolve();
      }),
      pause: vi.fn(),
      addEventListener: vi
        .fn()
        .mockImplementation((event: string, cb: () => void) => {
          if (event === 'ended') endedHolder.ref = cb;
        }),
    }));
    vi.stubGlobal('Audio', AudioMock);

    const { playSound, queueSound } = await import('./AudioFeedback');
    playSound('correct');
    queueSound('round-complete');

    expect(playOrder).toEqual(['/sounds/correct.mp3']);

    endedHolder.ref?.();
    await Promise.resolve();

    expect(playOrder).toEqual([
      '/sounds/correct.mp3',
      '/sounds/round-complete.mp3',
    ]);
  });

  it('whenSoundEnds resolves after all queued sounds finish', async () => {
    const endedHolder: { ref: (() => void) | null } = { ref: null };
    const AudioMock = vi.fn().mockImplementation(() => ({
      volume: 1,
      play: vi.fn().mockImplementation(mockPlay),
      pause: vi.fn(),
      addEventListener: vi
        .fn()
        .mockImplementation((event: string, cb: () => void) => {
          if (event === 'ended') endedHolder.ref = cb;
        }),
    }));
    vi.stubGlobal('Audio', AudioMock);

    const { playSound, queueSound, whenSoundEnds } =
      await import('./AudioFeedback');
    playSound('correct');
    queueSound('round-complete');

    let resolved = false;
    void whenSoundEnds().then(() => {
      resolved = true;
    });

    endedHolder.ref?.(); // correct ends → round-complete starts
    await new Promise((r) => setTimeout(r, 0)); // flush all microtasks
    expect(resolved).toBe(false); // round-complete still playing

    endedHolder.ref?.(); // round-complete ends
    await new Promise((r) => setTimeout(r, 0)); // flush all microtasks
    expect(resolved).toBe(true);
  });
});
