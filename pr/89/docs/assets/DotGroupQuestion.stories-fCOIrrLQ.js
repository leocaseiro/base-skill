import{j as s}from"./iframe-xA6l9xIU.js";import{w as n}from"./withDb-CcPmii4A.js";import{w as p}from"./withRouter-Dp-fFGx1.js";import{D as i}from"./DotGroupQuestion-TFSgWkWx.js";import{A as m}from"./AnswerGameProvider-qeotfXlM.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-ip0jEsZ2.js";import"./index.browser-BY9c7rfI.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-DkrjuWHI.js";import"./index-Bl-EpwPa.js";import"./index-BTPRZIpn.js";import"./useGameTTS-05iZxlum.js";import"./useSettings-Ht5HnVaI.js";import"./useRxDB-Bk8oTeep.js";import"./useRxQuery-DkuNd0I8.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-CnpZ9eqn.js";import"./index-CS9SnNBb.js";import"./AudioFeedback-cxEhBYIg.js";import"./game-event-bus-CVIPXPct.js";import"./GameRoundContext-DWGa559f.js";const c={gameId:"storybook",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:1,ttsEnabled:!0},N={component:i,tags:["autodocs"],decorators:[n,p,a=>s.jsx(m,{config:c,children:s.jsx(a,{})})],parameters:{docs:{description:{component:"Renders a group of individually tappable dots. Tapping a dot assigns it the next sequential count (1, 2, 3…), overlays the number on the dot, and speaks the cardinal word aloud. Resets when `count` changes."}}}},o={args:{count:1,prompt:"one"}},r={args:{count:3,prompt:"three"}},t={args:{count:5,prompt:"five"}},e={args:{count:9,prompt:"nine"}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    count: 1,
    prompt: 'one'
  }
}`,...o.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    count: 3,
    prompt: 'three'
  }
}`,...r.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    count: 5,
    prompt: 'five'
  }
}`,...t.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    count: 9,
    prompt: 'nine'
  }
}`,...e.parameters?.docs?.source}}};const _=["OneDot","ThreeDots","FiveDots","NineDots"];export{t as FiveDots,e as NineDots,o as OneDot,r as ThreeDots,_ as __namedExportsOrder,N as default};
