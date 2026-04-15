import{j as e,r as l}from"./iframe-yrgjIPXf.js";import{w as c}from"./decorators-CpZTpkPW.js";import{w as i}from"./withDb-QR0bAUBD.js";import{S as p}from"./SortNumbersTileBank-zkpCyetk.js";import{A as n,u as m}from"./AnswerGameProvider-Cyo-PqZV.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-C11ktCMI.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./useTouchDrag-C3nM39NS.js";import"./tile-font-DQ9RrPM_.js";import"./useDraggableTile-C24gtqmA.js";import"./useGameTTS-WKZwcX5f.js";import"./useSettings-DMF1k2hN.js";import"./useRxDB-BaO3KPCx.js";import"./useRxQuery-zrlOkUWU.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-CwaJgSuP.js";import"./index-DOHOwGk7.js";import"./index-DBbkNseW.js";import"./game-event-bus-CVIPXPct.js";import"./AudioFeedback-DxUgBcwr.js";const d={gameId:"sort-numbers-story",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:1,ttsEnabled:!1,initialTiles:[{id:"t1",label:"3",value:"3"},{id:"t2",label:"7",value:"7"},{id:"t3",label:"1",value:"1"},{id:"t4",label:"5",value:"5"}],initialZones:[{id:"z1",index:0,expectedValue:"1",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z2",index:1,expectedValue:"3",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z3",index:2,expectedValue:"5",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z4",index:3,expectedValue:"7",placedTileId:null,isWrong:!1,isLocked:!1}]},u=r=>e.jsx(n,{config:d,children:e.jsx(r,{})}),P={component:p,tags:["autodocs"],decorators:[i,u]},o={},s={decorators:[c]},f=({children:r})=>{const a=m();return l.useEffect(()=>{a({type:"PLACE_TILE",tileId:"t3",zoneIndex:0}),a({type:"SET_DRAG_ACTIVE",tileId:"t3"}),a({type:"SET_DRAG_HOVER_BANK",tileId:"t1"})},[a]),e.jsx(e.Fragment,{children:r})},t={parameters:{a11y:{config:{rules:[{id:"aria-hidden-focus",enabled:!1}]}}},decorators:[i,r=>e.jsx(n,{config:d,children:e.jsx(f,{children:e.jsx(r,{})})})]};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:"{}",...o.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  decorators: [withDarkMode]
}`,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  parameters: {
    a11y: {
      config: {
        rules: [{
          // The drag-simulation setup briefly creates aria-hidden elements
          // that still contain the focusable tile, triggering this rule.
          // This is a transient state specific to this story's drag fixture.
          id: 'aria-hidden-focus',
          enabled: false
        }]
      }
    }
  },
  decorators: [withDb, Story => <AnswerGameProvider config={config}>
        <SortNumbersDragHoverSetup>
          <Story />
        </SortNumbersDragHoverSetup>
      </AnswerGameProvider>]
}`,...t.parameters?.docs?.source},description:{story:"Tile `1` is in the first slot; dashed hover on bank tile `3`.",...t.parameters?.docs?.description}}};const R=["Default","DefaultDark","DragHoverBankTile"];export{o as Default,s as DefaultDark,t as DragHoverBankTile,R as __namedExportsOrder,P as default};
