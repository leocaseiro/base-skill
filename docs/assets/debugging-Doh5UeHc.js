import{j as e}from"./iframe-kemjHOM7.js";import{u as r,M as i}from"./blocks-wF3KTS1D.js";import"./preload-helper-PPVm8Dsz.js";import"./index-Ctv392v_.js";import"./index-D6RFMxkV.js";import"./index-Dm0QsqrA.js";import"./index-ALUlrBDq.js";import"./index-DrFu-skq.js";function t(s){const n={blockquote:"blockquote",code:"code",em:"em",h1:"h1",h2:"h2",h3:"h3",hr:"hr",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...r(),...s.components};return e.jsxs(e.Fragment,{children:[e.jsx(i,{title:"game-engine/Debugging"}),`
`,e.jsx(n.h1,{id:"debugging-the-game-engine",children:"Debugging the Game Engine"}),`
`,e.jsxs(n.blockquote,{children:[`
  `,e.jsxs(n.p,{children:[`
    `,`Techniques for inspecting state transitions, dispatched actions, sound
    playback, and persisted session data during development.
  `]}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"1-react-devtools--reducer-and-context-inspection",children:"1. React DevTools — Reducer and Context Inspection"}),`
`,e.jsxs(n.p,{children:[`
  `,"Both the outer ",e.jsx(n.code,{children:"GameEngineProvider"})," and the inner ",e.jsx(n.code,{children:"AnswerGameProvider"}),` use
  plain `,e.jsx(n.code,{children:"useReducer"}),`. React DevTools is the primary way to inspect their state.
`]}),`
`,e.jsx(n.h3,{id:"viewing-answergame-state",children:"Viewing AnswerGame state"}),`
`,e.jsxs(n.ol,{children:[`
  `,e.jsxs(n.li,{children:["Open ",e.jsx(n.strong,{children:"React DevTools"})," → Components tab"]}),`
  `,e.jsxs(n.li,{children:["Search for ",e.jsx(n.code,{children:"AnswerGameStateContext.Provider"})]}),`
  `,e.jsxs(n.li,{children:[`
    `,"Expand the ",e.jsx(n.strong,{children:"value"})," prop to see the full ",e.jsx(n.code,{children:"AnswerGameState"}),`:
    `,e.jsx(n.code,{children:"phase"}),", ",e.jsx(n.code,{children:"zones"}),", ",e.jsx(n.code,{children:"bankTileIds"}),", ",e.jsx(n.code,{children:"activeSlotIndex"}),", ",e.jsx(n.code,{children:"retryCount"}),`, etc.
  `]}),`
`]}),`
`,e.jsx(n.h3,{id:"viewing-dispatched-actions",children:"Viewing dispatched actions"}),`
`,e.jsxs(n.p,{children:[`
  `,"React DevTools does not log individual ",e.jsx(n.code,{children:"useReducer"}),` dispatches by default.
  To trace every action through the AnswerGame reducer, add a temporary
  logging wrapper in `,e.jsx(n.code,{children:"AnswerGameProvider.tsx"}),`:
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`// Temporary — remove before committing
const [state, rawDispatch] = useReducer(
  answerGameReducer,
  initialState,
);
const dispatch = (action: AnswerGameAction) => {
  console.group(\`[AnswerGame] \${action.type}\`);
  console.log('payload', action);
  console.log('state before', state);
  rawDispatch(action);
  console.groupEnd();
};
`})}),`
`,e.jsxs(n.p,{children:[`
  `,`The same pattern works for the GameEngine lifecycle reducer in
  `,e.jsx(n.code,{children:"lifecycle.ts"}),`:
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`const [state, rawDispatch] = useReducer(reducer, initial);
const dispatch = (move: Move) => {
  console.group(\`[GameEngine] \${move.type}\`);
  console.log('args', move.args);
  rawDispatch(move);
  console.groupEnd();
};
`})}),`
`,e.jsxs(n.blockquote,{children:[`
  `,e.jsxs(n.p,{children:[`
    `,e.jsx(n.strong,{children:"Tip:"})," State ",e.jsx(n.em,{children:"after"}),` dispatch is visible in the next render. To see
    before/after in one log, compute `,e.jsx(n.code,{children:"reducer(state, action)"}),` inline — but
    only in dev, since the reducer must remain pure.
  `]}),`
`]}),`
`,e.jsx(n.h3,{id:"viewing-gameengine-state",children:"Viewing GameEngine state"}),`
`,e.jsxs(n.p,{children:[`
  `,"Search for ",e.jsx(n.code,{children:"GameStateContext.Provider"}),` in React DevTools. Its value shows
  `,e.jsx(n.code,{children:"phase"}),", ",e.jsx(n.code,{children:"roundIndex"}),", ",e.jsx(n.code,{children:"score"}),", ",e.jsx(n.code,{children:"streak"}),", and ",e.jsx(n.code,{children:"currentRound"}),`.
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"2-tanstack-devtools",children:"2. TanStack DevTools"}),`
`,e.jsxs(n.p,{children:[`
  `,"TanStack DevTools are mounted in ",e.jsx(n.code,{children:"src/routes/__root.tsx"}),` and appear as a
  floating panel at the bottom-right of the page in development.
`]}),`
`,e.jsx(n.h3,{id:"router-devtools",children:"Router DevTools"}),`
`,e.jsxs(n.p,{children:["The ",e.jsx(n.strong,{children:"TanStack Router"})," tab shows:"]}),`
`,e.jsxs(n.ul,{children:[`
  `,e.jsx(n.li,{children:"All registered routes and their current match state"}),`
  `,e.jsxs(n.li,{children:["Route params (e.g. ",e.jsx(n.code,{children:"$locale"}),", ",e.jsx(n.code,{children:"$gameId"}),")"]}),`
  `,e.jsxs(n.li,{children:["Loader data (including ",e.jsx(n.code,{children:"initialLog"})," and ",e.jsx(n.code,{children:"draftState"})," from session finders)"]}),`
  `,e.jsx(n.li,{children:"Navigation history"}),`
`]}),`
`,e.jsxs(n.p,{children:[`
  `,`This is useful for verifying that the correct session data was loaded from
  RxDB before the game mounts.
`]}),`
`,e.jsx(n.h3,{id:"adding-custom-panels",children:"Adding custom panels"}),`
`,e.jsx(n.p,{children:"The DevTools accept plugins. To add a game state inspector panel:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-tsx",children:`<TanStackDevtools
  config={{ position: 'bottom-right' }}
  plugins={[
    {
      name: 'Tanstack Router',
      render: <TanStackRouterDevtoolsPanel />,
    },
    {
      name: 'Game State',
      render: <YourCustomPanel />,
    },
  ]}
/>
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"3-gameeventbus--tapping-all-events",children:"3. GameEventBus — Tapping All Events"}),`
`,e.jsxs(n.p,{children:[`
  `,"The ",e.jsx(n.code,{children:"GameEventBus"}),` singleton supports a wildcard subscription that captures
  every event. Use this in the browser console to trace game events in real
  time:
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-js",children:`// In the browser console (dev only)
// Import is available because Vite exposes modules in dev
const { getGameEventBus } = await import('/src/lib/game-event-bus.ts');
const unsub = getGameEventBus().subscribe('game:*', (event) => {
  console.log(\`[EventBus] \${event.type}\`, event);
});
// Call unsub() to stop logging
`})}),`
`,e.jsx(n.h3,{id:"events-emitted-during-gameplay",children:"Events emitted during gameplay"}),`
`,e.jsxs(n.table,{children:[`
  `,e.jsxs(n.thead,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.th,{children:"Event"}),`
      `,e.jsx(n.th,{children:"Emitted by"}),`
      `,e.jsx(n.th,{children:"Contains"}),`
    `]}),`
  `]}),`
  `,e.jsxs(n.tbody,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"game:evaluate"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useTileEvaluation"})}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"gameId"}),", ",e.jsx(n.code,{children:"roundIndex"}),", ",e.jsx(n.code,{children:"answer"}),", ",e.jsx(n.code,{children:"correct"}),", ",e.jsx(n.code,{children:"nearMiss"})]}),`
    `]}),`
  `]})]}),`
`,e.jsxs(n.blockquote,{children:[`
  `,e.jsxs(n.p,{children:[`
    `,`The event bus is currently internal (M2). More event types may be added as
    the public API evolves.
  `]}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"4-rxdb--inspecting-persisted-session-data",children:"4. RxDB — Inspecting Persisted Session Data"}),`
`,e.jsx(n.p,{children:"Game sessions are stored in two RxDB collections:"}),`
`,e.jsxs(n.table,{children:[`
  `,e.jsxs(n.thead,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.th,{children:"Collection"}),`
      `,e.jsx(n.th,{children:"Purpose"}),`
    `]}),`
  `]}),`
  `,e.jsxs(n.tbody,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"session_history_index"})}),`
      `,e.jsx(n.td,{children:"One doc per session: metadata, move count, draftState"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"session_history"})}),`
      `,e.jsx(n.td,{children:"Chunked move arrays for replay"}),`
    `]}),`
  `]})]}),`
`,e.jsx(n.h3,{id:"browser-console-queries",children:"Browser console queries"}),`
`,e.jsxs(n.p,{children:[`
  `,"RxDB is accessible through the ",e.jsx(n.code,{children:"DbContext"}),`. In development, you can grab it
  from React DevTools or expose it on `,e.jsx(n.code,{children:"window"}),` temporarily:
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`// Temporary — add to DbProvider.tsx, remove before committing
useEffect(() => {
  if (db) (window as any).__db = db;
}, [db]);
`})}),`
`,e.jsx(n.p,{children:"Then in the browser console:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-js",children:`// List all session index documents
const docs = await __db.session_history_index.find().exec();
docs.forEach((d) => console.log(d.toJSON()));

// Find a specific session
const session = await __db.session_history_index
  .findOne('session-id')
  .exec();
console.log(session?.toJSON());

// Inspect draft state (mid-round snapshot)
console.log(session?.draftState);

// List move chunks for a session
const chunks = await __db.session_history
  .find({ selector: { sessionId: 'session-id' } })
  .exec();
chunks.forEach((c) => console.log(\`chunk \${c.chunkIndex}:\`, c.moves));
`})}),`
`,e.jsx(n.h3,{id:"indexeddb-direct-access",children:"IndexedDB direct access"}),`
`,e.jsxs(n.p,{children:[`
  `,"RxDB uses IndexedDB as its storage backend. Open ",e.jsx(n.strong,{children:`DevTools → Application →
IndexedDB`}),` to browse raw documents. Look for the database named
  `,e.jsx(n.code,{children:"baseskill"})," (or the name configured in ",e.jsx(n.code,{children:"create-database.ts"}),`).
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"5-sound-system-debugging",children:"5. Sound System Debugging"}),`
`,e.jsx(n.h3,{id:"verifying-sound-playback",children:"Verifying sound playback"}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"AudioFeedback.ts"})," creates ",e.jsx(n.code,{children:"HTMLAudioElement"})," instances. To trace playback:"]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-js",children:`// Monkey-patch in browser console
const origPlay = HTMLAudioElement.prototype.play;
HTMLAudioElement.prototype.play = function () {
  console.log('[Audio] play', this.src, 'volume:', this.volume);
  return origPlay.call(this);
};
`})}),`
`,e.jsx(n.h3,{id:"common-issues",children:"Common issues"}),`
`,e.jsxs(n.table,{children:[`
  `,e.jsxs(n.thead,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.th,{children:"Symptom"}),`
      `,e.jsx(n.th,{children:"Likely cause"}),`
      `,e.jsx(n.th,{children:"Fix"}),`
    `]}),`
  `]}),`
  `,e.jsxs(n.tbody,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"No sound on first interaction"}),`
      `,e.jsx(n.td,{children:"Browser autoplay policy blocks audio"}),`
      `,e.jsx(n.td,{children:"Sounds must start from a user gesture (click/tap)"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"Tile sound cut off by phase sound"}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"playSound()"})," interrupts; this is by design"]}),`
      `,e.jsxs(n.td,{children:["Use ",e.jsx(n.code,{children:"queueSound()"})," if sounds should chain"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"TTS speaks over sound effects"}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"whenSoundEnds()"})," not awaited"]}),`
      `,e.jsxs(n.td,{children:["Check ",e.jsx(n.code,{children:"useRoundTTS"})," awaits the sound queue"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"Sound plays but wrong file"}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"SOUND_PATHS"})," map or ",e.jsx(n.code,{children:"import.meta.env.BASE_URL"})]}),`
      `,e.jsxs(n.td,{children:["Verify paths in ",e.jsx(n.code,{children:"AudioFeedback.ts"})]}),`
    `]}),`
  `]})]}),`
`,e.jsx(n.h3,{id:"tts-debug-logs",children:"TTS debug logs"}),`
`,e.jsxs(n.p,{children:["The speech system logs to ",e.jsx(n.code,{children:"console.debug"})," with a ",e.jsx(n.code,{children:"[TTS]"})," prefix:"]}),`
`,e.jsxs(n.ul,{children:[`
  `,e.jsxs(n.li,{children:[`
    `,e.jsx(n.code,{children:'[TTS] speakTile("a") — busy, skipped'}),` — a speak call was dropped because
    another utterance was active
  `]}),`
  `,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"[TTS] speak(...)"})," — utterance started (logged in ",e.jsx(n.code,{children:"SpeechOutput.ts"}),")"]}),`
  `,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"[TTS] cancelSpeech() — idle, skipped"})," — cancel was a no-op"]}),`
`]}),`
`,e.jsxs(n.p,{children:["Filter the browser console to ",e.jsx(n.code,{children:"[TTS]"})," to see only speech events."]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"6-reducer-unit-testing",children:"6. Reducer Unit Testing"}),`
`,e.jsx(n.p,{children:"Both reducers are pure functions and can be tested without React:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`import {
  answerGameReducer,
  makeInitialState,
} from './answer-game-reducer';

const state = makeInitialState(config);
const next = answerGameReducer(state, {
  type: 'PLACE_TILE',
  tileId: 'tile-1',
  zoneIndex: 0,
});
expect(next.zones[0].placedTileId).toBe('tile-1');
`})}),`
`,e.jsx(n.p,{children:"For the GameEngine reducer:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`import { createReducer } from './lifecycle';

const reducer = createReducer(config, gameMovers);
const next = reducer(state, {
  type: 'SUBMIT_ANSWER',
  args: {},
  timestamp: Date.now(),
});
expect(next.phase).toBe('scoring');
`})}),`
`,e.jsx(n.p,{children:"Existing test suites:"}),`
`,e.jsxs(n.ul,{children:[`
  `,e.jsx(n.li,{children:e.jsx(n.code,{children:"src/components/answer-game/answer-game-reducer.test.ts"})}),`
  `,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"src/lib/game-engine/lifecycle.test.ts"})," (if present)"]}),`
  `,e.jsx(n.li,{children:e.jsx(n.code,{children:"src/lib/game-engine/session-finder.test.ts"})}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"quick-reference",children:"Quick Reference"}),`
`,e.jsxs(n.table,{children:[`
  `,e.jsxs(n.thead,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.th,{children:"What to inspect"}),`
      `,e.jsx(n.th,{children:"Tool / technique"}),`
    `]}),`
  `]}),`
  `,e.jsxs(n.tbody,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"Current AnswerGame state"}),`
      `,e.jsxs(n.td,{children:["React DevTools → ",e.jsx(n.code,{children:"AnswerGameStateContext.Provider"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"Current GameEngine state"}),`
      `,e.jsxs(n.td,{children:["React DevTools → ",e.jsx(n.code,{children:"GameStateContext.Provider"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"Dispatched actions (trace)"}),`
      `,e.jsxs(n.td,{children:["Temporary logging wrapper around ",e.jsx(n.code,{children:"useReducer"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"Route params and loader data"}),`
      `,e.jsx(n.td,{children:"TanStack Router DevTools panel (bottom-right)"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"Game events (evaluate, etc.)"}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"getGameEventBus().subscribe('game:*', console.log)"})}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"Persisted sessions and moves"}),`
      `,e.jsxs(n.td,{children:["RxDB queries via ",e.jsx(n.code,{children:"window.__db"})," or IndexedDB direct access"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"Sound playback"}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"HTMLAudioElement.prototype.play"})," monkey-patch"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"TTS utterances"}),`
      `,e.jsxs(n.td,{children:["Filter browser console to ",e.jsx(n.code,{children:"[TTS]"})]}),`
    `]}),`
  `]})]})]})}function u(s={}){const{wrapper:n}={...r(),...s.components};return n?e.jsx(n,{...s,children:e.jsx(t,{...s})}):t(s)}export{u as default};
