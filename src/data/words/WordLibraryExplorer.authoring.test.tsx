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
