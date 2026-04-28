import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { WordSpellSimpleConfigForm } from './WordSpellSimpleConfigForm';

const Harness = ({ initialLevel }: { initialLevel: number }) => {
  const [config, setConfig] = useState<Record<string, unknown>>({
    configMode: 'simple',
    source: {
      type: 'word-library',
      filter: {
        region: 'aus',
        level: initialLevel,
        phonemesAllowed: [],
      },
    },
    inputMethod: 'drag',
  });
  return (
    <WordSpellSimpleConfigForm config={config} onChange={setConfig} />
  );
};

describe('WordSpellSimpleConfigForm', () => {
  it('shows a chip per phoneme at the current level', () => {
    render(<Harness initialLevel={2} />);
    expect(
      screen.getByRole('button', { name: /m \/m\//i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /d \/d\//i }),
    ).toBeInTheDocument();
  });

  it('flags data-invalid when no phonemes are selected', () => {
    const { container } = render(<Harness initialLevel={2} />);
    // data-invalid is on WordSpellLibrarySource's root (first child of the form)
    expect(
      container.firstElementChild?.firstElementChild,
    ).toHaveAttribute('data-invalid', 'true');
  });

  it('marks aria-pressed=true after tapping a chip', async () => {
    const user = userEvent.setup();
    render(<Harness initialLevel={2} />);
    await user.click(screen.getByRole('button', { name: /m \/m\//i }));
    expect(
      screen.getByRole('button', { name: /m \/m\//i }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
