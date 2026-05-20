import{j as n}from"./iframe-YQA6eRLa.js";import{w as d}from"./withRouter-BiB6vKvj.js";import{G as c}from"./GameShell-jYp5yFe5.js";import{D as p,c as l}from"./DbProvider-CnD1BQCu.js";import"./preload-helper-PPVm8Dsz.js";import"./index-DGipcC82.js";import"./index-DntyiQq6.js";import"./index-ziWLFWO-.js";import"./useLocation-CGUOh7Jl.js";import"./AppMenuPanel-DPDixZRi.js";import"./label-DXq0dFsK.js";import"./utils-BQHNewu7.js";import"./index-gky34W4W.js";import"./index-gvPrydUD.js";import"./select-B-qDdAPz.js";import"./createLucideIcon-Csztin2X.js";import"./index-BFLMfwks.js";import"./index-DnJrzhdH.js";import"./index-NvEseMO1.js";import"./index-DRY7KSFu.js";import"./tslib.es6--Hu8dhvm.js";import"./index-309nrDc7.js";import"./slider-CaSwNkOK.js";import"./useSettings-lMcR4PPt.js";import"./useRxQuery-Gt4UfIl-.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-0zKpC3fa.js";import"./index-BgT1qoO7.js";import"./ThemeToggle-BE0D7ZK9.js";import"./sheet-cq5C3iY0.js";import"./button-C7cStSuE.js";import"./index-fD6SMTZP.js";import"./index-b3qZWg9_.js";import"./alert-dialog-BXAVnvA4.js";import"./import-wrapper-prod-BuL2EkNM.js";import"./Subject-D3vFcUgp.js";import"./phoneme-codes-BoyU28CG.js";const u=m=>n.jsx(p,{openDatabase:l,children:n.jsx(m,{})}),i={rounds:[{id:"r1",prompt:{en:'What sound does "cat" start with?'},correctAnswer:"c"},{id:"r2",prompt:{en:"What letter comes after A?"},correctAnswer:"b"},{id:"r3",prompt:{en:'Spell "dog"'},correctAnswer:"dog"}]},a={gameId:"word-builder",title:{en:"Word Builder"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},t={phase:"playing",roundIndex:1,score:1,streak:1,retryCount:0,content:i,currentRound:{roundId:"r2",answer:null,hintsUsed:0}},g={profileId:"storybook-user",gameId:"word-builder",gradeBand:"year1-2",seed:"storybook-seed",initialContent:i,initialState:t},Z={component:c,title:"Game/GameShell",tags:["autodocs"],decorators:[u,d],parameters:{layout:"fullscreen"}},e={args:{config:a,moves:{},initialState:t,sessionId:"storybook-session-001",meta:g,children:n.jsx("div",{className:"flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground",children:"Game component renders here"})}},r={args:{...e.args,sessionId:"storybook-session-002",config:{...a,timerVisible:!1,timerDurationSeconds:null}}},o={args:{...e.args,sessionId:"storybook-session-004",initialState:{...t,roundIndex:0,score:0,streak:0}}},s={args:{...e.args,sessionId:"storybook-session-005",initialState:{...t,roundIndex:2,score:2,streak:2}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
