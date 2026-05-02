import confetti from 'canvas-confetti';
import { useCallback, useEffect, useRef, useState } from 'react';

interface CoinChestProps {
  starRating?: 1 | 2 | 3 | 4 | 5; // default 3
  onComplete?: (coins: number) => void;
}

const DIFFICULTY = {
  1: { coinCount: 8, speed: 0.6, collectWindow: 20 },
  2: { coinCount: 12, speed: 0.8, collectWindow: 16 },
  3: { coinCount: 16, speed: 1.0, collectWindow: 13 },
  4: { coinCount: 20, speed: 1.3, collectWindow: 10 },
  5: { coinCount: 25, speed: 1.6, collectWindow: 8 },
} as const;

interface Coin {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  collected: boolean;
  fading: boolean;
  opacity: number;
  hasBounced: boolean;
}

type Phase = 'closed' | 'opening' | 'collecting' | 'complete';

const GRAVITY = 0.4;
const BOUNCE_DAMPING = 0.5;
const FLOOR_Y = 0.85;

const getStarResult = (score: number, coinCount: number): number => {
  const pct = score / coinCount;
  if (pct >= 0.9) return 5;
  if (pct >= 0.7) return 4;
  if (pct >= 0.5) return 3;
  if (pct >= 0.3) return 2;
  return 1;
};

export const CoinChest = ({
  starRating = 3,
  onComplete,
}: CoinChestProps) => {
  const { coinCount, speed, collectWindow } = DIFFICULTY[starRating];

  const [phase, setPhase] = useState<Phase>('closed');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(collectWindow);
  const [renderCoins, setRenderCoins] = useState<Coin[]>([]);
  const [scorePopped, setScorePopped] = useState(false);
  const [isLidOpen, setIsLidOpen] = useState(false);
  const [resultStars, setResultStars] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const coinsRef = useRef<Coin[]>([]);
  const rafRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const phaseRef = useRef<Phase>('closed');
  const startTimeRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const timerIntervalRef = useRef<ReturnType<
    typeof setInterval
  > | null>(null);

  // Keep phaseRef in sync
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      globalThis.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timerIntervalRef.current !== null) {
      globalThis.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const spawnCoins = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { clientWidth: w, clientHeight: h } = container;
    const chestX = w / 2;
    const chestY = h * 0.72;

    const newCoins: Coin[] = Array.from(
      { length: coinCount },
      (_, i) => {
        const angle = Math.random() * Math.PI - Math.PI; // -π to 0 (upward arc)
        const power = (3 + Math.random() * 7) * speed;
        const vx = Math.cos(angle) * power;
        const vy = Math.sin(angle) * power - 2;

        return {
          id: i,
          x: chestX - 20,
          y: chestY - 20,
          vx,
          vy,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          collected: false,
          fading: false,
          opacity: 1,
          hasBounced: false,
        };
      },
    );

    coinsRef.current = newCoins;
    setRenderCoins([...newCoins]);
  }, [coinCount, speed]);

  const startPhysicsLoop = useCallback(() => {
    startTimeRef.current = Date.now();

    const loop = () => {
      if (phaseRef.current !== 'collecting') return;

      const container = containerRef.current;
      if (!container) return;

      const { clientWidth: w, clientHeight: h } = container;
      const floorPx = h * FLOOR_Y;
      const elapsedTime = Date.now() - startTimeRef.current;

      for (const coin of coinsRef.current) {
        if (coin.collected) continue;

        coin.vy += GRAVITY * speed;
        coin.vx *= 0.99;
        coin.x += coin.vx;
        coin.y += coin.vy;
        coin.rotation += coin.rotationSpeed;

        if (coin.y >= floorPx && coin.vy > 0 && !coin.hasBounced) {
          coin.vy *= -BOUNCE_DAMPING;
          coin.hasBounced = true;
        }

        if (coin.y > h + 60) {
          coin.opacity = 0;
          coin.collected = true;
        }

        if (elapsedTime > collectWindow * 0.6 * 1000) {
          coin.opacity = Math.max(0, coin.opacity - 0.01 * speed);
          if (coin.opacity <= 0) {
            coin.collected = true;
          }
        }

        // Keep x roughly in bounds but allow natural overflow
        if (coin.x < -w * 0.5) coin.vx = Math.abs(coin.vx) * 0.5;
        if (coin.x > w * 1.5) coin.vx = -Math.abs(coin.vx) * 0.5;
      }

      frameCountRef.current += 1;
      if (frameCountRef.current % 3 === 0) {
        setRenderCoins([...coinsRef.current]);
      }

      const allGone = coinsRef.current.every((c) => c.collected);
      if (allGone) {
        stopLoop();
        setPhase('complete');
        phaseRef.current = 'complete';
        return;
      }

      rafRef.current = globalThis.requestAnimationFrame(loop);
    };

    rafRef.current = globalThis.requestAnimationFrame(loop);
  }, [collectWindow, speed, stopLoop]);

  const startTimer = useCallback(() => {
    setTimeLeft(collectWindow);
    timerIntervalRef.current = globalThis.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          globalThis.clearInterval(timerIntervalRef.current!);
          timerIntervalRef.current = null;
          stopLoop();
          setPhase('complete');
          phaseRef.current = 'complete';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [collectWindow, stopLoop]);

  const handleChestTap = useCallback(() => {
    if (phase !== 'closed') return;
    setPhase('opening');
    phaseRef.current = 'opening';

    globalThis.setTimeout(() => {
      setIsLidOpen(true);
    }, 0);

    globalThis.setTimeout(() => {
      spawnCoins();
    }, 200);

    globalThis.setTimeout(() => {
      setPhase('collecting');
      phaseRef.current = 'collecting';
      startTimer();
      startPhysicsLoop();
    }, 1000);
  }, [phase, spawnCoins, startTimer, startPhysicsLoop]);

  const collectCoin = useCallback((id: number) => {
    if (phaseRef.current !== 'collecting') return;

    const coin = coinsRef.current.find((c) => c.id === id);
    if (!coin || coin.collected) return;

    coin.collected = true;
    scoreRef.current += 1;
    setScore(scoreRef.current);
    setScorePopped(true);
    globalThis.setTimeout(() => setScorePopped(false), 300);
  }, []);

  // Fire confetti and call onComplete when phase becomes complete
  useEffect(() => {
    if (phase !== 'complete') return;

    const stars = getStarResult(scoreRef.current, coinCount);
    setResultStars(stars);

    void confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#f59e0b', '#fcd34d', '#ffffff', '#fb923c'],
    });

    const timer = globalThis.setTimeout(() => {
      onComplete?.(scoreRef.current);
    }, 1500);

    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [phase, coinCount, onComplete]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      stopLoop();
    },
    [stopLoop],
  );

  const timerPercent = (timeLeft / collectWindow) * 100;

  return (
    <div
      ref={containerRef}
      className="relative flex h-full min-h-96 w-full flex-col items-center overflow-hidden bg-gradient-to-b from-amber-100 to-yellow-50"
    >
      {/* Score HUD */}
      {(phase === 'collecting' || phase === 'complete') && (
        <div className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-xl bg-white/80 px-3 py-1.5 shadow">
          <span className="text-xl">🪙</span>
          <span
            className={`text-lg font-bold text-amber-700 ${scorePopped ? 'animate-pop' : ''}`}
          >
            {score}
          </span>
        </div>
      )}

      {/* Timer HUD */}
      {phase === 'collecting' && (
        <div className="absolute left-4 top-4 z-20 w-28">
          <div className="mb-1 text-center text-sm font-bold text-amber-700">
            {timeLeft}s
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-amber-200">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-1000"
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Hint text during collecting */}
      {phase === 'collecting' && (
        <div className="absolute bottom-6 left-0 right-0 z-20 text-center text-sm font-semibold text-amber-600">
          Tap coins!
        </div>
      )}

      {/* Coins layer */}
      {(phase === 'collecting' || phase === 'complete') &&
        renderCoins.map((coin) => (
          <div
            key={coin.id}
            aria-label="coin"
            className="absolute z-10 cursor-pointer select-none text-4xl"
            role="button"
            style={{
              left: coin.x,
              top: coin.y,
              transform: `rotate(${coin.rotation}deg)`,
              opacity: coin.opacity,
              display: coin.collected ? 'none' : 'block',
            }}
            tabIndex={-1}
            onClick={() => collectCoin(coin.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ')
                collectCoin(coin.id);
            }}
          >
            🪙
          </div>
        ))}

      {/* Chest + closed/opening UI */}
      {(phase === 'closed' || phase === 'opening') && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <TreasureChest isOpen={isLidOpen} onTap={handleChestTap} />
          {phase === 'closed' && (
            <p className="animate-bounce text-lg font-bold text-amber-700">
              Tap to open!
            </p>
          )}
        </div>
      )}

      {/* Complete overlay */}
      {phase === 'complete' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/30">
          <div className="mx-4 flex flex-col items-center gap-4 rounded-2xl bg-white px-8 py-6 shadow-xl">
            <p className="text-center text-2xl font-bold text-amber-800">
              You caught {score} / {coinCount} coins!
            </p>
            <StarDisplay count={resultStars} />
          </div>
        </div>
      )}
    </div>
  );
};

interface TreasureChestProps {
  isOpen: boolean;
  onTap: () => void;
}

const TreasureChest = ({ isOpen, onTap }: TreasureChestProps) => (
  <button
    aria-label="treasure chest"
    className="relative mx-auto h-28 w-32 cursor-pointer border-none bg-transparent p-0"
    style={{ perspective: '400px' }}
    type="button"
    onClick={onTap}
  >
    {/* Lid */}
    <div
      aria-hidden="true"
      className="absolute left-0 top-0 h-[45%] w-full origin-top rounded-t-lg border-4 border-amber-900 bg-amber-700 transition-transform duration-700 ease-out"
      style={{
        transform: isOpen ? 'rotateX(-120deg)' : 'rotateX(0deg)',
        transformOrigin: 'top',
      }}
    >
      {/* Lid planks */}
      <div className="absolute inset-x-4 bottom-0 top-0 flex justify-around">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            aria-hidden="true"
            className="w-px bg-amber-600 opacity-50"
          />
        ))}
      </div>
    </div>

    {/* Interior (visible when open) */}
    <div
      aria-hidden="true"
      className="absolute left-1 right-1 top-[40%] h-[5%] rounded-sm bg-yellow-300"
    />

    {/* Body */}
    <div
      aria-hidden="true"
      className="absolute bottom-0 h-[60%] w-full rounded-b-lg border-4 border-amber-900 bg-amber-800"
    >
      {/* Wooden planks */}
      <div className="absolute inset-x-2 bottom-0 top-0 flex justify-around">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            aria-hidden="true"
            className="w-px bg-amber-700 opacity-50"
          />
        ))}
      </div>
      {/* Clasp */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400 shadow"
      />
    </div>
  </button>
);

interface StarDisplayProps {
  count: number;
}

const StarDisplay = ({ count }: StarDisplayProps) => (
  <div aria-label={`${count} stars`} className="flex gap-1" role="img">
    {[1, 2, 3, 4, 5].map((i) => (
      <span
        key={i}
        className={`text-3xl ${i <= count ? 'opacity-100' : 'opacity-20'}`}
      >
        ⭐
      </span>
    ))}
  </div>
);
