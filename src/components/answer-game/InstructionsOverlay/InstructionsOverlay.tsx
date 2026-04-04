import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cancelSpeech, speak } from '@/lib/speech/SpeechOutput';

interface InstructionsOverlayProps {
  text: string;
  onStart: () => void;
  ttsEnabled: boolean;
}

export const InstructionsOverlay = ({
  text,
  onStart,
  ttsEnabled,
}: InstructionsOverlayProps) => {
  const { t } = useTranslation('games');

  useEffect(() => {
    if (ttsEnabled) speak(text);
    return () => {
      cancelSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on mount to speak instructions once
  }, []);

  return (
    <div
      role="dialog"
      aria-label="Game instructions"
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-background/95 px-6 text-center"
    >
      <span className="text-6xl" aria-hidden="true">
        🎮
      </span>
      <p className="max-w-sm text-lg font-medium text-foreground">
        {text}
      </p>
      <button
        type="button"
        onClick={onStart}
        className="rounded-xl bg-primary px-10 py-4 text-xl font-bold text-primary-foreground shadow-md active:scale-95"
      >
        {t('instructions.lets-go')}
      </button>
    </div>
  );
};
