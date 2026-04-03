/** Static UI tokens when RxDB has no active theme (anonymous / first paint). */
export const defaultThemeCssVars: Record<string, string> = {
  '--bs-primary': '#FF6B6B',
  '--bs-secondary': '#FFD93D',
  '--bs-background': '#FFF9EC',
  '--bs-surface': '#FFFFFF',
  '--bs-text': '#2D1B00',
  '--bs-accent': '#6BCB77',
  '--bs-success': '#6BCB77',
  '--bs-warning': '#F4A261',
  '--bs-error': '#FF6B6B',
  // Wire shadcn tokens so components like Button pick up theme colors.
  // Foreground/card-foreground are intentionally omitted — dark mode CSS handles those.
  '--primary': '#FF6B6B',
  '--primary-foreground': '#FFFFFF',
  '--secondary': '#FFD93D',
  '--secondary-foreground': '#FFFFFF',
  '--background': '#FFF9EC',
  // --card and --card-foreground are omitted — wired via CSS so dark mode can override them
  '--border': '#6BCB77',
  '--ring': '#FF6B6B',
};
