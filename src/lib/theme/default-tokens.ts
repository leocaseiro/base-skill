/**
 * Static UI tokens when RxDB has no active theme (anonymous / first paint).
 * Matches `theme_ocean_preset` in seed-themes so hydration matches the default
 * settings theme and primary/foreground pairs meet WCAG AA (avoids candy #FF6B6B
 * + white failing axe in slower engines before DB is ready).
 */
export const defaultThemeCssVars: Record<string, string> = {
  '--bs-primary': '#0077B6',
  '--bs-secondary': '#00B4D8',
  '--bs-background': '#CAF0F8',
  '--bs-surface': '#FFFFFF',
  '--bs-text': '#03045E',
  '--bs-accent': '#F77F00',
  '--bs-success': '#6BCB77',
  '--bs-warning': '#F4A261',
  '--bs-error': '#E63946',
};
