import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DebugPanel } from './DebugPanel';
import type { DebugPanelProps } from './DebugPanel';

vi.mock('./useStorageSnapshot', () => ({
  useStorageSnapshot: () => ({
    localStorage: [{ key: 'app:setting', size: 12, preview: 'abc' }],
    collections: [{ name: 'custom_games', count: 2 }],
    loading: false,
    error: null,
  }),
}));

const baseProps: DebugPanelProps = {
  gameId: 'word-spell',
  resolvedConfig: { totalRounds: 3, mode: 'recall' },
  rawSavedConfig: { configMode: 'simple', level: 1 },
  customGame: {
    id: 'custom-1',
    name: 'My Game',
    color: 'blue',
    cover: { kind: 'emoji', emoji: '🎲' },
  },
  session: {
    sessionId: 'sess-1',
    seed: 'seed-1',
    hasDraftState: true,
    hasPersistedContent: false,
  },
  rounds: [
    { word: 'cat', emoji: '🐱' },
    { word: 'dog', emoji: '🐶' },
  ],
};

describe('DebugPanel', () => {
  it('renders the collapsed launcher button', () => {
    render(<DebugPanel {...baseProps} />);
    expect(
      screen.getByRole('button', { name: /open debug panel/i }),
    ).toBeInTheDocument();
  });

  it('expands to show resolved config and rounds when launcher is clicked', () => {
    render(<DebugPanel {...baseProps} />);
    fireEvent.click(
      screen.getByRole('button', { name: /open debug panel/i }),
    );

    expect(screen.getByText(/Resolved Config/i)).toBeInTheDocument();
    expect(screen.getByText(/totalRounds/i)).toBeInTheDocument();
    expect(screen.getByText(/Rounds \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText('cat')).toBeInTheDocument();
    expect(screen.getByText('dog')).toBeInTheDocument();
  });

  it('shows custom game data when id is set', () => {
    render(<DebugPanel {...baseProps} />);
    fireEvent.click(
      screen.getByRole('button', { name: /open debug panel/i }),
    );
    expect(screen.getByText(/custom-1/)).toBeInTheDocument();
  });

  it('shows empty placeholder when not a custom game', () => {
    render(
      <DebugPanel
        {...baseProps}
        customGame={{ id: null, name: null, color: null, cover: null }}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: /open debug panel/i }),
    );
    expect(screen.getByText(/not a custom game/i)).toBeInTheDocument();
  });

  it('shows empty rounds placeholder when rounds array is empty', () => {
    render(<DebugPanel {...baseProps} rounds={[]} />);
    fireEvent.click(
      screen.getByRole('button', { name: /open debug panel/i }),
    );
    expect(
      screen.getByText(/library or generator samples at runtime/i),
    ).toBeInTheDocument();
  });

  it('collapses back when the close button is clicked', () => {
    render(<DebugPanel {...baseProps} />);
    fireEvent.click(
      screen.getByRole('button', { name: /open debug panel/i }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /close debug panel/i }),
    );
    expect(
      screen.getByRole('button', { name: /open debug panel/i }),
    ).toBeInTheDocument();
  });
});
