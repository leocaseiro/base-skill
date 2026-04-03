# Group E: i18n / Routing Bugs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all locale-switching, routing, and i18n bugs across the app so that changing language anywhere keeps the user on their current route, game UI strings are translated, the Header drawer has a voice selector, and preset theme names are translated.

**Architecture:** Six self-contained changes, each touching 1–3 files. The locale-switching fix is one pattern applied to three components (`Footer`, `Header`, `settings`). `GameShell` gets `useParams` for locale and `useTranslation('games')` for button labels. `Header` drawer gains a voice selector. Both locale JSON files gain `voice` and game-shell keys. Preset theme names are resolved via i18n rather than the raw `ThemeDoc.name` field.

**Tech Stack:** React 19, TanStack Router v1, react-i18next, TypeScript strict, Vitest + React Testing Library, RxDB

**Worktree:** `./worktrees/feat-word-spell-number-match` — all file paths below are relative to that root.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/Footer.tsx` | Modify | Fix `switchLocale` to stay on current route |
| `src/components/Header.tsx` | Modify | Fix `switchLocale` + add voice selector to drawer |
| `src/routes/$locale/_app/settings.tsx` | Modify | Fix `handleLocaleChange` to stay on current route |
| `src/components/game/GameShell.tsx` | Modify | Fix hardcoded `locale = 'en'`; translate Undo/Pause/Exit |
| `src/components/game/GameShell.test.tsx` | Modify | Update test for translated button labels |
| `src/lib/i18n/locales/en/games.json` | Modify | Add `shell.round`, `shell.undo`, `shell.pause`, `shell.exit` |
| `src/lib/i18n/locales/pt-BR/games.json` | Modify | Same keys in Portuguese |
| `src/lib/i18n/locales/en/settings.json` | Modify | Add `voice`, `themes.ocean`, `themes.forest` keys |
| `src/lib/i18n/locales/pt-BR/settings.json` | Modify | Same keys in Portuguese |

---

## Task 1: Fix locale-switching in Footer

**Files:**
- Modify: `src/components/Footer.tsx`

- [ ] **Step 1: Replace `switchLocale` navigation**

  Open `src/components/Footer.tsx`. Replace the `switchLocale` function body:

  ```tsx
  // BEFORE
  const switchLocale = (newLocale: FooterLocale) => {
    void navigate({
      to: '/$locale',
      params: { locale: newLocale },
    });
  };

  // AFTER
  const switchLocale = (newLocale: FooterLocale) => {
    void navigate({
      params: (prev) => ({ ...prev, locale: newLocale }),
    });
  };
  ```

- [ ] **Step 2: Run typecheck**

  ```bash
  cd worktrees/feat-word-spell-number-match && yarn typecheck 2>&1 | tail -5
  ```

  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/Footer.tsx
  git commit -m "fix(i18n): locale switch in Footer stays on current route"
  ```

---

## Task 2: Fix locale-switching in Header

**Files:**
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Replace `switchLocale` navigation**

  In `src/components/Header.tsx`, find the `switchLocale` function inside `Header` and replace:

  ```tsx
  // BEFORE
  const switchLocale = (newLocale: HeaderLocale) => {
    void navigate({
      to: '/$locale',
      params: { locale: newLocale },
    });
  };

  // AFTER
  const switchLocale = (newLocale: HeaderLocale) => {
    void navigate({
      params: (prev) => ({ ...prev, locale: newLocale }),
    });
  };
  ```

- [ ] **Step 2: Run typecheck**

  ```bash
  yarn typecheck 2>&1 | tail -5
  ```

  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/Header.tsx
  git commit -m "fix(i18n): locale switch in Header stays on current route"
  ```

---

## Task 3: Fix locale-switching in Settings route

**Files:**
- Modify: `src/routes/$locale/_app/settings.tsx`

- [ ] **Step 1: Replace `handleLocaleChange` navigation**

  In `src/routes/$locale/_app/settings.tsx`, replace:

  ```tsx
  // BEFORE
  const handleLocaleChange = (newLocale: string) => {
    void navigate({
      to: '/$locale/settings',
      params: { locale: newLocale as SettingsLocale },
    });
  };

  // AFTER
  const handleLocaleChange = (newLocale: string) => {
    void navigate({
      params: (prev) => ({ ...prev, locale: newLocale as SettingsLocale }),
    });
  };
  ```

- [ ] **Step 2: Run typecheck**

  ```bash
  yarn typecheck 2>&1 | tail -5
  ```

  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add "src/routes/\$locale/_app/settings.tsx"
  git commit -m "fix(i18n): locale switch in Settings stays on current route"
  ```

---

## Task 4: Fix GameShell hardcoded locale + translate shell buttons

**Files:**
- Modify: `src/components/game/GameShell.tsx`
- Modify: `src/components/game/GameShell.test.tsx`
- Modify: `src/lib/i18n/locales/en/games.json`
- Modify: `src/lib/i18n/locales/pt-BR/games.json`

- [ ] **Step 1: Add shell keys to `en/games.json`**

  Open `src/lib/i18n/locales/en/games.json` and add a `shell` block:

  ```json
  {
    "word-spell": "Word Spell",
    "number-match": "Number Match",
    "shell": {
      "round": "Round {{current}} / {{total}}",
      "undo": "Undo",
      "pause": "Pause",
      "exit": "Exit"
    },
    "ui": {
      "choose-a-letter": "Choose a letter",
      "almost-try-again": "Almost! Try again.",
      "great-job": "Great job!",
      "hear-the-question": "Hear the question",
      "tap-to-hear": "tap to hear"
    }
  }
  ```

- [ ] **Step 2: Add shell keys to `pt-BR/games.json`**

  Open `src/lib/i18n/locales/pt-BR/games.json` and add the same `shell` block in Portuguese:

  ```json
  {
    "word-spell": "Soletrar Palavras",
    "number-match": "Combinação de Números",
    "shell": {
      "round": "Rodada {{current}} / {{total}}",
      "undo": "Desfazer",
      "pause": "Pausar",
      "exit": "Sair"
    },
    "ui": {
      "choose-a-letter": "Escolha uma letra",
      "almost-try-again": "Quase! Tente de novo.",
      "great-job": "Muito bem!",
      "hear-the-question": "Ouvir a pergunta",
      "tap-to-hear": "toque para ouvir"
    }
  }
  ```

- [ ] **Step 3: Update GameShell to use params + translations**

  Replace the entire `GameShellChrome` component in `src/components/game/GameShell.tsx`:

  ```tsx
  import { useNavigate, useParams } from '@tanstack/react-router';
  import { useTranslation } from 'react-i18next';
  ```

  Add `useTranslation` to the imports (it's not there yet). Also add `useParams` alongside `useNavigate`.

  Inside `GameShellChrome`, replace:

  ```tsx
  // BEFORE — remove this line
  const locale = 'en'; // TODO: use i18n locale in M5

  // REPLACE the handleExit navigate call:
  const handleExit = () => {
    void navigate({ to: '/$locale', params: { locale } });
  };
  ```

  With:

  ```tsx
  const { t } = useTranslation('games');
  const { locale } = useParams({ from: '/$locale' });

  const handleExit = () => {
    void navigate({
      to: '/$locale',
      params: { locale },
    });
  };
  ```

  Then replace the JSX strings in the return:

  ```tsx
  // BEFORE
  <span className="text-sm font-medium">
    Round {roundDisplay} / {config.maxRounds}
  </span>

  // AFTER
  <span className="text-sm font-medium">
    {t('shell.round', { current: roundDisplay, total: config.maxRounds })}
  </span>
  ```

  ```tsx
  // BEFORE
  ⟲ Undo

  // AFTER
  ⟲ {t('shell.undo')}
  ```

  ```tsx
  // BEFORE
  II Pause

  // AFTER
  II {t('shell.pause')}
  ```

  ```tsx
  // BEFORE (both Exit buttons)
  ✕ Exit

  // AFTER
  ✕ {t('shell.exit')}
  ```

- [ ] **Step 4: Update GameShell test for translated labels**

  In `src/components/game/GameShell.test.tsx`, the mock already returns `{ locale: 'en', gameId: 'word-builder' }` from `useParams` — no change needed there. But any test asserting button text needs updating.

  Find assertions like `screen.getByRole('button', { name: /undo/i })` — these use `aria-label` so they still work. Verify no test matches on visible text `"Undo"`, `"Pause"`, or `"Exit"` directly. If any do, update them to match the `aria-label` attribute instead.

  Run tests first to check:

  ```bash
  yarn test src/components/game/GameShell.test.tsx 2>&1 | tail -20
  ```

  If a test fails because it matched on visible text, change it to use `aria-label`:

  ```tsx
  // Example fix if needed:
  // BEFORE: screen.getByText('Undo')
  // AFTER:  screen.getByRole('button', { name: /undo/i })
  ```

- [ ] **Step 5: Run typecheck + tests**

  ```bash
  yarn typecheck 2>&1 | tail -5
  yarn test src/components/game/GameShell.test.tsx 2>&1 | tail -10
  ```

  Expected: no type errors, all tests pass.

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/game/GameShell.tsx src/components/game/GameShell.test.tsx \
    src/lib/i18n/locales/en/games.json src/lib/i18n/locales/pt-BR/games.json
  git commit -m "fix(i18n): GameShell uses route locale param and translates shell buttons"
  ```

---

## Task 5: Add voice selector to Header drawer + translate voice/theme keys

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/lib/i18n/locales/en/settings.json`
- Modify: `src/lib/i18n/locales/pt-BR/settings.json`

- [ ] **Step 1: Add `voice` and preset theme keys to `en/settings.json`**

  ```json
  {
    "title": "Settings",
    "volume": "Volume ({{percent}}%)",
    "speechRate": "Speech rate ({{rate}}×)",
    "language": "Language",
    "theme": "Theme",
    "voice": "Voice",
    "themes": {
      "theme_ocean_preset": "Ocean",
      "theme_forest_preset": "Forest"
    }
  }
  ```

- [ ] **Step 2: Add same keys to `pt-BR/settings.json`**

  ```json
  {
    "title": "Configurações",
    "volume": "Volume ({{percent}}%)",
    "speechRate": "Velocidade da fala ({{rate}}×)",
    "language": "Idioma",
    "theme": "Tema",
    "voice": "Voz",
    "themes": {
      "theme_ocean_preset": "Oceano",
      "theme_forest_preset": "Floresta"
    }
  }
  ```

- [ ] **Step 3: Add voice state + selector to `HeaderMenuPanel`**

  In `src/components/Header.tsx`, add `useState` and `useEffect` to the existing imports from `react`:

  ```tsx
  import { useMemo, useRef, useState, useEffect } from 'react';
  ```

  Inside `HeaderMenuPanel`, after the existing `const speechRate = ...` line, add:

  ```tsx
  const preferredVoice = settings.preferredVoiceURI ?? '';
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const synth = (
      globalThis as unknown as { speechSynthesis?: SpeechSynthesis }
    ).speechSynthesis;
    if (!synth) return;
    const load = () => setVoices(synth.getVoices());
    load();
    synth.addEventListener('voiceschanged', load);
    return () => synth.removeEventListener('voiceschanged', load);
  }, []);
  ```

  Then add the voice `<Select>` block to the `SheetContent` JSX, after the `speechRate` slider block and before the language block:

  ```tsx
  {voices.length > 0 && (
    <div className="flex flex-col gap-2">
      <Label htmlFor="drawer-voice">{t('voice')}</Label>
      <Select
        value={preferredVoice}
        onValueChange={(v) => void update({ preferredVoiceURI: v })}
      >
        <SelectTrigger id="drawer-voice">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {voices.map((v) => (
            <SelectItem key={v.name} value={v.name}>
              {v.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )}
  ```

- [ ] **Step 4: Translate preset theme names in the drawer**

  In `HeaderMenuPanel`, the theme `<Select>` currently renders `{name}` from the `ThemeDoc`. Replace it to use i18n for preset themes:

  ```tsx
  // BEFORE
  {themes.map(({ id, name }) => (
    <SelectItem key={id} value={id}>
      {name}
    </SelectItem>
  ))}

  // AFTER
  {themes.map(({ id, name, isPreset }) => (
    <SelectItem key={id} value={id}>
      {isPreset ? t(`themes.${id}`, { defaultValue: name }) : name}
    </SelectItem>
  ))}
  ```

  Note: `ThemeDoc` includes `isPreset` — it's already in the type. The `toJSON()` call already returns the full doc shape. `t('themes.theme_ocean_preset', { defaultValue: name })` falls back to the raw `name` for any unknown preset IDs.

- [ ] **Step 5: Run typecheck**

  ```bash
  yarn typecheck 2>&1 | tail -5
  ```

  Expected: no errors.

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/Header.tsx \
    src/lib/i18n/locales/en/settings.json \
    src/lib/i18n/locales/pt-BR/settings.json
  git commit -m "feat(settings): add voice selector to Header drawer; translate theme names"
  ```

---

## Task 6: Final verification

- [ ] **Step 1: Run full lint + typecheck + unit tests**

  ```bash
  yarn lint 2>&1 | tail -10
  yarn typecheck 2>&1 | tail -5
  yarn test 2>&1 | tail -15
  ```

  Expected: all pass with no errors.

- [ ] **Step 2: Manual smoke checks**

  Start the dev server (`yarn dev`) and verify:
  1. On the home page (`/en`), open the Footer language dropdown, switch to Português — URL becomes `/pt-BR`, page stays on home (not redirected elsewhere).
  2. Navigate to `/en/game/word-spell`, open the Header menu → switch to Português — URL becomes `/pt-BR/game/word-spell`, game still visible.
  3. Navigate to `/en/settings`, switch language → stays on `/pt-BR/settings`.
  4. Open a game — footer buttons read "Desfazer / Pausar / Sair" in pt-BR.
  5. Open Header menu drawer in pt-BR → voice selector visible, theme shows "Oceano" / "Floresta".
  6. Switch back to English → theme names show "Ocean" / "Forest".

- [ ] **Step 3: Commit any fixups, then push**

  ```bash
  git push
  ```
