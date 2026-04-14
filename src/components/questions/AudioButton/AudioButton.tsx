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
      className="flex size-14 items-center justify-center rounded-full shadow-md active:scale-95"
      style={{
        background: 'var(--skin-question-audio-bg)',
        color: 'var(--skin-question-audio-fg)',
      }}
      onClick={() => speakPrompt(prompt)}
    >
      <Volume2 size={24} aria-hidden="true" />
    </button>
  );
};
