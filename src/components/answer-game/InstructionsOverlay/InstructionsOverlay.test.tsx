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
      const translations: Record<string, string> = {
        'instructions.lets-go': "Let's go!",
      };
      return translations[key] ?? key;
    },
  }),
}));

describe('InstructionsOverlay', () => {
  it('renders instructions text', () => {
    render(
      <InstructionsOverlay
        text="Drag the letters to spell the word."
        onStart={vi.fn()}
        ttsEnabled={false}
      />,
    );
    expect(
      screen.getByText('Drag the letters to spell the word.'),
    ).toBeInTheDocument();
  });

  it('calls onStart when "Let\'s go!" button is clicked', async () => {
    const onStart = vi.fn();
    render(
      <InstructionsOverlay
        text="Instructions here."
        onStart={onStart}
        ttsEnabled={false}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /let's go/i }),
    );
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('renders the "Let\'s go!" button', () => {
    render(
      <InstructionsOverlay
        text="Instructions."
        onStart={vi.fn()}
        ttsEnabled={false}
      />,
    );
    expect(
      screen.getByRole('button', { name: /let's go/i }),
    ).toBeInTheDocument();
  });
});
