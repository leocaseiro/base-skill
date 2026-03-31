import { Outlet, createFileRoute } from '@tanstack/react-router'
import { I18nextProvider } from 'react-i18next'
import { DbProvider } from '@/providers/DbProvider'
import { ThemeRuntimeProvider } from '@/providers/ThemeRuntimeProvider'
import i18n from '@/lib/i18n/i18n'
import { seedThemesOnce } from '@/db/seed-themes'

export const Route = createFileRoute('/$locale/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <DbProvider onDatabaseReady={seedThemesOnce}>
      <I18nextProvider i18n={i18n}>
        <ThemeRuntimeProvider>
          <main className="min-h-screen">
            <Outlet />
          </main>
        </ThemeRuntimeProvider>
      </I18nextProvider>
    </DbProvider>
  )
}
