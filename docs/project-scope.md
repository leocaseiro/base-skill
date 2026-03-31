# BaseSkill PRD and Design Documents

## License

**GPL v3** for the open-source PWA repository. All derivative works of this codebase must also be open-sourced under GPL v3.

**Separation strategy for future premium/server features**: Any premium features (authentication, multiplayer WebSocket server, paid content) will live in separate private repositories with their own licenses (proprietary). These communicate with the open-source app over network boundaries (APIs, WebSockets) and contain zero GPL code. The open-source app must be designed with clear extension points (plugin hooks, event system, configuration-driven features) so the premium layer can integrate without forking or including GPL code.

We will add a `LICENSE` file with the full GPL v3 text.

---

## Document Structure

All documents will live in a `docs/` folder at the project root. Each document is written to be self-contained and actionable for AI agents.

```
docs/
  prd.md                        # Product Requirements Document
  architecture.md               # System and component architecture
  data-model.md                 # RxDB schemas, collections, sync strategy
  game-engine.md                # Game framework + 5 reference game specs
  ui-ux.md                      # Design system, themes, kid-friendly UX
  i18n.md                       # Internationalization and voice selection
  accessibility.md              # A11y requirements and implementation guide
  testing-strategy.md           # Unit, E2E, visual regression
  ci-cd.md                      # GitHub Actions, versioning, deployment
LICENSE                         # GPL v3
```

---

## 1. PRD (`docs/prd.md`)

The core document. Contains:

- **Product Vision**: One-liner + expanded description of BaseSkill
- **Target Users / Personas** (3 personas, UX adapts to grade level rather than splitting by reading ability):
  - **Child (Pre-K through Year 6+)** -- the primary user. UX adapts to grade level: full TTS/icon-driven navigation for young children, text-based for older children. Covers the entire age range.
  - **Parent/Guardian** -- manages profiles, customizes game settings per child, monitors progress, sets up cloud sync, selects TTS voices and language.
  - **Family (shared device)** -- the scenario where multiple children share one device with quick profile switching via the home screen.
- **User Stories**: Organized by persona, covering core flows (pick a game, play, track progress, switch profiles, sync data, bookmark games, go offline/online, customize theme, parent overrides game settings, review session history, clear old data)
- **Feature Requirements (Functional)**:
  - Account system (device-local profiles, sub-accounts for family sharing, no server-side auth, parent PIN for settings)
  - Game catalog (categories by grade: pre-K, K, years 1-6+; subjects: letters, math, reading, etc.)
  - Game bookmarks and recents (children can bookmark favorite games; recently played games appear at the top of the dashboard)
  - Offline-first gameplay with cloud sync (cloud storage providers, e.g. Google Drive / OneDrive, via RxDB)
  - Offline/online indicator (visible warning banner when offline; auto-detects reconnection and dismisses)
  - Speech integration (text-to-speech for instructions, speech-to-text for answers; parent-selectable voice per language per profile)
  - Progress tracking and gamification (stars, streaks, badges)
  - Parent/guardian game customization (retries, timer, always-win mode, difficulty -- configurable per game and/or per grade band)
  - Customizable themes (4-6 pre-defined themes; clone and modify per child or per family)
  - Multi-language support (English default, Portuguese-Brazilian initial; extensible)
  - **Gameplay Session History**: Chronological event timeline recorded per session per profile (game started, answer given, hint used, score awarded, game completed). Parents and teachers can review a child's session history to understand performance patterns -- time spent, mistakes, retries, hints used. Also useful for developer troubleshooting.
  - **Data Cleanup Controls**: Separate "Clear Data" options in Parent Settings for gameplay progress (scores, streaks, badges) and session history (event timelines) independently. Clearing history to free cloud drive space does not reset a child's learning progress. Warning dialogs before destructive actions. Optional date-range filter for selective cleanup.
  - PWA install prompt, service worker caching with version-based migration
  - Analytics (requirement documented with options to evaluate -- see Analytics section below)
  - **Extension Points**: Plugin/event architecture to allow future premium features (auth, multiplayer) to integrate from separate repos without including GPL code
- **Non-Functional Requirements**: Performance budgets, offline reliability, device compatibility (desktop + mobile browsers), accessibility (WCAG 2.1 AA), no ads, strict TypeScript (no `any` anywhere)
- **Constraints**: JAMstack only (no backend server), GitHub Pages hosting (but portable), free cloud sync only (Google Drive/OneDrive), OAuth2 via PKCE (no server-side token exchange)
- **Competitors Analysis**: Brief comparison with abcya, starfall, Khan Academy Kids, Duolingo Kids, LingoKids, ABC Education
- **Analytics Options** (to be decided):
  - **Google Analytics 4** -- free, industry standard, but 30-40% of users blocked by ad blockers/browsers in 2026
  - **Cloudflare Web Analytics** -- free, privacy-first, lightweight, rarely blocked, good for traffic analysis
  - **PostHog Cloud (free tier)** -- open source, 1M events/month free, product analytics + error tracking
  - **Plausible Analytics** -- privacy-focused, GDPR-compliant, ~1KB script, less blocked; paid cloud ($9/mo) or free self-hosted (requires a server)
  - **Recommendation**: Document the analytics interface as an abstraction so the provider can be swapped without code changes

## 2. Architecture (`docs/architecture.md`)

- **Tech Stack**: React + TypeScript (strict mode, `noImplicitAny`, ESLint rules banning `any`), Vite, shadcn/ui, RxDB, Workbox (service worker)
- **System Architecture Diagram**: JAMstack PWA -- static build deployed to GitHub Pages, all logic client-side
- **Component Architecture**: Top-level layout, routing (React Router), game shell, reusable components (DragDrop with magnetic/snap, SpeechBubble, TextToSpeech, SpeechToText, ProgressBar, ScoreBoard, OfflineIndicator, EncouragementAnnouncer)
- **State Management**: RxDB as single source of truth, reactive queries via RxDB + React hooks; state persists across refreshes automatically
- **Data Flow**: User action -> RxDB mutation -> reactive UI update -> background sync to cloud storage (e.g. Google Drive/OneDrive)
- **Cloud Sync Architecture**:
  - RxDB replication plugins for Google Drive and OneDrive
  - **OAuth2 with PKCE**: The SPA generates PKCE code verifier + challenge, redirects to provider consent screen, and exchanges the authorization code for tokens. **OneDrive**: MSAL.js handles the full PKCE flow client-side (no backend needed). **Google Drive**: Google non-standardly requires a `client_secret` even with PKCE, so a lightweight serverless OAuth proxy (Cloudflare Worker, free tier) handles the token exchange securely -- see the OAuth Architecture section below. Tokens are stored encrypted in IndexedDB.
  - Device-aware sync: each synced record includes a `deviceId` field so device-specific data (e.g., available TTS voices) is not blindly applied to other devices
  - Token refresh handled via PKCE-compatible refresh tokens
  - **Chunked session history sync**: session history documents are kept small and bounded (max ~200 events or ~50KB per document). The session recorder middleware splits events across multiple RxDB documents when thresholds are exceeded, using an incrementing `chunkIndex`. A lightweight `session_history_index` collection stores one summary document per session so that listing/filtering sessions does not require pulling full event data from the drive.
- **OAuth Architecture (Google Drive BFF)**:
  - Google requires `client_secret` for token exchange even with PKCE (non-standard; violates RFC 7636)
  - A tiny Cloudflare Worker (~50 lines) acts as a Backend-For-Frontend (BFF) proxy for Google OAuth only
  - The Worker stores `client_secret` in environment variables (never exposed to the client)
  - The SPA sends the PKCE authorization code + code_verifier to the Worker; the Worker adds the secret and forwards to Google's token endpoint; tokens are returned to the SPA
  - Cloudflare Workers free tier: 100,000 requests/day -- more than sufficient for OAuth token exchanges
  - The Worker is deployed separately and is NOT part of the GPL-licensed app codebase
  - OneDrive does NOT need this proxy -- MSAL.js handles PKCE natively without a client_secret
- **PWA / Offline Strategy**:
  - Service worker pre-caches app shell; each game is its own code-split bundle downloaded on first play or parent-triggered download. A "Download All Games" option exists in parent settings but is not triggered on first load.
  - **App versioning**: every CD deploy stamps a semver version into the build; on load, the app compares its version against the cached version
  - **SW migration/purge**: on version mismatch, the new SW activates immediately (`skipWaiting` + `clientsClaim`), purges stale caches, and triggers RxDB schema migration if needed
  - **Offline/online detection**: `navigator.onLine` + `online`/`offline` event listeners; global `OfflineIndicator` component shows/hides a warning banner
  - RxDB provides offline data; sync queues mutations for when connectivity returns
- **Extension Points**: Event bus / plugin hook system that allows external code (from separate repos) to subscribe to app events and inject UI without modifying GPL source

## 3. Data Model (`docs/data-model.md`)

- **RxDB Database**: Collection schemas in JSON Schema format
- **Collections**:
  - `profiles` -- user profiles (name, avatar, grade level, parent PIN, language, theme)
  - `progress` -- per-game progress (scores, completion, streaks, timestamps)
  - `settings` -- app preferences (volume, speech rate, active profile)
  - `game_config_overrides` -- parent customizations per game or per grade band (retries, timer duration, always-win mode, difficulty level)
  - `bookmarks` -- bookmarked games per profile (gameId, timestamp)
  - `themes` -- pre-defined + user-cloned themes (name, colors, fonts, owned by profile or family)
  - `session_history` -- one document per chunk of gameplay events. Fields: `id`, `sessionId`, `profileId`, `gameId`, `chunkIndex` (0-based, increments when a session overflows), `events[]` (timestamped array: `{ timestamp, action, payload, result }`), `createdAt`. Each document is capped at ~200 events or ~50KB to keep sync payloads small.
  - `session_history_index` -- one lightweight summary document per session. Fields: `sessionId`, `profileId`, `gameId`, `startedAt`, `endedAt`, `duration`, `finalScore`, `totalEvents`, `totalChunks`. Enables listing/filtering sessions without loading full event data.
  - `sync_meta` -- cloud sync state (last sync timestamp, conflict resolution, deviceId, device name)
  - `app_meta` -- app version (semver), last migration version, RxDB schema version
- **Relationships**: profile -> progress (1:many), profile -> settings (1:1), profile -> game_config_overrides (1:many), profile -> bookmarks (1:many), profile|family -> themes (1:many), profile -> session_history_index (1:many), session_history_index -> session_history (1:many via sessionId)
- **Chunking Rules**:
  - Each `session_history` document is bounded: max ~200 events or ~50KB (whichever is hit first)
  - When a session exceeds the cap, the recorder creates a new document with `chunkIndex` incremented
  - `session_history_index` is always one document per session regardless of chunk count
  - This keeps individual sync payloads small and avoids large files on Google Drive/OneDrive
- **Data Lifecycle / Cleanup**:
  - Bulk delete support by date range, per profile, for `session_history` + `session_history_index` (history cleanup) and `progress` (progress reset) independently
  - Cleanup operations cascade: deleting a session index also deletes all its chunks
  - Optional storage usage estimation (sum of document counts/sizes per collection) displayed in parent settings
- **Version Tracking**: `app_meta` collection tracks the deployed app version and RxDB schema version; on version mismatch, migration logic runs before the app renders
- **Sync Strategy**: Conflict resolution policy (last-write-wins with merge for progress), device-aware records (deviceId on sync_meta, voice preferences marked as device-local), what gets synced vs. device-local-only; session history is append-only (no conflict resolution needed -- chunks are immutable once written)
- **Token Storage**: Encrypted storage approach for OAuth tokens in offline-first context (encrypted IndexedDB, keys derived from device-specific entropy)

## 4. Game Engine (`docs/game-engine.md`)

- **Game Lifecycle**: load -> instructions (TTS) -> play -> evaluate -> score -> next/retry
- **Session Recorder**: A middleware/hook that transparently captures game events during the lifecycle and writes them to the `session_history` collection. Games emit events via the existing event bus (e.g., `game:start`, `game:action`, `game:hint`, `game:evaluate`, `game:score`, `game:end`); the recorder subscribes and persists them. The recorder handles chunking automatically -- when the current document exceeds the size/event threshold, it rolls over to a new chunk. At session end, it writes the `session_history_index` summary. The recorder is opt-in per game but enabled by default.
- **Game Config Schema**: JSON structure that defines a game (id, title, subject, grade, instructions, assets, difficulty levels, evaluation criteria, default settings for retries/timer/win-mode)
- **Parent Override System**:
  - Parents can override per-game defaults: number of retries, timer duration (or no timer), always-win mode (child always progresses), difficulty level
  - Overrides can be set per individual game, per grade band (Pre-K, K, Year 1-2, Year 3-4, Year 5-6), or globally for all games
  - Stored in `game_config_overrides` collection; game engine merges overrides with defaults at load time (override > grade-band override > global override > game default)
- **Reusable Game Components**:
  - **DragAndDrop**: supports mouse + touch (pointer events), magnetic/snap effect (items snap to drop zone when within threshold distance), visual guides showing valid drop zones, haptic-style feedback via animation
  - **LetterTracer** (canvas): trace letters/numbers with finger or mouse
  - **MultipleChoice**: tap/click answer options
  - **SpeechInput**: speech-to-text with simple animated visual indicator (e.g., animated GIF)
  - **SpeechOutput**: text-to-speech using selected voice
  - **Timer**: configurable, optional, can be hidden per parent settings
  - **EncouragementAnnouncer**: contextual audio + visual encouragement ("Great job!", "Almost there!", "Try again!") triggered by game events (correct answer, near-miss, retry); TTS-driven, language-aware
  - **ScoreAnimation**: confetti, stars, reward animations
- **Difficulty Progression**: How games scale difficulty based on grade level and past performance; adaptive within a session
- **5 Reference Games** (covering different subjects, interaction patterns, and grade levels):
  1. **Letter Tracing** (Pre-K/K, Letters) -- trace uppercase/lowercase letters on a canvas; uses touch/mouse input; inspired by iTrace
  2. **Number Match** (Pre-K/K, Math) -- drag numbers to match with groups of objects (e.g., drag "3" to 3 apples); uses DragAndDrop component with snap effect
  3. **Word Builder** (K-Year 2, Reading) -- drag letter tiles to spell a word shown as an image; uses DragAndDrop + TTS for hints; language-specific word lists
  4. **Read Aloud** (Year 1-3, Reading) -- display a sentence, child reads it aloud, speech-to-text evaluates; inspired by readabilitytutor.com; language-aware
  5. **Math Facts** (Year 1-4, Math) -- timed addition/subtraction problems with visual number line; uses MultipleChoice + Timer; timer can be disabled by parent

## 5. UI/UX Design (`docs/ui-ux.md`)

- **Design Principles**: Kid-friendly (large touch targets, bright colors, minimal text), distraction-free (no ads, no external links), encouraging (positive reinforcement, never punitive)
- **Theming System**:
  - shadcn/ui as base, extended with kid-friendly defaults (rounded corners, playful typography, larger sizes)
  - **4-6 pre-defined themes** (e.g., Ocean, Forest, Space, Rainbow, Sunset, Night) -- each defines color palette, typography weight, icon style, and background patterns
  - **Default typography**: [Edu NSW ACT Foundation](https://fonts.google.com/specimen/Edu+NSW+ACT+Foundation) — a handwriting font designed for Australian school children. Parents can override font per profile or per family from a curated list.
  - Users can **clone any theme and modify** it (color picker, font selector)
  - Theme can be set **per child** (each profile has its own theme) or **per family** (shared theme across all profiles)
  - Themes stored in RxDB `themes` collection, synced across devices
- **Core Layouts**: Home (profile picker), Dashboard (game grid by subject/grade with bookmarked/recent games at top), Game Shell (consistent header + game area + controls), Settings, Parent Settings (game overrides, sync, session history viewer, data management, analytics)
- **Navigation**: Simple, icon-driven; back button always visible; breadcrumb for parents; grade-level adaptive (icons only for Pre-K, text+icons for older)
- **Drag and Drop Helpers**:
  - Magnetic/snap effect: draggable items "pull toward" valid drop zones when within a configurable proximity threshold
  - Ghost preview showing where item will land
  - Visual pulse on drop zones to guide young children
  - Works consistently across mouse and touchscreen (pointer events API)
- **Encouragement System**: Contextual announcements during gameplay -- TTS + visual popup (e.g., animated character, speech bubble). Triggered on: correct answer, near-miss, idle timeout, retry. Tone is always positive, never punitive.
- **Session History Viewer** (Parent Settings): Timeline view of a child's past gameplay sessions. Filterable by game, date range, and grade. Each session shows summary (game, date, duration, score) with expandable detail showing the full event timeline. Lazy-loads chunk data only when a session is expanded.
- **Data Management Screen** (Parent Settings): Displays storage usage estimates per collection (progress, session history). Separate "Clear History" and "Clear Progress" buttons with confirmation dialogs. Optional date-range picker for selective cleanup (e.g., "clear history older than 30 days"). Shows how much drive space will be freed.
- **Offline Indicator**: Persistent but non-intrusive banner when `navigator.onLine` is false; auto-dismisses on reconnection; optionally shows last-sync timestamp
- **Responsive Strategy**: Mobile-first, games adapt to portrait/landscape; minimum touch target 48x48px; zoom controls (pinch-to-zoom + UI controls) for device compatibility
- **Animations**: Lightweight reward animations (confetti, star burst) using CSS/DOM animations (no heavy libraries; CSS/DOM preferred over canvas for UI — see PRD §6.1 for rationale)
- **Color Palette**: All pre-defined themes use colorblind-safe palettes (all color-based info also conveyed via shape/text/pattern)

## 6. Internationalization (`docs/i18n.md`)

New document covering multi-language support:

- **i18n Framework**: react-i18next (or similar); all UI strings externalized into translation files
- **Initial Languages**: English (en, default), Portuguese-Brazilian (pt-BR)
- **Translation File Structure**: JSON files per language, organized by namespace (common, games, settings, encouragements); easy to add new languages
- **Language-Specific Game Content**: Word lists, sentences, and instructions are per-language; math games are mostly language-neutral (only instructions change); game config schema includes a `content` map keyed by locale
- **TTS Voice Selection**:
  - Parents can select which TTS voice to use per language (via `speechSynthesis.getVoices()`)
  - Voice selector UI shows available voices for the current device, grouped by language
  - Voice preference stored per profile per language
  - **Device-aware sync**: available voices vary by device/OS; `sync_meta` includes `deviceId`; voice preferences are tagged with the device they were set on; on a different device, the app falls back to the default voice for that language if the selected voice is unavailable
- **STT Language**: speech recognition language matches the profile's language setting
- **Locale-Specific Formatting**: Numbers, dates, curriculum-aligned content (e.g., grade naming conventions differ between en-AU, en-US, pt-BR)

## 7. Accessibility (`docs/accessibility.md`)

- **WCAG 2.1 AA Compliance**: Checklist of applicable success criteria
- **Screen Reader Support**: ARIA labels on all interactive elements, live regions for game state changes and encouragement announcements, focus management
- **Colorblind Friendliness**: Color is never the sole indicator; all games and themes use shape, text, or pattern as secondary cues
- **Motor Accessibility**: Large touch targets (48x48px min), keyboard navigation for all games, alternative input for tracing (tap-to-place points), magnetic snap assists for drag-and-drop
- **Cognitive Accessibility**: Simple language, consistent layouts, TTS for all instructions (especially for pre-readers), undo/retry always available, encouraging tone
- **Speech API Fallbacks**: What happens when TTS/STT is not available (visual text alternatives, icon-based instructions, fallback to typed input)

## 8. Testing Strategy (`docs/testing-strategy.md`)

- **Unit + Component Tests**: **Vitest** (test runner) + **React Testing Library** (component rendering and DOM queries); coverage targets for game logic, RxDB operations, component rendering, parent override merging
- **TypeScript Strictness**: `strict: true`, `noImplicitAny: true`; ESLint with `@typescript-eslint/no-explicit-any` rule set to error; CI fails on any `any` usage
- **E2E Tests**: Playwright; critical user flows (profile creation, game play, progress saving, cloud sync, offline/online transitions, profile switching, bookmark/recent games, session history recording and viewing, data cleanup flows)
- **Visual Regression**: Playwright screenshots or Chromatic; baseline comparisons for key screens across all pre-defined themes
- **Accessibility Tests**: axe-core integration in component tests; Playwright accessibility audits on all pages
- **Offline Tests**: Service worker testing strategy; simulate offline/online transitions; verify offline indicator appears/disappears; verify RxDB queues and replays sync
- **i18n Tests**: Verify all UI strings render correctly in en and pt-BR; snapshot tests for both languages
- **Session History Tests**: Verify event recording during gameplay, chunk rollover when threshold exceeded, index summary accuracy, lazy-load of chunks in viewer, cleanup cascade (deleting index deletes all chunks)
- **Test Data**: Fixtures and seed data for RxDB collections (profiles, progress, overrides, bookmarks, themes, session_history, session_history_index)

## 9. CI/CD (`docs/ci-cd.md`)

- **GitHub Actions Workflows**: lint (ESLint + strict TS check), test (unit + e2e), build, deploy
- **App Versioning**: Semver stamped into every deploy; version embedded in build output and `app_meta` RxDB collection; used for SW cache invalidation and schema migration
- **Service Worker Lifecycle**: On deploy, new SW version activates with `skipWaiting` + `clientsClaim`; old caches purged by version prefix; RxDB migration runs if schema version changed
- **Deploy to GitHub Pages**: Automatic on merge to main
- **Portability**: Build output is static HTML/JS/CSS; document how to deploy to Netlify, Vercel, Cloudflare Pages, or any static host
- **Commit Strategy**: Each incremental feature is a standalone commit with passing CI
- **Branch Protection**: Recommended rules for open-source collaboration

---

## What we are NOT writing yet (deferred to after scope is confirmed)

- Technology-specific skill files
- Mermaid diagrams (will be embedded in the architecture doc during implementation)
- Game asset specifications (art, sound)
- Analytics provider decision (options documented in PRD, interface abstracted)
