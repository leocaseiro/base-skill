interface ScoreAnimationProps {
  visible: boolean;
}

export const ScoreAnimation = ({ visible }: ScoreAnimationProps) => {
  if (!visible) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Round complete!"
      className="pointer-events-none fixed inset-0 flex items-center justify-center"
    >
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          className="absolute size-3 rounded-full animate-bounce"
          style={{
            left: `${10 + ((i * 7) % 80)}%`,
            top: `${20 + ((i * 13) % 50)}%`,
            backgroundColor: [
              '#FF6B6B',
              '#FFD93D',
              '#6BCB77',
              '#4D96FF',
            ][i % 4],
            animationDelay: `${i * 50}ms`,
          }}
        />
      ))}
    </div>
  );
};
