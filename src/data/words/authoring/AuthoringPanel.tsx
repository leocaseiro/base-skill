import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { loadShippedIndex } from '../filter';
import { GRAPHEMES_BY_LEVEL } from '../levels';
import { playPhoneme } from '../phoneme-audio';
import { PHONEME_CODE_TO_IPA } from '../phoneme-codes';
import { align, flattenAlignedChips } from './aligner';
import { draftStore } from './draftStore';
import { generateBreakdown } from './engine';
import { normalizeIpa, tokenizeIpa } from './ipa';
import type { AlignedGrapheme } from './aligner';
import type { Breakdown } from './engine';
import type { DraftEntry, DraftLevel } from '../types';

// Full AUS phoneme inventory. Primary source is the 44-unit teaching
// set in `GRAPHEMES_BY_LEVEL`; we union with `PHONEME_CODE_TO_IPA`
// values to pick up standalone symbols the curriculum only teaches
// inside diphthongs (notably `ə` — shipped curriculum has `eə`,
// `ɛə`, `ɪə` but no bare schwa). Previously this list was just
// `PHONEME_CODE_TO_IPA`'s 9 entries, which capped the dropdown at 9.
const BASE_PHONEME_IPA_OPTIONS = [
  ...new Set([
    ...Object.values(GRAPHEMES_BY_LEVEL).flatMap((units) =>
      units.map((u) => u.p),
    ),
    ...Object.values(PHONEME_CODE_TO_IPA),
  ]),
].toSorted();

const suggestLevel = (
  chips: AlignedGrapheme[],
): { level: DraftLevel; reason: string } => {
  let best: { level: DraftLevel; grapheme: string } = {
    level: 1,
    grapheme: chips[0]?.g ?? '',
  };
  for (const chip of chips) {
    for (const lvl of [1, 2, 3, 4, 5, 6, 7, 8] as const) {
      const hit = (GRAPHEMES_BY_LEVEL[lvl] ?? []).find(
        (u) => u.g === chip.g,
      );
      if (hit && lvl > best.level)
        best = { level: lvl, grapheme: chip.g };
    }
  }
  return { level: best.level, reason: best.grapheme };
};

export interface AuthoringPanelProps {
  open: boolean;
  onClose: () => void;
  initialWord: string;
  /**
   * When set, the panel opens in edit mode: the form is pre-filled
   * from the draft and Save routes through `draftStore.updateDraft`
   * instead of `saveDraft` (which would throw on the existing row).
   */
  initialDraft?: DraftEntry;
  onSaved?: () => void;
}

const DEBOUNCE_MS = 400;

type SetChips = (
  value:
    | AlignedGrapheme[]
    | ((prev: AlignedGrapheme[]) => AlignedGrapheme[]),
) => void;

type SetSyllables = (
  value: string[] | ((prev: string[]) => string[]),
) => void;

const seedFromDraft = (draft: DraftEntry): AlignedGrapheme[] =>
  draft.graphemes.map((g) => ({ ...g, confidence: 1 }));

const useDebouncedBreakdown = (
  word: string,
  seed: DraftEntry | undefined,
): {
  breakdown: Breakdown | null;
  chips: AlignedGrapheme[];
  setChips: SetChips;
  syllables: string[];
  setSyllables: SetSyllables;
  ipa: string;
  setIpa: (value: string) => void;
  level: DraftLevel;
  setLevel: (value: DraftLevel) => void;
  loading: boolean;
  regenerate: () => void;
} => {
  const [breakdown, setBreakdown] = useState<Breakdown | null>(
    seed
      ? {
          word: seed.word,
          ipa: seed.ipa,
          syllables: seed.syllables,
          phonemes: seed.graphemes.map((g) => g.p),
          ritaKnown: seed.ritaKnown,
        }
      : null,
  );
  const [chips, setChips] = useState<AlignedGrapheme[]>(
    seed ? seedFromDraft(seed) : [],
  );
  const [syllables, setSyllables] = useState<string[]>(
    seed ? seed.syllables : [],
  );
  const [ipa, setIpa] = useState(seed?.ipa ?? '');
  const [level, setLevel] = useState<DraftLevel>(seed?.level ?? 1);
  const [loading, setLoading] = useState(false);
  // Bumped by `regenerate()` to re-trigger the breakdown effect for
  // the same word — used by the "Re-generate from RitaJS" button so
  // the user can rebuild chips/IPA/syllables/level from the engine
  // after manually editing the form.
  const [regenVersion, setRegenVersion] = useState(0);
  // Tracks whether the user has manually edited the IPA field for the
  // current word.  When true, the async breakdown result must not
  // overwrite the user's input.  Reset to false whenever `word` changes
  // so that auto-fill works again for the new word.
  const ipaEditedRef = useRef(false);
  // Skip the first breakdown effect when we opened from an existing
  // draft — the seed is the authoritative state, and letting rita
  // re-run would wipe the user's saved chips/IPA/level on mount.
  // Subsequent word edits in the input still trigger re-derivation.
  const skipNextRef = useRef(seed !== undefined);

  const setIpaUser = useCallback((value: string) => {
    ipaEditedRef.current = true;
    setIpa(value);
  }, []);

  const regenerate = useCallback(() => {
    // Force a re-run of the breakdown effect even when `word` hasn't
    // changed. Also flip skipNextRef false so a seeded mount that
    // immediately gets a Re-generate click still calls the engine.
    skipNextRef.current = false;
    setRegenVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (skipNextRef.current) {
      skipNextRef.current = false;
      return;
    }
    const trimmed = word.trim();
    ipaEditedRef.current = false; // new word — allow auto-fill again
    if (!trimmed) {
      setBreakdown(null);
      setChips([]);
      setSyllables([]);
      setIpa('');
      setLevel(1);
      return;
    }
    let ignore = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const b = await generateBreakdown(trimmed);
        if (!ignore) {
          // Align whenever we have phonemes — even when ritaKnown is
          // false, the LTS guess in `b.phonemes` is strictly more
          // useful than no alignment. Low-confidence chips surface
          // the "please double-check" signal through the amber
          // styling (already applied by the aligner).
          // Flatten split-digraphs (e.g. `a_e` in "cake") into their
          // literal letters + a silent-e chip so every chip is a
          // contiguous substring of the word. The aligner otherwise
          // hides the trailing silent letter inside the digraph
          // chip's span, which broke Split/Delete/Extend/Shrink and
          // was visually confusing (e.g. "prothesis" showed no `e`).
          const aligned =
            b.phonemes.length > 0
              ? flattenAlignedChips(b.word, align(b.word, b.phonemes))
              : [];
          // Only seed a single bootstrap chip when we have literally
          // nothing (e.g. analyze threw, or the word was empty) —
          // the user can still split it from there.
          const chipsToSet =
            aligned.length === 0 && b.word.length > 0
              ? [{ g: b.word, p: '', confidence: 0.2 }]
              : aligned;
          // Same bootstrap rule for syllables: if the engine
          // returned none but the word has text, seed a single
          // full-word syllable the user can split down.
          const syllablesToSet =
            b.syllables.length === 0 && b.word.length > 0
              ? [b.word]
              : b.syllables;
          setBreakdown(b);
          setChips(chipsToSet);
          setSyllables(syllablesToSet);
          // Only auto-fill IPA from the breakdown if the user has not
          // manually edited the field for this word yet.
          if (!ipaEditedRef.current) {
            setIpa(b.ipa);
          }
          setLevel(
            aligned.length > 0 ? suggestLevel(aligned).level : 1,
          );
        }
      } catch (error) {
        // Surface engine failures (e.g. rita missing/renamed methods,
        // lexicon fetch errors) to devtools instead of swallowing them.
        console.error('[authoring] generateBreakdown failed:', error);
      } finally {
        if (!ignore) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [word, regenVersion]);

  return {
    breakdown,
    chips,
    setChips,
    syllables,
    setSyllables,
    ipa,
    setIpa: setIpaUser,
    level,
    setLevel,
    loading,
    regenerate,
  };
};

export const AuthoringPanel = ({
  open,
  onClose,
  initialWord,
  initialDraft,
  onSaved,
}: AuthoringPanelProps) => {
  const titleId = useId();
  const wordInputId = useId();
  const ipaInputId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [word, setWord] = useState(initialDraft?.word ?? initialWord);
  const {
    breakdown,
    chips,
    setChips,
    syllables,
    setSyllables,
    ipa,
    setIpa,
    level,
    setLevel,
    regenerate,
  } = useDebouncedBreakdown(word, initialDraft);
  // Edit mode locks the Word input from the start because changing
  // the word would require a delete + re-save (the draftStore uses
  // `[region+word]` as a unique key). In new-word mode the user can
  // freely type until the first non-empty blur, after which we lock
  // and offer the "Re-generate from RitaJS" button instead.
  const [wordCommitted, setWordCommitted] = useState(
    initialDraft !== undefined,
  );

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingSyllableIndex, setEditingSyllableIndex] = useState<
    number | null
  >(null);
  const [variantsInput, setVariantsInput] = useState(
    initialDraft?.variants?.join(', ') ?? '',
  );
  const [shippedSet, setShippedSet] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let ignore = false;
    void loadShippedIndex('aus').then((set) => {
      if (!ignore) setShippedSet(set);
    });
    return () => {
      ignore = true;
    };
  }, [open]);

  const suggestion = chips.length > 0 ? suggestLevel(chips) : null;

  const phonemeIpaOptions = useMemo(
    () =>
      [
        ...new Set([
          ...BASE_PHONEME_IPA_OPTIONS,
          ...chips.map((c) => c.p),
        ]),
      ].toSorted(),
    [chips],
  );

  const updateChip = (i: number, patch: Partial<AlignedGrapheme>) => {
    setChips((prev) => {
      const next = [...prev];
      const existing = next[i];
      if (!existing) return prev;
      next[i] = {
        ...existing,
        ...patch,
        confidence: patch.confidence ?? existing.confidence,
      };
      return next;
    });
    setDirty(true);
  };

  // Move the first letter of chip `i` onto the end of chip `i - 1`.
  // Rebalances the boundary between two adjacent chips without
  // changing the chip count; requires a left neighbour and at least
  // two letters in the current chip (otherwise the source would be
  // emptied).
  const moveChipLetterLeft = (i: number) => {
    setChips((prev) => {
      const next = [...prev];
      const current = next[i];
      const left = next[i - 1];
      if (!current || !left || current.g.length < 2) return prev;
      next[i] = { ...current, g: current.g.slice(1) };
      next[i - 1] = { ...left, g: left.g + current.g[0]! };
      return next;
    });
    setDirty(true);
  };

  // Mirror of `moveChipLetterLeft` — move the last letter of chip
  // `i` to the start of chip `i + 1`.
  const moveChipLetterRight = (i: number) => {
    setChips((prev) => {
      const next = [...prev];
      const current = next[i];
      const right = next[i + 1];
      if (!current || !right || current.g.length < 2) return prev;
      next[i] = { ...current, g: current.g.slice(0, -1) };
      next[i + 1] = { ...right, g: current.g.slice(-1) + right.g };
      return next;
    });
    setDirty(true);
  };

  // Carve the trailing letter of chip `i` into a new chip inserted
  // at `i + 1`. This is the only way to add a chip: the invariant
  // `chips.map(c => c.g).join('') === word` means every chip's
  // letters come from the word, so "adding" really means splitting
  // an existing boundary. The new chip inherits the source chip's
  // phoneme as a placeholder (flagged low-confidence so the amber
  // treatment cues the user to re-check it).
  const splitChip = (i: number) => {
    setChips((prev) => {
      const next = [...prev];
      const current = next[i];
      if (!current || current.g.length < 2) return prev;
      const head = current.g.slice(0, -1);
      const tail = current.g.slice(-1);
      next[i] = { ...current, g: head };
      next.splice(i + 1, 0, {
        g: tail,
        p: current.p,
        confidence: 0.4,
      });
      return next;
    });
    setEditingIndex(i + 1);
    setDirty(true);
  };

  // Remove chip `i` and append its letters to the previous chip.
  // Refuses on the first chip (no left neighbour) or when it's the
  // only chip.
  const joinChipLeft = (i: number) => {
    setChips((prev) => {
      if (prev.length <= 1 || i === 0) return prev;
      const next = [...prev];
      const [removed] = next.splice(i, 1);
      const left = next[i - 1];
      if (!removed || !left) return prev;
      next[i - 1] = { ...left, g: left.g + removed.g };
      return next;
    });
    setEditingIndex(null);
    setDirty(true);
  };

  // Mirror of `joinChipLeft` — prepend current chip's letters onto
  // the next chip and remove the current one.
  const joinChipRight = (i: number) => {
    setChips((prev) => {
      if (prev.length <= 1 || i === prev.length - 1) return prev;
      const next = [...prev];
      const [removed] = next.splice(i, 1);
      const right = next[i];
      if (!removed || !right) return prev;
      next[i] = { ...right, g: removed.g + right.g };
      return next;
    });
    setEditingIndex(null);
    setDirty(true);
  };

  // Re-runs the chip aligner using the phonemes tokenised from the
  // current IPA field, then flattens split-digraphs. Lets a user
  // paste a canonical transcription (e.g. copied from a dictionary)
  // and have every chip's phoneme updated in one click rather than
  // picking each one from the dropdown. Falls back to no-op when
  // the IPA can't be tokenised against the known inventory.
  const applyIpaToChips = () => {
    const cleanIpa = normalizeIpa(ipa);
    if (!cleanIpa) return;
    const phonemes = tokenizeIpa(cleanIpa, BASE_PHONEME_IPA_OPTIONS);
    if (phonemes.length === 0) return;
    const trimmedWord = word.trim().toLowerCase();
    if (!trimmedWord) return;
    const aligned = flattenAlignedChips(
      trimmedWord,
      align(trimmedWord, phonemes),
    );
    if (aligned.length === 0) return;
    setChips(aligned);
    setEditingIndex(null);
    setDirty(true);
  };

  // Split syllable `i` at the last letter, inserting a new syllable
  // at `i + 1`. Preserves `syllables.join('') === word`. Disabled
  // when the syllable has a single letter.
  const splitSyllable = (i: number) => {
    setSyllables((prev) => {
      const next = [...prev];
      const current = next[i];
      if (current === undefined || current.length < 2) return prev;
      next[i] = current.slice(0, -1);
      next.splice(i + 1, 0, current.slice(-1));
      return next;
    });
    setEditingSyllableIndex(i + 1);
    setDirty(true);
  };

  // Mirror of the chip letter-move helpers for syllables: rebalance
  // the boundary without changing the syllable count.
  const moveSyllableLetterLeft = (i: number) => {
    setSyllables((prev) => {
      const next = [...prev];
      const current = next[i];
      const left = next[i - 1];
      if (
        current === undefined ||
        left === undefined ||
        current.length < 2
      )
        return prev;
      next[i] = current.slice(1);
      next[i - 1] = left + current[0]!;
      return next;
    });
    setDirty(true);
  };

  const moveSyllableLetterRight = (i: number) => {
    setSyllables((prev) => {
      const next = [...prev];
      const current = next[i];
      const right = next[i + 1];
      if (
        current === undefined ||
        right === undefined ||
        current.length < 2
      )
        return prev;
      next[i] = current.slice(0, -1);
      next[i + 1] = current.slice(-1) + right;
      return next;
    });
    setDirty(true);
  };

  // Join syllable `i` into the previous one (current disappears,
  // letters append). Refuses on index 0 or when only one remains.
  const joinSyllableLeft = (i: number) => {
    setSyllables((prev) => {
      if (prev.length <= 1 || i === 0) return prev;
      const next = [...prev];
      const [removed] = next.splice(i, 1);
      const left = next[i - 1];
      if (removed === undefined || left === undefined) return prev;
      next[i - 1] = left + removed;
      return next;
    });
    setEditingSyllableIndex(null);
    setDirty(true);
  };

  // Mirror of `joinSyllableLeft` — prepend current letters onto the
  // next syllable.
  const joinSyllableRight = (i: number) => {
    setSyllables((prev) => {
      if (prev.length <= 1 || i === prev.length - 1) return prev;
      const next = [...prev];
      const [removed] = next.splice(i, 1);
      const right = next[i];
      if (removed === undefined || right === undefined) return prev;
      next[i] = removed + right;
      return next;
    });
    setEditingSyllableIndex(null);
    setDirty(true);
  };

  const handleSave = useCallback(async () => {
    const trimmed = word.trim().toLowerCase();
    const variants = variantsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const saveSyllables = syllables.length > 0 ? syllables : [trimmed];
    const graphemes = chips.map(({ confidence: _c, ...rest }) => rest);
    const cleanIpa = normalizeIpa(ipa);
    setSaving(true);
    try {
      // `initialDraft.id === ''` is the "shipped override" seed — the
      // panel was opened with a DraftEntry shape synthesised from a
      // shipped WordHit, and we want to create a fresh draft that
      // shadows the shipped entry.
      const hasExistingDraft = Boolean(initialDraft?.id);
      await (hasExistingDraft
        ? draftStore.updateDraft(initialDraft!.id, {
            level,
            ipa: cleanIpa,
            syllables: saveSyllables,
            syllableCount: saveSyllables.length,
            graphemes,
            variants: variants.length > 0 ? variants : undefined,
            ritaKnown: breakdown?.ritaKnown ?? initialDraft!.ritaKnown,
          })
        : draftStore.saveDraft({
            word: trimmed,
            region: 'aus',
            level,
            ipa: cleanIpa,
            syllables: saveSyllables,
            syllableCount: saveSyllables.length,
            graphemes,
            ...(variants.length > 0 ? { variants } : {}),
            ritaKnown:
              breakdown?.ritaKnown ?? initialDraft?.ritaKnown ?? false,
          }));
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  }, [
    word,
    variantsInput,
    level,
    ipa,
    breakdown,
    chips,
    syllables,
    initialDraft,
    onSaved,
    onClose,
  ]);

  const closeWithConfirm = useCallback(() => {
    if (dirty && !globalThis.confirm('Discard this draft?')) return;
    onClose();
  }, [dirty, onClose]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeWithConfirm();
    },
    [closeWithConfirm],
  );

  useEffect(() => {
    if (!open) return;
    globalThis.addEventListener('keydown', handleKey);
    return () => globalThis.removeEventListener('keydown', handleKey);
  }, [open, handleKey]);

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
      inputRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-0 md:p-6"
    >
      <div className="flex h-full w-full flex-col bg-white p-6 md:h-auto md:max-w-2xl md:rounded-xl md:shadow-2xl">
        <h2 id={titleId} className="text-xl font-semibold">
          Make up a word
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Authoring <strong>{initialWord || '(new word)'}</strong>.
          Fields below populate as you type.
        </p>
        <div className="mt-4 flex-1 space-y-4 overflow-auto">
          <div className="flex flex-col gap-1">
            <label
              htmlFor={wordInputId}
              className="text-sm font-medium"
            >
              Word
            </label>
            <input
              ref={inputRef}
              id={wordInputId}
              type="text"
              value={word}
              disabled={wordCommitted}
              onChange={(e) => {
                setWord(e.target.value);
                setEditingIndex(null);
                setDirty(true);
              }}
              onBlur={() => {
                if (word.trim() !== '') setWordCommitted(true);
              }}
              className="rounded border px-3 py-2 disabled:bg-slate-100 disabled:text-slate-700"
            />
            {wordCommitted && word.trim() && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      dirty &&
                      !globalThis.confirm(
                        'Re-generate from RitaJS? This will overwrite your local edits to chips, IPA, syllables, and level.',
                      )
                    )
                      return;
                    regenerate();
                  }}
                  className="rounded-md border border-input px-2 py-0.5 text-xs hover:bg-muted"
                >
                  ↻ Re-generate from RitaJS
                </button>
              </div>
            )}
            {word.trim() && (
              <div className="flex flex-wrap gap-3 text-xs text-sky-700">
                <a
                  href={`https://www.dictionary.com/browse/${encodeURIComponent(word.trim())}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`Look up ${word.trim()} on Dictionary.com`}
                  className="underline"
                >
                  Dictionary.com
                </a>
                <a
                  href={`https://www.vocabulary.com/dictionary/${encodeURIComponent(word.trim())}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`Look up ${word.trim()} on Vocabulary.com`}
                  className="underline"
                >
                  Vocabulary.com
                </a>
                <a
                  href={`https://www.howmanysyllables.com/syllables/${encodeURIComponent(word.trim())}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`Look up ${word.trim()} on HowManySyllables.com`}
                  className="underline"
                >
                  HowManySyllables.com
                </a>
              </div>
            )}
          </div>
          {breakdown && !breakdown.ritaKnown && word.trim() && (
            <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
              <strong>{word.trim()}</strong> isn&apos;t in RitaJS&apos;s
              dictionary — the phonemes and syllables below are
              letter-to-sound guesses. Please confirm in a dictionary
              before saving →{' '}
              <a
                href={`https://www.dictionary.com/browse/${encodeURIComponent(word.trim())}`}
                target="_blank"
                rel="noreferrer noopener"
                className="underline"
              >
                Open in dictionary.com
              </a>
            </div>
          )}
          {chips.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-slate-500">
                Click a chip to change its phoneme, move a letter to a
                neighbour, split it, or join it with a neighbour. The
                selected chip has a blue ring; amber chips are
                low-confidence guesses to double-check.
              </p>
              <div className="flex flex-wrap gap-2">
                {chips.map((chip, i) => {
                  const selected = i === editingIndex;
                  const confidenceClass =
                    chip.confidence < 0.5
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-slate-300 bg-white';
                  const selectedClass = selected
                    ? ' ring-2 ring-sky-500 ring-offset-1'
                    : '';
                  return (
                    <button
                      // eslint-disable-next-line react/no-array-index-key -- chips re-derive wholesale from align() per word; positional key is stable enough
                      key={`${i}-${chip.g}`}
                      type="button"
                      data-testid="grapheme-chip"
                      aria-invalid={
                        chip.confidence < 0.5 ? 'true' : undefined
                      }
                      aria-pressed={selected}
                      className={`rounded border px-2 py-1 text-sm ${confidenceClass}${selectedClass}`}
                      onClick={() => setEditingIndex(i)}
                    >
                      <div className="font-semibold">{chip.g}</div>
                      <div className="text-xs text-slate-500">
                        /{chip.p}/
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {editingIndex !== null && chips[editingIndex] && (
            <div className="rounded border border-slate-300 bg-slate-50 p-3">
              <label className="flex flex-col gap-1 text-sm">
                <div className="flex items-center gap-2">
                  <span>Phoneme</span>
                  <button
                    type="button"
                    aria-label={`Play phoneme /${chips[editingIndex].p}/`}
                    disabled={!chips[editingIndex].p}
                    onClick={() => {
                      void playPhoneme(chips[editingIndex]!.p);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-0.5 font-mono text-xs hover:bg-muted disabled:opacity-50"
                  >
                    🔈 /{chips[editingIndex].p}/
                  </button>
                </div>
                <select
                  aria-label="phoneme"
                  value={chips[editingIndex].p}
                  onChange={(e) =>
                    updateChip(editingIndex, { p: e.target.value })
                  }
                  className="rounded border px-2 py-1"
                >
                  {phonemeIpaOptions.map((ipaOption) => (
                    <option key={ipaOption} value={ipaOption}>
                      {ipaOption}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-2 flex flex-wrap gap-1">
                <button
                  type="button"
                  aria-label="Move letter to previous grapheme"
                  disabled={
                    editingIndex === 0 ||
                    chips[editingIndex].g.length < 2
                  }
                  onClick={() => moveChipLetterLeft(editingIndex)}
                  className="rounded border px-2 py-1 text-sm disabled:opacity-50"
                >
                  ‹ Move
                </button>
                <button
                  type="button"
                  aria-label="Join with previous grapheme"
                  disabled={editingIndex === 0 || chips.length <= 1}
                  onClick={() => joinChipLeft(editingIndex)}
                  className="rounded border px-2 py-1 text-sm disabled:opacity-50"
                >
                  « Join
                </button>
                <button
                  type="button"
                  aria-label="Split grapheme"
                  disabled={chips[editingIndex].g.length < 2}
                  onClick={() => splitChip(editingIndex)}
                  className="rounded border px-2 py-1 text-sm disabled:opacity-50"
                >
                  ✂ Split
                </button>
                <button
                  type="button"
                  aria-label="Join with next grapheme"
                  disabled={
                    editingIndex === chips.length - 1 ||
                    chips.length <= 1
                  }
                  onClick={() => joinChipRight(editingIndex)}
                  className="rounded border px-2 py-1 text-sm disabled:opacity-50"
                >
                  Join »
                </button>
                <button
                  type="button"
                  aria-label="Move letter to next grapheme"
                  disabled={
                    editingIndex === chips.length - 1 ||
                    chips[editingIndex].g.length < 2
                  }
                  onClick={() => moveChipLetterRight(editingIndex)}
                  className="rounded border px-2 py-1 text-sm disabled:opacity-50"
                >
                  Move ›
                </button>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <label htmlFor={ipaInputId}>IPA</label>
              <button
                type="button"
                aria-label="Align chips from IPA"
                disabled={!normalizeIpa(ipa) || chips.length === 0}
                onClick={applyIpaToChips}
                className="rounded-md border border-input px-2 py-0.5 text-xs font-normal hover:bg-muted disabled:opacity-50"
              >
                → Align chips
              </button>
            </div>
            <input
              id={ipaInputId}
              type="text"
              value={ipa}
              onChange={(e) => {
                setIpa(e.target.value);
                setDirty(true);
              }}
              className="rounded border px-3 py-2"
            />
          </div>
          {syllables.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-slate-500">
                Click a syllable to move a letter to a neighbour, split
                it, or join it with a neighbour.
              </p>
              <div className="flex flex-wrap gap-2">
                {syllables.map((s, i) => {
                  const selected = i === editingSyllableIndex;
                  return (
                    <button
                      // eslint-disable-next-line react/no-array-index-key -- syllables re-derive per word; positional key is stable enough
                      key={`${i}-${s}`}
                      type="button"
                      data-testid="syllable-chip"
                      aria-pressed={selected}
                      onClick={() => setEditingSyllableIndex(i)}
                      className={`rounded border border-slate-300 bg-white px-2 py-1 text-sm${
                        selected
                          ? ' ring-2 ring-sky-500 ring-offset-1'
                          : ''
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              {editingSyllableIndex !== null &&
                syllables[editingSyllableIndex] !== undefined && (
                  <div className="flex flex-wrap gap-1 rounded border border-slate-300 bg-slate-50 p-2">
                    <button
                      type="button"
                      aria-label="Move letter to previous syllable"
                      disabled={
                        editingSyllableIndex === 0 ||
                        syllables[editingSyllableIndex].length < 2
                      }
                      onClick={() =>
                        moveSyllableLetterLeft(editingSyllableIndex)
                      }
                      className="rounded border px-2 py-1 text-sm disabled:opacity-50"
                    >
                      ‹ Move
                    </button>
                    <button
                      type="button"
                      aria-label="Join with previous syllable"
                      disabled={
                        editingSyllableIndex === 0 ||
                        syllables.length <= 1
                      }
                      onClick={() =>
                        joinSyllableLeft(editingSyllableIndex)
                      }
                      className="rounded border px-2 py-1 text-sm disabled:opacity-50"
                    >
                      « Join
                    </button>
                    <button
                      type="button"
                      aria-label="Split syllable"
                      disabled={
                        syllables[editingSyllableIndex].length < 2
                      }
                      onClick={() =>
                        splitSyllable(editingSyllableIndex)
                      }
                      className="rounded border px-2 py-1 text-sm disabled:opacity-50"
                    >
                      ✂ Split
                    </button>
                    <button
                      type="button"
                      aria-label="Join with next syllable"
                      disabled={
                        editingSyllableIndex === syllables.length - 1 ||
                        syllables.length <= 1
                      }
                      onClick={() =>
                        joinSyllableRight(editingSyllableIndex)
                      }
                      className="rounded border px-2 py-1 text-sm disabled:opacity-50"
                    >
                      Join »
                    </button>
                    <button
                      type="button"
                      aria-label="Move letter to next syllable"
                      disabled={
                        editingSyllableIndex === syllables.length - 1 ||
                        syllables[editingSyllableIndex].length < 2
                      }
                      onClick={() =>
                        moveSyllableLetterRight(editingSyllableIndex)
                      }
                      className="rounded border px-2 py-1 text-sm disabled:opacity-50"
                    >
                      Move ›
                    </button>
                  </div>
                )}
            </div>
          )}
          <label className="flex flex-col gap-1 text-sm font-medium">
            Level
            <select
              value={level}
              onChange={(e) => {
                setLevel(Number(e.target.value) as DraftLevel);
                setDirty(true);
              }}
              className="rounded border px-2 py-1"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  Level {n}
                </option>
              ))}
            </select>
          </label>
          {suggestion && (
            <p className="text-xs text-slate-500">
              suggested L{suggestion.level} — highest grapheme used:{' '}
              {suggestion.reason}
            </p>
          )}
          <label className="flex flex-col gap-1 text-sm font-medium">
            Variants (optional, comma-separated)
            <input
              type="text"
              value={variantsInput}
              onChange={(e) => {
                setVariantsInput(e.target.value);
                setDirty(true);
              }}
              placeholder="e.g. putting, putts"
              className="rounded border px-3 py-2"
            />
          </label>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          {(() => {
            // Allow the collision when the user opened this panel
            // specifically to override a shipped entry — the flow
            // intentionally creates a same-word draft that shadows
            // the shipped data. The `initialDraft.id === ''` seed
            // from WordLibraryExplorer marks that intent.
            const isShippedOverride = Boolean(
              initialDraft && !initialDraft.id,
            );
            if (isShippedOverride) {
              return (
                <p className="text-xs text-amber-700">
                  Editing the shipped entry for{' '}
                  <strong>{initialDraft!.word}</strong>. Saving creates
                  a draft that shadows the shipped word — the curriculum
                  JSON isn&apos;t modified. Promote with{' '}
                  <code>yarn words:import</code>.
                </p>
              );
            }
            if (shippedSet.has(word.trim().toLowerCase())) {
              return (
                <p className="text-xs text-rose-600">
                  &quot;{word.trim()}&quot; already exists in shipped
                  data — open that entry instead.
                </p>
              );
            }
            return null;
          })()}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded px-4 py-2 text-slate-700 hover:bg-slate-100"
              onClick={closeWithConfirm}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={
                saving ||
                !word.trim() ||
                !normalizeIpa(ipa) ||
                (initialDraft === undefined &&
                  shippedSet.has(word.trim().toLowerCase()))
              }
              onClick={() => {
                void handleSave();
              }}
              className="rounded bg-sky-600 px-4 py-2 text-white disabled:opacity-50"
            >
              Save draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
