import{j as s}from"./iframe-Bh2nVCMs.js";import{w as n}from"./withDb-vxhz28xH.js";import{w as p}from"./withRouter-Cosq7kFd.js";import{D as i}from"./DotGroupQuestion-C5OAs4Qm.js";import{A as m}from"./useAnswerGameContext-C3-G3zc8.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-ZCNfSOnL.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-cJCqS7oj.js";import"./index-BfJ4OZfw.js";import"./index-POS1z8_U.js";import"./useGameTTS-JJzXeuVr.js";import"./useSettings-vGJ6tj6b.js";import"./useRxDB-DMNzw4Mg.js";import"./useRxQuery-BSt-ZNkn.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-LTttj4Vo.js";import"./index-BGDalHPA.js";import"./AudioFeedback-DxUgBcwr.js";import"./game-event-bus-CVIPXPct.js";const c={gameId:"storybook",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:1,ttsEnabled:!0},G={component:i,tags:["autodocs"],decorators:[n,p,a=>s.jsx(m,{config:c,children:s.jsx(a,{})})],parameters:{docs:{description:{component:"Renders a group of individually tappable dots. Tapping a dot assigns it the next sequential count (1, 2, 3…), overlays the number on the dot, and speaks the cardinal word aloud. Resets when `count` changes."}}}},o={args:{count:1,prompt:"one"}},r={args:{count:3,prompt:"three"}},t={args:{count:5,prompt:"five"}},e={args:{count:9,prompt:"nine"}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
}`,...e.parameters?.docs?.source}}};const M=["OneDot","ThreeDots","FiveDots","NineDots"];export{t as FiveDots,e as NineDots,o as OneDot,r as ThreeDots,M as __namedExportsOrder,G as default};
