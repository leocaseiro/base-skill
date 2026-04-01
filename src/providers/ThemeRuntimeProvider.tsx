import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useRxDB } from '@/db/hooks/useRxDB'
import type { ThemeDoc } from '@/db/schemas/themes'
import { applyThemeCssVars, themeDocToCssVars } from '@/lib/theme/css-vars'
import { defaultThemeCssVars } from '@/lib/theme/default-tokens'

const DEFAULT_THEME_ID = 'theme_ocean_preset'

function applyDocOrDefault(doc: ThemeDoc | null | undefined): void {
  const root = document.documentElement
  if (doc) {
    applyThemeCssVars(root, themeDocToCssVars(doc))
  } else {
    applyThemeCssVars(root, defaultThemeCssVars)
  }
}

export function ThemeRuntimeProvider({ children }: { children: ReactNode }) {
  const { db, isReady } = useRxDB()

  useEffect(() => {
    if (!db || !isReady) {
      return
    }
    const sub = db.themes.findOne(DEFAULT_THEME_ID).$.subscribe((doc) => {
      applyDocOrDefault(doc ? (doc.toJSON() as ThemeDoc) : null)
    })
    return () => sub.unsubscribe()
  }, [db, isReady])

  return <>{children}</>
}
