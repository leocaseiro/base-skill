import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { WordSpellLibrarySource } from './WordSpellLibrarySource';
import type { LevelGraphemeUnit } from '@/data/words';
import type { JSX } from 'react';
import {
  GRAPHEMES_BY_LEVEL,
  __resetChunkCacheForTests,
} from '@/data/words';

const visible = (units: readonly LevelGraphemeUnit[]) =>
  units.filter((u) => u.p !== '');
const L1 = visible(GRAPHEMES_BY_LEVEL[1] ?? []);
const L2 = visible(GRAPHEMES_BY_LEVEL[2] ?? []);

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

afterEach(() => {
  __resetChunkCacheForTests();
});

describe('WordSpellLibrarySource', () => {
  it('renders 8 level rows', () => {
    render(<Harness initial={L1} />);
    for (let n = 1; n <= 8; n++) {
      expect(
        screen.getByRole('button', { name: new RegExp(`Level ${n}`) }),
      ).toBeInTheDocument();
    }
  });

  it('uses no native <input type="checkbox"> (group-click only)', () => {
    const { container } = render(<Harness initial={L1} />);
    expect(
      container.querySelectorAll('input[type="checkbox"]'),
    ).toHaveLength(0);
  });

  it('marks the L1 header as all-on when every L1 unit is selected', () => {
    render(<Harness initial={L1} />);
    const l1 = screen.getByRole('button', { name: /Level 1/i });
    expect(l1).toHaveAttribute('aria-pressed', 'true');
  });

  it('marks the L1 header as partial (mixed) when one L1 unit is missing', () => {
    render(<Harness initial={L1.slice(1)} />);
    const l1 = screen.getByRole('button', { name: /Level 1/i });
    expect(l1).toHaveAttribute('aria-pressed', 'mixed');
  });

  it('marks the L2 header as off when no L2 units are selected', () => {
    render(<Harness initial={L1} />);
    const l2 = screen.getByRole('button', { name: /Level 2/i });
    expect(l2).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicking a level header toggles every chip in that row', async () => {
    const user = userEvent.setup();
    render(<Harness initial={L1} />);
    const l2 = screen.getByRole('button', { name: /Level 2/i });
    await user.click(l2);
    expect(l2).toHaveAttribute('aria-pressed', 'true');
    for (const u of L2) {
      const chip = screen.getByRole('button', {
        name: new RegExp(
          String.raw`(^|, )${u.g}(,| ).*\/${u.p}\/`,
          'i',
        ),
      });
      expect(chip).toHaveAttribute('aria-pressed', 'true');
    }
  });

  it('clicking a chip toggles just that unit and updates header to partial', async () => {
    const user = userEvent.setup();
    render(<Harness initial={L1} />);
    const firstL1Chip = screen.getByRole('button', {
      name: new RegExp(String.raw`^${L1[0]!.g} \/${L1[0]!.p}\/`, 'i'),
    });
    await user.click(firstL1Chip);
    expect(firstL1Chip).toHaveAttribute('aria-pressed', 'false');
    const l1 = screen.getByRole('button', { name: /Level 1/i });
    expect(l1).toHaveAttribute('aria-pressed', 'mixed');
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

  it('renders a WordPreviewBar', () => {
    render(<Harness initial={L1} />);
    expect(screen.getByTestId('word-preview-bar')).toBeInTheDocument();
  });
});
