// src/components/UpdateBanner.tsx
import { useLocation } from '@tanstack/react-router';
import { useContext, useState } from 'react';
import { ServiceWorkerContext } from '@/lib/service-worker/ServiceWorkerContext';

export const UpdateBanner = () => {
  const { updateAvailable, applyUpdate } = useContext(
    ServiceWorkerContext,
  );
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);

  const isGameRoute = location.pathname.includes('/game/');

  if (!updateAvailable || isGameRoute || dismissed) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-between bg-[var(--sea-ink)] px-4 py-2 text-sm text-white"
    >
      <span>New version available — tap to update</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="underline underline-offset-2"
          onClick={applyUpdate}
        >
          Update
        </button>
        <button
          type="button"
          aria-label="Dismiss update notification"
          className="opacity-70 hover:opacity-100"
          onClick={() => setDismissed(true)}
        >
          ✕
        </button>
      </div>
    </div>
  );
};
