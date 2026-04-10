import{j as a}from"./iframe-D3E2on1e.js";import{w as c}from"./withRouter-CQEnqSzx.js";import{G as p}from"./GameShell-CuXdMaQL.js";import{D as u,c as l}from"./DbProvider-BX52Cuwf.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CgHij0PC.js";import"./index-DxOaURgz.js";import"./index-DfSaqrFa.js";import"./alert-dialog-DCXwAeBc.js";import"./button-CE0DsxTO.js";import"./utils-BQHNewu7.js";import"./index-D-ToKy1v.js";import"./index-B_i3B5OE.js";import"./index-CaSvRoGJ.js";import"./index-DxTdSEGG.js";import"./index--VAZCFdf.js";import"./tslib.es6--Hu8dhvm.js";import"./index-BishTl-d.js";import"./useRxDB-DbMJKqeJ.js";import"./GameRoundContext-TWIScEwh.js";import"./game-event-bus-CVIPXPct.js";import"./useTranslation-CpZa6q_3.js";import"./createLucideIcon-jK3dvFMe.js";import"./index.browser-BY9c7rfI.js";import"./Subject-VZNLZCXQ.js";const g=m=>a.jsx(u,{openDatabase:l,children:a.jsx(m,{})}),d={rounds:[{id:"r1",prompt:{en:'What sound does "cat" start with?'},correctAnswer:"c"},{id:"r2",prompt:{en:"What letter comes after A?"},correctAnswer:"b"},{id:"r3",prompt:{en:'Spell "dog"'},correctAnswer:"dog"}]},i={gameId:"word-builder",title:{en:"Word Builder"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},n={phase:"playing",roundIndex:1,score:1,streak:1,retryCount:0,content:d,currentRound:{roundId:"r2",answer:null,hintsUsed:0}},f={profileId:"storybook-user",gameId:"word-builder",gradeBand:"year1-2",seed:"storybook-seed",initialContent:d,initialState:n},O={component:p,title:"Game/GameShell",tags:["autodocs"],decorators:[g,c],parameters:{layout:"fullscreen"}},e={args:{config:i,moves:{},initialState:n,sessionId:"storybook-session-001",meta:f,children:a.jsx("div",{className:"flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground",children:"Game component renders here"})}},r={args:{...e.args,sessionId:"storybook-session-002",config:{...i,timerVisible:!1,timerDurationSeconds:null}}},o={args:{...e.args,sessionId:"storybook-session-003",config:{...i,maxUndoDepth:0}}},s={args:{...e.args,sessionId:"storybook-session-004",initialState:{...n,roundIndex:0,score:0,streak:0}}},t={args:{...e.args,sessionId:"storybook-session-005",initialState:{...n,roundIndex:2,score:2,streak:2}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
}`,...t.parameters?.docs?.source}}};const P=["Default","NoTimer","NoUndo","FirstRound","LastRound"];export{e as Default,s as FirstRound,t as LastRound,r as NoTimer,o as NoUndo,P as __namedExportsOrder,O as default};
