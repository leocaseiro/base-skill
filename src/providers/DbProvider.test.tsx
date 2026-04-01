import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DbProvider } from './DbProvider';
import type { BaseSkillDatabase } from '@/db/types';
import { useRxDB } from '@/db/hooks/useRxDB';

const ReadyProbe = () => {
  const { isReady, db, error } = useRxDB();
  return (
    <div>
      <span data-testid="ready">{isReady ? 'yes' : 'no'}</span>
      <span data-testid="has-db">{db ? 'yes' : 'no'}</span>
      <span data-testid="error">{error?.message ?? ''}</span>
    </div>
  );
};

describe('DbProvider', () => {
  it('exposes ready state with mocked database', async () => {
    const mockDb = { remove: vi.fn() } as unknown as BaseSkillDatabase;
    const openDatabase = vi.fn().mockResolvedValue(mockDb);

    render(
      <DbProvider openDatabase={openDatabase}>
        <ReadyProbe />
      </DbProvider>,
    );

    expect(screen.getByTestId('ready')).toHaveTextContent('no');

    await waitFor(() => {
      expect(screen.getByTestId('ready')).toHaveTextContent('yes');
    });
    expect(screen.getByTestId('has-db')).toHaveTextContent('yes');
    expect(openDatabase).toHaveBeenCalledTimes(1);
  });
});
