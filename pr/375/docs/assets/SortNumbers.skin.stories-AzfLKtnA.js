import{w as c}from"./withDb-DtbL00zc.js";import{w as m}from"./withRouter-COVJUWhw.js";import{S as p,c as n}from"./SortNumbers-Bh4Y5pTx.js";import"./iframe-BamnxPgZ.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-CIoHS2kD.js";import"./import-wrapper-prod-Bf77zpub.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-D75nCh3L.js";import"./index-CjN6Pe7-.js";import"./index-CBs7wb3U.js";import"./shuffle-CSdRC5Ox.js";import"./useGameEngine-Clh5kE9J.js";import"./AnswerGameProvider-Se66ZWGj.js";import"./AudioFeedback--m-fHcTR.js";import"./useGameTTS-D6mbvHvh.js";import"./useSettings-OxAzEUpA.js";import"./useRxQuery-lhKrTRCy.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-ZRRDI91-.js";import"./index-DaJ7q9UL.js";import"./SortNumbersTileBank-D5cCcnpY.js";import"./styles-Cu2jWhUp.js";import"./tile-font-DQ9RrPM_.js";import"./useDraggableTile-BKe1BHbm.js";import"./AnswerGame-BjCT1ktw.js";import"./ProgressHUD-0tsQc_li.js";import"./GameOverOverlay-1sRqqXse.js";import"./confetti.module-oQXWb4Lk.js";import"./LevelCompleteOverlay-BZmtu-ml.js";import"./ScoreAnimation-BXiWao6r.js";import"./SlotRow-xHPQgQkW.js";import"./build-round-order-dfQLa4JH.js";import"./seeded-random-CRwG4LlI.js";const o=(l,d="playing")=>({allTiles:[{id:"tile-3",label:"3",value:"3"},{id:"tile-4",label:"4",value:"4"},{id:"tile-5",label:"5",value:"5"}],bankTileIds:["tile-3","tile-4","tile-5"],zones:[{id:"z0",index:0,expectedValue:"3",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z1",index:1,expectedValue:"4",placedTileId:null,isWrong:!1,isLocked:!1},{id:"z2",index:2,expectedValue:"5",placedTileId:null,isWrong:!1,isLocked:!1}],activeSlotIndex:0,phase:d,roundIndex:0,retryCount:0,levelIndex:l}),e={gameId:"sort-numbers",component:"SortNumbers",inputMethod:"drag",wrongTileBehavior:"lock-manual",tileBankMode:"exact",totalRounds:1,roundsInOrder:!0,ttsEnabled:!1,direction:"ascending",range:{min:3,max:15},quantity:3,skip:{mode:"consecutive"},distractors:{source:"random",count:0},rounds:[{sequence:[3,4,5]}],levelMode:{generateNextLevel:n({start:3,step:1,quantity:3,direction:"ascending"})}},u={...e,levelMode:{maxLevels:5,generateNextLevel:n({start:3,step:1,quantity:3,direction:"ascending"})},hud:{showDots:!0,showFraction:!0,showLevel:!0}},Y={title:"Games/SortNumbers/Skin Harness",component:p,tags:["autodocs"],decorators:[c,m],args:{config:e}},t={args:{config:e,initialState:o(0),seed:"storybook"}},r={args:{config:e,initialState:o(2),seed:"storybook"}},i={args:{config:e,initialState:o(9),seed:"storybook"}},a={args:{config:e,initialState:o(2,"round-complete"),seed:"storybook"}},s={args:{config:u,initialState:o(2),seed:"storybook"}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
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
