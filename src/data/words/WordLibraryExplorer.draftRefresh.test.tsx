import {
  act,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
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

// Mock engine so the test does not need RiTa.  The engine resolves
// quickly with an empty breakdown — the user fills IPA manually before
// saving, mirroring the real "make up an unknown word" flow.
vi.mock('./authoring/engine', () => ({
  generateBreakdown: vi.fn(async (word: string) => ({
    word,
    ipa: '',
    syllables: [],
    phonemes: [],
    ritaKnown: false,
  })),
}));

// Fully mock the audio module: a global fetch stub is racy under CI's
// slower timing — pending useEffects from ResultCard/PhonemeBlender can
// fire after afterEach has unstubbed fetch, hitting Node undici with a
// relative URL and producing unhandled rejections.
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

// CI runs this suite through IndexedDB + React liveQuery + grid
// re-renders; the default 5s ceiling + 1s waitFor are too tight.
vi.setConfig({ testTimeout: 15_000 });

beforeEach(async () => {
  await draftStore.__clearAllForTests();
});

afterEach(async () => {
  await draftStore.__clearAllForTests();
});

describe('WordLibraryExplorer draft refresh', () => {
  it('refreshes the grid after a draft is saved through the authoring panel', async () => {
    render(<WordLibraryExplorer />);

    // Narrow the grid to the unique "zz" prefix so the new draft can
    // be asserted without paginating past 1300+ shipped entries.
    await userEvent.type(screen.getByLabelText(/word search/i), 'zz');
    await act(() => new Promise((r) => setTimeout(r, 100)));

    // Sanity: zzword is not in the grid yet.
    expect(screen.queryByText('zzword')).not.toBeInTheDocument();

    // Open the authoring panel for a brand-new word.
    await userEvent.click(
      screen.getByRole('button', { name: /\+ new word/i }),
    );

    const dialog = await screen.findByRole('dialog', {
      name: /make up a word/i,
    });

    const wordInput = within(dialog).getByRole('textbox', {
      name: /^word$/i,
    });
    await userEvent.type(wordInput, 'zzword');

    // Let the debounced breakdown settle.
    await act(() => new Promise((r) => setTimeout(r, 500)));

    // Provide IPA so Save is enabled.
    const ipaInput = within(dialog).getByRole('textbox', {
      name: /^IPA$/,
    });
    await userEvent.type(ipaInput, 'zwɜːd');

    await userEvent.click(
      within(dialog).getByRole('button', { name: /save draft/i }),
    );

    // The dialog closes once onSaved fires.
    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: /make up a word/i }),
      ).not.toBeInTheDocument();
    });

    // The new draft must appear in the grid without a re-render. The
    // result card renders the word as a heading-styled title; assert
    // on that specifically so the match is unambiguous.
    expect(
      await screen.findByRole('button', { name: /^edit zzword$/i }),
    ).toBeInTheDocument();
  });

  it('refreshes the grid after a draft is deleted from the drafts panel', async () => {
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

    // Narrow the grid by prefix so the draft is on page 1.
    await userEvent.type(screen.getByLabelText(/word search/i), 'zz');

    // The pre-saved draft is visible in the grid.
    expect(
      await screen.findByRole('button', { name: /^edit zzword$/i }),
    ).toBeInTheDocument();

    // Open the drafts panel.
    await userEvent.click(
      await screen.findByRole('button', { name: /drafts \(1\)/i }),
    );

    const draftsPanel = await screen.findByRole('dialog', {
      name: /drafts/i,
    });

    // Delete the draft from inside the panel.
    vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    await userEvent.click(
      within(draftsPanel).getByRole('button', { name: /delete/i }),
    );

    // The grid in the explorer must drop the deleted draft without
    // a manual page reload.
    await waitFor(
      () => {
        expect(
          screen.queryByRole('button', { name: /^edit zzword$/i }),
        ).not.toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });
});
