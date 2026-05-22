import{w as d,j as e,r as p}from"./iframe-OZ5J_R0h.js";import{w as s}from"./withDb-C-UQv6eD.js";import{S as m}from"./SortNumbersTileBank-CsXHGcIh.js";import{A as n,u as c}from"./AnswerGameProvider-Ymt29GmW.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-CuvKb-_0.js";import"./import-wrapper-prod-BghuaIMp.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./styles-Cu2jWhUp.js";import"./tile-font-DQ9RrPM_.js";import"./useDraggableTile-fSg9cfCb.js";import"./useGameTTS-Drzai2xi.js";import"./useSettings-CbC_odEU.js";import"./useRxQuery-shnYTBDq.js";import"./safe-get-voices-dEfMv828.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./alert-dialog-C1jLABiQ.js";import"./button-BmoWGMo2.js";import"./utils-BQHNewu7.js";import"./index-oeYWnyMa.js";import"./index-BPqPlZmN.js";import"./index-ChLiWUQ4.js";import"./index-xEglOifN.js";import"./index-Dt9XNzEF.js";import"./index-DrXMuogA.js";import"./index-BHykasLq.js";import"./index-CQDJgBBL.js";import"./useTranslation-DqEAayLJ.js";import"./index-DMlz9kwd.js";import"./index-Bt9_6zw0.js";import"./AudioFeedback--m-fHcTR.js";const l={gameId:"sort-numbers-story",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:1,ttsEnabled:!1,initialTiles:[{id:"t1",label:"3",value:"3"},{id:"t2",label:"7",value:"7"},{id:"t3",label:"1",value:"1"},{id:"t4",label:"5",value:"5"}],initialZones:[{id:"z1",index:0,expectedValue:"1",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z2",index:1,expectedValue:"3",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z3",index:2,expectedValue:"5",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z4",index:3,expectedValue:"7",placedTileId:null,isWrong:!1,isLocked:!1}]},u=r=>e.jsx(n,{config:l,children:e.jsx(r,{})}),J={component:m,title:"Games/SortNumbers/SortNumbersTileBank",tags:["autodocs"],decorators:[s,u]},a={},i={decorators:[d]},f=({children:r})=>{const o=c();return p.useEffect(()=>{o({type:"PLACE_TILE",tileId:"t3",zoneIndex:0}),o({type:"SET_DRAG_ACTIVE",tileId:"t3"}),o({type:"SET_DRAG_HOVER_BANK",tileId:"t1"})},[o]),e.jsx(e.Fragment,{children:r})},t={parameters:{a11y:{config:{rules:[{id:"aria-hidden-focus",enabled:!1}]}}},decorators:[s,r=>e.jsx(n,{config:l,children:e.jsx(f,{children:e.jsx(r,{})})})]};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:"{}",...a.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  decorators: [withDarkMode]
}`,...i.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
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
}`,...t.parameters?.docs?.source},description:{story:"Tile `1` is in the first slot; dashed hover on bank tile `3`.",...t.parameters?.docs?.description}}};const Q=["Default","DefaultDark","DragHoverBankTile"];export{a as Default,i as DefaultDark,t as DragHoverBankTile,Q as __namedExportsOrder,J as default};
