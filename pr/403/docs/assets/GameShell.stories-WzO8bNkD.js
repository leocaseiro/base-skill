import{j as n}from"./iframe-0-GSJzeg.js";import{w as m}from"./withRouter-DoLiTwy9.js";import{G as c}from"./GameShell-GUFgcviG.js";import{D as l,c as u}from"./DbProvider-BJC3qxgn.js";import"./preload-helper-PPVm8Dsz.js";import"./useLocation-DaJRTpPL.js";import"./AppMenuPanel-BDnkylIX.js";import"./label-BubaWrN_.js";import"./select-COac5hXN.js";import"./createLucideIcon-CfamiaXJ.js";import"./index-JA-XCA5X.js";import"./index-DakkvhNL.js";import"./index-BD0XmY5v.js";import"./slider-B_BvItQb.js";import"./useRxDB-CbRJrFxv.js";import"./useRxQuery-D38pxxTt.js";import"./useSettings-D7958JlZ.js";import"./safe-get-voices-dEfMv828.js";import"./voices-CJcKDBWI.js";import"./ThemeToggle-5xyqpMpZ.js";import"./sheet-DRyw58aR.js";import"./import-wrapper-prod-DB10rr0d.js";import"./Subject-B092pkfK.js";import"./phoneme-codes-BoyU28CG.js";const p=d=>n.jsx(l,{openDatabase:u,children:n.jsx(d,{})}),a={rounds:[{id:"r1",prompt:{en:'What sound does "cat" start with?'},correctAnswer:"c"},{id:"r2",prompt:{en:"What letter comes after A?"},correctAnswer:"b"},{id:"r3",prompt:{en:'Spell "dog"'},correctAnswer:"dog"}]},i={gameId:"word-builder",title:{en:"Word Builder"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},t={phase:"playing",roundIndex:1,score:1,streak:1,retryCount:0,content:a,currentRound:{roundId:"r2",answer:null,hintsUsed:0}},g={profileId:"storybook-user",gameId:"word-builder",gradeBand:"year1-2",seed:"storybook-seed",initialContent:a,initialState:t},T={component:c,title:"Game/GameShell",tags:["autodocs"],decorators:[p,m],parameters:{layout:"fullscreen"}},e={args:{config:i,moves:{},initialState:t,sessionId:"storybook-session-001",meta:g,children:n.jsx("div",{className:"flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground",children:"Game component renders here"})}},r={args:{...e.args,sessionId:"storybook-session-002",config:{...i,timerVisible:!1,timerDurationSeconds:null}}},o={args:{...e.args,sessionId:"storybook-session-004",initialState:{...t,roundIndex:0,score:0,streak:0}}},s={args:{...e.args,sessionId:"storybook-session-005",initialState:{...t,roundIndex:2,score:2,streak:2}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
}`,...s.parameters?.docs?.source}}};const U=["Default","NoTimer","FirstRound","LastRound"];export{e as Default,o as FirstRound,s as LastRound,r as NoTimer,U as __namedExportsOrder,T as default};
