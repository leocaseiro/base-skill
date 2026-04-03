import { nanoid } from 'nanoid';
import { useMemo } from 'react';
import { MatchingPairZones } from '../MatchingPairZones/MatchingPairZones';
import { NumeralTileBank } from '../NumeralTileBank/NumeralTileBank';
import type { NumberMatchConfig } from '../types';
import type {
  AnswerGameConfig,
  AnswerZone,
  TileItem,
} from '@/components/answer-game/types';
import { AnswerGame } from '@/components/answer-game/AnswerGame/AnswerGame';
import { AudioButton } from '@/components/questions/AudioButton/AudioButton';
import { DotGroupQuestion } from '@/components/questions/DotGroupQuestion/DotGroupQuestion';
import { TextQuestion } from '@/components/questions/TextQuestion/TextQuestion';

function buildNumeralRound(value: number): {
  tiles: TileItem[];
  zones: AnswerZone[];
} {
  const zone: AnswerZone = {
    id: nanoid(),
    index: 0,
    expectedValue: String(value),
    placedTileId: null,
    isWrong: false,
    isLocked: false,
  };
  const tile: TileItem = {
    id: nanoid(),
    label: String(value),
    value: String(value),
  };
  return { tiles: [tile], zones: [zone] };
}

interface NumberMatchProps {
  config: NumberMatchConfig;
}

export const NumberMatch = ({ config }: NumberMatchProps) => {
  const round = config.rounds[0];
  const roundValue = round?.value;

  const { tiles, zones } = useMemo(() => {
    if (roundValue === undefined) {
      return { tiles: [] as TileItem[], zones: [] as AnswerZone[] };
    }
    return buildNumeralRound(roundValue);
  }, [roundValue]);

  const answerGameConfig = useMemo(
    (): AnswerGameConfig => ({
      gameId: config.gameId,
      inputMethod: config.inputMethod,
      wrongTileBehavior: config.wrongTileBehavior,
      tileBankMode: config.tileBankMode,
      distractorCount: config.distractorCount,
      totalRounds: config.rounds.length,
      ttsEnabled: config.ttsEnabled,
      initialTiles: tiles,
      initialZones: zones,
    }),
    [
      config.gameId,
      config.inputMethod,
      config.wrongTileBehavior,
      config.tileBankMode,
      config.distractorCount,
      config.rounds.length,
      config.ttsEnabled,
      tiles,
      zones,
    ],
  );

  if (!round) return null;

  const showTextQuestion =
    config.mode === 'numeral-to-group' ||
    config.mode === 'numeral-to-word' ||
    config.mode === 'word-to-numeral';

  return (
    <AnswerGame config={answerGameConfig}>
      <AnswerGame.Question>
        {showTextQuestion ? (
          <TextQuestion text={String(round.value)} />
        ) : (
          <DotGroupQuestion
            count={round.value}
            prompt={String(round.value)}
          />
        )}
        <AudioButton prompt={String(round.value)} />
      </AnswerGame.Question>
      <AnswerGame.Answer>
        <MatchingPairZones />
      </AnswerGame.Answer>
      <AnswerGame.Choices>
        <NumeralTileBank tileStyle={config.tileStyle} />
      </AnswerGame.Choices>
    </AnswerGame>
  );
};
