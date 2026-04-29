import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DebugPanel } from './DebugPanel';
import type { DebugPanelProps } from './DebugPanel';

vi.mock('./useStorageSnapshot', () => ({
  useStorageSnapshot: () => ({
    localStorage: [{ key: 'app:setting', size: 12, preview: 'abc' }],
    collections: [
      {
        name: 'custom_games',
        count: 2,
        docs: [
          { id: 'cg-1', name: 'Game 1' },
          { id: 'cg-2', name: 'Game 2' },
        ],
      },
    ],
    loading: false,
    error: null,
  }),
}));

vi.mock('./useLibraryPreview', () => ({
  useLibraryPreview: () => ({
    loading: false,
    error: null,
    hitCount: 0,
    hits: [],
    usedFallback: null,
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
    draftState: { phase: 'play', score: 0 },
    persistedContent: null,
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
    expect(
      screen.getByText(/Rounds in config \(2\)/i),
    ).toBeInTheDocument();
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

  it('renders Live Rounds from persistedContent.wordSpellRounds for word-spell', () => {
    render(
      <DebugPanel
        {...baseProps}
        rounds={[]}
        session={{
          ...baseProps.session,
          persistedContent: {
            wordSpellRounds: [
              { word: 'mat', emoji: '🪐' },
              { word: 'sat', emoji: '🪑' },
            ],
            roundOrder: [0, 1],
          },
        }}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: /open debug panel/i }),
    );

    expect(
      screen.getByText(/Live Rounds in session \(2\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText('mat')).toBeInTheDocument();
    expect(screen.getByText('sat')).toBeInTheDocument();
  });

  it('renders Round Pool Preview for number-match listing the integer range', () => {
    render(
      <DebugPanel
        {...baseProps}
        gameId="number-match"
        resolvedConfig={{
          mode: 'numeral-to-group',
          tileStyle: 'dots',
          range: { min: 3, max: 7 },
        }}
        rounds={[]}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: /open debug panel/i }),
    );

    expect(
      screen.getByText(/Round Pool Preview \(5 values\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText('3, 4, 5, 6, 7')).toBeInTheDocument();
  });

  it('renders Round Pool Preview for sort-numbers using its generator rules', () => {
    render(
      <DebugPanel
        {...baseProps}
        gameId="sort-numbers"
        resolvedConfig={{
          range: { min: 1, max: 20 },
          quantity: 4,
          skip: { mode: 'by', step: 2, start: 'range-min' },
          direction: 'ascending',
          totalRounds: 1,
        }}
        rounds={[]}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: /open debug panel/i }),
    );

    expect(
      screen.getByText(/Round Pool Preview \(12 samples\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Sample sequences/i)).toBeInTheDocument();
    expect(screen.getAllByText('1, 3, 5, 7').length).toBeGreaterThan(0);
  });

  it('renders the Library Source section when resolvedConfig has source.filter', () => {
    render(
      <DebugPanel
        {...baseProps}
        resolvedConfig={{
          totalRounds: 8,
          roundsInOrder: false,
          selectedUnits: [{ level: 1, grapheme: 'a', phoneme: 'æ' }],
          source: {
            filter: { region: 'aus', level: 1 },
            limit: 8,
          },
        }}
        rounds={[]}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: /open debug panel/i }),
    );

    expect(screen.getByText(/^Library Source$/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Library Words \(0 matches\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/filter returned 0 words/i),
    ).toBeInTheDocument();
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

  it('copies JSON to clipboard when the section copy button is clicked', () => {
    const writeText = vi
      .fn()
      .mockImplementation(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });

    render(<DebugPanel {...baseProps} />);
    fireEvent.click(
      screen.getByRole('button', { name: /open debug panel/i }),
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: /copy resolvedConfig to clipboard/i,
      }),
    );

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0]?.[0]).toContain('totalRounds');
  });

  it('logs to console when the section log button is clicked', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    render(<DebugPanel {...baseProps} />);
    fireEvent.click(
      screen.getByRole('button', { name: /open debug panel/i }),
    );

    fireEvent.click(
      screen.getByRole('button', { name: /log session to console/i }),
    );

    expect(log).toHaveBeenCalledWith(
      '[debug:session]',
      baseProps.session,
    );

    log.mockRestore();
  });

  it('dumps IndexedDB collection documents in the Storage section', () => {
    render(<DebugPanel {...baseProps} />);
    fireEvent.click(
      screen.getByRole('button', { name: /open debug panel/i }),
    );
    expect(screen.getByText(/cg-1/)).toBeInTheDocument();
    expect(screen.getByText(/Game 1/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /copy idb:custom_games to clipboard/i,
      }),
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
