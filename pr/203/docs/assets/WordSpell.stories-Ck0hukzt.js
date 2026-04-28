import{w as i}from"./withDb-04gHHR_3.js";import{w as d}from"./withRouter-DS97SH29.js";import{W as m}from"./WordSpell-BeHr7nFq.js";import"./iframe-sw-yh6LZ.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-BVhLhqy7.js";import"./index.browser-BY9c7rfI.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./index-DdPBDLqW.js";import"./index-Bmb3alKB.js";import"./index-CytqsvgH.js";import"./index-C0SiJqY0.js";import"./LetterTileBank-C0_926qn.js";import"./useDraggableTile-Y7DHna9y.js";import"./AnswerGameProvider-Bq8Wdpk1.js";import"./AudioFeedback-DxUgBcwr.js";import"./useGameTTS-BJtcsc3A.js";import"./useSettings-C6m9lbPt.js";import"./useRxDB-BM6HrW4b.js";import"./useRxQuery-DDmlvy6L.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-De4BP0vc.js";import"./index-BTN6FgrS.js";import"./phoneme-codes-DAA1rSoI.js";import"./build-round-order-CFDwbfpE.js";import"./AnswerGame-CACNVY-g.js";import"./ProgressHUD-C1qaE3ZK.js";import"./GameOverOverlay-CWmE7uJF.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-CRkN73tj.js";import"./SentenceWithGaps-D-njvsOd.js";import"./SlotRow-Bt7bA5gy.js";import"./AudioButton-JDGfGPDA.js";import"./createLucideIcon-B_dNldyv.js";import"./ImageQuestion-BhE4TWwJ.js";const r={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},Q={component:m,tags:["autodocs"],args:{config:r},decorators:[i,d]},e={},o={args:{config:{...r,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...r,mode:"scramble"}}},a={args:{config:{...r,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...r,tileBankMode:"distractors",distractorCount:3}}},s={args:{config:{...r,wrongTileBehavior:"lock-manual"}}},c={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
