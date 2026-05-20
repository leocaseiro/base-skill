import{j as i,S as s,a as p}from"./iframe-DaMeNeqL.js";import{w as m}from"./withDb-DpfvdsVb.js";import{w as c}from"./withRouter-FpOCrl6M.js";import{d as u}from"./dragon-cave-skin-E5T8Kjht.js";import{W as g}from"./WordSpell-CZu0Jp1p.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-DGYO-IHY.js";import"./import-wrapper-prod-BgvBqnvr.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-BqPmpH5I.js";import"./index-BlquBci-.js";import"./index-Du-wTlzO.js";import"./index-TpexVsBp.js";import"./useGameEngine-BhENq2PV.js";import"./AnswerGameProvider-DFcDvx01.js";import"./AudioFeedback--m-fHcTR.js";import"./useGameTTS-47x8U7hL.js";import"./useSettings-D10FTx12.js";import"./useRxQuery-CVJx2oNO.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-sQV1BTjH.js";import"./index-CSbAMMno.js";import"./LetterTileBank-BNijTg2H.js";import"./styles-Cu2jWhUp.js";import"./useDraggableTile-Cxb98q6O.js";import"./filter-u1AriINO.js";import"./seen-words-DcIHDtfq.js";import"./seeded-random-CRwG4LlI.js";import"./shuffle-CSdRC5Ox.js";import"./AnswerGame-iwBry5aF.js";import"./ProgressHUD-6OSI9Krx.js";import"./GameOverOverlay-CzyLMp_r.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-DiYDSedg.js";import"./SentenceWithGaps-KIyqvoha.js";import"./SlotRow-BmJIPcpL.js";import"./AudioButton-Bl9AtlJ7.js";import"./volume-2-3jPk5OPW.js";import"./createLucideIcon-DBNnJmnZ.js";import"./ImageQuestion-DPplxJ7-.js";import"./build-round-order-Cs04bG0B.js";p("word-spell",u);const a={gameId:"word-spell",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-manual",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!1,tileUnit:"letter",mode:"picture",rounds:[{word:"cat",image:"https://placehold.co/160?text=cat"},{word:"dog",image:"https://placehold.co/160?text=dog"},{word:"hen",image:"https://placehold.co/160?text=hen"},{word:"pig",image:"https://placehold.co/160?text=pig"},{word:"fox",image:"https://placehold.co/160?text=fox"}]},n=r=>({allTiles:[{id:"tile-d",label:"d",value:"d"},{id:"tile-g",label:"g",value:"g"},{id:"tile-o",label:"o",value:"o"}],bankTileIds:["tile-d","tile-g","tile-o"],zones:[{id:"z0",index:0,expectedValue:"d",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z1",index:1,expectedValue:"o",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z2",index:2,expectedValue:"g",placedTileId:null,isWrong:!1,isLocked:!1}],activeSlotIndex:0,phase:"playing",roundIndex:r,retryCount:0,levelIndex:0}),f={gameId:"word-spell",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-manual",tileBankMode:"exact",totalRounds:2,roundsInOrder:!0,ttsEnabled:!0,tileUnit:"letter",mode:"recall",rounds:[{word:"cat"},{word:"dog"}]},h=({config:r,initialState:d})=>i.jsx(s,{gameId:"word-spell",children:({skin:l})=>i.jsx(g,{config:{...r,skin:l.id},initialState:d,seed:"storybook"})}),lo={title:"Games/WordSpell/SkinHarness",component:h,tags:["autodocs"],decorators:[m,c],args:{config:f}},o={args:{config:{gameId:"word-spell",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:2,roundsInOrder:!0,ttsEnabled:!0,tileUnit:"letter",mode:"recall",rounds:[{word:"spin"},{word:"nap"}]}}},e={args:{config:a,initialState:n(1)}},t={args:{config:a,initialState:n(4)}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
