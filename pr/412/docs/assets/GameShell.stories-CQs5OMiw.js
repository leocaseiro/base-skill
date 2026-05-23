import{j as n}from"./iframe-DQPhJkAL.js";import{w as m}from"./withRouter-CoTLV3g5.js";import{G as c}from"./GameShell-CBsTkvCh.js";import{D as p,c as l}from"./DbProvider-Dml3HN4j.js";import"./preload-helper-PPVm8Dsz.js";import"./index-DZV47jQM.js";import"./index-CHlaCmOK.js";import"./index-CL1GXndm.js";import"./useLocation-BujO4RL-.js";import"./AppMenuPanel-BUIWdvz6.js";import"./label-DxAYoNRW.js";import"./utils-BQHNewu7.js";import"./index-C8-MGXI6.js";import"./index-CyJRJLHs.js";import"./select-Byat4wjH.js";import"./createLucideIcon-Cy9Exb_I.js";import"./index-S8e6DkYz.js";import"./index-OA1efa-K.js";import"./index-B8tOScBc.js";import"./index-DMrOSMpi.js";import"./tslib.es6--Hu8dhvm.js";import"./index-Da6SWxMy.js";import"./slider-DL9q61n4.js";import"./useSettings-BhSRyuTv.js";import"./useRxQuery-DKNfE-Bo.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-CbHyd0gu.js";import"./index-Cm2bcFEe.js";import"./sheet-CF3xnIf0.js";import"./button-BNvJi1mB.js";import"./index-8Uzn8b8o.js";import"./index-DbSQP3D0.js";import"./alert-dialog-DbUPHSBU.js";import"./import-wrapper-prod-DPKbKiVY.js";import"./Subject-D3vFcUgp.js";import"./phoneme-codes-BoyU28CG.js";const u=d=>n.jsx(p,{openDatabase:l,children:n.jsx(d,{})}),i={rounds:[{id:"r1",prompt:{en:'What sound does "cat" start with?'},correctAnswer:"c"},{id:"r2",prompt:{en:"What letter comes after A?"},correctAnswer:"b"},{id:"r3",prompt:{en:'Spell "dog"'},correctAnswer:"dog"}]},a={gameId:"word-builder",title:{en:"Word Builder"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},t={phase:"playing",roundIndex:1,score:1,streak:1,retryCount:0,content:i,currentRound:{roundId:"r2",answer:null,hintsUsed:0}},g={profileId:"storybook-user",gameId:"word-builder",gradeBand:"year1-2",seed:"storybook-seed",initialContent:i,initialState:t},Y={component:c,title:"Game/GameShell",tags:["autodocs"],decorators:[u,m],parameters:{layout:"fullscreen"}},e={args:{config:a,moves:{},initialState:t,sessionId:"storybook-session-001",meta:g,children:n.jsx("div",{className:"flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground",children:"Game component renders here"})}},r={args:{...e.args,sessionId:"storybook-session-002",config:{...a,timerVisible:!1,timerDurationSeconds:null}}},o={args:{...e.args,sessionId:"storybook-session-004",initialState:{...t,roundIndex:0,score:0,streak:0}}},s={args:{...e.args,sessionId:"storybook-session-005",initialState:{...t,roundIndex:2,score:2,streak:2}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
}`,...s.parameters?.docs?.source}}};const Z=["Default","NoTimer","FirstRound","LastRound"];export{e as Default,o as FirstRound,s as LastRound,r as NoTimer,Z as __namedExportsOrder,Y as default};
