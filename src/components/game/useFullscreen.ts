import { useCallback, useEffect, useState } from 'react';

export type UseFullscreenResult = {
  supported: boolean;
  isFullscreen: boolean;
  toggle: () => Promise<void>;
};

const isFullscreenEnabled = () =>
  typeof document !== 'undefined' &&
  document.fullscreenEnabled === true;

export const useFullscreen = (): UseFullscreenResult => {
  const [supported] = useState(isFullscreenEnabled);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const sync = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    sync();
    document.addEventListener('fullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
    };
  }, []);

  const toggle = useCallback(async () => {
    if (typeof document === 'undefined' || !isFullscreenEnabled())
      return;
    await (document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen());
  }, []);

  return { supported, isFullscreen, toggle };
};
