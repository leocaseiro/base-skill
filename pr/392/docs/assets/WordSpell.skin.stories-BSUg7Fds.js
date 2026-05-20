import{j as i,S as s,a as p}from"./iframe-BNo-6Fvm.js";import{w as m}from"./withDb-49d3TuED.js";import{w as c}from"./withRouter-B7h_677C.js";import{d as u}from"./dragon-cave-skin-CLCWI_Yv.js";import{W as g}from"./WordSpell-BdTL_wXb.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-B3ZUoJRs.js";import"./import-wrapper-prod-Byjuu4fW.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-PTP-2G-k.js";import"./index-d56BlGgX.js";import"./index-DBfft2Eo.js";import"./index-sDH6slL4.js";import"./useGameEngine-DoXoxVAt.js";import"./AnswerGameProvider-DdVbftkN.js";import"./AudioFeedback--m-fHcTR.js";import"./useGameTTS-DVSQzoQ_.js";import"./useSettings-BPIGjo5Q.js";import"./useRxQuery-C0LMRwIg.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-7PUT-WeE.js";import"./index-DTh0inbT.js";import"./LetterTileBank-YJvFHxpq.js";import"./styles-Cu2jWhUp.js";import"./useDraggableTile-Bg22FLLS.js";import"./filter-CzlNkRh6.js";import"./seen-words-DcIHDtfq.js";import"./seeded-random-CRwG4LlI.js";import"./shuffle-CSdRC5Ox.js";import"./AnswerGame-Q9-QgkzT.js";import"./ProgressHUD-BZ3bvcdL.js";import"./GameOverOverlay-BcUVUxm8.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-DhJ7i6iM.js";import"./SentenceWithGaps-BrMiLBJ0.js";import"./SlotRow-BoHXVIk0.js";import"./AudioButton-Cef2Da8Z.js";import"./volume-2-CBknu7nb.js";import"./createLucideIcon-BPyV6usS.js";import"./ImageQuestion-BPLUaDDD.js";import"./build-round-order-B3N7alS9.js";p("word-spell",u);const a={gameId:"word-spell",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-manual",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!1,tileUnit:"letter",mode:"picture",rounds:[{word:"cat",image:"https://placehold.co/160?text=cat"},{word:"dog",image:"https://placehold.co/160?text=dog"},{word:"hen",image:"https://placehold.co/160?text=hen"},{word:"pig",image:"https://placehold.co/160?text=pig"},{word:"fox",image:"https://placehold.co/160?text=fox"}]},n=r=>({allTiles:[{id:"tile-d",label:"d",value:"d"},{id:"tile-g",label:"g",value:"g"},{id:"tile-o",label:"o",value:"o"}],bankTileIds:["tile-d","tile-g","tile-o"],zones:[{id:"z0",index:0,expectedValue:"d",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z1",index:1,expectedValue:"o",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z2",index:2,expectedValue:"g",placedTileId:null,isWrong:!1,isLocked:!1}],activeSlotIndex:0,phase:"playing",roundIndex:r,retryCount:0,levelIndex:0}),f={gameId:"word-spell",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-manual",tileBankMode:"exact",totalRounds:2,roundsInOrder:!0,ttsEnabled:!0,tileUnit:"letter",mode:"recall",rounds:[{word:"cat"},{word:"dog"}]},h=({config:r,initialState:d})=>i.jsx(s,{gameId:"word-spell",children:({skin:l})=>i.jsx(g,{config:{...r,skin:l.id},initialState:d,seed:"storybook"})}),lo={title:"Games/WordSpell/SkinHarness",component:h,tags:["autodocs"],decorators:[m,c],args:{config:f}},o={args:{config:{gameId:"word-spell",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:2,roundsInOrder:!0,ttsEnabled:!0,tileUnit:"letter",mode:"recall",rounds:[{word:"spin"},{word:"nap"}]}}},e={args:{config:a,initialState:n(1)}},t={args:{config:a,initialState:n(4)}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
