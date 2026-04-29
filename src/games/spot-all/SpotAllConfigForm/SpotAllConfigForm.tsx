import { resolveSimpleConfig } from '../resolve-simple-config';
import type { JSX } from 'react';
import { ChunkGroup } from '@/components/config/ChunkGroup';

export const SpotAllConfigForm = ({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}): JSX.Element => {
  const difficulty =
    config.difficulty === 'easy' || config.difficulty === 'hard'
      ? config.difficulty
      : 'medium';

  return (
    <div className="flex flex-col gap-4">
      <ChunkGroup
        label="Difficulty"
        options={[
          {
            value: 'easy',
            emoji: '🧩',
            label: 'Mirror Letters Easy',
            subtitle: 'Focus on b/d with fewer distractors',
          },
          {
            value: 'medium',
            emoji: '🎯',
            label: 'Balanced',
            subtitle: 'Mix of common confusables',
          },
          {
            value: 'hard',
            emoji: '🔥',
            label: 'All Confusables Hard',
            subtitle: 'Large grid with mixed relationship types',
          },
        ]}
        value={difficulty}
        onChange={(selectedDifficulty) => {
          const resolved = resolveSimpleConfig({
            configMode: 'simple',
            difficulty: selectedDifficulty as
              | 'easy'
              | 'medium'
              | 'hard',
          });
          onChange({ ...resolved, difficulty: selectedDifficulty });
        }}
      />
    </div>
  );
};
