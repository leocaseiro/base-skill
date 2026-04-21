import{j as a}from"./iframe-DEygXkeu.js";import{w as c}from"./withRouter-BkZLgsz6.js";import{G as p}from"./GameShell-BfxBMNbL.js";import{D as u,c as l}from"./DbProvider-Dj1X7qgI.js";import"./preload-helper-PPVm8Dsz.js";import"./index-704n2CJO.js";import"./index-t_Z-1JV_.js";import"./index-gk5iekGs.js";import"./alert-dialog-D3gkKW7S.js";import"./button-BcPwe4UV.js";import"./utils-BQHNewu7.js";import"./index-B9vmWRAa.js";import"./index-BArdXIej.js";import"./index-C17ruVI0.js";import"./index-a7gil0J9.js";import"./index-BRLj5fKB.js";import"./tslib.es6--Hu8dhvm.js";import"./index-DeTcLa0c.js";import"./useRxDB-B4bBehY6.js";import"./useTranslation-D6nfEgDz.js";import"./index-CbOQmIFs.js";import"./createLucideIcon-BlsRn39E.js";import"./Subject-VZNLZCXQ.js";const g=m=>a.jsx(u,{openDatabase:l,children:a.jsx(m,{})}),d={rounds:[{id:"r1",prompt:{en:'What sound does "cat" start with?'},correctAnswer:"c"},{id:"r2",prompt:{en:"What letter comes after A?"},correctAnswer:"b"},{id:"r3",prompt:{en:'Spell "dog"'},correctAnswer:"dog"}]},i={gameId:"word-builder",title:{en:"Word Builder"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},n={phase:"playing",roundIndex:1,score:1,streak:1,retryCount:0,content:d,currentRound:{roundId:"r2",answer:null,hintsUsed:0}},f={profileId:"storybook-user",gameId:"word-builder",gradeBand:"year1-2",seed:"storybook-seed",initialContent:d,initialState:n},L={component:p,title:"Game/GameShell",tags:["autodocs"],decorators:[g,c],parameters:{layout:"fullscreen"}},e={args:{config:i,moves:{},initialState:n,sessionId:"storybook-session-001",meta:f,children:a.jsx("div",{className:"flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground",children:"Game component renders here"})}},r={args:{...e.args,sessionId:"storybook-session-002",config:{...i,timerVisible:!1,timerDurationSeconds:null}}},o={args:{...e.args,sessionId:"storybook-session-003",config:{...i,maxUndoDepth:0}}},s={args:{...e.args,sessionId:"storybook-session-004",initialState:{...n,roundIndex:0,score:0,streak:0}}},t={args:{...e.args,sessionId:"storybook-session-005",initialState:{...n,roundIndex:2,score:2,streak:2}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
    sessionId: 'storybook-session-003',
    config: {
      ...baseConfig,
      maxUndoDepth: 0
    }
  }
}`,...o.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
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
}`,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
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
}`,...t.parameters?.docs?.source}}};const T=["Default","NoTimer","NoUndo","FirstRound","LastRound"];export{e as Default,s as FirstRound,t as LastRound,r as NoTimer,o as NoUndo,T as __namedExportsOrder,L as default};
