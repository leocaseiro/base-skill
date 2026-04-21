import{j as e}from"./iframe-Bh2nVCMs.js";import{u as a,M as t}from"./blocks-BOixuJBo.js";import"./preload-helper-PPVm8Dsz.js";import"./index-BfJ4OZfw.js";import"./index-POS1z8_U.js";import"./index-BGDalHPA.js";import"./index-cJCqS7oj.js";import"./index-DrFu-skq.js";function o(r){const n={blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",hr:"hr",p:"p",pre:"pre",strong:"strong",...a(),...r.components};return e.jsxs(e.Fragment,{children:[e.jsx(t,{title:"answer-game/Flows"}),`
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
`})})]})}function h(r={}){const{wrapper:n}={...a(),...r.components};return n?e.jsx(n,{...r,children:e.jsx(o,{...r})}):o(r)}export{h as default};
