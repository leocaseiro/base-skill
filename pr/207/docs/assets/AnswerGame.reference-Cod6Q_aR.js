import{j as e}from"./iframe-RsQMNq_6.js";import{u as r,M as c}from"./blocks-CpDVJIeM.js";import"./preload-helper-PPVm8Dsz.js";import"./index-QIJWhZXw.js";import"./index-TFZ4cniL.js";import"./index-CBh3SskJ.js";import"./index-zQyVyKWX.js";import"./index-DrFu-skq.js";function s(d){const n={blockquote:"blockquote",code:"code",h1:"h1",h2:"h2",h3:"h3",hr:"hr",li:"li",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...r(),...d.components};return e.jsxs(e.Fragment,{children:[e.jsx(c,{title:"answer-game/Reference"}),`
`,e.jsx(n.h1,{id:"answergame--reference",children:"AnswerGame — Reference"}),`
`,e.jsxs(n.blockquote,{children:[`
  `,e.jsxs(n.p,{children:["Source: ",e.jsx(n.code,{children:"src/components/answer-game/"})]}),`
  `,e.jsxs(n.p,{children:[`
    `,`Audience: developers and AI agents modifying game state logic.
    Update this file whenever the reducer, hooks, or context API change.
    Run `,e.jsx(n.code,{children:"/update-architecture-docs"}),` for guided update prompts.
  `]}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"state-shape",children:"State Shape"}),`
`,e.jsxs(n.p,{children:["Defined in ",e.jsx(n.code,{children:"src/components/answer-game/types.ts"}),"."]}),`
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
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"config"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"AnswerGameConfig"})}),`
      `,e.jsx(n.td,{children:"Game configuration (immutable during play)"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"allTiles"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"TileItem[]"})}),`
      `,e.jsx(n.td,{children:"All tiles for the current round — never mutated mid-round"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"bankTileIds"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"string[]"})}),`
      `,e.jsx(n.td,{children:"IDs of tiles currently visible in the choice bank"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"zones"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"AnswerZone[]"})}),`
      `,e.jsxs(n.td,{children:["Slot definitions — contains ",e.jsx(n.code,{children:"placedTileId"}),", ",e.jsx(n.code,{children:"isWrong"}),", ",e.jsx(n.code,{children:"isLocked"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"activeSlotIndex"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsx(n.td,{children:"Cursor position for auto-next-slot mode (ordered input)"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"dragActiveTileId"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"string | null"})}),`
      `,e.jsx(n.td,{children:"ID of the tile currently being dragged"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"dragHoverZoneIndex"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number | null"})}),`
      `,e.jsx(n.td,{children:"Zone index being hovered during a drag"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"dragHoverBankTileId"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"string | null"})}),`
      `,e.jsx(n.td,{children:"Bank tile hole being hovered by a dragged slot tile"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"phase"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"AnswerGamePhase"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"'playing' | 'round-complete' | 'level-complete' | 'game-over'"})}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"roundIndex"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsx(n.td,{children:"Current round (0-based)"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"retryCount"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsx(n.td,{children:"Wrong placements in the current round"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"levelIndex"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"number"})}),`
      `,e.jsxs(n.td,{children:["Current level (only used when ",e.jsx(n.code,{children:"config.levelMode"})," is set)"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"isLevelMode"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"boolean"})}),`
      `,e.jsxs(n.td,{children:["Whether ",e.jsx(n.code,{children:"config.levelMode"})," is configured"]}),`
    `]}),`
  `]})]}),`
`,e.jsx(n.h3,{id:"answerzone",children:"AnswerZone"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`interface AnswerZone {
  id: string;
  index: number;
  expectedValue: string; // correct tile value for this slot
  placedTileId: string | null;
  isWrong: boolean;
  isLocked: boolean; // true when wrongTileBehavior is 'lock-manual' or 'lock-auto-eject'
}
`})}),`
`,e.jsx(n.h3,{id:"tileitem",children:"TileItem"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`interface TileItem {
  id: string;
  label: string; // display text on the tile
  value: string; // semantic value matched against AnswerZone.expectedValue
}
`})}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"action-catalog",children:"Action Catalog"}),`
`,e.jsxs(n.p,{children:[`
  `,"Defined in ",e.jsx(n.code,{children:"src/components/answer-game/types.ts"})," as ",e.jsx(n.code,{children:"AnswerGameAction"}),`.
  Handled in `,e.jsx(n.code,{children:"src/components/answer-game/answer-game-reducer.ts"}),`.
`]}),`
`,e.jsxs(n.table,{children:[`
  `,e.jsxs(n.thead,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.th,{children:"Action"}),`
      `,e.jsx(n.th,{children:"Payload"}),`
      `,e.jsx(n.th,{children:"Dispatched by"}),`
      `,e.jsx(n.th,{children:"Effect"}),`
    `]}),`
  `]}),`
  `,e.jsxs(n.tbody,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"INIT_ROUND"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"{ tiles, zones }"})}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"AnswerGameProvider"})," (mount effect — fresh session)"]}),`
      `,e.jsxs(n.td,{children:["Resets round state, populates tiles and zones; resets ",e.jsx(n.code,{children:"roundIndex"}),", ",e.jsx(n.code,{children:"retryCount"}),", ",e.jsx(n.code,{children:"levelIndex"})," to 0"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"RESUME_ROUND"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"{ draft }"})}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"AnswerGameProvider"})," (mount effect — when ",e.jsx(n.code,{children:"initialState"})," is present)"]}),`
      `,e.jsxs(n.td,{children:["Restores tiles, zones, ",e.jsx(n.code,{children:"activeSlotIndex"}),", ",e.jsx(n.code,{children:"phase"}),", ",e.jsx(n.code,{children:"roundIndex"}),", ",e.jsx(n.code,{children:"retryCount"}),", ",e.jsx(n.code,{children:"levelIndex"})," from the persisted draft; clears transient drag state"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"PLACE_TILE"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"{ tileId, zoneIndex }"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useTileEvaluation"})}),`
      `,e.jsxs(n.td,{children:["Places bank tile in slot; marks wrong if mismatch; sets ",e.jsx(n.code,{children:"phase: 'round-complete'"})," if all correct"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"TYPE_TILE"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"{ tileId, value, zoneIndex }"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useTileEvaluation"})}),`
      `,e.jsxs(n.td,{children:["Creates a virtual typed tile (id ",e.jsx(n.code,{children:"typed-${nanoid()}"}),"); same evaluation as ",e.jsx(n.code,{children:"PLACE_TILE"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"REMOVE_TILE"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"{ zoneIndex }"})}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"useSlotBehavior"}),", ",e.jsx(n.code,{children:"useSlotTileDrag"}),", ",e.jsx(n.code,{children:"useKeyboardInput"}),", ",e.jsx(n.code,{children:"useTouchKeyboardInput"})]}),`
      `,e.jsx(n.td,{children:"Removes tile from slot; returns it to bank (virtual tiles are discarded)"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"SWAP_TILES"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"{ fromZoneIndex, toZoneIndex }"})}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"useSlotBehavior"}),", ",e.jsx(n.code,{children:"useFreeSwap"})]}),`
      `,e.jsx(n.td,{children:"Exchanges tiles between two slots; re-evaluates both positions"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"EJECT_TILE"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"{ zoneIndex }"})}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"useSlotBehavior"})," (auto timer)"]}),`
      `,e.jsx(n.td,{children:"Removes wrong tile after lock-auto-eject animation; returns tile to bank"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"ADVANCE_ROUND"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"{ tiles, zones }"})}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"WordSpell"}),", ",e.jsx(n.code,{children:"NumberMatch"}),", ",e.jsx(n.code,{children:"SortNumbers"})]}),`
      `,e.jsxs(n.td,{children:["Increments ",e.jsx(n.code,{children:"roundIndex"}),"; replaces tiles and zones with next round data"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"ADVANCE_LEVEL"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"{ tiles, zones }"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"SortNumbers"})}),`
      `,e.jsxs(n.td,{children:["Increments ",e.jsx(n.code,{children:"levelIndex"}),"; resets ",e.jsx(n.code,{children:"roundIndex"})," to 0; replaces tiles and zones"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"COMPLETE_GAME"})}),`
      `,e.jsx(n.td,{children:"—"}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"WordSpell"}),", ",e.jsx(n.code,{children:"NumberMatch"}),", ",e.jsx(n.code,{children:"SortNumbers"})]}),`
      `,e.jsxs(n.td,{children:["Sets ",e.jsx(n.code,{children:"phase: 'game-over'"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"SET_DRAG_ACTIVE"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"{ tileId: string | null }"})}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"useDraggableTile"}),", ",e.jsx(n.code,{children:"useSlotTileDrag"}),", ",e.jsx(n.code,{children:"useSlotBehavior"})]}),`
      `,e.jsxs(n.td,{children:["Tracks the tile being dragged; ",e.jsx(n.code,{children:"null"})," clears it on drop or cancel"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"SET_DRAG_HOVER"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"{ zoneIndex: number | null }"})}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"useSlotBehavior"}),", ",e.jsx(n.code,{children:"useDraggableTile"})]}),`
      `,e.jsx(n.td,{children:"Tracks which zone is hovered during drag for visual feedback"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"SET_DRAG_HOVER_BANK"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"{ tileId: string | null }"})}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"useDraggableTile"}),", ",e.jsx(n.code,{children:"useSlotTileDrag"})]}),`
      `,e.jsx(n.td,{children:"Tracks which bank tile hole is hovered by a dragged slot tile"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"SWAP_SLOT_BANK"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"{ zoneIndex, bankTileId }"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useSlotTileDrag"})}),`
      `,e.jsx(n.td,{children:"Exchanges a slot tile with a specific bank tile"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"SET_ACTIVE_SLOT"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"{ zoneIndex }"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useKeyboardInput"})}),`
      `,e.jsx(n.td,{children:"Moves the keyboard cursor to a specific slot (ordered mode only)"}),`
    `]}),`
  `]})]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"hook-index",children:"Hook Index"}),`
`,e.jsxs(n.p,{children:["All hooks live in ",e.jsx(n.code,{children:"src/components/answer-game/"}),"."]}),`
`,e.jsxs(n.table,{children:[`
  `,e.jsxs(n.thead,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.th,{children:"Hook"}),`
      `,e.jsx(n.th,{children:"File"}),`
      `,e.jsx(n.th,{children:"Purpose"}),`
      `,e.jsx(n.th,{children:"Dispatches"}),`
    `]}),`
  `]}),`
  `,e.jsxs(n.tbody,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useAnswerGameContext"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useAnswerGameContext.ts"})}),`
      `,e.jsxs(n.td,{children:["Read ",e.jsx(n.code,{children:"AnswerGameState"})," from context"]}),`
      `,e.jsx(n.td,{children:"—"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useAnswerGameDispatch"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useAnswerGameDispatch.ts"})}),`
      `,e.jsxs(n.td,{children:["Get ",e.jsx(n.code,{children:"dispatch"})," from context"]}),`
      `,e.jsx(n.td,{children:"—"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useTileEvaluation"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useTileEvaluation.ts"})}),`
      `,e.jsx(n.td,{children:"Core tile placement — evaluates correctness, emits sound/events"}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"PLACE_TILE"}),", ",e.jsx(n.code,{children:"TYPE_TILE"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useAutoNextSlot"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useAutoNextSlot.ts"})}),`
      `,e.jsxs(n.td,{children:["Places tile in the next available slot; wraps ",e.jsx(n.code,{children:"useTileEvaluation"})]}),`
      `,e.jsxs(n.td,{children:["via ",e.jsx(n.code,{children:"useTileEvaluation"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useFreeSwap"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useFreeSwap.ts"})}),`
      `,e.jsx(n.td,{children:"Bank tile click in free-swap mode — places or swaps"}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"SWAP_TILES"}),"; via ",e.jsx(n.code,{children:"useTileEvaluation"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useDraggableTile"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useDraggableTile.ts"})}),`
      `,e.jsx(n.td,{children:"Enables bank tile drag (HTML5 DnD + touch pointer events)"}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"SET_DRAG_ACTIVE"}),", ",e.jsx(n.code,{children:"SET_DRAG_HOVER"}),", ",e.jsx(n.code,{children:"SET_DRAG_HOVER_BANK"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useSlotTileDrag"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useSlotTileDrag.ts"})}),`
      `,e.jsxs(n.td,{children:["Enables slot tile drag; calls ",e.jsx(n.code,{children:"onDrop"})," callback for SWAP dispatch"]}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"SET_DRAG_ACTIVE"}),", ",e.jsx(n.code,{children:"SET_DRAG_HOVER_BANK"}),", ",e.jsx(n.code,{children:"SWAP_SLOT_BANK"}),", ",e.jsx(n.code,{children:"REMOVE_TILE"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useSlotBehavior"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"Slot/useSlotBehavior.ts"})}),`
      `,e.jsx(n.td,{children:"Complete slot interaction: drop targets, click-to-remove, auto-eject timer"}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"SET_DRAG_HOVER"}),", ",e.jsx(n.code,{children:"SWAP_TILES"}),", ",e.jsx(n.code,{children:"REMOVE_TILE"}),", ",e.jsx(n.code,{children:"EJECT_TILE"}),", ",e.jsx(n.code,{children:"SET_DRAG_ACTIVE"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useKeyboardInput"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useKeyboardInput.ts"})}),`
      `,e.jsxs(n.td,{children:["Global ",e.jsx(n.code,{children:"keydown"})," listener for desktop input"]}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"SET_ACTIVE_SLOT"}),", ",e.jsx(n.code,{children:"REMOVE_TILE"}),"; via ",e.jsx(n.code,{children:"useTileEvaluation"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useTouchKeyboardInput"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useTouchKeyboardInput.ts"})}),`
      `,e.jsxs(n.td,{children:["Hidden ",e.jsx(n.code,{children:"<input>"})," for mobile OS keyboard"]}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"REMOVE_TILE"}),"; via ",e.jsx(n.code,{children:"useTileEvaluation"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useBankDropTarget"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useBankDropTarget.ts"})}),`
      `,e.jsxs(n.td,{children:["Makes the bank a drop target for slot tiles (no dispatch — returns ",e.jsx(n.code,{children:"isDragOver"}),")"]}),`
      `,e.jsx(n.td,{children:"—"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useTouchDrag"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"useTouchDrag.ts"})}),`
      `,e.jsxs(n.td,{children:["Low-level pointer event handler; calls ",e.jsx(n.code,{children:"onDrop"}),", ",e.jsx(n.code,{children:"onDropOnBank"}),", ",e.jsx(n.code,{children:"onDropOnBankTile"})," callbacks"]}),`
      `,e.jsx(n.td,{children:"Callers dispatch"}),`
    `]}),`
  `]})]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"context-api",children:"Context API"}),`
`,e.jsxs(n.p,{children:["Defined in ",e.jsx(n.code,{children:"src/components/answer-game/AnswerGameProvider.tsx"}),"."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-ts",children:`// State context — read-only
export const AnswerGameStateContext: React.Context<AnswerGameState | null>

// Dispatch context — write-only
export const AnswerGameDispatchContext: React.Context<Dispatch<AnswerGameAction> | null>

// Consumer hooks (throw if used outside provider)
export const useAnswerGameContext = (): AnswerGameState
export const useAnswerGameDispatch = (): Dispatch<AnswerGameAction>
`})}),`
`,e.jsx(n.h3,{id:"consumers-of-the-state-context",children:"Consumers of the state context"}),`
`,e.jsxs(n.ul,{children:[`
  `,e.jsxs(n.li,{children:[`
    `,e.jsx(n.code,{children:"ProgressHUDRoot"})," (",e.jsx(n.code,{children:"ProgressHUD/ProgressHUDRoot.tsx"}),") reads ",e.jsx(n.code,{children:"config"}),`,
    `,e.jsx(n.code,{children:"phase"}),", ",e.jsx(n.code,{children:"roundIndex"}),", ",e.jsx(n.code,{children:"levelIndex"}),", ",e.jsx(n.code,{children:"isLevelMode"}),` to drive the session
    progress HUD. It resolves `,e.jsx(n.code,{children:"config.hud"})," flags via ",e.jsx(n.code,{children:"resolveHudFlags"}),` and
    either renders the default `,e.jsx(n.code,{children:"ProgressHUD"}),` or forwards props to
    `,e.jsx(n.code,{children:"skin.ProgressHUD"}),` when the active skin overrides it.
  `]}),`
`]}),`
`,e.jsx(n.hr,{}),`
`,e.jsx(n.h2,{id:"config-options",children:"Config Options"}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"AnswerGameConfig"})," is defined in ",e.jsx(n.code,{children:"src/components/answer-game/types.ts"}),"."]}),`
`,e.jsxs(n.table,{children:[`
  `,e.jsxs(n.thead,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.th,{children:"Option"}),`
      `,e.jsx(n.th,{children:"Type"}),`
      `,e.jsx(n.th,{children:"Default"}),`
      `,e.jsx(n.th,{children:"Behavior"}),`
    `]}),`
  `]}),`
  `,e.jsxs(n.tbody,{children:[`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"inputMethod"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"'drag' | 'type' | 'both'"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"'drag'"})}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"'type'"}),"/",e.jsx(n.code,{children:"'both'"})," activates ",e.jsx(n.code,{children:"useKeyboardInput"})," + ",e.jsx(n.code,{children:"useTouchKeyboardInput"})]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"wrongTileBehavior"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"'reject' | 'lock-manual' | 'lock-auto-eject'"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"'lock-auto-eject'"})}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"'reject'"}),": tile bounces back. ",e.jsx(n.code,{children:"'lock-manual'"}),": tile stays, marked wrong, user must click to remove. ",e.jsx(n.code,{children:"'lock-auto-eject'"}),": tile stays, shakes, auto-removed after ~1350ms"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"tileBankMode"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"'exact' | 'distractors'"})}),`
      `,e.jsx(n.td,{children:"—"}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"'exact'"}),": bank contains only correct tiles. ",e.jsx(n.code,{children:"'distractors'"}),": adds ",e.jsx(n.code,{children:"distractorCount"})," extra tiles"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"slotInteraction"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"'ordered' | 'free-swap'"})}),`
      `,e.jsx(n.td,{children:"Inferred"}),`
      `,e.jsxs(n.td,{children:[e.jsx(n.code,{children:"'ordered'"}),": cursor moves slot-by-slot. ",e.jsx(n.code,{children:"'free-swap'"}),": click any bank tile → fills any slot"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"levelMode"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"{ generateNextLevel, maxLevels? }"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"undefined"})}),`
      `,e.jsxs(n.td,{children:["Enables level progression; ",e.jsx(n.code,{children:"generateNextLevel(completedLevel)"})," returns next tiles/zones or ",e.jsx(n.code,{children:"null"})," to end game"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"roundsInOrder"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"boolean"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"false"})}),`
      `,e.jsxs(n.td,{children:["When ",e.jsx(n.code,{children:"true"}),", rounds play in config order; otherwise shuffled once per session"]}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"ttsEnabled"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"boolean"})}),`
      `,e.jsx(n.td,{children:"—"}),`
      `,e.jsx(n.td,{children:"Enables TTS on tile pronounce and answer evaluation"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"touchKeyboardInputMode"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"'text' | 'numeric' | 'none'"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"'text'"})}),`
      `,e.jsx(n.td,{children:"Sets the OS keyboard type hint for mobile input"}),`
    `]}),`
    `,e.jsxs(n.tr,{children:[`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"hud"})}),`
      `,e.jsx(n.td,{children:e.jsx(n.code,{children:"HudConfig"})}),`
      `,e.jsx(n.td,{children:"Resolved by mode"}),`
      `,e.jsxs(n.td,{children:["Toggles ",e.jsx(n.code,{children:"showDots"}),", ",e.jsx(n.code,{children:"showFraction"}),", ",e.jsx(n.code,{children:"showLevel"})," on the auto-mounted ",e.jsx(n.code,{children:"ProgressHUD"}),". Defaults differ for classic vs. level-mode games; see ",e.jsx(n.code,{children:"resolveHudFlags"})]}),`
    `]}),`
  `]})]})]})}function u(d={}){const{wrapper:n}={...r(),...d.components};return n?e.jsx(n,{...d,children:e.jsx(s,{...d})}):s(d)}export{u as default};
