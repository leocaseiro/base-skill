import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EMPTY } from 'rxjs';
import type { ThemeDoc } from '@/db/schemas/themes';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useRxDB } from '@/db/hooks/useRxDB';
import { useRxQuery } from '@/db/hooks/useRxQuery';
import { useSettings } from '@/db/hooks/useSettings';
import { safeGetVoices } from '@/lib/speech/safe-get-voices';

const LOCALES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'pt-BR', label: '🇧🇷 Português' },
] as const;

type Locale = (typeof LOCALES)[number]['code'];

type SettingsPanelProps = {
  locale: string;
  onLocaleChange: (locale: Locale) => void;
};

export const SettingsPanel = ({
  locale,
  onLocaleChange,
}: SettingsPanelProps) => {
  const { t } = useTranslation('settings');
  const { settings, update } = useSettings();
  const { db } = useRxDB();

  const volume = settings.volume ?? 0.8;
  const speechRate = settings.speechRate ?? 1;
  const preferredVoice = settings.preferredVoiceURI ?? '';
  const voiceSelectValue =
    preferredVoice === '' ? '__default__' : preferredVoice;

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voicesLoaded, setVoicesLoaded] = useState(() => {
    const synth = (
      globalThis as unknown as { speechSynthesis?: SpeechSynthesis }
    ).speechSynthesis;
    return !synth;
  });

  useEffect(() => {
    const synth = (
      globalThis as unknown as { speechSynthesis?: SpeechSynthesis }
    ).speechSynthesis;
    if (!synth) return;
    const load = () => {
      setVoices(safeGetVoices(synth));
      setVoicesLoaded(true);
    };
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
  const activeThemeId = settings.themeId ?? 'theme_ocean_preset';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="settings-volume">
          {t('volume', { percent: Math.round(volume * 100) })}
        </Label>
        <Slider
          id="settings-volume"
          min={0}
          max={1}
          step={0.05}
          value={[volume]}
          onValueChange={([v]) => void update({ volume: v })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="settings-speechRate">
          {t('speechRate', { rate: speechRate })}
        </Label>
        <Slider
          id="settings-speechRate"
          min={0.5}
          max={2}
          step={0.1}
          value={[speechRate]}
          onValueChange={([v]) => void update({ speechRate: v })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="settings-voice">{t('voice')}</Label>
        <Select
          value={voiceSelectValue}
          onValueChange={(v) =>
            void update({
              preferredVoiceURI: v === '__default__' ? '' : v,
            })
          }
          disabled={!voicesLoaded}
        >
          <SelectTrigger id="settings-voice">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__default__">
              {t('voiceDefault')}
            </SelectItem>
            {voices.map((v) => (
              <SelectItem key={v.name} value={v.name}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="settings-language">{t('language')}</Label>
        <Select
          value={locale}
          onValueChange={(v) => onLocaleChange(v as Locale)}
        >
          <SelectTrigger id="settings-language">
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
          <Label htmlFor="settings-theme">{t('theme')}</Label>
          <Select
            value={activeThemeId}
            onValueChange={(v) => void update({ themeId: v })}
          >
            <SelectTrigger id="settings-theme">
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
  );
};
