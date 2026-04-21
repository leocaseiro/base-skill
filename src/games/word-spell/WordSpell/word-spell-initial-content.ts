import type { WordSpellConfig, WordSpellRound } from '../types';

/**
 * Shape persisted into `session_history_index.initialContent` for WordSpell
 * sessions. Lives alongside the engine's placeholder `rounds` field so the
 * engine contract is unchanged while WordSpell can reconstruct its own state
 * deterministically on resume.
 */
export interface WordSpellPersistedContent {
  wordSpellRounds: WordSpellRound[];
  roundOrder: readonly number[];
  tileUnit: WordSpellConfig['tileUnit'];
  mode: WordSpellConfig['mode'];
}

export const WORD_SPELL_CONTENT_MARKER = 'wordSpellRounds';

export const buildWordSpellInitialContent = (input: {
  rounds: readonly WordSpellRound[];
  roundOrder: readonly number[];
  tileUnit: WordSpellConfig['tileUnit'];
  mode: WordSpellConfig['mode'];
}): WordSpellPersistedContent => ({
  wordSpellRounds: input.rounds.map((r) => ({ ...r })),
  roundOrder: [...input.roundOrder],
  tileUnit: input.tileUnit,
  mode: input.mode,
});

/** True when a stored `initialContent` already carries WordSpell data. */
export const hasWordSpellPersistedContent = (
  initialContent: Record<string, unknown> | null | undefined,
): initialContent is Record<string, unknown> &
  WordSpellPersistedContent => {
  if (!initialContent) return false;
  const rounds = initialContent[WORD_SPELL_CONTENT_MARKER];
  const order = initialContent.roundOrder;
  return (
    Array.isArray(rounds) && rounds.length > 0 && Array.isArray(order)
  );
};

/**
 * Sorted-letters equality check for a word. Used by the resume-alignment
 * invariant: the tiles in the persisted draft must match the letters of
 * the word at `roundOrder[draftState.roundIndex]`.
 */
export const sortedLetters = (value: string): string =>
  [...value.toLowerCase()]
    .toSorted((a, b) => a.localeCompare(b))
    .join('');

/**
 * True when a persisted draft's tiles match the expected letters of the
 * round pointed to by `draftState.roundIndex`. When false, the draft came
 * from a different `roundOrder` (e.g. word pool drift) and must be
 * discarded — otherwise the tiles render one word while TTS speaks another.
 */
export const isDraftAlignedWithRound = (input: {
  draftTileValues: readonly string[];
  roundWord: string;
}): boolean => {
  const { draftTileValues, roundWord } = input;
  if (draftTileValues.length === 0 || roundWord.length === 0)
    return false;
  return (
    sortedLetters(draftTileValues.join('')) === sortedLetters(roundWord)
  );
};
