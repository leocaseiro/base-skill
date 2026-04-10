import { useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildNumeralRound } from '../build-numeral-round';
import {
  toCardinalText,
  toOrdinalNumber,
  toOrdinalText,
} from '../number-words';
import {
  DominoTile,
  NumeralTileBank,
} from '../NumeralTileBank/NumeralTileBank';
import type { NumberMatchConfig, NumberMatchMode } from '../types';
import type {
  AnswerGameConfig,
  AnswerGameDraftState,
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import { AnswerGame } from '@/components/answer-game/AnswerGame/AnswerGame';
import { GameOverOverlay } from '@/components/answer-game/GameOverOverlay/GameOverOverlay';
import { ScoreAnimation } from '@/components/answer-game/ScoreAnimation/ScoreAnimation';
import { Slot } from '@/components/answer-game/Slot/Slot';
import { SlotRow } from '@/components/answer-game/Slot/SlotRow';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useAnswerGameDispatch } from '@/components/answer-game/useAnswerGameDispatch';
import { useGameSounds } from '@/components/answer-game/useGameSounds';
import { useRoundTTS } from '@/components/answer-game/useRoundTTS';
import { AudioButton } from '@/components/questions/AudioButton/AudioButton';
import { DotGroupQuestion } from '@/components/questions/DotGroupQuestion/DotGroupQuestion';
import { TextQuestion } from '@/components/questions/TextQuestion/TextQuestion';
import { buildRoundOrder } from '@/games/build-round-order';

type NumberWordsLocale = 'en' | 'pt-BR';

const WORD_MODES: ReadonlySet<NumberMatchMode> =
  new Set<NumberMatchMode>([
    'cardinal-number-to-text',
    'cardinal-text-to-number',
    'ordinal-number-to-text',
    'ordinal-text-to-number',
    'cardinal-to-ordinal',
    'ordinal-to-cardinal',
  ]);

const isWordMode = (mode: NumberMatchMode): boolean =>
  WORD_MODES.has(mode);

/** Text shown in the question area for word/ordinal modes. */
const questionTextForMode = (
  value: number,
  mode: NumberMatchMode,
  locale: NumberWordsLocale,
): string => {
  switch (mode) {
    case 'cardinal-number-to-text': {
      return String(value);
    }
    case 'cardinal-text-to-number': {
      return toCardinalText(value, locale);
    }
    case 'ordinal-number-to-text': {
      return toOrdinalNumber(value, locale);
    }
    case 'ordinal-text-to-number': {
      return toOrdinalText(value, locale);
    }
    case 'cardinal-to-ordinal': {
      return toCardinalText(value, locale);
    }
    case 'ordinal-to-cardinal': {
      return toOrdinalText(value, locale);
    }
    default: {
      return String(value);
    }
  }
};

interface NumberMatchProps {
  config: NumberMatchConfig;
  initialState?: AnswerGameDraftState;
  sessionId?: string;
  seed?: string;
}

const NumberMatchSession = ({
  numberMatchConfig,
  roundOrder,
  onRestartSession,
}: {
  numberMatchConfig: NumberMatchConfig;
  roundOrder: readonly number[];
  onRestartSession: () => void;
}) => {
  const { phase, roundIndex, retryCount, zones } =
    useAnswerGameContext();
  const dispatch = useAnswerGameDispatch();
  const { confettiReady, gameOverReady } = useGameSounds();
  const navigate = useNavigate();
  const { locale } = useParams({ from: '/$locale' });
  const numberWordsLocale: NumberWordsLocale =
    locale === 'pt-BR' ? 'pt-BR' : 'en';
  const completionToken = useRef(0);

  const configRoundIndex = roundOrder[roundIndex];
  const round =
    configRoundIndex === undefined
      ? undefined
      : numberMatchConfig.rounds[configRoundIndex];

  useRoundTTS(String(round?.value ?? ''));

  const handleHome = () => {
    void navigate({ to: '/$locale', params: { locale } });
  };

  const handlePlayAgain = () => {
    onRestartSession();
  };

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
          : numberMatchConfig.rounds[nextConfigIndex];
      const value = nextRound?.value;
      if (value === undefined) {
        dispatch({ type: 'COMPLETE_GAME' });
        return;
      }
      const { tiles: nextTiles, zones: nextZones } = buildNumeralRound(
        value,
        {
          tileBankMode: numberMatchConfig.tileBankMode,
          distractorCount: numberMatchConfig.distractorCount,
          range: numberMatchConfig.range,
          mode: numberMatchConfig.mode,
          locale: numberWordsLocale,
        },
      );
      dispatch({
        type: 'ADVANCE_ROUND',
        tiles: nextTiles,
        zones: nextZones,
      });
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
    numberMatchConfig.rounds,
    numberMatchConfig.tileBankMode,
    numberMatchConfig.distractorCount,
    numberMatchConfig.range,
    numberMatchConfig.mode,
    numberWordsLocale,
  ]);

  if (!round) return null;

  const { mode, tileStyle } = numberMatchConfig;
  const tilesShowGroup = mode === 'numeral-to-group';
  const dotsDominoMode = tilesShowGroup && tileStyle === 'dots';
  const wordMode = isWordMode(mode);

  const slotClass = dotsDominoMode
    ? 'h-[136px] w-[72px] rounded-2xl'
    : wordMode
      ? 'min-w-[80px] h-20 rounded-2xl px-2'
      : 'size-20 rounded-2xl';

  const questionText = questionTextForMode(
    round.value,
    mode,
    numberWordsLocale,
  );
  const ttsPrompt =
    mode === 'group-to-numeral' || mode === 'numeral-to-group'
      ? String(round.value)
      : questionText;

  return (
    <>
      <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-8 px-4 py-6">
        <AnswerGame.Question>
          {mode === 'group-to-numeral' ? (
            <DotGroupQuestion
              // Remount per round so per-dot count state fully resets,
              // even when two consecutive rounds share the same value.
              key={`round-${roundIndex}`}
              count={round.value}
              prompt={String(round.value)}
            />
          ) : (
            <TextQuestion text={questionText} />
          )}
          <AudioButton prompt={ttsPrompt} />
        </AnswerGame.Question>
        <AnswerGame.Answer>
          <SlotRow className="gap-4">
            {zones.map((zone, i) => (
              <Slot
                key={zone.id}
                index={i}
                className={slotClass}
                renderPreview={(previewLabel) => {
                  if (dotsDominoMode) {
                    const n = Number.parseInt(previewLabel, 10);
                    if (!Number.isNaN(n)) {
                      return (
                        <div className="opacity-50">
                          <DominoTile value={n} />
                        </div>
                      );
                    }
                  }
                  if (wordMode) {
                    return (
                      <span
                        className={[
                          'block text-center font-bold leading-tight hyphens-auto break-words opacity-50',
                          previewLabel.length > 6
                            ? 'text-sm'
                            : 'text-xl',
                        ].join(' ')}
                      >
                        {previewLabel}
                      </span>
                    );
                  }
                  return (
                    <span className="text-3xl font-bold tabular-nums opacity-50">
                      {previewLabel}
                    </span>
                  );
                }}
              >
                {({ label }) => {
                  if (!label) return null;
                  if (dotsDominoMode) {
                    const n = Number.parseInt(label, 10);
                    if (!Number.isNaN(n)) {
                      return <DominoTile value={n} />;
                    }
                  }
                  if (wordMode) {
                    return (
                      <span
                        className={[
                          'block text-center font-bold leading-tight hyphens-auto break-words',
                          label.length > 6 ? 'text-sm' : 'text-xl',
                        ].join(' ')}
                      >
                        {label}
                      </span>
                    );
                  }
                  return (
                    <span className="text-3xl font-bold tabular-nums">
                      {label}
                    </span>
                  );
                }}
              </Slot>
            ))}
          </SlotRow>
        </AnswerGame.Answer>
        <AnswerGame.Choices>
          <NumeralTileBank
            tileStyle={tileStyle}
            tilesShowGroup={tilesShowGroup}
          />
        </AnswerGame.Choices>
      </div>
      <ScoreAnimation visible={confettiReady} />
      {gameOverReady ? (
        <GameOverOverlay
          retryCount={retryCount}
          onPlayAgain={handlePlayAgain}
          onHome={handleHome}
        />
      ) : null}
    </>
  );
};

export const NumberMatch = ({
  config,
  initialState,
  sessionId,
  seed,
}: NumberMatchProps) => {
  const roundsInOrder = config.roundsInOrder === true;
  const [sessionEpoch, setSessionEpoch] = useState(0);
  const { locale } = useParams({ from: '/$locale' });
  const numberWordsLocale: NumberWordsLocale =
    locale === 'pt-BR' ? 'pt-BR' : 'en';

  const roundOrder = useMemo(() => {
    void sessionEpoch;
    return buildRoundOrder(config.rounds.length, roundsInOrder, seed);
  }, [config.rounds.length, roundsInOrder, seed, sessionEpoch]);

  const firstConfigIndex = roundOrder[0];
  const round0 =
    firstConfigIndex === undefined
      ? undefined
      : config.rounds[firstConfigIndex];
  const roundValue = round0?.value;

  const { tiles, zones } = useMemo(() => {
    if (roundValue === undefined) {
      return { tiles: [] as TileItem[], zones: [] as AnswerZone[] };
    }
    return buildNumeralRound(roundValue, {
      tileBankMode: config.tileBankMode,
      distractorCount: config.distractorCount,
      range: config.range,
      mode: config.mode,
      locale: numberWordsLocale,
    });
  }, [
    roundValue,
    config.tileBankMode,
    config.distractorCount,
    config.range,
    config.mode,
    numberWordsLocale,
  ]);

  const answerGameConfig = useMemo(
    (): AnswerGameConfig => ({
      gameId: config.gameId,
      inputMethod: config.inputMethod,
      wrongTileBehavior: config.wrongTileBehavior,
      tileBankMode: config.tileBankMode,
      distractorCount: config.distractorCount,
      totalRounds: config.rounds.length,
      roundsInOrder: config.roundsInOrder,
      ttsEnabled: config.ttsEnabled,
      initialTiles: tiles,
      initialZones: zones,
      slotInteraction: 'free-swap' as const,
    }),
    [
      config.gameId,
      config.inputMethod,
      config.wrongTileBehavior,
      config.tileBankMode,
      config.distractorCount,
      config.rounds.length,
      config.roundsInOrder,
      config.ttsEnabled,
      tiles,
      zones,
    ],
  );

  if (!round0) return null;

  return (
    <AnswerGame
      config={answerGameConfig}
      initialState={initialState}
      sessionId={sessionId}
    >
      <NumberMatchSession
        numberMatchConfig={config}
        roundOrder={roundOrder}
        onRestartSession={() => {
          setSessionEpoch((e) => e + 1);
        }}
      />
    </AnswerGame>
  );
};
