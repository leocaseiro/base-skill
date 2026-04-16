import type { AppMetaDoc } from './schemas/app-meta';
import type { CustomGameDoc } from './schemas/custom_games';
import type { GameConfigOverridesDoc } from './schemas/game_config_overrides';
import type { ProfileDoc } from './schemas/profiles';
import type { ProgressDoc } from './schemas/progress';
import type { SavedGameConfigDoc } from './schemas/saved_game_configs';
import type { SessionHistoryDoc } from './schemas/session_history';
import type { SessionHistoryIndexDoc } from './schemas/session_history_index';
import type { SettingsDoc } from './schemas/settings';
import type { SyncMetaDoc } from './schemas/sync_meta';
import type { ThemeDoc } from './schemas/themes';
import type { WordSpellSeenWordsDoc } from './schemas/word_spell_seen_words';
import type { RxCollection, RxDatabase } from 'rxdb';

export type BaseSkillCollections = {
  app_meta: RxCollection<AppMetaDoc>;
  custom_games: RxCollection<CustomGameDoc>;
  profiles: RxCollection<ProfileDoc>;
  progress: RxCollection<ProgressDoc>;
  settings: RxCollection<SettingsDoc>;
  game_config_overrides: RxCollection<GameConfigOverridesDoc>;
  saved_game_configs: RxCollection<SavedGameConfigDoc>;
  themes: RxCollection<ThemeDoc>;
  session_history: RxCollection<SessionHistoryDoc>;
  session_history_index: RxCollection<SessionHistoryIndexDoc>;
  sync_meta: RxCollection<SyncMetaDoc>;
  word_spell_seen_words: RxCollection<WordSpellSeenWordsDoc>;
};

export type BaseSkillDatabase = RxDatabase<BaseSkillCollections>;

export type CollectionName = keyof BaseSkillCollections;
