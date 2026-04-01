import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LOCALES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'pt-BR', label: '🇧🇷 Português' },
] as const;

type FooterLocale = (typeof LOCALES)[number]['code'];

export const Footer = () => {
  const { t } = useTranslation('common');
  const { locale } = useParams({ from: '/$locale' });
  const navigate = useNavigate();

  const switchLocale = (newLocale: FooterLocale) => {
    void navigate({
      to: '/$locale',
      params: { locale: newLocale },
    });
  };

  return (
    <footer className="border-t border-[var(--line)] px-4 py-6">
      <nav className="flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/$locale/settings"
          params={{ locale }}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          {t('nav.settings')}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label={t('nav.language')}
            >
              {locale === 'pt-BR' ? '🇧🇷' : '🇬🇧'} {t('nav.language')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
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
      </nav>
    </footer>
  );
};
