import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnswerGame } from './AnswerGame';
import type { AnswerGameConfig } from '../types';
import type { GameSkin } from '@/lib/skin';

const gameConfig: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: false,
};

describe('AnswerGame', () => {
  it('renders Question slot children', () => {
    render(
      <AnswerGame config={gameConfig}>
        <AnswerGame.Question>
          <span>Question content</span>
        </AnswerGame.Question>
      </AnswerGame>,
    );
    expect(screen.getByText('Question content')).toBeInTheDocument();
  });

  it('renders Answer slot children', () => {
    render(
      <AnswerGame config={gameConfig}>
        <AnswerGame.Answer>
          <span>Answer content</span>
        </AnswerGame.Answer>
      </AnswerGame>,
    );
    expect(screen.getByText('Answer content')).toBeInTheDocument();
  });

  it('renders Choices slot children', () => {
    render(
      <AnswerGame config={gameConfig}>
        <AnswerGame.Choices>
          <span>Choices content</span>
        </AnswerGame.Choices>
      </AnswerGame>,
    );
    expect(screen.getByText('Choices content')).toBeInTheDocument();
  });

  it('slot wrappers render nothing when no children provided', () => {
    const { container } = render(
      <AnswerGame config={gameConfig}>
        <AnswerGame.Question />
      </AnswerGame>,
    );
    expect(
      container.querySelector('.game-question-zone'),
    ).toBeEmptyDOMElement();
  });

  it('auto-renders ProgressHUD as the first child of the game container', () => {
    const config: AnswerGameConfig = {
      gameId: 'test',
      inputMethod: 'drag',
      wrongTileBehavior: 'lock-auto-eject',
      tileBankMode: 'exact',
      totalRounds: 3,
      ttsEnabled: false,
      initialTiles: [],
      initialZones: [],
    };
    render(
      <AnswerGame config={config}>
        <div data-testid="game-body">body</div>
      </AnswerGame>,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByTestId('game-body')).toBeInTheDocument();
  });

  it('renders skin.ProgressHUD when a skin prop is passed', () => {
    const SkinHud = () => <div data-testid="custom-hud" />;
    const skin: GameSkin = {
      id: 'x',
      name: 'X',
      tokens: {},
      ProgressHUD: SkinHud,
    };
    const config: AnswerGameConfig = {
      gameId: 'test',
      inputMethod: 'drag',
      wrongTileBehavior: 'lock-auto-eject',
      tileBankMode: 'exact',
      totalRounds: 3,
      ttsEnabled: false,
      initialTiles: [],
      initialZones: [],
    };
    render(
      <AnswerGame config={config} skin={skin}>
        <div />
      </AnswerGame>,
    );
    expect(screen.getByTestId('custom-hud')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});
