import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InstructionsOverlay } from './InstructionsOverlay';

vi.mock('@/lib/game-event-bus', () => ({
  getGameEventBus: () => ({ emit: vi.fn(), subscribe: vi.fn() }),
}));

vi.mock('@/lib/speech/SpeechOutput', () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'instructions.lets-go': "Let's go!",
        'instructions.settings': '⚙️ Settings',
        'instructions.configure': 'Configure',
        'instructions.cancel': 'Cancel',
        'instructions.saveAsNew': 'Save as new custom game',
        'instructions.saveOnPlayTitle':
          'Save these settings as a custom game?',
        'instructions.saveOnPlayNameLabel': 'Custom game name',
        'instructions.saveAndPlay': 'Save & play',
        'instructions.playWithoutSaving': 'Play without saving',
      };
      return map[key] ?? key;
    },
  }),
}));

const baseProps = {
  text: 'Drag the letters to spell the word.',
  onStart: vi.fn(),
  ttsEnabled: false,
  gameTitle: 'Sort Numbers',
  gameId: 'sort-numbers',
  config: { totalRounds: 5 },
  onConfigChange: vi.fn(),
  onSaveCustomGame: vi.fn(),
};

describe('InstructionsOverlay', () => {
  it('renders the game title', () => {
    render(<InstructionsOverlay {...baseProps} />);
    expect(screen.getByText('Sort Numbers')).toBeInTheDocument();
  });

  it('renders the GameCover at the top', () => {
    render(<InstructionsOverlay {...baseProps} />);
    // sort-numbers default cover is the 📊 emoji
    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('renders instructions text', () => {
    render(<InstructionsOverlay {...baseProps} />);
    expect(
      screen.getByText('Drag the letters to spell the word.'),
    ).toBeInTheDocument();
  });

  it('renders "Let\'s go!" button', () => {
    render(<InstructionsOverlay {...baseProps} />);
    expect(
      screen.getByRole('button', { name: /let's go/i }),
    ).toBeInTheDocument();
  });

  it('prompts to save as bookmark when "Let\'s go!" is clicked on a default game', async () => {
    const onStart = vi.fn();
    render(<InstructionsOverlay {...baseProps} onStart={onStart} />);
    await userEvent.click(
      screen.getByRole('button', { name: /let's go/i }),
    );
    expect(
      screen.getByText(/save these settings as a custom game\?/i),
    ).toBeInTheDocument();
    expect(onStart).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole('button', { name: /play without saving/i }),
    );
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('calls onStart immediately (and updates the bookmark) when playing a bookmarked game', async () => {
    const onStart = vi.fn();
    const onUpdateCustomGame = vi.fn(async () => {});
    render(
      <InstructionsOverlay
        {...baseProps}
        onStart={onStart}
        customGameId="abc123"
        customGameName="Easy Mode"
        customGameColor="teal"
        onUpdateCustomGame={onUpdateCustomGame}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /let's go/i }),
    );
    expect(onUpdateCustomGame).toHaveBeenCalledWith(
      'Easy Mode',
      baseProps.config,
      expect.objectContaining({ color: 'teal' }),
    );
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('renders the simple settings form expanded by default', () => {
    render(
      <InstructionsOverlay
        {...baseProps}
        gameId="word-spell"
        gameTitle="Word Spell"
        config={{
          inputMethod: 'drag',
          totalRounds: 8,
          ttsEnabled: true,
        }}
      />,
    );
    // WordSpellSimpleConfigForm renders a "Level" label in CellSelect — no toggle needed
    expect(screen.getByText('Level')).toBeInTheDocument();
  });

  it('renders bookmarkName when provided', () => {
    render(
      <InstructionsOverlay
        {...baseProps}
        customGameName="Easy Mode"
        customGameColor="teal"
      />,
    );
    expect(screen.getByText('Easy Mode')).toBeInTheDocument();
  });

  it('shows a cog button that opens the AdvancedConfigModal', async () => {
    const user = userEvent.setup();
    render(<InstructionsOverlay {...baseProps} />);
    await user.click(
      screen.getByRole('button', { name: /configure/i }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
