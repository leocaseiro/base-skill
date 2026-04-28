import{j as e}from"./iframe-D7gcozVq.js";import{u as t,M as d}from"./blocks-Dc_JAtZ9.js";import"./preload-helper-PPVm8Dsz.js";import"./index-QX3LX3IN.js";import"./index-CzWiqXVT.js";import"./index-QU82uLSk.js";import"./index-jzmzKZL3.js";import"./index-DrFu-skq.js";function s(r){const n={blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",h3:"h3",hr:"hr",p:"p",pre:"pre",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...t(),...r.components};return e.jsxs(e.Fragment,{children:[e.jsx(d,{title:"Games/word-spell/Flows"}),`
`,e.jsx(n.h1,{id:"wordspell--end-to-end-flows",children:"WordSpell — End-to-End Flows"}),`
`,e.jsxs(n.blockquote,{children:[`
  `,e.jsxs(n.p,{children:["Source: ",e.jsx(n.code,{children:"src/games/word-spell/"})]}),`
  `,e.jsxs(n.p,{children:[`
    `,`These diagrams show the full lifecycle of a WordSpell session, including sound
    effects, TTS, and UI feedback at each step. Update this file when the
    WordSpell progression logic or sound timing changes.
  `]}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"1-correct-tile-placement",children:"1. Correct Tile Placement"}),`
`,e.jsxs(n.p,{children:[`
  `,"User places the right letter in a slot. Sound fires ",e.jsx(n.strong,{children:"before"}),` the reducer
  dispatch so feedback is instant.
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  actor User
  participant TE as useTileEvaluation
  participant Audio as AudioFeedback
  participant Reducer as answerGameReducer
  participant Bus as GameEventBus
  participant Slot as useSlotBehavior (effect)

  User->>TE: click bank tile / press key
  TE->>TE: tile.value === zone.expectedValue? ✓
  TE->>Audio: playSound('correct', 0.8)
  Audio-->>Audio: interrupts current audio, plays immediately
  TE->>Reducer: PLACE_TILE { tileId, zoneIndex }
  Reducer-->>Reducer: zones[i].placedTileId = tileId
  Reducer-->>Reducer: zones[i].isWrong = false
  TE->>Bus: emit game:evaluate { correct: true }

  alt all zones now correct
    Reducer-->>Slot: phase → 'round-complete'
    Slot->>Slot: triggerPop animation on each slot
  else some zones still empty
    Reducer-->>Reducer: phase stays 'playing'
    Note over TE: useAutoNextSlot advances cursor to next empty slot
  end
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"2-wrong-tile-placement-lock-auto-eject",children:"2. Wrong Tile Placement (lock-auto-eject)"}),`
`,e.jsxs(n.p,{children:[`
  `,"WordSpell defaults to ",e.jsx(n.code,{children:"wrongTileBehavior: 'lock-auto-eject'"}),`. The tile is
  placed, marked wrong, shaken, and automatically ejected.
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  actor User
  participant TE as useTileEvaluation
  participant Audio as AudioFeedback
  participant Reducer as answerGameReducer
  participant Bus as GameEventBus
  participant Slot as useSlotBehavior (effect)

  User->>TE: click bank tile / press key
  TE->>TE: tile.value === zone.expectedValue? ✗
  TE->>Audio: playSound('wrong', 0.8)
  Audio-->>Audio: interrupts current audio, plays immediately
  TE->>Reducer: PLACE_TILE { tileId, zoneIndex }
  Reducer-->>Reducer: zones[i].placedTileId = tileId
  Reducer-->>Reducer: zones[i].isWrong = true, isLocked = true
  Reducer-->>Reducer: retryCount++
  TE->>Bus: emit game:evaluate { correct: false }

  Reducer-->>Slot: isWrong = true detected
  Slot->>Slot: triggerShake animation (immediate)
  Slot->>Slot: wait 350 ms
  Slot->>Slot: triggerEjectReturn animation
  Slot->>Slot: wait 1000 ms
  Slot->>Reducer: EJECT_TILE { zoneIndex }
  Reducer-->>Reducer: zones[i].placedTileId = null
  Reducer-->>Reducer: zones[i].isWrong = false, isLocked = false
  Reducer-->>Reducer: tile id returned to bankTileIds
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
`,e.jsx(n.h2,{id:"3-round-complete--next-round",children:"3. Round Complete → Next Round"}),`
`,e.jsxs(n.p,{children:[`
  `,`When all zones are filled correctly, the round-complete phase triggers a
  cascade: phase sound → confetti → delay → advance to next round → TTS
  announces the new word.
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  participant Reducer as answerGameReducer
  participant GS as useGameSounds
  participant Audio as AudioFeedback
  participant UI as ScoreAnimation (confetti)
  participant WS as WordSpellSession (effect)
  participant TTS as useRoundTTS

  Note over Reducer: last PLACE_TILE made all zones correct
  Reducer-->>GS: phase = 'round-complete'

  GS->>Audio: playSound('round-complete')
  Audio-->>Audio: interrupts queue, plays immediately
  GS->>GS: await microtask
  GS-->>UI: confettiReady = true
  UI->>UI: render confetti burst

  WS->>WS: phase === 'round-complete' && confettiReady
  WS->>WS: start 750 ms timer

  Note over WS: timer fires

  alt more rounds remain
    WS->>WS: build next round tiles/zones
    WS->>Reducer: ADVANCE_ROUND { tiles, zones }
    Reducer-->>Reducer: roundIndex++, zones/bankTileIds reset
    Reducer-->>GS: phase = 'playing'
    GS-->>UI: confettiReady = false

    TTS->>Audio: whenSoundEnds()
    Audio-->>TTS: queue drained
    TTS->>TTS: speak(nextWord) via Web Speech API
  else last round
    WS->>Reducer: COMPLETE_GAME
    Note over Reducer: see §4 Game Complete
  end
`})}),`
`,e.jsx(n.h3,{id:"timing-breakdown",children:"Timing breakdown"}),`
`,e.jsxs(n.table,{children:[`
  `,e.jsxs(n.thead,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.th,{children:"Offset"}),`
      `,e.jsx(n.th,{children:"Event"}),`
    `]}),`
  `]}),`
  `,e.jsxs(n.tbody,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"0 ms"}),`
      `,e.jsxs(n.td,{children:["Reducer sets ",e.jsx(n.code,{children:"phase = 'round-complete'"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"~0 ms"}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"playSound('round-complete')"})," fires"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"~1 ms"}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"confettiReady"})," flag set (microtask)"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"~1 ms"}),`
      `,e.jsx(n.td,{children:"Confetti animation starts rendering"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"750 ms"}),`
      `,e.jsxs(n.td,{children:["Timer fires → ",e.jsx(n.code,{children:"ADVANCE_ROUND"})," or ",e.jsx(n.code,{children:"COMPLETE_GAME"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:"~750+ ms"}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"whenSoundEnds()"})," resolves → TTS speaks the next word"]}),`
    `]}),`
  `]})]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"4-game-complete",children:"4. Game Complete"}),`
`,e.jsx(n.p,{children:"Dispatched when the last round finishes or when no more rounds exist."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`sequenceDiagram
  participant WS as WordSpellSession
  participant Reducer as answerGameReducer
  participant GS as useGameSounds
  participant Audio as AudioFeedback
  participant Overlay as GameOverOverlay

  WS->>Reducer: COMPLETE_GAME
  Reducer-->>Reducer: phase = 'game-over'
  Reducer-->>GS: phase change detected

  GS->>Audio: playSound('game-complete')
  GS->>GS: await microtask
  GS-->>Overlay: gameOverReady = true
  Overlay->>Overlay: render game-over screen
  Overlay->>Overlay: show retryCount, Play Again, Home buttons

  alt user taps Play Again
    Overlay->>WS: onRestartSession()
    WS->>WS: setSessionEpoch(e + 1)
    Note over WS: AnswerGame remounts with key={epoch}, fresh round order
  else user taps Home
    Overlay->>WS: navigate('/$locale')
  end
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"5-full-session-lifecycle-state-diagram",children:"5. Full Session Lifecycle (state diagram)"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`stateDiagram-v2
  [*] --> loading : WordSpell mounts
  loading --> playing : fresh session →\\nINIT_ROUND dispatched
  loading --> playing : resumed session →\\nRESUME_ROUND dispatched\\n(preserves roundIndex,\\nretryCount, levelIndex)
  loading --> playing : stale-draft safety net →\\ndraft discarded,\\nINIT_ROUND dispatched

  playing --> round_complete : all zones correct
  playing --> playing : wrong tile placed\\n(auto-eject returns tile)

  round_complete --> playing : ADVANCE_ROUND\\n(more rounds, 750 ms delay)
  round_complete --> game_over : COMPLETE_GAME\\n(last round)

  game_over --> loading : Play Again\\n(sessionEpoch++)
  game_over --> [*] : Home
`})}),`
`,e.jsxs(n.blockquote,{children:[`
  `,e.jsxs(n.p,{children:[`
    `,"See ",e.jsx(n.code,{children:"AnswerGame.flows.mdx"}),` §9 for the full mount-effect decision tree
    (`,e.jsx(n.code,{children:"RESUME_ROUND"})," vs ",e.jsx(n.code,{children:"INIT_ROUND"}),`). The stale-draft safety net lives in
    `,e.jsx(n.code,{children:"WordSpell.tsx:435-474"}),` — it detects a draft whose letters can't align
    with the current round and null-patches `,e.jsx(n.code,{children:"draftState"}),` before the provider
    sees it, so the resume path falls back to `,e.jsx(n.code,{children:"INIT_ROUND"}),`.
  `]}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"6-sound-and-tts-pipeline",children:"6. Sound and TTS Pipeline"}),`
`,e.jsxs(n.p,{children:[`
  `,"All game sounds flow through ",e.jsx(n.code,{children:"AudioFeedback.ts"}),`. TTS waits for the audio
  queue to drain before speaking.
`]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-mermaid",children:`flowchart LR
  subgraph "Tile feedback (instant)"
    A["useTileEvaluation"] -->|"playSound('correct'/'wrong')"| B["AudioFeedback\\n(interrupts queue)"]
  end

  subgraph "Phase sounds (on transition)"
    C["useGameSounds"] -->|"playSound('round-complete')\\nplaySound('level-complete')\\nplaySound('game-complete')"| B
  end

  subgraph "TTS (after sounds)"
    D["useRoundTTS"] -->|"whenSoundEnds()"| B
    B -->|"queue drained"| E["useGameTTS.speakPrompt()\\nWeb Speech API"]
  end
`})}),`
`,e.jsx(n.h3,{id:"audiofeedback-api",children:"AudioFeedback API"}),`
`,e.jsxs(n.table,{children:[`
  `,e.jsxs(n.thead,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.th,{children:"Function"}),`
      `,e.jsx(n.th,{children:"Behavior"}),`
      `,e.jsx(n.th,{children:"Use case"}),`
    `]}),`
  `]}),`
  `,e.jsxs(n.tbody,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"playSound()"})}),`
      `,e.jsx(n.td,{children:"Interrupts current audio + resets queue"}),`
      `,e.jsx(n.td,{children:"Tile correct/wrong sounds"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"queueSound()"})}),`
      `,e.jsxs(n.td,{children:["Appends to queue; resolves when sound ",e.jsx(n.strong,{children:"starts"})]}),`
      `,e.jsx(n.td,{children:"Phase transition sounds"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"whenSoundEnds()"})}),`
      `,e.jsx(n.td,{children:"Resolves when entire queue (current + pending) ends"}),`
      `,e.jsx(n.td,{children:"TTS delay"}),`
    `]}),`
  `]})]}),`
`,e.jsxs(n.blockquote,{children:[`
  `,e.jsxs(n.p,{children:[`
    `,e.jsx(n.strong,{children:"Note:"})," ",e.jsx(n.code,{children:"useGameSounds"})," currently uses ",e.jsx(n.code,{children:"playSound()"}),` (interrupt), not
    `,e.jsx(n.code,{children:"queueSound()"}),`. This means a rapid correct tile + round-complete can cut off
    the tile sound. This is intentional — the phase sound takes priority.
  `]}),`
`]})]})}function m(r={}){const{wrapper:n}={...t(),...r.components};return n?e.jsx(n,{...r,children:e.jsx(s,{...r})}):s(r)}export{m as default};
