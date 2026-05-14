import{j as e}from"./iframe-d2Jo5ZDn.js";import{u as r,M as a}from"./blocks-ClUuZFFT.js";import"./preload-helper-PPVm8Dsz.js";import"./index-DQtVcQg-.js";import"./index-BRqttegb.js";import"./index-y-ykdpz3.js";import"./index-De6gnIOE.js";import"./index-DrFu-skq.js";function s(i){const n={blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",h3:"h3",hr:"hr",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...r(),...i.components};return e.jsxs(e.Fragment,{children:[e.jsx(a,{title:"GameEngine/Flows"}),`
`,e.jsx(n.h1,{id:"gameengine--flows",children:"GameEngine — Flows"}),`
`,e.jsxs(n.blockquote,{children:[`
  `,e.jsxs(n.p,{children:["Source: ",e.jsx(n.code,{children:"src/lib/game-engine/"})]}),`
  `,e.jsx(n.p,{children:"Update this file when session lifecycle transitions or persistence behaviour change."}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"1-session-lifecycle",children:"1. Session Lifecycle"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`stateDiagram-v2
  [*] --> idle

  idle --> loading : GameEngineProvider mounts
  loading --> instructions : assets ready
  instructions --> playing : SKIP_INSTRUCTIONS move
  playing --> evaluating : SUBMIT_ANSWER move
  evaluating --> scoring : evaluation complete
  scoring --> next_round : correct + more rounds
  scoring --> retry : incorrect + retries remaining
  scoring --> game_over : last round OR max retries exceeded
  next_round --> playing : nextRound()
  retry --> playing : retry()
  game_over --> idle : endGame() / Play Again
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"2-move-dispatch-and-recording",children:"2. Move Dispatch and Recording"}),`
`,e.jsxs(n.p,{children:["Every user action goes through a single ",e.jsx(n.code,{children:"dispatch(move)"})," call."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  actor User
  participant Component as Game Component
  participant Engine as GameEngineProvider
  participant Lifecycle as lifecycle reducer
  participant Recorder as SessionRecorderBridge
  participant DB as RxDB

  User->>Component: interaction (submit answer, request hint, etc.)
  Component->>Engine: dispatch({ type, args, timestamp })
  Engine->>Lifecycle: apply move → new GameEngineState
  Engine->>Recorder: append move to MoveLog
  Recorder->>DB: upsert session_history_index { moves: [...] }
  Engine-->>Component: re-render with new state
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"3-session-resume-move-log-replay",children:"3. Session Resume (Move Log Replay)"}),`
`,e.jsxs(n.p,{children:[`
  `,"When a player returns to an in-progress game, the route loader finds the saved ",e.jsx(n.code,{children:"MoveLog"}),`
  and passes it as `,e.jsx(n.code,{children:"initialLog"})," to ",e.jsx(n.code,{children:"GameEngineProvider"}),`.
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  participant Route as game/$gameId loader
  participant DB as RxDB
  participant Engine as GameEngineProvider
  participant Lifecycle as lifecycle reducer

  Route->>DB: query session_history_index for sessionId
  DB-->>Route: MoveLog { initialState, moves: [...] }
  Route->>Engine: <GameEngineProvider initialLog={moveLog} />
  Engine->>Lifecycle: start from initialState
  Engine->>Lifecycle: replay each move in moves[]
  Lifecycle-->>Engine: final restored GameEngineState
  Engine-->>Route: renders at correct round/phase
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"4-draft-state-sync-answergame-mid-round-persistence",children:"4. Draft State Sync (AnswerGame mid-round persistence)"}),`
`,e.jsxs(n.p,{children:[`
  `,e.jsx(n.code,{children:"useAnswerGameDraftSync"})," keeps the ",e.jsx(n.code,{children:"AnswerGameState"}),` persisted so a mid-round refresh
  restores exactly where the player left off.
`]}),`
`,e.jsxs(n.blockquote,{children:[`
  `,e.jsxs(n.p,{children:[`
    `,e.jsx(n.strong,{children:"Celebration phases are excluded from persistence (U1a)."}),`
    `,e.jsx(n.code,{children:"buildDraft"})," returns ",e.jsx(n.code,{children:"null"})," for ",e.jsx(n.code,{children:"game-over"}),", ",e.jsx(n.code,{children:"round-complete"}),`, and
    `,e.jsx(n.code,{children:"level-complete"}),` phases. A tab-close-then-resume during the 750 ms
    celebration window therefore does not replay the celebration on the
    next mount — the draft is cleared, and `,e.jsx(n.code,{children:"RESUME_ROUND"}),` is not
    dispatched. See `,e.jsx(n.code,{children:"useAnswerGameDraftSync.ts"}),` for the source of truth.
    (review #15)
  `]}),`
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  participant Provider as AnswerGameProvider
  participant Hook as useAnswerGameDraftSync
  participant DB as RxDB

  Provider->>Hook: state changes (every dispatch)
  Hook->>DB: upsert session_history_index.draftState (debounced)

  Note over Hook,DB: On page refresh / remount
  Provider->>Hook: mount with initialState prop from route loader
  alt initialState (draft) present
    Hook->>Provider: dispatch RESUME_ROUND { draft }
    Provider-->>Provider: restores tiles, zones, roundIndex,\\n  retryCount, levelIndex from the draft
  else fresh session
    Hook->>Provider: dispatch INIT_ROUND { tiles, zones }
    Provider-->>Provider: reset round to 0
  end
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"xstate-engine-pr-1a-foundation",children:"XState engine (PR 1a foundation)"}),`
`,e.jsxs(n.p,{children:[`
  `,`PR 1a introduces a per-game XState machine that owns the round-level
  lifecycle (`,e.jsx(n.code,{children:"playing"})," / ",e.jsx(n.code,{children:"roundComplete"})," / ",e.jsx(n.code,{children:"waitingForNext"})," / ",e.jsx(n.code,{children:"gameOver"}),`).
  The legacy `,e.jsx(n.code,{children:"lifecycle.ts"}),` reducer above continues to drive the outer
  session shell; the two coexist until PR 1c collapses them. The XState
  machine is created by `,e.jsx(n.code,{children:"useGameEngine(definition, options?)"}),` and consumed
  by the per-game component (NumberMatch is the canonical example for
  PR 1a; WordSpell + SortNumbers migrate in PR 1b, SpotAll in PR 1d).
`]}),`
`,e.jsx(n.h3,{id:"5-per-round-phase-machine-numbermatch-as-the-canonical-example",children:"5. Per-round phase machine (NumberMatch as the canonical example)"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`stateDiagram-v2
  [*] --> playing

  playing --> playing : PLACE_TILE / TYPE_TILE / REMOVE_TILE / SWAP_TILES / EJECT_TILE / SWAP_SLOT_BANK / SET_ACTIVE_SLOT / REJECT_TAP
  playing --> roundComplete : always [allFilledCorrectly]

  roundComplete --> gameOver : after 750ms [isLastRound]
  roundComplete --> waitingForNext : after 750ms
  roundComplete --> gameOver : CELEBRATION_DONE [isLastRound]
  roundComplete --> waitingForNext : CELEBRATION_DONE

  waitingForNext --> playing : ADVANCE_ROUND
`})}),`
`,e.jsxs(n.ul,{children:[`
  `,e.jsxs(n.li,{children:[`
    `,"Round-complete detection is atomic: each game-state ",e.jsx(n.code,{children:"assign"}),` action
    mutates `,e.jsx(n.code,{children:"context.zones"}),", XState re-evaluates ",e.jsx(n.code,{children:"playing.always"}),`, and the
    machine transitions to `,e.jsx(n.code,{children:"roundComplete"}),` in the same step. No React
    `,e.jsx(n.code,{children:"useEffect"}),` race window.
  `]}),`
  `,e.jsxs(n.li,{children:[`
    `,e.jsx(n.code,{children:"gameOver"})," is a regular state (not ",e.jsx(n.code,{children:"type: 'final'"}),`) so root-level
    handlers (`,e.jsx(n.code,{children:"INIT_ROUND"}),", ",e.jsx(n.code,{children:"RESUME_ROUND"}),`) keep firing for defense in
    depth. "Play Again" works via parent re-mount; the machine never
    models RESTART.
  `]}),`
  `,e.jsxs(n.li,{children:[`
    `,e.jsx(n.code,{children:"levelComplete"}),` is not in PR 1a's NumberMatch slice. PR 1b adds it
    alongside WordSpell + SortNumbers when they introduce level mode.
  `]}),`
`]}),`
`,e.jsx(n.h3,{id:"5b-wordspell-phase-machine",children:"5b. WordSpell phase machine"}),`
`,e.jsxs(n.p,{children:[`
  `,`Identical to NumberMatch's machine (same states, same events). The
  context shape adds no WordSpell-specific fields — every field is
  shared with NumberMatch. Round construction (`,e.jsx(n.code,{children:"buildSentenceGapRound"}),`,
  `,e.jsx(n.code,{children:"buildTilesAndZones"}),") stays in ",e.jsx(n.code,{children:"WordSpell.tsx"}),` per Spec Delta 4. At
  runtime `,e.jsx(n.code,{children:"isLevelMode"})," is always ",e.jsx(n.code,{children:"false"})," and ",e.jsx(n.code,{children:"levelIndex"}),` is unused —
  the machine never enters `,e.jsx(n.code,{children:"levelComplete"}),`.
`]}),`
`,e.jsx(n.h3,{id:"5c-sortnumbers-phase-machine-with-levelcomplete",children:"5c. SortNumbers phase machine (with levelComplete)"}),`
`,e.jsxs(n.p,{children:["Adds a ",e.jsx(n.code,{children:"levelComplete"})," state and an ",e.jsx(n.code,{children:"ADVANCE_LEVEL"})," event:"]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-text",children:`playing
↓ always(allFilledCorrectly)
roundComplete
↓ after(750)
  - isLastRound → gameOver
  - isLastRoundOfLevel → levelComplete
  - otherwise → waitingForNext

levelComplete
↓ ADVANCE_LEVEL → incrementLevelIndex + advanceLevelState → playing

waitingForNext
↓ ADVANCE_ROUND → incrementRoundIndex + advanceRoundState → playing
`})}),`
`,e.jsxs(n.p,{children:[`
  `,"Level progression is component-driven: ",e.jsx(n.code,{children:"SortNumbersSession"}),` builds the
  next level's tiles + zones via `,e.jsx(n.code,{children:"buildSortRound(nextLevelIndex)"}),` and
  dispatches `,e.jsx(n.code,{children:"ADVANCE_LEVEL { tiles, zones }"}),` via the reducer (mirrored
  to engine). The engine's `,e.jsx(n.code,{children:"ADVANCE_LEVEL"}),` handler runs
  `,e.jsx(n.code,{children:"incrementRoundIndex"})," + ",e.jsx(n.code,{children:"incrementLevelIndex"})," + ",e.jsx(n.code,{children:"advanceLevelState"}),` —
  so the engine's `,e.jsx(n.code,{children:"roundIndex"}),` accumulates across level boundaries,
  keeping `,e.jsx(n.code,{children:"isLastRound"}),` correct on the final round of the final level.
  The reducer mirror still resets `,e.jsx(n.code,{children:"roundIndex"}),` per level for HUD
  display; PR 1c collapses the reducer and the HUD will then compute
  per-level round from `,e.jsx(n.code,{children:"engine.roundIndex % levelSize"}),`.
`]}),`
`,e.jsxs(n.p,{children:[`
  `,e.jsx(n.strong,{children:"Endless vs finite level mode."}),` The component must pass both
  `,e.jsx(n.code,{children:"isLevelMode: config.levelMode !== undefined"}),` AND
  `,e.jsx(n.code,{children:"maxLevels: config.levelMode?.maxLevels ?? null"})," to ",e.jsx(n.code,{children:"useGameEngine"}),`.
  With `,e.jsx(n.code,{children:"maxLevels === null"})," (endless), the guards suppress ",e.jsx(n.code,{children:"isLastRound"}),`
  and let `,e.jsx(n.code,{children:"isLastRoundOfLevel"})," fire on every ",e.jsx(n.code,{children:"levelSize"}),` boundary — so
  the only way to reach `,e.jsx(n.code,{children:"gameOver"})," is an explicit ",e.jsx(n.code,{children:"COMPLETE_GAME"}),`
  (e.g., "I'm Done" button on the level-complete overlay). Simple-config
  ships exactly this shape: `,e.jsx(n.code,{children:"totalRounds: 1"}),", ",e.jsx(n.code,{children:"levelMode"}),` defined,
  no cap. See `,e.jsx(n.code,{children:"GameEngine.reference.mdx → Engine-injected guards"}),` for
  the guard bodies.
`]}),`
`,e.jsx(n.h3,{id:"6-side-effect-flow",children:"6. Side-effect flow"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  participant Machine as XState machine
  participant Engine as useGameEngine
  participant Effects as executeSideEffects
  participant Bus as GameEventBus
  participant Subscribers as Subscribers
  participant Audio as AudioFeedback

  Machine->>Engine: entry action — { type: 'playSound', params: { sound: 'round-complete' } }
  Engine->>Audio: playSound(params.sound)

  Machine->>Engine: entry action — { type: 'speak', params: { lifecycleEvent: 'game.over' } }
  Engine->>Effects: executeSideEffects([{ type: 'speak', lifecycleEvent: 'game.over' }], envelope)
  Effects->>Bus: emit({ type: 'lifecycle:speak', ...envelope, lifecycleEvent: 'game.over' })
  Bus->>Subscribers: notify

  Machine->>Engine: entry action — completeGame
  Engine->>Effects: executeSideEffects([{ type: 'emit', event: { type: 'game:end', ... } }], envelope)
  Effects->>Bus: emit(game:end event)
`})}),`
`,e.jsxs(n.p,{children:[`
  `,"PR 1a has no subscriber for ",e.jsx(n.code,{children:"lifecycle:speak"})," — ",e.jsx(n.code,{children:"useLifecycleTTS"}),`
  lands in a follow-up task. The bus is the seam, so subscribers can be
  added without touching the machine. Prompt TTS (`,e.jsx(n.code,{children:"useRoundTTS"}),`) is
  unchanged from the legacy flow.
`]}),`
`,e.jsx(n.h3,{id:"7-dispatch-bridge-answergameprovider-enginedispatch-prop",children:"7. Dispatch bridge (AnswerGameProvider engineDispatch prop)"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  participant Component as Game Component
  participant Slot as Slot / NumeralTileBank / KeyboardInputAdapter
  participant Provider as AnswerGameProvider
  participant Reducer as answerGameReducer
  participant Engine as XState machine

  Component->>Provider: engineDispatch={engine.send}
  Slot->>Provider: dispatch(PLACE_TILE)
  Provider->>Reducer: rawDispatch(PLACE_TILE)
  Provider->>Engine: engineDispatch(PLACE_TILE)
  Engine-->>Engine: assign zones, evaluate \`always\`, transition if all zones correct

  Note over Provider: Wrapped dispatch fires for INTERNAL\\n  INIT_ROUND/RESUME_ROUND too, so engine\\n  receives the initial round seed without\\n  any explicit useEffect in the game component.
`})}),`
`,e.jsxs(n.p,{children:[`
  `,e.jsx(n.code,{children:"useGameEngine"})," lives in the game component (e.g., ",e.jsx(n.code,{children:"NumberMatch.tsx"}),`).
  `,e.jsx(n.code,{children:"engine.send"})," is wrapped in a stable callback via ",e.jsx(n.code,{children:"useRef"}),` and passed
  as `,e.jsx(n.code,{children:"engineDispatch"}),". ",e.jsx(n.code,{children:"AnswerGameProvider"})," wraps its ",e.jsx(n.code,{children:"rawDispatch"}),` with
  a `,e.jsx(n.code,{children:"useCallback"}),` (empty deps; stable identity) that mirrors every
  action to the latest `,e.jsx(n.code,{children:"engineDispatch"}),`. Internal dispatches
  (`,e.jsx(n.code,{children:"INIT_ROUND"})," from the mount effect, ",e.jsx(n.code,{children:"RESUME_ROUND"}),` from session
  drafts) route through the same wrapped dispatch.
`]}),`
`,e.jsx(n.h3,{id:"8-celebration-semantics-pr-1a-scope",children:"8. Celebration semantics (PR 1a scope)"}),`
`,e.jsxs(n.p,{children:[`
  `,"PR 1a does ",e.jsx(n.strong,{children:"not"})," emit ",e.jsx(n.code,{children:"celebration:start | complete | skip"}),` events
  from the engine; the overlay is rendered by the game component gated
  on `,e.jsx(n.code,{children:"engine.phase"}),`:
`]}),`
`,e.jsxs(n.ul,{children:[`
  `,e.jsxs(n.li,{children:[`
    `,e.jsx(n.code,{children:"engine.phase === 'roundComplete'"}),` → render
    `,e.jsx(n.code,{children:"<skin.RoundCompleteEffect />"})," or fallback ",e.jsx(n.code,{children:"<ScoreAnimation />"}),`
  `]}),`
  `,e.jsxs(n.li,{children:[`
    `,e.jsx(n.code,{children:"engine.phase === 'gameOver'"})," → render ",e.jsx(n.code,{children:"<skin.CelebrationOverlay />"}),`
    or fallback `,e.jsx(n.code,{children:"<GameOverOverlay />"}),`
  `]}),`
`]}),`
`,e.jsxs(n.p,{children:[`
  `,"PR 1b adds engine-emitted ",e.jsx(n.code,{children:"celebration:*"})," events alongside ",e.jsx(n.code,{children:"useGameRound"}),`
  adoption.
`]}),`
`,e.jsx(n.h3,{id:"9-coexistence-note",children:"9. Coexistence note"}),`
`,e.jsxs(n.p,{children:[`
  `,"The legacy ",e.jsx(n.code,{children:"lifecycle.ts"}),` reducer continues to drive the outer game
  session shell (`,e.jsx(n.code,{children:"idle → loading → instructions → playing → …"}),`) until
  PR 1c. The XState machine owns the per-round phase machine inside
  `,e.jsx(n.code,{children:"playing"}),`. Two reducers run in parallel: the answer-game reducer for
  tile positions (Slot/NumeralTileBank rendering) and the XState machine
  for lifecycle/phase (overlay gating, round-advance timing,
  `,e.jsx(n.code,{children:"game:end"}),` emission). The dispatch bridge (§7) keeps them in sync.
`]})]})}function u(i={}){const{wrapper:n}={...r(),...i.components};return n?e.jsx(n,{...i,children:e.jsx(s,{...i})}):s(i)}export{u as default};
