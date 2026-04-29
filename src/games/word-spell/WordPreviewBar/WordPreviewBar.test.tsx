import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { WordPreviewBar } from './WordPreviewBar';
import {
  GRAPHEMES_BY_LEVEL,
  __resetChunkCacheForTests,
  cumulativeGraphemes,
} from '@/data/words';

afterEach(() => {
  __resetChunkCacheForTests();
});

const L1_PAIRS = [...(GRAPHEMES_BY_LEVEL[1] ?? [])];
const L1_L2_PAIRS = cumulativeGraphemes(2);

describe('WordPreviewBar', () => {
  it('shows a "Loading…" hint initially', () => {
    render(
      <WordPreviewBar
        filter={{
          region: 'aus',
          graphemesAllowed: L1_PAIRS,
          phonemesRequired: ['s'],
        }}
      />,
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders the word list when filter resolves', async () => {
    render(
      <WordPreviewBar
        filter={{
          region: 'aus',
          graphemesAllowed: L1_PAIRS,
          phonemesRequired: ['s'],
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const bar = screen.getByTestId('word-preview-bar');
    expect(bar.textContent).toMatch(/sit|sat|sap|sin/);
  });

  it('shows a "Pick at least one sound to play." message when no hits', async () => {
    render(
      <WordPreviewBar
        filter={{
          region: 'aus',
          graphemesAllowed: [{ g: 's', p: 's' }],
          phonemesRequired: [],
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    expect(
      screen.getByText(/pick at least one sound to play/i),
    ).toBeInTheDocument();
  });

  it('truncates long lists and shows the total count', async () => {
    render(
      <WordPreviewBar
        filter={{
          region: 'aus',
          graphemesAllowed: L1_L2_PAIRS,
          phonemesRequired: [
            's',
            'æ',
            't',
            'p',
            'ɪ',
            'n',
            'm',
            'd',
            'g',
            'ɒ',
            'k',
            'e',
            'ʌ',
            'r',
          ],
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const bar = screen.getByTestId('word-preview-bar');
    expect(bar.textContent).toMatch(/\(\d+ total\)/);
  });
});
