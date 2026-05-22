import { useCallback, useEffect, useState } from 'react';

export type UseFullscreenResult = {
  supported: boolean;
  isFullscreen: boolean;
  toggle: () => Promise<void>;
};

const PSEUDO_FULLSCREEN_ATTR = 'data-pseudo-fullscreen';

type IOSNavigator = Navigator & { standalone?: boolean };

const hasNativeFullscreen = (): boolean =>
  typeof document !== 'undefined' &&
  document.fullscreenEnabled === true;

// iPhone Safari (every version through at least iOS 17) does not implement
// `Element.requestFullscreen`, so `document.fullscreenEnabled` is undefined.
// iPadOS 13+ also reports the desktop UA, so we treat MacIntel + touch as iOS.
const isIOSDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  return (
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  );
};

const isStandalonePWA = (): boolean => {
  if (!('window' in globalThis)) return false;
  if (globalThis.matchMedia('(display-mode: standalone)').matches)
    return true;
  return (globalThis.navigator as IOSNavigator).standalone === true;
};

const supportsPseudoFullscreen = (): boolean =>
  isIOSDevice() && !isStandalonePWA();

export const useFullscreen = (): UseFullscreenResult => {
  const [hasNative] = useState(hasNativeFullscreen);
  const [hasPseudo] = useState(
    () => !hasNativeFullscreen() && supportsPseudoFullscreen(),
  );
  const supported = hasNative || hasPseudo;

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined' || !hasNative) return;

    const sync = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    sync();
    document.addEventListener('fullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
    };
  }, [hasNative]);

  useEffect(() => {
    if (!hasPseudo) return;
    return () => {
      // Restore page chrome if the component owning the toggle unmounts
      // while the user is still in pseudo-fullscreen (e.g. game ends).
      document.documentElement.removeAttribute(PSEUDO_FULLSCREEN_ATTR);
    };
  }, [hasPseudo]);

  const toggle = useCallback(async () => {
    if (typeof document === 'undefined') return;

    if (hasNative) {
      await (document.fullscreenElement
        ? document.exitFullscreen()
        : document.documentElement.requestFullscreen());
      return;
    }

    if (!hasPseudo) return;

    const root = document.documentElement;
    const next = root.getAttribute(PSEUDO_FULLSCREEN_ATTR) !== 'true';
    if (next) {
      root.setAttribute(PSEUDO_FULLSCREEN_ATTR, 'true');
      // Nudge iOS Safari to collapse its URL bar
      globalThis.scrollTo(0, 1);
    } else {
      root.removeAttribute(PSEUDO_FULLSCREEN_ATTR);
    }
    setIsFullscreen(next);
  }, [hasNative, hasPseudo]);

  return { supported, isFullscreen, toggle };
};
