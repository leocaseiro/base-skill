declare global {
  var dataLayer: unknown[] | undefined;
  var gtag: ((...args: unknown[]) => void) | undefined;
}

const SCRIPT_MARKER_ATTR = 'data-ga-loaded';

const getMeasurementId = (): string =>
  import.meta.env.VITE_GA_MEASUREMENT_ID ?? '';

export const isAnalyticsEnabled = (): boolean =>
  getMeasurementId().length > 0;

export const loadGtag = (): void => {
  if (!('window' in globalThis)) return;
  const id = getMeasurementId();
  if (!id) return;
  if (document.querySelector(`script[${SCRIPT_MARKER_ATTR}]`)) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  script.setAttribute(SCRIPT_MARKER_ATTR, '1');
  document.head.append(script);

  globalThis.dataLayer = globalThis.dataLayer ?? [];
  globalThis.gtag = (...args: unknown[]): void => {
    globalThis.dataLayer?.push(args);
  };
  globalThis.gtag('js', new Date());
  globalThis.gtag('config', id);
};

export const trackPageView = (path: string): void => {
  if (!('window' in globalThis)) return;
  if (!globalThis.gtag) return;
  globalThis.gtag('event', 'page_view', { page_path: path });
};
