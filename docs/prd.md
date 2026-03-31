# BaseSkill — Product Requirements Document

> **Source of truth for product decisions.** All other design documents reference this PRD for requirements, scope, and constraints.

---

## 1. Product Vision

**BaseSkill** is a free, open-source, offline-first educational PWA for children from Pre-K through Year 6+. It delivers gamified learning across subjects — letters, reading, and math — with a kid-first UX that adapts to the child's grade level. The app runs on any device browser, works without an internet connection, and syncs progress to cloud storage (e.g., Google Drive, OneDrive) at no cost to the family.

**One-liner:** *A free, open-source educational game platform that children love and parents trust.*

### Design Philosophy

- **Child-first, always.** Every interaction is designed for the child's grade level, not the parent's convenience.
- **Offline by default.** The app never requires connectivity to play a game.
- **Encouraging, never punitive.** Feedback is always positive. Children always progress.
- **No ads, no tracking, no accounts.** Privacy is non-negotiable.
- **Open source and community-driven.** GPL v3 — the community can verify, extend, and trust the code.

---

## 2. License

**GPL v3.** All source code in this repository is open-source under the GNU General Public License v3.0. Any derivative work must also be published under GPL v3.

### Premium/Server Feature Separation Strategy

Future premium features (server-side authentication, multiplayer coordination, paid content gating, cloud syncing) will live in **separate private repositories** under proprietary licenses. These communicate with the open-source app over **network boundaries only** (REST APIs, WebSockets) and contain zero GPL code. The open-source app is designed with explicit extension points (event bus, plugin hooks, configuration-driven features) so premium integrations require no fork of GPL code.

A `LICENSE` file containing the full GPL v3 text will be added to the repository root.

---

## 3. Target Personas

### Persona 1: Child (Pre-K through Year 6+)

**Primary user.** The child interacts with games directly.


| Attribute    | Description                                                                |
| ------------ | -------------------------------------------------------------------------- |
| Age range    | ~3–12 years old                                                            |
| Literacy     | Pre-readers (Pre-K/K) through fluent readers (Year 3+)                     |
| Device usage | Supervised tablet or desktop; occasional unsupervised mobile               |
| Tech comfort | Varies widely; Pre-K/K needs icon-only navigation and TTS (text-to-speech) |
| Motivation   | Play, earn stars, see progress, hear encouragement                         |


**UX adaptation by grade level:**

- **Pre-K/K:** Full TTS for all instructions and labels. Icon-driven navigation only, but text labels are also shown. Large touch targets. No reading required to navigate.
- **Year 1–2:** TTS available but text labels also shown. Simple word navigation.
- **Year 3+:** Standard text navigation. TTS is still available for game content.

### Persona 2: Parent/Guardian

**Configurator and supervisor.** Sets up profiles, customises game settings, and monitors progress.


| Attribute    | Description                                                          |
| ------------ | -------------------------------------------------------------------- |
| Tech comfort | Average smartphone/tablet user                                       |
| Goals        | See child's progress, customise difficulty, manage data, set up sync |
| Pain points  | Complicated settings, confusing data, sync failures                  |
| Access       | Behind a PIN gate in the app, and/or behind math/wording puzzles     |


**Key needs:**

- Review session history timelines to understand a child's performance
- Customise game difficulty, retries, and timer per game or per grade band
- Select TTS voices per language per child
- Sync data to cloud or manage device storage independently
- Clear session history (for storage) without resetting learning progress

### Persona 3: Family (Shared Device)

**Multi-child household on a single device.** Quick profile switching without separate accounts.


| Attribute  | Description                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------- |
| Scenario   | Multiple children share one tablet/laptop (no limit on number of profiles)                                          |
| Goals      | Each child has their own progress, themes, and settings; settings can optionally be shared across the entire family |
| Key flows  | Switch profiles from the home screen; no login required                                                             |
| Constraint | Parent PIN protects settings from children                                                                          |


---

## 4. User Stories

### Child Stories


| ID   | As a child… | I want to…                                   | So that…                                                                                      |
| ---- | ----------- | -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| C-01 | Pre-K child | Hear the instructions read aloud             | I can play even if I can't read                                                               |
| C-02 | Any child   | Pick a game from pictures/icons              | I can find a game without reading                                                             |
| C-03 | Any child   | See my stars and progress                    | I feel rewarded for learning                                                                  |
| C-04 | Any child   | Bookmark my favorite games                   | I can find them quickly next time                                                             |
| C-05 | Any child   | See my recently played games                 | I can continue where I left off                                                               |
| C-06 | Any child   | Choose my theme (ocean, space, etc.)         | The app feels like mine                                                                       |
| C-07 | Any child   | Play games offline on a plane                | Learning doesn't stop without Wi-Fi (games may require individual download depending on size) |
| C-08 | Any child   | Hear "Great job!" when I get it right        | I stay motivated                                                                              |
| C-09 | Any child   | Try again after a wrong answer               | I don't feel punished for mistakes                                                            |
| C-10 | Any child   | Read instructions as text or listen to audio | I can choose how I learn; parents can disable audio to encourage reading practice             |


### Parent/Guardian Stories


| ID   | As a parent… | I want to…                                              | So that…                                     |
| ---- | ------------ | ------------------------------------------------------- | -------------------------------------------- |
| P-01 | Parent       | Set up separate profiles per child                      | Each child has independent progress          |
| P-02 | Parent       | Protect settings with a PIN                             | Children can't change the difficulty         |
| P-03 | Parent       | Review my child's session history                       | I understand their learning patterns         |
| P-04 | Parent       | Set retries, timer, and difficulty per game             | I customise for each child's needs           |
| P-05 | Parent       | Connect to cloud storage (e.g., Google Drive, OneDrive) | Progress syncs across our devices            |
| P-06 | Parent       | Select a TTS voice per language                         | I can pick a voice that my child responds to |
| P-07 | Parent       | Clear old session history                               | I free up cloud storage space                |
| P-08 | Parent       | Reset a child's progress independently                  | Without losing session event history         |
| P-09 | Parent       | See when data was last synced                           | I know sync is working                       |
| P-10 | Parent       | Change a child's theme                                  | I help my child personalise their app        |


### Family (Shared Device) Stories


| ID   | As a family… | We want to…                                 | So that…                                  |
| ---- | ------------ | ------------------------------------------- | ----------------------------------------- |
| F-01 | Family       | Switch profiles from the home screen        | Each child goes directly to their profile |
| F-02 | Family       | Share one device without separate accounts  | Setup is simple                           |
| F-03 | Family       | Each child has their own theme and settings | The app feels personalised per child      |


---

## 5. Feature Requirements (Functional)

### 5.1 Profile System

- **Device-local profiles**: No server account required. Profiles are stored in RxDB and optionally synced to cloud storage.
- **Multi-profile (family sharing)**: Up to N profiles per device (no hard limit). The profile picker is the app's home screen.
- **Profile attributes**: name, avatar (pre-set choices), grade level (Pre-K, K, Year 1–6+), active language, theme, parent PIN (per device).
- **Profile switching**: Tap profile on home screen. No password required to switch between child profiles.
- **Parent PIN**: Required to access `/parent` settings routes. PIN is per-device, stored hashed locally.
- **Avatar picker**: Selection of pre-drawn colorful avatars (not photos).

### 5.2 Game Catalog

- **Categories**: Organized by **grade** (Pre-K, K, Year 1–2, Year 3–4, Year 5–6+) and **subject** (Letters, Reading, Math, etc.).
- **Game cards**: Each game shown as a large card with illustration, title (TTS-readable), subject badge, and grade badge.
- **Filtering/browsing**: Grade filter on dashboard; subject filter; search (text + TTS for younger children).
- **Game catalog format**: Games are defined by JSON config files that describe the game's metadata and content, **not** the game logic itself. The JSON config specifies: game ID, title, description, subject, grade band, asset references (images, audio), content data (word lists, number ranges, sentences per locale), difficulty levels, evaluation criteria, and default settings (retries, timer, win-mode). The actual game **logic and UI** lives in reusable React game components (e.g., `LetterTracer`, `MultipleChoice`, `DragAndDrop`, `WordBuilder`). A JSON config tells an existing component *what content to render*. This means the community can add new games that use existing mechanics (e.g., a new spelling word list) by contributing only a JSON file and assets. Truly new game *mechanics* require a new React component, but new *content variations* within existing mechanics are JSON-only contributions.

### 5.3 Bookmarks and Recents

- **Bookmarks**: Child can bookmark any game from the game card or in-game. Bookmarked games appear in a dedicated row at the top of the dashboard.
- **Recently played**: Last-played games tracked per profile. A "Recently Played" row appears below bookmarks on the dashboard.
- **Persistence**: Bookmarks and recents stored in RxDB and synced to cloud.

### 5.4 Offline-First Gameplay

- **Per-game asset download**: Each game is its own bundle (code-split). The app shell loads instantly; individual game assets (images, audio, JS) are downloaded on first play or when the parent explicitly triggers a download. This keeps the initial install lightweight.
- **Preload / prefetch**: Games can be preloaded in the background after the app shell is cached. A parent setting allows triggering "Download All Games", but this is an expensive operation and is **not** performed on first load to avoid blocking the initial experience.
- **Download prompt**: If a game's assets are not yet cached, the parent is prompted to confirm the download (especially on metered connections or when the game bundle is large).
- **RxDB as local database**: All user data persists in IndexedDB via RxDB. No network request required for gameplay.
- **Sync on reconnect**: RxDB replication plugins queue mutations while offline and sync automatically when connectivity returns.
- **No degraded mode**: Once a game's assets are cached, it behaves identically online and offline from the child's perspective.

### 5.5 Offline/Online Indicator

- **Detection**: Uses `navigator.onLine` plus `online`/`offline` event listeners for real-time detection.
- **Indicator**: A persistent but non-intrusive banner appears at the top of the screen when offline.
- **Auto-dismiss**: Banner automatically disappears when connectivity is restored.
- **Last sync timestamp**: Optionally shown in the offline banner and in parent sync settings.

### 5.6 Speech Integration

- **Text-to-Speech (TTS)**: All game instructions, labels, encouragements, and UI hints are TTS-readable via the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API). TTS is enabled by default for all children. Parents can disable TTS per profile (e.g., to encourage older children to practise reading independently).
- **Speech-to-Text (STT)**: Used for Read Aloud game and other speaking exercises. Simple animated visual indicator (e.g., animated GIF) shown during listening — no complex waveform rendering required.
- **Voice selection**: Parents choose the TTS voice per language per profile from available `speechSynthesis.getVoices()`. Default voice is the browser/OS default for the profile language.
- **Device-aware voices**: Available voices differ per device/OS. Voice preferences are tagged with the device ID. On a different device, the app falls back to the default voice if the selected voice is unavailable.
- **STT language**: Speech recognition language matches the profile's active language setting.

### 5.7 Progress Tracking and Gamification

- **Stars**: Earned per game completion. Displayed on game cards and profile summary.
- **Streaks**: Daily play streaks tracked per profile.
- **Badges**: Achievement badges for milestones (first game, 10 games, subject mastery, etc.).
- **Score history**: Last N scores per game visible to child and parent.
- **All progress stored in RxDB `progress` collection**, synced to cloud.

### 5.8 Parent Game Customization (Override System)

Parents can override per-game defaults at three levels (most specific wins):


| Level                       | Scope                                                                           |
| --------------------------- | ------------------------------------------------------------------------------- |
| **Per-game override**       | Settings for one specific game                                                  |
| **Per-grade-band override** | Settings for all games in a grade band (Pre-K, K, Year 1–2, Year 3–4, Year 5–6) |
| **Global override**         | Settings for all games                                                          |


**Override fields:**

- **Retries**: Number of attempts before moving on (default: game-defined)
- **Timer duration**: Time limit in seconds (or disabled)
- **Always-win mode**: Child always progresses regardless of score
- **Difficulty level**: easy / medium / hard / adaptive

**Resolution order:** per-game override > grade-band override > global override > game default

Overrides stored in `game_config_overrides` collection, per profile.

### 5.9 Customizable Themes

- **4–6 pre-defined themes**: Ocean, Forest, Space, Rainbow, Sunset, Night. Each defines color palette, typography weight, icon style, and background pattern.
- **Default typography**: [Edu NSW ACT Foundation](https://fonts.google.com/specimen/Edu+NSW+ACT+Foundation) — a handwriting font designed for Australian school children. Young children can be confused by unfamiliar letterforms, so the default font is consistent with what they learn in school. All games use this font by default to maintain visual consistency.
  - **Alternative fonts**:  (TODO: verify license)
    - [Andika](https://fonts.google.com/specimen/Andika)
    - [All Australian fonts from Tina Anderson and Corey Anderson](https://fonts.google.com/?preview.script=Latn&query=Corey+Anderson)
    - Comic Sans
    - Century Gothic
    - KG Neatly Printed
    - [Open Sans](https://fonts.google.com/specimen/Open+Sans)
    - [Gill Sans Infant](https://freefonts.co/fonts/gill-sans-infant-std-regular)
    - [OpenDyslexic](https://opendyslexic.org/#)
    - [Sylexiad](https://www.sylexiad.com/)
    - [Lexend](https://fonts.google.com/specimen/Lexend?preview.script=Latn)
- **Parent font override**: Parents can change the font family per profile or per family from a curated list of child-friendly fonts. This is useful for families in regions with different handwriting standards.
- **Clone and modify**: Any pre-defined theme can be cloned. Clone owner can change colors and fonts.
- **Scope**: Theme can be set per child profile or per family (shared across all profiles).
- **Storage**: Themes stored in RxDB `themes` collection, synced to cloud storage.
- **Colorblind safety**: All pre-defined themes use colorblind-safe palettes. Color is never the sole differentiator for game mechanics.

### 5.10 Multi-Language Support

- **Default language**: English (`en`)
- **Initial second language**: Portuguese-Brazilian (`pt-BR`)
- **Architecture**: Extensible — new languages can be added by adding a translation file and game content.
- **Per-profile language**: Each child profile has an active language setting.
- **Game content localization**: Word lists, sentences, and instructions are per-language. Math games are mostly language-neutral (only instructions change).
- **i18n framework**: react-i18next (see `docs/i18n.md` for full spec).

### 5.11 Gameplay Session History

Every gameplay session records a **chronological event timeline** per profile:

**Recorded events include:**

- `game:start` — game loaded, config resolved
- `game:instructions_shown` — TTS instructions triggered
- `game:action` — child interaction (answer, drag, trace, speak)
- `game:hint` — hint requested or auto-triggered
- `game:evaluate` — answer evaluated (correct/incorrect/near-miss)
- `game:score` — score awarded
- `game:retry` — retry triggered
- `game:end` — session ended (completed or exited)

**Purposes:**

- Parent/teacher review of performance patterns (time, mistakes, hints, retries)
- Developer troubleshooting during game development
- Future analytics integration

**Chunked storage**: Session history documents are bounded at ~200 events or ~50KB per document. The recorder rolls over to a new chunk automatically. A `session_history_index` document per session holds a lightweight summary for listing/filtering without loading full event data.

### 5.12 Data Cleanup Controls

Accessed via Parent Settings > Data Management:

- **Clear Session History**: Deletes `session_history` + `session_history_index` records. Does NOT affect `progress`.
- **Clear Progress**: Resets scores, streaks, badges. Does NOT affect session history.
- **Date-range filter**: Optional "clear older than X days" filter for selective cleanup.
- **Cascade delete**: Deleting a session index deletes all its chunks.
- **Storage usage**: Display estimated storage usage per collection (progress, session history, settings).
- **Confirmation dialogs**: Required before any destructive action.

### 5.13 PWA Install and Service Worker

- **PWA manifest**: `manifest.json` with icons, name, theme color, display mode (`standalone`).
- **Service worker**: Workbox-based via `vite-plugin-pwa`. Pre-caches app shell + game assets on install.
- **Install prompt**: Custom install banner (not browser default). Handles iOS (no native prompt) and Android.
- **Version-based cache invalidation**: On SW update, stale caches are purged by version prefix.
- **SW migration**: On version mismatch, new SW activates with `skipWaiting` + `clientsClaim`. RxDB schema migration runs before app renders if schema version changed.
- **Zoom controls**: Users can zoom in/out of the game UI to accommodate different screen sizes and resolutions. A visible zoom control (or pinch-to-zoom support) ensures the app is usable even on devices where the default layout doesn't fit well.

### 5.14 Analytics (Deferred Decision)

Analytics provider selection is deferred. The requirement is to build an **analytics abstraction layer** — a typed interface — so the provider can be swapped without code changes.

**Options evaluated:**


| Provider                  | Cost                           | Privacy | Notes                                          |
| ------------------------- | ------------------------------ | ------- | ---------------------------------------------- |
| Google Analytics 4        | Free                           | Low     | Blocked by ~30–40% of users in 2026            |
| Cloudflare Web Analytics  | Free                           | High    | Privacy-first, rarely blocked, traffic-focused |
| PostHog Cloud (free tier) | Free up to 1M events/month     | Medium  | Open source, product analytics + errors        |
| Plausible Analytics       | Free self-hosted / $9/mo cloud | High    | GDPR-compliant, ~1KB script                    |


**Recommendation**: Implement a `AnalyticsAdapter` interface. Ship with a no-op implementation. Connect a provider via config without touching core logic. See `docs/architecture.md` for the interface spec.

### 5.15 Extension Points

The app exposes an **event bus and plugin hook system** so future premium features (from separate private repos) can:

- Subscribe to app events (game events, profile changes, sync events)
- Inject UI components at designated slots (dashboard banners, game overlays)
- Contribute configuration without modifying GPL source

No GPL code flows into plugin implementations. Plugins communicate only through the public event/hook API.

---

## 6. Non-Functional Requirements

### 6.1 Performance


| Metric                                       | Target                                                           |
| -------------------------------------------- | ---------------------------------------------------------------- |
| Time to Interactive (first load, warm cache) | < 2 seconds                                                      |
| Time to Interactive (cold cache, 3G)         | < 5 seconds                                                      |
| Game frame rate                              | 60fps animations (CSS/DOM for UI, canvas only for drawing games) |
| Bundle size (initial JS, gzipped)            | < 200KB                                                          |
| Lighthouse Performance score                 | ≥ 90                                                             |


- Lazy-load game assets (images, audio) at game load time, not app start.
- CSS/DOM animations for rewards (confetti, stars). No heavy animation libraries.
- **Why CSS/DOM over Canvas for UI?** Canvas is faster for complex real-time rendering (e.g., 2D games with many moving sprites), but CSS/DOM is the better choice for this app's UI because: (1) **Accessibility** — DOM elements work natively with screen readers, ARIA labels, and keyboard navigation; canvas requires a parallel invisible DOM for accessibility, doubling complexity. (2) **Responsive layout** — CSS flexbox/grid handles screen adaptation automatically; canvas requires manual layout math. (3) **Browser GPU acceleration** — CSS transforms and animations are GPU-composited and achieve 60fps for the types of animations we need (transitions, confetti, star bursts). (4) **SEO and tooling** — React DevTools, testing libraries, and linting all work with DOM. Canvas is reserved for the `LetterTracer` component where actual drawing/tracing input is required.

### 6.2 Accessibility

- **WCAG 2.1 AA compliance** for all screens and games.
- All interactive elements have ARIA labels and are keyboard-navigable.
- Screen reader support for game state changes (ARIA live regions).
- Minimum touch target size: 48x48px.
- Color is never the sole indicator for any game mechanic.
- Full TTS for instructions (pre-reader support).
- See `docs/accessibility.md` for full checklist.

### 6.3 TypeScript Strictness

- `"strict": true` in `tsconfig.json` (implies `noImplicitAny`, `strictNullChecks`, etc.).
- ESLint rule `@typescript-eslint/no-explicit-any` set to `error`.
- CI fails on any `any` usage — no exceptions, no `// eslint-disable` workarounds.
- No type assertions (`as any`, `as unknown`) that bypass type safety.

### 6.4 Compatibility


| Platform         | Requirement                                                                            |
| ---------------- | -------------------------------------------------------------------------------------- |
| Desktop browsers | Chrome 100+, Firefox 100+, Safari 15+, Edge 100+                                       |
| Mobile browsers  | iOS Safari 15+, Android Chrome 100+                                                    |
| Screen sizes     | 320px wide minimum; optimized for 768px+                                               |
| Zoom             | Users can zoom in/out via pinch or UI controls if game layout doesn't fit their device |
| Touch            | Pointer Events API for consistent mouse + touch                                        |


### 6.5 Privacy and Data

- No user accounts, no server-side storage of personal data.
- All data lives in the device's IndexedDB via RxDB.
- Cloud sync is opt-in. User controls which cloud provider (if any).
- OAuth tokens stored encrypted in IndexedDB (never in `localStorage` or cookies).
- No third-party scripts except the opted-in analytics provider.
- No ads, ever.

### 6.6 Open Source Quality

- All public APIs documented with JSDoc.
- README with setup, development, and contribution instructions.
- CONTRIBUTING.md with code style, PR, and commit conventions.
- Every incremental feature is a standalone commit with passing CI.

---

## 7. Constraints


| Constraint                 | Detail                                                                                                                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **JAMstack only**          | No backend server. All logic runs client-side.                                                                                                                                      |
| **Static hosting**         | Primary deployment target: GitHub Pages. Output is static HTML/JS/CSS.                                                                                                              |
| **No server-side auth**    | OAuth2 via PKCE only. OneDrive: MSAL.js client-side. Google Drive: Cloudflare Worker proxy for `client_secret` (see `docs/architecture.md`).                                        |
| **Free cloud sync only**   | Cloud storage providers with free personal tiers (initially Google Drive and OneDrive). No paid sync service.                                                                       |
| **GPL v3**                 | All app code in this repo must remain GPL v3.                                                                                                                                       |
| **No ads**                 | Hard requirement. No advertising SDK, no monetization via ads.                                                                                                                      |
| **No `any` in TypeScript** | Strict TypeScript everywhere. CI enforces this.                                                                                                                                     |
| **CSS/DOM for UI**         | No canvas/WebGL for UI — CSS/DOM is preferred for accessibility, responsive layout, and tooling. Canvas reserved for drawing-input games (e.g., `LetterTracer`). See 6.1 rationale. |


---

## 8. Competitors Analysis


| Product                        | Strengths                                                                   | Weaknesses                                        | Differentiation                                 |
| ------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------- |
| **ABCya**                      | Large game library, free tier, has offline app, ads removed for subscribers | Subscription-based for ad-free/offline experience | BaseSkill: fully free, no ads ever, open-source |
| **Starfall**                   | Structured reading curriculum                                               | Subscription required for full access             | BaseSkill: fully free                           |
| **Khan Academy Kids**          | High quality, structured                                                    | Requires account, cloud-dependent                 | BaseSkill: no account, offline-first            |
| **Duolingo Kids / LingoKids**  | Fun UX, gamified                                                            | Language learning only, subscription              | BaseSkill: broader subjects, free               |
| **ABC Education (abc.net.au)** | Australian curriculum-aligned                                               | Browser-only, no offline, limited                 | BaseSkill: offline, sync, customizable          |
| **readabilitytutor.com**       | AI-powered reading assessment                                               | Paid, requires connectivity                       | BaseSkill: STT-based reading, offline           |
| **iTrace**                     | Excellent letter tracing on iOS                                             | iOS only, paid                                    | BaseSkill: web-based, free, cross-platform      |


**BaseSkill's unique position:** The only free, open-source, offline-first, privacy-respecting educational PWA with family sharing, cloud sync, and full accessibility support.

> **TODO:** Conduct proper hands-on research of each competitor (install apps, test free/paid tiers, verify offline support, check ad behavior) before finalising this table. Current entries are based on general knowledge and may be inaccurate. We do not want to misrepresent competitors.

---

## 9. Out of Scope (Initial Release)

- Server-side multiplayer or real-time features
- Teacher/classroom accounts (future premium feature)
- AI-powered adaptive difficulty (future feature; difficulty is config-driven today)
- In-app content creator (new games via external JSON only for now)
- Push notifications
- Social features (leaderboards, sharing)
- Premium content gating
- Analytics provider selection (interface abstracted; no-op default)
- Game asset specifications (art, sound — separate asset pipeline)
- RTL language support (placeholder consideration only)

---

## 10. Glossary


| Term                | Definition                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| **Profile**         | A child's local account. Stored in RxDB. No server account.                                     |
| **Session**         | One play session of one game by one profile. Has a unique `sessionId`.                          |
| **Session History** | Chronological event timeline for a session, stored in bounded chunks.                           |
| **Session Index**   | Lightweight summary document per session used for listing/filtering.                            |
| **Chunk**           | One RxDB document holding up to ~200 events or ~50KB of a session history.                      |
| **Override**        | A parent-defined customization of a game's default settings.                                    |
| **Grade Band**      | A grouping of grades: Pre-K, K, Year 1–2, Year 3–4, Year 5–6.                                   |
| **Theme**           | A named set of colors, typography, and background patterns defining the app's visual style.     |
| **TTS**             | Text-to-Speech via the Web Speech API.                                                          |
| **STT**             | Speech-to-Text via the Web Speech API.                                                          |
| **PWA**             | Progressive Web App — installable, offline-capable web application.                             |
| **RxDB**            | Reactive offline-first database built on IndexedDB.                                             |
| **PKCE**            | Proof Key for Code Exchange — OAuth2 extension for SPAs without client secrets.                 |
| **BFF**             | Backend-for-Frontend — a lightweight proxy (Cloudflare Worker) for Google OAuth token exchange. |
| **Event Bus**       | Pub/sub system for in-app events, used by session recorder and plugin hooks.                    |
