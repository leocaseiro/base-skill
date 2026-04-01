import { useTranslation } from 'react-i18next';
import type { GameLevel } from '@/games/registry';
import { Button } from '@/components/ui/button';

const LEVELS: GameLevel[] = ['PK', 'K', '1', '2', '3', '4'];

type LevelRowProps = {
  currentLevel: GameLevel | '';
  onLevelChange: (level: GameLevel | '') => void;
};

export const LevelRow = ({
  currentLevel,
  onLevelChange,
}: LevelRowProps) => {
  const { t } = useTranslation('common');

  return (
    <div
      className="flex gap-2 overflow-x-auto py-3 px-4 scrollbar-none"
      role="group"
      aria-label="Filter by grade level"
    >
      <Button
        variant={currentLevel === '' ? 'default' : 'outline'}
        size="sm"
        aria-pressed={currentLevel === ''}
        onClick={() => onLevelChange('')}
      >
        {t('levels.all')}
      </Button>
      {LEVELS.map((level) => (
        <Button
          key={level}
          variant={currentLevel === level ? 'default' : 'outline'}
          size="sm"
          aria-pressed={currentLevel === level}
          onClick={() => onLevelChange(level)}
        >
          {t(`levels.${level}`)}
        </Button>
      ))}
    </div>
  );
};
