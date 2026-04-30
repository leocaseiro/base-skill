import { useTranslation } from 'react-i18next';
import type { JSX } from 'react';

export const SpotAllPrompt = ({
  target,
}: {
  target: string;
}): JSX.Element => {
  const { t } = useTranslation('games');
  const prompt = t('spot-all-ui.prompt', { target });
  return (
    <p className="text-center text-2xl font-semibold text-foreground">
      {prompt}
    </p>
  );
};
