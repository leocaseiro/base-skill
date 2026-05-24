import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WordSpellSimpleConfigForm } from './WordSpellSimpleConfigForm';
import type { LevelGraphemeUnit } from '@/data/words';
import type { JSX } from 'react';
import { GRAPHEMES_BY_LEVEL } from '@/data/words';
import { dragonCaveSkin } from '@/games/word-spell/skins/dragon-cave-skin';
import {
  __resetSkinRegistryForTests,
  registerSkin,
} from '@/lib/skin/registry';

const L1 = [...(GRAPHEMES_BY_LEVEL[1] ?? [])];

const Harness = ({
  initial,
  initialMode,
}: {
  initial: LevelGraphemeUnit[];
  initialMode?: 'picture' | 'recall';
}): JSX.Element => {
  const [config, setConfig] = useState<Record<string, unknown>>({
    configMode: 'simple',
    selectedUnits: initial,
    region: 'aus',
    inputMethod: 'drag',
    ...(initialMode ? { mode: initialMode } : {}),
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
      screen.getByRole('button', { name: /^d \/d\/$/i }),
    ).toBeInTheDocument();
  });

  it('flags data-invalid when selectedUnits is empty and mode is not picture', () => {
    const { container } = render(<Harness initial={[]} />);
    expect(
      container.firstElementChild?.firstElementChild,
    ).toHaveAttribute('data-invalid', 'true');
  });

  it('is valid when no levels are selected but picture mode is active', () => {
    const { container } = render(
      <Harness initial={[]} initialMode="picture" />,
    );
    expect(
      container.firstElementChild?.firstElementChild,
    ).toHaveAttribute('data-invalid', 'false');
  });

  it('marks aria-pressed=true after tapping a chip', async () => {
    const user = userEvent.setup();
    render(<Harness initial={L1} />);
    const chip = screen.getByRole('button', { name: /m \/m\//i });
    await user.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('WordSpellSimpleConfigForm Picture toggle', () => {
  it('renders the Picture toggle button', () => {
    render(<Harness initial={L1} />);
    expect(
      screen.getByRole('button', { name: /^picture/i }),
    ).toBeInTheDocument();
  });

  it('clicking Picture clears level chips and pressing it switches mode', async () => {
    const user = userEvent.setup();
    render(<Harness initial={L1} />);
    const sChip = screen.getByRole('button', { name: /^s \/s\/$/ });
    expect(sChip).toHaveAttribute('aria-pressed', 'true');
    const picture = screen.getByRole('button', { name: /^picture/i });
    await user.click(picture);
    expect(picture).toHaveAttribute('aria-pressed', 'true');
    // The Level 1 's' chip should be off after selecting Picture.
    expect(sChip).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicking a level chip while Picture is active switches back to recall', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[]} initialMode="picture" />);
    const picture = screen.getByRole('button', { name: /^picture/i });
    expect(picture).toHaveAttribute('aria-pressed', 'true');
    const sChip = screen.getByRole('button', { name: /^s \/s\/$/ });
    await user.click(sChip);
    expect(picture).toHaveAttribute('aria-pressed', 'false');
    expect(sChip).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not show any level chips as selected while Picture is active, even if config.selectedUnits is stale', () => {
    // Simulates the legacy advanced <select> writing mode='picture' while
    // selectedUnits stays populated (e.g. user came from recall and only
    // changed mode via the dropdown). Display must follow mode, not data.
    render(<Harness initial={L1} initialMode="picture" />);
    expect(
      screen.getByRole('button', { name: /^picture/i }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: /^s \/s\/$/ }),
    ).toHaveAttribute('aria-pressed', 'false');
    expect(
      screen.getByRole('button', { name: /^t \/t\/$/ }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggling Picture off (back to recall) defaults the selection to Level 1', async () => {
    const user = userEvent.setup();
    render(<Harness initial={[]} initialMode="picture" />);
    const picture = screen.getByRole('button', { name: /^picture/i });
    await user.click(picture);
    expect(picture).toHaveAttribute('aria-pressed', 'false');
    // Sample a couple of Level 1 chips to confirm the L1 default kicked in.
    expect(
      screen.getByRole('button', { name: /^s \/s\/$/ }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: /^t \/t\/$/ }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('WordSpellSimpleConfigForm — skin radio', () => {
  const baseConfig: Record<string, unknown> = {
    configMode: 'simple',
    selectedUnits: L1,
    region: 'aus',
    inputMethod: 'drag',
  };

  beforeEach(() => {
    __resetSkinRegistryForTests();
  });

  it('hides the skin radio when only classic is registered', () => {
    render(
      <WordSpellSimpleConfigForm
        config={baseConfig}
        onChange={() => {}}
      />,
    );
    expect(
      screen.queryByRole('radiogroup', { name: /skin/i }),
    ).toBeNull();
  });

  it('shows the radio group with both options when dragon-cave is registered', () => {
    registerSkin('word-spell', dragonCaveSkin);
    render(
      <WordSpellSimpleConfigForm
        config={baseConfig}
        onChange={() => {}}
      />,
    );
    const group = screen.getByRole('radiogroup', { name: /skin/i });
    expect(group).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: /classic/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: /dragon cave/i }),
    ).toBeInTheDocument();
  });

  it('writes the picked value to config.skin', () => {
    registerSkin('word-spell', dragonCaveSkin);
    const onChange = vi.fn();
    render(
      <WordSpellSimpleConfigForm
        config={baseConfig}
        onChange={onChange}
      />,
    );
    fireEvent.click(
      screen.getByRole('radio', { name: /dragon cave/i }),
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ skin: 'dragon-cave' }),
    );
  });
});
