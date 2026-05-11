import{j as n}from"./iframe-CfmIwo0P.js";import{w as d}from"./withRouter-CpOPqYcO.js";import{G as c}from"./GameShell-icR4m2Td.js";import{D as p,c as l}from"./DbProvider-DL0wn70f.js";import"./preload-helper-PPVm8Dsz.js";import"./index-pbS9rl9i.js";import"./index-Dw2Hy8Xu.js";import"./index-CoT0OmmR.js";import"./useLocation-DF36L7CP.js";import"./AppMenuPanel-C3zsXiUS.js";import"./label-DBg7z2Qx.js";import"./utils-BQHNewu7.js";import"./index-D2iU8PQ4.js";import"./index-DUhS4rw2.js";import"./select-UGWW6mlW.js";import"./createLucideIcon-MHQl_r92.js";import"./index-B2XRJZdZ.js";import"./index-B_h64vGq.js";import"./index-B5blkQU0.js";import"./index-DewF2_FN.js";import"./tslib.es6--Hu8dhvm.js";import"./index-buhgHduy.js";import"./slider-g_ZIBGHJ.js";import"./useSettings-BqubzAF3.js";import"./useRxQuery-pWvDOiWs.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-Orw60ncX.js";import"./index-UkRfsnBl.js";import"./ThemeToggle-DTk9t2nP.js";import"./sheet-BuO-VhmO.js";import"./button-tx2IHbCw.js";import"./x-CgaDp-Qg.js";import"./index-4biEiadf.js";import"./index-DQ_ZF71z.js";import"./menu-hEWT6k47.js";import"./alert-dialog-Dfjsdq1d.js";import"./maximize-BsG0cs84.js";import"./import-wrapper-prod-MHkhcHN6.js";import"./Subject-D3vFcUgp.js";import"./phoneme-codes-BoyU28CG.js";const u=m=>n.jsx(p,{openDatabase:l,children:n.jsx(m,{})}),i={rounds:[{id:"r1",prompt:{en:'What sound does "cat" start with?'},correctAnswer:"c"},{id:"r2",prompt:{en:"What letter comes after A?"},correctAnswer:"b"},{id:"r3",prompt:{en:'Spell "dog"'},correctAnswer:"dog"}]},a={gameId:"word-builder",title:{en:"Word Builder"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},s={phase:"playing",roundIndex:1,score:1,streak:1,retryCount:0,content:i,currentRound:{roundId:"r2",answer:null,hintsUsed:0}},g={profileId:"storybook-user",gameId:"word-builder",gradeBand:"year1-2",seed:"storybook-seed",initialContent:i,initialState:s},er={component:c,title:"Game/GameShell",tags:["autodocs"],decorators:[u,d],parameters:{layout:"fullscreen"}},r={args:{config:a,moves:{},initialState:s,sessionId:"storybook-session-001",meta:g,children:n.jsx("div",{className:"flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground",children:"Game component renders here"})}},e={args:{...r.args,sessionId:"storybook-session-002",config:{...a,timerVisible:!1,timerDurationSeconds:null}}},o={args:{...r.args,sessionId:"storybook-session-004",initialState:{...s,roundIndex:0,score:0,streak:0}}},t={args:{...r.args,sessionId:"storybook-session-005",initialState:{...s,roundIndex:2,score:2,streak:2}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
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
}`,...r.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    ...Default.args,
    sessionId: 'storybook-session-002',
    config: {
      ...baseConfig,
      timerVisible: false,
      timerDurationSeconds: null
    }
  }
}`,...e.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
}`,...o.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
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
}`,...t.parameters?.docs?.source}}};const or=["Default","NoTimer","FirstRound","LastRound"];export{r as Default,o as FirstRound,t as LastRound,e as NoTimer,or as __namedExportsOrder,er as default};
