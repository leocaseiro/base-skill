import{j as e}from"./iframe-kemjHOM7.js";import{u as s,M as o}from"./blocks-wF3KTS1D.js";import"./preload-helper-PPVm8Dsz.js";import"./index-Ctv392v_.js";import"./index-D6RFMxkV.js";import"./index-Dm0QsqrA.js";import"./index-ALUlrBDq.js";import"./index-DrFu-skq.js";function i(r){const n={blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",hr:"hr",p:"p",pre:"pre",...s(),...r.components};return e.jsxs(e.Fragment,{children:[e.jsx(o,{title:"game-engine/Flows"}),`
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
`})})]})}function h(r={}){const{wrapper:n}={...s(),...r.components};return n?e.jsx(n,{...r,children:e.jsx(i,{...r})}):i(r)}export{h as default};
