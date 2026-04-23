import{j as e}from"./iframe-CK0reiD2.js";import{u as s,M as o}from"./blocks-C6KSmPyT.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CrWIofur.js";import"./index-Bjaik4B1.js";import"./index-DXuqrgNt.js";import"./index-FtOsSD69.js";import"./index-DrFu-skq.js";function t(r){const n={blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",h3:"h3",hr:"hr",p:"p",pre:"pre",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...s(),...r.components};return e.jsxs(e.Fragment,{children:[e.jsx(o,{title:"answer-game/Flows"}),`
`,e.jsx(n.h1,{id:"answergame--event-flows",children:"AnswerGame — Event Flows"}),`
`,e.jsxs(n.blockquote,{children:[`
  `,e.jsxs(n.p,{children:["Source: ",e.jsx(n.code,{children:"src/components/answer-game/"})]}),`
  `,e.jsxs(n.p,{children:[`
    `,`Each diagram shows the sequence of dispatches and effects triggered by a user action.
    Update this file when adding new dispatch chains or changing existing ones.
    Run `,e.jsx(n.code,{children:"/update-architecture-docs"}),` for guided update prompts.
  `]}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"1-tile-placement",children:"1. Tile Placement"}),`
`,e.jsx(n.p,{children:"Bank tile click/tap or keyboard character press."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  actor User
  participant Hook as useTileEvaluation
  participant Reducer as answerGameReducer
  participant Effect as useSlotBehavior (effect)

  User->>Hook: click bank tile / press key
  Hook->>Reducer: PLACE_TILE { tileId, zoneIndex }
  Reducer-->>Reducer: move tile from bankTileIds → zones[zoneIndex].placedTileId
  Reducer-->>Reducer: evaluate: all zones correct?
  alt all zones correct
    Reducer-->>Effect: phase = 'round-complete'
    Effect->>Effect: triggerPop animation
  else mismatch (wrongTileBehavior = 'reject')
    Reducer-->>Reducer: tile not placed, bankTileIds unchanged
  else mismatch (wrongTileBehavior = 'lock-manual' or 'lock-auto-eject')
    Reducer-->>Reducer: zones[zoneIndex].isWrong = true, isLocked = true
    Effect->>Effect: triggerShake animation
  end
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"2-wrong-tile-auto-eject",children:"2. Wrong Tile Auto-Eject"}),`
`,e.jsxs(n.p,{children:["Only when ",e.jsx(n.code,{children:"config.wrongTileBehavior === 'lock-auto-eject'"}),"."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  participant Reducer as answerGameReducer
  participant Effect as useSlotBehavior (effect)

  Reducer-->>Effect: zones[zoneIndex].isWrong = true
  Effect->>Effect: triggerShake animation (immediate)
  Effect->>Effect: wait 350ms
  Effect->>Effect: triggerEjectReturn animation
  Effect->>Effect: wait 1000ms
  Effect->>Reducer: EJECT_TILE { zoneIndex }
  Reducer-->>Reducer: zones[zoneIndex].placedTileId = null, isWrong = false, isLocked = false
  Reducer-->>Reducer: tile id returned to bankTileIds
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"3-drag-and-drop",children:"3. Drag and Drop"}),`
`,e.jsx(n.p,{children:"Dragging a bank tile or slot tile onto a slot."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`flowchart TD
  A([User starts drag]) --> B[SET_DRAG_ACTIVE tileId]
  B --> C{Drag over slot?}
  C -- enter --> D[SET_DRAG_HOVER zoneIndex]
  C -- leave --> E[SET_DRAG_HOVER null]
  D --> F{Drop?}
  F -- bank tile on empty slot --> G[PLACE_TILE tileId zoneIndex]
  F -- bank tile on occupied slot --> H[SWAP_TILES or PLACE_TILE]
  F -- slot tile on slot --> I[SWAP_TILES fromZone toZone]
  F -- slot tile on bank tile hole --> J[SWAP_SLOT_BANK zoneIndex bankTileId]
  F -- slot tile on bank container --> K[REMOVE_TILE zoneIndex]
  G & H & I & J & K --> L[SET_DRAG_ACTIVE null]
  L --> M[SET_DRAG_HOVER null]
`})}),`
`,e.jsx(n.p,{children:e.jsx(n.strong,{children:"Drag-over bank tile (slot tile being dragged):"})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  participant Hook as useSlotTileDrag
  participant Reducer as answerGameReducer

  Hook->>Reducer: SET_DRAG_HOVER_BANK { tileId: bankTileId }
  Note over Hook,Reducer: bank tile shows "hole" preview
  Hook->>Reducer: drop → SWAP_SLOT_BANK { zoneIndex, bankTileId }
  Hook->>Reducer: SET_DRAG_HOVER_BANK { tileId: null }
  Hook->>Reducer: SET_DRAG_ACTIVE { tileId: null }
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"4-keyboard-and-touch-input",children:"4. Keyboard and Touch Input"}),`
`,e.jsxs(n.p,{children:["Desktop keyboard (",e.jsx(n.code,{children:"useKeyboardInput"}),") and mobile hidden input (",e.jsx(n.code,{children:"useTouchKeyboardInput"}),")."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  actor User
  participant KI as useKeyboardInput (global keydown)
  participant TE as useTileEvaluation
  participant Reducer as answerGameReducer

  User->>KI: ArrowLeft / ArrowRight
  KI->>Reducer: SET_ACTIVE_SLOT { zoneIndex: next }

  User->>KI: Backspace / Delete
  KI->>KI: find last filled slot ≤ activeSlotIndex
  KI->>Reducer: REMOVE_TILE { zoneIndex: i }

  User->>KI: printable character
  KI->>KI: find matching tile in bank?
  alt tile found in bank
    KI->>TE: placeTile(matchingTile.id, activeSlotIndex)
    TE->>Reducer: PLACE_TILE { tileId, zoneIndex }
  else no match
    KI->>TE: typeTile(char, activeSlotIndex)
    TE->>Reducer: TYPE_TILE { tileId: "typed-{id}", value: char, zoneIndex }
  end
`})}),`
`,e.jsxs(n.p,{children:[`
  `,"Touch keyboard follows the same path via ",e.jsx(n.code,{children:"useTouchKeyboardInput"}),`, using the hidden
  `,e.jsx(n.code,{children:"<input>"})," element's ",e.jsx(n.code,{children:"input"})," event instead of global ",e.jsx(n.code,{children:"keydown"}),`.
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"5-level-progression-sortnumbers-only",children:"5. Level Progression (SortNumbers only)"}),`
`,e.jsxs(n.p,{children:["Only when ",e.jsx(n.code,{children:"config.levelMode"})," is configured."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`stateDiagram-v2
  [*] --> playing

  playing --> round_complete : all zones correct
  round_complete --> playing : ADVANCE_ROUND\\n(more rounds in level)
  round_complete --> level_complete : ADVANCE_ROUND\\n(last round in level)
  level_complete --> playing : ADVANCE_LEVEL\\n(user clicks Next Level)
  level_complete --> game_over : COMPLETE_GAME\\n(generateNextLevel returns null\\nor maxLevels reached)
  playing --> game_over : COMPLETE_GAME\\n(no levelMode + last round)
`})}),`
`,e.jsx(n.p,{children:e.jsx(n.strong,{children:"Dispatch sequence for level transition:"})}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  participant Component as SortNumbers
  participant Reducer as answerGameReducer

  Component->>Component: phase = 'level-complete' detected
  Component->>Component: user taps "Next Level"
  Component->>Component: config.levelMode.generateNextLevel(levelIndex)
  alt returns { tiles, zones }
    Component->>Reducer: ADVANCE_LEVEL { tiles, zones }
    Reducer-->>Reducer: levelIndex++, roundIndex = 0
  else returns null
    Component->>Reducer: COMPLETE_GAME
    Reducer-->>Reducer: phase = 'game-over'
  end
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"6-hud-auto-mount",children:"6. HUD Auto-Mount"}),`
`,e.jsxs(n.p,{children:[`
  `,e.jsx(n.code,{children:"AnswerGame"})," renders a ",e.jsx(n.code,{children:"ProgressHUDRoot"}),` as the first child of its outer
  flex container every time a session mounts. No per-game wiring is
  required.
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  participant Game as WordSpell / NumberMatch / SortNumbers
  participant AG as AnswerGame
  participant Root as ProgressHUDRoot
  participant Ctx as AnswerGameStateContext
  participant HUD as ProgressHUD (default or skin.ProgressHUD)

  Game->>AG: render <AnswerGame config skin>
  AG->>Root: mount as first child
  Root->>Ctx: read config, phase, roundIndex, levelIndex, isLevelMode
  Root->>Root: resolveHudFlags(config.hud, isLevelMode)
  alt skin.ProgressHUD defined
    Root->>HUD: render skin.ProgressHUD with resolved props
  else default
    Root->>HUD: render built-in ProgressHUD with resolved props
  end
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"7-custom-game-delete",children:"7. Custom Game Delete"}),`
`,e.jsxs(n.p,{children:["User deletes the current custom game from the ",e.jsx(n.code,{children:"InstructionsOverlay"})," settings cog."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  actor User
  participant GameBody as GameBody ($gameId.tsx)
  participant IO as InstructionsOverlay
  participant ACM as AdvancedConfigModal
  participant Hook as useCustomGames
  participant DB as custom_games (RxDB)
  participant Nav as useNavigate

  User->>IO: click cog (Configure)
  IO->>ACM: open modal (mode = customGame)
  User->>ACM: click Delete
  ACM->>ACM: open confirmation dialog
  User->>ACM: click Delete (confirm)
  ACM->>IO: call onDeleteCustomGame(configId)
  IO->>GameBody: onDeleteCustomGame(configId) [prop callback into $gameId.tsx]
  GameBody->>Hook: remove(id)
  Hook->>DB: doc.remove()
  GameBody->>Nav: navigate({ search: prev => ({ ...prev, configId: undefined }) })
  ACM->>ACM: close confirmation dialog + modal
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"8-round-progression",children:"8. Round Progression"}),`
`,e.jsxs(n.blockquote,{children:[`
  `,e.jsxs(n.p,{children:[`
    `,e.jsx(n.strong,{children:"Status: planned — not yet fully implemented."}),`
    The phase transition to `,e.jsx(n.code,{children:"'round-complete'"}),` is implemented. The 750ms delay before
    `,e.jsx(n.code,{children:"ADVANCE_ROUND"})," is implemented in ",e.jsx(n.code,{children:"WordSpell"}),", ",e.jsx(n.code,{children:"NumberMatch"}),", and ",e.jsx(n.code,{children:"SortNumbers"}),`.
    A shared round-progression hook is not yet extracted.
  `]}),`
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  participant Reducer as answerGameReducer
  participant Component as WordSpell / NumberMatch / SortNumbers
  participant Sound as sound system

  Reducer-->>Component: phase = 'round-complete'
  Component->>Component: wait for sound ready signal
  Component->>Component: wait 750ms (confetti animation)
  alt more rounds remain
    Component->>Reducer: ADVANCE_ROUND { tiles, zones }
    Reducer-->>Reducer: roundIndex++, zones cleared, bankTileIds reset
  else last round
    Component->>Reducer: COMPLETE_GAME
    Reducer-->>Reducer: phase = 'game-over'
  end
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"9-session-resume-fresh-mount-vs-draft-restore",children:"9. Session Resume (fresh mount vs. draft restore)"}),`
`,e.jsxs(n.p,{children:[`
  `,e.jsx(n.code,{children:"AnswerGameProvider"}),`'s mount effect routes every lifecycle change through
  the reducer. On mount, and whenever `,e.jsx(n.code,{children:"initialState"})," or ",e.jsx(n.code,{children:"config.initialTiles/Zones"}),`
  change, exactly one of `,e.jsx(n.code,{children:"RESUME_ROUND"})," or ",e.jsx(n.code,{children:"INIT_ROUND"}),` is dispatched.
`]}),`
`,e.jsxs(n.p,{children:[`
  `,e.jsx(n.code,{children:"RESUME_ROUND"})," preserves draft progress (",e.jsx(n.code,{children:"roundIndex"}),", ",e.jsx(n.code,{children:"retryCount"}),`,
  `,e.jsx(n.code,{children:"levelIndex"}),`), so a resumed mid-round session never resets to round 0 —
  that was the pre-#139 failure mode the early-return guard was masking.
`]}),`
`,e.jsxs(n.p,{children:[`
  `,e.jsx(n.code,{children:"useAnswerGameDraftSync"}),` runs in parallel: it writes every state change
  back to `,e.jsx(n.code,{children:"session_history_index.draftState"}),` (debounced 500 ms) so the
  next mount has a fresh draft to hand to `,e.jsx(n.code,{children:"RESUME_ROUND"}),`.
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`flowchart TD
  Mount([AnswerGameProvider mounts or props change]) --> HasDraft{initialState present?}

  HasDraft -- yes --> Resume["dispatch RESUME_ROUND { draft }"]
  Resume --> RState["reducer: restore allTiles, bankTileIds,\\nzones, activeSlotIndex, phase,\\nroundIndex, retryCount, levelIndex"]
  RState --> RClear["clear dragActiveTileId,\\ndragHoverZoneIndex, dragHoverBankTileId"]

  HasDraft -- no --> HasTiles{config.initialTiles\\n+ initialZones set?}
  HasTiles -- yes --> Init["dispatch INIT_ROUND { tiles, zones }"]
  HasTiles -- no --> Noop([no-op: state already makeInitialState])
  Init --> IState["reducer: populate round state,\\nreset roundIndex/retryCount/levelIndex to 0"]

  RClear --> Sync
  IState --> Sync
  Sync["useAnswerGameDraftSync\\n(debounce 500 ms)"] --> DB[("session_history_index.draftState")]
`})}),`
`,e.jsx(n.h3,{id:"when-each-action-fires",children:"When each action fires"}),`
`,e.jsxs(n.table,{children:[`
  `,e.jsxs(n.thead,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.th,{children:"Situation"}),`
      `,e.jsx(n.th,{children:"Dispatched action"}),`
      `,e.jsx(n.th,{children:"Reducer behavior"}),`
    `]}),`
  `]}),`
  `,e.jsxs(n.tbody,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"First visit to a game (no persisted session)"}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"INIT_ROUND"})}),`
      `,e.jsx(n.td,{children:"Populate tiles/zones from config; reset progress counters to 0"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"Reload mid-game with an aligned draft"}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"RESUME_ROUND"})}),`
      `,e.jsxs(n.td,{children:["Restore the draft snapshot wholesale; keep ",e.jsx(n.code,{children:"config"}),"; clear drag state"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"Reload with a stale draft (WordSpell safety net drops the draft)"}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"INIT_ROUND"})}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"WordSpell.tsx"})," sets ",e.jsx(n.code,{children:"initialState={undefined}"})," when ",e.jsx(n.code,{children:"staleDraft"})," is true; provider sees no draft"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsxs(n.td,{children:["Mid-mount ",e.jsx(n.code,{children:"initialState"})," change (e.g. draft written by a sibling)"]}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"RESUME_ROUND"})}),`
      `,e.jsx(n.td,{children:"Effect re-runs; draft flows into reducer without remounting"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsxs(n.td,{children:["Mid-mount ",e.jsx(n.code,{children:"config.initialTiles"})," change (no draft)"]}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"INIT_ROUND"})}),`
      `,e.jsx(n.td,{children:"Effect re-runs; new tiles populate the round"}),`
    `]}),`
  `]})]}),`
`,e.jsxs(n.p,{children:[`
  `,"The split exists so ",e.jsx(n.code,{children:"INIT_ROUND"}),`'s original "reset progress to 0" semantics
  stay intact while resumed sessions get a dedicated action that cannot
  accidentally drop `,e.jsx(n.code,{children:"roundIndex"}),", ",e.jsx(n.code,{children:"retryCount"}),", or ",e.jsx(n.code,{children:"levelIndex"}),`.
`]})]})}function m(r={}){const{wrapper:n}={...s(),...r.components};return n?e.jsx(n,{...r,children:e.jsx(t,{...r})}):t(r)}export{m as default};
