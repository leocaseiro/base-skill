// src/lib/version.ts

/** App version injected from package.json at build time. */
export const APP_VERSION: string =
  (import.meta.env.VITE_APP_VERSION as string | undefined) ?? '0.0.0';

/** True while the app is in beta; set VITE_IS_BETA=false to switch to stable. */
export const IS_BETA: boolean =
  (import.meta.env.VITE_IS_BETA as string | undefined) !== 'false';
