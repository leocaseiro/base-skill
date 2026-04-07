// src/lib/service-worker/ServiceWorkerProvider.tsx
import { ServiceWorkerContext } from './ServiceWorkerContext';
import { useServiceWorker } from './useServiceWorker';
import type { ReactNode } from 'react';

export const ServiceWorkerProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const value = useServiceWorker();
  return (
    <ServiceWorkerContext.Provider value={value}>
      {children}
    </ServiceWorkerContext.Provider>
  );
};
