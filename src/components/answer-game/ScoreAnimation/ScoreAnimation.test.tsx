import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ScoreAnimation } from './ScoreAnimation';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('ScoreAnimation', () => {
  it('fires confetti when visible becomes true', async () => {
    const canvasConfetti = await import('canvas-confetti');
    const confetti = canvasConfetti.default as ReturnType<typeof vi.fn>;
    const { rerender } = render(<ScoreAnimation visible={false} />);
    expect(confetti).not.toHaveBeenCalled();

    rerender(<ScoreAnimation visible={true} />);
    expect(confetti).toHaveBeenCalled();
  });
});
