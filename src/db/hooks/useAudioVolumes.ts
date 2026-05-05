import { useEffect } from 'react';
import { useSettings } from './useSettings';
import { setSoundEffectsVolume } from '@/lib/audio/AudioFeedback';

export const useAudioVolumes = (): void => {
  const { settings } = useSettings();
  const soundEffectsVolume = settings.soundEffectsVolume ?? 0.8;

  useEffect(() => {
    setSoundEffectsVolume(soundEffectsVolume);
  }, [soundEffectsVolume]);
};
