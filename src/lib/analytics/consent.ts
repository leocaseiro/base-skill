export type ConsentState = 'granted' | 'denied' | 'unset';

const STORAGE_KEY = 'baseskill:analytics-consent';
const listeners = new Set<() => void>();

export const getConsent = (): ConsentState => {
  if (!('window' in globalThis)) return 'unset';
  try {
    const value = globalThis.localStorage.getItem(STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : 'unset';
  } catch {
    return 'unset';
  }
};

export const setConsent = (value: 'granted' | 'denied'): void => {
  if (!('window' in globalThis)) return;
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, value);
    for (const listener of listeners) listener();
  } catch {
    // localStorage unavailable (private mode, quota, blocked)
  }
};

export const subscribeConsent = (
  listener: () => void,
): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
