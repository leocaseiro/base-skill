import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InstructionsOverlay } from './InstructionsOverlay';
import type { ConfigField } from '@/lib/config-fields';

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
      };
      return map[key] ?? key;
    },
  }),
}));

const fields: ConfigField[] = [
  {
    type: 'select',
    key: 'inputMethod',
    label: 'Input method',
    options: [
      { value: 'drag', label: 'drag' },
      { value: 'type', label: 'type' },
    ],
  },
];

const baseProps = {
  text: 'Drag the letters to spell the word.',
  onStart: vi.fn(),
  ttsEnabled: false,
  gameTitle: 'Word Spell',
  subject: 'reading' as const,
  config: { inputMethod: 'drag', totalRounds: 8, ttsEnabled: true },
  onConfigChange: vi.fn(),
  onSaveBookmark: vi.fn(),
  configFields: fields,
};

describe('InstructionsOverlay', () => {
  it('renders the game title chip', () => {
    render(<InstructionsOverlay {...baseProps} />);
    expect(screen.getByText('Word Spell')).toBeInTheDocument();
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
    render(<InstructionsOverlay {...baseProps} />);
    expect(
      screen.queryByLabelText('Input method'),
    ).not.toBeInTheDocument();
  });

  it('expands settings chip when tapped', async () => {
    render(<InstructionsOverlay {...baseProps} />);
    await userEvent.click(
      screen.getByRole('button', { name: /settings/i }),
    );
    expect(screen.getByLabelText('Input method')).toBeInTheDocument();
  });

  it('renders bookmarkName in the chip when provided', () => {
    render(
      <InstructionsOverlay
        {...baseProps}
        bookmarkName="Easy Mode"
        bookmarkColor="teal"
      />,
    );
    expect(screen.getByText('Easy Mode')).toBeInTheDocument();
  });

  it('shows "Save as bookmark" input when no bookmarkName', async () => {
    render(<InstructionsOverlay {...baseProps} />);
    await userEvent.click(
      screen.getByRole('button', { name: /settings/i }),
    );
    expect(
      screen.getByPlaceholderText(/e\.g\. easy mode/i),
    ).toBeInTheDocument();
  });

  it('shows Update and Save as new buttons when bookmarkName is provided', async () => {
    const onUpdateBookmark = vi.fn();
    render(
      <InstructionsOverlay
        {...baseProps}
        bookmarkName="Easy Mode"
        bookmarkColor="teal"
        onUpdateBookmark={onUpdateBookmark}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /settings/i }),
    );
    expect(
      screen.getByRole('button', { name: /update/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /save as new/i }),
    ).toBeInTheDocument();
  });
});
