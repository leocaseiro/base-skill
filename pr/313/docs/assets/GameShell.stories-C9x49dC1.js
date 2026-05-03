import{j as n}from"./iframe-C5akX49D.js";import{w as d}from"./withRouter-D61BGl1w.js";import{G as c}from"./GameShell-DpFwANkH.js";import{D as p,c as l}from"./DbProvider-D7AllGYI.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CjhX0z_G.js";import"./index-C8A-Ag7x.js";import"./index-CVaWQK8C.js";import"./useLocation-BxQMVA5W.js";import"./AppMenuPanel-DOBY-SeD.js";import"./label-Bm7F8QmX.js";import"./utils-BQHNewu7.js";import"./index-BGkFcfg-.js";import"./index-CoJts1Lr.js";import"./select-vbqNg7xM.js";import"./createLucideIcon-BJGFLnPA.js";import"./index-Dg3Dh_Z0.js";import"./index-BCPAtIU0.js";import"./index-DcSo4Pyn.js";import"./index-B-1dLarV.js";import"./tslib.es6--Hu8dhvm.js";import"./index-CUrrRh8j.js";import"./slider-BRJZV-RV.js";import"./useSettings--5R5Lpyf.js";import"./useRxQuery-CU4MPHNm.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-48xDQ9PM.js";import"./index-2iWlHLFK.js";import"./ThemeToggle-BQRKviBs.js";import"./sheet-mkhoP2fY.js";import"./button-C9U9My8Y.js";import"./index-BGEvg-yp.js";import"./index-BT6mqOyY.js";import"./alert-dialog-8fO3aqfu.js";import"./import-wrapper-prod-Dbu36QXi.js";import"./Subject-D3vFcUgp.js";import"./phoneme-codes-BoyU28CG.js";const u=m=>n.jsx(p,{openDatabase:l,children:n.jsx(m,{})}),i={rounds:[{id:"r1",prompt:{en:'What sound does "cat" start with?'},correctAnswer:"c"},{id:"r2",prompt:{en:"What letter comes after A?"},correctAnswer:"b"},{id:"r3",prompt:{en:'Spell "dog"'},correctAnswer:"dog"}]},a={gameId:"word-builder",title:{en:"Word Builder"},gradeBand:"year1-2",maxRounds:3,maxRetries:1,maxUndoDepth:3,timerVisible:!0,timerDurationSeconds:60,difficulty:"medium"},t={phase:"playing",roundIndex:1,score:1,streak:1,retryCount:0,content:i,currentRound:{roundId:"r2",answer:null,hintsUsed:0}},g={profileId:"storybook-user",gameId:"word-builder",gradeBand:"year1-2",seed:"storybook-seed",initialContent:i,initialState:t},Z={component:c,title:"Game/GameShell",tags:["autodocs"],decorators:[u,d],parameters:{layout:"fullscreen"}},e={args:{config:a,moves:{},initialState:t,sessionId:"storybook-session-001",meta:g,children:n.jsx("div",{className:"flex h-full items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground",children:"Game component renders here"})}},r={args:{...e.args,sessionId:"storybook-session-002",config:{...a,timerVisible:!1,timerDurationSeconds:null}}},o={args:{...e.args,sessionId:"storybook-session-004",initialState:{...t,roundIndex:0,score:0,streak:0}}},s={args:{...e.args,sessionId:"storybook-session-005",initialState:{...t,roundIndex:2,score:2,streak:2}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
