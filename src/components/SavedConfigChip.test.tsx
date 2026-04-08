// src/components/SavedConfigChip.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SavedConfigChip } from './SavedConfigChip';
import type { SavedGameConfigDoc } from '@/db/schemas/saved_game_configs';
import type { ConfigField } from '@/lib/config-fields';

const mockDoc: SavedGameConfigDoc = {
  id: 'cfg-1',
  profileId: 'anonymous',
  gameId: 'word-spell',
  name: 'Easy Mode',
  config: { inputMethod: 'drag', totalRounds: 8, mode: 'picture' },
  createdAt: '2026-01-01T00:00:00.000Z',
  color: 'teal',
};

const fields: ConfigField[] = [
  {
    type: 'select',
    key: 'inputMethod',
    label: 'Input method',
    options: [
      { value: 'drag', label: 'drag' },
      { value: 'type', label: 'type' },
    ],
  },
];

describe('SavedConfigChip', () => {
  it('renders the bookmark name', () => {
    render(
      <SavedConfigChip
        doc={mockDoc}
        configFields={fields}
        onPlay={vi.fn()}
        onDelete={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByText('Easy Mode')).toBeInTheDocument();
  });

  it('renders config summary tags in collapsed state', () => {
    render(
      <SavedConfigChip
        doc={mockDoc}
        configFields={fields}
        onPlay={vi.fn()}
        onDelete={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByText('drag')).toBeInTheDocument();
  });

  it('calls onPlay with doc id when play button is clicked', async () => {
    const onPlay = vi.fn();
    render(
      <SavedConfigChip
        doc={mockDoc}
        configFields={fields}
        onPlay={onPlay}
        onDelete={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /play easy mode/i }),
    );
    expect(onPlay).toHaveBeenCalledWith('cfg-1');
  });

  it('calls onDelete with doc id when delete button is clicked', async () => {
    const onDelete = vi.fn();
    render(
      <SavedConfigChip
        doc={mockDoc}
        configFields={fields}
        onPlay={vi.fn()}
        onDelete={onDelete}
        onSave={vi.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /delete easy mode/i }),
    );
    expect(onDelete).toHaveBeenCalledWith('cfg-1');
  });

  it('expands to show the form when name button is clicked', async () => {
    render(
      <SavedConfigChip
        doc={mockDoc}
        configFields={fields}
        onPlay={vi.fn()}
        onDelete={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /expand easy mode/i }),
    );
    expect(screen.getByLabelText('Input method')).toBeInTheDocument();
  });

  it('calls onSave with updated name and config when Save is clicked', async () => {
    const onSave = vi.fn();
    render(
      <SavedConfigChip
        doc={mockDoc}
        configFields={fields}
        onPlay={vi.fn()}
        onDelete={vi.fn()}
        onSave={onSave}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /expand easy mode/i }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /^save$/i }),
    );
    expect(onSave).toHaveBeenCalledWith(
      'cfg-1',
      expect.objectContaining({ inputMethod: 'drag' }),
      'Easy Mode',
    );
  });

  it('renders renderConfigForm instead of ConfigFormFields when provided', async () => {
    render(
      <SavedConfigChip
        doc={mockDoc}
        configFields={fields}
        onPlay={vi.fn()}
        onDelete={vi.fn()}
        onSave={vi.fn()}
        renderConfigForm={({ config, onChange }) => (
          <div data-testid="custom-form">
            Custom form: {String(config.inputMethod)}
            <button
              type="button"
              onClick={() =>
                onChange({ ...config, inputMethod: 'type' })
              }
            >
              Change
            </button>
          </div>
        )}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /expand easy mode/i }),
    );
    expect(screen.getByTestId('custom-form')).toBeInTheDocument();
    expect(screen.getByText('Custom form: drag')).toBeInTheDocument();
    // The generic ConfigFormFields should NOT be rendered
    expect(
      screen.queryByLabelText('Input method'),
    ).not.toBeInTheDocument();
  });

  it('collapses without saving when Cancel is clicked', async () => {
    const onSave = vi.fn();
    render(
      <SavedConfigChip
        doc={mockDoc}
        configFields={fields}
        onPlay={vi.fn()}
        onDelete={vi.fn()}
        onSave={onSave}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /expand easy mode/i }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /cancel/i }),
    );
    expect(onSave).not.toHaveBeenCalled();
    expect(
      screen.queryByLabelText('Input method'),
    ).not.toBeInTheDocument();
  });
});
