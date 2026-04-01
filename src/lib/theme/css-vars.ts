import { defaultThemeCssVars } from './default-tokens';
import type { ThemeDoc } from '@/db/schemas/themes';

export function themeDocToCssVars(doc: ThemeDoc): Record<string, string> {
  const { primary, secondary, background, surface, text, accent } = doc.colors;
  return {
    '--bs-primary': primary,
    '--bs-secondary': secondary,
    '--bs-background': background,
    '--bs-surface': surface,
    '--bs-text': text,
    '--bs-accent': accent,
    '--bs-success': defaultThemeCssVars['--bs-success']!,
    '--bs-warning': defaultThemeCssVars['--bs-warning']!,
    '--bs-error': defaultThemeCssVars['--bs-error']!,
  };
}

export function applyThemeCssVars(
  el: HTMLElement,
  vars: Record<string, string>,
): void {
  for (const [ k, v ] of Object.entries(vars)) {
    el.style.setProperty(k, v);
  }
}
