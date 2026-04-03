import { useEffect, useMemo } from 'react';
import { EMPTY } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import type { ThemeDoc } from '@/db/schemas/themes';
import type { ReactNode } from 'react';
import { useRxDB } from '@/db/hooks/useRxDB';
import { useRxQuery } from '@/db/hooks/useRxQuery';
import {
  applyThemeCssVars,
  themeDocToCssVars,
} from '@/lib/theme/css-vars';
import { defaultThemeCssVars } from '@/lib/theme/default-tokens';

const DEFAULT_THEME_ID = 'theme_ocean_preset';
const ANONYMOUS_SETTINGS_ID = 'settings:anonymous';

function applyDocOrDefault(doc: ThemeDoc | null | undefined): void {
  const root = document.documentElement;
  if (doc) {
    applyThemeCssVars(root, themeDocToCssVars(doc));
  } else {
    applyThemeCssVars(root, defaultThemeCssVars);
  }
}

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
    applyDocOrDefault(themeDoc ? themeDoc.toJSON() : null);
  }, [themeDoc]);

  return <>{children}</>;
};
