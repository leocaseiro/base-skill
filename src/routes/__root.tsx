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

/**
 * GitHub Pages SPA redirect for PR previews.
 *
 * GitHub Pages has a single 404.html at the site root. When a PR preview deep
 * link like /base-skill/pr/317/app/en/game/spot-all is refreshed, GH Pages
 * serves the production 404.html (= index.html). The production router can't
 * match the /pr/N/app/ prefix, so it falls back to the wrong route.
 *
 * This inline script runs before the router and handles two cases:
 * 1. REDIRECT: if the URL targets a PR preview but this is the production app,
 *    store the full URL in sessionStorage and redirect to the PR preview's
 *    index.html (which exists as a real file on GH Pages).
 * 2. RESTORE: if sessionStorage contains a stored redirect, restore the
 *    original URL via history.replaceState before the router initialises.
 */
const SPA_REDIRECT_SCRIPT = String.raw`(function(){try{var b=${JSON.stringify(import.meta.env.BASE_URL.replace(/\/$/, ''))};var l=window.location;var r=sessionStorage.getItem('spa-redirect');if(r){sessionStorage.removeItem('spa-redirect');history.replaceState(null,'',r);return}if(b.indexOf('/pr/')>=0)return;if(l.pathname.indexOf(b+'/pr/')!==0)return;var s=l.pathname.substring((b+'/pr/').length);var n=s.match(/^(\d+)\/app\//);if(!n)return;sessionStorage.setItem('spa-redirect',l.pathname+l.search+l.hash);l.replace(b+'/pr/'+n[1]+'/app/')}catch(e){}})();`;

/** First paint only: class + color-scheme from system preference (no localStorage). */
const THEME_INIT_SCRIPT =
  "(function(){try{var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=prefersDark?'dark':'light';var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);root.removeAttribute('data-theme');root.style.colorScheme=resolved;}catch(e){}})();";

const RootDocument = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" suppressHydrationWarning>
    <head>
      <script
        dangerouslySetInnerHTML={{ __html: SPA_REDIRECT_SCRIPT }}
      />
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
