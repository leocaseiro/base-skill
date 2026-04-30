import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';
import { AudioButton } from '@/components/questions/AudioButton/AudioButton';

export const SpotAllPrompt = ({
  target,
}: {
  target: string;
}): JSX.Element => {
  const { t } = useTranslation();
  const prompt = t('spot-all-ui.prompt', { target });
  return (
    <p className="text-center text-2xl font-semibold text-foreground">
      {prompt}
      <AudioButton prompt={prompt} />
    </p>
  );
};
