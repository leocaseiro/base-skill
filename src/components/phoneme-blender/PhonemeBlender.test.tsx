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
import type { PhonemeSprite } from '#/data/words/phoneme-audio';
import { __resetPhonemeAudioForTests } from '#/data/words/phoneme-audio';

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
