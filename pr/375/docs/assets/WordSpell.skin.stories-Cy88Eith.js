import{j as i,S as s,a as p}from"./iframe-CWe-G7nS.js";import{w as m}from"./withDb-BZtK3reu.js";import{w as c}from"./withRouter-CqU6vq51.js";import{d as u}from"./dragon-cave-skin-oc7AqlX_.js";import{W as g}from"./WordSpell-DXYDYLNG.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-CoYZssdp.js";import"./import-wrapper-prod-BIWrNaK0.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-BGv55Kg3.js";import"./index-B_V7hSDc.js";import"./index-C-fRf3XN.js";import"./index-JNouha3L.js";import"./useGameEngine-w_cVyZ0f.js";import"./AnswerGameProvider-CTDuj7TI.js";import"./AudioFeedback--m-fHcTR.js";import"./useGameTTS-FO0z9KbT.js";import"./useSettings-BJ7aOW3U.js";import"./useRxQuery-DcZZflW1.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-VDHfMeT1.js";import"./index-CP21tCso.js";import"./LetterTileBank-OGpMhVqB.js";import"./styles-Cu2jWhUp.js";import"./useDraggableTile-CFLkr77U.js";import"./filter-EY12cP7b.js";import"./seen-words-DcIHDtfq.js";import"./seeded-random-CRwG4LlI.js";import"./shuffle-CSdRC5Ox.js";import"./AnswerGame-DN0Mn_lc.js";import"./ProgressHUD-C4j4hADo.js";import"./GameOverOverlay-Cur26kPM.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-Bpuvsigm.js";import"./SentenceWithGaps-Ba_LWC5X.js";import"./SlotRow-C-hlZOgB.js";import"./AudioButton-japxGOWF.js";import"./volume-2-BOzfXR4A.js";import"./createLucideIcon-BCe52LNl.js";import"./ImageQuestion-CZbUxQD7.js";import"./build-round-order-DH_8KsWo.js";p("word-spell",u);const a={gameId:"word-spell",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-manual",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!1,tileUnit:"letter",mode:"picture",rounds:[{word:"cat",image:"https://placehold.co/160?text=cat"},{word:"dog",image:"https://placehold.co/160?text=dog"},{word:"hen",image:"https://placehold.co/160?text=hen"},{word:"pig",image:"https://placehold.co/160?text=pig"},{word:"fox",image:"https://placehold.co/160?text=fox"}]},n=r=>({allTiles:[{id:"tile-d",label:"d",value:"d"},{id:"tile-g",label:"g",value:"g"},{id:"tile-o",label:"o",value:"o"}],bankTileIds:["tile-d","tile-g","tile-o"],zones:[{id:"z0",index:0,expectedValue:"d",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z1",index:1,expectedValue:"o",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z2",index:2,expectedValue:"g",placedTileId:null,isWrong:!1,isLocked:!1}],activeSlotIndex:0,phase:"playing",roundIndex:r,retryCount:0,levelIndex:0}),f={gameId:"word-spell",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-manual",tileBankMode:"exact",totalRounds:2,roundsInOrder:!0,ttsEnabled:!0,tileUnit:"letter",mode:"recall",rounds:[{word:"cat"},{word:"dog"}]},h=({config:r,initialState:d})=>i.jsx(s,{gameId:"word-spell",children:({skin:l})=>i.jsx(g,{config:{...r,skin:l.id},initialState:d,seed:"storybook"})}),lo={title:"Games/WordSpell/SkinHarness",component:h,tags:["autodocs"],decorators:[m,c],args:{config:f}},o={args:{config:{gameId:"word-spell",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:2,roundsInOrder:!0,ttsEnabled:!0,tileUnit:"letter",mode:"recall",rounds:[{word:"spin"},{word:"nap"}]}}},e={args:{config:a,initialState:n(1)}},t={args:{config:a,initialState:n(4)}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
