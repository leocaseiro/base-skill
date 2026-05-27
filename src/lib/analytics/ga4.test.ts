import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { isAnalyticsEnabled, loadGtag, trackPageView } from './ga4.js';

describe('ga4', () => {
  beforeEach(() => {
    delete globalThis.dataLayer;
    delete globalThis.gtag;
    for (const script of document.querySelectorAll(
      'script[data-ga-loaded]',
    )) {
      script.remove();
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('isAnalyticsEnabled', () => {
    it('returns false when VITE_GA_MEASUREMENT_ID is empty', () => {
      vi.stubEnv('VITE_GA_MEASUREMENT_ID', '');
      expect(isAnalyticsEnabled()).toBe(false);
    });

    it('returns true when VITE_GA_MEASUREMENT_ID is set', () => {
      vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123');
      expect(isAnalyticsEnabled()).toBe(true);
    });
  });

  describe('loadGtag', () => {
    it('no-ops when measurement ID is empty', () => {
      vi.stubEnv('VITE_GA_MEASUREMENT_ID', '');
      loadGtag();
      expect(
        document.querySelector('script[data-ga-loaded]'),
      ).toBeNull();
      expect(globalThis.gtag).toBeUndefined();
    });

    it('injects gtag script tag and initializes gtag/dataLayer', () => {
      vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123');
      loadGtag();
      const script = document.querySelector('script[data-ga-loaded]');
      expect(script).not.toBeNull();
      expect(script?.getAttribute('src')).toContain('id=G-TEST123');
      expect(globalThis.gtag).toBeTypeOf('function');
      expect(Array.isArray(globalThis.dataLayer)).toBe(true);
    });

    it('is idempotent across repeated calls', () => {
      vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123');
      loadGtag();
      loadGtag();
      loadGtag();
      const scripts = document.querySelectorAll(
        'script[data-ga-loaded]',
      );
      expect(scripts).toHaveLength(1);
    });

    it('preserves an existing dataLayer if already on window', () => {
      vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123');
      const existing: unknown[] = [{ pre: 'existing' }];
      globalThis.dataLayer = existing;
      loadGtag();
      expect(globalThis.dataLayer).toBe(existing);
    });
  });

  describe('trackPageView', () => {
    it('does not throw when gtag is missing', () => {
      expect(() => trackPageView('/foo')).not.toThrow();
    });

    it('calls gtag with page_view event when loaded', () => {
      const gtagSpy = vi.fn();
      globalThis.gtag = gtagSpy;
      trackPageView('/some/path');
      expect(gtagSpy).toHaveBeenCalledWith('event', 'page_view', {
        page_path: '/some/path',
      });
    });
  });
});
