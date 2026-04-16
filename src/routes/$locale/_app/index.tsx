import {
  createFileRoute,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CustomGameDoc } from '@/db/schemas/custom_games';
import type { Cover } from '@/games/cover-type';
import type { GameColorKey } from '@/lib/game-colors';
import type { JSX } from 'react';
import { AdvancedConfigModal } from '@/components/AdvancedConfigModal';
import { GameCard } from '@/components/GameCard';
import { GameGrid } from '@/components/GameGrid';
import { getOrCreateDatabase } from '@/db/create-database';
import { useCustomGames } from '@/db/hooks/useCustomGames';
import { lastSessionConfigId } from '@/db/last-session-game-config';
import { configToChips } from '@/games/config-chips';
import { GAME_CATALOG } from '@/games/registry';

type ModalState =
  | { kind: 'closed' }
  | {
      kind: 'open';
      gameId: string;
      mode:
        | { kind: 'default' }
        | {
            kind: 'customGame';
            configId: string;
            name: string;
            color: GameColorKey;
            cover: Cover | undefined;
          };
      config: Record<string, unknown>;
    };

const HomeScreen = (): JSX.Element => {
  const { t } = useTranslation(['games', 'common']);
  const { locale } = useParams({ from: '/$locale' });
  const navigate = useNavigate({ from: '/$locale/' });
  const { customGames, save, update, remove, lastSessionConfigs } =
    useCustomGames();
  const [modal, setModal] = useState<ModalState>({ kind: 'closed' });

  const handlePlayDefault = (gameId: string) => {
    void navigate({
      to: '/$locale/game/$gameId',
      params: { locale, gameId },
      search: { configId: undefined },
    });
  };

  const handlePlayCustomGame = (gameId: string, configId: string) => {
    void navigate({
      to: '/$locale/game/$gameId',
      params: { locale, gameId },
      search: { configId },
    });
  };

  const openDefaultCog = async (gameId: string) => {
    const db = await getOrCreateDatabase();
    const lastDoc = await db.saved_game_configs
      .findOne(lastSessionConfigId(gameId))
      .exec();
    setModal({
      kind: 'open',
      gameId,
      mode: { kind: 'default' },
      config: lastDoc?.config ?? {},
    });
  };

  const openCustomGameCog = (gameId: string, doc: CustomGameDoc) => {
    setModal({
      kind: 'open',
      gameId,
      mode: {
        kind: 'customGame',
        configId: doc.id,
        name: doc.name,
        color: doc.color as GameColorKey,
        cover: doc.cover,
      },
      config: doc.config,
    });
  };

  const defaults = GAME_CATALOG.map((entry) => (
    <GameCard
      key={`default-${entry.id}`}
      variant="default"
      gameId={entry.id}
      title={t(entry.titleKey)}
      chips={configToChips(
        entry.id,
        lastSessionConfigs[entry.id] ?? {},
      )}
      onPlay={() => handlePlayDefault(entry.id)}
      onOpenCog={() => void openDefaultCog(entry.id)}
    />
  ));
  const customCards = customGames.flatMap((doc) => {
    const entry = GAME_CATALOG.find((g) => g.id === doc.gameId);
    if (!entry) return [];
    return [
      <GameCard
        key={`custom-${doc.id}`}
        variant="customGame"
        gameId={doc.gameId}
        title={t(entry.titleKey)}
        customGameName={doc.name}
        customGameColor={doc.color as GameColorKey}
        cover={doc.cover}
        chips={configToChips(doc.gameId, doc.config)}
        onPlay={() => handlePlayCustomGame(doc.gameId, doc.id)}
        onOpenCog={() => openCustomGameCog(doc.gameId, doc)}
      />,
    ];
  });
  const cards = [...defaults, ...customCards];

  return (
    <div className="px-4 py-4">
      <h1 className="sr-only">{t('common:home.title')}</h1>
      <GameGrid cards={cards} />

      {modal.kind === 'open' && (
        <AdvancedConfigModal
          open
          onOpenChange={(next) => {
            if (!next) setModal({ kind: 'closed' });
          }}
          gameId={modal.gameId}
          mode={modal.mode}
          config={modal.config}
          existingCustomGameNames={customGames
            .filter((d) => d.gameId === modal.gameId)
            .map((d) => d.name)}
          onCancel={() => setModal({ kind: 'closed' })}
          onUpdate={async (payload) => {
            if (payload.configId) {
              await update(
                payload.configId,
                payload.config,
                payload.name,
                { cover: payload.cover, color: payload.color },
              );
            }
            setModal({ kind: 'closed' });
          }}
          onSaveNew={async (payload) => {
            await save({
              gameId: modal.gameId,
              name: payload.name,
              config: payload.config,
              color: payload.color,
              cover: payload.cover,
            });
            setModal({ kind: 'closed' });
          }}
          onDelete={async (configId) => {
            await remove(configId);
            setModal({ kind: 'closed' });
          }}
        />
      )}
    </div>
  );
};

export const Route = createFileRoute('/$locale/_app/')({
  component: HomeScreen,
});
