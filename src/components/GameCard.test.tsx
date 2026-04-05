import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { GameCard } from './GameCard';
import type { SavedGameConfigDoc } from '@/db/schemas/saved_game_configs';
import type { GameCatalogEntry } from '@/games/registry';
import { i18n } from '@/lib/i18n/i18n';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

const mockEntry: GameCatalogEntry = {
  id: 'word-spell',
  titleKey: 'word-spell',
  descriptionKey: 'word-spell-description',
  levels: ['1', '2'],
  subject: 'reading',
};

const mockConfig: SavedGameConfigDoc = {
  id: 'cfg-1',
  profileId: 'anonymous',
  gameId: 'word-spell',
  name: 'Easy Mode',
  config: {},
  color: 'indigo',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('GameCard', () => {
  it('renders the game title', () => {
    render(
      <GameCard
        entry={mockEntry}
        savedConfigs={[]}
        onSaveConfig={vi.fn()}
        onRemoveConfig={vi.fn()}
        onUpdateConfig={vi.fn()}
        onPlay={vi.fn()}
        onPlayWithConfig={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByText('Word Spell')).toBeInTheDocument();
  });

  it('renders level badges', () => {
    render(
      <GameCard
        entry={mockEntry}
        savedConfigs={[]}
        onSaveConfig={vi.fn()}
        onRemoveConfig={vi.fn()}
        onUpdateConfig={vi.fn()}
        onPlay={vi.fn()}
        onPlayWithConfig={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByText('Year 1')).toBeInTheDocument();
    expect(screen.getByText('Year 2')).toBeInTheDocument();
  });

  it('calls onPlay with gameId when Play button is clicked', async () => {
    const onPlay = vi.fn();
    render(
      <GameCard
        entry={mockEntry}
        savedConfigs={[]}
        onSaveConfig={vi.fn()}
        onRemoveConfig={vi.fn()}
        onUpdateConfig={vi.fn()}
        onPlay={onPlay}
        onPlayWithConfig={vi.fn()}
      />,
      { wrapper },
    );
    await userEvent.click(
      screen.getByRole('button', { name: /^play$/i }),
    );
    expect(onPlay).toHaveBeenCalledWith('word-spell');
  });

  it('bookmark icon is not filled when savedConfigs is empty', () => {
    render(
      <GameCard
        entry={mockEntry}
        savedConfigs={[]}
        onSaveConfig={vi.fn()}
        onRemoveConfig={vi.fn()}
        onUpdateConfig={vi.fn()}
        onPlay={vi.fn()}
        onPlayWithConfig={vi.fn()}
      />,
      { wrapper },
    );
    const icon = screen.getByRole('button', {
      name: /save configuration/i,
    });
    expect(icon.querySelector('svg')).not.toHaveClass('fill-current');
  });

  it('bookmark icon is filled when savedConfigs has entries', () => {
    render(
      <GameCard
        entry={mockEntry}
        savedConfigs={[mockConfig]}
        onSaveConfig={vi.fn()}
        onRemoveConfig={vi.fn()}
        onUpdateConfig={vi.fn()}
        onPlay={vi.fn()}
        onPlayWithConfig={vi.fn()}
      />,
      { wrapper },
    );
    const icon = screen.getByRole('button', {
      name: /save configuration/i,
    });
    expect(icon.querySelector('svg')).toHaveClass('fill-current');
  });

  it('renders a chip for each saved config', () => {
    render(
      <GameCard
        entry={mockEntry}
        savedConfigs={[mockConfig]}
        onSaveConfig={vi.fn()}
        onRemoveConfig={vi.fn()}
        onUpdateConfig={vi.fn()}
        onPlay={vi.fn()}
        onPlayWithConfig={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByText('Easy Mode')).toBeInTheDocument();
  });

  it('calls onPlayWithConfig when the play button on a config chip is clicked', async () => {
    const onPlayWithConfig = vi.fn();
    render(
      <GameCard
        entry={mockEntry}
        savedConfigs={[mockConfig]}
        onSaveConfig={vi.fn()}
        onRemoveConfig={vi.fn()}
        onUpdateConfig={vi.fn()}
        onPlay={vi.fn()}
        onPlayWithConfig={onPlayWithConfig}
      />,
      { wrapper },
    );
    await userEvent.click(
      screen.getByRole('button', { name: /play easy mode/i }),
    );
    expect(onPlayWithConfig).toHaveBeenCalledWith(
      'word-spell',
      'cfg-1',
    );
  });

  it('calls onRemoveConfig when the × button on a chip is clicked', async () => {
    const onRemoveConfig = vi.fn();
    render(
      <GameCard
        entry={mockEntry}
        savedConfigs={[mockConfig]}
        onSaveConfig={vi.fn()}
        onRemoveConfig={onRemoveConfig}
        onUpdateConfig={vi.fn()}
        onPlay={vi.fn()}
        onPlayWithConfig={vi.fn()}
      />,
      { wrapper },
    );
    await userEvent.click(
      screen.getByRole('button', { name: /delete easy mode/i }),
    );
    expect(onRemoveConfig).toHaveBeenCalledWith('cfg-1');
  });

  it('opens SaveConfigDialog when bookmark icon is clicked', async () => {
    render(
      <GameCard
        entry={mockEntry}
        savedConfigs={[]}
        onSaveConfig={vi.fn()}
        onRemoveConfig={vi.fn()}
        onUpdateConfig={vi.fn()}
        onPlay={vi.fn()}
        onPlayWithConfig={vi.fn()}
      />,
      { wrapper },
    );
    await userEvent.click(
      screen.getByRole('button', { name: /save configuration/i }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
