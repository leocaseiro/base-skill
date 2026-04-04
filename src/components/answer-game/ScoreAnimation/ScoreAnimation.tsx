import confetti from 'canvas-confetti';
import { useEffect, useRef } from 'react';

interface ScoreAnimationProps {
  visible: boolean;
}

export const ScoreAnimation = ({ visible }: ScoreAnimationProps) => {
  const prevRef = useRef(false);

  useEffect(() => {
    if (visible && !prevRef.current) {
      void confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 },
        ticks: 310,
      });
    }
    prevRef.current = visible;
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Round complete!"
      className="pointer-events-none fixed inset-0"
    />
  );
};
