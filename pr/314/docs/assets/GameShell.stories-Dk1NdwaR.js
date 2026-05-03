import{j as n}from"./iframe-B4y-rYw4.js";import{w as d}from"./withRouter-BTv5S7Xb.js";import{G as c}from"./GameShell-DD9Ba1_t.js";import{D as p,c as l}from"./DbProvider-B79CWe2T.js";import"./preload-helper-PPVm8Dsz.js";import"./index-lnIEzAmi.js";import"./index-NipIdMy_.js";import"./index-D8UJCyhD.js";import"./useLocation-D-Yw1yPJ.js";import"./AppMenuPanel-CjU28rv4.js";import"./label-CQsNjag4.js";import"./utils-BQHNewu7.js";import"./index-9NK6RW7J.js";import"./index-BklmNhB7.js";import"./select-DT6PAx51.js";import"./createLucideIcon-DnBhttRf.js";import"./index-CdSY92V_.js";import"./index-DNlcuuVN.js";import"./index-CKKQE6f-.js";import"./index-Ce2l1Ode.js";import"./tslib.es6--Hu8dhvm.js";import"./index-BO34Hf1f.js";import"./slider-BAVxuPJG.js";import"./useSettings-D5FPYf0G.js";import"./useRxQuery-D55c_tvI.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-DlKGlnSb.js";import"./index-DyU1-vkJ.js";import"./ThemeToggle-1Sazg_K_.js";import"./sheet-wS9BGiku.js";import"./button-DZZb0U1z.js";import"./index-Ck_SKE1P.js";import"./index-w7fQ3q6M.js";import"./alert-dialog-DvrLz1PG.js";import"./import-wrapper-prod-RqGNe2ih.js";import"./Subject-D3vFcUgp.js";import"./phoneme-codes-BoyU28CG.js";const u=m=>n.jsx(p,{openDatabase:l,children:n.jsx(m,{})}),i={rounds:[{id:"r1",prompt:{en:'What sound does "cat" start with?'},correctAnswer:"c"},{id:"r2",prompt:{en:"What letter comes after A?"},correctAnswer:"b"},{id:"r3",prompt:{en:'Spell "dog"'},correctAnswer:"dog"}]},a={gameId:"word-builder",title:{en:"Word Builder"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},t={phase:"playing",roundIndex:1,score:1,streak:1,retryCount:0,content:i,currentRound:{roundId:"r2",answer:null,hintsUsed:0}},g={profileId:"storybook-user",gameId:"word-builder",gradeBand:"year1-2",seed:"storybook-seed",initialContent:i,initialState:t},Z={component:c,title:"Game/GameShell",tags:["autodocs"],decorators:[u,d],parameters:{layout:"fullscreen"}},e={args:{config:a,moves:{},initialState:t,sessionId:"storybook-session-001",meta:g,children:n.jsx("div",{className:"flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground",children:"Game component renders here"})}},r={args:{...e.args,sessionId:"storybook-session-002",config:{...a,timerVisible:!1,timerDurationSeconds:null}}},o={args:{...e.args,sessionId:"storybook-session-004",initialState:{...t,roundIndex:0,score:0,streak:0}}},s={args:{...e.args,sessionId:"storybook-session-005",initialState:{...t,roundIndex:2,score:2,streak:2}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
