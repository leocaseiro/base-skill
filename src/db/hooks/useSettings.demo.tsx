import { useSettings } from './useSettings';
import { createStorybookDatabase } from '#/db';
import { DbProvider } from '#/providers/DbProvider';

const openStorybookDatabase = () => createStorybookDatabase();

const SettingsInner = () => {
  const { settings } = useSettings();

  return (
    <div className="flex flex-col gap-2 p-4 font-mono text-sm">
      <div>volume: {settings.volume}</div>
      <div>speechRate: {settings.speechRate}</div>
      <div>ttsEnabled: {String(settings.ttsEnabled)}</div>
      <div>showSubtitles: {String(settings.showSubtitles)}</div>
    </div>
  );
};

export const UseSettingsDemo = () => (
  <DbProvider openDatabase={openStorybookDatabase}>
    <SettingsInner />
  </DbProvider>
);
