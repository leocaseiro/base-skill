import { Maximize, Minimize } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFullscreen } from '@/components/game/useFullscreen';

// Header- and drawer-friendly chrome variant of the in-game fullscreen
// control. Lives outside of `game/` because the surrounding chrome
// (header, side menu) is shared across all routes.
export const FullscreenToggle = () => {
  const { t } = useTranslation('common');
  const { supported, isFullscreen, toggle } = useFullscreen();

  if (!supported) return null;

  const label = isFullscreen
    ? t('fullscreen.exit')
    : t('fullscreen.enter');

  return (
    <button
      type="button"
      onClick={() => {
        void toggle();
      }}
      aria-label={label}
      title={label}
      data-testid="fullscreen-toggle"
      className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] p-2 text-[var(--sea-ink)] shadow-[0_8px_22px_rgba(30,90,72,0.08)] transition hover:-translate-y-0.5"
    >
      {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
    </button>
  );
};
