import{j as i,S as s,a as p}from"./iframe-BamnxPgZ.js";import{w as m}from"./withDb-DtbL00zc.js";import{w as c}from"./withRouter-COVJUWhw.js";import{d as u}from"./dragon-cave-skin-BhFdGOgc.js";import{W as g}from"./WordSpell-02649UI3.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-CIoHS2kD.js";import"./import-wrapper-prod-Bf77zpub.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-D75nCh3L.js";import"./index-CjN6Pe7-.js";import"./index-CBs7wb3U.js";import"./index-CTGTomuT.js";import"./useGameEngine-Clh5kE9J.js";import"./AnswerGameProvider-Se66ZWGj.js";import"./AudioFeedback--m-fHcTR.js";import"./useGameTTS-D6mbvHvh.js";import"./useSettings-OxAzEUpA.js";import"./useRxQuery-lhKrTRCy.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-ZRRDI91-.js";import"./index-DaJ7q9UL.js";import"./LetterTileBank-BcoMDVlL.js";import"./styles-Cu2jWhUp.js";import"./useDraggableTile-BKe1BHbm.js";import"./filter-DkyZiFsM.js";import"./seen-words-DcIHDtfq.js";import"./seeded-random-CRwG4LlI.js";import"./shuffle-CSdRC5Ox.js";import"./AnswerGame-BjCT1ktw.js";import"./ProgressHUD-0tsQc_li.js";import"./GameOverOverlay-1sRqqXse.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-BXiWao6r.js";import"./SentenceWithGaps-BTbopu8X.js";import"./SlotRow-xHPQgQkW.js";import"./AudioButton-Rb3OKSO8.js";import"./volume-2-rKvGt2p1.js";import"./createLucideIcon-C8OLaw_u.js";import"./ImageQuestion-Q1qTu3oP.js";import"./build-round-order-dfQLa4JH.js";p("word-spell",u);const a={gameId:"word-spell",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-manual",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!1,tileUnit:"letter",mode:"picture",rounds:[{word:"cat",image:"https://placehold.co/160?text=cat"},{word:"dog",image:"https://placehold.co/160?text=dog"},{word:"hen",image:"https://placehold.co/160?text=hen"},{word:"pig",image:"https://placehold.co/160?text=pig"},{word:"fox",image:"https://placehold.co/160?text=fox"}]},n=r=>({allTiles:[{id:"tile-d",label:"d",value:"d"},{id:"tile-g",label:"g",value:"g"},{id:"tile-o",label:"o",value:"o"}],bankTileIds:["tile-d","tile-g","tile-o"],zones:[{id:"z0",index:0,expectedValue:"d",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z1",index:1,expectedValue:"o",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z2",index:2,expectedValue:"g",placedTileId:null,isWrong:!1,isLocked:!1}],activeSlotIndex:0,phase:"playing",roundIndex:r,retryCount:0,levelIndex:0}),f={gameId:"word-spell",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-manual",tileBankMode:"exact",totalRounds:2,roundsInOrder:!0,ttsEnabled:!0,tileUnit:"letter",mode:"recall",rounds:[{word:"cat"},{word:"dog"}]},h=({config:r,initialState:d})=>i.jsx(s,{gameId:"word-spell",children:({skin:l})=>i.jsx(g,{config:{...r,skin:l.id},initialState:d,seed:"storybook"})}),lo={title:"Games/WordSpell/SkinHarness",component:h,tags:["autodocs"],decorators:[m,c],args:{config:f}},o={args:{config:{gameId:"word-spell",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:2,roundsInOrder:!0,ttsEnabled:!0,tileUnit:"letter",mode:"recall",rounds:[{word:"spin"},{word:"nap"}]}}},e={args:{config:a,initialState:n(1)}},t={args:{config:a,initialState:n(4)}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
