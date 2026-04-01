import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { LevelRow } from './LevelRow';
import { i18n } from '@/lib/i18n/i18n';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('LevelRow', () => {
  it('renders an "All" button and one button per level', () => {
    render(<LevelRow currentLevel="" onLevelChange={vi.fn()} />, {
      wrapper,
    });
    expect(
      screen.getByRole('button', { name: /all/i }),
    ).toBeInTheDocument();
    for (const label of [
      'Pre-K',
      'K',
      'Year 1',
      'Year 2',
      'Year 3',
      'Year 4',
    ]) {
      expect(
        screen.getByRole('button', { name: label }),
      ).toBeInTheDocument();
    }
  });

  it('calls onLevelChange with the level value when a level button is clicked', async () => {
    const onLevelChange = vi.fn();
    render(<LevelRow currentLevel="" onLevelChange={onLevelChange} />, {
      wrapper,
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Pre-K' }),
    );
    expect(onLevelChange).toHaveBeenCalledWith('PK');
  });

  it('calls onLevelChange with empty string when "All" is clicked', async () => {
    const onLevelChange = vi.fn();
    render(
      <LevelRow currentLevel="1" onLevelChange={onLevelChange} />,
      { wrapper },
    );
    await userEvent.click(screen.getByRole('button', { name: /all/i }));
    expect(onLevelChange).toHaveBeenCalledWith('');
  });

  it('marks the active level button as aria-pressed', () => {
    render(<LevelRow currentLevel="K" onLevelChange={vi.fn()} />, {
      wrapper,
    });
    const kButton = screen.getByRole('button', { name: 'K' });
    expect(kButton).toHaveAttribute('aria-pressed', 'true');
  });
});
