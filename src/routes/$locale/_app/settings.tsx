import {
  createFileRoute,
  useLocation,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { SettingsPanel } from '@/components/SettingsPanel';

const SettingsScreen = () => {
  const { t } = useTranslation('settings');
  const { locale } = useParams({ from: '/$locale' });
  const navigate = useNavigate();
  const location = useLocation();

  const handleLocaleChange = (newLocale: string) => {
    const newPath = location.pathname.replace(
      /^\/(en|pt-BR)/,
      `/${newLocale}`,
    );
    void navigate({ to: newPath });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>
      <SettingsPanel
        locale={locale}
        onLocaleChange={handleLocaleChange}
      />
    </div>
  );
};

export const Route = createFileRoute('/$locale/_app/settings')({
  component: SettingsScreen,
});
