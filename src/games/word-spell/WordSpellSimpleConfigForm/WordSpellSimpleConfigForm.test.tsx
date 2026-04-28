import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { WordSpellSimpleConfigForm } from './WordSpellSimpleConfigForm';
import type { LevelGraphemeUnit } from '@/data/words';
import { GRAPHEMES_BY_LEVEL } from '@/data/words';

const L1 = [...(GRAPHEMES_BY_LEVEL[1] ?? [])];

const Harness = ({
  initial,
}: {
  initial: LevelGraphemeUnit[];
}): JSX.Element => {
  const [config, setConfig] = useState<Record<string, unknown>>({
    configMode: 'simple',
    selectedUnits: initial,
    region: 'aus',
    inputMethod: 'drag',
  });
  return (
    <WordSpellSimpleConfigForm config={config} onChange={setConfig} />
  );
};

describe('WordSpellSimpleConfigForm', () => {
  it('shows chips for grapheme-phoneme units across levels', () => {
    render(<Harness initial={L1} />);
    expect(
      screen.getByRole('button', { name: /m \/m\//i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /d \/d\//i }),
    ).toBeInTheDocument();
  });

  it('flags data-invalid when selectedUnits is empty', () => {
    const { container } = render(<Harness initial={[]} />);
    expect(
      container.firstElementChild?.firstElementChild,
    ).toHaveAttribute('data-invalid', 'true');
  });

  it('marks aria-pressed=true after tapping a chip', async () => {
    const user = userEvent.setup();
    render(<Harness initial={L1} />);
    const chip = screen.getByRole('button', { name: /m \/m\//i });
    await user.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });
});
