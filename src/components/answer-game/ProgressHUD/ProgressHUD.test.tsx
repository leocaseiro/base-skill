import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressHUD } from './ProgressHUD';
import type { ProgressHUDProps } from '../types';

const baseProps: ProgressHUDProps = {
  roundIndex: 0,
  totalRounds: 5,
  levelIndex: 0,
  isLevelMode: false,
  phase: 'playing',
  showDots: true,
  showFraction: true,
  showLevel: false,
};

describe('ProgressHUD', () => {
  it('renders one dot per totalRounds in classic mode', () => {
    render(<ProgressHUD {...baseProps} roundIndex={2} />);
    const dots = screen.getAllByRole('listitem');
    expect(dots).toHaveLength(5);
  });

  it('marks earlier dots done, current dot current, later dots todo', () => {
    render(<ProgressHUD {...baseProps} roundIndex={2} />);
    const dots = screen.getAllByRole('listitem');
    expect(dots[0]).toHaveAttribute('data-state', 'done');
    expect(dots[1]).toHaveAttribute('data-state', 'done');
    expect(dots[2]).toHaveAttribute('data-state', 'current');
    expect(dots[3]).toHaveAttribute('data-state', 'todo');
    expect(dots[4]).toHaveAttribute('data-state', 'todo');
  });

  it('renders fraction "3/5" when showFraction and totalRounds are set', () => {
    render(<ProgressHUD {...baseProps} roundIndex={2} />);
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it('hides fraction when totalRounds is null', () => {
    render(
      <ProgressHUD {...baseProps} totalRounds={null} showFraction />,
    );
    expect(screen.queryByText('/')).not.toBeInTheDocument();
  });

  it('renders "LEVEL 3" when showLevel is true', () => {
    render(<ProgressHUD {...baseProps} showLevel levelIndex={2} />);
    expect(screen.getByText(/LEVEL 3/)).toBeInTheDocument();
  });

  it('renders null when every flag is false', () => {
    const { container } = render(
      <ProgressHUD
        {...baseProps}
        showDots={false}
        showFraction={false}
        showLevel={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('uses levelIndex+1 dots in level mode, with levelIndex filled', () => {
    render(
      <ProgressHUD
        {...baseProps}
        isLevelMode
        totalRounds={null}
        levelIndex={2}
        showFraction={false}
        showLevel
      />,
    );
    const dots = screen.getAllByRole('listitem');
    expect(dots).toHaveLength(3);
    expect(dots[0]).toHaveAttribute('data-state', 'done');
    expect(dots[1]).toHaveAttribute('data-state', 'done');
    expect(dots[2]).toHaveAttribute('data-state', 'current');
  });

  it('marks the container with data-phase for phase-driven animations', () => {
    const { container } = render(
      <ProgressHUD {...baseProps} phase="round-complete" />,
    );
    expect(container.firstChild).toHaveAttribute(
      'data-phase',
      'round-complete',
    );
  });
});
