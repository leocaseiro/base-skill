// src/components/GameCard.tsx
import { BookmarkIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SavedGameConfigDoc } from '@/db/schemas/saved_game_configs';
import type { GameCatalogEntry } from '@/games/registry';
import type { BookmarkColorKey } from '@/lib/bookmark-colors';
import { SaveConfigDialog } from '@/components/SaveConfigDialog';
import { SavedConfigChip } from '@/components/SavedConfigChip';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  getConfigFields,
  getConfigFormRenderer,
} from '@/games/config-fields-registry';

type GameCardProps = {
  entry: GameCatalogEntry;
  savedConfigs: SavedGameConfigDoc[];
  onSaveConfig: (
    gameId: string,
    name: string,
    color: BookmarkColorKey,
  ) => Promise<void>;
  onRemoveConfig: (configId: string) => Promise<void>;
  onUpdateConfig: (
    configId: string,
    config: Record<string, unknown>,
    name: string,
  ) => Promise<void>;
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
  onUpdateConfig,
  onPlay,
  onPlayWithConfig,
}: GameCardProps) => {
  const { t } = useTranslation('games');
  const { t: tCommon } = useTranslation('common');
  const [dialogOpen, setDialogOpen] = useState(false);

  const gameTitle = t(entry.titleKey);
  const description = t(entry.descriptionKey);
  const existingNames = savedConfigs.map((c) => c.name);
  const suggestedName = suggestConfigName(gameTitle, existingNames);
  const hasConfigs = savedConfigs.length > 0;
  const configFields = getConfigFields(entry.id);
  const configFormRenderer = getConfigFormRenderer(entry.id);

  const handleSave = async (name: string, color: BookmarkColorKey) => {
    await onSaveConfig(entry.id, name, color);
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

          <p className="text-xs text-muted-foreground leading-snug">
            {description}
          </p>

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
            <div className="flex flex-col gap-2 pt-2">
              {savedConfigs.map((sc) => (
                <SavedConfigChip
                  key={sc.id}
                  doc={sc}
                  configFields={configFields}
                  renderConfigForm={configFormRenderer}
                  onPlay={(id) => onPlayWithConfig(entry.id, id)}
                  onDelete={(id) => void onRemoveConfig(id)}
                  onSave={onUpdateConfig}
                />
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
        onSave={(name, color) => void handleSave(name, color)}
        onCancel={() => setDialogOpen(false)}
      />
    </>
  );
};
