import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SpotAll } from './SpotAll';
import type { SpotAllConfig } from '../types';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ locale: 'en' }),
}));

const config: SpotAllConfig = {
  gameId: 'spot-all',
  component: 'SpotAll',
  configMode: 'advanced',
  totalRounds: 1,
  roundsInOrder: true,
  ttsEnabled: true,
  targetSetIds: ['15-51'],
  relationshipTypes: ['transposition'],
  correctTileCount: 2,
  distractorCount: 1,
  visualVariationEnabled: true,
};

describe('SpotAll', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders prompt and requested number of tiles', () => {
    render(<SpotAll config={config} seed="abc" />);
    expect(screen.getByText(/Select all the/i)).toBeInTheDocument();
    const tileButtons = screen
      .getAllByRole('button')
      .filter((button) => button.textContent !== 'Check');
    expect(tileButtons).toHaveLength(3);
  });

  it('submitting selected correct tiles shows success feedback', () => {
    vi.useFakeTimers();
    render(<SpotAll config={config} seed="abc" />);
    const promptText = screen.getByText(/Select all the/i).textContent;
    const targetMatch = promptText.match(
      /Select all the\s+(.+)\s+tiles/i,
    );
    const target = targetMatch?.[1]?.trim() ?? '';
    expect(target).toBeTruthy();

    const matchingSpans = screen.getAllByText(target);
    for (const span of matchingSpans) {
      const tileButton = span.closest('button');
      if (tileButton && tileButton.textContent !== 'Check') {
        fireEvent.click(tileButton);
      }
    }

    fireEvent.click(screen.getByRole('button', { name: 'Check' }));

    const selectedTileButtons = screen
      .getAllByRole('button')
      .filter((button) => button.className.includes('bg-emerald-50'));
    expect(selectedTileButtons.length).toBeGreaterThan(0);
  });
});
