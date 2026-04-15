import type { ProgressHUDProps } from '../types';

export const ProgressHUD = ({
  roundIndex,
  totalRounds,
  levelIndex,
  isLevelMode,
  phase,
  showDots,
  showFraction,
  showLevel,
}: ProgressHUDProps) => {
  if (!showDots && !showFraction && !showLevel) return null;

  const dotCount = isLevelMode ? levelIndex + 1 : (totalRounds ?? 0);
  const filledIndex = isLevelMode ? levelIndex : roundIndex;
  const canShowFraction = showFraction && totalRounds !== null;

  return (
    <div
      className="skin-hud group flex items-center gap-[var(--skin-hud-gap)] rounded-[var(--skin-hud-radius)] bg-[var(--skin-hud-bg)] px-[0.75rem] py-[0.25rem]"
      data-phase={phase}
    >
      {showLevel ? (
        <span
          className="skin-hud__level font-extrabold tracking-widest text-[color:var(--skin-hud-level-color)]"
          aria-live="polite"
        >
          LEVEL {levelIndex + 1}
        </span>
      ) : null}
      {showDots ? (
        <ol
          className="skin-hud__dots flex items-center gap-[var(--skin-hud-gap)]"
          aria-label="round progress"
        >
          {Array.from({ length: dotCount }).map((_, i) => (
            <li
              // eslint-disable-next-line react/no-array-index-key -- dots are positional and never reordered; index is the stable key
              key={`dot-${i}`}
              className="skin-hud__dot block size-[var(--skin-hud-dot-size)] rounded-full border border-[color:var(--skin-hud-dot-border)] data-[state=done]:bg-[color:var(--skin-hud-dot-fill)] data-[state=current]:bg-[color:var(--skin-hud-dot-fill)] data-[state=current]:ring-4 data-[state=current]:ring-[color:var(--skin-hud-dot-fill)]/25 data-[state=todo]:bg-[color:var(--skin-hud-dot-empty)] motion-safe:data-[state=current]:group-data-[phase=round-complete]:animate-pulse"
              data-state={
                i < filledIndex
                  ? 'done'
                  : i === filledIndex
                    ? 'current'
                    : 'todo'
              }
            />
          ))}
        </ol>
      ) : null}
      {canShowFraction ? (
        <span
          className="skin-hud__fraction font-extrabold text-[color:var(--skin-hud-fraction-color)]"
          aria-live="polite"
        >
          {roundIndex + 1}
          <span className="skin-hud__fraction-sep mx-0.5 text-[color:var(--skin-hud-fraction-sep-color)]">
            /
          </span>
          {totalRounds}
        </span>
      ) : null}
    </div>
  );
};
