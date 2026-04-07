// src/lib/service-worker/ServiceWorkerContext.ts
import { createContext } from 'react';

export interface ServiceWorkerContextValue {
  updateAvailable: boolean;
  applyUpdate: () => void;
}

export const ServiceWorkerContext =
  createContext<ServiceWorkerContextValue>({
    updateAvailable: false,
    applyUpdate: () => {},
  });
