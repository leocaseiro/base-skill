import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { BaseSkillDatabase } from '@/db/types';
import type { ReactNode } from 'react';
import { getOrCreateDatabase } from '@/db';

export type DbContextValue = {
  db: BaseSkillDatabase | undefined;
  error: Error | undefined;
  isReady: boolean;
};

export const DbContext = createContext<DbContextValue | null>(null);

type DbProviderProps = {
  children: ReactNode;
  /** Tests can inject a factory instead of opening IndexedDB */
  openDatabase?: () => Promise<BaseSkillDatabase>;
  /** Optional hook after DB is ready (e.g. theme seed) */
  onDatabaseReady?: (db: BaseSkillDatabase) => void | Promise<void>;
};

export const DbProvider = ({
  children,
  openDatabase = getOrCreateDatabase,
  onDatabaseReady,
}: DbProviderProps) => {
  const [db, setDb] = useState<BaseSkillDatabase | undefined>();
  const [error, setError] = useState<Error | undefined>();
  const [isReady, setIsReady] = useState(false);

  const runReady = useCallback(
    async (instance: BaseSkillDatabase) => {
      if (onDatabaseReady) {
        await onDatabaseReady(instance);
      }
    },
    [onDatabaseReady],
  );

  useEffect(() => {
    let cancelled = false;
    openDatabase()
      .then(async (instance) => {
        if (cancelled) {
          return;
        }
        setDb(instance);
        await runReady(instance);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- cleanup can run during await
        if (cancelled) {
          return;
        }
        setIsReady(true);
      })
      .catch((error_: unknown) => {
        if (!cancelled) {
          setError(
            error_ instanceof Error
              ? error_
              : new Error(String(error_)),
          );
          setIsReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [openDatabase, runReady]);

  const value = useMemo(
    () => ({ db, error, isReady }),
    [db, error, isReady],
  );

  return (
    <DbContext.Provider value={value}>{children}</DbContext.Provider>
  );
};
