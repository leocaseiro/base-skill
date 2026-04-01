import { Outlet, createFileRoute } from '@tanstack/react-router';
import { I18nextProvider } from 'react-i18next';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { seedThemesOnce } from '@/db/seed-themes';
import { i18n } from '@/lib/i18n/i18n';
import { DbProvider } from '@/providers/DbProvider';
import { ThemeRuntimeProvider } from '@/providers/ThemeRuntimeProvider';

const AppLayout = () => (
  <DbProvider onDatabaseReady={seedThemesOnce}>
    <I18nextProvider i18n={i18n}>
      <ThemeRuntimeProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <OfflineIndicator />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      </ThemeRuntimeProvider>
    </I18nextProvider>
  </DbProvider>
);

export const Route = createFileRoute('/$locale/_app')({
  component: AppLayout,
});
