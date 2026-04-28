import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { WordSpellLibrarySource } from './WordSpellLibrarySource';

const Harness = ({ initialLevel }: { initialLevel: number }) => {
  const [config, setConfig] = useState<Record<string, unknown>>({
    source: {
      type: 'word-library',
      filter: {
        region: 'aus',
        level: initialLevel,
        phonemesAllowed: [],
      },
    },
  });
  return (
    <WordSpellLibrarySource config={config} onChange={setConfig} />
  );
};

describe('WordSpellLibrarySource', () => {
  it('shows the Level select', () => {
    render(<Harness initialLevel={1} />);
    expect(screen.getByLabelText(/level/i)).toBeInTheDocument();
  });

  it('shows cumulative phoneme chips at level 3', () => {
    render(<Harness initialLevel={3} />);
    // Level 1 phoneme — must appear because cumulative
    expect(
      screen.getByRole('button', { name: /s \/s\//i }),
    ).toBeInTheDocument();
    // Level 3 phoneme
    expect(
      screen.getByRole('button', { name: /b \/b\//i }),
    ).toBeInTheDocument();
  });

  it('flags data-invalid when phonemesAllowed is empty', () => {
    const { container } = render(<Harness initialLevel={2} />);
    expect(container.firstElementChild).toHaveAttribute(
      'data-invalid',
      'true',
    );
  });

  it('toggles a phoneme via aria-pressed when a chip is tapped', async () => {
    const user = userEvent.setup();
    render(<Harness initialLevel={2} />);
    const chip = screen.getByRole('button', { name: /m \/m\//i });
    await user.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });
});
