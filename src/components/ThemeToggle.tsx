import { useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'auto';

function applyThemeMode(mode: ThemeMode) {
  const prefersDark = globalThis.matchMedia(
    '(prefers-color-scheme: dark)',
  ).matches;
  const resolved =
    mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode;

  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(resolved);

  if (mode === 'auto') {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = mode;
  }
  document.documentElement.style.colorScheme = resolved;
}

const ThemeToggle = () => {
  const [mode, setMode] = useState<ThemeMode>('auto');

  useEffect(() => {
    applyThemeMode('auto');
  }, []);

  useEffect(() => {
    if (mode !== 'auto') {
      return;
    }

    const media = globalThis.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyThemeMode('auto');

    media.addEventListener('change', onChange);
    return () => {
      media.removeEventListener('change', onChange);
    };
  }, [mode]);

  function toggleMode() {
    const nextMode: ThemeMode =
      mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light';
    setMode(nextMode);
    applyThemeMode(nextMode);
  }

  const label =
    mode === 'auto'
      ? 'Theme mode: auto (system). Click to switch to light mode.'
      : `Theme mode: ${mode}. Click to switch mode.`;

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={label}
      title={label}
      className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] shadow-[0_8px_22px_rgba(30,90,72,0.08)] transition hover:-translate-y-0.5"
    >
      {mode === 'auto' ? 'Auto' : mode === 'dark' ? 'Dark' : 'Light'}
    </button>
  );
};

export default ThemeToggle;
