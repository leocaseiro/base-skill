import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DotGroupQuestion } from './DotGroupQuestion';
import type { AnswerGameConfig } from '@/components/answer-game/types';
import { AnswerGameProvider } from '@/components/answer-game/AnswerGameProvider';
import { speak } from '@/lib/speech/SpeechOutput';

vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ locale: 'en' }),
}));

vi.mock('@/lib/speech/SpeechOutput', () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn(),
  isSpeechActive: vi.fn().mockReturnValue(false),
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

describe('DotGroupQuestion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders a button for each dot with aria-labels', () => {
    render(<DotGroupQuestion count={3} prompt="three dots" />, {
      wrapper: Wrapper,
    });
    const dots = screen.getAllByRole('button', {
      name: /^Dot \d+ of 3$/,
    });
    expect(dots).toHaveLength(3);
    expect(dots[0]).toHaveAttribute('aria-label', 'Dot 1 of 3');
    expect(dots[2]).toHaveAttribute('aria-label', 'Dot 3 of 3');
  });

  it('tapping dots assigns sequential numbers starting at 1', async () => {
    const user = userEvent.setup();
    render(<DotGroupQuestion count={3} prompt="three dots" />, {
      wrapper: Wrapper,
    });
    const [first, second, third] = screen.getAllByRole('button', {
      name: /^Dot \d+ of 3$/,
    });

    await user.click(second!);
    expect(second).toHaveTextContent('1');

    await user.click(third!);
    expect(third).toHaveTextContent('2');

    await user.click(first!);
    expect(first).toHaveTextContent('3');
  });

  it('speaks the cardinal word for each tap', async () => {
    const user = userEvent.setup();
    render(<DotGroupQuestion count={3} prompt="three dots" />, {
      wrapper: Wrapper,
    });
    const dots = screen.getAllByRole('button', {
      name: /^Dot \d+ of 3$/,
    });

    await user.click(dots[0]!);
    expect(speak).toHaveBeenNthCalledWith(
      1,
      'one',
      expect.objectContaining({ rate: 1 }),
    );

    await user.click(dots[1]!);
    expect(speak).toHaveBeenNthCalledWith(
      2,
      'two',
      expect.objectContaining({ rate: 1 }),
    );
  });

  it('tapping an already-numbered dot does nothing', async () => {
    const user = userEvent.setup();
    render(<DotGroupQuestion count={3} prompt="three dots" />, {
      wrapper: Wrapper,
    });
    const [first] = screen.getAllByRole('button', {
      name: /^Dot \d+ of 3$/,
    });

    await user.click(first!);
    expect(first).toHaveTextContent('1');
    expect(speak).toHaveBeenCalledTimes(1);

    await user.click(first!);
    expect(first).toHaveTextContent('1');
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it('resets state when count prop changes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <DotGroupQuestion count={3} prompt="three dots" />,
      { wrapper: Wrapper },
    );

    const [first] = screen.getAllByRole('button', {
      name: /^Dot \d+ of 3$/,
    });
    await user.click(first!);
    expect(first).toHaveTextContent('1');

    rerender(<DotGroupQuestion count={5} prompt="five dots" />);
    const newDots = screen.getAllByRole('button', {
      name: /^Dot \d+ of 5$/,
    });
    expect(newDots).toHaveLength(5);
    for (const dot of newDots) {
      expect(dot).toHaveTextContent('');
    }

    // Next tap should reset numbering to start from 1
    await user.click(newDots[2]!);
    expect(newDots[2]).toHaveTextContent('1');
  });
});
