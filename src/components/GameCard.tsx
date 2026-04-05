import { BookmarkIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SavedGameConfigDoc } from '@/db/schemas/saved_game_configs';
import type { GameCatalogEntry } from '@/games/registry';
import { SaveConfigDialog } from '@/components/SaveConfigDialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type GameCardProps = {
  entry: GameCatalogEntry;
  savedConfigs: SavedGameConfigDoc[];
  onSaveConfig: (gameId: string, name: string) => Promise<void>;
  onRemoveConfig: (configId: string) => Promise<void>;
  onPlay: (gameId: string) => void;
  onPlayWithConfig: (gameId: string, configId: string) => void;
};

const suggestConfigName = (
  gameTitle: string,
  existingNames: string[],
): string => {
  if (!existingNames.includes(gameTitle)) return gameTitle;
  let n = 2;
  while (existingNames.includes(`${gameTitle} #${n}`)) n++;
  return `${gameTitle} #${n}`;
};

export const GameCard = ({
  entry,
  savedConfigs,
  onSaveConfig,
  onRemoveConfig,
  onPlay,
  onPlayWithConfig,
}: GameCardProps) => {
  const { t } = useTranslation('games');
  const { t: tCommon } = useTranslation('common');
  const [dialogOpen, setDialogOpen] = useState(false);

  const gameTitle = t(entry.titleKey);
  const existingNames = savedConfigs.map((c) => c.name);
  const suggestedName = suggestConfigName(gameTitle, existingNames);
  const hasConfigs = savedConfigs.length > 0;

  const handleSave = async (name: string) => {
    await onSaveConfig(entry.id, name);
    setDialogOpen(false);
  };

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">
              {gameTitle}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              aria-label={tCommon('saveConfig.title')}
              onClick={() => setDialogOpen(true)}
            >
              <BookmarkIcon
                size={16}
                className={hasConfigs ? 'fill-current' : ''}
              />
            </Button>
          </div>

          <div className="flex flex-wrap gap-1 pt-1">
            {entry.levels.map((level) => (
              <span
                key={level}
                className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
              >
                {tCommon(`levels.${level}`)}
              </span>
            ))}
          </div>

          {hasConfigs && (
            <div className="flex flex-wrap gap-1 pt-2">
              {savedConfigs.map((sc) => (
                <div
                  key={sc.id}
                  className="flex items-center gap-0.5 rounded-full bg-primary/10 text-xs font-medium text-primary"
                >
                  <button
                    className="py-0.5 pl-2 pr-1"
                    onClick={() => onPlayWithConfig(entry.id, sc.id)}
                    aria-label={sc.name}
                  >
                    {sc.name}
                  </button>
                  <button
                    className="py-0.5 pr-1.5"
                    onClick={() => void onRemoveConfig(sc.id)}
                    aria-label={tCommon('saveConfig.remove', {
                      name: sc.name,
                    })}
                  >
                    <XIcon size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent>
          <Button className="w-full" onClick={() => onPlay(entry.id)}>
            {tCommon('play')}
          </Button>
        </CardContent>
      </Card>

      <SaveConfigDialog
        open={dialogOpen}
        suggestedName={suggestedName}
        existingNames={existingNames}
        onSave={(name) => void handleSave(name)}
        onCancel={() => setDialogOpen(false)}
      />
    </>
  );
};
