import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { PhonemeBlender } from './PhonemeBlender';
import type * as PhonemeAudioModule from '#/data/words/phoneme-audio';
import type { PhonemeSprite } from '#/data/words/phoneme-audio';
import {
  __resetPhonemeAudioForTests,
  playPhoneme,
  stopPhoneme,
} from '#/data/words/phoneme-audio';

vi.mock('#/data/words/phoneme-audio', async () => {
  const actual = await vi.importActual<typeof PhonemeAudioModule>(
    '#/data/words/phoneme-audio',
  );
  return {
    ...actual,
    playPhoneme: vi.fn(() => Promise.resolve()),
    stopPhoneme: vi.fn(),
  };
});

const setRect = (el: HTMLElement) => {
  el.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: 1400,
      bottom: 40,
      width: 1400,
      height: 40,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
};

const firePointer = (
  el: HTMLElement,
  type: string,
  clientX: number,
) => {
  act(() => {
    const evt = new Event(type, { bubbles: true }) as Event & {
      clientX: number;
      pointerId: number;
    };
    Object.defineProperty(evt, 'clientX', { value: clientX });
    Object.defineProperty(evt, 'pointerId', { value: 1 });
    el.dispatchEvent(evt);
  });
};

const SPRITE: PhonemeSprite = {
  p: { start: 0, duration: 200 },
  ʊ: { start: 200, duration: 400, loopable: true },
  t: { start: 600, duration: 300 },
  ɪŋ: { start: 900, duration: 500, loopable: true },
};

const PUTTING = [
  { g: 'p', p: 'p' },
  { g: 'u', p: 'ʊ' },
  { g: 'tt', p: 't' },
  { g: 'ing', p: 'ɪŋ' },
];

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(SPRITE),
      } as Response),
    ),
  );
  __resetPhonemeAudioForTests();
  vi.mocked(playPhoneme).mockClear();
  vi.mocked(stopPhoneme).mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('PhonemeBlender — zones', () => {
  it('renders one zone per grapheme with flex proportional to duration', async () => {
    render(<PhonemeBlender word="putting" graphemes={PUTTING} />);
    const track = await screen.findByRole('slider');
    await waitFor(() =>
      expect(track.querySelectorAll('[data-zone-index]')).toHaveLength(
        4,
      ),
    );
    const zones = track.querySelectorAll('[data-zone-index]');
    await waitFor(() =>
      expect((zones[0] as HTMLElement).style.flexGrow).toBe('200'),
    );
    expect((zones[1] as HTMLElement).style.flexGrow).toBe('400');
    expect((zones[2] as HTMLElement).style.flexGrow).toBe('300');
    expect((zones[3] as HTMLElement).style.flexGrow).toBe('500');
  });

  it('renders each grapheme as an idle-coloured span', async () => {
    render(<PhonemeBlender word="putting" graphemes={PUTTING} />);
    await waitFor(() =>
      expect(screen.getByTestId('letter-0')).toBeInTheDocument(),
    );
    const first = screen.getByTestId('letter-0');
    expect(first).toHaveTextContent('p');
    expect(first.className).toContain('text-neutral-600');
  });

  it('colours loopable zones purple and stop zones yellow', async () => {
    render(<PhonemeBlender word="putting" graphemes={PUTTING} />);
    const track = await screen.findByRole('slider');
    await waitFor(() => {
      const zones = track.querySelectorAll('[data-zone-index]');
      expect((zones[1] as HTMLElement).className).toContain(
        'bg-purple-500',
      );
    });
    const zones = track.querySelectorAll('[data-zone-index]');
    expect((zones[0] as HTMLElement).className).toContain(
      'bg-yellow-400',
    );
    expect((zones[1] as HTMLElement).className).toContain(
      'bg-purple-500',
    );
    expect((zones[2] as HTMLElement).className).toContain(
      'bg-yellow-400',
    );
    expect((zones[3] as HTMLElement).className).toContain(
      'bg-purple-500',
    );
  });

  it('sets aria-valuemin/max/valuetext from total duration', async () => {
    render(<PhonemeBlender word="putting" graphemes={PUTTING} />);
    const track = await screen.findByRole('slider');
    await waitFor(() =>
      expect(track.getAttribute('aria-valuemax')).toBe('1400'),
    );
    expect(track.getAttribute('aria-valuemin')).toBe('0');
    expect(track.getAttribute('aria-valuenow')).toBe('0');
  });

  it('renders a visible playhead indicator at 0% initially', async () => {
    render(<PhonemeBlender word="putting" graphemes={PUTTING} />);
    const playhead = await screen.findByTestId('playhead');
    expect(playhead.style.left).toBe('0%');
  });

  it('prevents the native context menu so Android Chrome does not pop its download/share sheet on long-press', async () => {
    render(<PhonemeBlender word="putting" graphemes={PUTTING} />);
    const track = await screen.findByRole('slider');
    const evt = new Event('contextmenu', {
      bubbles: true,
      cancelable: true,
    });
    track.dispatchEvent(evt);
    expect(evt.defaultPrevented).toBe(true);
  });

  it('moves the playhead to the scrub position on pointerdown', async () => {
    render(<PhonemeBlender word="putting" graphemes={PUTTING} />);
    const track = await screen.findByRole('slider');
    await waitFor(() =>
      expect(track.getAttribute('aria-valuemax')).toBe('1400'),
    );
    setRect(track);
    (
      track as HTMLElement & { setPointerCapture: (id: number) => void }
    ).setPointerCapture = () => {};
    firePointer(track, 'pointerdown', 700);
    await waitFor(() => {
      const playhead = screen.getByTestId('playhead');
      expect(playhead.style.left).toBe('50%');
    });
  });
});

describe('PhonemeBlender — scrub', () => {
  it('fires playPhoneme with sustain=true when pointer enters a loopable zone', async () => {
    render(<PhonemeBlender word="putting" graphemes={PUTTING} />);
    const track = await screen.findByRole('slider');
    await waitFor(() =>
      expect(track.getAttribute('aria-valuemax')).toBe('1400'),
    );
    setRect(track);
    if (!('setPointerCapture' in track)) {
      (
        track as HTMLElement & {
          setPointerCapture: (id: number) => void;
        }
      ).setPointerCapture = () => {};
    }
    firePointer(track, 'pointerdown', 300);
    await waitFor(() =>
      expect(playPhoneme).toHaveBeenCalledWith('ʊ', { sustain: true }),
    );
    expect(track.getAttribute('aria-valuenow')).toBe('300');
    expect(screen.getByTestId('letter-1').className).toContain(
      'text-foreground',
    );
  });

  it('does not re-fire a phoneme while the pointer wiggles inside the same zone', async () => {
    render(<PhonemeBlender word="putting" graphemes={PUTTING} />);
    const track = await screen.findByRole('slider');
    await waitFor(() =>
      expect(track.getAttribute('aria-valuemax')).toBe('1400'),
    );
    setRect(track);
    (
      track as HTMLElement & { setPointerCapture: (id: number) => void }
    ).setPointerCapture = () => {};
    // tt zone spans 600–900. All three pointer events land inside it.
    firePointer(track, 'pointerdown', 650);
    firePointer(track, 'pointermove', 750);
    firePointer(track, 'pointermove', 850);
    await waitFor(() => {
      const tCalls = vi
        .mocked(playPhoneme)
        .mock.calls.filter((c) => c[0] === 't');
      expect(tCalls).toHaveLength(1);
    });
  });

  it('re-fires a stop consonant when the pointer leaves and re-enters its zone', async () => {
    render(<PhonemeBlender word="putting" graphemes={PUTTING} />);
    const track = await screen.findByRole('slider');
    await waitFor(() =>
      expect(track.getAttribute('aria-valuemax')).toBe('1400'),
    );
    setRect(track);
    (
      track as HTMLElement & { setPointerCapture: (id: number) => void }
    ).setPointerCapture = () => {};
    // tt zone 600–900, u zone 200–600. Drag tt → u → tt in a single pass.
    firePointer(track, 'pointerdown', 750);
    firePointer(track, 'pointermove', 400);
    firePointer(track, 'pointermove', 750);
    await waitFor(() => {
      const tCalls = vi
        .mocked(playPhoneme)
        .mock.calls.filter((c) => c[0] === 't');
      expect(tCalls).toHaveLength(2);
    });
  });

  it('fires the stop consonant on a new pointerdown pass', async () => {
    render(<PhonemeBlender word="putting" graphemes={PUTTING} />);
    const track = await screen.findByRole('slider');
    await waitFor(() =>
      expect(track.getAttribute('aria-valuemax')).toBe('1400'),
    );
    setRect(track);
    (
      track as HTMLElement & { setPointerCapture: (id: number) => void }
    ).setPointerCapture = () => {};
    firePointer(track, 'pointerdown', 750);
    firePointer(track, 'pointerup', 750);
    firePointer(track, 'pointerdown', 750);
    await waitFor(() => {
      const tCalls = vi
        .mocked(playPhoneme)
        .mock.calls.filter((c) => c[0] === 't');
      expect(tCalls).toHaveLength(2);
    });
  });

  it('stops the sustained loop and re-fires the stop phoneme when re-entering', async () => {
    // Bug report: drag loopable → stop → loopable → stop (same stop zone).
    // On the second visit to the stop zone, the loopable's sustain must stop
    // AND the stop phoneme must re-fire.
    render(<PhonemeBlender word="putting" graphemes={PUTTING} />);
    const track = await screen.findByRole('slider');
    await waitFor(() =>
      expect(track.getAttribute('aria-valuemax')).toBe('1400'),
    );
    setRect(track);
    (
      track as HTMLElement & { setPointerCapture: (id: number) => void }
    ).setPointerCapture = () => {};
    // u (loopable, 200-600) → tt (stop, 600-900) → u → tt
    firePointer(track, 'pointerdown', 300); // u loop starts
    firePointer(track, 'pointermove', 750); // tt fires once
    firePointer(track, 'pointermove', 300); // u loop restarts
    vi.mocked(stopPhoneme).mockClear();
    vi.mocked(playPhoneme).mockClear();
    firePointer(track, 'pointermove', 750); // tt re-entry
    await waitFor(() => {
      expect(stopPhoneme).toHaveBeenCalled();
      expect(playPhoneme).toHaveBeenCalledWith('t');
    });
  });

  it('calls stopPhoneme on pointerup and clears the active highlight', async () => {
    render(<PhonemeBlender word="putting" graphemes={PUTTING} />);
    const track = await screen.findByRole('slider');
    await waitFor(() =>
      expect(track.getAttribute('aria-valuemax')).toBe('1400'),
    );
    setRect(track);
    (
      track as HTMLElement & { setPointerCapture: (id: number) => void }
    ).setPointerCapture = () => {};
    firePointer(track, 'pointerdown', 300);
    firePointer(track, 'pointerup', 300);
    expect(stopPhoneme).toHaveBeenCalled();
  });
});

describe('PhonemeBlender — auto-play', () => {
  it('advances through zones via requestAnimationFrame at normal speed', async () => {
    render(<PhonemeBlender word="putting" graphemes={PUTTING} />);
    const track = await screen.findByRole('slider');
    await waitFor(() =>
      expect(track.getAttribute('aria-valuemax')).toBe('1400'),
    );
    vi.useFakeTimers();
    const playButton = screen.getByRole('button', { name: /^play /i });
    await act(async () => {
      playButton.click();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(260);
    });
    const calls = vi.mocked(playPhoneme).mock.calls.map((c) => c[0]);
    expect(calls).toContain('ʊ');
    vi.useRealTimers();
  });

  it('cycles through the three speeds when the selector is clicked', async () => {
    render(<PhonemeBlender word="putting" graphemes={PUTTING} />);
    const track = await screen.findByRole('slider');
    await waitFor(() =>
      expect(track.getAttribute('aria-valuemax')).toBe('1400'),
    );
    expect(
      screen.getByRole('radio', { name: /normal/i }),
    ).toHaveAttribute('aria-checked', 'true');
    await act(async () => {
      screen.getByRole('radio', { name: /slow/i }).click();
    });
    expect(
      screen.getByRole('radio', { name: /slow/i }),
    ).toHaveAttribute('aria-checked', 'true');
  });

  it('pauses when the play button is pressed again', async () => {
    render(<PhonemeBlender word="putting" graphemes={PUTTING} />);
    const track = await screen.findByRole('slider');
    await waitFor(() =>
      expect(track.getAttribute('aria-valuemax')).toBe('1400'),
    );
    vi.useFakeTimers();
    const playButton = screen.getByRole('button', { name: /^play /i });
    await act(async () => {
      playButton.click();
    });
    const pauseButton = screen.getByRole('button', { name: /^pause/i });
    await act(async () => {
      pauseButton.click();
    });
    expect(
      screen.getByRole('button', { name: /^play /i }),
    ).toBeInTheDocument();
    vi.useRealTimers();
  });
});

describe('PhonemeBlender — keyboard', () => {
  it('ArrowRight steps to the next zone and fires its phoneme', async () => {
    render(<PhonemeBlender word="putting" graphemes={PUTTING} />);
    const track = await screen.findByRole('slider');
    await waitFor(() =>
      expect(track.getAttribute('aria-valuemax')).toBe('1400'),
    );
    track.focus();
    fireEvent.keyDown(track, { key: 'ArrowRight' });
    await waitFor(() => {
      const calls = vi.mocked(playPhoneme).mock.calls.map((c) => c[0]);
      expect(calls).toContain('p');
    });
  });

  it('End jumps to the last zone and fires its phoneme', async () => {
    render(<PhonemeBlender word="putting" graphemes={PUTTING} />);
    const track = await screen.findByRole('slider');
    await waitFor(() =>
      expect(track.getAttribute('aria-valuemax')).toBe('1400'),
    );
    track.focus();
    fireEvent.keyDown(track, { key: 'End' });
    await waitFor(() =>
      expect(playPhoneme).toHaveBeenCalledWith('ɪŋ', { sustain: true }),
    );
  });

  it('Space toggles auto-play', async () => {
    render(<PhonemeBlender word="putting" graphemes={PUTTING} />);
    const track = await screen.findByRole('slider');
    await waitFor(() =>
      expect(track.getAttribute('aria-valuemax')).toBe('1400'),
    );
    track.focus();
    fireEvent.keyDown(track, { key: ' ' });
    expect(
      screen.getByRole('button', { name: /^pause/i }),
    ).toBeInTheDocument();
  });
});
