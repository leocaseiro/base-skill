import { Volume2 } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';
import { useSettings } from '@/db/hooks/useSettings';
import { whenSoundEnds } from '@/lib/audio/AudioFeedback';
import { speak } from '@/lib/speech/SpeechOutput';

export const SpotAllPrompt = ({
  target,
  ttsEnabled,
}: {
  target: string;
  ttsEnabled: boolean;
}): JSX.Element => {
  const { t, i18n } = useTranslation('games');
  const { settings } = useSettings();
  const prompt = t('spot-all-ui.prompt', { target });

  const speakPrompt = (): void => {
    speak(prompt, {
      rate: settings.speechRate ?? 1,
      volume: settings.volume ?? 0.8,
      voiceName: settings.preferredVoiceURI,
      lang: i18n.language,
    });
  };

  useEffect(() => {
    if (!ttsEnabled || !prompt) return;
    let cancelled = false;
    void whenSoundEnds().then(() => {
      if (!cancelled) speakPrompt();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-speak only when target/ttsEnabled changes, not on every speakPrompt re-creation
  }, [target, ttsEnabled]);

  return (
    <div className="flex items-center justify-center gap-3">
      <p className="text-center text-2xl font-semibold text-foreground">
        {prompt}
      </p>
      {ttsEnabled && (
        <button
          type="button"
          aria-label={t('spot-all-ui.speak-prompt')}
          className="flex size-10 shrink-0 items-center justify-center rounded-full shadow-md active:scale-95"
          style={{
            background: 'var(--skin-question-audio-bg)',
            color: 'var(--skin-question-audio-fg)',
          }}
          onClick={speakPrompt}
        >
          <Volume2 size={20} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
