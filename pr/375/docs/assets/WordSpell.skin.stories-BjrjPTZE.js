import{j as i,S as s,a as p}from"./iframe-BSiD2CDP.js";import{w as m}from"./withDb-CjfsaSCZ.js";import{w as c}from"./withRouter-5FipeYYu.js";import{d as u}from"./dragon-cave-skin-B-8OA7qj.js";import{W as g}from"./WordSpell-aiunGlJb.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-BuVH8yT_.js";import"./import-wrapper-prod-DVNb1Yns.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-CEOq4Gvc.js";import"./index-Bc3LBSTZ.js";import"./index-C7Q8o5sF.js";import"./index-D5vdss6N.js";import"./useGameEngine-D7gj7Cma.js";import"./AnswerGameProvider-DNQvSaRe.js";import"./AudioFeedback--m-fHcTR.js";import"./useGameTTS-IWXUEqyw.js";import"./useSettings-Cbe63Te2.js";import"./useRxQuery-D1nQU4fN.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-DOW0GvzM.js";import"./index-CXP7meKf.js";import"./LetterTileBank-DunttYKE.js";import"./styles-Cu2jWhUp.js";import"./useDraggableTile-BUz9_xLk.js";import"./filter-eIAUOXq6.js";import"./seen-words-DcIHDtfq.js";import"./seeded-random-CRwG4LlI.js";import"./shuffle-CSdRC5Ox.js";import"./AnswerGame-WY0wMcCX.js";import"./ProgressHUD-znA6Xo3u.js";import"./GameOverOverlay-DSkBbsvL.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-CKqJWHKX.js";import"./SentenceWithGaps-C19c4zSN.js";import"./SlotRow-BuEAgD4K.js";import"./AudioButton-B7qvBwXc.js";import"./volume-2-DwtRYL5v.js";import"./createLucideIcon-B33E2Q6o.js";import"./ImageQuestion-DNHHacWi.js";import"./build-round-order-_gZOnOyt.js";p("word-spell",u);const a={gameId:"word-spell",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-manual",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!1,tileUnit:"letter",mode:"picture",rounds:[{word:"cat",image:"https://placehold.co/160?text=cat"},{word:"dog",image:"https://placehold.co/160?text=dog"},{word:"hen",image:"https://placehold.co/160?text=hen"},{word:"pig",image:"https://placehold.co/160?text=pig"},{word:"fox",image:"https://placehold.co/160?text=fox"}]},n=r=>({allTiles:[{id:"tile-d",label:"d",value:"d"},{id:"tile-g",label:"g",value:"g"},{id:"tile-o",label:"o",value:"o"}],bankTileIds:["tile-d","tile-g","tile-o"],zones:[{id:"z0",index:0,expectedValue:"d",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z1",index:1,expectedValue:"o",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z2",index:2,expectedValue:"g",placedTileId:null,isWrong:!1,isLocked:!1}],activeSlotIndex:0,phase:"playing",roundIndex:r,retryCount:0,levelIndex:0}),f={gameId:"word-spell",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-manual",tileBankMode:"exact",totalRounds:2,roundsInOrder:!0,ttsEnabled:!0,tileUnit:"letter",mode:"recall",rounds:[{word:"cat"},{word:"dog"}]},h=({config:r,initialState:d})=>i.jsx(s,{gameId:"word-spell",children:({skin:l})=>i.jsx(g,{config:{...r,skin:l.id},initialState:d,seed:"storybook"})}),lo={title:"Games/WordSpell/SkinHarness",component:h,tags:["autodocs"],decorators:[m,c],args:{config:f}},o={args:{config:{gameId:"word-spell",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:2,roundsInOrder:!0,ttsEnabled:!0,tileUnit:"letter",mode:"recall",rounds:[{word:"spin"},{word:"nap"}]}}},e={args:{config:a,initialState:n(1)}},t={args:{config:a,initialState:n(4)}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
