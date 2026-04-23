import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePhonemeSprite } from './usePhonemeSprite';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import { playPhoneme, stopPhoneme } from '#/data/words/phoneme-audio';
import { cn } from '#/lib/utils';

type Speed = 'slow' | 'normal' | 'fast';

const SPEED_MULTIPLIERS: Record<Speed, number> = {
  slow: 1.6,
  normal: 1,
  fast: 0.55,
};

const SPEED_LABELS: Record<Speed, string> = {
  slow: '🐢 slow',
  normal: '🐈 normal',
  fast: '🐇 fast',
};

const SPEEDS: readonly Speed[] = ['slow', 'normal', 'fast'];

export interface PhonemeBlenderProps {
  word: string;
  graphemes: ReadonlyArray<{ g: string; p: string }>;
  phonemeOverrides?: Record<
    string,
    { durationMs?: number; loopable?: boolean }
  >;
}

interface ResolvedZone {
  index: number;
  g: string;
  p: string;
  durationMs: number;
  loopable: boolean;
  startMs: number;
}

const DEFAULT_DURATION = 400;

const zoneFromMs = (
  zones: readonly ResolvedZone[],
  ms: number,
): ResolvedZone | null => {
  for (const z of zones) {
    if (ms >= z.startMs && ms < z.startMs + z.durationMs) return z;
  }
  return zones.at(-1) ?? null;
};

export const PhonemeBlender = ({
  word,
  graphemes,
  phonemeOverrides,
}: PhonemeBlenderProps) => {
  const sprite = usePhonemeSprite();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [positionMs, setPositionMs] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>('normal');
  const [passedSet, setPassedSet] = useState<ReadonlySet<number>>(
    () => new Set(),
  );

  const zones = useMemo<ResolvedZone[]>(() => {
    const durations = graphemes.map((gp) => {
      const spriteEntry = sprite?.[gp.p];
      const override = phonemeOverrides?.[gp.p];
      return (
        override?.durationMs ??
        spriteEntry?.duration ??
        DEFAULT_DURATION
      );
    });
    const starts: number[] = [];
    let running = 0;
    for (const d of durations) {
      starts.push(running);
      running += d;
    }
    return graphemes.map((gp, index) => ({
      index,
      g: gp.g,
      p: gp.p,
      durationMs: durations[index]!,
      loopable: Boolean(
        phonemeOverrides?.[gp.p]?.loopable ??
        sprite?.[gp.p]?.loopable ??
        false,
      ),
      startMs: starts[index]!,
    }));
  }, [graphemes, sprite, phonemeOverrides]);

  const totalMs = zones.reduce((acc, z) => acc + z.durationMs, 0);

  const enterZone = useCallback((zone: ResolvedZone) => {
    setActiveIndex(zone.index);
    setPassedSet((prev) => {
      const next = new Set(prev);
      next.add(zone.index);
      return next;
    });
    if (zone.loopable) {
      void playPhoneme(zone.p, { sustain: true });
    } else {
      stopPhoneme();
      void playPhoneme(zone.p);
    }
  }, []);

  const msFromClientX = useCallback(
    (clientX: number): number => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return 0;
      const pct = (clientX - rect.left) / rect.width;
      return Math.max(0, Math.min(totalMs, pct * totalMs));
    },
    [totalMs],
  );

  const updateFromClientX = useCallback(
    (clientX: number, prevIndex: number | null): number | null => {
      const ms = msFromClientX(clientX);
      setPositionMs(ms);
      const zone = zoneFromMs(zones, ms);
      if (!zone) return null;
      if (zone.index !== prevIndex) {
        enterZone(zone);
      }
      return zone.index;
    },
    [msFromClientX, zones, enterZone],
  );

  const stopAutoPlay = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setPlaying(false);
    setActiveIndex(null);
    stopPhoneme();
  }, []);

  const startAutoPlay = useCallback(() => {
    if (zones.length === 0) return;
    setPassedSet(new Set());
    setPlaying(true);
    const t0 = performance.now();
    const multiplier = SPEED_MULTIPLIERS[speed];
    let lastEntered = -1;
    const tick = (): void => {
      const elapsed = (performance.now() - t0) / multiplier;
      const clamped = Math.min(totalMs, elapsed);
      setPositionMs(clamped);
      const zone = zoneFromMs(zones, clamped);
      if (zone && zone.index !== lastEntered) {
        lastEntered = zone.index;
        enterZone(zone);
      }
      if (elapsed >= totalMs) {
        stopAutoPlay();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [zones, speed, totalMs, enterZone, stopAutoPlay]);

  useEffect(
    () => () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    },
    [],
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setPassedSet(new Set());
    setDragging(true);
    updateFromClientX(e.clientX, null);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    updateFromClientX(e.clientX, activeIndex);
  };

  const endDrag = () => {
    setDragging(false);
    setActiveIndex(null);
    stopPhoneme();
  };

  const stepToZone = (zone: ResolvedZone) => {
    setPositionMs(zone.startMs);
    enterZone(zone);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (zones.length === 0) return;
    const current = activeIndex ?? -1;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown': {
        e.preventDefault();
        stepToZone(zones[Math.min(zones.length - 1, current + 1)]!);
        break;
      }
      case 'ArrowLeft':
      case 'ArrowUp': {
        e.preventDefault();
        stepToZone(zones[Math.max(0, current - 1)]!);
        break;
      }
      case 'Home': {
        e.preventDefault();
        stepToZone(zones[0]!);
        break;
      }
      case 'End': {
        e.preventDefault();
        stepToZone(zones.at(-1)!);
        break;
      }
      case ' ':
      case 'Enter': {
        e.preventDefault();
        if (playing) {
          stopAutoPlay();
        } else {
          startAutoPlay();
        }
        break;
      }
      default: {
        break;
      }
    }
  };

  return (
    <div
      data-word={word}
      style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
      className="flex touch-none select-none flex-col gap-2 rounded-xl bg-purple-50 p-3"
    >
      <div
        aria-hidden="true"
        className="flex items-baseline justify-center gap-1 font-semibold tracking-wide"
      >
        {zones.map((z) => {
          const isActive = activeIndex === z.index;
          const isPassed = passedSet.has(z.index) && !isActive;
          return (
            <span
              key={z.index}
              data-testid={`letter-${z.index}`}
              data-idx={z.index}
              className={cn(
                isActive
                  ? 'text-foreground'
                  : isPassed
                    ? 'text-purple-700'
                    : 'text-neutral-600',
              )}
            >
              {z.g}
            </span>
          );
        })}
      </div>
      <div className="relative">
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label={`Blend /${word}/`}
          aria-valuemin={0}
          aria-valuemax={totalMs}
          aria-valuenow={Math.round(positionMs)}
          aria-valuetext={
            activeIndex === null
              ? undefined
              : `${zones[activeIndex]!.g} /${zones[activeIndex]!.p}/`
          }
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={() => {
            if (dragging) endDrag();
          }}
          onKeyDown={onKeyDown}
          onContextMenu={(e) => {
            e.preventDefault();
          }}
          style={{ WebkitTouchCallout: 'none' }}
          className="flex h-10 w-full touch-none select-none overflow-hidden rounded-xl border border-foreground/20"
        >
          {zones.map((z) => (
            <div
              key={z.index}
              data-zone-index={z.index}
              style={{
                flexGrow: String(z.durationMs),
                flexBasis: '0px',
              }}
              className={cn(
                'h-full border-r border-white/60 last:border-r-0',
                z.loopable ? 'bg-purple-500' : 'bg-yellow-400',
                activeIndex === z.index &&
                  'ring-2 ring-foreground ring-inset',
              )}
            />
          ))}
        </div>
        <div
          data-testid="playhead"
          aria-hidden="true"
          style={{
            left: `${totalMs > 0 ? (positionMs / totalMs) * 100 : 0}%`,
          }}
          className="pointer-events-none absolute top-1/2 z-10 h-12 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-foreground bg-background shadow-md"
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label={playing ? 'Pause' : `Play /${word}/`}
          onClick={() => {
            if (playing) {
              stopAutoPlay();
            } else {
              startAutoPlay();
            }
          }}
          className="inline-flex size-9 items-center justify-center rounded-full border-2 border-foreground bg-background text-lg"
        >
          {playing ? '⏸' : '▶'}
        </button>
        <div role="radiogroup" className="flex gap-1 text-xs">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={speed === s}
              aria-label={SPEED_LABELS[s]}
              onClick={() => {
                setSpeed(s);
              }}
              className={cn(
                'rounded-md border border-input px-2 py-1 transition-colors',
                speed === s
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted',
              )}
            >
              {SPEED_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
