import { Link, useNavigate, useParams } from '@tanstack/react-router';
import {
  MenuIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const LOCALES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'pt-BR', label: '🇧🇷 Português' },
] as const;

type HeaderLocale = (typeof LOCALES)[number]['code'];

const HeaderFiltersPanel = ({
  filtersTitle,
  subjectsAll,
}: {
  filtersTitle: string;
  subjectsAll: string;
}) => (
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>{filtersTitle}</SheetTitle>
    </SheetHeader>
    <div className="p-4">
      <p className="text-muted-foreground text-sm">{subjectsAll}</p>
    </div>
  </SheetContent>
);

const HeaderMenuPanel = ({
  appName,
  locale,
  settingsLabel,
}: {
  appName: string;
  locale: string;
  settingsLabel: string;
}) => (
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>{appName}</SheetTitle>
    </SheetHeader>
    <nav className="flex flex-col gap-1 p-4">
      <Link
        to="/$locale/settings"
        params={{ locale }}
        className="hover:bg-muted rounded-md px-3 py-2 text-sm font-medium"
      >
        {settingsLabel}
      </Link>
    </nav>
  </SheetContent>
);

const FiltersSheetTrigger = ({
  filtersLabel,
}: {
  filtersLabel: string;
}) => (
  <SheetTrigger asChild>
    <Button variant="outline" size="sm" aria-label={filtersLabel}>
      <SlidersHorizontalIcon size={16} />
      <span className="hidden sm:inline">{filtersLabel}</span>
    </Button>
  </SheetTrigger>
);

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
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // The search input is uncontrolled — it navigates to the home route on change.
  // It does not read the current search param (avoiding router hook complexity in a layout component).
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

  const switchLocale = (newLocale: HeaderLocale) => {
    void navigate({
      to: '/$locale',
      params: { locale: newLocale },
    });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] backdrop-blur-lg">
      <div className="flex items-center gap-3 px-4 py-3">
        <Link
          to="/$locale"
          params={{ locale }}
          className="flex-shrink-0 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] no-underline"
        >
          {t('appName')}
        </Link>

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

          <Sheet>
            <FiltersSheetTrigger filtersLabel={t('search.filters')} />
            <HeaderFiltersPanel
              filtersTitle={t('search.filters')}
              subjectsAll={t('subjects.all')}
            />
          </Sheet>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('nav.language')}
            >
              {locale === 'pt-BR' ? '🇧🇷' : '🇬🇧'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {LOCALES.map(({ code, label }) => (
              <DropdownMenuItem
                key={code}
                onClick={() => switchLocale(code)}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Sheet>
          <MenuSheetTrigger />
          <HeaderMenuPanel
            appName={t('appName')}
            locale={locale}
            settingsLabel={t('nav.settings')}
          />
        </Sheet>
      </div>
    </header>
  );
};
