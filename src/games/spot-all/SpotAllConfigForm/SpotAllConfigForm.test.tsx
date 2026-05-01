import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { resolveSimpleConfig } from '../resolve-simple-config';
import { SpotAllConfigForm } from './SpotAllConfigForm';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const keys: Record<string, string> = {
        'spot-all-ui.config.groups.mirror-horizontal':
          'Mirror Horizontal',
        'spot-all-ui.config.groups.mirror-vertical': 'Mirror Vertical',
        'spot-all-ui.config.groups.rotation-180': 'Rotation 180',
        'spot-all-ui.config.groups.visual-similarity':
          'Visual Similarity',
        'spot-all-ui.config.groups.transposition': 'Transposition',
        'spot-all-ui.config.groups.reversible': 'Reversible',
        'spot-all-ui.config.invalid-selection':
          'Pick at least one group to play',
      };
      return keys[key] ?? key;
    },
  }),
}));

describe('SpotAllConfigForm', () => {
  it('shows the invalid-selection message when nothing is selected', () => {
    const onChange = vi.fn();
    render(
      <SpotAllConfigForm
        config={
          resolveSimpleConfig({
            configMode: 'simple',
            selectedConfusablePairs: [],
            selectedReversibleChars: [],
          }) as unknown as Record<string, unknown>
        }
        onChange={onChange}
      />,
    );
    expect(screen.getByText(/at least one group/i)).toBeVisible();
  });

  it('toggling a group header adds all chips in that group', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SpotAllConfigForm
        config={
          resolveSimpleConfig({
            configMode: 'simple',
            selectedConfusablePairs: [],
            selectedReversibleChars: [],
          }) as unknown as Record<string, unknown>
        }
        onChange={onChange}
      />,
    );
    await user.click(
      screen.getByRole('button', { name: /mirror horizontal/i }),
    );
    const last = onChange.mock.lastCall?.[0] as Record<string, unknown>;
    expect(
      Array.isArray(last['selectedConfusablePairs']) &&
        (last['selectedConfusablePairs'] as unknown[]).length > 0,
    ).toBe(true);
  });

  it('toggling a single chip adds just that pair', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SpotAllConfigForm
        config={
          resolveSimpleConfig({
            configMode: 'simple',
            selectedConfusablePairs: [],
            selectedReversibleChars: [],
          }) as unknown as Record<string, unknown>
        }
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: /b ↔ d/i }));
    const last = onChange.mock.lastCall?.[0] as Record<string, unknown>;
    expect(last['selectedConfusablePairs']).toEqual([
      { pair: ['b', 'd'], type: 'mirror-horizontal' },
    ]);
  });
});
