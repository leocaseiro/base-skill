import { useGameTTS } from '@/components/answer-game/useGameTTS';

interface TextQuestionProps {
  text: string;
}

export const TextQuestion = ({ text }: TextQuestionProps) => {
  const { speakPrompt } = useGameTTS();

  return (
    <button
      type="button"
      aria-label={`${text} — tap to hear`}
      className="rounded-lg px-6 py-3 text-4xl font-bold focus-visible:outline-2 focus-visible:outline-offset-2"
      onClick={() => speakPrompt(text)}
    >
      {text}
    </button>
  );
};
