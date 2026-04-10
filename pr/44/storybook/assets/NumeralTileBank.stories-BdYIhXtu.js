import{j as e}from"./iframe-shi_d_H9.js";import{w as n}from"./withDb-CN4N5R7S.js";import{N as u}from"./NumeralTileBank-DgfV6nZ-.js";import{A as l,u as c}from"./AnswerGameProvider-B_ikYtNz.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-CF-JAgEU.js";import"./index.browser-BY9c7rfI.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./useTouchDrag-bwz5dUXO.js";import"./useDraggableTile-KgqcjlqG.js";import"./useGameTTS-DuYP9a2V.js";import"./useSettings-BeAug8N3.js";import"./useRxDB-SPUI4rxU.js";import"./useRxQuery-oExvBWcI.js";import"./SpeechOutput-By2uxF-i.js";import"./useTranslation-B7DCW_6D.js";import"./index-CkgNWW7h.js";import"./AudioFeedback-cxEhBYIg.js";import"./game-event-bus-CVIPXPct.js";import"./GameRoundContext-C1v3DkGB.js";const d={gameId:"storybook",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:1,ttsEnabled:!0},p=[{id:"t1",label:"1",value:"1"},{id:"t2",label:"2",value:"2"},{id:"t3",label:"3",value:"3"},{id:"t4",label:"4",value:"4"},{id:"t5",label:"5",value:"5"}],m=[{id:"z0",index:0,expectedValue:"3",placedTileId:null,isWrong:!1,isLocked:!1}],g=({children:t})=>(c()({type:"INIT_ROUND",tiles:p,zones:m}),e.jsx(e.Fragment,{children:t})),P={component:u,tags:["autodocs"],args:{tileStyle:"dots"},decorators:[n,t=>e.jsx(l,{config:d,children:e.jsx(g,{children:e.jsx(t,{})})})]},o={args:{tileStyle:"dots"}},s={args:{tileStyle:"fingers"}},a={args:{tileStyle:"objects"}},S=({children:t})=>{const r=c();return r({type:"INIT_ROUND",tiles:p,zones:m}),r({type:"PLACE_TILE",tileId:"t1",zoneIndex:0}),r({type:"SET_DRAG_ACTIVE",tileId:"t1"}),r({type:"SET_DRAG_HOVER_BANK",tileId:"t2"}),e.jsx(e.Fragment,{children:t})},i={args:{tileStyle:"dots"},decorators:[n,t=>e.jsx(l,{config:d,children:e.jsx(S,{children:e.jsx(t,{})})})]};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    tileStyle: 'dots'
  }
}`,...o.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    tileStyle: 'fingers'
  }
}`,...s.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    tileStyle: 'objects'
  }
}`,...a.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    tileStyle: 'dots'
  },
  decorators: [withDb, Story => <AnswerGameProvider config={config}>
        <DragHoverBankTileSetup>
          <Story />
        </DragHoverBankTileSetup>
      </AnswerGameProvider>]
}`,...i.parameters?.docs?.source}}};const F=["Default","FingersStyle","ObjectsStyle","DragHoverBankTile"];export{o as Default,i as DragHoverBankTile,s as FingersStyle,a as ObjectsStyle,F as __namedExportsOrder,P as default};
