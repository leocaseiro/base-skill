import{w as i}from"./withDb-BHSv1WEn.js";import{w as d}from"./withRouter-59yD_COR.js";import{W as m}from"./WordSpell-C3SfIjF1.js";import"./iframe-25G7zPtT.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-C2D7aTo0.js";import"./import-wrapper-prod-Dd9BPSYK.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./index-Cl8JP_qV.js";import"./index-C-y6nZBX.js";import"./index-DwAuqrHo.js";import"./index-CpW2MjoT.js";import"./LetterTileBank-DpbJ7iOf.js";import"./useDraggableTile-CjnwMZQU.js";import"./AnswerGameProvider-DjsqxWFT.js";import"./AudioFeedback-DxUgBcwr.js";import"./useGameTTS-EAaMsoAF.js";import"./useSettings-Cb6JehAL.js";import"./useRxDB-O4sHYRd_.js";import"./useRxQuery-DpX3v7dT.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-DcRngWZU.js";import"./index-BIhpMk6I.js";import"./phoneme-codes-Bsa9WhIG.js";import"./build-round-order-BHNg5HLw.js";import"./AnswerGame-D45ZCxuK.js";import"./ProgressHUD-Byc9Ooyq.js";import"./GameOverOverlay-BE0TIhw2.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-DeMtYf4I.js";import"./SentenceWithGaps-a_L5-yKg.js";import"./SlotRow-lmpL3M06.js";import"./AudioButton-BGCi9Gw6.js";import"./createLucideIcon-BMKTxNSi.js";import"./ImageQuestion-BGuIiSZP.js";const r={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},Q={component:m,tags:["autodocs"],args:{config:r},decorators:[i,d]},e={},o={args:{config:{...r,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...r,mode:"scramble"}}},a={args:{config:{...r,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...r,tileBankMode:"distractors",distractorCount:3}}},s={args:{config:{...r,wrongTileBehavior:"lock-manual"}}},c={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
