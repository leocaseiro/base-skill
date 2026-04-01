import { act, renderHook, waitFor } from '@testing-library/react';
import { useCallback } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { useRxDB } from './useRxDB';
import { useSettings } from './useSettings';
import type { BaseSkillDatabase } from '@/db/types';
import type { ReactNode } from 'react';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import { DbProvider } from '@/providers/DbProvider';

let db: BaseSkillDatabase | undefined;

function useSettingsUnderTest() {
  const { isReady } = useRxDB();
  const { settings, update } = useSettings();
  return { isReady, settings, update };
}

const makeWrapper = (testDb: BaseSkillDatabase) => {
  const TestProviders = ({ children }: { children: ReactNode }) => {
    const openDatabase = useCallback(() => Promise.resolve(testDb), []);
    return (
      <DbProvider openDatabase={openDatabase}>{children}</DbProvider>
    );
  };
  return TestProviders;
};

afterEach(async () => {
  if (db) await destroyTestDatabase(db);
  db = undefined;
});

describe('useSettings', () => {
  it('returns default volume 0.8 when no settings doc exists', async () => {
    db = await createTestDatabase();
    const { result } = renderHook(() => useSettingsUnderTest(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.settings.volume).toBe(0.8);
  });

  it('persists updated volume to RxDB', async () => {
    db = await createTestDatabase();
    const { result } = renderHook(() => useSettingsUnderTest(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    await act(async () => {
      await result.current.update({ volume: 0.5 });
    });

    await waitFor(() => {
      expect(result.current.settings.volume).toBe(0.5);
    });
  });

  it('merges partial updates — only changes the specified field', async () => {
    db = await createTestDatabase();
    const { result } = renderHook(() => useSettingsUnderTest(), {
      wrapper: makeWrapper(db),
    });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    await act(async () => {
      await result.current.update({ speechRate: 1.5 });
    });

    await waitFor(() => {
      expect(result.current.settings.speechRate).toBe(1.5);
      expect(result.current.settings.volume).toBe(0.8);
    });
  });
});
