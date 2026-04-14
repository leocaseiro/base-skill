import{j as e}from"./iframe-DvQJ8Mk7.js";import{u as i,M as d}from"./blocks-DTC2slmO.js";import"./preload-helper-PPVm8Dsz.js";import"./index-B2k684QV.js";import"./index-BKQhzlaK.js";import"./index-nJjTmQLD.js";import"./index-Nm8rC2ZS.js";import"./index-DrFu-skq.js";function r(s){const n={blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",h3:"h3",hr:"hr",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...i(),...s.components};return e.jsxs(e.Fragment,{children:[e.jsx(d,{title:"game-engine/Reference"}),`
`,e.jsx(n.h1,{id:"gameengine--reference",children:"GameEngine — Reference"}),`
`,e.jsxs(n.blockquote,{children:[`
  `,e.jsxs(n.p,{children:["Source: ",e.jsx(n.code,{children:"src/lib/game-engine/"})]}),`
  `,e.jsxs(n.p,{children:[`
    `,`The game engine is the outer shell that wraps every game session. It manages the
    session lifecycle, records moves for replay, and persists draft state across page
    refreshes. Update this file when the engine API, move log structure, or session
    recording changes.
  `]}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"provider-api",children:"Provider API"}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"GameEngineProvider"})," is defined in ",e.jsx(n.code,{children:"src/lib/game-engine/index.tsx"}),"."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-tsx",children:`<GameEngineProvider
  config={ResolvedGameConfig}
  initialLog={MoveLog | null} // pass to resume a saved session
  sessionId={string}
  meta={SessionMeta}
>
  {children}
</GameEngineProvider>
`})}),`
`,e.jsx(n.h3,{id:"contexts",children:"Contexts"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`// Read game state
const GameStateContext: React.Context<GameEngineState | null>
export const useGameState = (): GameEngineState

// Dispatch a move
const GameDispatchContext: React.Context<((move: Move) => void) | null>
export const useGameDispatch = (): (move: Move) => void
`})}),`
`,e.jsx(n.h3,{id:"gameenginestate",children:"GameEngineState"}),`
`,e.jsxs(n.p,{children:["Defined in ",e.jsx(n.code,{children:"src/lib/game-engine/types.ts"}),"."]}),`
`,e.jsxs(n.table,{children:[`
  `,e.jsxs(n.thead,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.th,{children:"Field"}),`
      `,e.jsx(n.th,{children:"Type"}),`
      `,e.jsx(n.th,{children:"Description"}),`
    `]}),`
  `]}),`
  `,e.jsxs(n.tbody,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"phase"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"GamePhase"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"'idle' | 'loading' | 'instructions' | 'playing' | 'evaluating' | 'scoring' | 'next-round' | 'retry' | 'game-over'"})}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"roundIndex"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsx(n.td,{children:"Current round (0-based)"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"score"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsx(n.td,{children:"Cumulative score"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"streak"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsx(n.td,{children:"Consecutive correct answers"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"retryCount"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsx(n.td,{children:"Retries in current round"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"content"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"ResolvedContent"})}),`
      `,e.jsx(n.td,{children:"All round definitions for this session"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"currentRound"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"RoundState"})}),`
      `,e.jsxs(n.td,{children:["Active round: ",e.jsx(n.code,{children:"{ roundId, answer, hintsUsed }"})]}),`
    `]}),`
  `]})]}),`
`,e.jsx(n.h3,{id:"move",children:"Move"}),`
`,e.jsxs(n.p,{children:["All state changes go through a ",e.jsx(n.code,{children:"Move"}),":"]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`interface Move {
  type: MoveType | string; // 'SUBMIT_ANSWER' | 'REQUEST_HINT' | 'SKIP_INSTRUCTIONS' | 'UNDO' | custom
  args: Record<string, string | number | boolean>;
  timestamp: number;
}
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"round-context",children:"Round Context"}),`
`,e.jsxs(n.p,{children:[`
  `,e.jsx(n.code,{children:"GameRoundContext"}),` is a lightweight context providing round progress to any component
  in the tree without importing the full engine state.
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`// src/lib/game-engine/GameRoundContext.ts
interface GameRoundContextValue {
  current: number; // 1-based current round
  total: number; // total rounds in session
}
`})}),`
`,e.jsxs(n.p,{children:["Consumed by: ",e.jsx(n.code,{children:"ProgressBar"}),", ",e.jsx(n.code,{children:"GameHeader"}),', and any component that shows "Round N of M".']}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"session-recording",children:"Session Recording"}),`
`,e.jsxs(n.p,{children:[`
  `,e.jsx(n.code,{children:"SessionRecorderBridge"})," (inside ",e.jsx(n.code,{children:"GameEngineProvider"}),`) subscribes to move dispatches
  and writes them to RxDB via `,e.jsx(n.code,{children:"useSessionRecorder"}),`.
`]}),`
`,e.jsx(n.h3,{id:"movelog-structure",children:"MoveLog structure"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`interface MoveLog {
  gameId: string;
  sessionId: string;
  profileId: string;
  seed: string;
  initialContent: ResolvedContent;
  initialState: GameEngineState;
  moves: Move[]; // append-only list of every dispatched move
}
`})}),`
`,e.jsxs(n.p,{children:[`
  `,"Stored in RxDB collection ",e.jsx(n.code,{children:"session_history_index"}),". Replay by passing ",e.jsx(n.code,{children:"initialLog"}),` to
  `,e.jsx(n.code,{children:"GameEngineProvider"}),`.
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"draft-sync",children:"Draft Sync"}),`
`,e.jsxs(n.p,{children:[`
  `,e.jsx(n.code,{children:"useAnswerGameDraftSync"})," (in ",e.jsx(n.code,{children:"src/components/answer-game/"}),`) serialises the current
  `,e.jsx(n.code,{children:"AnswerGameState"})," to RxDB's ",e.jsx(n.code,{children:"session_history_index.draftState"}),` field on every state
  change, and reads it back on mount when `,e.jsx(n.code,{children:"initialState"}),` is provided.
`]}),`
`,e.jsx(n.h3,{id:"answergamedraftstate-persisted-subset",children:"AnswerGameDraftState (persisted subset)"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`interface AnswerGameDraftState {
  allTiles: TileItem[];
  bankTileIds: string[];
  zones: AnswerZone[];
  activeSlotIndex: number;
  phase: 'playing' | 'round-complete' | 'level-complete'; // 'game-over' never persisted
  roundIndex: number;
  retryCount: number;
  levelIndex: number;
}
`})}),`
`,e.jsxs(n.p,{children:[`
  `,"Fields excluded from draft: ",e.jsx(n.code,{children:"config"})," (reconstructed from game config), ",e.jsx(n.code,{children:"dragActiveTileId"}),`
  (transient), `,e.jsx(n.code,{children:"dragHoverZoneIndex"}),", ",e.jsx(n.code,{children:"dragHoverBankTileId"}),` (transient).
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsxs(n.h2,{id:"gameend-event-emission",children:[e.jsx(n.code,{children:"game:end"})," event emission"]}),`
`,e.jsxs(n.p,{children:[`
  `,e.jsx(n.code,{children:"GameEndEvent"})," on the game event bus now carries a ",e.jsx(n.code,{children:"retryCount: number"}),` field so
  skin-level `,e.jsx(n.code,{children:"onGameOver"}),` callbacks can reflect how many retries the session used.
`]}),`
`,e.jsxs(n.p,{children:["Who emits ",e.jsx(n.code,{children:"game:end"}),":"]}),`
`,e.jsxs(n.ul,{children:[`
  `,e.jsxs(n.li,{children:[`
    `,`Each game component (SortNumbers, WordSpell, NumberMatch) fires a single
    `,e.jsx(n.code,{children:"game:end"})," on the transition to ",e.jsx(n.code,{children:"phase === 'game-over'"}),", reading ",e.jsx(n.code,{children:"retryCount"}),`
    from `,e.jsx(n.code,{children:"useAnswerGameContext()"}),`. The session recorder no longer emits this
    event — it only persists the move log / completion patch.
  `]}),`
  `,e.jsxs(n.li,{children:[`
    `,e.jsx(n.code,{children:"useGameSkin"})," subscribes to ",e.jsx(n.code,{children:"game:end"})," and forwards ",e.jsx(n.code,{children:"event.retryCount"}),` to
    `,e.jsx(n.code,{children:"skin.onGameOver(retryCount)"}),`.
  `]}),`
`]}),`
`,e.jsxs(n.p,{children:[`
  `,"When adding a new game, emit ",e.jsx(n.code,{children:"game:end"}),` from the outer session component using
  the same shape so per-game skins receive the retry count.
`]})]})}function m(s={}){const{wrapper:n}={...i(),...s.components};return n?e.jsx(n,{...s,children:e.jsx(r,{...s})}):r(s)}export{m as default};
