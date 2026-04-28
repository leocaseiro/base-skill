import { useNavigate } from '@tanstack/react-router';
import { nanoid } from 'nanoid';
import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { buildSentenceGapRound } from '../build-sentence-gap-round';
import { LetterTileBank } from '../LetterTileBank/LetterTileBank';
import { useLibraryRounds } from '../useLibraryRounds';
import {
  buildWordSpellInitialContent,
  hasWordSpellPersistedContent,
  isDraftAlignedWithRound,
} from './word-spell-initial-content';
import type { WordSpellConfig } from '../types';
import type {
  AnswerGameConfig,
  AnswerGameDraftState,
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import type { GameSkin } from '@/lib/skin';
import { AnswerGame } from '@/components/answer-game/AnswerGame/AnswerGame';
import { GameOverOverlay } from '@/components/answer-game/GameOverOverlay/GameOverOverlay';
import { ScoreAnimation } from '@/components/answer-game/ScoreAnimation/ScoreAnimation';
import { SentenceWithGaps } from '@/components/answer-game/Slot/SentenceWithGaps';
import { Slot } from '@/components/answer-game/Slot/Slot';
import { SlotRow } from '@/components/answer-game/Slot/SlotRow';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';
import { useGameSounds } from '@/components/answer-game/useGameSounds';
import { useRoundTTS } from '@/components/answer-game/useRoundTTS';
import { AudioButton } from '@/components/questions/AudioButton/AudioButton';
import { EmojiQuestion } from '@/components/questions/EmojiQuestion/EmojiQuestion';
import { ImageQuestion } from '@/components/questions/ImageQuestion/ImageQuestion';
import { useSeenWordsStore } from '@/db/hooks/useSeenWordsStore';
import { buildRoundOrder } from '@/games/build-round-order';
import { getGameEventBus } from '@/lib/game-event-bus';
import { useGameSkin } from '@/lib/skin';
import { DbContext } from '@/providers/DbProvider';

function segmentsForWord(
  word: string,
  tileUnit: WordSpellConfig['tileUnit'],
): string[] {
  const trimmed = word.trim();
  if (tileUnit === 'word') return [trimmed];
  if (tileUnit === 'syllable') {
    const parts = trimmed.split(/[-\s]+/).filter(Boolean);
    return parts.length > 0 ? parts : [trimmed];
  }
  return [...trimmed.toLowerCase()];
}

function buildTilesAndZones(
  word: string,
  tileUnit: WordSpellConfig['tileUnit'],
): {
  tiles: TileItem[];
  zones: AnswerZone[];
} {
  const segments = segmentsForWord(word, tileUnit);
  const values = segments.map((s) =>
    tileUnit === 'letter' ? s.toLowerCase() : s.toUpperCase(),
  );
  const zones: AnswerZone[] = values.map((value, i) => ({
    id: `z${i}`,
    index: i,
    expectedValue: value,
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  }));
  const shuffled = [...values].toSorted((a, b) => a.localeCompare(b));
  const tiles: TileItem[] = shuffled.map((value) => ({
    id: nanoid(),
    label: value,
    value,
  }));
  return { tiles, zones };
}

interface WordSpellProps {
  config: WordSpellConfig;
  initialState?: AnswerGameDraftState;
  sessionId?: string;
  seed?: string;
  /**
   * On resume, the persisted `session_history_index.initialContent` for this
   * session. When it carries WordSpell data (see `hasWordSpellPersistedContent`)
   * it overrides library re-sampling and round-order regeneration so the
   * resumed tiles/prompt stay in lockstep with the draft.
   */
  persistedContent?: Record<string, unknown> | null;
}

/** Renders prompts + progression; must sit inside `AnswerGame` / provider. */
const WordSpellSession = ({
  wordSpellConfig,
  roundOrder,
  skin,
  onRestartSession,
}: {
  wordSpellConfig: WordSpellConfig;
  roundOrder: readonly number[];
  skin: GameSkin;
  onRestartSession: () => void;
}) => {
  const { phase, roundIndex, retryCount, zones } =
    useAnswerGameContext();
  const dispatch = useAnswerGameDispatch();
  const { confettiReady, gameOverReady } = useGameSounds();
  const navigate = useNavigate();
  const completionToken = useRef(0);

  const rounds = useMemo(
    () => wordSpellConfig.rounds ?? [],
    [wordSpellConfig.rounds],
  );

  const configRoundIndex = roundOrder[roundIndex];
  const round =
    configRoundIndex === undefined
      ? undefined
      : rounds[configRoundIndex];

  useRoundTTS(round?.word ?? '');

  const handleHome = () => {
    void navigate({
      to: '/$locale',
      params: { locale: 'en' },
    });
  };

  const handlePlayAgain = () => {
    onRestartSession();
  };

  useEffect(() => {
    if (phase !== 'game-over') return;
    getGameEventBus().emit({
      type: 'game:end',
      gameId: wordSpellConfig.gameId,
      sessionId: '',
      profileId: '',
      timestamp: Date.now(),
      roundIndex,
      finalScore: 0,
      totalRounds: roundOrder.length,
      correctCount: 0,
      durationMs: 0,
      retryCount,
    });
  }, [
    phase,
    wordSpellConfig.gameId,
    roundIndex,
    roundOrder.length,
    retryCount,
  ]);

  useEffect(() => {
    if (phase !== 'round-complete' || !confettiReady) return;

    const token = ++completionToken.current;
    const delayMs = 750;
    const timer = globalThis.setTimeout(() => {
      if (completionToken.current !== token) return;

      const isLastRound = roundIndex >= roundOrder.length - 1;
      if (isLastRound) {
        dispatch({ type: 'COMPLETE_GAME' });
        return;
      }

      const nextConfigIndex = roundOrder[roundIndex + 1];
      const nextRound =
        nextConfigIndex === undefined
          ? undefined
          : rounds[nextConfigIndex];
      const word = nextRound?.word.trim() ?? '';
      if (!word) {
        dispatch({ type: 'COMPLETE_GAME' });
        return;
      }
      if (nextRound?.gaps && nextRound.gaps.length > 0) {
        const { tiles: nextTiles, zones: nextZones } =
          buildSentenceGapRound(nextRound.gaps);
        dispatch({
          type: 'ADVANCE_ROUND',
          tiles: nextTiles,
          zones: nextZones,
        });
      } else {
        const { tiles: nextTiles, zones: nextZones } =
          buildTilesAndZones(word, wordSpellConfig.tileUnit);
        dispatch({
          type: 'ADVANCE_ROUND',
          tiles: nextTiles,
          zones: nextZones,
        });
      }
    }, delayMs);

    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [
    phase,
    confettiReady,
    roundIndex,
    dispatch,
    roundOrder,
    rounds,
    wordSpellConfig.tileUnit,
  ]);

  if (!round) return null;

  const hasEmoji =
    wordSpellConfig.mode !== 'recall' && Boolean(round.emoji?.trim());
  const imageSrc = round.sceneImage ?? round.image;
  const hasImageUrl =
    wordSpellConfig.mode !== 'recall' && Boolean(imageSrc);

  return (
    <>
      <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-8 px-4 py-6">
        <AnswerGame.Question>
          {wordSpellConfig.mode === 'sentence-gap' && round.sentence ? (
            round.gaps && round.gaps.length > 0 ? (
              <SentenceWithGaps
                sentence={round.sentence}
                className="max-w-md text-center text-foreground"
              />
            ) : (
              <p className="max-w-md text-center text-lg text-foreground">
                {round.sentence}
              </p>
            )
          ) : null}
          {hasEmoji ? (
            <EmojiQuestion
              emoji={round.emoji!.trim()}
              prompt={round.word}
            />
          ) : hasImageUrl ? (
            <ImageQuestion src={imageSrc!} prompt={round.word} />
          ) : null}
          <AudioButton prompt={round.word} />
        </AnswerGame.Question>
        <AnswerGame.Answer>
          {round.gaps && round.gaps.length > 0 ? null : (
            <SlotRow className="gap-2">
              {zones.map((zone, i) => (
                <Slot
                  key={zone.id}
                  index={i}
                  skin={skin}
                  className="size-14 rounded-lg"
                >
                  {({ label }) => (
                    <span className="text-2xl font-bold">{label}</span>
                  )}
                </Slot>
              ))}
            </SlotRow>
          )}
        </AnswerGame.Answer>
        <AnswerGame.Choices>
          <LetterTileBank />
        </AnswerGame.Choices>
      </div>
      {skin.RoundCompleteEffect ? (
        <skin.RoundCompleteEffect visible={confettiReady} />
      ) : (
        <ScoreAnimation visible={confettiReady} />
      )}
      {gameOverReady ? (
        skin.CelebrationOverlay ? (
          <skin.CelebrationOverlay
            retryCount={retryCount}
            onPlayAgain={handlePlayAgain}
            onHome={handleHome}
          />
        ) : (
          <GameOverOverlay
            retryCount={retryCount}
            onPlayAgain={handlePlayAgain}
            onHome={handleHome}
          />
        )
      ) : null}
    </>
  );
};

export const WordSpell = ({
  config,
  initialState,
  sessionId,
  seed,
  persistedContent,
}: WordSpellProps) => {
  const { t } = useTranslation('common');
  const skin = useGameSkin('word-spell', config.skin);
  const [sessionEpoch, setSessionEpoch] = useState(0);
  const seenWordsStore = useSeenWordsStore();
  const sampleSeed = useMemo(() => {
    void sessionEpoch;
    return nanoid();
  }, [sessionEpoch]);

  // On resume, the persisted `initialContent` is authoritative over the live
  // library sampler + seed-driven `buildRoundOrder`. If the source word pool
  // or sampling logic changed since the session was saved, the regenerated
  // rounds would desync from the in-progress draft (see plan 2026-04-21-wordspell-resume-desync).
  // `sessionEpoch > 0` means the user hit "Play again"; we discard persisted
  // content in that case so the new session samples fresh rounds.
  const persisted = useMemo(() => {
    if (sessionEpoch !== 0) return null;
    return hasWordSpellPersistedContent(persistedContent)
      ? persistedContent
      : null;
  }, [persistedContent, sessionEpoch]);

  // When persisted content exists, short-circuit `useLibraryRounds` by
  // substituting its `config.rounds` with the persisted rounds. The hook's
  // own guard returns the explicit rounds synchronously when set.
  const sourceConfig = useMemo<WordSpellConfig>(
    () =>
      persisted
        ? {
            ...config,
            rounds: [...persisted.wordSpellRounds],
            source: undefined,
          }
        : config,
    [config, persisted],
  );

  const { rounds: resolvedRounds, isLoading } = useLibraryRounds(
    sourceConfig,
    sampleSeed,
    seenWordsStore,
  );

  const resolvedConfig = useMemo<WordSpellConfig>(
    () => ({ ...config, rounds: resolvedRounds }),
    [config, resolvedRounds],
  );

  const roundsInOrder = resolvedConfig.roundsInOrder === true;

  const roundOrder = useMemo(() => {
    void sessionEpoch;
    if (persisted) return persisted.roundOrder;
    return buildRoundOrder(resolvedRounds.length, roundsInOrder, seed);
  }, [
    resolvedRounds.length,
    roundsInOrder,
    seed,
    sessionEpoch,
    persisted,
  ]);

  // For new sessions (no persisted content yet), write the real roundOrder +
  // resolved rounds into `session_history_index.initialContent` so a future
  // resume can reconstruct the exact game state.
  const dbCtx = useContext(DbContext);
  const db = dbCtx?.db ?? null;
  const persistedRef = useRef(persisted);
  useEffect(() => {
    persistedRef.current = persisted;
  }, [persisted]);

  useEffect(() => {
    if (!db || !sessionId) return;
    if (persistedRef.current) return;
    if (resolvedRounds.length === 0) return;
    if (isLoading) return;

    const cancellation = { isCancelled: false as boolean };
    void (async () => {
      const doc = await db.session_history_index
        .findOne(sessionId)
        .exec();

      if (cancellation.isCancelled || !doc) return;
      if (hasWordSpellPersistedContent(doc.initialContent)) return;

      const patch = buildWordSpellInitialContent({
        rounds: resolvedRounds,
        roundOrder,
        tileUnit: resolvedConfig.tileUnit,
        mode: resolvedConfig.mode,
      });
      await doc.incrementalPatch({
        initialContent: {
          ...doc.initialContent,
          ...patch,
        },
      });
    })();

    return () => {
      cancellation.isCancelled = true;
    };
  }, [
    db,
    sessionId,
    resolvedRounds,
    roundOrder,
    resolvedConfig.tileUnit,
    resolvedConfig.mode,
    isLoading,
  ]);

  const firstConfigIndex = roundOrder[0];
  const round0 =
    firstConfigIndex === undefined
      ? undefined
      : resolvedRounds[firstConfigIndex];
  const roundWord = round0?.word.trim() ? round0.word : '';

  // Safety net: detect a draft whose tiles don't match the round the resumed
  // index is pointing at. This covers legacy sessions (no persisted content,
  // draft authored against a different word pool) and any future divergence.
  // When stale, we ignore the draft and start from round 0, and surface a toast
  // so the player knows why their saved progress vanished.
  const staleDraft = useMemo(() => {
    if (!initialState || sessionEpoch !== 0) return false;
    if (resolvedRounds.length === 0 || isLoading) return false;
    const draftRoundConfigIndex = roundOrder[initialState.roundIndex];
    const draftRound =
      draftRoundConfigIndex === undefined
        ? undefined
        : resolvedRounds[draftRoundConfigIndex];
    if (!draftRound?.word) return true;
    if (draftRound.gaps && draftRound.gaps.length > 0) return false;
    return !isDraftAlignedWithRound({
      draftTileValues: initialState.allTiles.map((tile) => tile.value),
      roundWord: draftRound.word,
    });
  }, [
    initialState,
    resolvedRounds,
    roundOrder,
    sessionEpoch,
    isLoading,
  ]);

  useEffect(() => {
    if (!staleDraft || !db || !sessionId) return;
    const cancellation = { isCancelled: false as boolean };
    void (async () => {
      const doc = await db.session_history_index
        .findOne(sessionId)
        .exec();

      if (cancellation.isCancelled || !doc) return;
      if (doc.draftState == null) return;
      await doc.incrementalPatch({ draftState: null });
    })();
    return () => {
      cancellation.isCancelled = true;
    };
  }, [staleDraft, db, sessionId]);

  useEffect(() => {
    if (!staleDraft) return;
    toast(t('toasts.wordSpellStaleDraftRecovered'));
  }, [staleDraft, t]);

  const { tiles, zones } = useMemo(() => {
    if (!roundWord)
      return { tiles: [] as TileItem[], zones: [] as AnswerZone[] };

    if (round0?.gaps && round0.gaps.length > 0) {
      return buildSentenceGapRound(round0.gaps);
    }

    return buildTilesAndZones(roundWord, resolvedConfig.tileUnit);
  }, [roundWord, resolvedConfig.tileUnit, round0]);

  const answerGameConfig = useMemo(
    (): AnswerGameConfig => ({
      gameId: resolvedConfig.gameId,
      inputMethod: resolvedConfig.inputMethod,
      wrongTileBehavior: resolvedConfig.wrongTileBehavior,
      tileBankMode: resolvedConfig.tileBankMode,
      distractorCount: resolvedConfig.distractorCount,
      totalRounds: resolvedRounds.length,
      roundsInOrder: resolvedConfig.roundsInOrder,
      ttsEnabled: resolvedConfig.ttsEnabled,
      touchKeyboardInputMode: 'text',
      initialTiles: tiles,
      initialZones: zones,
      slotInteraction:
        resolvedConfig.mode === 'sentence-gap'
          ? 'free-swap'
          : 'ordered',
    }),
    [
      resolvedConfig.gameId,
      resolvedConfig.inputMethod,
      resolvedConfig.wrongTileBehavior,
      resolvedConfig.tileBankMode,
      resolvedConfig.distractorCount,
      resolvedRounds.length,
      resolvedConfig.roundsInOrder,
      resolvedConfig.ttsEnabled,
      resolvedConfig.mode,
      tiles,
      zones,
    ],
  );

  if (isLoading) {
    return (
      <div
        role="status"
        className="flex min-h-[200px] w-full items-center justify-center text-foreground"
      >
        Loading words…
      </div>
    );
  }

  if (!round0) return null;

  return (
    <div
      className={`game-container skin-${skin.id}`}
      style={skin.tokens as React.CSSProperties}
    >
      {skin.SceneBackground ? <skin.SceneBackground /> : null}
      <AnswerGame
        key={sessionEpoch}
        config={answerGameConfig}
        initialState={
          sessionEpoch === 0 && !staleDraft ? initialState : undefined
        }
        sessionId={sessionId}
        skin={skin}
      >
        <WordSpellSession
          wordSpellConfig={resolvedConfig}
          roundOrder={roundOrder}
          skin={skin}
          onRestartSession={() => {
            setSessionEpoch((e) => e + 1);
          }}
        />
      </AnswerGame>
    </div>
  );
};
