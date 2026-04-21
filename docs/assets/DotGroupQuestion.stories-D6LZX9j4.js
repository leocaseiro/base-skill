import{j as s}from"./iframe-BghZ4noO.js";import{w as n}from"./withDb-CswySURM.js";import{w as p}from"./withRouter-DjFxwtL8.js";import{D as i}from"./DotGroupQuestion-C7zkkV5V.js";import{A as m}from"./AnswerGameProvider-C8ckD3ZC.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-DsdlN_Vg.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-CRxm9-Dg.js";import"./index-CFHDRp5w.js";import"./index-GqcMVl5b.js";import"./useGameTTS-BaNMYFz4.js";import"./useSettings-75u9Q0Fe.js";import"./useRxDB-wy2wJFOD.js";import"./useRxQuery-CEi1FyWV.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-BOlqXbcp.js";import"./index-B71LDoJG.js";import"./AudioFeedback-DxUgBcwr.js";import"./game-event-bus-CVIPXPct.js";import"./SkinHarness-CaDs21Fc.js";const c={gameId:"storybook",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:1,ttsEnabled:!0},M={component:i,tags:["autodocs"],decorators:[n,p,a=>s.jsx(m,{config:c,children:s.jsx(a,{})})],parameters:{docs:{description:{component:"Renders a group of individually tappable dots. Tapping a dot assigns it the next sequential count (1, 2, 3…), overlays the number on the dot, and speaks the cardinal word aloud. Resets when `count` changes."}}}},o={args:{count:1,prompt:"one"}},r={args:{count:3,prompt:"three"}},t={args:{count:5,prompt:"five"}},e={args:{count:9,prompt:"nine"}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
}`,...e.parameters?.docs?.source}}};const N=["OneDot","ThreeDots","FiveDots","NineDots"];export{t as FiveDots,e as NineDots,o as OneDot,r as ThreeDots,N as __namedExportsOrder,M as default};
