import{w as d,j as e,r as c}from"./iframe-DJm7UBnT.js";import{w as i}from"./withDb-DFaH-WO1.js";import{S as p}from"./SortNumbersTileBank-DGhv7cgj.js";import{A as n,u as m}from"./AnswerGameProvider-BtzmAPOU.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-ii0l-pTT.js";import"./import-wrapper-prod-DLKzGee7.js";import"./Subject-dqPabvlm.js";import"./phoneme-codes-BoyU28CG.js";import"./styles-Cu2jWhUp.js";import"./tile-font-DQ9RrPM_.js";import"./useDraggableTile-CVThVw1N.js";import"./useGameTTS-CsP4I1Sy.js";import"./useSettings-BF7ZVBFx.js";import"./useRxQuery-D45Q3vQw.js";import"./voices-BsnJG_W_.js";import"./SpeechOutput-f45Kz2kS.js";import"./synth-access-CUeUQ1FV.js";import"./AudioFeedback--m-fHcTR.js";const l={gameId:"sort-numbers-story",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:1,ttsEnabled:!1,initialTiles:[{id:"t1",label:"3",value:"3"},{id:"t2",label:"7",value:"7"},{id:"t3",label:"1",value:"1"},{id:"t4",label:"5",value:"5"}],initialZones:[{id:"z1",index:0,expectedValue:"1",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z2",index:1,expectedValue:"3",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z3",index:2,expectedValue:"5",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z4",index:3,expectedValue:"7",placedTileId:null,isWrong:!1,isLocked:!1}]},u=r=>e.jsx(n,{config:l,children:e.jsx(r,{})}),H={component:p,title:"Games/SortNumbers/SortNumbersTileBank",tags:["autodocs"],decorators:[i,u]},s={},o={decorators:[d]},f=({children:r})=>{const a=m();return c.useEffect(()=>{a({type:"PLACE_TILE",tileId:"t3",zoneIndex:0}),a({type:"SET_DRAG_ACTIVE",tileId:"t3"}),a({type:"SET_DRAG_HOVER_BANK",tileId:"t1"})},[a]),e.jsx(e.Fragment,{children:r})},t={parameters:{a11y:{config:{rules:[{id:"aria-hidden-focus",enabled:!1}]}}},decorators:[i,r=>e.jsx(n,{config:l,children:e.jsx(f,{children:e.jsx(r,{})})})]};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:"{}",...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  decorators: [withDarkMode]
}`,...o.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
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
}`,...t.parameters?.docs?.source},description:{story:"Tile `1` is in the first slot; dashed hover on bank tile `3`.",...t.parameters?.docs?.description}}};const L=["Default","DefaultDark","DragHoverBankTile"];export{s as Default,o as DefaultDark,t as DragHoverBankTile,L as __namedExportsOrder,H as default};
