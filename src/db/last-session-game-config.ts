/** Matches `useSavedConfigs` / saved_game_configs.profileId for anonymous play */
export const ANONYMOUS_PROFILE_ID = 'anonymous';

/** Reserved primary key — excluded from named-save chips on the home screen */
export const lastSessionSavedConfigId = (gameId: string): string =>
  `last:${ANONYMOUS_PROFILE_ID}:${gameId}`;

export const isLastSessionSavedConfigId = (id: string): boolean =>
  id.startsWith('last:');
