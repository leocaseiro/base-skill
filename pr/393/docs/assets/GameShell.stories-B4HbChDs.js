import{j as n}from"./iframe-DaMeNeqL.js";import{w as d}from"./withRouter-FpOCrl6M.js";import{G as c}from"./GameShell-qiM0sI2C.js";import{D as p,c as l}from"./DbProvider-DGYO-IHY.js";import"./preload-helper-PPVm8Dsz.js";import"./index-BqPmpH5I.js";import"./index-BlquBci-.js";import"./index-Du-wTlzO.js";import"./useLocation-DVxAUHz5.js";import"./AppMenuPanel-DUx9kHM9.js";import"./label-C66flOSW.js";import"./utils-BQHNewu7.js";import"./index-DpsqeOUY.js";import"./index-LkK90plj.js";import"./select-BHXc5mp-.js";import"./createLucideIcon-DBNnJmnZ.js";import"./index-BKQYbTZr.js";import"./index-Cxqn3_9r.js";import"./index-DICXJgPE.js";import"./index-CdMLF9OW.js";import"./tslib.es6--Hu8dhvm.js";import"./index-CSgFs4Aj.js";import"./slider-CB3TDkVn.js";import"./useSettings-D10FTx12.js";import"./useRxQuery-CVJx2oNO.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-sQV1BTjH.js";import"./index-CSbAMMno.js";import"./ThemeToggle-BojZk4K9.js";import"./sheet-CmV_yyBP.js";import"./button-BnnvCsqD.js";import"./index-CGxFU-ev.js";import"./index-CTduZywo.js";import"./alert-dialog-BEaIIQHM.js";import"./import-wrapper-prod-BgvBqnvr.js";import"./Subject-D3vFcUgp.js";import"./phoneme-codes-BoyU28CG.js";const u=m=>n.jsx(p,{openDatabase:l,children:n.jsx(m,{})}),i={rounds:[{id:"r1",prompt:{en:'What sound does "cat" start with?'},correctAnswer:"c"},{id:"r2",prompt:{en:"What letter comes after A?"},correctAnswer:"b"},{id:"r3",prompt:{en:'Spell "dog"'},correctAnswer:"dog"}]},a={gameId:"word-builder",title:{en:"Word Builder"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},t={phase:"playing",roundIndex:1,score:1,streak:1,retryCount:0,content:i,currentRound:{roundId:"r2",answer:null,hintsUsed:0}},g={profileId:"storybook-user",gameId:"word-builder",gradeBand:"year1-2",seed:"storybook-seed",initialContent:i,initialState:t},Z={component:c,title:"Game/GameShell",tags:["autodocs"],decorators:[u,d],parameters:{layout:"fullscreen"}},e={args:{config:a,moves:{},initialState:t,sessionId:"storybook-session-001",meta:g,children:n.jsx("div",{className:"flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground",children:"Game component renders here"})}},r={args:{...e.args,sessionId:"storybook-session-002",config:{...a,timerVisible:!1,timerDurationSeconds:null}}},o={args:{...e.args,sessionId:"storybook-session-004",initialState:{...t,roundIndex:0,score:0,streak:0}}},s={args:{...e.args,sessionId:"storybook-session-005",initialState:{...t,roundIndex:2,score:2,streak:2}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    config: baseConfig,
    moves: {},
    initialState,
    sessionId: 'storybook-session-001',
    meta: meta_,
    children: <div className="flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground">
        Game component renders here
      </div>
  }
}`,...e.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    sessionId: 'storybook-session-002',
    config: {
      ...baseConfig,
      timerVisible: false,
      timerDurationSeconds: null
    }
  }
}`,...r.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    sessionId: 'storybook-session-004',
    initialState: {
      ...initialState,
      roundIndex: 0,
      score: 0,
      streak: 0
    }
  }
}`,...o.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    sessionId: 'storybook-session-005',
    initialState: {
      ...initialState,
      roundIndex: 2,
      score: 2,
      streak: 2
    }
  }
}`,...s.parameters?.docs?.source}}};const $=["Default","NoTimer","FirstRound","LastRound"];export{e as Default,o as FirstRound,s as LastRound,r as NoTimer,$ as __namedExportsOrder,Z as default};
