import{j as e,r as l}from"./iframe-DQPhJkAL.js";import{w as a}from"./withDb-BtkN5gm1.js";import{S as d}from"./SortNumbersTileBank-CGpl7qSc.js";import{A as o,u as c}from"./AnswerGameProvider-BWzbZtiJ.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-Dml3HN4j.js";import"./import-wrapper-prod-DPKbKiVY.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./styles-Cu2jWhUp.js";import"./tile-font-DQ9RrPM_.js";import"./useDraggableTile-rcDOMQhU.js";import"./useGameTTS-rM1PPu1w.js";import"./useSettings-BhSRyuTv.js";import"./useRxQuery-DKNfE-Bo.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-CbHyd0gu.js";import"./index-Cm2bcFEe.js";import"./index-DZV47jQM.js";import"./AudioFeedback--m-fHcTR.js";const n={gameId:"sort-numbers-story",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:1,ttsEnabled:!1,initialTiles:[{id:"t1",label:"3",value:"3"},{id:"t2",label:"7",value:"7"},{id:"t3",label:"1",value:"1"},{id:"t4",label:"5",value:"5"}],initialZones:[{id:"z1",index:0,expectedValue:"1",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z2",index:1,expectedValue:"3",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z3",index:2,expectedValue:"5",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z4",index:3,expectedValue:"7",placedTileId:null,isWrong:!1,isLocked:!1}]},p=r=>e.jsx(o,{config:n,children:e.jsx(r,{})}),L={component:d,title:"Games/SortNumbers/SortNumbersTileBank",tags:["autodocs"],decorators:[a,p]},s={},m=({children:r})=>{const i=c();return l.useEffect(()=>{i({type:"PLACE_TILE",tileId:"t3",zoneIndex:0}),i({type:"SET_DRAG_ACTIVE",tileId:"t3"}),i({type:"SET_DRAG_HOVER_BANK",tileId:"t1"})},[i]),e.jsx(e.Fragment,{children:r})},t={parameters:{a11y:{config:{rules:[{id:"aria-hidden-focus",enabled:!1}]}}},decorators:[a,r=>e.jsx(o,{config:n,children:e.jsx(m,{children:e.jsx(r,{})})})]};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:"{}",...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
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
}`,...t.parameters?.docs?.source},description:{story:"Tile `1` is in the first slot; dashed hover on bank tile `3`.",...t.parameters?.docs?.description}}};const V=["Default","DragHoverBankTile"];export{s as Default,t as DragHoverBankTile,V as __namedExportsOrder,L as default};
