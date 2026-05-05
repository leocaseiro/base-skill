import{j as n}from"./iframe-CAEWSvmi.js";import{w as d}from"./withRouter-x-b9_D_D.js";import{G as c}from"./GameShell-BSz-te7S.js";import{D as p,c as l}from"./DbProvider-DEJ__1_O.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CV1EdsY4.js";import"./index-08FBCRDT.js";import"./index-BjEWiSXe.js";import"./useLocation-B0dPkLOf.js";import"./AppMenuPanel-DnEX0u8x.js";import"./label-Dk6-sFqv.js";import"./utils-BQHNewu7.js";import"./index-CpBJC0X9.js";import"./index-Dr_mJ_l1.js";import"./select-DDbm9qzN.js";import"./createLucideIcon-DVbIjV-p.js";import"./index-C9n3jhhu.js";import"./index-BOsptmH7.js";import"./index-D38GDT3P.js";import"./index-3jq1QG4C.js";import"./tslib.es6--Hu8dhvm.js";import"./index-WoF2CkuT.js";import"./slider-CjcdH3lw.js";import"./useSettings-sTItXvGe.js";import"./useRxQuery-E6edSL-h.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-D5stavo_.js";import"./index-BAiAmZeo.js";import"./ThemeToggle-h8KBWCIp.js";import"./sheet-nl25Lbzk.js";import"./button-DuzZvaJl.js";import"./index-sJAzOVPR.js";import"./index-n2dFsQ6C.js";import"./alert-dialog-B6ZP_xpT.js";import"./import-wrapper-prod-B5P97X8t.js";import"./Subject-D3vFcUgp.js";import"./phoneme-codes-BoyU28CG.js";const u=m=>n.jsx(p,{openDatabase:l,children:n.jsx(m,{})}),i={rounds:[{id:"r1",prompt:{en:'What sound does "cat" start with?'},correctAnswer:"c"},{id:"r2",prompt:{en:"What letter comes after A?"},correctAnswer:"b"},{id:"r3",prompt:{en:'Spell "dog"'},correctAnswer:"dog"}]},a={gameId:"word-builder",title:{en:"Word Builder"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},t={phase:"playing",roundIndex:1,score:1,streak:1,retryCount:0,content:i,currentRound:{roundId:"r2",answer:null,hintsUsed:0}},g={profileId:"storybook-user",gameId:"word-builder",gradeBand:"year1-2",seed:"storybook-seed",initialContent:i,initialState:t},Z={component:c,title:"Game/GameShell",tags:["autodocs"],decorators:[u,d],parameters:{layout:"fullscreen"}},e={args:{config:a,moves:{},initialState:t,sessionId:"storybook-session-001",meta:g,children:n.jsx("div",{className:"flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground",children:"Game component renders here"})}},r={args:{...e.args,sessionId:"storybook-session-002",config:{...a,timerVisible:!1,timerDurationSeconds:null}}},o={args:{...e.args,sessionId:"storybook-session-004",initialState:{...t,roundIndex:0,score:0,streak:0}}},s={args:{...e.args,sessionId:"storybook-session-005",initialState:{...t,roundIndex:2,score:2,streak:2}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
