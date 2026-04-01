import type { AppMetaDoc } from './schemas/app-meta';
import type { BookmarkDoc } from './schemas/bookmarks';
import type { GameConfigOverridesDoc } from './schemas/game_config_overrides';
import type { ProfileDoc } from './schemas/profiles';
import type { ProgressDoc } from './schemas/progress';
import type { SessionHistoryDoc } from './schemas/session_history';
import type { SessionHistoryIndexDoc } from './schemas/session_history_index';
import type { SettingsDoc } from './schemas/settings';
import type { SyncMetaDoc } from './schemas/sync_meta';
import type { ThemeDoc } from './schemas/themes';
import type { RxCollection, RxDatabase } from 'rxdb';

export type BaseSkillCollections = {
  app_meta: RxCollection<AppMetaDoc>;
  profiles: RxCollection<ProfileDoc>;
  progress: RxCollection<ProgressDoc>;
  settings: RxCollection<SettingsDoc>;
  game_config_overrides: RxCollection<GameConfigOverridesDoc>;
  bookmarks: RxCollection<BookmarkDoc>;
  themes: RxCollection<ThemeDoc>;
  session_history: RxCollection<SessionHistoryDoc>;
  session_history_index: RxCollection<SessionHistoryIndexDoc>;
  sync_meta: RxCollection<SyncMetaDoc>;
};

export type BaseSkillDatabase = RxDatabase<BaseSkillCollections>;

export type CollectionName = keyof BaseSkillCollections;
