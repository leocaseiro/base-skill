import{j as s}from"./iframe-DJ49dp_J.js";import{w as n}from"./withDb-CBFgPlNV.js";import{w as p}from"./withRouter-nDmCF5eB.js";import{D as i}from"./DotGroupQuestion-BWdVPf1G.js";import{A as m}from"./AnswerGameProvider-BWkR77dg.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-Cx7dhMJV.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./index-DIC2Zlt0.js";import"./index-BP_rAzKv.js";import"./index-DMu8MIO_.js";import"./useGameTTS-B7uUSh5u.js";import"./useSettings-BnUrFHn1.js";import"./useRxDB-DQGMufIt.js";import"./useRxQuery-Bj4p7xb6.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-BvLi40tJ.js";import"./index-DeRugjLv.js";import"./AudioFeedback-DxUgBcwr.js";const c={gameId:"storybook",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:1,ttsEnabled:!0},F={component:i,tags:["autodocs"],decorators:[n,p,a=>s.jsx(m,{config:c,children:s.jsx(a,{})})],parameters:{docs:{description:{component:"Renders a group of individually tappable dots. Tapping a dot assigns it the next sequential count (1, 2, 3…), overlays the number on the dot, and speaks the cardinal word aloud. Resets when `count` changes."}}}},o={args:{count:1,prompt:"one"}},r={args:{count:3,prompt:"three"}},t={args:{count:5,prompt:"five"}},e={args:{count:9,prompt:"nine"}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
}`,...e.parameters?.docs?.source}}};const G=["OneDot","ThreeDots","FiveDots","NineDots"];export{t as FiveDots,e as NineDots,o as OneDot,r as ThreeDots,G as __namedExportsOrder,F as default};
