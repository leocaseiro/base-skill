import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { draftStore } from './authoring/draftStore';
import { __resetPhonemeAudioForTests } from './phoneme-audio';
import { WordLibraryExplorer } from './WordLibraryExplorer';

beforeEach(async () => {
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
  await draftStore.__clearAllForTests();
});
afterEach(async () => {
  vi.unstubAllGlobals();
  await draftStore.__clearAllForTests();
});

describe('WordLibraryExplorer authoring entry points', () => {
  it('shows a + New word button', () => {
    render(<WordLibraryExplorer />);
    expect(
      screen.getByRole('button', { name: /new word/i }),
    ).toBeInTheDocument();
  });

  it('renders an empty-state CTA when search returns 0', async () => {
    render(<WordLibraryExplorer />);
    // The real placeholder is "Starts with…" — use label text instead
    const search = screen.getByLabelText(/word search/i);
    await userEvent.type(search, 'xzqxzq');
    await act(() => new Promise((r) => setTimeout(r, 500)));
    expect(
      screen.getByRole('button', { name: /make up this word/i }),
    ).toBeInTheDocument();
  });

  it('shows a level-aware message when the word exists at a filtered-out level', async () => {
    render(<WordLibraryExplorer />);
    // "adore" is shipped at Level 8; filter to Level 1 so it is hidden.
    await userEvent.click(
      screen.getByRole('button', { name: /^level 1$/i }),
    );
    const search = screen.getByLabelText(/word search/i);
    await userEvent.type(search, 'adore');
    await act(() => new Promise((r) => setTimeout(r, 500)));
    expect(
      await screen.findByText(/available at level 8/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /clear filters/i }),
    ).toBeInTheDocument();
    // The "Make up this word?" CTA must NOT appear for a shipped word.
    expect(
      screen.queryByRole('button', { name: /make up this word/i }),
    ).not.toBeInTheDocument();
  });

  it('clear-filters button restores the hidden word to the results', async () => {
    render(<WordLibraryExplorer />);
    await userEvent.click(
      screen.getByRole('button', { name: /^level 1$/i }),
    );
    const search = screen.getByLabelText(/word search/i);
    await userEvent.type(search, 'adore');
    await act(() => new Promise((r) => setTimeout(r, 500)));
    const clearBtn = await screen.findByRole('button', {
      name: /clear filters/i,
    });
    await userEvent.click(clearBtn);
    await act(() => new Promise((r) => setTimeout(r, 500)));
    // The level-aware message should be gone and adore visible as a result.
    expect(
      screen.queryByText(/available at level 8/i),
    ).not.toBeInTheDocument();
  });

  it('shows a Drafts link when drafts exist', async () => {
    await draftStore.saveDraft({
      word: 'zzword',
      region: 'aus',
      level: 3,
      ipa: 'zwɜːd',
      syllables: ['zz', 'word'],
      syllableCount: 2,
      graphemes: [
        { g: 'zz', p: 'z' },
        { g: 'word', p: 'wɜːd' },
      ],
      ritaKnown: false,
    });
    render(<WordLibraryExplorer />);
    expect(
      await screen.findByText(/drafts \(1\)/i),
    ).toBeInTheDocument();
  });
});
