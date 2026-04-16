/** Matches `useCustomGames` / saved_game_configs.profileId for anonymous play */
export const ANONYMOUS_PROFILE_ID = 'anonymous';

/** Reserved primary key — excluded from custom-game queries, kept in saved_game_configs for resume-last-session. */
export const lastSessionConfigId = (gameId: string): string =>
  `last:${ANONYMOUS_PROFILE_ID}:${gameId}`;

export const isLastSessionConfigId = (id: string): boolean =>
  id.startsWith('last:');
