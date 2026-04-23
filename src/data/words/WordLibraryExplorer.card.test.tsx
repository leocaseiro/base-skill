import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { __resetPhonemeAudioForTests } from './phoneme-audio';
import { ResultCard } from './WordLibraryExplorer';
import type { WordHit } from './types';

const putting: WordHit = {
  word: 'putting',
  region: 'aus',
  level: 3,
  syllableCount: 2,
  syllables: ['put', 'ting'],
  ipa: 'ˈpʊtɪŋ',
  graphemes: [
    { g: 'p', p: 'p' },
    { g: 'u', p: 'ʊ' },
    { g: 'tt', p: 't' },
    { g: 'ing', p: 'ɪŋ' },
  ],
};

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({}),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      } as Response),
    ),
  );
  __resetPhonemeAudioForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ResultCard', () => {
  it('renders word, syllables, speaker button with visible /ipa/, and badges', () => {
    render(<ResultCard hit={putting} chipsVisible />);
    expect(screen.getByText('putting')).toBeInTheDocument();
    expect(screen.getByText('put·ting')).toBeInTheDocument();
    const speak = screen.getByRole('button', {
      name: /speak putting/i,
    });
    expect(speak).toHaveTextContent('/ˈpʊtɪŋ/');
    expect(screen.getByText('L3')).toBeInTheDocument();
    expect(screen.getByText('2 syl')).toBeInTheDocument();
  });

  it('renders the PhonemeBlender wrapper', () => {
    render(<ResultCard hit={putting} chipsVisible />);
    expect(
      screen.getByRole('slider', { name: /putting/i }),
    ).toBeInTheDocument();
  });

  it('shows chips when chipsVisible is true and hides them otherwise', () => {
    const { rerender } = render(
      <ResultCard hit={putting} chipsVisible />,
    );
    const chipRegion = screen.getByTestId('chips-row');
    expect(
      within(chipRegion).getAllByRole('button').length,
    ).toBeGreaterThan(0);
    rerender(<ResultCard hit={putting} chipsVisible={false} />);
    expect(screen.queryByTestId('chips-row')).not.toBeInTheDocument();
  });

  it('chips have no hover sustain handlers', async () => {
    render(<ResultCard hit={putting} chipsVisible />);
    const chip = within(screen.getByTestId('chips-row')).getAllByRole(
      'button',
    )[0]!;
    await userEvent.hover(chip);
    expect(chip).not.toHaveAttribute('onpointerenter');
    expect(chip).not.toHaveAttribute('onfocus');
  });
});
