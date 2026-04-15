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
        'instructions.saveAsNew': 'Save as new bookmark',
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
  onSaveBookmark: vi.fn(),
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

  it('calls onStart when "Let\'s go!" is clicked', async () => {
    const onStart = vi.fn();
    render(<InstructionsOverlay {...baseProps} onStart={onStart} />);
    await userEvent.click(
      screen.getByRole('button', { name: /let's go/i }),
    );
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('renders settings chip collapsed by default', () => {
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
    // The chip is collapsed — WordSpell simple form label should not be visible
    expect(screen.queryByText('Level')).not.toBeInTheDocument();
  });

  it('expands settings chip when tapped', async () => {
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
    await userEvent.click(
      screen.getByRole('button', { name: /settings/i }),
    );
    // WordSpellSimpleConfigForm renders a "Level" label in CellSelect
    expect(screen.getByText('Level')).toBeInTheDocument();
  });

  it('renders bookmarkName when provided', () => {
    render(
      <InstructionsOverlay
        {...baseProps}
        bookmarkName="Easy Mode"
        bookmarkColor="teal"
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
