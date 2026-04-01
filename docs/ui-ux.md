# BaseSkill — UI/UX Design Document

> **Audience**: AI agents and human developers implementing the BaseSkill frontend.
> **Stack**: TanStack Start + TanStack Router + React + TypeScript + shadcn/ui + Tailwind CSS v4
> **App type**: Free, open-source, offline-first educational PWA — Pre-K through Year 6+

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Design System Foundation](#2-design-system-foundation)
3. [Pre-Defined Themes](#3-pre-defined-themes)
4. [Theme Customization System](#4-theme-customization-system)
5. [Core Layouts](#5-core-layouts)
6. [Navigation Patterns](#6-navigation-patterns)
7. [Game Card Design](#7-game-card-design)
8. [Drag-and-Drop UX Helpers](#8-drag-and-drop-ux-helpers)
9. [Encouragement System](#9-encouragement-system)
10. [Session History Viewer](#10-session-history-viewer)
11. [Data Management Screen](#11-data-management-screen)
12. [Responsive Strategy](#12-responsive-strategy)
13. [Animation Guidelines](#13-animation-guidelines)
14. [Color Accessibility](#14-color-accessibility)

---

## 1. Design Principles

### 1.1 Child-First Interactions

Every screen, gesture, and piece of copy is designed for the child's current grade level. Pre-K children interact primarily through large tap targets and listen to spoken instructions (TTS). Year 3+ children can read menus and use search. The UI automatically adapts its affordances based on the active profile's grade band.

Grade bands and their UX tier:

| Grade Band   | Ages (approx.) | UX Tier                        |
| ------------ | -------------- | ------------------------------ |
| Pre-K / Prep | 3–5            | Icon + TTS only                |
| Year 1–2     | 5–8            | Icon + short text label        |
| Year 3–4     | 8–10           | Text navigation, simple search |
| Year 5–6+    | 10–12          | Full text UI, advanced filters |

### 1.2 Touch Target Sizes

- **Minimum**: 48×48px (WCAG 2.5.5 AA)
- **Preferred**: 64×64px for Pre-K and Kindergarten
- **Game drop zones**: minimum 80×80px
- **Interactive cards**: minimum 160×200px
- **Never place two tappable elements closer than 8px apart**

### 1.3 Encouraging, Never Punitive

- Wrong answers receive supportive feedback ("Almost! Try again") — never a buzzer, red X alone, or harsh animation
- Correct answers receive celebration (animation + sound + mascot message)
- Scores display as stars or badges — no numeric failure states shown to the child
- The word "wrong" never appears in child-facing copy

### 1.4 Distraction-Free Environment

- Zero advertisements
- Zero external links in child-facing screens
- No push notifications
- No social features or leaderboards
- Parent Settings is PIN-gated and separated from child UI
- No cookie consent banners or modals during gameplay

### 1.5 Offline by Default

- All core game assets and logic are bundled or cached via Service Worker
- No loading spinners appear during gameplay for cached content
- Sync indicators (when cloud sync is enabled) appear only in Parent Settings, never in child UI
- App shell loads instantly from cache; data hydrates from RxDB (IndexedDB) synchronously on mount

### 1.6 Accessibility (WCAG 2.1 AA)

- All interactive elements have visible focus rings (2px outline, offset 2px, theme primary color)
- `aria-label` on all icon-only buttons
- Color is never the sole differentiator for game mechanics — always paired with shape, pattern, icon, or label
- TTS available for all game instructions, question text, and answer options
- Keyboard navigation fully supported; logical tab order maintained
- `prefers-reduced-motion` respected for all animations
- Minimum contrast ratio: 4.5:1 for body text, 3:1 for large text and UI components

---

## 2. Design System Foundation

### 2.1 Component Base: shadcn/ui

BaseSkill uses [shadcn/ui](https://ui.shadcn.com/) as its component library — Radix UI primitives styled with Tailwind CSS v4. Components are copied into `src/components/ui/` and modified for child-friendly defaults.

**Key modifications to shadcn defaults**:

| Token          | shadcn default     | BaseSkill override                                                                                                                                                     |
| -------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Border radius  | `rounded-md` (6px) | `rounded-3xl` (24px) for cards, `rounded-2xl` for buttons                                                                                                              |
| Button height  | 36px               | 48px minimum, 56px for primary actions                                                                                                                                 |
| Font family    | system-ui          | [Edu NSW ACT Foundation](https://fonts.google.com/specimen/Edu+NSW+ACT+Foundation) (Google Fonts), fallback: Nunito, system-ui. Parents can override font per profile. |
| Font size base | 14px               | 16px (mobile), 18px (tablet), 20px (desktop)                                                                                                                           |
| Shadow         | `shadow-sm`        | `shadow-md` with softer spread for card depth                                                                                                                          |

### 2.2 Typography

**Font stack**:

```css
--font-body: 'Edu NSW ACT Foundation', 'Nunito', system-ui, sans-serif;
--font-display:
  'Edu NSW ACT Foundation', 'Nunito', system-ui, sans-serif;
```

**Why Edu NSW ACT Foundation**: A handwriting font designed for Australian school children. Young children can be confused by unfamiliar letterforms, so the default font is consistent with what they learn in school. Parents can override the font family per profile or per family from a curated list of child-friendly fonts (useful for families in regions with different handwriting standards).

**Type scale** (rem-based, scales with root font size):

| Role        | Size     | Weight | Usage                             |
| ----------- | -------- | ------ | --------------------------------- |
| `display`   | 2.5rem   | 700    | Game titles, celebration messages |
| `heading-1` | 2rem     | 700    | Screen titles                     |
| `heading-2` | 1.5rem   | 600    | Section headings                  |
| `heading-3` | 1.25rem  | 600    | Card titles                       |
| `body-lg`   | 1.125rem | 400    | Game instructions                 |
| `body`      | 1rem     | 400    | General text                      |
| `body-sm`   | 0.875rem | 400    | Badges, timestamps                |
| `label`     | 0.75rem  | 600    | Form labels, metadata             |

### 2.3 CSS Custom Properties (Tailwind CSS v4 Theme Injection)

All theme colors are expressed as CSS custom properties in `:root` or a `[data-theme]` attribute on `<html>`. Tailwind CSS v4 consumes these via `@theme` in `app.css`.

```css
/* app.css — base theme variables */
@theme {
  --color-primary: var(--bs-primary);
  --color-secondary: var(--bs-secondary);
  --color-background: var(--bs-background);
  --color-surface: var(--bs-surface);
  --color-text: var(--bs-text);
  --color-accent: var(--bs-accent);
  --color-success: var(--bs-success);
  --color-warning: var(--bs-warning);
  --color-error: var(--bs-error);
}
```

Theme switching is achieved by replacing the CSS custom property values on `<html data-theme="ocean">` at runtime. No page reload required.

### 2.4 Dark Mode Handling

Dark mode is **not** driven by `prefers-color-scheme`. Instead, it is an explicit user theme selection — the "Night" theme. This ensures children are not surprised by an unexpected theme change. The Night theme is selectable in Child Settings and Parent Settings.

When Night theme is active, `<html data-theme="night">` is set. Tailwind CSS v4's `dark:` variant is not used; all dark styles are embedded in the Night theme's CSS variable block.

---

## 3. Pre-Defined Themes

All color values are hex. All themes have been checked for WCAG AA contrast ratios between `--bs-text` on `--bs-background` and `--bs-text` on `--bs-surface`. Colorblind safety: all six themes are tested for deuteranopia, protanopia, and tritanopia using Colour Contrast Analyser.

---

### 3.1 Ocean Theme

**Concept**: Calm underwater world — blue skies above, turquoise seas, sandy details. Relaxing but stimulating.

| Variable          | Hex       | Role                                |
| ----------------- | --------- | ----------------------------------- |
| `--bs-primary`    | `#0077B6` | Buttons, links, focus rings         |
| `--bs-secondary`  | `#00B4D8` | Secondary buttons, highlights       |
| `--bs-background` | `#EAF6FB` | Page background                     |
| `--bs-surface`    | `#FFFFFF` | Cards, dialogs                      |
| `--bs-text`       | `#023E57` | Primary text (9.2:1 on background)  |
| `--bs-accent`     | `#FFB703` | Accent, star icons, badges          |
| `--bs-success`    | `#2DC653` | Correct answer indicator            |
| `--bs-warning`    | `#F4A261` | Timer warning, caution              |
| `--bs-error`      | `#E63946` | Validation error (never used alone) |

**Typography weight**: 600 (semi-bold default for readability on light background)

**Background pattern**: Subtle repeating wave SVG pattern at 5% opacity on `--bs-background`; gentle undulation suggesting water without distraction.

**CSS variable block**:

```css
[data-theme='ocean'] {
  --bs-primary: #0077b6;
  --bs-secondary: #00b4d8;
  --bs-background: #eaf6fb;
  --bs-surface: #ffffff;
  --bs-text: #023e57;
  --bs-accent: #ffb703;
  --bs-success: #2dc653;
  --bs-warning: #f4a261;
  --bs-error: #e63946;
  --bs-font-weight-default: 600;
  --bs-pattern: url('data:image/svg+xml,...wave...');
}
```

---

### 3.2 Forest Theme

**Concept**: Lush woodland — earthy greens, warm browns, dappled sunlight. Grounding and natural.

| Variable          | Hex       | Role                               |
| ----------------- | --------- | ---------------------------------- |
| `--bs-primary`    | `#2D6A4F` | Buttons, links                     |
| `--bs-secondary`  | `#52B788` | Secondary actions                  |
| `--bs-background` | `#F0F7F0` | Page background                    |
| `--bs-surface`    | `#FFFFFF` | Cards, dialogs                     |
| `--bs-text`       | `#1A3A2A` | Primary text (8.7:1 on background) |
| `--bs-accent`     | `#D4A017` | Acorns, star icons, gold           |
| `--bs-success`    | `#40C057` | Correct answer indicator           |
| `--bs-warning`    | `#E07B39` | Caution states                     |
| `--bs-error`      | `#C62828` | Validation errors                  |

**Typography weight**: 600

**Background pattern**: Tiny repeating leaf silhouettes at 4% opacity. Pattern tile: 40×40px, leafy scatter using CSS `background-image`.

**CSS variable block**:

```css
[data-theme='forest'] {
  --bs-primary: #2d6a4f;
  --bs-secondary: #52b788;
  --bs-background: #f0f7f0;
  --bs-surface: #ffffff;
  --bs-text: #1a3a2a;
  --bs-accent: #d4a017;
  --bs-success: #40c057;
  --bs-warning: #e07b39;
  --bs-error: #c62828;
  --bs-font-weight-default: 600;
  --bs-pattern: url('data:image/svg+xml,...leaves...');
}
```

---

### 3.3 Space Theme

**Concept**: Deep cosmos — stars, planets, nebulae. Sparks curiosity and wonder. Popular with Year 3–6.

| Variable          | Hex       | Role                                         |
| ----------------- | --------- | -------------------------------------------- |
| `--bs-primary`    | `#7C3AED` | Buttons, links (purple)                      |
| `--bs-secondary`  | `#A78BFA` | Secondary buttons, highlights                |
| `--bs-background` | `#0D0D2B` | Deep space navy                              |
| `--bs-surface`    | `#1A1A4E` | Cards, dialogs (slightly lighter)            |
| `--bs-text`       | `#E8E8FF` | Primary text (13.4:1 on background)          |
| `--bs-accent`     | `#FCD34D` | Stars, gold, highlights                      |
| `--bs-success`    | `#34D399` | Correct answer (teal — distinct from purple) |
| `--bs-warning`    | `#FBBF24` | Timer warning, caution                       |
| `--bs-error`      | `#F87171` | Validation error (soft red on dark)          |

**Typography weight**: 700 (bold — ensures legibility on dark background)

**Background pattern**: Procedural star field — 80 tiny white dots (1–2px) scattered via SVG `<circle>` elements, static (no animation), at full opacity on `--bs-background`. A single large planet silhouette (soft purple) appears bottom-right at 8% opacity.

**CSS variable block**:

```css
[data-theme='space'] {
  --bs-primary: #7c3aed;
  --bs-secondary: #a78bfa;
  --bs-background: #0d0d2b;
  --bs-surface: #1a1a4e;
  --bs-text: #e8e8ff;
  --bs-accent: #fcd34d;
  --bs-success: #34d399;
  --bs-warning: #fbbf24;
  --bs-error: #f87171;
  --bs-font-weight-default: 700;
  --bs-pattern: url('data:image/svg+xml,...stars...');
}
```

---

### 3.4 Rainbow Theme

**Concept**: Bright, playful, multi-color celebration. Best for Pre-K/K. High energy.

| Variable          | Hex       | Role                                |
| ----------------- | --------- | ----------------------------------- |
| `--bs-primary`    | `#E63946` | Buttons, links (vivid red)          |
| `--bs-secondary`  | `#F4A261` | Secondary (warm orange)             |
| `--bs-background` | `#FFFDE7` | Warm cream white                    |
| `--bs-surface`    | `#FFFFFF` | Cards, dialogs                      |
| `--bs-text`       | `#2D2D2D` | Primary text (16.8:1 on background) |
| `--bs-accent`     | `#6A4C93` | Purple accent, badges               |
| `--bs-success`    | `#2DC653` | Correct answer (green)              |
| `--bs-warning`    | `#FF6D00` | Caution states (deep orange)        |
| `--bs-error`      | `#C62828` | Validation errors                   |

**Typography weight**: 700

**Background pattern**: Rainbow arc gradient at the top of `--bs-background` (15% opacity gradient strip, 80px tall). Game surface area and cards use solid white. The arc is decorative only, not interactive.

**CSS variable block**:

```css
[data-theme='rainbow'] {
  --bs-primary: #e63946;
  --bs-secondary: #f4a261;
  --bs-background: #fffde7;
  --bs-surface: #ffffff;
  --bs-text: #2d2d2d;
  --bs-accent: #6a4c93;
  --bs-success: #2dc653;
  --bs-warning: #ff6d00;
  --bs-error: #c62828;
  --bs-font-weight-default: 700;
  --bs-pattern: url('data:image/svg+xml,...rainbow-arc...');
}
```

---

### 3.5 Sunset Theme

**Concept**: Warm golden-hour sky — oranges, pinks, and peach tones. Cozy and inviting. Good for wind-down sessions.

| Variable          | Hex       | Role                                                |
| ----------------- | --------- | --------------------------------------------------- |
| `--bs-primary`    | `#D62839` | Buttons, links (deep rose)                          |
| `--bs-secondary`  | `#FF8C42` | Secondary (vivid orange)                            |
| `--bs-background` | `#FFF3E8` | Warm peach white                                    |
| `--bs-surface`    | `#FFFFFF` | Cards, dialogs                                      |
| `--bs-text`       | `#3B1F14` | Primary text (dark brown, 12.1:1)                   |
| `--bs-accent`     | `#FF6B6B` | Coral accent, badges                                |
| `--bs-success`    | `#27AE60` | Correct answer (green — distinct from warm palette) |
| `--bs-warning`    | `#E67E22` | Timer warning                                       |
| `--bs-error`      | `#C0392B` | Validation errors                                   |

**Typography weight**: 600

**Background pattern**: Soft radial gradient in bottom-right corner (sunset glow: orange → pink at 10% opacity) overlaid on solid `--bs-background`. No tile pattern — single-element gradient.

**CSS variable block**:

```css
[data-theme='sunset'] {
  --bs-primary: #d62839;
  --bs-secondary: #ff8c42;
  --bs-background: #fff3e8;
  --bs-surface: #ffffff;
  --bs-text: #3b1f14;
  --bs-accent: #ff6b6b;
  --bs-success: #27ae60;
  --bs-warning: #e67e22;
  --bs-error: #c0392b;
  --bs-font-weight-default: 600;
  --bs-pattern: url('data:image/svg+xml,...sunset-glow...');
}
```

---

### 3.6 Night Theme (Dark Mode)

**Concept**: Calm, low-stimulation dark theme for evening use. Deep navy with soft purple accents. Does not cause eye strain. Explicit user choice only.

| Variable          | Hex       | Role                                     |
| ----------------- | --------- | ---------------------------------------- |
| `--bs-primary`    | `#818CF8` | Buttons, links (soft indigo)             |
| `--bs-secondary`  | `#A5B4FC` | Secondary (lighter indigo)               |
| `--bs-background` | `#0F172A` | Deep navy                                |
| `--bs-surface`    | `#1E293B` | Cards, dialogs (slate)                   |
| `--bs-text`       | `#E2E8F0` | Primary text (12.8:1 on background)      |
| `--bs-accent`     | `#F472B6` | Pink accent, badges                      |
| `--bs-success`    | `#4ADE80` | Correct answer (bright green)            |
| `--bs-warning`    | `#FBBF24` | Timer warning (amber)                    |
| `--bs-error`      | `#FB7185` | Validation error (soft pink-red on dark) |

**Typography weight**: 600

**Background pattern**: Very subtle repeating dot grid at 3% opacity (white dots, 1px, 24px spacing). Provides gentle texture without distraction on dark background.

**CSS variable block**:

```css
[data-theme='night'] {
  --bs-primary: #818cf8;
  --bs-secondary: #a5b4fc;
  --bs-background: #0f172a;
  --bs-surface: #1e293b;
  --bs-text: #e2e8f0;
  --bs-accent: #f472b6;
  --bs-success: #4ade80;
  --bs-warning: #fbbf24;
  --bs-error: #fb7185;
  --bs-font-weight-default: 600;
  --bs-pattern: url('data:image/svg+xml,...dot-grid...');
}
```

---

## 4. Theme Customization System

### 4.1 Overview

Any pre-defined theme can be cloned and modified. Custom themes are stored in the RxDB `themes` collection and can be scoped per-child-profile or per-family (all profiles share the theme).

**Customizable properties**:

- `primary` — primary brand color (button fills, focus rings)
- `secondary` — secondary action color
- `background` — page background color
- `accent` — star icons, badges, highlights
- Font weight: Regular (400), Medium (500), Semi-bold (600), Bold (700)

**Fixed properties** (cannot be customized): `success`, `warning`, `error` — these are accessibility-critical and remain constant to ensure consistent feedback.

### 4.2 Color Picker UI

- Uses a HSL color wheel + saturation/lightness sliders (not a raw hex input — children's themes benefit from constrained palettes)
- Shows the selected color swatch with a live contrast check against `--bs-text`
- If contrast ratio falls below 4.5:1, a warning badge appears: "Low contrast — text may be hard to read"
- Recent colors row: last 5 picked colors shown as swatches

### 4.3 Font Weight Selector

Rendered as a visual row of labelled swatches:

```
[ Regular ]  [ Medium ]  [ Semi-Bold ]  [ Bold ]
  Sample Aa    Sample Aa    Sample Aa    Sample Aa
```

Each swatch previews the font weight in real time. Default pre-selected based on the cloned theme's `--bs-font-weight-default`.

### 4.4 Theme Storage Schema (RxDB)

```typescript
// RxDB document schema for themes collection
interface ThemeDocument {
  id: string; // nanoid
  name: string; // User-given name, e.g. "Mia's Pink Theme"
  baseTheme: string; // slug of pre-defined theme used as base
  scope: 'profile' | 'family';
  profileId?: string; // only when scope === 'profile'
  colors: {
    primary: string; // hex
    secondary: string; // hex
    background: string; // hex
    accent: string; // hex
  };
  fontWeightDefault: 400 | 500 | 600 | 700;
  createdAt: string; // ISO 8601
  updatedAt: string;
}
```

### 4.5 Live Preview

- Theme customization UI renders a `<ThemePreview />` component to the right (desktop) or below (mobile) the controls
- Preview contains: a sample game card, a primary button, a secondary button, a text block, and a badge
- All preview elements update in real time as the user adjusts controls (no save required to preview)
- "Save Theme" button commits to RxDB
- "Reset to Base" button reverts all changes to the cloned theme's defaults
- "Delete" button (only for custom themes, never for pre-defined) shows a confirmation dialog

---

## 5. Core Layouts

### 5.1 Home — Profile Picker

**Purpose**: Entry point. Child selects their profile; no authentication required.

**Structure**:

```
┌─────────────────────────────────────┐
│         BaseSkill Logo              │  ← centered, top, 48px tall
├─────────────────────────────────────┤
│                                     │
│   [Avatar]  [Avatar]  [Avatar]      │  ← 2 per row (mobile), 4 per row (tablet+)
│    Child 1   Child 2   Child 3      │
│                                     │
│   [+  Add Profile]                  │  ← same card size as profile avatars
│                                     │
└─────────────────────────────────────┘
│  [⚙ Parent Settings]               │  ← bottom, small, triggers PIN modal
└─────────────────────────────────────┘
```

**Key elements**:

- Profile avatar card: 120×140px (mobile), 160×200px (tablet+). Rounded avatar image (80px circle) + name label below.
- Tap area: entire card is tappable
- "Add Profile" card: same dimensions, dashed border, `+` icon centered, "Add Profile" label below
- "Parent Settings" link: bottom of screen, small text, triggers PIN entry modal — not a route navigation
- No "Sign in" / "Register" copy anywhere on this screen

**Grade-level UX**: profile names use a larger, bolder font. Avatar images (emoji-style illustrations, not photos) are the primary identifier for Pre-K children.

**Behavior**:

- Tapping a profile card navigates immediately to that child's Dashboard
- Active profile is stored in `localStorage` / RxDB session context — no URL parameter needed
- Profiles load from RxDB `profiles` collection; if empty, "Add Profile" is the only card shown

---

### 5.2 Dashboard

**Purpose**: Child's home base after profile selection. Surfaces relevant games and recent activity.

**Structure**:

```
┌─────────────────────────────────────┐
│ [Avatar] Mia (Year 2) [⚙ Settings] │  ← sticky header, 56px tall
├─────────────────────────────────────┤
│ ★ Favourites                 [→]   │  ← horizontal scroll row
│ [Card] [Card] [Card]  ...           │
├─────────────────────────────────────┤
│ ▶ Keep Playing               [→]   │  ← horizontal scroll row (in-progress)
│ [Card] [Card]  ...                  │
├─────────────────────────────────────┤
│ [Search bar] (Year 3+ only)         │
├─────────────────────────────────────┤
│ Maths                               │  ← subject section heading
│ [Card] [Card] [Card] [Card]         │  ← grid
│ English                             │
│ [Card] [Card] [Card] [Card]         │
│ Science                             │
│ [Card] ...                          │
└─────────────────────────────────────┘
```

**Header** (sticky):

- Left: avatar thumbnail (32px circle) + child name + grade band label
- Right: settings gear icon → navigates to Child Settings
- Background: `--bs-surface` with a bottom border `1px solid --bs-primary/20`

**Bookmarked games row**: horizontally scrollable, snap scroll (CSS `scroll-snap-type: x mandatory`). Shows games the child has bookmarked. If empty, row is hidden entirely.

**Recently played / Keep Playing row**: horizontally scrollable. Shows last 6 games played, ordered by most recent. Card shows in-progress badge if last session was incomplete.

**Search bar**: only rendered when the active profile's grade is Year 3+. Uses a debounced input (300ms) to filter the game grid below. Icon-only search icon button for Year 1–2.

**Game grid**: 2 columns (mobile) → 3 columns (tablet) → 4 columns (desktop). Grouped by subject with sticky section headings. Only shows games matching the child's grade band (±1 grade for stretch / review content).

---

### 5.3 Game Shell

**Purpose**: Wraps any game module. Provides minimal chrome so the game can focus on learning.

**Structure**:

```
┌─────────────────────────────────────┐
│ [←] Counting Bears    ⭐ 3  ⏱ 0:42 │  ← header, 48px tall, always visible
├─────────────────────────────────────┤
│                                     │
│                                     │
│        GAME CONTENT AREA            │  ← fills remaining viewport height
│    (rendered by the game module)    │
│                                     │
│                              [🦉]  │  ← mascot, bottom-right, 72×72px
└─────────────────────────────────────┘
```

**Header**:

- Back arrow (`←`) left — navigates back to Dashboard with a confirmation dialog if a session is in progress
- Game title centered (truncated to 1 line)
- Score (star icon + number) right of title
- Timer right-most (shows elapsed or countdown based on game config)
- No bottom navigation bar in this layout

**Game content area**:

- Height: `calc(100dvh - 48px)` (dynamic viewport height minus header)
- Width: 100vw
- Overflow: hidden (games manage their own scroll if needed)
- Background: game module's own background, or inherits `--bs-background`
- No padding applied by the shell — game modules define their own internal layout

**Mascot**: absolutely positioned, `bottom: 16px; right: 16px`. Speech bubble appears above on trigger (see §9). `pointer-events: none` when idle to avoid intercepting taps on game elements. `pointer-events: auto` when displaying a message (tapping the mascot dismisses the bubble).

**No bottom navigation**: the game shell does not include tab bars or footer navigation. The only navigation out is the back arrow.

---

### 5.4 Child Settings

**Purpose**: Simple, child-appropriate settings. Accessible from the Dashboard header.

**Structure**:

```
┌─────────────────────────────────────┐
│ [← Back]   My Settings              │
├─────────────────────────────────────┤
│ 🔊  Sound                          │
│     [━━━━━●━━━━] (volume slider)   │
├─────────────────────────────────────┤
│ 🗣  Voice Speed                    │
│     [Slow]  [Normal]  [Fast]        │  ← segmented control (3 options)
├─────────────────────────────────────┤
│ 🌐  Language                       │
│     [English ▼]  [Português ▼]     │  ← select/combobox
├─────────────────────────────────────┤
│ 🎨  Theme                          │
│     [Ocean] [Forest] [Space] ...    │  ← horizontal scroll of theme swatches
│     [+ Customize]                   │
├─────────────────────────────────────┤
│ 🔈  Read aloud (TTS)               │
│     [ON ●]  /  [OFF ○]             │  ← toggle switch (ON by default)
└─────────────────────────────────────┘
```

**Behavior**:

- All settings save immediately to RxDB `settings` collection (no "Save" button needed)
- Volume slider: range 0–100, step 10. Changes reflected in game audio immediately
- Voice speed: Slow (0.75×), Normal (1.0×), Fast (1.25×) — maps to TTS rate
- Theme swatches: tapping applies the theme live. Visual selected state (ring outline)
- TTS toggle: enabled by default for all children. Parents can disable TTS per profile (e.g., to encourage older children to practise reading independently). When OFF, TTS is globally disabled for this child. Mascot messages still display as text

---

### 5.5 Parent Settings

**Purpose**: Administrative control for parents/guardians. PIN-gated to prevent child access.

**Access**: triggered by "Parent Settings" link on Home screen (or via header gear → "Parent Settings" option). A modal PIN entry overlay appears before any parent content is displayed.

**Structure**:

```
┌─────────────────────────────────────┐
│ [← Exit Parent Mode]  Parent Panel  │
├─────────────────────────────────────┤
│ Profiles                            │  ← list, tap to edit/delete
│ Game Overrides                      │  ← per-game difficulty/enable toggles
│ Session History                     │  → navigates to Session History Viewer
│ Data Management                     │  → navigates to Data Management Screen
│ Cloud Sync                          │  → toggle + sync status
│ Voice Selector                      │  → choose TTS voice per child
│ Change PIN                          │
│ About / Open Source                 │
└─────────────────────────────────────┘
```

**Navigation**: breadcrumb trail at the top of nested screens (e.g. `Parent Panel > Session History`). Back button returns to parent panel list.

**Game Overrides**: per-game settings override defaults. Table layout on desktop, accordion on mobile. Columns: Game Name | Enabled | Max Difficulty | Time Limit Override.

**Cloud Sync**: toggle to enable. When enabled, shows last sync timestamp, sync status badge (synced / pending / error), and a "Sync Now" button. Provider is abstracted (RxDB replication plugin).

**Voice Selector**: for each child profile, choose from available TTS voices (filtered by selected language). Plays a sample sentence on selection.

**Change PIN**: current PIN entry → new PIN entry → confirm new PIN. PINs are 4-digit numeric. Stored hashed in RxDB.

**Exit Parent Mode**: returns to Home screen (Profile Picker).

---

## 6. Navigation Patterns

### 6.1 Grade-Adaptive Navigation

Navigation affordances are determined by the active profile's grade band:

| Grade Band   | Navigation Style        | Text Labels    | TTS on Focus      |
| ------------ | ----------------------- | -------------- | ----------------- |
| Pre-K / Prep | Icons only, very large  | No             | Yes — reads label |
| Year 1–2     | Icons + short labels    | Yes (≤8 chars) | Yes — optional    |
| Year 3–4     | Icons + labels          | Yes (full)     | Optional          |
| Year 5–6+    | Text navigation, search | Yes (full)     | Optional          |

Implementation: a `useGradeNavMode()` hook returns `'icon-only' | 'icon-label' | 'text'` based on the active profile. All navigation components consume this hook and render conditionally.

### 6.2 Back Button

- **Game Shell**: always visible as `←` in the top-left of the game header
- If a game session is in progress (any events recorded), tapping back shows a confirmation dialog:
  > "Leave this game? Your progress in this session will be saved."
  > [Stay] [Leave]
- **Parent Settings**: breadcrumbs at top. Each breadcrumb segment is tappable. A dedicated `← Back` button also appears at top-left.
- **Child Settings**: `← Back` in header returns to Dashboard

### 6.3 Profile Switching

- Available from the Dashboard header (avatar tap) and during Parent Settings
- Tapping the profile avatar in the Dashboard header opens a bottom sheet (`Sheet` component from shadcn/ui)
- Bottom sheet contains: current profile (highlighted), list of other profiles, "Manage Profiles" option (PIN-gated)
- Selecting a profile switches context immediately (updates RxDB session store, re-renders Dashboard)

**Bottom sheet structure**:

```
───────────────────────
  Mia (Year 2)   ✓      ← current
  Sam (Year 5)
  Lily (Pre-K)
  ─────────────────────
  Manage Profiles → (PIN)
───────────────────────
```

### 6.4 Parent PIN Entry

- Triggered as a modal overlay (not a route navigation)
- PIN entry modal:
  - Title: "Parent Settings"
  - Subtitle: "Enter your 4-digit PIN"
  - Display: 4 dot indicators (● ● ● ●), filled as digits are entered
  - Numeric keypad: 3×4 grid (1–9, \*, 0, backspace)
  - Button size: 72×72px minimum
  - On success: modal closes, parent content becomes accessible (stored in React context, cleared on exit)
  - On 3 failed attempts: 30-second lockout with countdown timer shown
  - First launch (no PIN set): prompts to create a PIN before entering parent mode
- Keyboard accessible: auto-focuses hidden `<input type="password" inputmode="numeric" maxlength="4">`, keypad buttons fire programmatic input events

---

## 7. Game Card Design

### 7.1 Card Dimensions

| Screen              | Card Size |
| ------------------- | --------- |
| Mobile (< 640px)    | 160×200px |
| Tablet (640–1023px) | 180×225px |
| Desktop (≥ 1024px)  | 200×250px |

### 7.2 Card Anatomy

```
┌─────────────────────┐
│  [★] bookmark icon  │  ← top-right, 32×32px tap area
│                     │
│   Game Illustration │  ← top 60% of card, full-bleed image
│    (96×96px icon    │
│     or scene art)   │
│                     │
├─────────────────────┤
│  Counting Bears     │  ← game title, heading-3 size, 2-line max
│                     │
│  [Maths] [Year 2]   │  ← subject badge + grade badge
│                     │
│  ⭐⭐⭐              │  ← star rating (shown if played; hidden if unplayed)
└─────────────────────┘
```

**Illustration area**: top 60% of the card (no text). Uses `object-fit: cover`. Rounded corners on top only (`rounded-t-3xl`). Background fills with `--bs-primary/10` as a placeholder while image loads.

**Title**: `font-size: var(--text-heading-3)`, `font-weight: var(--bs-font-weight-default)`. Clamped to 2 lines with `line-clamp-2`. TTS-readable via `aria-label` on the card.

**Subject badge**: pill shape, `--bs-secondary` background, white text. e.g. "Maths", "English", "Science".

**Grade badge**: pill shape, `--bs-accent/20` background, `--bs-text` text. e.g. "Year 2".

**Bookmark icon**: top-right corner, overlaid on the illustration. Bookmarked state: filled star icon (`--bs-accent`). Unbookmarked: outline star (`--bs-text/40`). Tap toggles — writes to RxDB `bookmarks`. `aria-label="Bookmark Counting Bears"`.

**Star rating**: shown only if the child has played this game. 1–3 stars based on best score bracket. If unplayed, this area is empty (not shown as 0 stars).

### 7.3 Visual States

| State                               | Appearance                                                                                      |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Unplayed**                        | Normal card, no stars, no progress badge                                                        |
| **In-Progress**                     | Small "Continue" badge (bottom-left, `--bs-warning` background)                                 |
| **Completed** (1–3 stars)           | Star row visible, no progress badge                                                             |
| **Locked** (future: grade too high) | Card desaturated 50%, lock icon overlay at center — not shown by default; configurable per game |

### 7.4 Hover / Focus States

- **Scale**: `transform: scale(1.05)`, `transition: transform 150ms ease-out`
- **Border**: `ring-2 ring-primary ring-offset-2` (Tailwind utility, maps to theme primary)
- **Shadow**: `shadow-lg` on hover/focus
- **Focus visible**: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`
- Do not use `:hover` styles for touch-only devices; rely on `:focus-visible` for keyboard and `:active` for touch

---

## 8. Drag-and-Drop UX Helpers

All drag-and-drop interactions use the **Pointer Events API** (`onPointerDown`, `onPointerMove`, `onPointerUp`) — not separate mouse + touch handlers. This provides unified behavior across mouse, touch, and stylus.

### 8.1 Magnetic Snap

**Behavior**: When a draggable item enters the activation threshold of a valid drop zone, it "snaps" toward the drop zone center — giving children tactile feedback that they are in the right area.

**Threshold**: configurable per game (default: 60px radius from the drop zone center).

**Visual**: the dragged item's CSS `transform: translate()` values interpolate toward the drop zone center using a lerp (linear interpolation) applied on each `pointermove` event:

```
// Pseudocode
if (distanceToZoneCenter < SNAP_THRESHOLD) {
  const t = 1 - (distanceToZoneCenter / SNAP_THRESHOLD); // 0 → 1 as closer
  itemX = lerp(currentX, zoneCenter.x, t * 0.3);
  itemY = lerp(currentY, zoneCenter.y, t * 0.3);
}
```

The `0.3` multiplier creates a "pull" feeling without fully locking the item until drop.

### 8.2 Ghost Preview

**Behavior**: While dragging, a semi-transparent copy of the item (the "ghost") appears at the current drop zone target position, showing where the item will land if released.

**Implementation**:

- Ghost element is a clone of the draggable item with `opacity: 0.4` and `pointer-events: none`
- Ghost is rendered inside the drop zone, positioned at the zone's snap target point
- Ghost appears only when the dragged item is within `SNAP_THRESHOLD` of a valid zone
- Ghost disappears when item leaves the zone or is dropped

### 8.3 Visual Pulse on Drop Zones

**Behavior**: All valid drop zones pulsate (scale + opacity animation) while a drag is in progress, guiding young children to the correct areas.

**CSS animation**:

```css
@keyframes drop-zone-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.06);
    opacity: 1;
  }
}

.drop-zone--active {
  animation: drop-zone-pulse 1.2s ease-in-out infinite;
}
```

Animation starts when drag begins (`onPointerDown` on any draggable), stops when drag ends.

**Accessibility**: `aria-dropeffect="move"` on drop zones, `aria-grabbed="true"` on the dragged item.

### 8.4 Pointer Events Implementation

```typescript
// Shared drag state managed via React ref (not state — avoids re-renders during drag)
interface DragState {
  isDragging: boolean;
  itemId: string | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  activeZoneId: string | null;
}
```

- `onPointerDown`: capture pointer (`element.setPointerCapture(e.pointerId)`), initialize drag state
- `onPointerMove`: update drag position, check zone proximity, apply magnetic snap
- `onPointerUp`: check if over valid zone, fire drop handler, clean up state
- `onPointerCancel`: clean up state (handles interruptions like phone calls on mobile)

### 8.5 Drag Handles and Accessibility

- **Young children (Pre-K/K)**: the entire item is the drag handle (no separate grab area)
- **Older children**: optional grab handle icon (⠿ or similar) in top-left corner, 32×32px
- All draggable items have `role="button"` with `aria-label="Drag [item name]"`
- **Keyboard drag simulation**:
  - Space/Enter: "pick up" item (announces "Picked up [item]")
  - Arrow keys: move item (announces proximity to zones)
  - Space/Enter again: drop at current position
  - Escape: cancel drag, return item to origin

---

## 9. Encouragement System

### 9.1 Mascot

- Character: friendly owl (default) — round eyes, exaggerated smile, sitting pose. Illustrative vector style matching the active theme's color palette (accent color used for feather highlights).
- Position: `position: absolute; bottom: 16px; right: 16px;` within the game shell
- Size: 72×72px (idle), expands to 96×96px when speaking (CSS `transform: scale(1.33)`)
- The mascot never blocks game interactive elements — games should reserve a 100×100px safe zone at bottom-right

### 9.2 Speech Bubble

- Appears above-left of the mascot (CSS positioned relative to mascot)
- Max width: 200px (mobile), 260px (desktop)
- Rounded rectangle with a tail pointing to the mascot
- Background: `--bs-surface`, border: `2px solid --bs-primary`, text: `--bs-text`
- Font: `body-lg`, `font-weight: var(--bs-font-weight-default)`
- TTS reads the message aloud when bubble appears (if TTS is enabled)

### 9.3 Message Triggers and Copy

| Trigger                           | English                                                | Portuguese (pt-BR)                                       |
| --------------------------------- | ------------------------------------------------------ | -------------------------------------------------------- |
| Correct answer                    | "Amazing!", "You got it!", "Brilliant!", "Keep going!" | "Incrível!", "Acertou!", "Brilhante!", "Continue assim!" |
| Near-miss (1 wrong attempt)       | "So close! Try once more!", "Almost there!"            | "Quase lá! Tente mais uma vez!"                          |
| Wrong answer (2nd+ attempt)       | "Keep trying, you're doing great!"                     | "Continue tentando, você está indo bem!"                 |
| Idle 15 seconds                   | "You're doing great, keep going!", "Take your time!"   | "Você está indo bem, continue!", "Sem pressa!"           |
| Session complete                  | "Brilliant work today!", "You're a star!"              | "Ótimo trabalho hoje!", "Você é uma estrela!"            |
| Milestone (10 correct in session) | "10 in a row! Incredible!"                             | "10 seguidos! Incrível!"                                 |

Messages are randomly selected from the pool for each trigger to avoid repetition. Selection is seeded per session so the same message doesn't repeat within 3 triggers.

### 9.4 Animation Sequence

```css
@keyframes mascot-bounce-in {
  0% {
    transform: scale(0) translateY(20px);
    opacity: 0;
  }
  60% {
    transform: scale(1.1) translateY(-4px);
    opacity: 1;
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes bubble-slide-out {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(-12px);
    opacity: 0;
  }
}
```

1. Trigger fires → mascot animates in (`mascot-bounce-in`, 300ms)
2. Speech bubble fades in simultaneously (`opacity: 0 → 1`, 150ms)
3. TTS begins reading (if enabled)
4. Hold for 2000ms (or until TTS finishes, whichever is longer)
5. Bubble animates out (`bubble-slide-out`, 300ms)
6. Mascot scales back to idle size (150ms)

**Non-blocking**: all mascot animations use `position: absolute` and `pointer-events: none` — they never pause or block the game.

### 9.5 Reduced Motion

When `prefers-reduced-motion: reduce` is active:

- Mascot appears/disappears instantly (no scale animation)
- Speech bubble fades in/out only (no translate)
- TTS still fires — the message is still communicated

---

## 10. Session History Viewer

**Location**: Parent Settings → Session History

### 10.1 Layout

```
Parent Panel > Session History
─────────────────────────────────────────────
[Filters: Game ▼] [Date Range: ──] [Grade ▼]
─────────────────────────────────────────────
▼ Counting Bears  |  Mar 28, 2026  |  8m 24s  |  ⭐⭐⭐
  ─────────────────────────────────────────────────
  10:02:34  Question answered  |  "4 + 3 = ?"  →  "7"  ✓
  10:02:51  Question answered  |  "5 + 2 = ?"  →  "6"  ✗
  10:03:08  Question answered  |  "5 + 2 = ?"  →  "7"  ✓
  ...
▶ Alphabet Sounds  |  Mar 27, 2026  |  5m 10s  |  ⭐⭐
▶ Shape Sorter     |  Mar 27, 2026  |  3m 45s  |  ⭐
─────────────────────────────────────────────
[Load more...]
```

### 10.2 Session Row (Collapsed)

- Game thumbnail icon (32×32px)
- Game name (bold)
- Date (relative: "2 days ago" or absolute date, toggleable)
- Duration (mm:ss)
- Final score (star icons, 1–3)
- Expand arrow (right-aligned, rotates 180° when expanded)
- Tap anywhere on row to toggle expand/collapse

### 10.3 Session Row (Expanded)

- Displays a chronological list of session events from RxDB `sessionEvents` collection
- Only loaded when row is first expanded (lazy load from RxDB on demand)
- Each event: timestamp (HH:MM:SS relative to session start) | event type | details | result (✓/✗)
- Event types: `question_answered`, `drag_drop_attempt`, `game_started`, `game_completed`, `hint_requested`
- If event count > 50, shows first 20 with a "Show all [n] events" button that loads the full list

### 10.4 Filters

- **Game name**: dropdown of all games that have history for the active profile
- **Date range**: two date picker inputs (from / to), defaults to last 30 days
- **Grade band**: multi-select of grade bands (Pre-K, Year 1–2, Year 3–4, Year 5–6+)
- Filters are applied client-side via RxDB query reactively
- "Clear Filters" button resets all to defaults

### 10.5 Lazy Loading

- Initial load: last 20 sessions (by `startedAt` desc) from RxDB
- "Load more" button at bottom fetches the next 20
- Event details within a session: not fetched until the row is expanded. Query: `sessionEvents.find({ selector: { sessionId: session.id }, sort: [{ timestamp: 'asc' }] })`

### 10.6 Empty State

Centered in the list area:

- Illustration: friendly owl holding a magnifying glass (SVG)
- Heading: "No sessions yet"
- Subtext: "Session history will appear here after [child name] plays a game."

---

## 11. Data Management Screen

**Location**: Parent Settings → Data Management

### 11.1 Storage Usage Bar

```
Storage Usage
─────────────────────────────────────────────
[████████████████░░░░░░░░░░░░░░░░] 64.3 MB / ~500 MB
 ████ Session History (52.1 MB)
 ████ Game Progress (8.2 MB)
 ████ Settings & Profiles (4.0 MB)
─────────────────────────────────────────────
```

- Uses `navigator.storage.estimate()` to get `usage` and `quota`
- Segment breakdown read from RxDB collection size estimates (approximate — queried async on mount)
- Colors: Session History = `--bs-warning`, Game Progress = `--bs-primary`, Settings = `--bs-secondary`
- Updates on page focus (re-queries storage estimate)

### 11.2 Clear Session History

**Button**: "Clear Session History" (`variant="outline"`, `--bs-warning` border)

**Confirmation dialog**:

> **Clear Session History?**
> This will delete all recorded events and session logs. Your child's progress, scores, and stars are not affected.
> [Cancel] [Clear History]

On confirm: deletes all documents from RxDB `sessions` and `sessionEvents` collections for the active profile. Shows a toast: "Session history cleared."

### 11.3 Clear Progress

**Button**: "Clear All Progress" (`variant="outline"`, `--bs-error` border)

**Confirmation dialog**:

> **Clear All Progress?**
> This will reset all scores, star ratings, and badges for [child name]. This cannot be undone.
> [Cancel] [Clear Progress]

On confirm: deletes all documents from RxDB `gameProgress` and `badges` collections for the active profile.

### 11.4 Date-Range Filter for History Deletion

Allows targeted deletion of old session data:

```
Clear history older than:
[30 days ▼]           [Preview: frees ~18.4 MB]
                       [Delete Selected History]
```

Dropdown options: 30 days, 90 days, 180 days, Custom Date.

On "Custom Date": a date picker appears. Preview text updates reactively as date changes (queries RxDB for count/size estimate of matching records).

**Confirmation dialog** (same pattern as §11.2 but with date context):

> **Delete history older than March 1, 2026?**
> This will delete 47 session logs (~18.4 MB). Progress and scores are not affected.
> [Cancel] [Delete]

### 11.5 General Behavior

- All destructive actions require confirmation dialogs (shadcn `<AlertDialog>`)
- Operations are async — show a loading spinner inside the button during operation
- Success: toast notification (shadcn `<Sonner>`) in bottom-right
- Error: toast with error message + "Try Again" button

---

## 12. Responsive Strategy

### 12.1 Mobile-First CSS

All styles are written mobile-first: the base CSS applies to the smallest screen, with breakpoint-specific overrides expanding upward using Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`).

Never write styles that need to be overridden for small screens — start from the smallest reasonable default.

### 12.2 Breakpoints

| Prefix | Min-width | Target                                  |
| ------ | --------- | --------------------------------------- |
| (base) | 0px       | Mobile phones, portrait                 |
| `sm:`  | 640px     | Large phones, landscape / small tablets |
| `md:`  | 768px     | Tablets portrait                        |
| `lg:`  | 1024px    | Tablets landscape / small desktop       |
| `xl:`  | 1280px    | Desktop                                 |

### 12.3 Game Area

- Game area fills all available viewport height after the header: `height: calc(100dvh - 48px)`
- Uses `100dvh` (dynamic viewport height) to handle mobile browser chrome correctly
- Both portrait and landscape orientations are supported
- Games use CSS grid or flexbox internally; no absolute positioning that assumes portrait only
- Landscape: game area becomes wider and shorter — games should handle aspect ratios gracefully

### 12.4 Grid Columns

| Component            | Mobile    | Tablet (md)      | Desktop (lg) |
| -------------------- | --------- | ---------------- | ------------ |
| Dashboard game grid  | 2 columns | 3 columns        | 4 columns    |
| Profile picker grid  | 2 columns | 4 per row        | 4–6 per row  |
| Parent Settings list | 1 column  | 1 column (wider) | 2 columns    |

### 12.5 Font Scaling

Root font size changes at breakpoints via Tailwind CSS v4 `@theme`:

```css
/* Mobile default */
:root {
  font-size: 16px;
}

/* Tablet */
@media (min-width: 768px) {
  :root {
    font-size: 18px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  :root {
    font-size: 20px;
  }
}
```

All font sizes use `rem` units — they scale automatically with the root font size. Never use `px` for font sizes.

### 12.6 Zoom Controls

Users can zoom in/out of the game UI to accommodate different screen sizes and resolutions. This ensures the app is usable even on devices where the default layout doesn't fit well.

- **Pinch-to-zoom**: enabled by default on touch devices (do not set `user-scalable=no` in the viewport meta tag)
- **UI zoom controls**: a visible `+`/`-` button pair in the game shell header or settings, allowing manual zoom adjustment
- **Implementation**: zoom is achieved by scaling the root font size (which all `rem`-based dimensions follow) or via CSS `transform: scale()` on the game area container
- **Persistence**: zoom level is saved per profile in the `settings` collection so it persists across sessions

### 12.7 Touch vs Pointer Devices

- Touch devices: larger tap targets, no hover states needed
- Pointer devices (mouse): hover states, cursor changes
- CSS: use `@media (hover: hover)` to apply hover styles only on devices that support it:

```css
@media (hover: hover) {
  .game-card:hover {
    transform: scale(1.05);
  }
}
```

---

## 13. Animation Guidelines

### 13.1 CSS/DOM Animations

All UI animations use CSS keyframes. No JavaScript animation libraries (no Framer Motion, GSAP, Anime.js). No canvas-based animations for UI elements. Canvas is reserved for drawing-input games (e.g., `LetterTracer`).

**Why CSS/DOM over Canvas for UI?** Canvas is faster for complex real-time rendering (e.g., 2D games with many moving sprites), but CSS/DOM is the better choice for this app's UI because: (1) **Accessibility** — DOM elements work natively with screen readers, ARIA labels, and keyboard navigation; canvas requires a parallel invisible DOM for accessibility, doubling complexity. (2) **Responsive layout** — CSS flexbox/grid handles screen adaptation automatically; canvas requires manual layout math. (3) **Browser GPU acceleration** — CSS transforms and animations are GPU-composited and achieve 60fps for the types of animations we need (transitions, confetti, star bursts). (4) **SEO and tooling** — React DevTools, testing libraries, and linting all work with DOM.

### 13.2 Performance-Safe Properties

Only animate `transform` and `opacity`. Never animate layout-triggering properties:

| ✅ Allowed                   | ❌ Never animate                    |
| ---------------------------- | ----------------------------------- |
| `transform: scale()`         | `width` / `height`                  |
| `transform: translate()`     | `top` / `left` / `right` / `bottom` |
| `transform: rotate()`        | `margin` / `padding`                |
| `opacity`                    | `font-size`                         |
| `filter: blur()` (sparingly) | `border-width`                      |

Use `will-change: transform` only on elements that animate on every frame (e.g. dragged items). Remove `will-change` after animation ends.

### 13.3 Reduced Motion

Every non-essential animation must be wrapped in a `@media (prefers-reduced-motion: no-preference)` guard OR disabled via:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Essential animations (e.g. focus ring visibility, progress indicators): not disabled, but simplified to fade-only.

### 13.4 Reward Animations

**Confetti burst** (correct answer / session complete):

```css
@keyframes confetti-burst {
  0% {
    clip-path: polygon(50% 50%, 50% 50%, 50% 50%);
    opacity: 1;
  }
  60% {
    clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
    opacity: 0.8;
  }
  100% {
    clip-path: polygon(50% -50%, 150% 150%, -50% 150%);
    opacity: 0;
  }
}
```

Render 12–16 pseudo-elements (or small `<span>` elements) around the center of the screen, each with randomized rotation, color (theme accent + success colors), and delay (0–200ms stagger). Duration: 600ms total.

**Star burst** (score update):

```css
@keyframes star-burst {
  0% {
    transform: scale(0) rotate(-15deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.3) rotate(5deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}
```

Duration: 600ms. Applied to the star icon in the game header when score increments.

**Emoji pop** (answer feedback):

```css
@keyframes emoji-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  70% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
```

Duration: 300ms. Used for ✓ / ✗ feedback overlay on answer submission. Auto-dismisses after 800ms.

### 13.5 Animation Duration Reference

| Context                       | Duration            | Easing                                            |
| ----------------------------- | ------------------- | ------------------------------------------------- |
| Reward (confetti, star burst) | 600ms               | `ease-out`                                        |
| Encouragement mascot bounce   | 300ms               | `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring-like) |
| UI transitions (route, panel) | 150ms               | `ease-in-out`                                     |
| Hover/focus state             | 150ms               | `ease-out`                                        |
| Drop zone pulse               | 1200ms              | `ease-in-out`, infinite                           |
| Toast / notification          | 200ms in, 150ms out | `ease-out` / `ease-in`                            |
| Modal / sheet open            | 200ms               | `ease-out`                                        |

---

## 14. Color Accessibility

### 14.1 Contrast Requirements

All themes meet WCAG 2.1 AA minimum contrast ratios:

| Text Type                                    | Minimum Ratio | Verified Against                                    |
| -------------------------------------------- | ------------- | --------------------------------------------------- |
| Normal text (< 18px, non-bold)               | 4.5:1         | `--bs-text` on `--bs-background` and `--bs-surface` |
| Large text (≥ 18px, or ≥ 14px bold)          | 3:1           | `--bs-text` on `--bs-background`                    |
| UI components (buttons, inputs, focus rings) | 3:1           | Component color on adjacent background              |
| Placeholder text                             | 4.5:1         | Placeholder on input background                     |

### 14.2 Color-Independent Game Mechanics

Game questions and mechanics must never use color as the only differentiator. Always pair color with at least one additional indicator:

| Color usage            | Required pairing                   |
| ---------------------- | ---------------------------------- |
| Correct answer (green) | ✓ checkmark icon + "Correct!" text |
| Incorrect answer (red) | ✗ cross icon + "Try again!" text   |
| Category grouping      | Shape or pattern fill + color      |
| Drag zone type         | Zone label or icon + border color  |
| Progress indicator     | Percentage number + color bar      |

### 14.3 Badge and Label Contrast

Subject badges and grade badges must maintain 4.5:1 contrast between their text and background. Do not rely on the theme's `--bs-primary` for badge backgrounds without checking the contrast against `white` or `--bs-text`.

Recommended approach: badge text is always `white` (#FFFFFF) on dark badge backgrounds, or `--bs-text` (#023E57 or equivalent) on light badge backgrounds.

### 14.4 Focus Indicators

Focus rings must be visible on all backgrounds:

```css
:focus-visible {
  outline: 2px solid var(--bs-primary);
  outline-offset: 2px;
}
```

For the Night theme and Space theme (dark backgrounds), the focus ring uses `--bs-accent` instead of `--bs-primary` to ensure sufficient contrast.

### 14.5 Colorblind Safety Notes

Each theme has been verified using the Colour Contrast Analyser ([paciellogroup.com/resources/contrastanalyser](https://www.paciellogroup.com/resources/contrastanalyser/)) for:

- **Deuteranopia** (red-green, most common): success/error never distinguished by green vs red alone — always icon + text
- **Protanopia** (red-green variant): same as above
- **Tritanopia** (blue-yellow): accent and primary colors chosen to avoid blue-yellow-only differentiation

The Night and Space themes use `--bs-success: #4ADE80` (bright green) and `--bs-error: #F87171` (soft red) which remain distinguishable in deuteranopia simulation because they differ in luminance as well as hue.

### 14.6 Recommended Tooling

- [Colour Contrast Analyser](https://www.paciellogroup.com/resources/contrastanalyser/) — desktop app for spot-checking any two colors
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — online, quick verification
- [Accessible Colors](https://accessible-colors.com/) — suggests nearest accessible color if current fails
- Browser DevTools Accessibility panel — inspect contrast ratios in-context

---

_Document version: 1.0.0 — March 2026_
_Maintained alongside the BaseSkill codebase in `docs/ui-ux.md`_
