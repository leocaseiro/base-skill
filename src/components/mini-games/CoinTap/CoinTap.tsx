import confetti from 'canvas-confetti';
import { useCallback, useEffect, useRef, useState } from 'react';

interface CoinTapProps {
  starRating?: 1 | 2 | 3 | 4 | 5;
  onComplete?: (coins: number) => void;
}

const getDuration = (stars: number): number => stars * 5;

const getStarsFromCoins = (coins: number): number => {
  if (coins < 10) return 1;
  if (coins < 20) return 2;
  if (coins < 35) return 3;
  if (coins < 50) return 4;
  return 5;
};

const StarDisplay = ({ count }: { count: number }) => (
  <div className="flex justify-center gap-1 text-4xl">
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={star <= count ? 'opacity-100' : 'opacity-30'}
      >
        ⭐
      </span>
    ))}
  </div>
);

export const CoinTap = ({
  starRating = 3,
  onComplete,
}: CoinTapProps) => {
  const totalDuration = getDuration(starRating);

  const [coins, setCoins] = useState(0);
  const [timeLeft, setTimeLeft] = useState(totalDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [streak, setStreak] = useState(0);
  const [popKey, setPopKey] = useState(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const coinsRef = useRef(coins);
  coinsRef.current = coins;

  const handleComplete = useCallback(() => {
    setIsComplete(true);
    void confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FFE066', '#FFEC8B', '#FFF8DC'],
    });
    onCompleteRef.current?.(coinsRef.current);
  }, []);

  useEffect(() => {
    if (!isRunning || isComplete) return;

    const interval = globalThis.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          globalThis.clearInterval(interval);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      globalThis.clearInterval(interval);
    };
  }, [isRunning, isComplete, handleComplete]);

  const handleCoinTap = (): void => {
    if (isComplete) return;

    if (!isRunning) {
      setIsRunning(true);
    }

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;

    setCoins((prev) => prev + 1);
    setLastTapTime(now);
    setPopKey((prev) => prev + 1);

    if (timeSinceLastTap <= 300 && lastTapTime !== 0) {
      setStreak((prev) => prev + 1);
    } else {
      setStreak(1);
    }
  };

  const progressPercent =
    totalDuration > 0 ? (timeLeft / totalDuration) * 100 : 0;

  const timerBarColor =
    progressPercent > 50
      ? 'bg-green-400'
      : progressPercent > 25
        ? 'bg-orange-400'
        : 'bg-red-400';

  const coinSize = coins >= 100 ? 'text-[10rem]' : 'text-[8rem]';

  const goldGlowStyle =
    streak >= 10
      ? {
          filter: `drop-shadow(0 0 ${String(Math.min(streak, 20))}px gold) drop-shadow(0 0 ${String(Math.min(streak * 2, 40))}px rgba(255,215,0,0.6))`,
        }
      : streak >= 5
        ? {
            filter: `drop-shadow(0 0 8px gold)`,
          }
        : undefined;

  if (isComplete) {
    const earnedStars = getStarsFromCoins(coins);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-yellow-950 to-amber-900 p-8 text-center">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-black/30 p-10">
          <div className="text-6xl">🎉</div>
          <h1 className="text-3xl font-bold text-yellow-300">
            You collected {coins} coins! 🪙
          </h1>
          <StarDisplay count={earnedStars} />
          <p className="text-lg text-yellow-100/80">
            {earnedStars >= 4
              ? 'Amazing tapping!'
              : earnedStars >= 3
                ? 'Great job!'
                : earnedStars >= 2
                  ? 'Nice work!'
                  : 'Keep practising!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-yellow-950 to-amber-900 p-6">
      {/* Timer bar */}
      <div className="w-full max-w-sm">
        <div className="mb-2 flex items-center justify-between text-yellow-300">
          <span className="text-sm font-semibold uppercase tracking-wide">
            Time
          </span>
          <span className="text-2xl font-bold tabular-nums">
            {timeLeft}s
          </span>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-black/40">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${timerBarColor}`}
            style={{ width: `${String(progressPercent)}%` }}
          />
        </div>
      </div>

      {/* Coin */}
      <button
        key={popKey}
        type="button"
        onClick={handleCoinTap}
        aria-label="Tap the coin"
        className={`animate-pop cursor-pointer select-none leading-none ${coinSize}`}
        style={goldGlowStyle}
      >
        🪙
      </button>

      {/* Coin counter */}
      <p className="text-4xl font-bold text-yellow-300">
        {coins} coin{coins !== 1 ? 's' : ''}
      </p>

      {/* Streak display */}
      {streak >= 5 && (
        <div className="animate-bounce rounded-2xl bg-orange-500/80 px-6 py-3 text-xl font-bold text-white shadow-lg">
          🔥 x{streak} COMBO!
        </div>
      )}

      {/* Before first tap instruction */}
      {!isRunning && (
        <p className="animate-pulse text-lg font-semibold text-yellow-200/80">
          Tap the coin!
        </p>
      )}
    </div>
  );
};
