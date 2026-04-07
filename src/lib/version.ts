// src/lib/version.ts

/** App version injected from package.json at build time. */
export const APP_VERSION: string =
  (import.meta.env.VITE_APP_VERSION as string | undefined) ?? '0.0.0';

/** Set to false when exiting beta. */
export const IS_BETA = true;
