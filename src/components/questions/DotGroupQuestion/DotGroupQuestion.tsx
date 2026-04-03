import { useGameTTS } from '@/components/answer-game/useGameTTS';

interface DotGroupQuestionProps {
  count: number;
  prompt: string;
}

export const DotGroupQuestion = ({
  count,
  prompt,
}: DotGroupQuestionProps) => {
  const { speakPrompt } = useGameTTS();

  return (
    <button
      type="button"
      aria-label={`${prompt} — tap to hear`}
      className="flex flex-wrap justify-center gap-3 rounded-xl p-4 focus-visible:outline-2 focus-visible:outline-offset-2"
      onClick={() => speakPrompt(prompt)}
    >
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          role="presentation"
          className="size-10 rounded-full bg-primary"
        />
      ))}
    </button>
  );
};
