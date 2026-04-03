import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TextQuestion } from './TextQuestion';
import type { AnswerGameConfig } from '@/components/answer-game/types';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';
import { speak } from '@/lib/speech/SpeechOutput';

vi.mock('@/lib/speech/SpeechOutput', () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn(),
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

describe('TextQuestion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the text', () => {
    render(<TextQuestion text="three" />, { wrapper: Wrapper });
    expect(screen.getByText('three')).toBeInTheDocument();
  });

  it('has role="button" and correct aria-label', () => {
    render(<TextQuestion text="three" />, { wrapper: Wrapper });
    expect(
      screen.getByRole('button', { name: 'three — tap to hear' }),
    ).toBeInTheDocument();
  });

  it('calls speak() on click', async () => {
    const user = userEvent.setup();
    render(<TextQuestion text="three" />, { wrapper: Wrapper });
    await user.click(screen.getByRole('button'));
    expect(speak).toHaveBeenCalledWith('three');
  });
});
