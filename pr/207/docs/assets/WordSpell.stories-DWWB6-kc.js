import{w as i}from"./withDb-DhyGOzLm.js";import{w as d}from"./withRouter-C1FgiDQx.js";import{W as m}from"./WordSpell-DuIxXUTu.js";import"./iframe-BQEWVLaH.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-Of93_K5D.js";import"./index.browser-BY9c7rfI.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./index-BVmGDWcn.js";import"./index-BF-GIemT.js";import"./index-CdqaGxOM.js";import"./index-Bciw3IqH.js";import"./LetterTileBank-f_-cO4oA.js";import"./useDraggableTile-iYIP8hks.js";import"./AnswerGameProvider-DJ_mqbId.js";import"./AudioFeedback-DxUgBcwr.js";import"./useGameTTS-TNe9W2A6.js";import"./useSettings-ruldDThk.js";import"./useRxDB-Bd3xXeM_.js";import"./useRxQuery-B2jspuhs.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-B8SHzaRb.js";import"./index-vgJNdSGZ.js";import"./phoneme-codes-CCHiz2l9.js";import"./build-round-order-jYxYclHV.js";import"./AnswerGame-XXHNmq1W.js";import"./ProgressHUD-Bpwjh3We.js";import"./GameOverOverlay-efEKHsy7.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-Dg38l-kG.js";import"./SentenceWithGaps-DIvn867-.js";import"./SlotRow-VdvRH5GX.js";import"./AudioButton-9yrSYVSe.js";import"./createLucideIcon-CjH573V2.js";import"./ImageQuestion-BodboAp7.js";const r={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},Q={component:m,tags:["autodocs"],args:{config:r},decorators:[i,d]},e={},o={args:{config:{...r,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...r,mode:"scramble"}}},a={args:{config:{...r,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...r,tileBankMode:"distractors",distractorCount:3}}},s={args:{config:{...r,wrongTileBehavior:"lock-manual"}}},c={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
