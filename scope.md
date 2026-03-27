# BaseSkill

BaseSkill is a gamify educational lessons PWA app/plataform with JAM stack, hosted on github-pages. The main goal is to help young children to learn in a educative, and fun way. Some skills would be to learn to read and write, maths, and more.
The app is kids friendly, without ADS, free to use, and open source.

There will be multiple games with categories for grades (pre-k, k, year 1-6+), subjects (letters, math, books, etc...).

Families might share the same device, so it should be easy to swap between "sub accounts" under the same "account".

BaseSkill competitors are abcya.com, softschools.com and starfall.com, khan academy kids, Duolingo kids, LingoKids, and also abc educational games (www.abc.net.au/education/subjects-and-topics/games).

Some of the games are inspired by famous apps, such as readabilitytutor.com, Reading.com, LingoKids, [iTrace](itraceapp.com), www.teachyourmonster.org,
readingeggs.com.au.

All games should be able to run offline (service worker cached), it should work well on all devices (desktop browsers, and mobile browsers).

Young kids that can't read, will be able to listen to exercises using text to speech via https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API. The same applies to their answers, they can reply by speech to text.
We should also cover accessibility, so games that use color, should be colorblind friendly, all games should be able to use screen-readers.

The games should run smoothly, performance is a big deal.

Besides unit testing, We should have end to end tests via playwright, as well as visual regression tests.

The stack is preferable to use React with TypeScript. We will use a design system library for the UI such as shadcn.

For the state, we want to make debugging easier, and persistent (if the user refresh the browser, it should preload the same state as before reloading).

I want to use Google Drive (https://rxdb.info/replication-google-drive.html) and/or OneDrive (https://rxdb.info/replication-microsoft-onedrive.html) to sync, so users can sync without paying for a cloud. My top choice is to use rxdb.info which is offline first, can sync with the cloud, and works well with react. We need to have a safe way to store the users tokens as an offline first approach.

**OAuth2 PKCE architecture note**: OneDrive supports standard PKCE for SPAs via MSAL.js (no backend needed). Google Drive non-standardly requires a `client_secret` even with PKCE, so a lightweight Cloudflare Worker (free tier: 100K requests/day) acts as an OAuth proxy for Google's token exchange only. This keeps the app fully static on GitHub Pages while securely handling Google auth at zero cost. See `docs/prd-plan.md` Architecture section for full details.

We want to reuse as much components as we can. For example, we'll have multiple games with drag and drop, speech to text, and text to speech, so those should be reusable components. React Composition is a must. It should be easy to extend components.

Each gameplay session should record a chronological, step-by-step history of events (e.g., game started, answer given, hint used, score awarded, game completed), like a timeline. This is useful for troubleshooting during game development, and for parents and teachers to review the performance of their students/children.

Since all IndexedDB data syncs via RxDB to Google Drive/OneDrive, session histories must not grow into large files. Histories should be broken into small, bounded chunks so that sync payloads stay small and incremental. If the user needs more space in their drive, they should be able to clear old data explicitly, with separate controls for gameplay progress (scores, streaks, badges) and session history (event timelines), so clearing history to free space does not reset a child's learning progress.

Every baby step of the project should have it's on commit with CI/CD working on github pages. As open-source, it shouldn't be limited to github pages only.
