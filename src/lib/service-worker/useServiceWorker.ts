// src/lib/service-worker/useServiceWorker.ts
import { useEffect, useRef, useState } from 'react';
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

    const wb = new Workbox('/base-skill/sw.js');
    wbRef.current = wb;

    wb.addEventListener('waiting', () => {
      setUpdateAvailable(true);
    });

    void wb.register();
  }, []);

  const applyUpdate = () => {
    const wb = wbRef.current;
    if (!wb) return;
    wb.addEventListener('controlling', () => {
      globalThis.location.reload();
    });
    void wb.messageSkipWaiting();
  };

  return { updateAvailable, applyUpdate };
};
