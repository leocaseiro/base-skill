import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmojiQuestion } from './EmojiQuestion';
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

describe('EmojiQuestion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('speaks the prompt when tapped', async () => {
    render(<EmojiQuestion emoji="🐱" prompt="cat" />, {
      wrapper: Wrapper,
    });
    await userEvent.click(
      screen.getByRole('button', { name: /cat — tap to hear/i }),
    );
    expect(speak).toHaveBeenCalledWith('cat');
  });
});
