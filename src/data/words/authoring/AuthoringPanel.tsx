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
import { PHONEME_CODE_TO_IPA } from '../phoneme-codes';
import { align } from './aligner';
import { draftStore } from './draftStore';
import { generateBreakdown } from './engine';
import { normalizeIpa } from './ipa';
import type { AlignedGrapheme } from './aligner';
import type { Breakdown } from './engine';
import type { DraftEntry, DraftLevel } from '../types';

const BASE_PHONEME_IPA_OPTIONS = [
  ...new Set(Object.values(PHONEME_CODE_TO_IPA)),
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

const seedFromDraft = (draft: DraftEntry): AlignedGrapheme[] =>
  draft.graphemes.map((g) => ({ ...g, confidence: 1 }));

const useDebouncedBreakdown = (
  word: string,
  seed: DraftEntry | undefined,
): {
  breakdown: Breakdown | null;
  chips: AlignedGrapheme[];
  setChips: SetChips;
  ipa: string;
  setIpa: (value: string) => void;
  level: DraftLevel;
  setLevel: (value: DraftLevel) => void;
  loading: boolean;
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
  const [ipa, setIpa] = useState(seed?.ipa ?? '');
  const [level, setLevel] = useState<DraftLevel>(seed?.level ?? 1);
  const [loading, setLoading] = useState(false);
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
          const aligned =
            b.ritaKnown && b.phonemes.length > 0
              ? align(b.word, b.phonemes)
              : [];
          setBreakdown(b);
          setChips(aligned);
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
  }, [word]);

  return {
    breakdown,
    chips,
    setChips,
    ipa,
    setIpa: setIpaUser,
    level,
    setLevel,
    loading,
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
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [word, setWord] = useState(initialDraft?.word ?? initialWord);
  const { breakdown, chips, setChips, ipa, setIpa, level, setLevel } =
    useDebouncedBreakdown(word, initialDraft);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
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

  const syllables = breakdown?.syllables ?? [];
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

  const extendChip = (i: number) => {
    setChips((prev) => {
      const next = [...prev];
      const current = next[i];
      if (!current) return prev;
      const nextChip = next[i + 1];
      if (!nextChip || nextChip.g.length < 2) return prev;
      next[i] = { ...current, g: current.g + nextChip.g[0]! };
      next[i + 1] = { ...nextChip, g: nextChip.g.slice(1) };
      return next;
    });
    setDirty(true);
  };

  const shrinkChip = (i: number) => {
    setChips((prev) => {
      const next = [...prev];
      const current = next[i];
      if (!current || current.g.length < 2) return prev;
      const nextChip = next[i + 1];
      if (!nextChip) return prev;
      const moved = current.g.slice(-1);
      next[i] = { ...current, g: current.g.slice(0, -1) };
      next[i + 1] = { ...nextChip, g: moved + nextChip.g };
      return next;
    });
    setDirty(true);
  };

  const handleSave = useCallback(async () => {
    const trimmed = word.trim().toLowerCase();
    const variants = variantsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const saveSyllables = breakdown?.syllables ?? [trimmed];
    const graphemes = chips.map(({ confidence: _c, ...rest }) => rest);
    const cleanIpa = normalizeIpa(ipa);
    setSaving(true);
    try {
      await (initialDraft
        ? draftStore.updateDraft(initialDraft.id, {
            level,
            ipa: cleanIpa,
            syllables: saveSyllables,
            syllableCount: saveSyllables.length,
            graphemes,
            variants: variants.length > 0 ? variants : undefined,
            ritaKnown: breakdown?.ritaKnown ?? initialDraft.ritaKnown,
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
            ritaKnown: breakdown?.ritaKnown ?? false,
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
              onChange={(e) => {
                setWord(e.target.value);
                setEditingIndex(null);
                setDirty(true);
              }}
              className="rounded border px-3 py-2"
            />
          </div>
          {breakdown && !breakdown.ritaKnown && word.trim() && (
            <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
              RitaJS doesn&apos;t know <strong>{word.trim()}</strong>.
              Look it up →{' '}
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
            <div className="flex flex-wrap gap-2">
              {chips.map((chip, i) => (
                <button
                  // eslint-disable-next-line react/no-array-index-key -- chips re-derive wholesale from align() per word; positional key is stable enough
                  key={`${i}-${chip.g}`}
                  type="button"
                  data-testid="grapheme-chip"
                  aria-invalid={
                    chip.confidence < 0.5 ? 'true' : undefined
                  }
                  className={`rounded border px-2 py-1 text-sm ${
                    chip.confidence < 0.5
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-slate-300 bg-white'
                  }`}
                  onClick={() => setEditingIndex(i)}
                >
                  <div className="font-semibold">{chip.g}</div>
                  <div className="text-xs text-slate-500">
                    /{chip.p}/
                  </div>
                </button>
              ))}
            </div>
          )}
          {editingIndex !== null && chips[editingIndex] && (
            <div className="rounded border border-slate-300 bg-slate-50 p-3">
              <label className="flex flex-col gap-1 text-sm">
                Phoneme
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
              <div className="mt-2 flex gap-1">
                <button
                  type="button"
                  aria-label="Shrink grapheme"
                  disabled={
                    chips[editingIndex].g.length < 2 ||
                    !chips[editingIndex + 1]
                  }
                  onClick={() => shrinkChip(editingIndex)}
                  className="rounded border px-2 py-1 text-sm disabled:opacity-50"
                >
                  −
                </button>
                <button
                  type="button"
                  aria-label="Extend grapheme"
                  disabled={
                    !chips[editingIndex + 1] ||
                    (chips[editingIndex + 1]?.g.length ?? 0) < 2
                  }
                  onClick={() => extendChip(editingIndex)}
                  className="rounded border px-2 py-1 text-sm disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>
          )}
          <label className="flex flex-col gap-1 text-sm font-medium">
            IPA
            <input
              type="text"
              value={ipa}
              onChange={(e) => {
                setIpa(e.target.value);
                setDirty(true);
              }}
              className="rounded border px-3 py-2"
            />
          </label>
          {syllables.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {syllables.map((s, i) => (
                <span
                  // eslint-disable-next-line react/no-array-index-key -- syllables re-derive from the breakdown per word; positional key is fine
                  key={`${i}-${s}`}
                  data-testid="syllable-chip"
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                >
                  {s}
                </span>
              ))}
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
          {shippedSet.has(word.trim().toLowerCase()) && (
            <p className="text-xs text-rose-600">
              &quot;{word.trim()}&quot; already exists in shipped data —
              open that entry instead.
            </p>
          )}
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
                shippedSet.has(word.trim().toLowerCase())
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
