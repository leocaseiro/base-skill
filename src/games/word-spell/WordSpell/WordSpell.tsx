import { useNavigate } from '@tanstack/react-router';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { buildSentenceGapRound } from '../build-sentence-gap-round';
import { wordSpellDefinition } from '../definition';
import { LetterTileBank } from '../LetterTileBank/LetterTileBank';
import { useLibraryRounds } from '../useLibraryRounds';
import { buildTilesAndZones } from './build-tiles-and-zones';
import {
  buildWordSpellInitialContent,
  hasWordSpellPersistedContent,
  isDraftAlignedWithRound,
} from './word-spell-initial-content';
import type { WordSpellEngineContext } from '../definition';
import type { WordSpellConfig } from '../types';
import type {
  AnswerGameAction,
  AnswerGameConfig,
  AnswerGameDraftState,
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import type { UseGameEngineResult } from '@/lib/game-engine/definition-types';
import type { GameSkin } from '@/lib/skin';
import { AnswerGame } from '@/components/answer-game/AnswerGame/AnswerGame';
import { GameOverOverlay } from '@/components/answer-game/GameOverOverlay/GameOverOverlay';
import { ScoreAnimation } from '@/components/answer-game/ScoreAnimation/ScoreAnimation';
import { SentenceWithGaps } from '@/components/answer-game/Slot/SentenceWithGaps';
import { Slot } from '@/components/answer-game/Slot/Slot';
import { SlotRow } from '@/components/answer-game/Slot/SlotRow';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';
import { useRoundTTS } from '@/components/answer-game/useRoundTTS';
import { AudioButton } from '@/components/questions/AudioButton/AudioButton';
import { EmojiQuestion } from '@/components/questions/EmojiQuestion/EmojiQuestion';
import { ImageQuestion } from '@/components/questions/ImageQuestion/ImageQuestion';
import { useSeenWordsStore } from '@/db/hooks/useSeenWordsStore';
import { buildRoundOrder } from '@/games/build-round-order';
import { useGameEngine } from '@/lib/game-engine/useGameEngine';
import { useGameSkin } from '@/lib/skin';
import { DbContext } from '@/providers/DbProvider';

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

type WordSpellEngine = UseGameEngineResult<WordSpellEngineContext>;

/** Renders prompts + progression; must sit inside `AnswerGame` / provider. */
const WordSpellSession = ({
  wordSpellConfig,
  roundOrder,
  skin,
  onRestartSession,
  engine,
}: {
  wordSpellConfig: WordSpellConfig;
  roundOrder: readonly number[];
  skin: GameSkin;
  onRestartSession: () => void;
  engine: WordSpellEngine;
}) => {
  const dispatch = useAnswerGameDispatch();
  const navigate = useNavigate();

  const enginePhase = engine.phase;
  const engineRoundIndex = engine.roundIndex;
  const retryCount = engine.retryCount;
  const zones = engine.context.zones;

  const rounds = useMemo(
    () => wordSpellConfig.rounds ?? [],
    [wordSpellConfig.rounds],
  );

  const configRoundIndex = roundOrder[engineRoundIndex];
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

  // Round-advance is driven by XState's `after: 750` and `always`
  // transitions. When the machine settles in `waitingForNext`, compute the
  // next round's tiles/zones and dispatch ADVANCE_ROUND via the reducer
  // dispatch — AnswerGameProvider mirrors it to the engine via
  // engineDispatch, so reducer and engine advance together.
  useEffect(() => {
    if (enginePhase !== 'waitingForNext') return;
    const nextConfigIndex = roundOrder[engineRoundIndex + 1];
    const nextRound =
      nextConfigIndex === undefined
        ? undefined
        : rounds[nextConfigIndex];
    const word = nextRound?.word.trim() ?? '';
    if (!word) return;
    if (nextRound?.gaps && nextRound.gaps.length > 0) {
      const { tiles: nextTiles, zones: nextZones } =
        buildSentenceGapRound(nextRound.gaps);
      dispatch({
        type: 'ADVANCE_ROUND',
        tiles: nextTiles,
        zones: nextZones,
      });
    } else {
      const { tiles: nextTiles, zones: nextZones } = buildTilesAndZones(
        word,
        wordSpellConfig.tileUnit,
      );
      dispatch({
        type: 'ADVANCE_ROUND',
        tiles: nextTiles,
        zones: nextZones,
      });
    }
  }, [
    enginePhase,
    engineRoundIndex,
    roundOrder,
    rounds,
    wordSpellConfig.tileUnit,
    dispatch,
  ]);

  if (!round) return null;

  const hasEmoji =
    wordSpellConfig.mode !== 'recall' && Boolean(round.emoji?.trim());
  const imageSrc = round.sceneImage ?? round.image;
  const hasImageUrl =
    wordSpellConfig.mode !== 'recall' && Boolean(imageSrc);

  const showRoundComplete = enginePhase === 'roundComplete';
  const showGameOver = enginePhase === 'gameOver';

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
        <skin.RoundCompleteEffect visible={showRoundComplete} />
      ) : (
        <ScoreAnimation visible={showRoundComplete} />
      )}
      {showGameOver ? (
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

interface WordSpellInstanceProps {
  config: WordSpellConfig;
  initialState?: AnswerGameDraftState;
  sessionId?: string;
  roundOrder: readonly number[];
  skin: GameSkin;
  onRestartSession: () => void;
  tiles: TileItem[];
  zones: AnswerZone[];
}

/**
 * One game session. Holds the XState engine and forwards every reducer
 * dispatch to it via `engineDispatch`. Re-mounted (via key changes in the
 * outer WordSpell component) when the player taps "Play again", which
 * destroys the engine actor and starts a fresh one from round 0.
 */
const WordSpellInstance = ({
  config,
  initialState,
  sessionId,
  roundOrder,
  skin,
  onRestartSession,
  tiles,
  zones,
}: WordSpellInstanceProps) => {
  const answerGameConfig = useMemo(
    (): AnswerGameConfig => ({
      gameId: config.gameId,
      inputMethod: config.inputMethod,
      wrongTileBehavior: config.wrongTileBehavior,
      tileBankMode: config.tileBankMode,
      distractorCount: config.distractorCount,
      totalRounds: roundOrder.length,
      roundsInOrder: config.roundsInOrder,
      ttsEnabled: config.ttsEnabled,
      touchKeyboardInputMode: 'text',
      initialTiles: tiles,
      initialZones: zones,
      slotInteraction:
        config.mode === 'sentence-gap' ? 'free-swap' : 'ordered',
    }),
    [
      config.gameId,
      config.inputMethod,
      config.wrongTileBehavior,
      config.tileBankMode,
      config.distractorCount,
      roundOrder.length,
      config.roundsInOrder,
      config.ttsEnabled,
      config.mode,
      tiles,
      zones,
    ],
  );

  const engine = useGameEngine<unknown, WordSpellEngineContext>(
    wordSpellDefinition,
    {
      input: {
        totalRounds: roundOrder.length,
        maxLevels: null,
        wrongTileBehavior: config.wrongTileBehavior,
      },
      totalRounds: roundOrder.length,
      levelSize: roundOrder.length,
      envelope: { gameId: config.gameId },
    },
  );

  // Stable engineDispatch that always forwards to the latest engine.send
  // (which changes identity on every machine snapshot).
  const engineRef = useRef(engine);
  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);
  const engineDispatch = useCallback((action: AnswerGameAction) => {
    engineRef.current.send(action as never);
  }, []);

  return (
    <AnswerGame
      config={answerGameConfig}
      initialState={initialState}
      sessionId={sessionId}
      skin={skin}
      engineDispatch={engineDispatch}
    >
      <WordSpellSession
        wordSpellConfig={config}
        roundOrder={roundOrder}
        skin={skin}
        onRestartSession={onRestartSession}
        engine={engine}
      />
    </AnswerGame>
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
  // Derive the sampler seed from the route's `seed` so a deterministic
  // ?seed= URL param (used by VR + debug repro) produces stable rounds.
  // The sessionEpoch suffix keeps "Play again" sampling a fresh round
  // without breaking determinism per session.
  const sampleSeed = useMemo(
    () => `${seed}-epoch-${sessionEpoch}`,
    [seed, sessionEpoch],
  );

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
      try {
        const doc = await db.session_history_index
          .findOne(sessionId)
          .exec();

        if (cancellation.isCancelled || !doc) return;

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
      } catch (error) {
        // Initial-content persistence is best-effort: if the write
        // fails (closed DB, quota, navigation race) the live session
        // still plays correctly. Resume support degrades to the
        // stale-draft recovery path.
        if (import.meta.env.DEV) {
          console.warn(
            '[WordSpell] persisting initialContent failed',
            error,
          );
        }
      }
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
      try {
        const doc = await db.session_history_index
          .findOne(sessionId)
          .exec();

        if (cancellation.isCancelled || !doc) return;
        if (doc.draftState == null) return;
        await doc.incrementalPatch({ draftState: null });
      } catch (error) {
        // Stale-draft cleanup is best-effort. If the patch fails the
        // next stale detection on next mount will retry.
        if (import.meta.env.DEV) {
          console.warn(
            '[WordSpell] clearing stale draftState failed',
            error,
          );
        }
      }
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

  if (!round0) {
    if (import.meta.env.DEV) {
      console.warn(
        '[WordSpell] 0 rounds resolved. Filter returned no matching words.',
        { source: config.source, mode: config.mode },
      );
    }
    return (
      <div
        role="alert"
        className="flex min-h-[200px] w-full flex-col items-center justify-center gap-2 text-muted-foreground"
      >
        <p>No words matched the current filter.</p>
        {import.meta.env.DEV && (
          <pre className="max-w-md overflow-auto text-xs">
            {JSON.stringify(config.source?.filter, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  return (
    <div
      className={`game-container skin-${skin.id}`}
      style={skin.tokens as React.CSSProperties}
    >
      {skin.SceneBackground ? <skin.SceneBackground /> : null}
      <WordSpellInstance
        key={sessionEpoch}
        config={resolvedConfig}
        initialState={
          sessionEpoch === 0 && !staleDraft ? initialState : undefined
        }
        sessionId={sessionId}
        roundOrder={roundOrder}
        skin={skin}
        onRestartSession={() => {
          setSessionEpoch((e) => e + 1);
        }}
        tiles={tiles}
        zones={zones}
      />
    </div>
  );
};
