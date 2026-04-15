import { appMetaSchema } from './app-meta';
import { gameConfigOverridesSchema } from './game_config_overrides';
import { profilesSchema } from './profiles';
import { progressSchema } from './progress';
import { savedGameConfigsSchema } from './saved_game_configs';
import { sessionHistorySchema } from './session_history';
import { sessionHistoryIndexSchema } from './session_history_index';
import { settingsSchema } from './settings';
import { syncMetaSchema } from './sync_meta';
import { themesSchema } from './themes';
import { wordSpellSeenWordsSchema } from './word_spell_seen_words';

export { appMetaSchema } from './app-meta';
export type { AppMetaDoc } from './app-meta';
export { gameConfigOverridesSchema } from './game_config_overrides';
export type { GameConfigOverridesDoc } from './game_config_overrides';
export { profilesSchema } from './profiles';
export type { ProfileDoc } from './profiles';
export { progressSchema } from './progress';
export type { ProgressDoc } from './progress';
export { savedGameConfigsSchema } from './saved_game_configs';
export type { SavedGameConfigDoc } from './saved_game_configs';
export { sessionHistoryIndexSchema } from './session_history_index';
export type { SessionHistoryIndexDoc } from './session_history_index';
export { sessionHistorySchema } from './session_history';
export type { SessionHistoryDoc } from './session_history';
export { settingsSchema } from './settings';
export type { SettingsDoc } from './settings';
export { syncMetaSchema } from './sync_meta';
export type { SyncMetaDoc } from './sync_meta';
export { themesSchema } from './themes';
export type { ThemeDoc } from './themes';
export { wordSpellSeenWordsSchema } from './word_spell_seen_words';
export type { WordSpellSeenWordsDoc } from './word_spell_seen_words';

export const MAX_SCHEMA_VERSION = Math.max(
  appMetaSchema.version,
  gameConfigOverridesSchema.version,
  profilesSchema.version,
  progressSchema.version,
  savedGameConfigsSchema.version,
  sessionHistoryIndexSchema.version,
  sessionHistorySchema.version,
  settingsSchema.version,
  syncMetaSchema.version,
  themesSchema.version,
  wordSpellSeenWordsSchema.version,
);
