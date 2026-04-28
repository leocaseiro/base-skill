import{w as i}from"./withDb-C_W6Gz-I.js";import{w as d}from"./withRouter-BY8FallS.js";import{W as m}from"./WordSpell-B6HfhfFV.js";import"./iframe-BYtgYeyp.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-Bl-Lmkz_.js";import"./import-wrapper-prod-DA3QnLiH.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./index-Da6NuvpO.js";import"./index-CYBzHqIL.js";import"./index-DcpXh5Pu.js";import"./index-B80tfyw0.js";import"./LetterTileBank-CPkP7IMV.js";import"./useDraggableTile-Dz49TpAf.js";import"./AnswerGameProvider-Ct3CzvCX.js";import"./AudioFeedback-DxUgBcwr.js";import"./useGameTTS-C_DhGj4v.js";import"./useSettings-DhVK2u_T.js";import"./useRxDB-C5kHaRn5.js";import"./useRxQuery--RTwKWA8.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-BI2PeJ71.js";import"./index-zXVlCfzO.js";import"./phoneme-codes-BiAsyQlC.js";import"./build-round-order-BJYB2Qvh.js";import"./AnswerGame-D-g3BrLX.js";import"./ProgressHUD-Be0H9ln0.js";import"./GameOverOverlay-Cl0ulz0U.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-DRhsfm_V.js";import"./SentenceWithGaps-C7pevEsF.js";import"./SlotRow-C_CjxSKW.js";import"./AudioButton-CZp7FHff.js";import"./createLucideIcon-C9-19aQV.js";import"./ImageQuestion-TdRPzDUb.js";const r={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},Q={component:m,tags:["autodocs"],args:{config:r},decorators:[i,d]},e={},o={args:{config:{...r,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...r,mode:"scramble"}}},a={args:{config:{...r,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...r,tileBankMode:"distractors",distractorCount:3}}},s={args:{config:{...r,wrongTileBehavior:"lock-manual"}}},c={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'recall',
      tileBankMode: 'distractors',
      distractorCount: 4,
      rounds: [{
        word: 'cat'
      }]
    }
  }
}`,...o.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'scramble'
    }
  }
}`,...t.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'sentence-gap',
      rounds: [{
        word: 'sat',
        image: 'https://placehold.co/160?text=scene',
        sentence: 'The cat ___ on the mat.'
      }]
    }
  }
}`,...a.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      tileBankMode: 'distractors',
      distractorCount: 3
    }
  }
}`,...n.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      wrongTileBehavior: 'lock-manual'
    }
  }
}`,...s.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      gameId: 'word-spell-library-sourced',
      component: 'WordSpell',
      inputMethod: 'drag',
      wrongTileBehavior: 'lock-auto-eject',
      tileBankMode: 'exact',
      totalRounds: 4,
      roundsInOrder: true,
      ttsEnabled: true,
      mode: 'recall',
      tileUnit: 'letter',
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          levels: [1, 2],
          syllableCountEq: 1
        }
      }
    }
  }
}`,...c.parameters?.docs?.source}}};const V=["PictureMode","RecallMode","ScrambleMode","SentenceGapMode","WithDistractors","LockManualWrongTile","LibrarySourced"];export{c as LibrarySourced,s as LockManualWrongTile,e as PictureMode,o as RecallMode,t as ScrambleMode,a as SentenceGapMode,n as WithDistractors,V as __namedExportsOrder,Q as default};
