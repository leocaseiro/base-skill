import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { WordSpellLibrarySource } from './WordSpellLibrarySource';
import type { LevelGraphemeUnit } from '@/data/words';
import type { JSX } from 'react';
import { GRAPHEMES_BY_LEVEL } from '@/data/words';

const L1 = [...(GRAPHEMES_BY_LEVEL[1] ?? [])];

const Harness = ({
  initial,
}: {
  initial: LevelGraphemeUnit[];
}): JSX.Element => {
  const [config, setConfig] = useState<Record<string, unknown>>({
    selectedUnits: initial,
    region: 'aus',
  });
  return (
    <WordSpellLibrarySource config={config} onChange={setConfig} />
  );
};

describe('WordSpellLibrarySource — chips variant (default)', () => {
  it('renders 8 level rows', () => {
    render(<Harness initial={L1} />);
    for (let n = 1; n <= 8; n++) {
      expect(screen.getByLabelText(`Level ${n}`)).toBeInTheDocument();
    }
  });

  it('shows the L1 row checkbox as checked when all L1 units are selected', () => {
    render(<Harness initial={L1} />);
    const cb = screen.getByLabelText('Level 1');
    expect(cb.checked).toBe(true);
    expect(cb.indeterminate).toBe(false);
  });

  it('shows the L1 row checkbox as indeterminate when one L1 unit is missing', () => {
    render(<Harness initial={L1.slice(1)} />);
    const cb = screen.getByLabelText('Level 1');
    expect(cb.indeterminate).toBe(true);
  });

  it('shows the L2 row checkbox as unchecked when no L2 units are selected', () => {
    render(<Harness initial={L1} />);
    const cb = screen.getByLabelText('Level 2');
    expect(cb.checked).toBe(false);
    expect(cb.indeterminate).toBe(false);
  });

  it('clicking a row checkbox toggles every unit in that row', async () => {
    const user = userEvent.setup();
    render(<Harness initial={L1} />);
    const l2 = screen.getByLabelText('Level 2');
    await user.click(l2);
    expect(l2.checked).toBe(true);
    expect(l2.indeterminate).toBe(false);
  });

  it('clicking an individual chip toggles just that unit and updates the row', async () => {
    const user = userEvent.setup();
    render(<Harness initial={L1} />);
    const firstL1Chip = screen.getByRole('button', {
      name: new RegExp(String.raw`${L1[0]!.g} \/${L1[0]!.p}\/`, 'i'),
    });
    await user.click(firstL1Chip);
    expect(firstL1Chip).toHaveAttribute('aria-pressed', 'false');
    const l1 = screen.getByLabelText('Level 1');
    expect(l1.indeterminate).toBe(true);
  });

  it('renders L1 `s /s/` and L4 `c /s/` as independent chips', () => {
    render(<Harness initial={L1} />);
    const sL1 = screen.getByRole('button', { name: /^s \/s\//i });
    const cL4 = screen.getByRole('button', { name: /^c \/s\//i });
    expect(sL1).not.toBe(cL4);
  });

  it('flags data-invalid when selectedUnits is empty', () => {
    const { container } = render(<Harness initial={[]} />);
    expect(container.firstElementChild).toHaveAttribute(
      'data-invalid',
      'true',
    );
  });
});
