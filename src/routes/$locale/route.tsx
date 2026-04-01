import { useEffect } from 'react'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import i18n from '@/lib/i18n/i18n'

const LOCALES = ['en', 'pt-BR'] as const
export type AppLocale = (typeof LOCALES)[number]

export const Route = createFileRoute('/$locale')({
  beforeLoad: ({ params }) => {
    if (!LOCALES.includes(params.locale as AppLocale)) {
      throw redirect({
        to: '/$locale',
        params: { locale: 'en' },
        replace: true,
      })
    }
  },
  component: LocaleLayout,
})

function LocaleLayout() {
  const { locale } = Route.useParams()
  void i18n.changeLanguage(locale)

  useEffect(() => {
    document.documentElement.lang = locale === 'pt-BR' ? 'pt-BR' : 'en'
  }, [locale])

  return <Outlet />
}
