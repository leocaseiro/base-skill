import {
  createBrowserHistory,
  createMemoryHistory,
  createRouter as createTanStackRouter,
} from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

/**
 * Vite `base` uses a trailing slash (`/` or `/base-skill/`). TanStack `basepath`
 * is normalized without a trailing slash (except root `/`).
 */
function viteBaseToRouterBasepath(viteBase: string): string {
  const trimmed = viteBase.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

const basepath = viteBaseToRouterBasepath(import.meta.env.BASE_URL);

function ssrMemoryInitialPath(): string {
  return basepath === '/' ? '/en/' : `${basepath}/en/`;
}

export function getRouter() {
  const history =
    'window' in globalThis
      ? createBrowserHistory()
      : createMemoryHistory({
          initialEntries: [ssrMemoryInitialPath()],
        });

  const router = createTanStackRouter({
    routeTree,
    history,
    basepath,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
