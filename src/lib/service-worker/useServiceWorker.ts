// src/lib/service-worker/useServiceWorker.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { Workbox } from 'workbox-window';
import type { ServiceWorkerContextValue } from './ServiceWorkerContext';

/**
 * Registers the service worker via workbox-window and surfaces update state.
 * SW only activates in production builds — this hook is a no-op in dev.
 */
export const useServiceWorker = (): ServiceWorkerContextValue => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const wbRef = useRef<Workbox | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const wb = new Workbox(`${import.meta.env.BASE_URL}sw.js`);
    wbRef.current = wb;

    wb.addEventListener('waiting', () => {
      setUpdateAvailable(true);
    });

    wb.addEventListener('controlling', () => {
      globalThis.location.reload();
    });

    void wb.register();
  }, []);

  const applyUpdate = useCallback(() => {
    wbRef.current?.messageSkipWaiting();
  }, []);

  return { updateAvailable, applyUpdate };
};
