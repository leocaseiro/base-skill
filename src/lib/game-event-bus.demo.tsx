import { useEffect, useRef, useState } from 'react';
import { createGameEventBus } from './game-event-bus';
import type { GameEvent } from '#/types/game-events';
import { Button } from '#/components/ui/button';

const base = {
  gameId: 'demo',
  sessionId: 'demo-session',
  profileId: 'anonymous',
  timestamp: Date.now(),
  roundIndex: 0,
};

export const GameEventBusDemo = () => {
  const busRef = useRef(createGameEventBus());
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = busRef.current.subscribe(
      'game:*',
      (event: GameEvent) => {
        setLog((prev) => [
          `[${event.type}] ${JSON.stringify(event)}`,
          ...prev.slice(0, 9),
        ]);
      },
    );
    return unsubscribe;
  }, []);

  const emitStart = () => {
    const event: GameEvent = {
      type: 'game:start',
      ...base,
      locale: 'en',
      difficulty: 'easy',
      gradeBand: 'k',
    };
    busRef.current.emit(event);
  };

  const emitEnd = () => {
    const event: GameEvent = {
      type: 'game:end',
      ...base,
      finalScore: 0,
      totalRounds: 1,
      correctCount: 0,
      durationMs: 0,
      retryCount: 0,
    };
    busRef.current.emit(event);
  };

  const emitInstructions = () => {
    const event: GameEvent = {
      type: 'game:instructions_shown',
      ...base,
    };
    busRef.current.emit(event);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={emitStart}>
          Emit game:start
        </Button>
        <Button size="sm" onClick={emitEnd}>
          Emit game:end
        </Button>
        <Button size="sm" onClick={emitInstructions}>
          Emit game:instructions_shown
        </Button>
      </div>
      <div className="rounded border p-2 font-mono text-xs">
        {log.length === 0 ? (
          <span className="text-muted-foreground">
            No events yet — click a button above.
          </span>
        ) : (
          log.map((entry) => <div key={entry}>{entry}</div>)
        )}
      </div>
    </div>
  );
};
