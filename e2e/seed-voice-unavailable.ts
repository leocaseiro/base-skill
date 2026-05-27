import type { Page } from '@playwright/test';

/**
 * Helpers for the voice-unavailability VR specs.
 *
 * Two pieces of state need to line up before VoiceUnavailableWarning or the
 * VoiceUnavailableDialogProvider can render:
 *
 * 1. `speechSynthesis.getVoices()` returns a fixed list that does NOT contain
 *    the preferred voice. We stub `speechSynthesis` via `addInitScript` so the
 *    mock survives reloads (the addInitScript callback re-runs on every nav).
 * 2. The persisted RxDB settings doc carries
 *    `preferredVoiceURI: 'NonExistentTestVoice'`. We let the app boot, then
 *    write directly into the `rxdb-dexie-baseskill-data--3--settings` IDB
 *    store and reload — the reactive query picks the doc up on next boot.
 *    See `e2e/wordspell-resume-desync.spec.ts` for the same direct-IDB
 *    pattern (post-boot mutation + reload).
 */

const SETTINGS_IDB = 'rxdb-dexie-baseskill-data--3--settings';
const SETTINGS_DOC_ID = 'settings:anonymous';
export const UNAVAILABLE_VOICE_NAME = 'NonExistentTestVoice';
const MOCK_VOICE_NAMES = ['Samantha', 'Alex'];

/**
 * Replaces `window.speechSynthesis` with a stub whose `getVoices()` returns a
 * fixed list (default: Samantha + Alex). The stub also dispatches
 * `voiceschanged` shortly after install so listeners re-evaluate against the
 * mocked list, mirroring real-browser behaviour where voices load async.
 */
export const mockSpeechSynthesisVoices = async (
  page: Page,
  voiceNames: string[] = MOCK_VOICE_NAMES,
): Promise<void> => {
  await page.addInitScript((names) => {
    const voices = names.map(
      (name) =>
        ({
          name,
          lang: 'en-US',
          localService: true,
          default: false,
          voiceURI: name,
        }) as SpeechSynthesisVoice,
    );
    type Handler = () => void;
    const handlers = new Set<Handler>();
    const stub = {
      getVoices: () => voices,
      addEventListener: (event: string, handler: Handler) => {
        if (event === 'voiceschanged') handlers.add(handler);
      },
      removeEventListener: (event: string, handler: Handler) => {
        if (event === 'voiceschanged') handlers.delete(handler);
      },
      // No-op stubs so any production code that calls them doesn't throw.
      speak: () => {},
      cancel: () => {},
      pause: () => {},
      resume: () => {},
      pending: false,
      speaking: false,
      paused: false,
    };
    Object.defineProperty(globalThis, 'speechSynthesis', {
      configurable: true,
      get: () => stub,
    });
    // Fire voiceschanged once on next tick — listeners registered during the
    // initial render get a chance to re-evaluate against the mocked list.
    setTimeout(() => {
      for (const h of handlers) h();
    }, 0);
  }, voiceNames);
};

/**
 * Writes the anonymous settings doc straight into the `settings` IDB store
 * with `preferredVoiceURI` set to a voice that the mock does NOT expose.
 *
 * Must be called AFTER the app has booted at least once so RxDB has
 * created the `rxdb-dexie-baseskill-data--3--settings` store. Reload the
 * page afterwards so the reactive `useSettings` query re-reads the doc.
 */
export const seedPreferredVoiceUnavailable = async (
  page: Page,
): Promise<void> => {
  await page.evaluate(
    async ({ dbName, docId, voiceName }) => {
      const open = (): Promise<IDBDatabase> =>
        new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open(dbName);
          request.addEventListener('success', () =>
            resolve(request.result),
          );
          request.addEventListener('error', () =>
            reject(request.error),
          );
        });

      const db = await open();
      const tx = db.transaction('docs', 'readwrite');
      const store = tx.objectStore('docs');
      const existing = await new Promise<unknown>((resolve, reject) => {
        const request = store.get(docId);
        request.addEventListener('success', () =>
          resolve(request.result),
        );
        request.addEventListener('error', () => reject(request.error));
      });

      const now = Date.now();
      const updatedAt = new Date(now).toISOString();
      const base =
        typeof existing === 'object' && existing !== null
          ? (existing as Record<string, unknown>)
          : {
              id: docId,
              profileId: 'anonymous',
              soundEffectsVolume: 0.8,
              voiceVolume: 0.8,
              speechRate: 1,
              ttsEnabled: true,
              showSubtitles: true,
              tapForgivenessThreshold: 17,
              tapForgivenessTimeMs: 150,
              _deleted: '0',
              _rev: '1-voiceunavailseed',
              _meta: { lwt: now },
              _attachments: {},
            };

      const existingMeta = (base['_meta'] as
        | Record<string, number>
        | undefined) ?? { lwt: now };
      const mutated: Record<string, unknown> = {
        ...base,
        id: docId,
        profileId: 'anonymous',
        preferredVoiceURI: voiceName,
        updatedAt,
        _meta: { ...existingMeta, lwt: now + 1 },
        // `_rev` must change so any RxDB observers treat this as a new revision.
        _rev: `2-voiceunavailseed-${now}`,
      };

      store.put(mutated);

      await new Promise<void>((resolve, reject) => {
        tx.addEventListener('complete', () => resolve());
        tx.addEventListener('error', () => reject(tx.error));
      });
      db.close();
    },
    {
      dbName: SETTINGS_IDB,
      docId: SETTINGS_DOC_ID,
      voiceName: UNAVAILABLE_VOICE_NAME,
    },
  );
};
