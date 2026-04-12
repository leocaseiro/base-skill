import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import {
  MenuIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EMPTY } from 'rxjs';
import type { ThemeDoc } from '@/db/schemas/themes';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { useRxDB } from '@/db/hooks/useRxDB';
import { useRxQuery } from '@/db/hooks/useRxQuery';
import { useSettings } from '@/db/hooks/useSettings';
import { safeGetVoices } from '@/lib/speech/safe-get-voices';
import { APP_VERSION, IS_BETA } from '@/lib/version';

const LOCALES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'pt-BR', label: '🇧🇷 Português' },
] as const;

type HeaderLocale = (typeof LOCALES)[number]['code'];

const HeaderMenuPanel = ({
  appName,
  locale,
  onLocaleChange,
}: {
  appName: string;
  locale: string;
  onLocaleChange: (locale: HeaderLocale) => void;
}) => {
  const { t } = useTranslation('settings');
  const { settings, update } = useSettings();
  const { db } = useRxDB();
  const volume = settings.volume ?? 0.8;
  const speechRate = settings.speechRate ?? 1;
  const activeThemeId = settings.themeId ?? 'theme_ocean_preset';
  const preferredVoice = settings.preferredVoiceURI ?? '';
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const synth = (
      globalThis as unknown as { speechSynthesis?: SpeechSynthesis }
    ).speechSynthesis;
    if (!synth) return;
    const load = () => setVoices(safeGetVoices(synth));
    load();
    synth.addEventListener('voiceschanged', load);
    return () => synth.removeEventListener('voiceschanged', load);
  }, []);

  const themes$ = useMemo(
    () => (db ? db.themes.find().$ : EMPTY),
    [db],
  );
  const themeDocs = useRxQuery<{ toJSON: () => ThemeDoc }[]>(
    themes$,
    [],
  );
  const themes = themeDocs.map((d) => d.toJSON());

  return (
    <SheetContent side="right">
      <SheetHeader>
        <SheetTitle>{appName}</SheetTitle>
      </SheetHeader>
      <div className="flex flex-col gap-6 p-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="drawer-volume">
            {t('volume', { percent: Math.round(volume * 100) })}
          </Label>
          <Slider
            id="drawer-volume"
            min={0}
            max={1}
            step={0.05}
            value={[volume]}
            onValueChange={([v]) => {
              void update({ volume: v });
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="drawer-speechRate">
            {t('speechRate', { rate: speechRate })}
          </Label>
          <Slider
            id="drawer-speechRate"
            min={0.5}
            max={2}
            step={0.1}
            value={[speechRate]}
            onValueChange={([v]) => {
              void update({ speechRate: v });
            }}
          />
        </div>

        {voices.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="drawer-voice">{t('voice')}</Label>
            <Select
              value={preferredVoice}
              onValueChange={(v) =>
                void update({ preferredVoiceURI: v })
              }
            >
              <SelectTrigger id="drawer-voice">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {voices.map((v) => (
                  <SelectItem key={v.name} value={v.name}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="drawer-language">{t('language')}</Label>
          <Select
            value={locale}
            onValueChange={(v) => onLocaleChange(v as HeaderLocale)}
          >
            <SelectTrigger id="drawer-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCALES.map(({ code, label }) => (
                <SelectItem key={code} value={code}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {themes.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="drawer-theme">{t('theme')}</Label>
            <Select
              value={activeThemeId}
              onValueChange={(v) => void update({ themeId: v })}
            >
              <SelectTrigger id="drawer-theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {themes.map(({ id, name, isPreset }) => (
                  <SelectItem key={id} value={id}>
                    {isPreset
                      ? t(`themes.${id}`, { defaultValue: name })
                      : name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </SheetContent>
  );
};

const FiltersDropdown = ({
  filtersLabel,
  subjectsAll,
}: {
  filtersLabel: string;
  subjectsAll: string;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm" aria-label={filtersLabel}>
        <SlidersHorizontalIcon size={16} />
        <span className="hidden sm:inline">{filtersLabel}</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
      <div className="text-muted-foreground px-2 py-1.5 text-sm">
        {subjectsAll}
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
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
  const location = useLocation();
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
    const newPath = location.pathname.replace(
      /^\/(en|pt-BR)/,
      `/${newLocale}`,
    );
    void navigate({ to: newPath });
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
          className="flex-shrink-0 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] no-underline"
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

          <FiltersDropdown
            filtersLabel={t('search.filters')}
            subjectsAll={t('subjects.all')}
          />
        </div>

        <ThemeToggle />

        <Sheet>
          <MenuSheetTrigger />
          <HeaderMenuPanel
            appName={t('appName')}
            locale={locale}
            onLocaleChange={switchLocale}
          />
        </Sheet>
      </div>
    </header>
  );
};
