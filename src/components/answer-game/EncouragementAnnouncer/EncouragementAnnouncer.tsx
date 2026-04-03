import { useEffect } from 'react';

interface EncouragementAnnouncerProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
}

export const EncouragementAnnouncer = ({
  visible,
  message,
  onDismiss,
}: EncouragementAnnouncerProps) => {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, 2000);
    return () => clearTimeout(timer);
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-24 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 rounded-2xl bg-background/95 px-6 py-4 shadow-xl"
    >
      <span className="text-5xl" aria-hidden="true">
        🐨
      </span>
      <p className="text-center text-lg font-semibold">{message}</p>
    </div>
  );
};
