import{w as c}from"./withDb-3nt2ffiC.js";import{w as m}from"./withRouter-Bi61_0z-.js";import{S as p,c as d}from"./SortNumbers-CRL4Uehw.js";import{a as u}from"./iframe-CysCsZeq.js";import"./DbProvider-BfXJ66bT.js";import"./import-wrapper-prod-DTHZdadV.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./index-DfJooSNM.js";import"./index-BrlUyA4v.js";import"./index-DuYNeE3_.js";import"./SortNumbersTileBank-cXLi-uXi.js";import"./useDraggableTile-DoJlyEeF.js";import"./AnswerGameProvider-ykGH1DGb.js";import"./AudioFeedback-DxUgBcwr.js";import"./useGameTTS-CCUpiiKO.js";import"./useSettings-EFrmnmf_.js";import"./useRxDB-IkdUIFFW.js";import"./useRxQuery-DNbmKJXr.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-CrpO01Cs.js";import"./index-H9yaFe11.js";import"./tile-font-DQ9RrPM_.js";import"./AnswerGame-BfIFbf-q.js";import"./ProgressHUD-V-eQV6co.js";import"./GameOverOverlay-DAbfubqx.js";import"./confetti.module-oQXWb4Lk.js";import"./LevelCompleteOverlay-DmFdhK5t.js";import"./ScoreAnimation-B9d0iRqP.js";import"./SlotRow-CfghTSs1.js";import"./build-round-order-DFcE7K-C.js";import"./preload-helper-PPVm8Dsz.js";const g={id:"demo",name:"Demo Pink",tokens:{"--skin-tile-bg":"#ec4899","--skin-tile-text":"#fff","--skin-tile-radius":"50%","--skin-slot-bg":"#fdf2f8","--skin-slot-border":"#f472b6","--skin-slot-radius":"50%"},onCorrectPlace:(o,t)=>{console.log(`[sort-numbers demo] correct @ ${o}: ${t}`)},onWrongPlace:(o,t)=>{console.log(`[sort-numbers demo] wrong @ ${o}: ${t}`)}};u("sort-numbers",g);const r=(o,t="playing")=>({allTiles:[{id:"tile-3",label:"3",value:"3"},{id:"tile-4",label:"4",value:"4"},{id:"tile-5",label:"5",value:"5"}],bankTileIds:["tile-3","tile-4","tile-5"],zones:[{id:"z0",index:0,expectedValue:"3",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z1",index:1,expectedValue:"4",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z2",index:2,expectedValue:"5",placedTileId:null,isWrong:!1,isLocked:!1}],activeSlotIndex:0,phase:t,roundIndex:0,retryCount:0,levelIndex:o}),e={gameId:"sort-numbers",component:"SortNumbers",inputMethod:"drag",wrongTileBehavior:"lock-manual",tileBankMode:"exact",totalRounds:1,roundsInOrder:!0,ttsEnabled:!1,direction:"ascending",range:{min:3,max:15},quantity:3,skip:{mode:"consecutive"},distractors:{source:"random",count:0},rounds:[{sequence:[3,4,5]}],levelMode:{generateNextLevel:d({start:3,step:1,quantity:3,direction:"ascending"})}},f={...e,levelMode:{maxLevels:5,generateNextLevel:d({start:3,step:1,quantity:3,direction:"ascending"})},hud:{showDots:!0,showFraction:!0,showLevel:!0}},Q={title:"Games/SortNumbers/Skin Harness",component:p,tags:["autodocs"],decorators:[c,m],args:{config:e}},s={args:{config:e,initialState:r(0),seed:"storybook"}},i={args:{config:e,initialState:r(2),seed:"storybook"}},a={args:{config:e,initialState:r(9),seed:"storybook"}},n={args:{config:e,initialState:r(2,"round-complete"),seed:"storybook"}},l={args:{config:f,initialState:r(2),seed:"storybook"}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    config: levelModeConfig,
    initialState: levelDraftState(0),
    seed: 'storybook'
  }
}`,...s.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    config: levelModeConfig,
    initialState: levelDraftState(2),
    seed: 'storybook'
  }
}`,...i.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    config: levelModeConfig,
    initialState: levelDraftState(9),
    seed: 'storybook'
  }
}`,...a.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    config: levelModeConfig,
    initialState: levelDraftState(2, 'round-complete'),
    seed: 'storybook'
  }
}`,...n.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    config: mixedModeConfig,
    initialState: levelDraftState(2),
    seed: 'storybook'
  }
}`,...l.parameters?.docs?.source}}};const U=["LevelMode_Level1","LevelMode_Level3","LevelMode_Level10","LevelMode_LevelCompletePop","Mixed_LevelPlusFraction"];export{s as LevelMode_Level1,a as LevelMode_Level10,i as LevelMode_Level3,n as LevelMode_LevelCompletePop,l as Mixed_LevelPlusFraction,U as __namedExportsOrder,Q as default};
