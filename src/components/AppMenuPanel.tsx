import { Link } from '@tanstack/react-router';
import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SettingsPanel } from '@/components/SettingsPanel/SettingsPanel';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  SheetClose,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';

export type AppLocale = 'en' | 'pt-BR';

type AppMenuPanelProps = {
  locale: string;
  onLocaleChange: (locale: AppLocale) => void;
};

// Same size and position as the in-game chrome trigger so toggle = zero
// cursor travel. Idles as just the icon — no chrome until hovered/focused
// so it doesn't compete with menu content for attention.
const TOGGLE_BUTTON_CLASS =
  'flex size-10 shrink-0 items-center justify-center rounded-full bg-transparent text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

export const AppMenuPanel = ({
  locale,
  onLocaleChange,
}: AppMenuPanelProps) => {
  const { t } = useTranslation('common');

  return (
    <SheetContent side="left" showCloseButton={false}>
      <SheetTitle className="sr-only">{t('appName')}</SheetTitle>

      <div className="flex items-center gap-3 p-4">
        <SheetClose asChild>
          <button
            type="button"
            className={TOGGLE_BUTTON_CLASS}
            aria-label={t('closeMenu')}
          >
            <Menu aria-hidden className="size-5" strokeWidth={2.25} />
          </button>
        </SheetClose>

        <SheetClose asChild>
          <Link
            to="/$locale"
            params={{ locale }}
            className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] no-underline"
          >
            {t('appName')}
          </Link>
        </SheetClose>
      </div>

      <div className="flex flex-col gap-6 px-4 pb-4">
        <div className="flex items-center justify-between">
          <a
            href="/base-skill/docs/"
            className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] no-underline"
            target="_blank"
            rel="noreferrer"
          >
            Docs
          </a>
          <ThemeToggle />
        </div>
        <SettingsPanel
          locale={locale}
          onLocaleChange={onLocaleChange}
        />
      </div>
    </SheetContent>
  );
};
