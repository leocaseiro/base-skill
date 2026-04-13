import { useEffect, useMemo } from 'react';
import { EMPTY } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import type { ThemeDoc } from '@/db/schemas/themes';
import type { ReactNode } from 'react';
import { useRxDB } from '@/db/hooks/useRxDB';
import { useRxQuery } from '@/db/hooks/useRxQuery';
import {
  applyThemeCssVars,
  clearThemeCssVars,
  themeDocToCssVars,
} from '@/lib/theme/css-vars';
import { defaultThemeCssVars } from '@/lib/theme/default-tokens';

const DEFAULT_THEME_ID = 'theme_ocean_preset';
const ANONYMOUS_SETTINGS_ID = 'settings:anonymous';

const applyDocOrDefault = (doc: ThemeDoc | null | undefined): void => {
  const root = document.documentElement;
  const isDark = root.classList.contains('dark');

  if (isDark) {
    // In dark mode, clear --bs-* inline styles so the .dark CSS block's
    // Galaxy dark fallback values take effect. Light-mode theme tokens
    // set as inline styles would override var(--bs-*, fallback).
    clearThemeCssVars(root, defaultThemeCssVars);
    return;
  }

  if (doc) {
    applyThemeCssVars(root, themeDocToCssVars(doc));
  } else {
    applyThemeCssVars(root, defaultThemeCssVars);
  }
};

export const ThemeRuntimeProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { db, isReady } = useRxDB();

  const theme$ = useMemo(() => {
    if (!db || !isReady) return EMPTY;
    return db.settings.findOne(ANONYMOUS_SETTINGS_ID).$.pipe(
      switchMap((settingsDoc) => {
        const themeId =
          settingsDoc?.toJSON().themeId ?? DEFAULT_THEME_ID;
        return db.themes.findOne(themeId).$;
      }),
    );
  }, [db, isReady]);

  const themeDoc = useRxQuery<{ toJSON: () => ThemeDoc } | null>(
    theme$,
    null,
  );

  useEffect(() => {
    const doc = themeDoc ? themeDoc.toJSON() : null;
    applyDocOrDefault(doc);

    // Re-apply when the dark class is toggled externally (e.g. E2E test
    // calling setDarkMode, or any code that directly sets html.classList).
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      applyDocOrDefault(doc);
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => {
      observer.disconnect();
    };
  }, [themeDoc]);

  return <>{children}</>;
};
