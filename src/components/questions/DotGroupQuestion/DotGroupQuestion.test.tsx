import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DotGroupQuestion } from './DotGroupQuestion';
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

describe('DotGroupQuestion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the correct number of dots', () => {
    render(<DotGroupQuestion count={3} prompt="three dots" />, {
      wrapper: Wrapper,
    });
    expect(screen.getAllByRole('presentation')).toHaveLength(3);
  });

  it('has correct aria-label on container', () => {
    render(<DotGroupQuestion count={3} prompt="three dots" />, {
      wrapper: Wrapper,
    });
    expect(
      screen.getByRole('button', { name: 'three dots — tap to hear' }),
    ).toBeInTheDocument();
  });

  it('calls speak() on click', async () => {
    const user = userEvent.setup();
    render(<DotGroupQuestion count={3} prompt="three dots" />, {
      wrapper: Wrapper,
    });
    await user.click(screen.getByRole('button'));
    expect(speak).toHaveBeenCalledWith('three dots');
  });
});
