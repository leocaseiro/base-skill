import { useMemo } from 'react';
import { usePhonemeSprite } from './usePhonemeSprite';
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

export const PhonemeBlender = ({
  word,
  graphemes,
  phonemeOverrides,
}: PhonemeBlenderProps) => {
  const sprite = usePhonemeSprite();

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

  return (
    <div
      data-word={word}
      className="flex flex-col gap-2 rounded-xl bg-purple-50 p-3"
    >
      <div
        aria-hidden="true"
        className="flex items-baseline justify-center gap-1 font-semibold tracking-wide"
      >
        {zones.map((z) => (
          <span
            key={z.index}
            data-testid={`letter-${z.index}`}
            data-idx={z.index}
            className="text-purple-200"
          >
            {z.g}
          </span>
        ))}
      </div>
      <div
        role="slider"
        tabIndex={0}
        aria-label={`Blend /${word}/`}
        aria-valuemin={0}
        aria-valuemax={totalMs}
        aria-valuenow={0}
        className="relative flex h-10 w-full overflow-hidden rounded-xl border border-foreground/20"
      >
        {zones.map((z) => (
          <div
            key={z.index}
            data-zone-index={z.index}
            style={{ flexGrow: String(z.durationMs), flexBasis: '0px' }}
            className={cn(
              'h-full border-r border-white/60 last:border-r-0',
              z.loopable ? 'bg-purple-500' : 'bg-yellow-400',
            )}
          />
        ))}
      </div>
    </div>
  );
};
