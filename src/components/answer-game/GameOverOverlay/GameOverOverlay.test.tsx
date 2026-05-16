import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GameOverOverlay } from './GameOverOverlay';

vi.mock('canvas-confetti', () => ({
  default: Object.assign(() => {}, { reset: () => {} }),
}));

describe('GameOverOverlay', () => {
  it('renders above sibling decorations (z-50) so the stone-outline rings from skins like dragon-cave do not bleed through onto the result UI', () => {
    const { getByRole } = render(
      <GameOverOverlay
        retryCount={0}
        onPlayAgain={() => {}}
        onHome={() => {}}
      />,
    );
    const overlay = getByRole('dialog', { name: 'Game complete' });
    expect(overlay.className).toMatch(/\bz-50\b/);
  });
});
