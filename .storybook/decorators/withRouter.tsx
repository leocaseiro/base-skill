import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import React from 'react';
import type { Decorator } from '@storybook/react';

export const withRouter: Decorator = (Story) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Storybook decorator factory
  const router = React.useMemo(() => {
    const rootRoute = createRootRoute({
      component: () => (
        <div>
          <Outlet />
        </div>
      ),
    });
    const localeRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/$locale',
      component: function StorybookLocaleRoute() {
        const Cmp = Story as React.ComponentType;
        return <Cmp />;
      },
    });
    const routeTree = rootRoute.addChildren([localeRoute]);
    return createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/en'] }),
    });
    /* `Story` identity changes per story — router must be recreated. */
  }, [Story]);

  return <RouterProvider router={router} />;
};
