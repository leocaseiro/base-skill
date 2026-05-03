import confetti from 'canvas-confetti';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

interface BubblePopProps {
  bubbleCount?: number; // default 12
  onComplete?: () => void;
}

interface Bubble {
  id: number;
  x: number; // % from left (5–85 to avoid edges)
  y: number; // % from top (5–85)
  size: number; // px, 60–120
  hue: number; // 0–360, for hsl color
  driftAngle: number; // radians, for drift direction
  driftSpeed: number; // 0.03–0.08, drift animation speed
  popped: boolean;
  popping: boolean; // animation in progress
}

// Seeded pseudo-random number generator for stable bubble positions
const seededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 1_664_525 + 1_013_904_223) & 0xffff_ffff;
    return (s >>> 0) / 0x1_0000_0000;
  };
};

const generateBubbles = (count: number, seed: number): Bubble[] => {
  const rand = seededRandom(seed);
  const bubbles: Bubble[] = [];

  for (let index = 0; index < count; index++) {
    const hue = (index / count) * 360;
    const size = 60 + Math.floor(rand() * 61); // 60–120px

    let x = 0;
    let y = 0;
    let placed = false;

    for (let attempt = 0; attempt < 10; attempt++) {
      const candidateX = 5 + rand() * 80; // 5–85%
      const candidateY = 5 + rand() * 80; // 5–85%

      // Check overlap with existing bubbles
      let overlaps = false;
      for (const existing of bubbles) {
        // Convert to approximate pixel distance (assume 600px container for heuristic)
        const dx = ((candidateX - existing.x) / 100) * 600;
        const dy = ((candidateY - existing.y) / 100) * 400;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = (size + existing.size) / 2;
        if (dist < minDist) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        x = candidateX;
        y = candidateY;
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Place anyway after 10 failed attempts
      x = 5 + rand() * 80;
      y = 5 + rand() * 80;
    }

    bubbles.push({
      id: index,
      x,
      y,
      size,
      hue,
      driftAngle: rand() * Math.PI * 2,
      driftSpeed: 0.03 + rand() * 0.05, // 0.03–0.08
      popped: false,
      popping: false,
    });
  }

  return bubbles;
};

export const BubblePop = ({
  bubbleCount = 12,
  onComplete,
}: BubblePopProps) => {
  const seedRef = useRef<number>(Date.now());

  const initialBubbles = useMemo(
    () => generateBubbles(bubbleCount, seedRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bubbleCount is init-only; seed is stable ref
    [],
  );

  const [bubbles, setBubbles] = useState<Bubble[]>(initialBubbles);
  const [isComplete, setIsComplete] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const poppedCount = bubbles.filter((b) => b.popped).length;

  const handleBubbleClick = useCallback(
    (id: number) => {
      if (isComplete) return;

      setBubbles((prev) =>
        prev.map((b) =>
          b.id === id && !b.popped && !b.popping
            ? { ...b, popping: true }
            : b,
        ),
      );

      // After pop animation completes, mark as popped
      globalThis.setTimeout(() => {
        setBubbles((prev) => {
          const updated = prev.map((b) =>
            b.id === id ? { ...b, popping: false, popped: true } : b,
          );
          const allPopped = updated.every((b) => b.popped);
          if (allPopped) {
            setIsComplete(true);
            // Fire confetti celebration
            void confetti({
              particleCount: 150,
              spread: 80,
              origin: { x: 0.5, y: 0.5 },
              startVelocity: 40,
              gravity: 0.7,
              ticks: 300,
              colors: [
                '#ff6b6b',
                '#ffd93d',
                '#6bcb77',
                '#4d96ff',
                '#ff6bdb',
                '#ffb347',
              ],
            });
            onCompleteRef.current?.();
          }
          return updated;
        });
      }, 300);
    },
    [isComplete],
  );

  // Clean up confetti on unmount
  useEffect(() => () => void confetti.reset(), []);

  return (
    <div
      role="main"
      aria-label="Bubble Pop game"
      className="relative flex h-full min-h-screen w-full select-none flex-col overflow-hidden bg-gradient-to-br from-cyan-100 via-blue-50 to-purple-100"
    >
      {/* Custom keyframe animations */}
      <style>{`
        @keyframes float {
          from { transform: translateY(0); }
          to   { transform: translateY(-12px); }
        }
        @keyframes pop-bubble {
          0%   { transform: scale(1);   opacity: 1; }
          40%  { transform: scale(1.4); opacity: 0.8; }
          100% { transform: scale(0);   opacity: 0; }
        }
      `}</style>

      {/* Progress bar */}
      <div className="relative z-10 px-6 pt-4">
        <div className="flex items-center justify-between pb-2">
          <span className="text-lg font-bold text-blue-700 drop-shadow-sm">
            {poppedCount} / {bubbleCount} bubbles popped
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/60 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-300 ease-out"
            style={{
              width: `${bubbleCount > 0 ? (poppedCount / bubbleCount) * 100 : 0}%`,
            }}
            role="progressbar"
            aria-valuenow={poppedCount}
            aria-valuemin={0}
            aria-valuemax={bubbleCount}
            aria-label={`${String(poppedCount)} of ${String(bubbleCount)} bubbles popped`}
          />
        </div>
      </div>

      {/* Bubble play area */}
      <div className="relative flex-1">
        {bubbles.map((bubble) => {
          if (bubble.popped) return null;

          const floatDuration = 3 + (bubble.id % 4); // 3–6 seconds
          const animationStyle = bubble.popping
            ? { animation: 'pop-bubble 0.3s ease-out forwards' }
            : {
                animation: `float ${String(floatDuration)}s ease-in-out infinite alternate`,
                animationDelay: `${String(bubble.id * 0.25)}s`,
              };

          return (
            <button
              key={bubble.id}
              type="button"
              aria-label={`Pop bubble ${String(bubble.id + 1)}`}
              className="absolute cursor-pointer rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-white/80"
              style={{
                left: `${String(bubble.x)}%`,
                top: `${String(bubble.y)}%`,
                width: `${String(bubble.size)}px`,
                height: `${String(bubble.size)}px`,
                backgroundColor: `hsl(${String(bubble.hue)}, 70%, 75%)`,
                border: `2px solid hsl(${String(bubble.hue)}, 50%, 85%)`,
                transform: 'translate(-50%, -50%)',
                ...animationStyle,
              }}
              onClick={() => handleBubbleClick(bubble.id)}
            >
              {/* Shine highlight */}
              <span
                aria-hidden="true"
                className="absolute rounded-full bg-white/50"
                style={{
                  top: '15%',
                  left: '20%',
                  width: '30%',
                  height: '25%',
                }}
              />
            </button>
          );
        })}

        {/* Completion state */}
        {isComplete && (
          <div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4"
            aria-live="polite"
            aria-label="All bubbles popped! Congratulations!"
          >
            <span className="text-7xl">🎉</span>
            <p className="text-center text-3xl font-bold text-purple-700 drop-shadow-lg">
              All bubbles popped!
            </p>
            <p className="text-center text-xl font-semibold text-blue-600 drop-shadow-md">
              Amazing job! 🌟
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
