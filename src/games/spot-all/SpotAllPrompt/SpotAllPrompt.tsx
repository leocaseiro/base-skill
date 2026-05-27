import { Volume2 } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';
import { useSettings } from '@/db/hooks/useSettings';
import { whenSoundEnds } from '@/lib/audio/AudioFeedback';
import { safeGetVoices } from '@/lib/speech/safe-get-voices';
import { speak } from '@/lib/speech/SpeechOutput';
import { getSynth } from '@/lib/speech/synth-access';
import { isVoiceAvailableInList } from '@/lib/speech/voices';
import { useVoiceUnavailableDialog } from '@/providers/VoiceUnavailableDialogProvider';

const isPreferredVoiceAvailable = (voiceName: string): boolean => {
  const synth = getSynth();
  if (!synth) return true;
  const voices = safeGetVoices(synth);
  if (voices.length === 0) return true;
  return isVoiceAvailableInList(voiceName, voices);
};

export const SpotAllPrompt = ({
  target,
  ttsEnabled,
}: {
  target: string;
  ttsEnabled: boolean;
}): JSX.Element => {
  const { t, i18n } = useTranslation('games');
  const { settings } = useSettings();
  const { show: showVoiceDialog } = useVoiceUnavailableDialog();
  const prompt = t('spot-all-ui.prompt', { target });

  const speakPromptAuto = (): void => {
    // Auto path: silent-fallback on missing preferred voice;
    // the global VoiceUnavailableWarning banner informs the user.
    if (
      settings.preferredVoiceURI &&
      !isPreferredVoiceAvailable(settings.preferredVoiceURI)
    ) {
      return;
    }
    speak(prompt, {
      rate: settings.speechRate ?? 1,
      volume: settings.voiceVolume ?? 0.8,
      voiceName: settings.preferredVoiceURI,
      lang: i18n.language,
    });
  };

  const speakPromptOnDemand = (): void => {
    // On-demand path: show dialog when preferred voice is missing
    // so the user can fix the configuration immediately.
    if (
      settings.preferredVoiceURI &&
      !isPreferredVoiceAvailable(settings.preferredVoiceURI)
    ) {
      showVoiceDialog(settings.preferredVoiceURI, i18n.language);
      return;
    }
    speak(prompt, {
      rate: settings.speechRate ?? 1,
      volume: settings.voiceVolume ?? 0.8,
      voiceName: settings.preferredVoiceURI,
      lang: i18n.language,
    });
  };

  useEffect(() => {
    if (!ttsEnabled || !prompt) return;
    let cancelled = false;
    void whenSoundEnds().then(() => {
      if (!cancelled) speakPromptAuto();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-speak only when target/ttsEnabled changes, not on every speakPromptAuto re-creation
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
          onClick={speakPromptOnDemand}
        >
          <Volume2 size={20} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
