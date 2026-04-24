/**
 * In-app game session URLs are `/$locale/game/$gameId`. TanStack Router
 * `location.pathname` does not include the `_app` directory segment from the
 * file tree.
 */
export const isAppGameSessionPath = (pathname: string): boolean =>
  /^\/[^/]+\/game\/[^/]+$/.test(pathname);

/** When true, the app shows global header and footer; hidden for fullscreen in-game. */
export const shouldRenderAppHeaderFooter = (
  pathname: string,
): boolean => !isAppGameSessionPath(pathname);
