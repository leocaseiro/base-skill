import{j as a}from"./iframe-Cuury9aJ.js";import{w as c}from"./withRouter-CuYoUAlc.js";import{G as p}from"./GameShell-BtHr5V-r.js";import{D as u,c as l}from"./DbProvider-49cOa0A4.js";import"./preload-helper-PPVm8Dsz.js";import"./useNavigate-DhNyl_KA.js";import"./index-BK9DctEk.js";import"./index-D8pCFmne.js";import"./index-BZDN-fz1.js";import"./alert-dialog-VebsJnWu.js";import"./button-AOUGLq-4.js";import"./utils-BQHNewu7.js";import"./index-R0chbkb-.js";import"./index-Cuk6itGw.js";import"./index-DchY7Z8B.js";import"./index-_8S8x0kA.js";import"./index-3p0wp5UQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-BvhP6k_b.js";import"./useRxDB-Eczxk9fr.js";import"./useTranslation-C0OMHReG.js";import"./index-BGBw33xx.js";import"./createLucideIcon-vAdPRVRJ.js";import"./Subject-VZNLZCXQ.js";const g=m=>a.jsx(u,{openDatabase:l,children:a.jsx(m,{})}),d={rounds:[{id:"r1",prompt:{en:'What sound does "cat" start with?'},correctAnswer:"c"},{id:"r2",prompt:{en:"What letter comes after A?"},correctAnswer:"b"},{id:"r3",prompt:{en:'Spell "dog"'},correctAnswer:"dog"}]},i={gameId:"word-builder",title:{en:"Word Builder"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},n={phase:"playing",roundIndex:1,score:1,streak:1,retryCount:0,content:d,currentRound:{roundId:"r2",answer:null,hintsUsed:0}},f={profileId:"storybook-user",gameId:"word-builder",gradeBand:"year1-2",seed:"storybook-seed",initialContent:d,initialState:n},T={component:p,title:"Game/GameShell",tags:["autodocs"],decorators:[g,c],parameters:{layout:"fullscreen"}},e={args:{config:i,moves:{},initialState:n,sessionId:"storybook-session-001",meta:f,children:a.jsx("div",{className:"flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground",children:"Game component renders here"})}},r={args:{...e.args,sessionId:"storybook-session-002",config:{...i,timerVisible:!1,timerDurationSeconds:null}}},o={args:{...e.args,sessionId:"storybook-session-003",config:{...i,maxUndoDepth:0}}},s={args:{...e.args,sessionId:"storybook-session-004",initialState:{...n,roundIndex:0,score:0,streak:0}}},t={args:{...e.args,sessionId:"storybook-session-005",initialState:{...n,roundIndex:2,score:2,streak:2}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
}`,...t.parameters?.docs?.source}}};const O=["Default","NoTimer","NoUndo","FirstRound","LastRound"];export{e as Default,s as FirstRound,t as LastRound,r as NoTimer,o as NoUndo,O as __namedExportsOrder,T as default};
