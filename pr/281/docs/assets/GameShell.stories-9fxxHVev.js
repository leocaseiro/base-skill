import{j as n}from"./iframe-DENcmwxy.js";import{w as m}from"./withRouter-t2XAHOd1.js";import{G as c}from"./GameShell-rbjXxuiQ.js";import{D as p,c as l}from"./DbProvider-COtAIOwT.js";import"./preload-helper-PPVm8Dsz.js";import"./index-BryY8nQc.js";import"./index-Cn6g4uvH.js";import"./index-H1SId1lY.js";import"./alert-dialog-pZ84rSKW.js";import"./button-D3LTnBp9.js";import"./utils-BQHNewu7.js";import"./index-Yejehrgm.js";import"./index-l68dw2JP.js";import"./index-DdNtMghU.js";import"./index-BghAVljo.js";import"./index-DkftoxYe.js";import"./tslib.es6--Hu8dhvm.js";import"./index-Co5fur2t.js";import"./useRxDB-BDSbB-Ho.js";import"./useTranslation-BoWo1QDS.js";import"./index-D7HijTJC.js";import"./x-BgWWTivX.js";import"./createLucideIcon-tFwzX7q9.js";import"./import-wrapper-prod-WI7wit21.js";import"./Subject-D3vFcUgp.js";import"./phoneme-codes-BoyU28CG.js";const u=d=>n.jsx(p,{openDatabase:l,children:n.jsx(d,{})}),a={rounds:[{id:"r1",prompt:{en:'What sound does "cat" start with?'},correctAnswer:"c"},{id:"r2",prompt:{en:"What letter comes after A?"},correctAnswer:"b"},{id:"r3",prompt:{en:'Spell "dog"'},correctAnswer:"dog"}]},i={gameId:"word-builder",title:{en:"Word Builder"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},t={phase:"playing",roundIndex:1,score:1,streak:1,retryCount:0,content:a,currentRound:{roundId:"r2",answer:null,hintsUsed:0}},g={profileId:"storybook-user",gameId:"word-builder",gradeBand:"year1-2",seed:"storybook-seed",initialContent:a,initialState:t},O={component:c,title:"Game/GameShell",tags:["autodocs"],decorators:[u,m],parameters:{layout:"fullscreen"}},e={args:{config:i,moves:{},initialState:t,sessionId:"storybook-session-001",meta:g,children:n.jsx("div",{className:"flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground",children:"Game component renders here"})}},r={args:{...e.args,sessionId:"storybook-session-002",config:{...i,timerVisible:!1,timerDurationSeconds:null}}},o={args:{...e.args,sessionId:"storybook-session-004",initialState:{...t,roundIndex:0,score:0,streak:0}}},s={args:{...e.args,sessionId:"storybook-session-005",initialState:{...t,roundIndex:2,score:2,streak:2}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
}`,...s.parameters?.docs?.source}}};const P=["Default","NoTimer","FirstRound","LastRound"];export{e as Default,o as FirstRound,s as LastRound,r as NoTimer,P as __namedExportsOrder,O as default};
