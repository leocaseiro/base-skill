import { useMemo, useState } from 'react';
import { getRegisteredSkins } from './registry';
import type { GameSkin } from './game-skin';
import type { ReactNode } from 'react';
import { getGameEventBus } from '@/lib/game-event-bus';

export interface SkinHarnessProps {
  gameId: string;
  children: (ctx: { skin: GameSkin }) => ReactNode;
}

export const SkinHarness = ({ gameId, children }: SkinHarnessProps) => {
  const registered = useMemo(
    () => getRegisteredSkins(gameId),
    [gameId],
  );
  const [skinId, setSkinId] = useState<string>(registered[0]!.id);
  const skin =
    registered.find((s) => s.id === skinId) ?? registered[0]!;

  const bus = getGameEventBus();
  const emit = (type: string, extra: Record<string, unknown>) => {
    bus.emit({
      type,
      gameId,
      sessionId: '',
      profileId: '',
      timestamp: Date.now(),
      roundIndex: 0,
      ...extra,
    } as never);
  };

  return (
    <div className="skin-harness">
      <div
        aria-label="Skin harness toolbar"
        className="skin-harness-toolbar flex flex-wrap items-center gap-2 border-b p-3"
      >
        <label className="flex items-center gap-1 text-sm">
          Skin
          <select
            value={skinId}
            onChange={(e) => setSkinId(e.target.value)}
            className="rounded border px-2 py-1"
          >
            {registered.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <span className="mx-2 h-5 w-px bg-border" aria-hidden="true" />

        <button
          type="button"
          onClick={() =>
            emit('game:evaluate', {
              answer: 'A',
              correct: true,
              nearMiss: false,
              zoneIndex: 0,
            })
          }
        >
          onCorrectPlace
        </button>
        <button
          type="button"
          onClick={() =>
            emit('game:evaluate', {
              answer: 'Z',
              correct: false,
              nearMiss: false,
              zoneIndex: 0,
            })
          }
        >
          onWrongPlace
        </button>
        <button
          type="button"
          onClick={() =>
            emit('game:tile-ejected', { zoneIndex: 0, tileId: null })
          }
        >
          onTileEjected
        </button>
        <button
          type="button"
          onClick={() => emit('game:drag-start', { tileId: 'mock' })}
        >
          onDragStart
        </button>
        <button
          type="button"
          onClick={() => emit('game:drag-over-zone', { zoneIndex: 0 })}
        >
          onDragOverZone
        </button>

        <span className="mx-2 h-5 w-px bg-border" aria-hidden="true" />

        <button
          type="button"
          onClick={() => emit('game:round-advance', {})}
        >
          onRoundComplete
        </button>
        <button
          type="button"
          onClick={() => emit('game:level-advance', { levelIndex: 0 })}
        >
          onLevelComplete
        </button>
        <button
          type="button"
          onClick={() =>
            emit('game:end', {
              finalScore: 0,
              totalRounds: 1,
              correctCount: 1,
              durationMs: 100,
              retryCount: 0,
            })
          }
        >
          onGameOver
        </button>
      </div>

      <div className="skin-harness-stage p-4">{children({ skin })}</div>
    </div>
  );
};
