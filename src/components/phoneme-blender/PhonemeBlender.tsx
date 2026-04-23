import { useCallback, useMemo, useRef, useState } from 'react';
import { usePhonemeSprite } from './usePhonemeSprite';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { playPhoneme, stopPhoneme } from '#/data/words/phoneme-audio';
import { cn } from '#/lib/utils';

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
  const firedStops = useRef<Set<number>>(new Set());
  const [positionMs, setPositionMs] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
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
    } else if (firedStops.current.has(zone.index)) {
      // already fired this pass — skip
    } else {
      firedStops.current.add(zone.index);
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

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    firedStops.current = new Set();
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

  return (
    <div
      data-word={word}
      className="flex flex-col gap-2 rounded-xl bg-purple-50 p-3"
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
                    : 'text-purple-200',
              )}
            >
              {z.g}
            </span>
          );
        })}
      </div>
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
        className="relative flex h-10 w-full touch-none overflow-hidden rounded-xl border border-foreground/20"
      >
        {zones.map((z) => (
          <div
            key={z.index}
            data-zone-index={z.index}
            style={{ flexGrow: String(z.durationMs), flexBasis: '0px' }}
            className={cn(
              'h-full border-r border-white/60 last:border-r-0',
              z.loopable ? 'bg-purple-500' : 'bg-yellow-400',
              activeIndex === z.index &&
                'ring-2 ring-foreground ring-inset',
            )}
          />
        ))}
      </div>
    </div>
  );
};
