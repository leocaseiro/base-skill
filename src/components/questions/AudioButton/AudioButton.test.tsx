import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioButton } from './AudioButton';
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

const noTtsConfig: AnswerGameConfig = {
  ...gameConfig,
  ttsEnabled: false,
};

const NoTtsWrapper = ({ children }: { children: React.ReactNode }) => (
  <AnswerGameProvider config={noTtsConfig}>
    {children}
  </AnswerGameProvider>
);

describe('AudioButton', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders a button with aria-label', () => {
    render(<AudioButton prompt="cat" />, { wrapper: Wrapper });
    expect(
      screen.getByRole('button', { name: 'Hear the question' }),
    ).toBeInTheDocument();
  });

  it('returns null when ttsEnabled is false', () => {
    render(<AudioButton prompt="cat" />, { wrapper: NoTtsWrapper });
    expect(
      screen.queryByRole('button', { name: 'Hear the question' }),
    ).not.toBeInTheDocument();
  });

  it('calls speak() when clicked', async () => {
    const user = userEvent.setup();
    render(<AudioButton prompt="cat" />, { wrapper: Wrapper });
    await user.click(
      screen.getByRole('button', { name: 'Hear the question' }),
    );
    expect(speak).toHaveBeenCalledWith(
      'cat',
      expect.objectContaining({ rate: 1 }),
    );
  });
});
