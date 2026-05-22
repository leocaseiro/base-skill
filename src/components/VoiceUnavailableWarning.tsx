import { Link, useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/db/hooks/useSettings';
import { safeGetVoices } from '@/lib/speech/safe-get-voices';

const getSynth = (): SpeechSynthesis | undefined =>
  (globalThis as unknown as { speechSynthesis?: SpeechSynthesis })
    .speechSynthesis;

export const VoiceUnavailableWarning = () => {
  const { t } = useTranslation('common');
  const { settings } = useSettings();
  const { locale } = useParams({ from: '/$locale' });
  const preferredVoice = settings.preferredVoiceURI;

  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const synth = getSynth();
    if (!preferredVoice || !synth) return;
    const check = () => {
      const voices = safeGetVoices(synth);
      if (voices.length === 0) return;
      setUnavailable(!voices.some((v) => v.name === preferredVoice));
    };
    check();
    synth.addEventListener('voiceschanged', check);
    return () => {
      synth.removeEventListener('voiceschanged', check);
      setUnavailable(false);
    };
  }, [preferredVoice]);

  if (!unavailable || !preferredVoice) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex items-center justify-center gap-2 bg-yellow-100 px-4 py-2 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
    >
      <span>
        {t('voiceUnavailable.banner', { voice: preferredVoice })}
      </span>
      <Link
        to="/$locale/settings"
        params={{ locale }}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2"
      >
        {t('voiceUnavailable.openSettings')}
      </Link>
    </div>
  );
};
