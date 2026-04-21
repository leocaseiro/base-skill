import { TanStackDevtools } from '@tanstack/react-devtools';
import {
  HeadContent,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';

import appCss from '../styles.css?url';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { ServiceWorkerProvider } from '@/lib/service-worker/ServiceWorkerProvider';

/** First paint only: class + color-scheme from system preference (no localStorage). */
const THEME_INIT_SCRIPT =
  "(function(){try{var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=prefersDark?'dark':'light';var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);root.removeAttribute('data-theme');root.style.colorScheme=resolved;}catch(e){}})();";

const RootDocument = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" suppressHydrationWarning>
    <head>
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      <HeadContent />
    </head>
    <body className="font-sans antialiased">
      <ErrorBoundary>
        <ServiceWorkerProvider>{children}</ServiceWorkerProvider>
      </ErrorBoundary>
      <Toaster />
      <TanStackDevtools
        config={{ position: 'bottom-right' }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
      <Scripts />
    </body>
  </html>
);

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      { title: 'BaseSkill' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
});
