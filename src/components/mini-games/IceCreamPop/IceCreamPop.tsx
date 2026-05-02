import { useCallback, useEffect, useRef, useState } from 'react';

interface IceCreamPopProps {
  maxScoops?: number;
  onComplete?: (scoops: number) => void;
}

const SCOOP_COLORS = [
  'bg-pink-300',
  'bg-yellow-100',
  'bg-amber-800',
  'bg-green-300',
  'bg-purple-300',
] as const;

const SCOOP_HIGHLIGHT_COLORS = [
  'bg-pink-100',
  'bg-yellow-50',
  'bg-amber-600',
  'bg-green-100',
  'bg-purple-100',
] as const;

const getStarRating = (scoops: number): number => {
  if (scoops < 5) return 1;
  if (scoops < 10) return 2;
  if (scoops < 14) return 3;
  if (scoops < 17) return 4;
  return 5;
};

const getStabilityColor = (wobble: number): string => {
  if (wobble <= 50) return 'bg-green-500';
  if (wobble <= 75) return 'bg-yellow-400';
  if (wobble <= 90) return 'bg-orange-500';
  return 'bg-red-600';
};

const getWobbleClass = (wobble: number): string => {
  if (wobble <= 30) return '';
  if (wobble <= 60) return 'wobble-mild';
  if (wobble <= 85) return 'wobble-strong';
  return 'wobble-severe';
};

export const IceCreamPop = ({
  maxScoops = 15,
  onComplete,
}: IceCreamPopProps) => {
  const [scoops, setScoops] = useState(0);
  const [wobble, setWobble] = useState(0);
  const [fallen, setFallen] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [gameStarted, setGameStarted] = useState(false);
  const [fellDirection, setFellDirection] = useState<'left' | 'right'>(
    'left',
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completeTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const triggerFall = useCallback((finalScoops: number) => {
    const direction = Math.random() < 0.5 ? 'left' : 'right';
    setFellDirection(direction);
    setFallen(true);

    if (timerRef.current) {
      globalThis.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    completeTimeoutRef.current = globalThis.setTimeout(() => {
      onCompleteRef.current?.(finalScoops);
    }, 1500);
  }, []);

  const handleTap = useCallback(() => {
    if (fallen || timeUp) return;

    if (!gameStarted) {
      setGameStarted(true);
    }

    setScoops((prevScoops) => {
      const newScoops = prevScoops + 1;

      setWobble((prevWobble) => {
        const baseIncrease = 5 + Math.random() * 10;
        const bonusIncrease = newScoops % 5 === 0 ? 5 : 0;
        const newWobble = Math.min(
          100,
          prevWobble + baseIncrease + bonusIncrease,
        );

        if (newWobble >= 100 || newScoops >= maxScoops) {
          globalThis.setTimeout(() => triggerFall(newScoops), 0);
        }

        return newWobble;
      });

      return newScoops;
    });
  }, [fallen, timeUp, gameStarted, maxScoops, triggerFall]);

  useEffect(() => {
    if (!gameStarted || fallen || timeUp) return;

    timerRef.current = globalThis.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimeUp(true);
          if (timerRef.current) {
            globalThis.clearInterval(timerRef.current);
            timerRef.current = null;
          }
          completeTimeoutRef.current = globalThis.setTimeout(() => {
            onCompleteRef.current?.(scoops);
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        globalThis.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scoops captured at time-up intentionally
  }, [gameStarted, fallen, timeUp]);

  useEffect(
    () => () => {
      if (timerRef.current) globalThis.clearInterval(timerRef.current);
      if (completeTimeoutRef.current)
        globalThis.clearTimeout(completeTimeoutRef.current);
    },
    [],
  );

  const isGameOver = fallen || timeUp;
  const stability = 100 - wobble;
  const stabilityColor = getStabilityColor(wobble);
  const wobbleClass = getWobbleClass(wobble);
  const stars = getStarRating(scoops);

  const towerStyle: React.CSSProperties = fallen
    ? {
        transform: `rotate(${fellDirection === 'left' ? -90 : 90}deg) translateX(${fellDirection === 'left' ? '-50%' : '50%'})`,
        transition: 'transform 0.8s ease-in',
        transformOrigin: 'bottom center',
      }
    : {};

  const severeBorderClass =
    wobble >= 85 && !fallen
      ? 'ring-4 ring-red-500 ring-opacity-80'
      : '';

  return (
    <div className="relative flex h-full min-h-screen flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-sky-300 to-pink-100 select-none">
      <style>{`
        @keyframes wobbleMild {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-3deg); }
          75% { transform: rotate(3deg); }
        }
        @keyframes wobbleStrong {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-7deg); }
          40% { transform: rotate(7deg); }
          60% { transform: rotate(-5deg); }
          80% { transform: rotate(5deg); }
        }
        @keyframes wobbleSevere {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(-12deg); }
          30% { transform: rotate(12deg); }
          50% { transform: rotate(-10deg); }
          70% { transform: rotate(10deg); }
          90% { transform: rotate(-8deg); }
        }
        .wobble-mild {
          animation: wobbleMild 0.8s ease-in-out infinite;
        }
        .wobble-strong {
          animation: wobbleStrong 0.5s ease-in-out infinite;
        }
        .wobble-severe {
          animation: wobbleSevere 0.3s ease-in-out infinite;
        }
      `}</style>

      {/* Timer */}
      <div className="mt-4 rounded-full bg-white/70 px-4 py-2 text-xl font-bold text-slate-700 shadow">
        {gameStarted ? `⏱ ${timeLeft}s` : '⏱ 20s'}
      </div>

      {/* Ice cream tower — tappable area */}
      <div
        className="flex flex-1 cursor-pointer flex-col items-center justify-end pb-4"
        onClick={handleTap}
        role="button"
        tabIndex={0}
        aria-label="Tap to add a scoop"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleTap();
        }}
      >
        {/* Instruction before first tap */}
        {!gameStarted && !isGameOver && (
          <div className="mb-6 rounded-2xl bg-white/80 px-6 py-3 text-center text-2xl font-bold text-pink-600 shadow-lg">
            Tap to stack! 🍦
          </div>
        )}

        {/* Tower wrapper with wobble + fall animation */}
        <div
          className={`flex flex-col-reverse items-center ${fallen ? '' : wobbleClass} ${severeBorderClass} rounded-xl p-1`}
          style={fallen ? towerStyle : {}}
        >
          {/* Scoops stack — rendered in reverse so latest is visually on top */}
          <div className="flex flex-col-reverse items-center">
            {Array.from({ length: scoops }).map((_, index) => {
              const colorClass = SCOOP_COLORS[index % 5];
              const highlightClass = SCOOP_HIGHLIGHT_COLORS[index % 5];
              const marginTop = index === 0 ? '0px' : '-20px';
              return (
                <div
                  key={index} // eslint-disable-line react/no-array-index-key -- scoop array is append-only and order never changes
                  className={`relative rounded-full ${colorClass} h-[70px] w-[70px] shadow-md`}
                  style={{ marginTop }}
                >
                  {/* Highlight glint */}
                  <div
                    className={`absolute left-2 top-2 h-5 w-5 rounded-full ${highlightClass} opacity-40`}
                  />
                </div>
              );
            })}
          </div>

          {/* Cone */}
          <div
            className="h-[100px] w-[80px] bg-amber-600"
            style={{
              clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)',
              marginTop: scoops > 0 ? '-10px' : '0',
            }}
          />
        </div>

        {/* Scoop counter */}
        {scoops > 0 && !isGameOver && (
          <div className="mt-3 rounded-full bg-white/70 px-4 py-1 text-lg font-bold text-amber-700">
            {scoops} {scoops === 1 ? 'scoop' : 'scoops'}
          </div>
        )}
      </div>

      {/* Stability bar */}
      <div className="mb-4 w-full max-w-xs px-4">
        <div className="mb-1 flex items-center justify-between text-sm font-semibold text-slate-700">
          <span>Stability</span>
          <span>{stability.toFixed(0)}%</span>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-white/50 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-300 ${stabilityColor}`}
            style={{ width: `${stability}%` }}
          />
        </div>
      </div>

      {/* Game over overlay */}
      {isGameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 max-w-sm rounded-3xl bg-white/95 px-8 py-8 text-center shadow-2xl">
            <div className="mb-2 text-6xl">🍦</div>
            <div className="mb-1 text-4xl font-extrabold text-pink-600">
              {scoops} {scoops === 1 ? 'scoop' : 'scoops'}!
            </div>
            <div className="mb-4 text-lg font-semibold text-slate-600">
              {fallen ? 'The tower fell!' : "Time's up!"}
            </div>
            <div className="mb-2 text-3xl tracking-wide">
              {'⭐'.repeat(stars)}
            </div>
            <div className="text-sm text-slate-500">
              {stars === 1 && 'Keep practising!'}
              {stars === 2 && 'Good effort!'}
              {stars === 3 && 'Nice stacking!'}
              {stars === 4 && 'Amazing tower!'}
              {stars === 5 && 'Ice cream master! 🏆'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
