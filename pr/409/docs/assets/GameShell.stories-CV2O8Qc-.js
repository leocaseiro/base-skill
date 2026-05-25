import{j as n}from"./iframe-mRk4Vqn9.js";import{w as m}from"./withRouter-dtyHHNoT.js";import{G as c}from"./GameShell-Cy2c-gX2.js";import{D as l,c as u}from"./DbProvider-DlNvR_QX.js";import"./preload-helper-PPVm8Dsz.js";import"./useLocation-C8wqJnJy.js";import"./AppMenuPanel-bUDLEqaC.js";import"./label-YSMoN-8e.js";import"./select-CEACdQcG.js";import"./createLucideIcon-C0nIJoQs.js";import"./index-CSqR3F45.js";import"./index-fHPeR8AH.js";import"./index-DgnD3ECL.js";import"./slider-DiKiFW7a.js";import"./useSettings-D3_7K1Cd.js";import"./useRxQuery-GEnKYJbQ.js";import"./safe-get-voices-dEfMv828.js";import"./voices-CJcKDBWI.js";import"./ThemeToggle-CA7tFLId.js";import"./sheet-CJuuqi0O.js";import"./import-wrapper-prod-B-fJkNvG.js";import"./Subject-xajlhXoF.js";import"./phoneme-codes-BoyU28CG.js";const p=d=>n.jsx(l,{openDatabase:u,children:n.jsx(d,{})}),a={rounds:[{id:"r1",prompt:{en:'What sound does "cat" start with?'},correctAnswer:"c"},{id:"r2",prompt:{en:"What letter comes after A?"},correctAnswer:"b"},{id:"r3",prompt:{en:'Spell "dog"'},correctAnswer:"dog"}]},i={gameId:"word-builder",title:{en:"Word Builder"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},t={phase:"playing",roundIndex:1,score:1,streak:1,retryCount:0,content:a,currentRound:{roundId:"r2",answer:null,hintsUsed:0}},g={profileId:"storybook-user",gameId:"word-builder",gradeBand:"year1-2",seed:"storybook-seed",initialContent:a,initialState:t},L={component:c,title:"Game/GameShell",tags:["autodocs"],decorators:[p,m],parameters:{layout:"fullscreen"}},e={args:{config:i,moves:{},initialState:t,sessionId:"storybook-session-001",meta:g,children:n.jsx("div",{className:"flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground",children:"Game component renders here"})}},r={args:{...e.args,sessionId:"storybook-session-002",config:{...i,timerVisible:!1,timerDurationSeconds:null}}},o={args:{...e.args,sessionId:"storybook-session-004",initialState:{...t,roundIndex:0,score:0,streak:0}}},s={args:{...e.args,sessionId:"storybook-session-005",initialState:{...t,roundIndex:2,score:2,streak:2}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
}`,...s.parameters?.docs?.source}}};const T=["Default","NoTimer","FirstRound","LastRound"];export{e as Default,o as FirstRound,s as LastRound,r as NoTimer,T as __namedExportsOrder,L as default};
