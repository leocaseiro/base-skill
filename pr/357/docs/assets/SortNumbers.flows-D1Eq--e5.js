import{j as e}from"./iframe-BwIyFV8k.js";import{u as i,M as o}from"./blocks-OepFvC9J.js";import"./preload-helper-PPVm8Dsz.js";import"./index-Du8PeJiV.js";import"./index-6unAHvJv.js";import"./index-D67DG-KY.js";import"./index-DQZux3Wn.js";import"./index-DrFu-skq.js";function l(r){const n={blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",hr:"hr",li:"li",p:"p",pre:"pre",ul:"ul",...i(),...r.components};return e.jsxs(e.Fragment,{children:[e.jsx(o,{title:"Games/SortNumbers/Flows"}),`
`,e.jsx(n.h1,{id:"sortnumbers--end-to-end-flows",children:"SortNumbers — End-to-End Flows"}),`
`,e.jsxs(n.blockquote,{children:[`
  `,e.jsxs(n.p,{children:["Source: ",e.jsx(n.code,{children:"src/games/sort-numbers/"})]}),`
  `,e.jsxs(n.p,{children:[`
    `,`SortNumbers migrated to the XState-first engine in PR 1b alongside
    the new `,e.jsx(n.code,{children:"levelComplete"}),` machine state. The canonical per-round phase
    machine is documented in
    `,e.jsx(n.code,{children:"src/lib/game-engine/GameEngine.flows.mdx"}),` §5 (NumberMatch) and §5c
    (SortNumbers, including `,e.jsx(n.code,{children:"levelComplete"}),`). This file covers
    SortNumbers-specific flows: numeral-ordering evaluation and the
    level-progression `,e.jsx(n.code,{children:"ADVANCE_LEVEL"}),` cycle. Update this file when
    SortNumbers progression logic, audio timing, or level-advance
    behaviour changes.
  `]}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"1-per-round-phase-machine-with-levelcomplete",children:"1. Per-round phase machine (with levelComplete)"}),`
`,e.jsxs(n.p,{children:[`
  `,"Identical to NumberMatch's phase machine plus a ",e.jsx(n.code,{children:"levelComplete"}),` state
  and an `,e.jsx(n.code,{children:"ADVANCE_LEVEL"})," event. See ",e.jsx(n.code,{children:"GameEngine.flows.mdx"}),` §5c for the
  canonical diagram and event list.
`]}),`
`,e.jsx(n.p,{children:"SortNumbers-specific notes:"}),`
`,e.jsxs(n.ul,{children:[`
  `,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"isLevelMode"})," is ",e.jsx(n.code,{children:"true"})," when the config declares a level mode."]}),`
  `,e.jsxs(n.li,{children:[`
    `,e.jsx(n.code,{children:"roundIndex"}),` accumulates across level boundaries in the engine
    context. The reducer mirror still resets `,e.jsx(n.code,{children:"roundIndex"}),` per level for
    HUD display. PR 1c will collapse the reducer; the HUD will then
    compute per-level round from `,e.jsx(n.code,{children:"engine.roundIndex % levelSize"}),`.
  `]}),`
  `,e.jsxs(n.li,{children:[`
    `,"The ",e.jsx(n.code,{children:"after(750)"})," transition out of ",e.jsx(n.code,{children:"roundComplete"}),` chooses
    `,e.jsx(n.code,{children:"gameOver"})," (last round), ",e.jsx(n.code,{children:"levelComplete"}),` (last round of a non-final
    level), or `,e.jsx(n.code,{children:"waitingForNext"})," (otherwise). Guards ",e.jsx(n.code,{children:"isLastRound"}),` /
    `,e.jsx(n.code,{children:"isLastRoundOfLevel"})," are injected by ",e.jsx(n.code,{children:"useGameEngine"}),`.
  `]}),`
  `,e.jsxs(n.li,{children:[`
    `,"Round and level construction (",e.jsx(n.code,{children:"buildSortRound"}),`) stays in
    `,e.jsx(n.code,{children:"SortNumbers.tsx"}),` per Spec Delta 4. The component dispatches
    `,e.jsx(n.code,{children:"INIT_ROUND"})," / ",e.jsx(n.code,{children:"ADVANCE_ROUND"})," / ",e.jsx(n.code,{children:"ADVANCE_LEVEL"}),` with the
    precomputed tiles + zones.
  `]}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"2-correct-tile-placement",children:"2. Correct tile placement"}),`
`,e.jsxs(n.p,{children:[`
  `,`Same flow as WordSpell — synchronous evaluation in
  `,e.jsx(n.code,{children:"useTileEvaluation"})," mirrored to the engine via ",e.jsx(n.code,{children:"engineDispatch"}),`. See
  `,e.jsx(n.code,{children:"WordSpell.flows.mdx"}),` §2 for the diagram. The only SortNumbers-specific
  detail is that tile values are numeric strings and zones are ordered.
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"3-round-complete--next-round",children:"3. Round complete → next round"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`stateDiagram-v2
  [*] --> playing
  playing --> roundComplete : always(allFilledCorrectly)
  roundComplete --> gameOver : after(750) [isLastRound]
  roundComplete --> levelComplete : after(750) [isLastRoundOfLevel]
  roundComplete --> waitingForNext : after(750)
  waitingForNext --> playing : ADVANCE_ROUND
`})}),`
`,e.jsxs(n.p,{children:[`
  `,"Round-advance is component-driven: a ",e.jsx(n.code,{children:"useEffect"}),` watches
  `,e.jsx(n.code,{children:"engine.phase === 'waitingForNext'"}),`, builds the next round via
  `,e.jsx(n.code,{children:"buildSortRound"}),", and dispatches ",e.jsx(n.code,{children:"ADVANCE_ROUND { tiles, zones }"}),`.
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"4-level-complete--next-level",children:"4. Level complete → next level"}),`
`,e.jsxs(n.p,{children:[`
  `,"When the after-timer fires ",e.jsx(n.code,{children:"levelComplete"}),`, the
  `,e.jsx(n.code,{children:"LevelCompleteOverlay"}),` mounts. Its "Next level" button is gated by a
  new `,e.jsx(n.code,{children:"nextLevelEnabled"}),` prop wired to
  `,e.jsx(n.code,{children:"engine.phase === 'levelComplete'"}),`. This closes a reducer-mirror race:
  the 750 ms after-timer advances reducer state synchronously while the
  engine remains in `,e.jsx(n.code,{children:"roundComplete"}),` until the timer fires. Without the
  prop gate, clicking during the race window would dispatch
  `,e.jsx(n.code,{children:"ADVANCE_LEVEL"}),` to a machine that ignores it.
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  actor User
  participant Engine as SortNumbers machine
  participant Audio as AudioFeedback
  participant Component as SortNumbersSession
  participant Overlay as LevelCompleteOverlay
  participant Reducer as answerGameReducer
  participant Bus as GameEventBus

  Engine-->>Engine: roundComplete + isLastRoundOfLevel → levelComplete
  Engine->>Audio: entry — playSound('level-complete')

  Note over Engine: phase === 'levelComplete'
  Engine-->>Overlay: showLevelComplete = true,\\n  nextLevelEnabled = true

  User->>Overlay: click Next Level
  Overlay->>Component: onNextLevel()
  Component->>Component: buildSortRound(nextLevelIndex)
  Component->>Reducer: ADVANCE_LEVEL { tiles, zones }
  Reducer-->>Engine: mirrored — incrementRoundIndex +\\n  incrementLevelIndex + advanceLevelState
  Engine->>Bus: emit game:level-advance
  Engine-->>Engine: transition → playing
`})}),`
`,e.jsxs(n.p,{children:[`
  `,"The ",e.jsx(n.code,{children:"game:level-advance"}),` event continues to fire — preserved from the
  pre-PR-1b implementation. The emit now lives on the engine's
  `,e.jsx(n.code,{children:"ADVANCE_LEVEL"})," handler rather than the component's ",e.jsx(n.code,{children:"handleNextLevel"}),`.
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"5-game-complete",children:"5. Game complete"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  participant Engine as SortNumbers machine
  participant Audio as AudioFeedback
  participant Bus as GameEventBus
  participant Overlay as GameOverOverlay

  Engine-->>Engine: roundComplete + isLastRound → gameOver
  Engine->>Audio: entry — playSound('game-complete')
  Engine->>Bus: completeGame — emit('game:end', envelope)
`})}),`
`,e.jsxs(n.p,{children:[`
  `,e.jsx(n.code,{children:"isLastRound"})," fires when ",e.jsx(n.code,{children:"roundIndex + 1 >= totalRounds"}),`. Because the
  engine accumulates `,e.jsx(n.code,{children:"roundIndex"}),` across level boundaries, the guard
  fires correctly on the final round of the final level. The reducer
  mirror's per-level reset is not consulted by the guard.
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"6-full-session-lifecycle",children:"6. Full session lifecycle"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`stateDiagram-v2
  [*] --> loading : SortNumbers mounts (sessionEpoch=0)
  loading --> playing : INIT_ROUND (fresh) or\\nRESUME_ROUND (draft)
  playing --> roundComplete : always(allFilledCorrectly)
  roundComplete --> gameOver : after(750) [isLastRound]
  roundComplete --> levelComplete : after(750) [isLastRoundOfLevel]
  roundComplete --> waitingForNext : after(750)
  levelComplete --> playing : ADVANCE_LEVEL
  waitingForNext --> playing : ADVANCE_ROUND
  gameOver --> loading : Play Again (sessionEpoch++)
  gameOver --> [*] : Home
`})}),`
`,e.jsxs(n.blockquote,{children:[`
  `,e.jsxs(n.p,{children:[`
    `,`Mid-celebration tab-close + resume no longer replays the celebration:
    `,e.jsx(n.code,{children:"useAnswerGameDraftSync.buildDraft"})," returns ",e.jsx(n.code,{children:"null"}),` during
    `,e.jsx(n.code,{children:"round-complete"})," / ",e.jsx(n.code,{children:"level-complete"})," / ",e.jsx(n.code,{children:"game-over"}),` reducer phases. See
    `,e.jsx(n.code,{children:"GameEngine.flows.mdx"}),` §4 (Draft State Sync).
  `]}),`
`]})]})}function p(r={}){const{wrapper:n}={...i(),...r.components};return n?e.jsx(n,{...r,children:e.jsx(l,{...r})}):l(r)}export{p as default};
