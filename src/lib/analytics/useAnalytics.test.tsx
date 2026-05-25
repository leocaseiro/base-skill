import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setConsent } from './consent.js';
import * as ga4 from './ga4.js';
import { useAnalytics } from './useAnalytics.js';

type RouterSubscribe = (
  event: string,
  handler: (e: { toLocation: { pathname: string } }) => void,
) => () => void;

const noop = (): void => undefined;
const subscribeMock = vi.fn<RouterSubscribe>(() => noop);

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({
    state: { location: { pathname: '/current' } },
    subscribe: subscribeMock,
  }),
}));

vi.mock('./ga4.js', () => ({
  isAnalyticsEnabled: vi.fn(),
  loadGtag: vi.fn(),
  trackPageView: vi.fn(),
}));

const enabledMock = vi.mocked(ga4.isAnalyticsEnabled);
const loadGtagMock = vi.mocked(ga4.loadGtag);
const trackPageViewMock = vi.mocked(ga4.trackPageView);

describe('useAnalytics', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
    subscribeMock.mockClear().mockReturnValue(noop);
    enabledMock.mockReset();
    loadGtagMock.mockReset();
    trackPageViewMock.mockReset();
  });

  it('does nothing when analytics is disabled', () => {
    enabledMock.mockReturnValue(false);
    setConsent('granted');
    renderHook(() => {
      useAnalytics();
    });
    expect(loadGtagMock).not.toHaveBeenCalled();
    expect(subscribeMock).not.toHaveBeenCalled();
    expect(trackPageViewMock).not.toHaveBeenCalled();
  });

  it('does nothing when consent is not granted', () => {
    enabledMock.mockReturnValue(true);
    // consent stays 'unset' (default)
    renderHook(() => {
      useAnalytics();
    });
    expect(loadGtagMock).not.toHaveBeenCalled();
    expect(subscribeMock).not.toHaveBeenCalled();
    expect(trackPageViewMock).not.toHaveBeenCalled();
  });

  it('does nothing when consent is denied', () => {
    enabledMock.mockReturnValue(true);
    setConsent('denied');
    renderHook(() => {
      useAnalytics();
    });
    expect(loadGtagMock).not.toHaveBeenCalled();
    expect(subscribeMock).not.toHaveBeenCalled();
  });

  it('loads gtag, tracks current page, and subscribes to router when consent granted', () => {
    enabledMock.mockReturnValue(true);
    setConsent('granted');
    renderHook(() => {
      useAnalytics();
    });
    expect(loadGtagMock).toHaveBeenCalledOnce();
    expect(trackPageViewMock).toHaveBeenCalledWith('/current');
    expect(subscribeMock).toHaveBeenCalledWith(
      'onResolved',
      expect.any(Function),
    );
  });

  it('subscriber fires trackPageView for new locations', () => {
    enabledMock.mockReturnValue(true);
    setConsent('granted');
    renderHook(() => {
      useAnalytics();
    });
    const [, handler] = subscribeMock.mock.calls[0]!;
    (handler as (e: { toLocation: { pathname: string } }) => void)({
      toLocation: { pathname: '/next' },
    });
    expect(trackPageViewMock).toHaveBeenCalledWith('/next');
  });
});
