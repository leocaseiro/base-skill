import { useRouter } from '@tanstack/react-router';
import { useEffect, useSyncExternalStore } from 'react';
import { getConsent, subscribeConsent } from './consent.js';
import { isAnalyticsEnabled, loadGtag, trackPageView } from './ga4.js';
import type { ConsentState } from './consent.js';

const SSR_CONSENT: ConsentState = 'unset';

export const useAnalytics = (): void => {
  const router = useRouter();
  const consent = useSyncExternalStore(
    subscribeConsent,
    getConsent,
    () => SSR_CONSENT,
  );

  useEffect(() => {
    if (!isAnalyticsEnabled()) return;
    if (consent !== 'granted') return;

    loadGtag();
    trackPageView(router.state.location.pathname);

    const unsubscribe = router.subscribe(
      'onResolved',
      ({ toLocation }) => {
        trackPageView(toLocation.pathname);
      },
    );

    return unsubscribe;
  }, [consent, router]);
};
