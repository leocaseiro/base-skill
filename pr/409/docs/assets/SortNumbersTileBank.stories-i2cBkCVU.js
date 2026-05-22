import{w as d,j as e,r as p}from"./iframe-D9eoeFuN.js";import{w as s}from"./withDb-Cv9gsUPv.js";import{S as m}from"./SortNumbersTileBank-CAmHZnWv.js";import{A as n,u as c}from"./AnswerGameProvider-DbPD0kCD.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-DVpVvEVz.js";import"./import-wrapper-prod-9tIcK5ip.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./styles-Cu2jWhUp.js";import"./tile-font-DQ9RrPM_.js";import"./useDraggableTile-duduSd2r.js";import"./useGameTTS-mqBb2v9A.js";import"./useSettings-DmfUxC2V.js";import"./useRxQuery-C4vRa5ra.js";import"./safe-get-voices-dEfMv828.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./alert-dialog-CW4InP4X.js";import"./button-CvcGqzES.js";import"./utils-BQHNewu7.js";import"./index-DaWZ0gKo.js";import"./index-DRfZlLJh.js";import"./index-CRuOd1kV.js";import"./index-D2gd5x8H.js";import"./index-CNYCBy5U.js";import"./index-B_KjrYiC.js";import"./index-dbvUeaYv.js";import"./index-DCxIUK15.js";import"./useTranslation-Cw-hWFUl.js";import"./index-yy-vhzNc.js";import"./index-aGZHDoZX.js";import"./AudioFeedback--m-fHcTR.js";const l={gameId:"sort-numbers-story",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:1,ttsEnabled:!1,initialTiles:[{id:"t1",label:"3",value:"3"},{id:"t2",label:"7",value:"7"},{id:"t3",label:"1",value:"1"},{id:"t4",label:"5",value:"5"}],initialZones:[{id:"z1",index:0,expectedValue:"1",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z2",index:1,expectedValue:"3",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z3",index:2,expectedValue:"5",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z4",index:3,expectedValue:"7",placedTileId:null,isWrong:!1,isLocked:!1}]},u=r=>e.jsx(n,{config:l,children:e.jsx(r,{})}),J={component:m,title:"Games/SortNumbers/SortNumbersTileBank",tags:["autodocs"],decorators:[s,u]},a={},i={decorators:[d]},f=({children:r})=>{const o=c();return p.useEffect(()=>{o({type:"PLACE_TILE",tileId:"t3",zoneIndex:0}),o({type:"SET_DRAG_ACTIVE",tileId:"t3"}),o({type:"SET_DRAG_HOVER_BANK",tileId:"t1"})},[o]),e.jsx(e.Fragment,{children:r})},t={parameters:{a11y:{config:{rules:[{id:"aria-hidden-focus",enabled:!1}]}}},decorators:[s,r=>e.jsx(n,{config:l,children:e.jsx(f,{children:e.jsx(r,{})})})]};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:"{}",...a.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
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
