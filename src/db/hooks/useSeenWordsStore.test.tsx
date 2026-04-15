import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useSeenWordsStore } from './useSeenWordsStore';
import type { BaseSkillDatabase } from '@/db/types';
import type { ReactNode } from 'react';
import {
  createTestDatabase,
  destroyTestDatabase,
} from '@/db/create-database';
import { DbContext } from '@/providers/DbProvider';

let db: BaseSkillDatabase;

const wrapper = ({ children }: { children: ReactNode }) => (
  <DbContext.Provider value={{ db, error: undefined, isReady: true }}>
    {children}
  </DbContext.Provider>
);

const unreadyWrapper = ({ children }: { children: ReactNode }) => (
  <DbContext.Provider
    value={{ db: undefined, error: undefined, isReady: false }}
  >
    {children}
  </DbContext.Provider>
);

beforeEach(async () => {
  db = await createTestDatabase();
});

afterEach(async () => {
  await destroyTestDatabase(db);
});

describe('useSeenWordsStore', () => {
  it('roundtrips words through RxDB (addSeen → get)', async () => {
    const { result } = renderHook(() => useSeenWordsStore(), {
      wrapper,
    });
    await waitFor(() => expect(result.current).toBeDefined());
    await act(async () => {
      await result.current.addSeen('sig-a', ['cat', 'dog']);
    });
    const got = await result.current.get('sig-a');
    expect(got).toEqual(new Set(['cat', 'dog']));
  });

  it('merges words across multiple addSeen calls', async () => {
    const { result } = renderHook(() => useSeenWordsStore(), {
      wrapper,
    });
    await act(async () => {
      await result.current.addSeen('sig-a', ['cat']);
      await result.current.addSeen('sig-a', ['dog', 'cat']);
    });
    expect(await result.current.get('sig-a')).toEqual(
      new Set(['cat', 'dog']),
    );
  });

  it('resetSeen replaces the set', async () => {
    const { result } = renderHook(() => useSeenWordsStore(), {
      wrapper,
    });
    await act(async () => {
      await result.current.addSeen('sig-a', ['cat', 'dog']);
      await result.current.resetSeen('sig-a', ['pig']);
    });
    expect(await result.current.get('sig-a')).toEqual(new Set(['pig']));
  });

  it('returns an empty set for unknown signatures', async () => {
    const { result } = renderHook(() => useSeenWordsStore(), {
      wrapper,
    });
    expect(await result.current.get('missing')).toEqual(new Set());
  });

  it('falls back to an in-memory store when the db is not ready', async () => {
    const { result } = renderHook(() => useSeenWordsStore(), {
      wrapper: unreadyWrapper,
    });
    await act(async () => {
      await result.current.addSeen('sig-a', ['cat']);
    });
    expect(await result.current.get('sig-a')).toEqual(new Set(['cat']));
  });
});
