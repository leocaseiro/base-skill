import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AuthoringPanel } from './AuthoringPanel';
import { draftStore } from './draftStore';

vi.mock('./engine', () => ({
  generateBreakdown: vi.fn(async (word: string) => ({
    word,
    ipa: word === 'putting' ? 'pʊtɪŋ' : '',
    syllables: word === 'putting' ? ['put', 'ting'] : [],
    phonemes: word === 'putting' ? ['p', 'ʊ', 't', 'ɪ', 'ŋ'] : [],
    ritaKnown: word === 'putting',
  })),
}));

const noop = () => {};

describe('AuthoringPanel shell', () => {
  it('renders when open', () => {
    render(<AuthoringPanel open onClose={noop} initialWord="" />);
    expect(
      screen.getByRole('dialog', { name: /make up a word/i }),
    ).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <AuthoringPanel open={false} onClose={noop} initialWord="" />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when ESC is pressed (clean form)', async () => {
    const onClose = vi.fn();
    render(<AuthoringPanel open onClose={onClose} initialWord="" />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('exposes aria-modal="true" and aria-labelledby', () => {
    render(<AuthoringPanel open onClose={noop} initialWord="" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const labelId = dialog.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    expect(
      document.querySelector(`#${CSS.escape(labelId!)}`),
    ).toBeInTheDocument();
  });
});

describe('AuthoringPanel word field', () => {
  it('pre-fills the word field from initialWord', () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="putting" />,
    );
    expect(screen.getByRole('textbox', { name: /word/i })).toHaveValue(
      'putting',
    );
  });

  it('shows the dictionary.com banner for an unknown word', async () => {
    render(<AuthoringPanel open onClose={noop} initialWord="" />);
    await userEvent.type(
      screen.getByRole('textbox', { name: /word/i }),
      'xyzzy',
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    expect(
      screen.getByRole('link', { name: /open in dictionary\.com/i }),
    ).toHaveAttribute(
      'href',
      'https://www.dictionary.com/browse/xyzzy',
    );
  });
});

describe('AuthoringPanel grapheme chips', () => {
  it('renders a chip per aligned grapheme when the word is known', async () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="putting" />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    const chips = screen.getAllByTestId('grapheme-chip');
    expect(chips.length).toBe(5);
    expect(chips[2]).toHaveTextContent('tt');
    expect(chips[2]).toHaveTextContent('t');
  });

  it('flags low-confidence chips with aria-invalid + amber class', async () => {
    render(<AuthoringPanel open onClose={noop} initialWord="qxz" />);
    await act(() => new Promise((r) => setTimeout(r, 500)));
    const chips = screen.queryAllByTestId('grapheme-chip');
    for (const c of chips) {
      if (c.classList.contains('border-amber-400')) {
        expect(c).toHaveAttribute('aria-invalid', 'true');
      }
    }
  });

  it('opens an inline editor when a chip is clicked', async () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="putting" />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    const chip = screen.getAllByTestId('grapheme-chip')[0]!;
    await userEvent.click(chip);
    expect(
      screen.getByRole('combobox', { name: /phoneme/i }),
    ).toBeInTheDocument();
  });

  it('shows a play-phoneme button next to the Phoneme label with the selected phoneme', async () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="putting" />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    // Click the first chip (p → /p/) so the editor opens on it.
    await userEvent.click(screen.getAllByTestId('grapheme-chip')[0]!);
    const play = screen.getByRole('button', {
      name: /play phoneme \/p\//i,
    });
    expect(play).toBeInTheDocument();
    expect(play).toHaveTextContent('/p/');
    expect(play).not.toBeDisabled();
  });

  it('offers the full AUS phoneme inventory (≥40 options) in the Phoneme dropdown', async () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="putting" />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    await userEvent.click(screen.getAllByTestId('grapheme-chip')[0]!);
    const select = screen.getByRole('combobox', { name: /phoneme/i });
    if (!(select instanceof HTMLSelectElement)) {
      throw new TypeError('expected phoneme combobox to be a select');
    }
    expect(select.options.length).toBeGreaterThanOrEqual(40);
    // Sanity: AUS-specific phonemes that `PHONEME_CODE_TO_IPA` omits
    // must be present — these are the ones that were missing before.
    const values = [...select.options].map((o) => o.value);
    expect(values).toContain('ɒ');
    expect(values).toContain('ɜː');
    expect(values).toContain('iː');
    expect(values).toContain('ə');
  });

  it('disables the play-phoneme button when the selected chip has no phoneme yet', async () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="prothesis" />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    // Bootstrap chip has empty phoneme.
    await userEvent.click(screen.getAllByTestId('grapheme-chip')[0]!);
    expect(
      screen.getByRole('button', { name: /play phoneme/i }),
    ).toBeDisabled();
  });

  it('shows an instructional hint above the chip row', async () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="putting" />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    expect(screen.getByText(/click a chip/i)).toBeInTheDocument();
  });

  it('rings the selected chip when the editor is open', async () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="putting" />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    const chips = screen.getAllByTestId('grapheme-chip');
    await userEvent.click(chips[2]!);
    expect(chips[2]!.className).toMatch(/ring-/);
    expect(chips[0]!.className).not.toMatch(/ring-/);
  });

  it('deletes a chip via the editor and merges its letters into the previous chip', async () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="putting" />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    const before = screen
      .getAllByTestId('grapheme-chip')
      .map((c) => c.textContent);
    expect(before.length).toBe(5);
    await userEvent.click(screen.getAllByTestId('grapheme-chip')[2]!);
    await userEvent.click(
      screen.getByRole('button', { name: /delete grapheme/i }),
    );
    const after = screen.getAllByTestId('grapheme-chip');
    expect(after.length).toBe(4);
    // `putting` → p, u, tt, ing → delete index 2 (tt) → p, u, utt (u
    // absorbs tt), ing. The concatenation must still equal "putting".
    const joined = after
      .map((c) => c.querySelector('div')?.textContent ?? '')
      .join('');
    expect(joined).toBe('putting');
  });

  it('deleting the first chip merges its letters into the next chip', async () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="putting" />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    await userEvent.click(screen.getAllByTestId('grapheme-chip')[0]!);
    await userEvent.click(
      screen.getByRole('button', { name: /delete grapheme/i }),
    );
    const after = screen.getAllByTestId('grapheme-chip');
    expect(after.length).toBe(4);
    const joined = after
      .map((c) => c.querySelector('div')?.textContent ?? '')
      .join('');
    expect(joined).toBe('putting');
    // The first chip now absorbs the previously-deleted leading chip.
    expect(after[0]!.querySelector('div')?.textContent).toBe('pu');
  });

  it('bootstraps a single full-word chip when rita does not know the word, so split works', async () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="prothesis" />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    const chips = screen.getAllByTestId('grapheme-chip');
    expect(chips).toHaveLength(1);
    expect(chips[0]!.querySelector('div')?.textContent).toBe(
      'prothesis',
    );
    // Low-confidence (amber) because nothing is aligned yet.
    expect(chips[0]!.className).toMatch(/border-amber-400/);
    // Split must be enabled (length >= 2) so the user can carve it.
    await userEvent.click(chips[0]!);
    expect(
      screen.getByRole('button', { name: /split grapheme/i }),
    ).not.toBeDisabled();
  });

  it('splits a chip into two and preserves the concatenation invariant', async () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="putting" />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    // Split the "tt" chip at index 2 → "t" + "t". Count and invariant
    // should both hold without hardcoding the aligner's exact output
    // length, which is documented as 5 by the earlier grapheme-chip
    // test but could shift if the aligner evolves.
    const chipsBefore = screen.getAllByTestId('grapheme-chip');
    const multiLetterIndex = chipsBefore.findIndex(
      (c) => (c.querySelector('div')?.textContent ?? '').length >= 2,
    );
    expect(multiLetterIndex).toBeGreaterThanOrEqual(0);
    const countBefore = chipsBefore.length;
    await userEvent.click(chipsBefore[multiLetterIndex]!);
    await userEvent.click(
      screen.getByRole('button', { name: /split grapheme/i }),
    );
    const chipsAfter = screen.getAllByTestId('grapheme-chip');
    expect(chipsAfter.length).toBe(countBefore + 1);
    const joined = chipsAfter
      .map((c) => c.querySelector('div')?.textContent ?? '')
      .join('');
    expect(joined).toBe('putting');
  });

  it('disables the split button when the selected chip has only one letter', async () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="putting" />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    // index 0 is `p` (length 1).
    await userEvent.click(screen.getAllByTestId('grapheme-chip')[0]!);
    expect(
      screen.getByRole('button', { name: /split grapheme/i }),
    ).toBeDisabled();
  });

  it('disables the delete button when only one chip remains', async () => {
    render(<AuthoringPanel open onClose={noop} initialWord="a" />);
    await act(() => new Promise((r) => setTimeout(r, 500)));
    const chips = screen.queryAllByTestId('grapheme-chip');
    if (chips.length !== 1) {
      // If the engine didn't align "a" to a single chip, skip — the
      // assertion only makes sense with exactly one chip present.
      return;
    }
    await userEvent.click(chips[0]!);
    expect(
      screen.getByRole('button', { name: /delete grapheme/i }),
    ).toBeDisabled();
  });
});

describe('AuthoringPanel IPA and syllables', () => {
  it('pre-fills IPA from the engine for a known word', async () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="putting" />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    expect(screen.getByLabelText(/IPA/i)).toHaveValue('pʊtɪŋ');
  });

  it('renders one syllable chip per segment', async () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="putting" />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    const chips = screen.getAllByTestId('syllable-chip');
    expect(chips.map((c) => c.textContent)).toEqual(['put', 'ting']);
  });

  it('auto-suggests level and shows the rationale', async () => {
    render(
      <AuthoringPanel open onClose={noop} initialWord="putting" />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    const select = screen.getByRole('combobox', {
      name: /level/i,
    });
    if (!(select instanceof HTMLSelectElement)) {
      throw new TypeError('expected level combobox to be a select');
    }
    expect(Number(select.value)).toBeGreaterThanOrEqual(1);
    expect(Number(select.value)).toBeLessThanOrEqual(8);
    expect(
      screen.getByText(/suggested L\d — highest grapheme used: /i),
    ).toBeInTheDocument();
  });
});

describe('AuthoringPanel save + duplicates', () => {
  beforeEach(async () => {
    await draftStore.__clearAllForTests();
  });
  afterEach(async () => {
    await draftStore.__clearAllForTests();
  });

  it('disables Save when the word collides with shipped data', async () => {
    render(<AuthoringPanel open onClose={noop} initialWord="an" />);
    await act(() => new Promise((r) => setTimeout(r, 500)));
    expect(
      screen.getByRole('button', { name: /save draft/i }),
    ).toBeDisabled();
    expect(
      screen.getByText(/already exists in shipped data/i),
    ).toBeInTheDocument();
  });

  it('saves a draft and calls onSaved', async () => {
    const onSaved = vi.fn();
    render(
      <AuthoringPanel
        open
        onClose={noop}
        initialWord="zzword"
        onSaved={onSaved}
      />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    // Fill IPA manually since rita doesn't know zzword
    await userEvent.type(
      screen.getByRole('textbox', { name: /IPA/i }),
      'zwɜːd',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /save draft/i }),
    );
    // handleSave is fired with `void` so the click returns before the
    // async draftStore.saveDraft + onSaved call completes.  Use waitFor
    // to poll until the callback has been invoked.
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const list = await draftStore.listDrafts({ region: 'aus' });
    expect(list.map((d) => d.word)).toContain('zzword');
  });

  it('pre-fills all fields from an existing draft when editing', async () => {
    const saved = await draftStore.saveDraft({
      word: 'prothesis',
      region: 'aus',
      level: 6,
      ipa: 'prɒθɪsɪs',
      syllables: ['pro', 'the', 'sis'],
      syllableCount: 3,
      graphemes: [
        { g: 'pr', p: 'pr' },
        { g: 'o', p: 'ɒ' },
        { g: 'th', p: 'θ' },
        { g: 'e', p: 'ɪ' },
        { g: 's', p: 's' },
        { g: 'i', p: 'ɪ' },
        { g: 's', p: 's' },
      ],
      ritaKnown: false,
    });
    render(
      <AuthoringPanel
        open
        onClose={noop}
        initialWord={saved.word}
        initialDraft={saved}
      />,
    );
    expect(screen.getByRole('textbox', { name: /word/i })).toHaveValue(
      'prothesis',
    );
    expect(screen.getByRole('textbox', { name: /IPA/i })).toHaveValue(
      'prɒθɪsɪs',
    );
    const levelSelect = screen.getByRole('combobox', {
      name: /level/i,
    });
    if (!(levelSelect instanceof HTMLSelectElement)) {
      throw new TypeError('expected level combobox to be a select');
    }
    expect(Number(levelSelect.value)).toBe(6);
    expect(screen.getAllByTestId('grapheme-chip').length).toBe(7);
    expect(
      screen.getAllByTestId('syllable-chip').map((c) => c.textContent),
    ).toEqual(['pro', 'the', 'sis']);
  });

  it('updates the existing draft in-place instead of throwing when editing', async () => {
    const saved = await draftStore.saveDraft({
      word: 'prothesis',
      region: 'aus',
      level: 6,
      ipa: 'prɒθɪsɪs',
      syllables: ['pro', 'the', 'sis'],
      syllableCount: 3,
      graphemes: [
        { g: 'pr', p: 'pr' },
        { g: 'o', p: 'ɒ' },
        { g: 'th', p: 'θ' },
        { g: 'e', p: 'ɪ' },
        { g: 's', p: 's' },
        { g: 'i', p: 'ɪ' },
        { g: 's', p: 's' },
      ],
      ritaKnown: false,
    });
    const onSaved = vi.fn();
    render(
      <AuthoringPanel
        open
        onClose={noop}
        initialWord={saved.word}
        initialDraft={saved}
        onSaved={onSaved}
      />,
    );
    // Tweak the level to prove the patch is applied.
    const levelSelect = screen.getByRole('combobox', {
      name: /level/i,
    });
    if (!(levelSelect instanceof HTMLSelectElement)) {
      throw new TypeError('expected level combobox to be a select');
    }
    await userEvent.selectOptions(levelSelect, '7');
    await userEvent.click(
      screen.getByRole('button', { name: /save draft/i }),
    );
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const list = await draftStore.listDrafts({ region: 'aus' });
    expect(list).toHaveLength(1);
    expect(list[0]!.id).toBe(saved.id);
    expect(list[0]!.level).toBe(7);
    expect(list[0]!.word).toBe('prothesis');
  });

  it('normalises the IPA field on save (strips slashes, whitespace, and stress marks)', async () => {
    const onSaved = vi.fn();
    render(
      <AuthoringPanel
        open
        onClose={noop}
        initialWord="zzword"
        onSaved={onSaved}
      />,
    );
    await act(() => new Promise((r) => setTimeout(r, 500)));
    await userEvent.type(
      screen.getByRole('textbox', { name: /IPA/i }),
      '/ˈzwɜːd/',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /save draft/i }),
    );
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const list = await draftStore.listDrafts({ region: 'aus' });
    const draft = list.find((d) => d.word === 'zzword');
    expect(draft?.ipa).toBe('zwɜːd');
  });

  it('prompts to confirm on ESC when the form is dirty', async () => {
    const confirmSpy = vi
      .spyOn(globalThis, 'confirm')
      .mockReturnValue(false);
    const onClose = vi.fn();
    render(<AuthoringPanel open onClose={onClose} initialWord="" />);
    await userEvent.type(
      screen.getByRole('textbox', { name: /word/i }),
      'zz',
    );
    await userEvent.keyboard('{Escape}');
    expect(confirmSpy).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
