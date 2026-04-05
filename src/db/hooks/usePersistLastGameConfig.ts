import { useEffect, useRef } from 'react';
import { useSavedConfigs } from './useSavedConfigs';

/**
 * Debounced write of the current in-game settings to RxDB (IndexedDB) so
 * “Play” from the home screen without a named save restores the last panel state.
 * Also flushes the latest config when the game body unmounts (e.g. navigating home).
 */
export const usePersistLastGameConfig = (
  gameId: string,
  config: Record<string, unknown>,
): void => {
  const { persistLastSessionConfig } = useSavedConfigs();
  const latestRef = useRef({ gameId, config });

  const serialized = JSON.stringify(config);

  useEffect(() => {
    latestRef.current = {
      gameId,
      config: JSON.parse(serialized) as Record<string, unknown>,
    };
  }, [gameId, serialized]);

  useEffect(() => {
    const payload = JSON.parse(serialized) as Record<string, unknown>;
    const handle = globalThis.setTimeout(() => {
      void persistLastSessionConfig(gameId, payload);
    }, 300);

    return () => globalThis.clearTimeout(handle);
  }, [gameId, serialized, persistLastSessionConfig]);

  useEffect(
    () => () => {
      const { gameId: gid, config: latest } = latestRef.current;
      void persistLastSessionConfig(gid, latest);
    },
    [gameId, persistLastSessionConfig],
  );
};
