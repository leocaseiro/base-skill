import { IDBFactory } from 'fake-indexeddb';
import { useSettings } from './useSettings';
import { getOrCreateDatabase } from '#/db';
import { DbProvider } from '#/providers/DbProvider';

const openFakeDatabase = () => {
  (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB =
    new IDBFactory();
  return getOrCreateDatabase();
};

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
  <DbProvider openDatabase={openFakeDatabase}>
    <SettingsInner />
  </DbProvider>
);
