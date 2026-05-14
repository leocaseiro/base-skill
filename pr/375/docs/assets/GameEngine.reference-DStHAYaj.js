import{j as e}from"./iframe-lanmD6_3.js";import{u as r,M as i}from"./blocks-C_HychBx.js";import"./preload-helper-PPVm8Dsz.js";import"./index-D2figOUY.js";import"./index-Dg_QqUqY.js";import"./index-CieTJlpN.js";import"./index-q425ybt7.js";import"./index-DrFu-skq.js";function s(d){const n={blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",h3:"h3",h4:"h4",hr:"hr",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...r(),...d.components};return e.jsxs(e.Fragment,{children:[e.jsx(i,{title:"GameEngine/Reference"}),`
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
  change. On the next mount, `,e.jsx(n.code,{children:"AnswerGameProvider"}),` reads that draft back via its
  `,e.jsx(n.code,{children:"initialState"})," prop and dispatches ",e.jsx(n.code,{children:"RESUME_ROUND"}),` — see
  `,e.jsx(n.code,{children:"AnswerGame.reference.mdx"})," for the action catalog and ",e.jsx(n.code,{children:"AnswerGame.flows.mdx"}),` §9
  for the mount-effect decision tree.
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
`,e.jsx(n.h2,{id:"xstate-engine-pr-1a-foundation",children:"XState engine (PR 1a foundation)"}),`
`,e.jsxs(n.p,{children:[`
  `,`PR 1a introduces a per-game XState machine alongside the legacy
  `,e.jsx(n.code,{children:"GameEngineProvider"}),` above. The XState machine owns the per-round
  lifecycle (phase transitions, round-advance timing, `,e.jsx(n.code,{children:"game:end"}),`
  emission) and sits inside the `,e.jsx(n.code,{children:"playing"}),` state of the legacy lifecycle.
  The two coexist until PR 1c.
`]}),`
`,e.jsxs(n.p,{children:[`
  `,"Source: ",e.jsx(n.code,{children:"src/lib/game-engine/useGameEngine.ts"}),`,
  `,e.jsx(n.code,{children:"src/lib/game-engine/definition-types.ts"}),`,
  `,e.jsx(n.code,{children:"src/lib/game-engine/side-effects.ts"}),`.
`]}),`
`,e.jsx(n.h3,{id:"usegameenginedefinition-options",children:e.jsx(n.code,{children:"useGameEngine(definition, options?)"})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`const engine = useGameEngine<TRound, TContext>(
  definition,
  options?,
): UseGameEngineResult<TContext>;
`})}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"options"}),":"]}),`
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
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"input"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"unknown"})}),`
      `,e.jsxs(n.td,{children:["Populates the machine's initial context via XState v5's ",e.jsx(n.code,{children:"setup({ types: { input } })"})," + ",e.jsx(n.code,{children:"useMachine(machine, { input })"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"envelope"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"Partial<EngineEnvelope>"})}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"{ sessionId, profileId, roundIndex }"})," for emitted events. ",e.jsx(n.code,{children:"gameId"})," is taken from ",e.jsx(n.code,{children:"definition.id"}),". Memoised inside the hook"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"totalRounds"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsxs(n.td,{children:["Used to build the runtime ",e.jsx(n.code,{children:"isLastRound"})," / ",e.jsx(n.code,{children:"isMidLevelRound"})," / ",e.jsx(n.code,{children:"isLastRoundOfLevel"})," guards"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"levelSize"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsxs(n.td,{children:["Position-in-level modulo used by ",e.jsx(n.code,{children:"isLastRoundOfLevel"}),". Defaults to ",e.jsx(n.code,{children:"totalRounds"})," (single level)"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"isLevelMode"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"boolean | undefined"})}),`
      `,e.jsxs(n.td,{children:["Set ",e.jsx(n.code,{children:"true"})," whenever a ",e.jsx(n.code,{children:"levelMode"})," block exists on the config — even without ",e.jsx(n.code,{children:"maxLevels"}),". Enables endless level mode in the guards. Defaults to ",e.jsx(n.code,{children:"false"})," (no level mode) so NumberMatch / WordSpell stay unaffected"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"maxLevels"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number | null | undefined"})}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"null"})," = endless levels, ",e.jsx(n.code,{children:"number"})," = finite. Pair with ",e.jsx(n.code,{children:"isLevelMode: true"}),". Defaults to ",e.jsx(n.code,{children:"null"})]}),`
    `]}),`
  `]})]}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"UseGameEngineResult<TContext>"}),":"]}),`
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
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"string"})}),`
      `,e.jsxs(n.td,{children:["Current state value (camelCase: ",e.jsx(n.code,{children:"playing"}),", ",e.jsx(n.code,{children:"roundComplete"}),", ",e.jsx(n.code,{children:"waitingForNext"}),", ",e.jsx(n.code,{children:"gameOver"}),", …)"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"context"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"TContext"})}),`
      `,e.jsxs(n.td,{children:["The machine's full context. Cast at consume time via the generic (e.g., ",e.jsx(n.code,{children:"NumberMatchEngineContext"}),")"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"currentRound"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"RoundOutput"})}),`
      `,e.jsxs(n.td,{children:["Reads ",e.jsx(n.code,{children:"context.lastRoundOutput"})," if present"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"roundIndex"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsxs(n.td,{children:["Reads ",e.jsx(n.code,{children:"context.roundIndex"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"levelIndex"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsxs(n.td,{children:["Reads ",e.jsx(n.code,{children:"context.levelIndex"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"totalRounds"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsxs(n.td,{children:["Reads ",e.jsx(n.code,{children:"context.totalRounds"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"retryCount"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsxs(n.td,{children:["Reads ",e.jsx(n.code,{children:"context.retryCount"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"isLastRound"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"boolean"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"roundIndex + 1 >= totalRounds"})}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"send"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"(event: GameMachineEvent) => void"})}),`
      `,e.jsxs(n.td,{children:["Cast to the machine's ",e.jsx(n.code,{children:"send"}),". Send any event the machine declares (cast via ",e.jsx(n.code,{children:"as never"})," at the call site if needed)"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"celebrating"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"CelebrationConfig | null"})}),`
      `,e.jsxs(n.td,{children:["Always ",e.jsx(n.code,{children:"null"})," in PR 1a; PR 1b populates from ",e.jsx(n.code,{children:"context.activeCelebration"})]}),`
    `]}),`
  `]})]}),`
`,e.jsxs(n.p,{children:[`
  `,"The hook wraps ",e.jsx(n.code,{children:"definition.machine.provide({ guards, actions })"}),` in
  `,e.jsx(n.code,{children:"useMemo"})," so the machine is stable across renders. ",e.jsx(n.code,{children:"useMachine"}),`
  returns a stable `,e.jsx(n.code,{children:"send"}),`; the wrapper around it is recreated on every
  machine state change but always reaches the same underlying actor.
`]}),`
`,e.jsx(n.h3,{id:"engine-injected-guards-and-actions",children:"Engine-injected guards and actions"}),`
`,e.jsxs(n.p,{children:[`
  `,e.jsx(n.code,{children:"buildEngineGuards(totalRounds, levelSize, { isLevelMode, maxLevels })"}),`
  returns the runtime bodies for the placeholder guards declared in each
  game's `,e.jsx(n.code,{children:"setup({ guards })"}),`. The third argument carries level-mode
  context the engine can't derive from `,e.jsx(n.code,{children:"totalRounds"}),` alone:
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`const isEndless = isLevelMode === true && maxLevels === null;

isMidLevelRound: ({ context }) => {
  const positionInLevel = (context.roundIndex + 1) % max(levelSize, 1);
  if (positionInLevel === 0) return false;
  if (isEndless) return true;
  return context.roundIndex + 1 < totalRounds;
};
isLastRoundOfLevel: ({ context }) => {
  const positionInLevel = (context.roundIndex + 1) % max(levelSize, 1);
  if (positionInLevel !== 0) return false;
  if (isEndless) return true;
  return context.roundIndex + 1 < totalRounds;
};
isLastRound: ({ context }) => {
  if (isEndless) return false;
  return context.roundIndex + 1 >= totalRounds;
};
`})}),`
`,e.jsxs(n.p,{children:[`
  `,"The ",e.jsx(n.code,{children:"isEndless"})," branch keeps ",e.jsx(n.code,{children:"gameOver"}),` reachable only via explicit
  `,e.jsx(n.code,{children:"COMPLETE_GAME"})," / ",e.jsx(n.code,{children:"GAME_OVER"}),` events (e.g., user taps "I'm Done" on
  the level-complete overlay). Without it, the engine would treat
  `,e.jsx(n.code,{children:"roundIndex + 1 >= totalRounds"}),` as "game's over" even when
  `,e.jsx(n.code,{children:"levelMode.generateNextLevel"}),` is ready to produce another level —
  the regression `,e.jsx(n.code,{children:"e2e/sortnumbers-level-advance.spec.ts"}),` pins this.
`]}),`
`,e.jsxs(n.p,{children:["Engine-injected actions (overridden by ",e.jsx(n.code,{children:"useGameEngine.provide"}),"):"]}),`
`,e.jsxs(n.table,{children:[`
  `,e.jsxs(n.thead,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.th,{children:"Action"}),`
      `,e.jsx(n.th,{children:"Params"}),`
      `,e.jsx(n.th,{children:"Side effect"}),`
    `]}),`
  `]}),`
  `,e.jsxs(n.tbody,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"speak"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"{ lifecycleEvent }"})}),`
      `,e.jsxs(n.td,{children:["Emits ",e.jsx(n.code,{children:"lifecycle:speak"})," via ",e.jsx(n.code,{children:"executeSideEffects"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"emit"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"{ event }"})}),`
      `,e.jsxs(n.td,{children:["Emits an arbitrary ",e.jsx(n.code,{children:"GameEvent"})," via ",e.jsx(n.code,{children:"executeSideEffects"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"completeGame"})}),`
      `,e.jsx(n.td,{children:"—"}),`
      `,e.jsxs(n.td,{children:["Emits ",e.jsx(n.code,{children:"game:end"})," with ",e.jsx(n.code,{children:"gameId"}),"/",e.jsx(n.code,{children:"sessionId"}),"/",e.jsx(n.code,{children:"profileId"})," from envelope and ",e.jsx(n.code,{children:"roundIndex"}),"/",e.jsx(n.code,{children:"totalRounds"}),"/",e.jsx(n.code,{children:"retryCount"})," from current machine context"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"playSound"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"{ sound: SoundKey }"})}),`
      `,e.jsxs(n.td,{children:["Calls ",e.jsx(n.code,{children:"AudioFeedback.playSound(params.sound)"})]}),`
    `]}),`
  `]})]}),`
`,e.jsxs(n.p,{children:[`
  `,`In-definition guards (real bodies, not overridden) live on the game
  definition itself. `,e.jsx(n.code,{children:"numberMatchDefinition"})," declares ",e.jsx(n.code,{children:"allFilledCorrectly"}),`
  and `,e.jsx(n.code,{children:"canEject"}),`; PR 1b games declare their own predicates as needed.
`]}),`
`,e.jsxs(n.h3,{id:"gameenginecontext--usegameenginecontext",children:[e.jsx(n.code,{children:"GameEngineContext"})," + ",e.jsx(n.code,{children:"useGameEngineContext()"})]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`const GameEngineContext: React.Context<GameEngineContextValue | null>;
const useGameEngineContext = <TRound>(): GameEngineContextValue<TRound>;
`})}),`
`,e.jsxs(n.p,{children:[`
  `,e.jsx(n.code,{children:"GameEngineContextValue"}),` is
  `,e.jsx(n.code,{children:"{ definition: GameDefinition<TRound>, engine: UseGameEngineResult }"}),`.
`]}),`
`,e.jsxs(n.p,{children:[`
  `,"Wrap a tree in ",e.jsx(n.code,{children:"<GameEngineContext.Provider value={{ definition, engine }}>"}),`
  to expose the engine to descendants (e.g., a future `,e.jsx(n.code,{children:"useLifecycleTTS"}),`
  that reads `,e.jsx(n.code,{children:"definition.tts"}),`). NumberMatch in PR 1a does not use this
  context — the engine is passed to `,e.jsx(n.code,{children:"NumberMatchSession"}),` as a prop.
  PR 1b uses the context when `,e.jsx(n.code,{children:"useGameRound"}),` adopts the engine.
`]}),`
`,e.jsx(n.h3,{id:"gamedefinitiontround",children:e.jsx(n.code,{children:"GameDefinition<TRound>"})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`interface GameDefinition<TRound = unknown> {
  id: string;
  interaction: 'drag-to-slot' | 'tap-select';
  slotInteraction?: 'ordered' | 'free-swap';
  machine: AnyStateMachine;
  buildRound: (ctx: PhaseContext) => TRound;
  tts?: Partial<Record<LifecycleEvent, EventTemplate>>;
}
`})}),`
`,e.jsxs(n.p,{children:[`
  `,"PR 1a Spec Delta: ",e.jsx(n.code,{children:"buildRound"}),` is a passthrough for NumberMatch
  (`,e.jsx(n.code,{children:"(ctx) => ({ roundIndex: ctx.roundIndex })"}),`). Round construction
  stays in the React component (`,e.jsx(n.code,{children:"buildNumeralRound"}),`) for PR 1a; PR 1b
  lifts it into `,e.jsx(n.code,{children:"definition.ts"}),` once WordSpell + SortNumbers migrate.
`]}),`
`,e.jsx(n.h3,{id:"executesideeffects",children:e.jsx(n.code,{children:"executeSideEffects"})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`const executeSideEffects = (
  effects: SideEffect[],
  envelope: { gameId; sessionId; profileId; roundIndex },
  onDelayDone?: () => void,
): { cancel: () => void };
`})}),`
`,e.jsxs(n.p,{children:[`
  `,e.jsx(n.code,{children:"SideEffect"}),` is
  `,e.jsx(n.code,{children:"{ type: 'emit'; event } | { type: 'speak'; lifecycleEvent } | { type: 'delay'; ms }"}),`.
  Used by `,e.jsx(n.code,{children:"useGameEngine"}),`'s injected actions; not called directly by game
  components.
`]}),`
`,e.jsxs(n.h3,{id:"dispatch-bridge--answergameproviderenginedispatch",children:["Dispatch bridge — ",e.jsx(n.code,{children:"AnswerGameProvider.engineDispatch"})]}),`
`,e.jsxs(n.p,{children:[`
  `,"XState-first games pass ",e.jsx(n.code,{children:"engine.send"}),` (wrapped in a stable callback)
  to `,e.jsx(n.code,{children:"AnswerGameProvider"})," via the ",e.jsx(n.code,{children:"engineDispatch"}),` prop (or to
  `,e.jsx(n.code,{children:"<AnswerGame engineDispatch={...} />"}),` which forwards through). The
  provider mirrors every reducer dispatch — including its own internal
  `,e.jsx(n.code,{children:"INIT_ROUND"}),"/",e.jsx(n.code,{children:"RESUME_ROUND"}),` mount effect — so the engine receives the
  seed and every subsequent `,e.jsx(n.code,{children:"PLACE_TILE"}),"/",e.jsx(n.code,{children:"TYPE_TILE"}),`/etc. See
  `,e.jsx(n.code,{children:"AnswerGame.reference.mdx"}),` Context API section for details.
`]}),`
`,e.jsx(n.h3,{id:"pr-1a-spec-deltas-vs-the-original-pr-1a-plan",children:"PR 1a Spec Deltas (vs the original PR 1a plan)"}),`
`,e.jsxs(n.ol,{children:[`
  `,e.jsxs(n.li,{children:[`
    `,e.jsx(n.code,{children:"useGameEngine"})," signature simplified — dropped ",e.jsx(n.code,{children:"adapter"}),` and
    `,e.jsx(n.code,{children:"dispatch"})," params. NumberMatch dispatches through ",e.jsx(n.code,{children:"engine.send"}),`
    (mirrored from the answer-game reducer via the `,e.jsx(n.code,{children:"engineDispatch"}),`
    prop on `,e.jsx(n.code,{children:"AnswerGameProvider"}),`). No reducer adapter used.
  `]}),`
  `,e.jsxs(n.li,{children:[`
    `,e.jsx(n.code,{children:"celebrating: null"}),` placeholder; PR 1b populates from
    `,e.jsx(n.code,{children:"context.activeCelebration"}),`.
  `]}),`
  `,e.jsxs(n.li,{children:[`
    `,"Dropped speculative engine actors (",e.jsx(n.code,{children:"celebrationActor"}),`,
    `,e.jsx(n.code,{children:"levelCelebrationActor"}),", ",e.jsx(n.code,{children:"gameOverActor"}),", ",e.jsx(n.code,{children:"phonemeSequenceActor"}),`).
    NumberMatch uses XState's built-in `,e.jsx(n.code,{children:"after: { 750: ... }"}),` instead.
  `]}),`
  `,e.jsxs(n.li,{children:[`
    `,e.jsx(n.code,{children:"InteractionAdapter<TAction>"})," and ",e.jsx(n.code,{children:"answerGameAdapter"}),` not created
    (no PR 1a consumer).
  `]}),`
  `,e.jsxs(n.li,{children:[`
    `,"Dropped engine actions with no PR 1a caller (",e.jsx(n.code,{children:"advanceRound"}),`,
    `,e.jsx(n.code,{children:"advanceLevel"}),", ",e.jsx(n.code,{children:"buildRound"}),"). Kept ",e.jsx(n.code,{children:"speak"}),", ",e.jsx(n.code,{children:"emit"}),`,
    `,e.jsx(n.code,{children:"completeGame"}),", ",e.jsx(n.code,{children:"playSound"}),`.
  `]}),`
  `,e.jsxs(n.li,{children:[`
    `,e.jsx(n.code,{children:"buildEngineGuards"})," + ",e.jsx(n.code,{children:"EngineGuards"}),` type exported so
    game-definition tests can `,e.jsx(n.code,{children:"createActor(machine.provide({ guards: buildEngineGuards(…) }))"}),`
    with real bodies instead of `,e.jsx(n.code,{children:"setup"}),` placeholders.
  `]}),`
  `,e.jsxs(n.li,{children:[`
    `,e.jsx(n.code,{children:"useGameEngine"})," exposes ",e.jsx(n.code,{children:"context: TContext"})," and ",e.jsx(n.code,{children:"retryCount: number"}),`
    on the result. Needed by NumberMatch's component to destructure
    `,e.jsx(n.code,{children:"zones"})," / ",e.jsx(n.code,{children:"retryCount"}),` from engine state.
  `]}),`
  `,e.jsxs(n.li,{children:[`
    `,e.jsx(n.code,{children:"completeGame"})," emits ",e.jsx(n.code,{children:"game:end"})," with ",e.jsx(n.code,{children:"roundIndex"}),` from machine
    context (not `,e.jsx(n.code,{children:"envelope.roundIndex"}),`, which is fixed at engine
    creation time). Behavioral parity with the prior `,e.jsx(n.code,{children:"useEffect"}),`-based
    emission.
  `]}),`
  `,e.jsxs(n.li,{children:[`
    `,"Dispatch-bridge is implemented as ",e.jsx(n.code,{children:"engineDispatch"}),` on
    `,e.jsx(n.code,{children:"AnswerGameProvider"}),` (not a context-override component in the
    game). `,e.jsx(n.code,{children:"KeyboardInputAdapter"}),` is a sibling of children inside
    `,e.jsx(n.code,{children:"AnswerGameProvider"}),`, so a child-side bridge can't intercept its
    dispatches.
  `]}),`
  `,e.jsxs(n.li,{children:[`
    `,"NumberMatch's engine is held by an inner ",e.jsx(n.code,{children:"NumberMatchInstance"}),`
    keyed by `,e.jsx(n.code,{children:"sessionEpoch"}),` so the actor remounts on Play Again.
  `]}),`
`]}),`
`,e.jsx(n.h3,{id:"per-game-machine-contexts-pr-1b",children:"Per-game machine contexts (PR 1b)"}),`
`,e.jsx(n.h4,{id:"wordspellenginecontext",children:e.jsx(n.code,{children:"WordSpellEngineContext"})}),`
`,e.jsxs(n.p,{children:[`
  `,"Identical field set to ",e.jsx(n.code,{children:"NumberMatchEngineContext"}),` (see
  `,e.jsx(n.code,{children:"src/games/number-match/definition.ts"}),`). Per Spec Delta 3, WordSpell
  does `,e.jsx(n.strong,{children:"not"})," carry ",e.jsx(n.code,{children:"firstActionAt"})," or ",e.jsx(n.code,{children:"selectedSlotIds"}),` — PR 1b-bis
  introduces them when the timestamp write and Set toggle land.
`]}),`
`,e.jsxs(n.table,{children:[`
  `,e.jsxs(n.thead,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.th,{children:"Field"}),`
      `,e.jsx(n.th,{children:"Type"}),`
      `,e.jsx(n.th,{children:"Notes"}),`
    `]}),`
  `]}),`
  `,e.jsxs(n.tbody,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"allTiles"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"TileItem[]"})}),`
      `,e.jsx(n.td,{children:"All tiles for the current round"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"bankTileIds"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"string[]"})}),`
      `,e.jsx(n.td,{children:"Unplaced tile ids"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"zones"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"AnswerZone[]"})}),`
      `,e.jsxs(n.td,{children:["Slot state — ",e.jsx(n.code,{children:"placedTileId"}),", ",e.jsx(n.code,{children:"isWrong"}),", ",e.jsx(n.code,{children:"isLocked"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"activeSlotIndex"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsx(n.td,{children:"Cursor for keyboard-driven input"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"dragActiveTileId"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"string | null"})}),`
      `,e.jsx(n.td,{children:"Transient drag state"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"dragHoverZoneIndex"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number | null"})}),`
      `,e.jsx(n.td,{children:"Transient drag hover"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"dragHoverBankTileId"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"string | null"})}),`
      `,e.jsx(n.td,{children:"Transient drag hover over bank"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"retryCount"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsx(n.td,{children:"Wrong placements this round"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"roundIndex"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsx(n.td,{children:"0-based current round"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"levelIndex"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsxs(n.td,{children:["Always ",e.jsx(n.code,{children:"0"})," at runtime — WordSpell never advances"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"totalRounds"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsxs(n.td,{children:["From ",e.jsx(n.code,{children:"useGameEngine"})," input"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"maxLevels"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number | null"})}),`
      `,e.jsxs(n.td,{children:["Always ",e.jsx(n.code,{children:"null"})," — WordSpell has no level mode"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"wrongTileBehavior"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"'reject' | 'lock-manual' | 'lock-auto-eject'"})}),`
      `,e.jsxs(n.td,{children:["Defaults to ",e.jsx(n.code,{children:"'lock-auto-eject'"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"isLevelMode"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"boolean"})}),`
      `,e.jsxs(n.td,{children:["Always ",e.jsx(n.code,{children:"false"})," for WordSpell"]}),`
    `]}),`
  `]})]}),`
`,e.jsx(n.h4,{id:"sortnumbersenginecontext",children:e.jsx(n.code,{children:"SortNumbersEngineContext"})}),`
`,e.jsxs(n.p,{children:[`
  `,"Same field set as ",e.jsx(n.code,{children:"WordSpellEngineContext"}),`, with two semantic
  differences:
`]}),`
`,e.jsxs(n.ul,{children:[`
  `,e.jsxs(n.li,{children:[`
    `,e.jsx(n.code,{children:"levelIndex"}),` is read at runtime — the machine increments it via the
    `,e.jsx(n.code,{children:"ADVANCE_LEVEL"})," handler and ",e.jsx(n.code,{children:"LevelCompleteOverlay"}),` reads it for the
    level title.
  `]}),`
  `,e.jsxs(n.li,{children:[`
    `,e.jsx(n.code,{children:"roundIndex"}),` accumulates across level boundaries (see
    `,e.jsx(n.code,{children:"GameEngine.flows.mdx"}),` §5c). The engine guards
    (`,e.jsx(n.code,{children:"isLastRound: roundIndex + 1 >= totalRounds"}),`) only fire correctly
    with cumulative `,e.jsx(n.code,{children:"roundIndex"}),`. The reducer mirror still resets
    `,e.jsx(n.code,{children:"roundIndex"}),` per level for HUD display until PR 1c.
  `]}),`
`]}),`
`,e.jsxs(n.table,{children:[`
  `,e.jsxs(n.thead,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.th,{children:"Field"}),`
      `,e.jsx(n.th,{children:"Type"}),`
      `,e.jsx(n.th,{children:"Notes"}),`
    `]}),`
  `]}),`
  `,e.jsxs(n.tbody,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"allTiles"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"TileItem[]"})}),`
      `,e.jsx(n.td,{children:"All tiles for the current round"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"bankTileIds"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"string[]"})}),`
      `,e.jsx(n.td,{children:"Unplaced tile ids"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"zones"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"AnswerZone[]"})}),`
      `,e.jsxs(n.td,{children:["Slot state — ",e.jsx(n.code,{children:"placedTileId"}),", ",e.jsx(n.code,{children:"isWrong"}),", ",e.jsx(n.code,{children:"isLocked"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"activeSlotIndex"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsx(n.td,{children:"Cursor for keyboard-driven input"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"dragActiveTileId"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"string | null"})}),`
      `,e.jsx(n.td,{children:"Transient drag state"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"dragHoverZoneIndex"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number | null"})}),`
      `,e.jsx(n.td,{children:"Transient drag hover"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"dragHoverBankTileId"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"string | null"})}),`
      `,e.jsx(n.td,{children:"Transient drag hover over bank"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"retryCount"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsx(n.td,{children:"Wrong placements this round"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"roundIndex"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsx(n.td,{children:"Cumulative across level boundaries (engine semantic)"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"levelIndex"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsx(n.td,{children:"0-based current level"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"totalRounds"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsxs(n.td,{children:["From ",e.jsx(n.code,{children:"useGameEngine"})," input"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"maxLevels"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number | null"})}),`
      `,e.jsxs(n.td,{children:["From ",e.jsx(n.code,{children:"useGameEngine"})," input"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"wrongTileBehavior"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"'reject' | 'lock-manual' | 'lock-auto-eject'"})}),`
      `,e.jsxs(n.td,{children:["Defaults to ",e.jsx(n.code,{children:"'lock-auto-eject'"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"isLevelMode"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"boolean"})}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"true"})," when the config declares a level mode"]}),`
    `]}),`
  `]})]})]})}function u(d={}){const{wrapper:n}={...r(),...d.components};return n?e.jsx(n,{...d,children:e.jsx(s,{...d})}):s(d)}export{u as default};
