import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { MenuIcon, SearchIcon } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppLocale } from '@/components/AppMenuPanel';
import { AppMenuPanel } from '@/components/AppMenuPanel';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { isAppGameSessionPath } from '@/lib/app-paths';
import { APP_VERSION, IS_BETA } from '@/lib/version';

const MenuSheetTrigger = () => (
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Menu">
      <MenuIcon size={20} />
    </Button>
  </SheetTrigger>
);

export const Header = () => {
  const { t } = useTranslation('common');
  const { locale } = useParams({ from: '/$locale' });
  const navigate = useNavigate();
  const location = useLocation();
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const handleSearchChange = (value: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      void navigate({
        to: '/$locale',
        params: { locale },
        search: { search: value, level: '', subject: '', page: 1 },
      });
    }, 300);
  };

  const switchLocale = (newLocale: AppLocale) => {
    const newPath = location.pathname.replace(
      /^\/(en|pt-BR)/,
      `/${newLocale}`,
    );
    void navigate({ to: newPath });
  };

  if (isAppGameSessionPath(location.pathname)) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] backdrop-blur-lg">
      <div className="flex items-center gap-3 px-4 py-3">
        <Sheet>
          <MenuSheetTrigger />
          <AppMenuPanel locale={locale} onLocaleChange={switchLocale} />
        </Sheet>

        <Link
          to="/$locale"
          params={{ locale }}
          className="flex-shrink-0 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] no-underline"
        >
          {t('appName')}
        </Link>
        {IS_BETA && (
          <span className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            Beta
          </span>
        )}
        <span className="flex-shrink-0 text-xs text-muted-foreground">
          v{APP_VERSION}
        </span>

        <a
          href="/base-skill/docs/"
          className="hidden flex-shrink-0 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] no-underline sm:flex"
          target="_blank"
          rel="noreferrer"
        >
          Docs
        </a>

        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon
              size={16}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="pl-9"
              placeholder={t('search.placeholder')}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label={t('search.placeholder')}
            />
          </div>
        </div>

        <span className="hidden sm:flex">
          <ThemeToggle />
        </span>
      </div>
    </header>
  );
};
