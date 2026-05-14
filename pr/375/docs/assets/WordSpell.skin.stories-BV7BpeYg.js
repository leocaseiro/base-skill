import{j as i,S as s,a as p}from"./iframe-Uu_OhEUx.js";import{w as m}from"./withDb-CSICD0a_.js";import{w as c}from"./withRouter-BnTXHEW6.js";import{d as u}from"./dragon-cave-skin-Cw44ZHDN.js";import{W as g}from"./WordSpell-BuDjXa9e.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-oymJEqq-.js";import"./import-wrapper-prod-Dn7Q-GhT.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-DHX8mZuZ.js";import"./index-CwlCWWVw.js";import"./index-D9Ltvs94.js";import"./index-CQLwOV16.js";import"./useGameEngine-DF0dV6yD.js";import"./AnswerGameProvider-DxbhXq4y.js";import"./AudioFeedback--m-fHcTR.js";import"./useGameTTS-Dk377LZE.js";import"./useSettings-0ufvkU_0.js";import"./useRxQuery-CtRCRyji.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-CwFYS9Qr.js";import"./index-BWZNsOt6.js";import"./LetterTileBank-D9iasQU4.js";import"./styles-Cu2jWhUp.js";import"./useDraggableTile-CUob91Rl.js";import"./filter-CNK_KXfV.js";import"./seen-words-DcIHDtfq.js";import"./seeded-random-CRwG4LlI.js";import"./shuffle-CSdRC5Ox.js";import"./AnswerGame-BuFrhx1p.js";import"./ProgressHUD-N71BGEF6.js";import"./GameOverOverlay-BJdTblGj.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-C_UR37f4.js";import"./SentenceWithGaps-BmZae0_u.js";import"./SlotRow-9HQEOd2I.js";import"./AudioButton-BncRxVUg.js";import"./volume-2-CvkxEVaH.js";import"./createLucideIcon-EuvfeFzv.js";import"./ImageQuestion-xQbQvo6P.js";import"./build-round-order-Bs4A_kGi.js";p("word-spell",u);const a={gameId:"word-spell",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-manual",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!1,tileUnit:"letter",mode:"picture",rounds:[{word:"cat",image:"https://placehold.co/160?text=cat"},{word:"dog",image:"https://placehold.co/160?text=dog"},{word:"hen",image:"https://placehold.co/160?text=hen"},{word:"pig",image:"https://placehold.co/160?text=pig"},{word:"fox",image:"https://placehold.co/160?text=fox"}]},n=r=>({allTiles:[{id:"tile-d",label:"d",value:"d"},{id:"tile-g",label:"g",value:"g"},{id:"tile-o",label:"o",value:"o"}],bankTileIds:["tile-d","tile-g","tile-o"],zones:[{id:"z0",index:0,expectedValue:"d",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z1",index:1,expectedValue:"o",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z2",index:2,expectedValue:"g",placedTileId:null,isWrong:!1,isLocked:!1}],activeSlotIndex:0,phase:"playing",roundIndex:r,retryCount:0,levelIndex:0}),f={gameId:"word-spell",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-manual",tileBankMode:"exact",totalRounds:2,roundsInOrder:!0,ttsEnabled:!0,tileUnit:"letter",mode:"recall",rounds:[{word:"cat"},{word:"dog"}]},h=({config:r,initialState:d})=>i.jsx(s,{gameId:"word-spell",children:({skin:l})=>i.jsx(g,{config:{...r,skin:l.id},initialState:d,seed:"storybook"})}),lo={title:"Games/WordSpell/SkinHarness",component:h,tags:["autodocs"],decorators:[m,c],args:{config:f}},o={args:{config:{gameId:"word-spell",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:2,roundsInOrder:!0,ttsEnabled:!0,tileUnit:"letter",mode:"recall",rounds:[{word:"spin"},{word:"nap"}]}}},e={args:{config:a,initialState:n(1)}},t={args:{config:a,initialState:n(4)}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      gameId: 'word-spell',
      component: 'WordSpell',
      inputMethod: 'drag',
      wrongTileBehavior: 'lock-auto-eject',
      tileBankMode: 'exact',
      totalRounds: 2,
      roundsInOrder: true,
      ttsEnabled: true,
      tileUnit: 'letter',
      mode: 'recall',
      rounds: [{
        word: 'spin'
      }, {
        word: 'nap'
      }]
    }
  }
}`,...o.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    config: fiveRoundConfig,
    initialState: dogDraftState(1)
  }
}`,...e.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    config: fiveRoundConfig,
    initialState: dogDraftState(4)
  }
}`,...t.parameters?.docs?.source}}};const so=["Playground","HudRound2Of5","HudRound5Of5"];export{e as HudRound2Of5,t as HudRound5Of5,o as Playground,so as __namedExportsOrder,lo as default};
