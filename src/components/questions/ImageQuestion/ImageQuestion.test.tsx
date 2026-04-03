import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageQuestion } from './ImageQuestion';
import type { AnswerGameConfig } from '@/components/answer-game/types';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';
import { speak } from '@/lib/speech/SpeechOutput';

vi.mock('@/lib/speech/SpeechOutput', () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn(),
}));

vi.mock('@/db/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: {
      speechRate: 1,
      volume: 0.8,
      preferredVoiceURI: undefined,
    },
    update: vi.fn(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const gameConfig: AnswerGameConfig = {
  gameId: 'test',
  inputMethod: 'drag',
  wrongTileBehavior: 'lock-auto-eject',
  tileBankMode: 'exact',
  totalRounds: 1,
  ttsEnabled: true,
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AnswerGameProvider config={gameConfig}>
    {children}
  </AnswerGameProvider>
);

describe('ImageQuestion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders an image with the given src', () => {
    render(<ImageQuestion src="/cat.svg" prompt="cat" />, {
      wrapper: Wrapper,
    });
    expect(
      screen.getByRole('img', { name: /cat/i }),
    ).toBeInTheDocument();
  });

  it('has accessible role="button" and correct aria-label', () => {
    render(<ImageQuestion src="/cat.svg" prompt="cat" />, {
      wrapper: Wrapper,
    });
    expect(
      screen.getByRole('button', { name: 'cat — tap to hear' }),
    ).toBeInTheDocument();
  });

  it('calls speak() when clicked and ttsEnabled', async () => {
    const user = userEvent.setup();
    render(<ImageQuestion src="/cat.svg" prompt="cat" />, {
      wrapper: Wrapper,
    });
    await user.click(
      screen.getByRole('button', { name: 'cat — tap to hear' }),
    );
    expect(speak).toHaveBeenCalledWith(
      'cat',
      expect.objectContaining({ rate: 1 }),
    );
  });
});
