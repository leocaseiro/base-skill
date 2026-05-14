import{w as c}from"./withDb-DrE79jSi.js";import{w as m}from"./withRouter-DcaTERAA.js";import{S as p,c as n}from"./SortNumbers-BKR7MfMr.js";import"./iframe-d2Jo5ZDn.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-Dt23czIK.js";import"./import-wrapper-prod-Bjzlm6_4.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-De6gnIOE.js";import"./index-DQtVcQg-.js";import"./index-BRqttegb.js";import"./shuffle-CSdRC5Ox.js";import"./useGameEngine-CdicNqFf.js";import"./AnswerGameProvider-BZPHXekc.js";import"./AudioFeedback--m-fHcTR.js";import"./useGameTTS-BkWDN7iF.js";import"./useSettings-NgNCsjFc.js";import"./useRxQuery-DBXR8_39.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-UZKzaagy.js";import"./index-y-ykdpz3.js";import"./SortNumbersTileBank-Cy36QR2m.js";import"./styles-Cu2jWhUp.js";import"./tile-font-DQ9RrPM_.js";import"./useDraggableTile-80WxlfxM.js";import"./AnswerGame-CbjSuRrP.js";import"./ProgressHUD-BIO_6Yf6.js";import"./GameOverOverlay-CVIZGWDI.js";import"./confetti.module-oQXWb4Lk.js";import"./LevelCompleteOverlay-CTHJzeBx.js";import"./ScoreAnimation-Dvn3d1Aa.js";import"./SlotRow-CFq9Xsso.js";import"./build-round-order-CVhOg1gs.js";import"./seeded-random-CRwG4LlI.js";const o=(l,d="playing")=>({allTiles:[{id:"tile-3",label:"3",value:"3"},{id:"tile-4",label:"4",value:"4"},{id:"tile-5",label:"5",value:"5"}],bankTileIds:["tile-3","tile-4","tile-5"],zones:[{id:"z0",index:0,expectedValue:"3",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z1",index:1,expectedValue:"4",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z2",index:2,expectedValue:"5",placedTileId:null,isWrong:!1,isLocked:!1}],activeSlotIndex:0,phase:d,roundIndex:0,retryCount:0,levelIndex:l}),e={gameId:"sort-numbers",component:"SortNumbers",inputMethod:"drag",wrongTileBehavior:"lock-manual",tileBankMode:"exact",totalRounds:1,roundsInOrder:!0,ttsEnabled:!1,direction:"ascending",range:{min:3,max:15},quantity:3,skip:{mode:"consecutive"},distractors:{source:"random",count:0},rounds:[{sequence:[3,4,5]}],levelMode:{generateNextLevel:n({start:3,step:1,quantity:3,direction:"ascending"})}},u={...e,levelMode:{maxLevels:5,generateNextLevel:n({start:3,step:1,quantity:3,direction:"ascending"})},hud:{showDots:!0,showFraction:!0,showLevel:!0}},Y={title:"Games/SortNumbers/Skin Harness",component:p,tags:["autodocs"],decorators:[c,m],args:{config:e}},t={args:{config:e,initialState:o(0),seed:"storybook"}},r={args:{config:e,initialState:o(2),seed:"storybook"}},i={args:{config:e,initialState:o(9),seed:"storybook"}},a={args:{config:e,initialState:o(2,"round-complete"),seed:"storybook"}},s={args:{config:u,initialState:o(2),seed:"storybook"}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    config: levelModeConfig,
    initialState: levelDraftState(0),
    seed: 'storybook'
  }
}`,...t.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    config: levelModeConfig,
    initialState: levelDraftState(2),
    seed: 'storybook'
  }
}`,...r.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    config: levelModeConfig,
    initialState: levelDraftState(9),
    seed: 'storybook'
  }
}`,...i.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    config: levelModeConfig,
    initialState: levelDraftState(2, 'round-complete'),
    seed: 'storybook'
  }
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    config: mixedModeConfig,
    initialState: levelDraftState(2),
    seed: 'storybook'
  }
}`,...s.parameters?.docs?.source}}};const Z=["LevelMode_Level1","LevelMode_Level3","LevelMode_Level10","LevelMode_LevelCompletePop","Mixed_LevelPlusFraction"];export{t as LevelMode_Level1,i as LevelMode_Level10,r as LevelMode_Level3,a as LevelMode_LevelCompletePop,s as Mixed_LevelPlusFraction,Z as __namedExportsOrder,Y as default};
