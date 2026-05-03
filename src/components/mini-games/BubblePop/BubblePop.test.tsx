import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BubblePop } from './BubblePop';

vi.mock('canvas-confetti', () => ({
  default: Object.assign(vi.fn(), { reset: vi.fn() }),
}));

describe('BubblePop', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the correct number of bubble buttons', () => {
    render(<BubblePop bubbleCount={4} />);
    expect(
      screen.getAllByRole('button', { name: /pop bubble/i }),
    ).toHaveLength(4);
  });

  it('shows initial 0 / N progress text', () => {
    render(<BubblePop bubbleCount={6} />);
    expect(
      screen.getByText('0 / 6 bubbles popped'),
    ).toBeInTheDocument();
  });

  it('progress bar starts at zero', () => {
    render(<BubblePop bubbleCount={4} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '4');
  });

  it('increments the progress counter after popping a bubble', async () => {
    vi.useFakeTimers();
    render(<BubblePop bubbleCount={4} />);

    const [firstBubble] = screen.getAllByRole('button', {
      name: /pop bubble/i,
    });
    fireEvent.click(firstBubble as HTMLElement);
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    expect(
      screen.getByText('1 / 4 bubbles popped'),
    ).toBeInTheDocument();
  });

  it('calls onComplete when all bubbles are popped', async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(<BubblePop bubbleCount={1} onComplete={onComplete} />);

    const [bubble] = screen.getAllByRole('button', {
      name: /pop bubble/i,
    });
    fireEvent.click(bubble as HTMLElement);
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    expect(onComplete).toHaveBeenCalledOnce();
  });
});
