import { useGameTTS } from '@/components/answer-game/useGameTTS';

interface TextQuestionProps {
  text: string;
}

export const TextQuestion = ({ text }: TextQuestionProps) => {
  const { speakPromptOnDemand } = useGameTTS();

  return (
    <button
      type="button"
      aria-label={`${text} — tap to hear`}
      className="px-6 py-3 text-4xl font-bold focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        background: 'var(--skin-question-bg)',
        color: 'var(--skin-question-text)',
        borderRadius: 'var(--skin-question-radius)',
      }}
      onClick={() => speakPromptOnDemand(text)}
    >
      {text}
    </button>
  );
};
