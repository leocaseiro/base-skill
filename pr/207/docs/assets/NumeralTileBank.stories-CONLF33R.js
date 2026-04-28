import{j as e}from"./iframe-BqkDq_Zn.js";import{w as l}from"./withDb-DmLXhcQd.js";import{N as S}from"./NumeralTileBank-RHsS6h9U.js";import{A as d,u as c}from"./AnswerGameProvider-B_cUFLD4.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-lZZ_TTdA.js";import"./import-wrapper-prod-C1_l7mWY.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./useDraggableTile-BjPC5SLc.js";import"./useGameTTS-BS46LLLi.js";import"./useSettings--C05EBTA.js";import"./useRxDB-m1rFeS8t.js";import"./useRxQuery-B-ZWr4g7.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-DzR8iXr5.js";import"./index-B7S9KMah.js";import"./index-C9sO-1BG.js";import"./tile-font-DQ9RrPM_.js";import"./AudioFeedback-DxUgBcwr.js";const p={gameId:"storybook",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:1,ttsEnabled:!0},m=[{id:"t1",label:"1",value:"1"},{id:"t2",label:"2",value:"2"},{id:"t3",label:"3",value:"3"},{id:"t4",label:"4",value:"4"},{id:"t5",label:"5",value:"5"}],g=[{id:"w1",label:"one",value:"1"},{id:"w2",label:"two",value:"2"},{id:"w3",label:"three",value:"3"},{id:"w4",label:"seventeen",value:"17"},{id:"w5",label:"twenty-two",value:"22"}],u=[{id:"z0",index:0,expectedValue:"3",placedTileId:null,isWrong:!1,isLocked:!1}],w=({children:r})=>(c()({type:"INIT_ROUND",tiles:m,zones:u}),e.jsx(e.Fragment,{children:r})),h=({children:r})=>(c()({type:"INIT_ROUND",tiles:g,zones:u}),e.jsx(e.Fragment,{children:r})),z={component:S,tags:["autodocs"],args:{tileStyle:"dots",tilesShowGroup:!0},decorators:[l,r=>e.jsx(d,{config:p,children:e.jsx(w,{children:e.jsx(r,{})})})]},o={args:{tileStyle:"dots",tilesShowGroup:!0}},s={args:{tileStyle:"fingers",tilesShowGroup:!0}},a={args:{tileStyle:"objects",tilesShowGroup:!0}},i={args:{tileStyle:"dots",tilesShowGroup:!1},decorators:[l,r=>e.jsx(d,{config:p,children:e.jsx(h,{children:e.jsx(r,{})})})]},y=({children:r})=>{const t=c();return t({type:"INIT_ROUND",tiles:m,zones:u}),t({type:"PLACE_TILE",tileId:"t1",zoneIndex:0}),t({type:"SET_DRAG_ACTIVE",tileId:"t1"}),t({type:"SET_DRAG_HOVER_BANK",tileId:"t2"}),e.jsx(e.Fragment,{children:r})},n={args:{tileStyle:"dots",tilesShowGroup:!0},decorators:[l,r=>e.jsx(d,{config:p,children:e.jsx(y,{children:e.jsx(r,{})})})]};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    tileStyle: 'dots',
    tilesShowGroup: true
  }
}`,...o.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    tileStyle: 'fingers',
    tilesShowGroup: true
  }
}`,...s.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    tileStyle: 'objects',
    tilesShowGroup: true
  }
}`,...a.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    tileStyle: 'dots',
    tilesShowGroup: false
  },
  decorators: [withDb, Story => <AnswerGameProvider config={config}>
        <InitWordProvider>
          <Story />
        </InitWordProvider>
      </AnswerGameProvider>]
}`,...i.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    tileStyle: 'dots',
    tilesShowGroup: true
  },
  decorators: [withDb, Story => <AnswerGameProvider config={config}>
        <DragHoverBankTileSetup>
          <Story />
        </DragHoverBankTileSetup>
      </AnswerGameProvider>]
}`,...n.parameters?.docs?.source}}};const L=["Default","FingersStyle","ObjectsStyle","WordTiles","DragHoverBankTile"];export{o as Default,n as DragHoverBankTile,s as FingersStyle,a as ObjectsStyle,i as WordTiles,L as __namedExportsOrder,z as default};
