import{j as e,R as h}from"./iframe-GMZ59M3z.js";import{w as f}from"./withDb-CD7pIQsk.js";import{A as t,u as N}from"./AnswerGameProvider-CdqsRO47.js";import{S as Z}from"./SentenceWithGaps-D7bL6apd.js";import{S as l,a}from"./SlotRow-Dqbve8al.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-DOSlFXqW.js";import"./index.browser-BY9c7rfI.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./AudioFeedback-cxEhBYIg.js";import"./game-event-bus-CVIPXPct.js";import"./GameRoundContext-07Yn2eVb.js";import"./useTouchDrag-JUCQ8342.js";const d={gameId:"slot-storybook",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:1,ttsEnabled:!1},o=(s,r=null,k=!1)=>({id:`z${String(s)}`,index:s,expectedValue:String(s),placedTileId:r,isWrong:k,isLocked:!1}),n=(s,r)=>({id:s,label:r,value:r}),i=({label:s})=>e.jsx("span",{className:"text-xl font-bold",children:s??""}),O={component:l,title:"answer-game/Slot",tags:["autodocs"],decorators:[f]},m={render:()=>e.jsx(t,{config:{...d,gameId:"slot-empty",initialTiles:[n("t0","C"),n("t1","A"),n("t2","T")],initialZones:[o(0),o(1),o(2)]},children:e.jsxs(l,{className:"gap-2",children:[e.jsx(a,{index:0,className:"size-14 rounded-lg",children:s=>e.jsx(i,{...s})}),e.jsx(a,{index:1,className:"size-14 rounded-lg",children:s=>e.jsx(i,{...s})}),e.jsx(a,{index:2,className:"size-14 rounded-lg",children:s=>e.jsx(i,{...s})})]})})},c={render:()=>e.jsx(t,{config:{...d,gameId:"slot-filled",initialTiles:[n("t0","C"),n("t1","A"),n("t2","T")],initialZones:[o(0,"t0"),o(1,"t1"),o(2,"t2")]},children:e.jsxs(l,{className:"gap-2",children:[e.jsx(a,{index:0,className:"size-14 rounded-lg",children:s=>e.jsx(i,{...s})}),e.jsx(a,{index:1,className:"size-14 rounded-lg",children:s=>e.jsx(i,{...s})}),e.jsx(a,{index:2,className:"size-14 rounded-lg",children:s=>e.jsx(i,{...s})})]})})},p={render:()=>e.jsx(t,{config:{...d,gameId:"slot-wrong",initialTiles:[n("t0","X")],initialZones:[o(0,"t0",!0)]},children:e.jsx(l,{className:"gap-2",children:e.jsx(a,{index:0,className:"size-14 rounded-lg",children:s=>e.jsx(i,{...s})})})})},w=({label:s})=>e.jsx("span",{className:"text-2xl font-bold",children:s??""}),x={render:()=>e.jsx(t,{config:{...d,gameId:"slot-dice",initialTiles:[n("d0","3"),n("d1","5"),n("d2","1")],initialZones:[o(0,"d0"),o(1,"d1"),o(2,"d2")]},children:e.jsxs(l,{className:"gap-3",children:[e.jsx(a,{index:0,className:"size-20 rounded-xl",children:s=>e.jsx(w,{...s})}),e.jsx(a,{index:1,className:"size-20 rounded-xl",children:s=>e.jsx(w,{...s})}),e.jsx(a,{index:2,className:"size-20 rounded-xl",children:s=>e.jsx(w,{...s})})]})})},T=({label:s})=>e.jsx("span",{className:"text-3xl font-bold",children:s??""}),g={render:()=>e.jsx(t,{config:{...d,gameId:"slot-domino",initialTiles:[n("dom0","4"),n("dom1","2")],initialZones:[o(0,"dom0"),o(1,"dom1")]},children:e.jsxs(l,{className:"gap-3",children:[e.jsx(a,{index:0,className:"h-[72px] w-32 rounded-xl",children:s=>e.jsx(T,{...s})}),e.jsx(a,{index:1,className:"h-[72px] w-32 rounded-xl",children:s=>e.jsx(T,{...s})})]})})},u={render:()=>e.jsx(t,{config:{...d,gameId:"slot-sentence",initialTiles:[n("s0","cat")],initialZones:[o(0,"s0")]},children:e.jsx("div",{className:"p-4",children:e.jsx(Z,{sentence:"The {0} sat on the mat."})})})},S={render:()=>e.jsx(t,{config:{...d,gameId:"slot-preview-target",initialTiles:[n("t0","C"),n("t1","A"),n("t2","T")],initialZones:[o(0),o(1),o(2)]},children:e.jsx(v,{})})},v=()=>{const s=N();return h.useEffect(()=>{s({type:"SET_DRAG_ACTIVE",tileId:"t0"}),s({type:"SET_DRAG_HOVER",zoneIndex:1})},[s]),e.jsxs(l,{className:"gap-2",children:[e.jsx(a,{index:0,className:"size-14 rounded-lg",children:r=>e.jsx(i,{...r})}),e.jsx(a,{index:1,className:"size-14 rounded-lg",children:r=>e.jsx(i,{...r})}),e.jsx(a,{index:2,className:"size-14 rounded-lg",children:r=>e.jsx(i,{...r})})]})},j={render:()=>e.jsx(t,{config:{...d,gameId:"slot-preview-swap",initialTiles:[n("t0","C"),n("t1","A"),n("t2","T")],initialZones:[o(0,"t0"),o(1,"t1"),o(2,"t2")]},children:e.jsx(C,{})})},C=()=>{const s=N();return h.useEffect(()=>{s({type:"SET_DRAG_ACTIVE",tileId:"t0"}),s({type:"SET_DRAG_HOVER",zoneIndex:1})},[s]),e.jsxs(l,{className:"gap-2",children:[e.jsx(a,{index:0,className:"size-14 rounded-lg",children:r=>e.jsx(i,{...r})}),e.jsx(a,{index:1,className:"size-14 rounded-lg",children:r=>e.jsx(i,{...r})}),e.jsx(a,{index:2,className:"size-14 rounded-lg",children:r=>e.jsx(i,{...r})})]})};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <AnswerGameProvider config={{
    ...baseConfig,
    gameId: 'slot-empty',
    initialTiles: [makeTile('t0', 'C'), makeTile('t1', 'A'), makeTile('t2', 'T')],
    initialZones: [makeZone(0), makeZone(1), makeZone(2)]
  }}>
      <SlotRow className="gap-2">
        <Slot index={0} className="size-14 rounded-lg">
          {props => <LetterContent {...props} />}
        </Slot>
        <Slot index={1} className="size-14 rounded-lg">
          {props => <LetterContent {...props} />}
        </Slot>
        <Slot index={2} className="size-14 rounded-lg">
          {props => <LetterContent {...props} />}
        </Slot>
      </SlotRow>
    </AnswerGameProvider>
}`,...m.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <AnswerGameProvider config={{
    ...baseConfig,
    gameId: 'slot-filled',
    initialTiles: [makeTile('t0', 'C'), makeTile('t1', 'A'), makeTile('t2', 'T')],
    initialZones: [makeZone(0, 't0'), makeZone(1, 't1'), makeZone(2, 't2')]
  }}>
      <SlotRow className="gap-2">
        <Slot index={0} className="size-14 rounded-lg">
          {props => <LetterContent {...props} />}
        </Slot>
        <Slot index={1} className="size-14 rounded-lg">
          {props => <LetterContent {...props} />}
        </Slot>
        <Slot index={2} className="size-14 rounded-lg">
          {props => <LetterContent {...props} />}
        </Slot>
      </SlotRow>
    </AnswerGameProvider>
}`,...c.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <AnswerGameProvider config={{
    ...baseConfig,
    gameId: 'slot-wrong',
    initialTiles: [makeTile('t0', 'X')],
    initialZones: [makeZone(0, 't0', true)]
  }}>
      <SlotRow className="gap-2">
        <Slot index={0} className="size-14 rounded-lg">
          {props => <LetterContent {...props} />}
        </Slot>
      </SlotRow>
    </AnswerGameProvider>
}`,...p.parameters?.docs?.source}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: () => <AnswerGameProvider config={{
    ...baseConfig,
    gameId: 'slot-dice',
    initialTiles: [makeTile('d0', '3'), makeTile('d1', '5'), makeTile('d2', '1')],
    initialZones: [makeZone(0, 'd0'), makeZone(1, 'd1'), makeZone(2, 'd2')]
  }}>
      <SlotRow className="gap-3">
        <Slot index={0} className="size-20 rounded-xl">
          {props => <DotContent {...props} />}
        </Slot>
        <Slot index={1} className="size-20 rounded-xl">
          {props => <DotContent {...props} />}
        </Slot>
        <Slot index={2} className="size-20 rounded-xl">
          {props => <DotContent {...props} />}
        </Slot>
      </SlotRow>
    </AnswerGameProvider>
}`,...x.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <AnswerGameProvider config={{
    ...baseConfig,
    gameId: 'slot-domino',
    initialTiles: [makeTile('dom0', '4'), makeTile('dom1', '2')],
    initialZones: [makeZone(0, 'dom0'), makeZone(1, 'dom1')]
  }}>
      <SlotRow className="gap-3">
        <Slot index={0} className="h-[72px] w-32 rounded-xl">
          {props => <DominoContent {...props} />}
        </Slot>
        <Slot index={1} className="h-[72px] w-32 rounded-xl">
          {props => <DominoContent {...props} />}
        </Slot>
      </SlotRow>
    </AnswerGameProvider>
}`,...g.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <AnswerGameProvider config={{
    ...baseConfig,
    gameId: 'slot-sentence',
    initialTiles: [makeTile('s0', 'cat')],
    initialZones: [makeZone(0, 's0')]
  }}>
      <div className="p-4">
        <SentenceWithGaps sentence="The {0} sat on the mat." />
      </div>
    </AnswerGameProvider>
}`,...u.parameters?.docs?.source}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => <AnswerGameProvider config={{
    ...baseConfig,
    gameId: 'slot-preview-target',
    initialTiles: [makeTile('t0', 'C'), makeTile('t1', 'A'), makeTile('t2', 'T')],
    initialZones: [makeZone(0), makeZone(1), makeZone(2)]
  }}>
      <PreviewTargetInner />
    </AnswerGameProvider>
}`,...S.parameters?.docs?.source}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  render: () => <AnswerGameProvider config={{
    ...baseConfig,
    gameId: 'slot-preview-swap',
    initialTiles: [makeTile('t0', 'C'), makeTile('t1', 'A'), makeTile('t2', 'T')],
    initialZones: [makeZone(0, 't0'), makeZone(1, 't1'), makeZone(2, 't2')]
  }}>
      <PreviewSwapInner />
    </AnswerGameProvider>
}`,...j.parameters?.docs?.source}}};const B=["EmptyLetterSlots","FilledLetterSlots","WrongPlacement","DiceSlots","DominoSlots","InlineSentenceGap","PreviewTarget","PreviewSwap"];export{x as DiceSlots,g as DominoSlots,m as EmptyLetterSlots,c as FilledLetterSlots,u as InlineSentenceGap,j as PreviewSwap,S as PreviewTarget,p as WrongPlacement,B as __namedExportsOrder,O as default};
