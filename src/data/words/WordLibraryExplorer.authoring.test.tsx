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
import { WordLibraryExplorer } from './WordLibraryExplorer';
import type * as PhonemeAudioModule from './phoneme-audio';

// Fully mock the audio module: a global fetch stub is racy under CI's
// slower timing — pending useEffects from ResultCard/PhonemeBlender can
// fire after afterEach has unstubbed fetch, hitting Node undici with a
// relative URL and crashing the test run with unhandled rejections.
vi.mock('./phoneme-audio', async () => {
  const actual =
    await vi.importActual<typeof PhonemeAudioModule>('./phoneme-audio');
  return {
    ...actual,
    getPhonemeSprite: vi.fn(() => Promise.resolve({})),
    playPhoneme: vi.fn(() => Promise.resolve()),
    stopPhoneme: vi.fn(),
  };
});

// These tests drive the full WordLibraryExplorer — multiple clicks,
// debounced search, IndexedDB-backed drafts. Under CI's slower runners
// the biggest tests push past Vitest's 5s default and the cascade
// leaves the next test's render empty. Give the suite more headroom.
vi.setConfig({ testTimeout: 15_000 });

beforeEach(async () => {
  await draftStore.__clearAllForTests();
});
afterEach(async () => {
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

  it('omits the level from the message when the level filter already includes the word', async () => {
    render(<WordLibraryExplorer />);
    // "adore" is Level 8 with 2 syllables. Filtering to Level 8 keeps
    // the level filter satisfied; the syllable filter is what actually
    // hides it, so the message must NOT imply level is the cause.
    await userEvent.click(
      screen.getByRole('button', { name: /^level 8$/i }),
    );
    await userEvent.click(
      screen.getByRole('radio', { name: /exactly/i }),
    );
    // Three spinbuttons render once "Exactly" is active: level range
    // min, level range max, and the newly-revealed syllable-eq input
    // (last in DOM order because SyllablesField follows LevelsField).
    const spinbuttons = screen.getAllByRole('spinbutton');
    const syllablesInput = spinbuttons.at(-1)!;
    await userEvent.type(syllablesInput, '1');
    const search = screen.getByLabelText(/word search/i);
    await userEvent.type(search, 'adore');
    await act(() => new Promise((r) => setTimeout(r, 500)));
    const message = await screen.findByText(
      /exists in shipped data.*filters hide it/i,
    );
    expect(message).toBeInTheDocument();
    expect(message.textContent).not.toMatch(/level 8/i);
    expect(
      screen.getByRole('button', { name: /clear filters/i }),
    ).toBeInTheDocument();
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

  it('edits a shipped entry as a draft override when the Edit button is clicked', async () => {
    render(<WordLibraryExplorer />);
    // Filter to Level 1 and narrow to a single shipped word so we
    // can click its Edit button.
    await userEvent.click(
      screen.getByRole('button', { name: /^level 1$/i }),
    );
    const search = screen.getByLabelText(/word search/i);
    await userEvent.type(search, 'an');
    await act(() => new Promise((r) => setTimeout(r, 500)));
    const editButton = await screen.findByRole('button', {
      name: /^edit an$/i,
    });
    await userEvent.click(editButton);
    // The authoring dialog should open pre-filled from the shipped
    // data and announce the override mode.
    expect(
      await screen.findByRole('dialog', { name: /make up a word/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/editing the shipped entry/i),
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
      await screen.findByText(/drafts \(1\)/i, {}, { timeout: 5000 }),
    ).toBeInTheDocument();
  });
});
