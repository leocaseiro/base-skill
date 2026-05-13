import{j as e}from"./iframe-CWe-G7nS.js";import{u as s,M as o}from"./blocks-DhSvdT7C.js";import"./preload-helper-PPVm8Dsz.js";import"./index-B_V7hSDc.js";import"./index-C-fRf3XN.js";import"./index-CP21tCso.js";import"./index-BGv55Kg3.js";import"./index-DrFu-skq.js";function i(r){const n={blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",h3:"h3",hr:"hr",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...s(),...r.components};return e.jsxs(e.Fragment,{children:[e.jsx(o,{title:"Games/WordSpell/Flows"}),`
`,e.jsx(n.h1,{id:"wordspell--end-to-end-flows",children:"WordSpell — End-to-End Flows"}),`
`,e.jsxs(n.blockquote,{children:[`
  `,e.jsxs(n.p,{children:["Source: ",e.jsx(n.code,{children:"src/games/word-spell/"})]}),`
  `,e.jsxs(n.p,{children:[`
    `,`WordSpell migrated to the XState-first engine in PR 1b. The canonical
    per-round phase machine is documented in
    `,e.jsx(n.code,{children:"src/lib/game-engine/GameEngine.flows.mdx"}),` §5 (NumberMatch) and §5b
    (WordSpell). This file covers WordSpell-specific flows: letter-to-slot
    evaluation, wrong-tile-behavior modes, and the sentence-gap free-swap
    mode. Update this file when WordSpell progression logic, audio timing,
    or sentence-gap interaction changes.
  `]}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"1-per-round-phase-machine",children:"1. Per-round phase machine"}),`
`,e.jsxs(n.p,{children:[`
  `,"Identical to NumberMatch — same states (",e.jsx(n.code,{children:"playing"}),", ",e.jsx(n.code,{children:"roundComplete"}),`,
  `,e.jsx(n.code,{children:"waitingForNext"}),", ",e.jsx(n.code,{children:"gameOver"}),`), same events. See
  `,e.jsx(n.code,{children:"GameEngine.flows.mdx"}),` §5b for the diagram and full event list.
`]}),`
`,e.jsx(n.p,{children:"WordSpell-specific notes:"}),`
`,e.jsxs(n.ul,{children:[`
  `,e.jsxs(n.li,{children:[`
    `,e.jsx(n.code,{children:"isLevelMode"})," is always ",e.jsx(n.code,{children:"false"}),"; ",e.jsx(n.code,{children:"levelIndex"}),` is unused at runtime
    and the machine never enters `,e.jsx(n.code,{children:"levelComplete"}),`.
  `]}),`
  `,e.jsxs(n.li,{children:[`
    `,e.jsx(n.code,{children:"slotInteraction"})," is mode-driven: ",e.jsx(n.code,{children:"'sentence-gap'"}),` →
    `,e.jsx(n.code,{children:"'free-swap'"}),"; every other mode → ",e.jsx(n.code,{children:"'ordered'"}),`. The machine itself
    does not branch on the value — it is forwarded to
    `,e.jsx(n.code,{children:"AnswerGameConfig"})," so ",e.jsx(n.code,{children:"Slot"})," rendering and ",e.jsx(n.code,{children:"useSlotBehavior"}),` handle
    the swap UX.
  `]}),`
  `,e.jsxs(n.li,{children:[`
    `,"Round construction (",e.jsx(n.code,{children:"buildSentenceGapRound"}),` and
    `,e.jsx(n.code,{children:"buildTilesAndZones"}),") stays in ",e.jsx(n.code,{children:"WordSpell.tsx"}),` per Spec Delta 4.
    The component dispatches `,e.jsx(n.code,{children:"INIT_ROUND"})," / ",e.jsx(n.code,{children:"ADVANCE_ROUND"}),` with the
    precomputed tiles + zones.
  `]}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"2-correct-tile-placement",children:"2. Correct tile placement"}),`
`,e.jsxs(n.p,{children:[`
  `,"Synchronous evaluation in ",e.jsx(n.code,{children:"useTileEvaluation"}),` — the audio fires
  before the dispatch so feedback feels instant.
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  actor User
  participant TE as useTileEvaluation
  participant Audio as AudioFeedback
  participant Reducer as answerGameReducer
  participant Engine as WordSpell machine
  participant Bus as GameEventBus
  participant Slot as useSlotBehavior

  User->>TE: click bank tile / press key
  TE->>TE: tile.value === zone.expectedValue? ✓
  TE->>Audio: playSound('correct', 0.8)
  TE->>Reducer: PLACE_TILE { tileId, zoneIndex }
  Reducer-->>Engine: mirrored via engineDispatch
  Engine-->>Engine: assign placeTile + always(allFilledCorrectly)
  TE->>Bus: emit game:evaluate { correct: true }

  alt all zones now correct
    Engine-->>Engine: transition → roundComplete
    Engine->>Audio: entry — playSound('round-complete')
  else some zones still empty
    Engine-->>Engine: stays in playing
    Note over TE: useAutoNextSlot advances the cursor
  end
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"3-wrong-tile-placement-lock-auto-eject-default",children:"3. Wrong tile placement (lock-auto-eject default)"}),`
`,e.jsxs(n.p,{children:[`
  `,"WordSpell defaults to ",e.jsx(n.code,{children:"wrongTileBehavior: 'lock-auto-eject'"}),`. The tile
  is marked wrong, shaken, and automatically ejected after a short
  delay.
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  actor User
  participant TE as useTileEvaluation
  participant Audio as AudioFeedback
  participant Reducer as answerGameReducer
  participant Engine as WordSpell machine
  participant Slot as useSlotBehavior

  User->>TE: click bank tile / press key
  TE->>TE: tile.value === zone.expectedValue? ✗
  TE->>Audio: playSound('wrong', 0.8)
  TE->>Reducer: PLACE_TILE { tileId, zoneIndex }
  Reducer-->>Engine: mirrored — zones[i] isWrong+isLocked, retryCount++

  Reducer-->>Slot: isWrong detected
  Slot->>Slot: triggerShake (immediate)
  Slot->>Slot: wait 350 ms
  Slot->>Slot: triggerEjectReturn
  Slot->>Slot: wait 1000 ms
  Slot->>Reducer: EJECT_TILE
  Reducer-->>Engine: mirrored — clears zone, returns to bank
`})}),`
`,e.jsx(n.h3,{id:"other-wrong-tile-modes",children:"Other wrong-tile modes"}),`
`,e.jsxs(n.table,{children:[`
  `,e.jsxs(n.thead,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.th,{children:"Mode"}),`
      `,e.jsx(n.th,{children:"Behavior after wrong placement"}),`
    `]}),`
  `]}),`
  `,e.jsxs(n.tbody,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"reject"})}),`
      `,e.jsx(n.td,{children:"Tile bounces back immediately; never enters the slot"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"lock-manual"})}),`
      `,e.jsx(n.td,{children:"Tile stays in slot marked wrong; user clicks to remove"}),`
    `]}),`
  `]})]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"4-round-complete--next-round",children:"4. Round complete → next round"}),`
`,e.jsxs(n.p,{children:[`
  `,"The engine drives this entirely. No more ",e.jsx(n.code,{children:"useGameSounds"}),`, no
  microtask-deferred `,e.jsx(n.code,{children:"confettiReady"}),` flag — the machine fires sounds
  from `,e.jsx(n.code,{children:"entry"}),` actions and the overlay gates on
  `,e.jsx(n.code,{children:"engine.phase === 'roundComplete'"}),`.
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`stateDiagram-v2
  [*] --> playing
  playing --> roundComplete : always(allFilledCorrectly)
  roundComplete --> gameOver : after(750) [isLastRound]
  roundComplete --> waitingForNext : after(750)
  waitingForNext --> playing : ADVANCE_ROUND
`})}),`
`,e.jsxs(n.p,{children:[`
  `,"Round-advance is component-driven: a ",e.jsx(n.code,{children:"useEffect"}),` watches
  `,e.jsx(n.code,{children:"engine.phase === 'waitingForNext'"}),`, builds the next round's tiles +
  zones via `,e.jsx(n.code,{children:"buildSentenceGapRound"})," / ",e.jsx(n.code,{children:"buildTilesAndZones"}),`, and
  dispatches `,e.jsx(n.code,{children:"ADVANCE_ROUND { tiles, zones }"}),` via the reducer (mirrored
  to engine).
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"5-game-complete",children:"5. Game complete"}),`
`,e.jsxs(n.p,{children:[`
  `,"Triggered by the ",e.jsx(n.code,{children:"after(750)"})," transition out of ",e.jsx(n.code,{children:"roundComplete"}),` when
  `,e.jsx(n.code,{children:"isLastRound"}),` is true.
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  participant Engine as WordSpell machine
  participant Audio as AudioFeedback
  participant Bus as GameEventBus
  participant Overlay as GameOverOverlay

  Engine-->>Engine: roundComplete + isLastRound → gameOver
  Engine->>Audio: entry — playSound('game-complete')
  Engine->>Bus: completeGame — emit('game:end', envelope)

  Note over Engine: phase === 'gameOver'
  Engine-->>Overlay: WordSpellInstance renders\\n  <GameOverOverlay /> gated on engine.phase

  alt user taps Play Again
    Overlay->>WordSpellInstance: onRestartSession()
    WordSpellInstance->>WordSpellInstance: setSessionEpoch(e + 1)
    Note over WordSpellInstance: actor remounts via key={sessionEpoch}
  else user taps Home
    Overlay->>WordSpellInstance: navigate('/$locale')
  end
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"6-sentence-gap-free-swap-mode",children:"6. Sentence-gap free-swap mode"}),`
`,e.jsxs(n.p,{children:[`
  `,"In ",e.jsx(n.code,{children:"sentence-gap"}),` mode WordSpell uses
  `,e.jsx(n.code,{children:"slotInteraction: 'free-swap'"}),` — the user can rearrange tiles between
  filled slots without clearing them first.
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  actor User
  participant Slot as Slot (drag handler)
  participant Reducer as answerGameReducer
  participant Engine as WordSpell machine

  User->>Slot: drag tile from zone A → zone B (both filled)
  Slot->>Reducer: SWAP_TILES { fromZoneIndex, toZoneIndex }
  Reducer-->>Engine: mirrored — swap tile ids between zones
  Note over Engine: always(allFilledCorrectly) re-evaluates
`})}),`
`,e.jsxs(n.p,{children:[`
  `,`For ordered modes (single-word, etc.), drops onto a filled zone are
  rejected by `,e.jsx(n.code,{children:"Slot"}),"'s drop handler — ",e.jsx(n.code,{children:"SWAP_TILES"}),` never fires.
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"7-full-session-lifecycle",children:"7. Full session lifecycle"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`stateDiagram-v2
  [*] --> loading : WordSpell mounts (sessionEpoch=0)
  loading --> playing : INIT_ROUND (fresh) or\\nRESUME_ROUND (draft)
  playing --> roundComplete : always(allFilledCorrectly)
  roundComplete --> gameOver : after(750) [isLastRound]
  roundComplete --> waitingForNext : after(750)
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
`]})]})}function m(r={}){const{wrapper:n}={...s(),...r.components};return n?e.jsx(n,{...r,children:e.jsx(i,{...r})}):i(r)}export{m as default};
