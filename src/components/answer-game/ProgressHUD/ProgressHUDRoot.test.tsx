import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnswerGameStateContext } from '../AnswerGameProvider';
import { ProgressHUDRoot } from './ProgressHUDRoot';
import type {
  AnswerGameConfig,
  AnswerGameState,
  ProgressHUDProps,
} from '../types';
import type { GameSkin } from '@/lib/skin';

const makeState = (
  overrides: Partial<AnswerGameState> = {},
): AnswerGameState => ({
  config: {
    gameId: 'test',
    inputMethod: 'drag',
    wrongTileBehavior: 'lock-auto-eject',
    tileBankMode: 'exact',
    totalRounds: 5,
    ttsEnabled: false,
    initialTiles: [],
    initialZones: [],
  } satisfies AnswerGameConfig,
  allTiles: [],
  bankTileIds: [],
  zones: [],
  activeSlotIndex: 0,
  dragActiveTileId: null,
  dragHoverZoneIndex: null,
  dragHoverBankTileId: null,
  phase: 'playing',
  roundIndex: 0,
  retryCount: 0,
  levelIndex: 0,
  isLevelMode: false,
  ...overrides,
});

const renderWithState = (state: AnswerGameState, skin?: GameSkin) =>
  render(
    <AnswerGameStateContext.Provider value={state}>
      <ProgressHUDRoot skin={skin} />
    </AnswerGameStateContext.Provider>,
  );

describe('ProgressHUDRoot', () => {
  it('renders the default HUD with classic defaults', () => {
    renderWithState(makeState({ roundIndex: 1 }));
    const dots = screen.getAllByRole('listitem');
    expect(dots).toHaveLength(5);
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it('renders level label when game is in level mode', () => {
    renderWithState(
      makeState({
        isLevelMode: true,
        levelIndex: 2,
        config: {
          gameId: 'sort',
          inputMethod: 'drag',
          wrongTileBehavior: 'lock-auto-eject',
          tileBankMode: 'exact',
          totalRounds: 1,
          ttsEnabled: false,
          initialTiles: [],
          initialZones: [],
        },
      }),
    );
    expect(screen.getByText(/LEVEL 3/)).toBeInTheDocument();
  });

  it('respects config.hud overrides', () => {
    renderWithState(
      makeState({
        config: {
          gameId: 'test',
          inputMethod: 'drag',
          wrongTileBehavior: 'lock-auto-eject',
          tileBankMode: 'exact',
          totalRounds: 5,
          ttsEnabled: false,
          initialTiles: [],
          initialZones: [],
          hud: {
            showDots: false,
            showFraction: true,
            showLevel: false,
          },
        },
      }),
    );
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(screen.getByText(/1/)).toBeInTheDocument();
  });

  it('mounts skin.ProgressHUD when provided, receiving the props', () => {
    const SkinHud = vi.fn<(p: ProgressHUDProps) => JSX.Element | null>(
      () => <div data-testid="custom-hud" />,
    );
    const skin: GameSkin = {
      id: 'custom',
      name: 'Custom',
      tokens: {},
      ProgressHUD: SkinHud as unknown as GameSkin['ProgressHUD'],
    };
    renderWithState(makeState({ roundIndex: 1 }), skin);
    expect(screen.getByTestId('custom-hud')).toBeInTheDocument();
    expect(SkinHud).toHaveBeenCalledWith(
      expect.objectContaining({
        roundIndex: 1,
        totalRounds: 5,
        showDots: true,
        showFraction: true,
        showLevel: false,
      }),
      undefined,
    );
  });

  it('still mounts skin.ProgressHUD when all flags are false', () => {
    const SkinHud = vi.fn(() => <div data-testid="custom-hud" />);
    const skin: GameSkin = {
      id: 'custom',
      name: 'Custom',
      tokens: {},
      ProgressHUD: SkinHud as unknown as GameSkin['ProgressHUD'],
    };
    renderWithState(
      makeState({
        config: {
          gameId: 'test',
          inputMethod: 'drag',
          wrongTileBehavior: 'lock-auto-eject',
          tileBankMode: 'exact',
          totalRounds: 5,
          ttsEnabled: false,
          initialTiles: [],
          initialZones: [],
          hud: {
            showDots: false,
            showFraction: false,
            showLevel: false,
          },
        },
      }),
      skin,
    );
    expect(screen.getByTestId('custom-hud')).toBeInTheDocument();
  });

  it('returns null when no skin override AND all flags are false', () => {
    const { container } = renderWithState(
      makeState({
        config: {
          gameId: 'test',
          inputMethod: 'drag',
          wrongTileBehavior: 'lock-auto-eject',
          tileBankMode: 'exact',
          totalRounds: 5,
          ttsEnabled: false,
          initialTiles: [],
          initialZones: [],
          hud: {
            showDots: false,
            showFraction: false,
            showLevel: false,
          },
        },
      }),
    );
    expect(container).toBeEmptyDOMElement();
  });
});
