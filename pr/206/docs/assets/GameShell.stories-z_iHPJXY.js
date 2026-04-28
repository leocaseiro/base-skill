import{j as n}from"./iframe-3HHHowl1.js";import{w as m}from"./withRouter-BjCXHutF.js";import{G as c}from"./GameShell-CsfJkX4F.js";import{D as l,c as p}from"./DbProvider-XQ5CSzwT.js";import"./preload-helper-PPVm8Dsz.js";import"./index-B13VYqSC.js";import"./index-DMP2htFI.js";import"./index-DWWCHwp0.js";import"./alert-dialog-lF68damP.js";import"./button-DwOsfH_t.js";import"./utils-BQHNewu7.js";import"./index-BOnJvLCr.js";import"./index-C1kpP0t0.js";import"./index-D41FT0Qz.js";import"./index-DZeR2XCx.js";import"./index-BqkuSnrQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-CD-osv53.js";import"./useRxDB-MoU7ZIN9.js";import"./useTranslation-hylQwxLp.js";import"./index-BFVsTiJV.js";import"./x-JwM-5Jc7.js";import"./createLucideIcon-COD8Jsmy.js";import"./import-wrapper-prod-DbLzDpYq.js";import"./Subject-D3vFcUgp.js";const u=d=>n.jsx(l,{openDatabase:p,children:n.jsx(d,{})}),a={rounds:[{id:"r1",prompt:{en:'What sound does "cat" start with?'},correctAnswer:"c"},{id:"r2",prompt:{en:"What letter comes after A?"},correctAnswer:"b"},{id:"r3",prompt:{en:'Spell "dog"'},correctAnswer:"dog"}]},i={gameId:"word-builder",title:{en:"Word Builder"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},t={phase:"playing",roundIndex:1,score:1,streak:1,retryCount:0,content:a,currentRound:{roundId:"r2",answer:null,hintsUsed:0}},g={profileId:"storybook-user",gameId:"word-builder",gradeBand:"year1-2",seed:"storybook-seed",initialContent:a,initialState:t},U={component:c,title:"Game/GameShell",tags:["autodocs"],decorators:[u,m],parameters:{layout:"fullscreen"}},e={args:{config:i,moves:{},initialState:t,sessionId:"storybook-session-001",meta:g,children:n.jsx("div",{className:"flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground",children:"Game component renders here"})}},r={args:{...e.args,sessionId:"storybook-session-002",config:{...i,timerVisible:!1,timerDurationSeconds:null}}},o={args:{...e.args,sessionId:"storybook-session-004",initialState:{...t,roundIndex:0,score:0,streak:0}}},s={args:{...e.args,sessionId:"storybook-session-005",initialState:{...t,roundIndex:2,score:2,streak:2}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
}`,...s.parameters?.docs?.source}}};const O=["Default","NoTimer","FirstRound","LastRound"];export{e as Default,o as FirstRound,s as LastRound,r as NoTimer,O as __namedExportsOrder,U as default};
