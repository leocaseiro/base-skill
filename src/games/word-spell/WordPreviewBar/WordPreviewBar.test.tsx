import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { WordPreviewBar } from './WordPreviewBar';
import { __resetChunkCacheForTests } from '@/data/words';

afterEach(() => {
  __resetChunkCacheForTests();
});

describe('WordPreviewBar', () => {
  it('shows a "Loading…" hint initially', () => {
    render(
      <WordPreviewBar
        filter={{
          region: 'aus',
          graphemesAllowed: ['s', 'a', 't', 'p', 'i', 'n'],
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
          graphemesAllowed: ['s', 'a', 't', 'p', 'i', 'n'],
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
          graphemesAllowed: ['s'],
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
          graphemesAllowed: [
            's',
            'a',
            't',
            'p',
            'i',
            'n',
            'm',
            'd',
            'g',
            'o',
            'c',
            'k',
            'ck',
            'e',
            'u',
            'r',
          ],
          phonemesRequired: [
            's',
            'a',
            't',
            'p',
            'i',
            'n',
            'm',
            'd',
            'g',
            'o',
            'k',
            'e',
            'u',
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
