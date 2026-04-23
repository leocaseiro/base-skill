import{w as i}from"./withDb-DBoM1Lrv.js";import{w as d}from"./withRouter-BNs9Dn-A.js";import{W as l}from"./WordSpell-CLxf7ery.js";import"./iframe-tauurkDR.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-Dv389bcu.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./index-DOZ79xFA.js";import"./index-CEhCxiZX.js";import"./index-B4NQMhfr.js";import"./index-CsisA9UE.js";import"./LetterTileBank-BvOZHq3a.js";import"./useDraggableTile-RuSrViLp.js";import"./AnswerGameProvider-BmsB5Rax.js";import"./AudioFeedback-DxUgBcwr.js";import"./useGameTTS-Ct_lC7lH.js";import"./useSettings-BdZCF-OK.js";import"./useRxDB-DwTmY3H6.js";import"./useRxQuery-DMJQLCBU.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-2pIKpgdj.js";import"./index-DlUHTGap.js";import"./filter-Bd5ZYMZU.js";import"./build-round-order-BmTJqAEt.js";import"./AnswerGame-bnC9Cte1.js";import"./ProgressHUD-Hf8eAYcP.js";import"./GameOverOverlay-CFVx7vbR.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-DhyfbCbH.js";import"./SentenceWithGaps-BxipgIrG.js";import"./SlotRow-BtTN7y2z.js";import"./AudioButton-BKT05H5f.js";import"./createLucideIcon-Wc_LyiAW.js";import"./ImageQuestion-SRhdu9Dc.js";const r={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},N={component:l,tags:["autodocs"],args:{config:r},decorators:[i,d]},e={},o={args:{config:{...r,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...r,mode:"scramble"}}},a={args:{config:{...r,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...r,tileBankMode:"distractors",distractorCount:3}}},s={args:{config:{...r,wrongTileBehavior:"lock-manual"}}},c={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
}`,...c.parameters?.docs?.source}}};const Q=["PictureMode","RecallMode","ScrambleMode","SentenceGapMode","WithDistractors","LockManualWrongTile","LibrarySourced"];export{c as LibrarySourced,s as LockManualWrongTile,e as PictureMode,o as RecallMode,t as ScrambleMode,a as SentenceGapMode,n as WithDistractors,Q as __namedExportsOrder,N as default};
