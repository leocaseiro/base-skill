# Accessibility Design Document — BaseSkill

## 1. Overview and Commitment

BaseSkill is a free, open-source, offline-first educational PWA for children (Pre-K through Year 6+). Accessibility is a **core feature**, not an afterthought. Every game, screen, and interaction must be usable by all children regardless of ability.

**Compliance target**: WCAG 2.1 Level AA

### Key Populations

| Population | Primary Need |
|---|---|
| Pre-readers (Pre-K / Kindergarten) | All instructions delivered via TTS; no reading required to navigate or play |
| Motor-impaired children | Large touch targets; keyboard alternatives for all drag/draw interactions |
| Colorblind users | Color never the sole differentiator; shape + label always accompany color |
| Screen reader users | Full ARIA coverage; live regions for game state; logical focus management |

### Automated Testing Strategy

- **axe-core** integrated in every component test via `@axe-core/react` or `jest-axe` — zero violations policy enforced in CI
- **Playwright** `checkAccessibility()` audit on all page routes via `@axe-core/playwright`
- Manual screen reader testing on VoiceOver (iOS/macOS), TalkBack (Android), NVDA (Windows)

---

## 2. WCAG 2.1 AA Checklist

Organized by the **POUR** principles. Each criterion includes the level, a brief description, and the BaseSkill implementation note.

---

### 2.1 Perceivable

| Criterion | Level | Description | BaseSkill Implementation |
|---|---|---|---|
| **1.1.1 Non-text Content** | A | All non-text content has a text alternative | All game illustrations have meaningful `alt` text describing their educational content. Decorative images (backgrounds, UI flourishes) use `alt=""`. Canvas-based game elements have `aria-label` descriptions. |
| **1.2.x Audio/Video** | — | Captions and audio descriptions | Not applicable — BaseSkill contains no pre-recorded audio or video content. TTS is generated speech via Web Speech API, not a media element. |
| **1.3.1 Info and Relationships** | A | Structure conveyed through semantics | Semantic HTML throughout: `<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<footer>`. Data tables use `<table>` with `<th scope>`. Headings follow a strict `h1 → h2 → h3` order. Lists use `<ul>` or `<ol>`. |
| **1.3.3 Sensory Characteristics** | A | Instructions do not rely solely on shape, color, size, or position | No instruction may say "tap the red button" or "the circle on the right." All references include a visible text label: "tap the **Start** button." |
| **1.4.1 Use of Color** | A | Color not the sole visual means of conveying information | Games use shape + label + color. A colorblind child must be able to complete any game purely from text and shape cues. |
| **1.4.3 Contrast (Minimum)** | AA | 4.5:1 for normal text; 3:1 for large text (≥18pt or ≥14pt bold) | All 6 pre-defined themes verified against these ratios using Colour Contrast Analyser. Theme tokens `--color-text` / `--color-bg` must pass before merge. |
| **1.4.4 Resize Text** | AA | Text can be resized to 200% without loss of content or functionality | All font sizes use `rem`/`em` units. Layout uses `flex` and `grid` with wrapping. No `overflow: hidden` on text containers without a visible alternative. |
| **1.4.10 Reflow** | AA | Content reflows at 320px CSS width without horizontal scrolling | Responsive layout tested at 320px viewport. Exception: game canvas may scroll horizontally within its own container only, with a visible scroll indicator. |
| **1.4.11 Non-text Contrast** | AA | UI components and graphics have at least 3:1 contrast against adjacent colors | Buttons, input borders, drag zones, and interactive icons verified at 3:1. Focus indicators verified separately (see 2.4.7). |
| **1.4.13 Content on Hover or Focus** | AA | Additional content triggered by hover/focus is dismissable, hoverable, and persistent | Tooltips: dismiss with Escape, remain visible when pointer moves onto the tooltip, do not auto-dismiss on a timer. |

---

### 2.2 Operable

| Criterion | Level | Description | BaseSkill Implementation |
|---|---|---|---|
| **2.1.1 Keyboard** | A | All functionality operable by keyboard | Every interactive element reachable and operable via keyboard. Games provide keyboard alternatives (see §5 Motor Accessibility). |
| **2.1.2 No Keyboard Trap** | A | Keyboard focus can always be moved away from a component | Modals and dialogs implement a focus trap while open. `Escape` always closes a modal and returns focus to the trigger. |
| **2.4.1 Bypass Blocks** | A | Mechanism to skip repeated navigation blocks | A visually hidden "Skip to main content" `<a>` link is the first focusable element on every page. It becomes visible on focus. |
| **2.4.3 Focus Order** | A | Focus order preserves meaning and operability | Tab order follows the visual reading order (left-to-right, top-to-bottom). No `tabindex` values greater than `0`. |
| **2.4.4 Link Purpose** | A | Link purpose can be determined from link text alone | No "click here" or "read more" links. Icon-only links have an `aria-label`. |
| **2.4.6 Headings and Labels** | AA | Headings and labels are descriptive | Page headings describe the current context (e.g., "Number Match — Level 2"). Form inputs have associated `<label>` elements or `aria-label`. |
| **2.4.7 Focus Visible** | AA | Keyboard focus indicator is visible | Custom global focus style: `outline: 3px solid var(--color-accent); outline-offset: 2px;`. Applied via `:focus-visible`. Never suppressed with `outline: none` without a custom replacement. |
| **2.5.3 Label in Name** | A | Accessible name contains the visible label text | The accessible name of every interactive element includes its visible label text verbatim. Computed `aria-label` must not contradict or omit the visible text. |
| **2.5.5 Target Size** | AA | Touch/click target size is at least 44×44 CSS pixels | Minimum: 44×44px. Recommended: 48×48px. Pre-K and Kindergarten game targets: 64×64px. No dense menus with tightly packed small targets. |

---

### 2.3 Understandable

| Criterion | Level | Description | BaseSkill Implementation |
|---|---|---|---|
| **3.1.1 Language of Page** | A | Default language of the page is programmatically determined | `<html lang="en">` set on load. On profile language change, the `lang` attribute is updated dynamically to the active language code (e.g., `pt-BR`, `es`). |
| **3.1.2 Language of Parts** | AA | Language of each passage or phrase can be determined | Any inline content that differs from the page language carries a `lang` attribute (e.g., a Spanish word in an English lesson). |
| **3.2.1 On Focus** | A | Focusing an element does not initiate a context change | Focusing a button, input, or game element does not submit forms, navigate to a new page, or trigger game actions. |
| **3.2.2 On Input** | A | Changing the value of a UI component does not automatically cause a context change | Settings toggles do not auto-navigate. Confirmation of destructive actions (delete progress) requires an explicit confirmation step. |
| **3.3.1 Error Identification** | A | Input errors are identified in text and associated with the field | Validation errors are displayed as text adjacent to the relevant field, not just via color change. The error message is associated via `aria-describedby`. |
| **3.3.2 Labels or Instructions** | A | Labels or instructions provided for user input | All form inputs have a `<label>`. Complex inputs (e.g., date of birth) include format hints as helper text. |

---

### 2.4 Robust

| Criterion | Level | Description | BaseSkill Implementation |
|---|---|---|---|
| **4.1.1 Parsing** | A | HTML is valid; no duplicate IDs; elements properly nested | ESLint + HTMLHint rules enforce no duplicate `id` attributes. React key props never re-used in a list. Lint runs in CI. |
| **4.1.2 Name, Role, Value** | A | All custom interactive elements have name, role, and state/value exposed | Custom components (game tiles, drag items, drop zones) expose ARIA name, role, and current state. State changes (selected, grabbed, expanded) update ARIA attributes. |
| **4.1.3 Status Messages** | AA | Status messages conveyed to assistive technologies without receiving focus | Offline banner, sync completion toast, score updates, and encouragement messages are rendered in an `aria-live` region. Score uses `aria-live="polite"`; offline/error alerts use `aria-live="assertive"`. |

---

## 3. Screen Reader Support

### 3.1 ARIA Live Regions

Two live region containers are mounted globally at the application root and never unmounted:

```html
<!-- Polite: game state, score, encouragement -->
<div id="live-polite" aria-live="polite" aria-atomic="false" class="sr-only"></div>

<!-- Assertive: critical alerts (offline, sync error, permission denied) -->
<div id="live-assertive" aria-live="assertive" aria-atomic="true" class="sr-only"></div>
```

Announcements are made by setting `.textContent` (clearing first if re-announcing the same text). Components never render announcements directly into the live region — they dispatch to a centralized `announcePolite(text)` / `announceAssertive(text)` helper.

### 3.2 ARIA Roles for Game Elements

| Element | Role | Additional Attributes |
|---|---|---|
| Drag item (picked up) | `role="button"` | `aria-grabbed="true/false"`, `aria-label="[item name], draggable"` |
| Drop zone | `role="region"` | `aria-dropeffect="move"`, `aria-label="[zone name] drop area"` |
| Multiple choice option | `role="radio"` (within `radiogroup`) | `aria-checked`, `aria-label` |
| Game canvas (LetterTracer) | `role="img"` | `aria-label="Letter [X] tracing area"` |
| Progress bar | `role="progressbar"` | `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label` |
| Timer | `role="timer"` | `aria-live="off"` (announced only on pause/resume) |
| Score display | `role="status"` | Updated text triggers polite live region |

### 3.3 Focus Management

| Event | Focus Behavior |
|---|---|
| Modal / dialog opens | Focus moves to the first focusable element inside the modal (typically the title or close button). Focus is trapped within the modal. |
| Modal / dialog closes | Focus returns to the element that triggered the modal. |
| Game starts | Focus moves to the game area container (`role="main"` or game root). |
| Game completes (results screen) | Focus moves to the results heading. |
| Navigation to new page | Focus moves to `<main>` or the page `<h1>`. |
| Error shown inline | Focus moves to the error summary or the first invalid field. |

### 3.4 Game State Announcements

The polite live region announces:

- **Question progress**: "Question 3 of 10"
- **Score change**: "Score: 7 stars"
- **Encouragement**: "Great job!" / "Almost! Try again."
- **Timer events**: "Timer paused" / "Timer started"
- **Level completion**: "Level complete! You earned 3 stars."

The assertive live region announces:

- **Offline**: "You are offline. Progress will save when reconnected."
- **Sync error**: "Could not sync. Your progress is saved locally."
- **Permission denied**: "Microphone access was denied. Voice features are unavailable."

### 3.5 LetterTracer Canvas Accessibility

The canvas element:

```html
<canvas
  role="img"
  aria-label="Trace the letter A. Press Enter to switch to tap-to-place mode."
  tabindex="0"
/>
```

When the user presses `Enter` on the canvas, tap-to-place mode activates. In this mode, tapping or pressing `Enter`/`Space` places a dot at guided positions along the letter outline. Each placement is announced: "Point 1 of 6 placed."

---

## 4. Colorblind Friendliness

### 4.1 Theme Requirements

All 6 pre-defined themes are tested against the following simulations before release:

- **Deuteranopia** (red-green, green-blind) — most common
- **Protanopia** (red-green, red-blind)
- **Tritanopia** (blue-yellow)

Simulation testing is performed using the Chrome DevTools "Rendering" panel and the Coblis color blindness simulator.

### 4.2 Game-Specific Rules

**Number Match**
- Numbers are differentiated by their numeral character and spatial position.
- Colored number tiles must also display the digit. The tile background color is supplementary only.

**Word Builder**
- Letter tiles are differentiated by the letter character itself and its position in the tile tray.
- No two tiles in the same context rely solely on background color to distinguish meaning.

**Math Facts**
- Answer choices are differentiated by their numeric value and spatial position (A, B, C, D labels optionally).
- Correct answer feedback uses a checkmark icon + "Correct!" text, not green color alone.
- Incorrect answer feedback uses an X icon + "Try again!" text, not red color alone.

### 4.3 Progress and Feedback Indicators

| Indicator | Implementation |
|---|---|
| Lesson complete | Gold star icon + "Complete" label |
| Lesson in progress | Half-filled star icon + "In progress" label |
| Lesson not started | Empty star icon + "Not started" label |
| Correct answer | ✓ checkmark icon + "Correct!" text |
| Incorrect answer | ↩ retry icon + "Try again!" text |
| Offline status | Cloud-with-slash icon + "Offline" text badge |

---

## 5. Motor Accessibility

### 5.1 Touch Target Sizing

| Context | Minimum Target Size |
|---|---|
| General UI (buttons, nav items) | 48×48 CSS pixels |
| Settings and profile screens | 44×44 CSS pixels (minimum WCAG AA) |
| Pre-K / Kindergarten game elements | 64×64 CSS pixels |
| Year 1–6 game elements | 48×48 CSS pixels |

Targets are sized via CSS, not just hit-area padding. The visual element itself is at minimum the required size. No dense menus or toolbars with packed small targets.

### 5.2 Keyboard Navigation for All Games

**DragAndDrop**

1. Tab to a draggable item.
2. Press `Space` to "pick up" the item (`aria-grabbed="true"`).
3. Press `Arrow` keys to navigate between drop zones.
4. Press `Enter` to drop the item into the highlighted zone.
5. Press `Escape` to cancel the drag and return the item.

**MultipleChoice**

1. Tab to the answer group (`role="radiogroup"`).
2. Use `Arrow` keys to move between options.
3. Press `Enter` or `Space` to confirm selection.

**LetterTracer**

1. Tab to the canvas.
2. Press `Enter` to activate tap-to-place mode.
3. Press `Tab` to advance to the next placement point; `Shift+Tab` to go back.
4. Press `Enter` or `Space` to place a dot at the current point.
5. Press `Escape` to exit tap-to-place mode.

**Timer (when enabled)**

- Press `P` or `Space` (when focus is on the timer widget) to pause/resume.
- Timer is **off by default**. Parent must explicitly enable it in settings.

### 5.3 Tap-to-Place Alternative (LetterTracer)

When the child cannot draw a continuous stroke, they can instead tap sequentially along pre-defined anchor points on the letter outline. Each confirmed tap renders a visible dot. When all anchor points are placed, the letter is considered traced. This mode is equivalent in educational value to continuous stroke tracing.

### 5.4 Magnetic Snap (DragAndDrop)

Drop zones apply a **60 CSS pixel snap radius**. When a dragged item is released within 60px of a valid drop zone's center, it snaps into the zone automatically. This assists children with limited fine motor precision who cannot land exactly on target.

### 5.5 Pointer Events

All game interactions use the **Pointer Events API** (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`) as a single unified handler for mouse, touch, and stylus input. `touch-action: none` is set on draggable game surfaces to prevent scroll interference.

---

## 6. Cognitive Accessibility

### 6.1 Language and Instructions

- All in-app text uses grade-appropriate vocabulary. Instructions are short (one or two sentences maximum per screen).
- No instruction requires reading comprehension to complete a game action. TTS delivers all instructions aloud.
- Jargon, idioms, and colloquialisms are avoided.

### 6.2 TTS for All Instructions

Every instruction, label, and piece of feedback text is associated with a TTS trigger. Pre-readers never encounter a dead end where reading is required:

- TTS is enabled by default for all children. Parents can disable TTS per profile (e.g., to encourage older children to practise reading independently).
- Game instructions play automatically on load (unless TTS is disabled in settings).
- A speaker icon button re-plays the instruction at any time (visible only when TTS is enabled).
- Answer option labels are read aloud on focus (screen reader) or on hover/tap (TTS).

### 6.3 Consistent Layout Patterns

All game screens share the same structural layout:

| Position | Element |
|---|---|
| Top-left | Back button |
| Top-center | Game title / level |
| Top-right | Star score counter |
| Center | Game area |
| Bottom-center | Primary action button (Check / Next / Try Again) |
| Bottom-right | Hint button (if applicable) |

Children learn the layout once and it applies everywhere.

### 6.4 Undo and Retry

- Every game action that can be undone has an undo path (e.g., picking up a drag item and pressing Escape returns it).
- A "Try Again" button always appears after an incorrect answer or incomplete attempt.
- There are no dead ends — the child can always return to the previous screen via the Back button.

### 6.5 Visual Progress

- A progress bar (`role="progressbar"`) is always visible during gameplay, showing completion within the current lesson.
- Star count is always displayed and updated in real time.
- Level and question number ("Question 3 of 10") are always visible in the header.

### 6.6 Encouraging Tone

All feedback text follows a positive, encouraging tone. The following words and phrases are **prohibited** in feedback copy:

| Prohibited | Use Instead |
|---|---|
| "Wrong!" | "Try again!" |
| "Incorrect" | "Almost! Give it another go." |
| "Error" | "Let's try that again." |
| "Failed" | "Not quite — you've got this!" |
| "Bad" | (never used) |

### 6.7 Reduced Cognitive Load

- One primary task per screen. No screen presents simultaneous independent tasks.
- Reading and listening instructions are not delivered concurrently when TTS is active.
- Game instructions use a single sentence per step where possible.
- Animations are purposeful and brief (≤300ms). They can be suppressed via `prefers-reduced-motion`.

---

## 7. Speech API Fallbacks

### 7.1 TTS Fallback

**Detection:**

```js
const ttsAvailable = 'speechSynthesis' in window;
```

**When unavailable:**

- All instructions are rendered as visible text on screen.
- The speaker icon button is hidden (not just disabled), so it does not confuse children.
- For Pre-K/K games that are heavily reliant on audio instructions, a **"Read to me"** prompt appears: a large icon-button with label "Ask a grown-up to read this to you", designed for parent assistance.

### 7.2 STT Fallback (Read Aloud Game)

**Detection:**

```js
const sttAvailable =
  'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
```

**When unavailable:**

- A text input field replaces the microphone button.
- The child (or parent assisting) types the sentence.
- A grade-appropriate hint appears: "Type the sentence you see" with an on-screen keyboard hint for touch devices.
- Submission is via the keyboard `Enter` key or a large "Submit" button.

### 7.3 Permission Denied

When the user denies microphone permission:

1. A friendly message appears: "Please allow microphone access to use voice features."
2. A secondary CTA offers the text input fallback: "Use typing instead."
3. The permission state is stored locally. On next session, the text fallback activates automatically without re-prompting.
4. A help link opens the browser's microphone permission guide (external link, opens in new tab with `rel="noopener noreferrer"`).

### 7.4 Fallback Implementation Pattern

```ts
function useSpeechFeatures() {
  const ttsAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const sttAvailable =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  return { ttsAvailable, sttAvailable };
}
```

Components consume this hook and render the appropriate UI branch.

---

## 8. Testing and Verification

### 8.1 Automated: axe-core in Component Tests

Every component test file includes an axe-core accessibility check:

```ts
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<GameComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**Policy**: Zero violations. Any axe violation blocks the CI build. Suppressions require a documented comment and a tracking issue.

### 8.2 Automated: Playwright Accessibility Audits

Each Playwright end-to-end spec includes an accessibility audit:

```ts
import { checkA11y } from 'axe-playwright';

test('home page has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  await checkA11y(page, undefined, {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
});
```

Audits run on: Home, Profile selector, Game menu, each game screen, Settings, Results screen.

### 8.3 Automated: Keyboard Navigation Smoke Test

A Playwright script tabs through all interactive elements on key pages and asserts:

1. Focus is always visible (no `outline: none` without replacement).
2. Tab order matches the expected sequence (documented per page).
3. All game actions can be triggered by keyboard alone.

### 8.4 Manual Screen Reader Testing

| Platform | Screen Reader | Browser / App |
|---|---|---|
| iOS | VoiceOver | Safari |
| macOS | VoiceOver | Safari, Chrome |
| Android | TalkBack | Chrome |
| Windows | NVDA | Firefox, Chrome |

Manual testing checklist (per new feature):
- [ ] All interactive elements announced with correct role and label
- [ ] Live region announces game state changes
- [ ] Focus management correct on modal open/close
- [ ] Game completable end-to-end without sight

### 8.5 Color Contrast Verification

All 6 themes are verified using **Colour Contrast Analyser** (TPGI) before any theme is published. Verification covers:

- Body text on background
- Heading text on background
- Placeholder text on input background
- Button label on button background
- Focused input border on background
- Disabled element text (must meet 3:1 at minimum)

Results are recorded in `docs/theme-contrast-audit.md` (to be created alongside each theme).

### 8.6 Regression Policy

- Accessibility tests run on every pull request in CI (GitHub Actions).
- A dedicated accessibility label is applied to all issues and PRs touching a11y concerns.
- Any regression (new axe violation or broken keyboard navigation) blocks merge.
- Quarterly manual audit using the full checklist above.
