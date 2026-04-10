import { useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { useGameTTS } from '@/components/answer-game/useGameTTS';
import { toCardinalText } from '@/games/number-match/number-words';

interface DotGroupQuestionProps {
  count: number;
  prompt: string;
}

const makeInitialCounts = (count: number): (number | null)[] =>
  Array.from({ length: count }, () => null);

interface DotState {
  count: number;
  assigned: (number | null)[];
}

export const DotGroupQuestion = ({
  count,
  prompt,
}: DotGroupQuestionProps) => {
  const { speakPrompt } = useGameTTS();
  const { locale } = useParams({ from: '/$locale' });
  const [state, setState] = useState<DotState>(() => ({
    count,
    assigned: makeInitialCounts(count),
  }));

  // Reset during render when `count` changes (e.g. between rounds).
  // Storing `count` alongside `assigned` lets us derive the reset without
  // setState-in-effect or ref mutation during render.
  const assignedCounts =
    state.count === count ? state.assigned : makeInitialCounts(count);
  if (state.count !== count) {
    setState({ count, assigned: assignedCounts });
  }

  const handleDotTap = (index: number) => {
    setState((previous) => {
      if (previous.assigned[index] !== null) return previous;
      const nextAssigned = [...previous.assigned];
      let maxAssigned = 0;
      for (const v of previous.assigned) {
        if (v !== null && v > maxAssigned) maxAssigned = v;
      }
      const nextValue = maxAssigned + 1;
      nextAssigned[index] = nextValue;
      const wordLocale = locale === 'pt-BR' ? 'pt-BR' : 'en';
      speakPrompt(toCardinalText(nextValue, wordLocale));
      return { count: previous.count, assigned: nextAssigned };
    });
  };

  return (
    <div
      aria-label={prompt}
      className="flex flex-wrap justify-center gap-3 rounded-xl p-4"
    >
      {assignedCounts.map((assigned, index) => (
        <button
          // eslint-disable-next-line react/no-array-index-key -- dot position is the natural identity; ordering is stable within a given `count`.
          key={index}
          type="button"
          aria-label={`Dot ${index + 1} of ${count}`}
          className="relative size-10 rounded-full bg-primary focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={() => handleDotTap(index)}
        >
          {assigned !== null && (
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
              {assigned}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
