import { defaultThemeCssVars as defaultThemeCssVariables } from './default-tokens';
import type { ThemeDoc } from '@/db/schemas/themes';

export function themeDocToCssVars(
  document_: ThemeDoc,
): Record<string, string> {
  const { primary, secondary, background, surface, text, accent } =
    document_.colors;
  return {
    '--bs-primary': primary,
    '--bs-secondary': secondary,
    '--bs-background': background,
    '--bs-surface': surface,
    '--bs-text': text,
    '--bs-accent': accent,
    '--bs-success': defaultThemeCssVariables['--bs-success']!,
    '--bs-warning': defaultThemeCssVariables['--bs-warning']!,
    '--bs-error': defaultThemeCssVariables['--bs-error']!,
  };
}

export function applyThemeCssVars(
  element: HTMLElement,
  variables: Record<string, string>,
): void {
  for (const [k, v] of Object.entries(variables)) {
    element.style.setProperty(k, v);
  }
}

export function clearThemeCssVars(
  element: HTMLElement,
  variables: Record<string, string>,
): void {
  for (const key of Object.keys(variables)) {
    element.style.removeProperty(key);
  }
}
