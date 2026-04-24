import {
  Outlet,
  createFileRoute,
  useLocation,
} from '@tanstack/react-router';
import { I18nextProvider } from 'react-i18next';
import type { JSX } from 'react';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { UpdateBanner } from '@/components/UpdateBanner';
import { seedThemesOnce } from '@/db/seed-themes';
import { shouldRenderAppHeaderFooter } from '@/lib/app-paths';
import { i18n } from '@/lib/i18n/i18n';
import { DbProvider } from '@/providers/DbProvider';
import { ThemeRuntimeProvider } from '@/providers/ThemeRuntimeProvider';

const AppLayout = (): JSX.Element => {
  const { pathname } = useLocation();
  const showAppChrome = shouldRenderAppHeaderFooter(pathname);

  return (
    <DbProvider onDatabaseReady={seedThemesOnce}>
      <I18nextProvider i18n={i18n}>
        <ThemeRuntimeProvider>
          <div className="flex min-h-screen flex-col">
            {showAppChrome ? <Header /> : null}
            <OfflineIndicator />
            <UpdateBanner />
            <main className="flex-1">
              <Outlet />
            </main>
            {showAppChrome ? <Footer /> : null}
          </div>
        </ThemeRuntimeProvider>
      </I18nextProvider>
    </DbProvider>
  );
};

export const Route = createFileRoute('/$locale/_app')({
  component: AppLayout,
});
