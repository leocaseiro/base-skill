import{j as e}from"./iframe-D9eoeFuN.js";import{w as l}from"./withDb-Cv9gsUPv.js";import{N as S}from"./NumeralTileBank-XTblN78F.js";import{A as p,u as d}from"./AnswerGameProvider-DbPD0kCD.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-DVpVvEVz.js";import"./import-wrapper-prod-9tIcK5ip.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./styles-Cu2jWhUp.js";import"./tile-font-DQ9RrPM_.js";import"./useDraggableTile-duduSd2r.js";import"./useGameTTS-mqBb2v9A.js";import"./useSettings-DmfUxC2V.js";import"./useRxQuery-C4vRa5ra.js";import"./safe-get-voices-dEfMv828.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./alert-dialog-CW4InP4X.js";import"./button-CvcGqzES.js";import"./utils-BQHNewu7.js";import"./index-DaWZ0gKo.js";import"./index-DRfZlLJh.js";import"./index-CRuOd1kV.js";import"./index-D2gd5x8H.js";import"./index-CNYCBy5U.js";import"./index-B_KjrYiC.js";import"./index-dbvUeaYv.js";import"./index-DCxIUK15.js";import"./useTranslation-Cw-hWFUl.js";import"./index-yy-vhzNc.js";import"./index-aGZHDoZX.js";import"./AudioFeedback--m-fHcTR.js";const c={gameId:"storybook",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:1,ttsEnabled:!0},u=[{id:"t1",label:"1",value:"1"},{id:"t2",label:"2",value:"2"},{id:"t3",label:"3",value:"3"},{id:"t4",label:"4",value:"4"},{id:"t5",label:"5",value:"5"}],g=[{id:"w1",label:"one",value:"1"},{id:"w2",label:"two",value:"2"},{id:"w3",label:"three",value:"3"},{id:"w4",label:"seventeen",value:"17"},{id:"w5",label:"twenty-two",value:"22"}],m=[{id:"z0",index:0,expectedValue:"3",placedTileId:null,isWrong:!1,isLocked:!1}],w=({children:r})=>(d()({type:"INIT_ROUND",tiles:u,zones:m}),e.jsx(e.Fragment,{children:r})),h=({children:r})=>(d()({type:"INIT_ROUND",tiles:g,zones:m}),e.jsx(e.Fragment,{children:r})),Z={component:S,title:"Games/NumberMatch/NumeralTileBank",tags:["autodocs"],args:{tileStyle:"dots",tilesShowGroup:!0},decorators:[l,r=>e.jsx(p,{config:c,children:e.jsx(w,{children:e.jsx(r,{})})})]},o={args:{tileStyle:"dots",tilesShowGroup:!0}},s={args:{tileStyle:"fingers",tilesShowGroup:!0}},a={args:{tileStyle:"objects",tilesShowGroup:!0}},i={args:{tileStyle:"dots",tilesShowGroup:!1},decorators:[l,r=>e.jsx(p,{config:c,children:e.jsx(h,{children:e.jsx(r,{})})})]},y=({children:r})=>{const t=d();return t({type:"INIT_ROUND",tiles:u,zones:m}),t({type:"PLACE_TILE",tileId:"t1",zoneIndex:0}),t({type:"SET_DRAG_ACTIVE",tileId:"t1"}),t({type:"SET_DRAG_HOVER_BANK",tileId:"t2"}),e.jsx(e.Fragment,{children:r})},n={args:{tileStyle:"dots",tilesShowGroup:!0},decorators:[l,r=>e.jsx(p,{config:c,children:e.jsx(y,{children:e.jsx(r,{})})})]};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
}`,...n.parameters?.docs?.source}}};const $=["Default","FingersStyle","ObjectsStyle","WordTiles","DragHoverBankTile"];export{o as Default,n as DragHoverBankTile,s as FingersStyle,a as ObjectsStyle,i as WordTiles,$ as __namedExportsOrder,Z as default};
