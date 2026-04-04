import {
  createFileRoute,
  useLocation,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useSettings } from '@/db/hooks/useSettings';

const LOCALES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'pt-BR', label: '🇧🇷 Português' },
] as const;

const SettingsScreen = () => {
  const { t } = useTranslation('settings');
  const { locale } = useParams({ from: '/$locale' });
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, update } = useSettings();

  const handleLocaleChange = (newLocale: string) => {
    const newPath = location.pathname.replace(
      /^\/(en|pt-BR)/,
      `/${newLocale}`,
    );
    void navigate({ to: newPath });
  };

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const synth = (
      globalThis as unknown as { speechSynthesis?: SpeechSynthesis }
    ).speechSynthesis;
    if (!synth) return;
    const load = () => setVoices(synth.getVoices());
    load();
    synth.addEventListener('voiceschanged', load);
    return () => synth.removeEventListener('voiceschanged', load);
  }, []);

  const volume = settings.volume ?? 0.8;
  const speechRate = settings.speechRate ?? 1;
  const preferredVoice = settings.preferredVoiceURI ?? '';

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="volume">
            {t('volume', { percent: Math.round(volume * 100) })}
          </Label>
          <Slider
            id="volume"
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
          <Label htmlFor="speechRate">
            {t('speechRate', { rate: speechRate })}
          </Label>
          <Slider
            id="speechRate"
            min={0.5}
            max={2}
            step={0.1}
            value={[speechRate]}
            onValueChange={([v]) => {
              void update({ speechRate: v });
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="language">{t('language')}</Label>
          <Select value={locale} onValueChange={handleLocaleChange}>
            <SelectTrigger id="language">
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

        <div className="flex flex-col gap-2">
          <Label htmlFor="voice">{t('voice')}</Label>
          <Select
            value={preferredVoice}
            onValueChange={(v) => void update({ preferredVoiceURI: v })}
            disabled={voices.length === 0}
          >
            <SelectTrigger id="voice">
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
      </div>
    </div>
  );
};

export const Route = createFileRoute('/$locale/_app/settings')({
  component: SettingsScreen,
});
