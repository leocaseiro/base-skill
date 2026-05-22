// src/components/game/useFullscreen.test.ts
import { act, renderHook } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { useFullscreen } from './useFullscreen';

const PSEUDO_FS_ATTR = 'data-pseudo-fullscreen';

const setFullscreenEnabled = (value: boolean | undefined) => {
  Object.defineProperty(document, 'fullscreenEnabled', {
    configurable: true,
    value,
  });
};

const setRequestFullscreen = (fn: () => Promise<void>) => {
  Object.defineProperty(document.documentElement, 'requestFullscreen', {
    configurable: true,
    value: fn,
  });
};

const setExitFullscreen = (fn: () => Promise<void>) => {
  Object.defineProperty(document, 'exitFullscreen', {
    configurable: true,
    value: fn,
  });
};

const setUserAgent = (ua: string) => {
  Object.defineProperty(navigator, 'userAgent', {
    configurable: true,
    value: ua,
  });
};

const setNavigatorPlatform = (platform: string) => {
  Object.defineProperty(navigator, 'platform', {
    configurable: true,
    value: platform,
  });
};

const setMaxTouchPoints = (n: number) => {
  Object.defineProperty(navigator, 'maxTouchPoints', {
    configurable: true,
    value: n,
  });
};

const setStandaloneSafari = (value: boolean | undefined) => {
  Object.defineProperty(globalThis.navigator, 'standalone', {
    configurable: true,
    value,
  });
};

const setMatchMediaStandalone = (matches: boolean) => {
  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((q: string) => ({
      matches: q.includes('standalone') ? matches : false,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })),
  });
};

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';

beforeEach(() => {
  setMatchMediaStandalone(false);
  setStandaloneSafari(false);
  setUserAgent(DESKTOP_UA);
  setNavigatorPlatform('MacIntel');
  setMaxTouchPoints(0);
  setFullscreenEnabled(false);
  // Clean attribute leftover from prior tests
  document.documentElement.removeAttribute(PSEUDO_FS_ATTR);
});

afterEach(() => {
  document.documentElement.removeAttribute(PSEUDO_FS_ATTR);
});

describe('useFullscreen', () => {
  describe('native fullscreen path', () => {
    it('reports supported when the standard API is available', () => {
      setFullscreenEnabled(true);
      const { result } = renderHook(() => useFullscreen());
      expect(result.current.supported).toBe(true);
    });

    it('calls requestFullscreen on toggle when not currently fullscreen', async () => {
      const request = vi.fn<() => Promise<void>>().mockResolvedValue();
      setFullscreenEnabled(true);
      setRequestFullscreen(request);
      setExitFullscreen(() => Promise.resolve());
      const { result } = renderHook(() => useFullscreen());
      await act(async () => {
        await result.current.toggle();
      });
      expect(request).toHaveBeenCalledTimes(1);
    });

    it('calls exitFullscreen on toggle when currently fullscreen', async () => {
      const exit = vi.fn<() => Promise<void>>().mockResolvedValue();
      setFullscreenEnabled(true);
      setRequestFullscreen(() => Promise.resolve());
      setExitFullscreen(exit);
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        value: document.documentElement,
      });
      const { result } = renderHook(() => useFullscreen());
      await act(async () => {
        await result.current.toggle();
      });
      expect(exit).toHaveBeenCalledTimes(1);
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        value: null,
      });
    });
  });

  describe('iPhone pseudo-fullscreen path', () => {
    beforeEach(() => {
      setFullscreenEnabled(false);
      setUserAgent(IPHONE_UA);
    });

    it('reports supported on iPhone Safari even though the native API is missing', () => {
      const { result } = renderHook(() => useFullscreen());
      expect(result.current.supported).toBe(true);
    });

    it('toggle adds the pseudo-fullscreen attribute on documentElement', () => {
      const { result } = renderHook(() => useFullscreen());
      act(() => {
        void result.current.toggle();
      });
      expect(
        document.documentElement.getAttribute(PSEUDO_FS_ATTR),
      ).toBe('true');
      expect(result.current.isFullscreen).toBe(true);
    });

    it('toggle a second time removes the pseudo-fullscreen attribute', () => {
      const { result } = renderHook(() => useFullscreen());
      act(() => {
        void result.current.toggle();
      });
      act(() => {
        void result.current.toggle();
      });
      expect(
        document.documentElement.hasAttribute(PSEUDO_FS_ATTR),
      ).toBe(false);
      expect(result.current.isFullscreen).toBe(false);
    });

    it('does not call the native requestFullscreen on iPhone', async () => {
      const request = vi.fn<() => Promise<void>>().mockResolvedValue();
      setRequestFullscreen(request);
      const { result } = renderHook(() => useFullscreen());
      await act(async () => {
        await result.current.toggle();
      });
      expect(request).not.toHaveBeenCalled();
    });

    it('cleans up the attribute when the hook unmounts while in pseudo-fullscreen', () => {
      const { result, unmount } = renderHook(() => useFullscreen());
      act(() => {
        void result.current.toggle();
      });
      expect(
        document.documentElement.hasAttribute(PSEUDO_FS_ATTR),
      ).toBe(true);
      unmount();
      expect(
        document.documentElement.hasAttribute(PSEUDO_FS_ATTR),
      ).toBe(false);
    });
  });

  describe('iPad reported as Mac (iPadOS 13+)', () => {
    it('treats Mac + touch as iOS for pseudo-fullscreen when the native API is absent', () => {
      setFullscreenEnabled(false);
      setUserAgent(DESKTOP_UA);
      setNavigatorPlatform('MacIntel');
      setMaxTouchPoints(5);
      const { result } = renderHook(() => useFullscreen());
      expect(result.current.supported).toBe(true);
    });
  });

  describe('standalone PWA mode on iOS', () => {
    it('returns supported=false in display-mode: standalone (already fullscreen)', () => {
      setFullscreenEnabled(false);
      setUserAgent(IPHONE_UA);
      setMatchMediaStandalone(true);
      const { result } = renderHook(() => useFullscreen());
      expect(result.current.supported).toBe(false);
    });

    it('returns supported=false when navigator.standalone is true (iOS Safari PWA)', () => {
      setFullscreenEnabled(false);
      setUserAgent(IPHONE_UA);
      setStandaloneSafari(true);
      const { result } = renderHook(() => useFullscreen());
      expect(result.current.supported).toBe(false);
    });
  });

  describe('non-iOS without native API', () => {
    it('returns supported=false on plain desktop browser without fullscreen API', () => {
      setFullscreenEnabled(false);
      setUserAgent(DESKTOP_UA);
      setNavigatorPlatform('Win32');
      setMaxTouchPoints(0);
      const { result } = renderHook(() => useFullscreen());
      expect(result.current.supported).toBe(false);
    });
  });
});
