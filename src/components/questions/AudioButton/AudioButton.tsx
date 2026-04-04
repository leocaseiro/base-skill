import { Volume2 } from 'lucide-react';
import { useAnswerGameContext } from '@/components/answer-game/useAnswerGameContext';
import { useGameTTS } from '@/components/answer-game/useGameTTS';

interface AudioButtonProps {
  prompt: string;
}

export const AudioButton = ({ prompt }: AudioButtonProps) => {
  const { config } = useAnswerGameContext();
  const { speakPrompt } = useGameTTS();

  if (!config.ttsEnabled) return null;

  return (
    <button
      type="button"
      aria-label="Hear the question"
      className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md active:scale-95"
      onClick={() => speakPrompt(prompt)}
    >
      <Volume2 size={24} aria-hidden="true" />
    </button>
  );
};
