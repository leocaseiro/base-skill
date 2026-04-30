import{w as i}from"./withDb-8Bsu_4Ju.js";import{w as c}from"./withRouter-jOcOygz_.js";import{W as d}from"./WordSpell-DTn8kHY5.js";import"./iframe-HcMAEsZn.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-Dyzom7fI.js";import"./import-wrapper-prod-DJFLmlIk.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-b0JyItBR.js";import"./index-BJcIv_Z0.js";import"./index-BKsrMCAN.js";import"./index-Cd9odFSs.js";import"./LetterTileBank-gmRtmOry.js";import"./styles-Cu2jWhUp.js";import"./AnswerGameProvider-3A9U5h9_.js";import"./AudioFeedback-DxUgBcwr.js";import"./useDraggableTile-o-Kq4vad.js";import"./useGameTTS-CHfKJ_J-.js";import"./useSettings-C9MzISMq.js";import"./useRxDB-BLl3a-pw.js";import"./useRxQuery-CPTXkShk.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-DTjaTRpQ.js";import"./index-RfaiCK45.js";import"./filter-CsQSVg1J.js";import"./seen-words-joX9c3ry.js";import"./seeded-random-CRwG4LlI.js";import"./shuffle-CSdRC5Ox.js";import"./AnswerGame-DCkTXKxF.js";import"./ProgressHUD-tMtdl77-.js";import"./GameOverOverlay-D6fsBuX5.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-C71MCC_j.js";import"./SentenceWithGaps-C4U0guRU.js";import"./SlotRow-DZ93jvNR.js";import"./useRoundTTS-ZAwZ7Adw.js";import"./AudioButton-DxV03elS.js";import"./volume-2-DciASO58.js";import"./createLucideIcon-D0FdCwPc.js";import"./ImageQuestion-lTKkBUmm.js";import"./build-round-order-tcYc1Ab_.js";const o={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},oo={component:d,title:"Games/WordSpell/WordSpell",tags:["autodocs"],args:{config:o},decorators:[i,c]},r={},e={args:{config:{...o,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...o,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...o,tileBankMode:"distractors",distractorCount:3}}},a={args:{config:{...o,wrongTileBehavior:"lock-manual"}}},s={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
}`,...e.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
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
}`,...t.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      tileBankMode: 'distractors',
      distractorCount: 3
    }
  }
}`,...n.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      wrongTileBehavior: 'lock-manual'
    }
  }
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
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
}`,...s.parameters?.docs?.source}}};const ro=["PictureMode","RecallMode","SentenceGapMode","WithDistractors","LockManualWrongTile","LibrarySourced"];export{s as LibrarySourced,a as LockManualWrongTile,r as PictureMode,e as RecallMode,t as SentenceGapMode,n as WithDistractors,ro as __namedExportsOrder,oo as default};
