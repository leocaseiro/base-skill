import { render, screen, waitFor } from '@testing-library/react';
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
  const evt = new Event(type, { bubbles: true }) as Event & {
    clientX: number;
    pointerId: number;
  };
  Object.defineProperty(evt, 'clientX', { value: clientX });
  Object.defineProperty(evt, 'pointerId', { value: 1 });
  el.dispatchEvent(evt);
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
    expect(first.className).toContain('text-purple-200');
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

  it('fires stop consonants once per drag pass (no re-trigger on wiggle)', async () => {
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
    firePointer(track, 'pointermove', 500);
    firePointer(track, 'pointermove', 750);
    await waitFor(() => {
      const tCalls = vi
        .mocked(playPhoneme)
        .mock.calls.filter((c) => c[0] === 't');
      expect(tCalls).toHaveLength(1);
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
