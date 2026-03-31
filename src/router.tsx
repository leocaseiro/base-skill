import {
  createHashHistory,
  createMemoryHistory,
  createRouter as createTanStackRouter,
} from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const history =
    typeof window !== 'undefined' ? createHashHistory() : createMemoryHistory()

  const router = createTanStackRouter({
    routeTree,
    history,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
