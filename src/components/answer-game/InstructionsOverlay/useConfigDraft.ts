import { useEffect, useMemo, useRef, useState } from 'react';
import type { Cover } from '@/games/cover-type';
import type { GameColorKey } from '@/lib/game-colors';
import { deepEqual } from '@/lib/deep-equal';

export type Draft = {
  config: Record<string, unknown>;
  name: string;
  color: GameColorKey;
  cover: Cover | undefined;
};

type Meta = {
  name: string;
  color: GameColorKey;
  cover: Cover | undefined;
};

export type UseConfigDraftInput = {
  /** Live config (route's `cfg`). */
  config: Record<string, unknown>;
  /** Push config edits up to the route. */
  onConfigChange: (next: Record<string, unknown>) => void;
  initialName: string;
  initialColor: GameColorKey;
  initialCover: Cover | undefined;
  /**
   * When this changes (e.g. navigating to a different custom game),
   * baseline and meta reset to their initial values.
   */
  identity: string;
};

export type ConfigDraftApi = {
  draft: Draft;
  savedBaseline: Draft;
  isDirty: boolean;
  setDraft: (patch: Partial<Draft>) => void;
  openModalSnapshot: () => void;
  discard: () => void;
  commitSaved: (next: Draft) => void;
};

export const useConfigDraft = (
  input: UseConfigDraftInput,
): ConfigDraftApi => {
  const {
    config,
    onConfigChange,
    initialName,
    initialColor,
    initialCover,
    identity,
  } = input;

  const [meta, setMeta] = useState<Meta>({
    name: initialName,
    color: initialColor,
    cover: initialCover,
  });

  const [savedBaseline, setSavedBaseline] = useState<Draft>({
    config,
    name: initialName,
    color: initialColor,
    cover: initialCover,
  });

  const snapshotRef = useRef<Draft | null>(null);
  const previousIdentityRef = useRef(identity);

  // Keep the latest "initial" values + config + onConfigChange accessible to
  // effects/callbacks without re-running the identity-reset effect on every
  // render.
  const latestRef = useRef({
    config,
    onConfigChange,
    initialName,
    initialColor,
    initialCover,
  });

  useEffect(() => {
    latestRef.current = {
      config,
      onConfigChange,
      initialName,
      initialColor,
      initialCover,
    };
  });

  useEffect(() => {
    if (previousIdentityRef.current === identity) return;
    previousIdentityRef.current = identity;
    const latest = latestRef.current;
    setMeta({
      name: latest.initialName,
      color: latest.initialColor,
      cover: latest.initialCover,
    });
    setSavedBaseline({
      config: latest.config,
      name: latest.initialName,
      color: latest.initialColor,
      cover: latest.initialCover,
    });
    snapshotRef.current = null;
  }, [identity]);

  const draft: Draft = useMemo(
    () => ({
      config,
      name: meta.name,
      color: meta.color,
      cover: meta.cover,
    }),
    [config, meta.color, meta.cover, meta.name],
  );

  const isDirty = useMemo(
    () => !deepEqual(draft, savedBaseline),
    [draft, savedBaseline],
  );

  const setDraft = (patch: Partial<Draft>): void => {
    if (patch.config !== undefined) {
      latestRef.current.onConfigChange(patch.config);
    }
    if (
      patch.name !== undefined ||
      patch.color !== undefined ||
      patch.cover !== undefined
    ) {
      setMeta((prev) => ({
        name: patch.name ?? prev.name,
        color: patch.color ?? prev.color,
        cover: patch.cover === undefined ? prev.cover : patch.cover,
      }));
    }
  };

  const openModalSnapshot = (): void => {
    snapshotRef.current = { ...draft };
  };

  const discard = (): void => {
    const snapshot = snapshotRef.current;
    if (!snapshot) return;
    if (!deepEqual(snapshot.config, latestRef.current.config)) {
      latestRef.current.onConfigChange(snapshot.config);
    }
    setMeta({
      name: snapshot.name,
      color: snapshot.color,
      cover: snapshot.cover,
    });
    snapshotRef.current = null;
  };

  const commitSaved = (next: Draft): void => {
    if (!deepEqual(next.config, latestRef.current.config)) {
      latestRef.current.onConfigChange(next.config);
    }
    setMeta({ name: next.name, color: next.color, cover: next.cover });
    setSavedBaseline(next);
    snapshotRef.current = null;
  };

  return {
    draft,
    savedBaseline,
    isDirty,
    setDraft,
    openModalSnapshot,
    discard,
    commitSaved,
  };
};
