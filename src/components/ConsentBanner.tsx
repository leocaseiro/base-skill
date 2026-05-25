import { useSyncExternalStore } from 'react';
import type { ConsentState } from '@/lib/analytics/consent';
import { Button } from '@/components/ui/button';
import {
  getConsent,
  setConsent,
  subscribeConsent,
} from '@/lib/analytics/consent';
import { isAnalyticsEnabled } from '@/lib/analytics/ga4';

const SSR_CONSENT: ConsentState = 'unset';

export const ConsentBanner = () => {
  const consent = useSyncExternalStore(
    subscribeConsent,
    getConsent,
    () => SSR_CONSENT,
  );

  if (!isAnalyticsEnabled()) return null;
  if (consent !== 'unset') return null;

  return (
    <div
      role="dialog"
      aria-label="Analytics consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-background p-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground">
          BaseSkill uses Google Analytics to help us improve the app. No
          personal data is collected.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setConsent('denied');
            }}
          >
            Reject
          </Button>
          <Button
            onClick={() => {
              setConsent('granted');
            }}
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
};
