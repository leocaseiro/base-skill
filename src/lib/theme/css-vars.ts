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
    // Wire shadcn tokens so components like Button pick up theme colors.
    '--primary': primary,
    '--primary-foreground': surface,
    '--secondary': secondary,
    '--secondary-foreground': surface,
    '--background': background,
    // --card and --card-foreground are omitted — wired via CSS so dark mode can override them
    '--border': accent,
    '--ring': primary,
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
