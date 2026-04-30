import{w as i}from"./withDb-aJNf46dF.js";import{w as c}from"./withRouter-CbSy_zgT.js";import{W as d}from"./WordSpell-CYUuvJin.js";import"./iframe-B675lRxT.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-DH9N_NAX.js";import"./import-wrapper-prod-8QaMWguJ.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-B2y5wehk.js";import"./index-CugIBXjI.js";import"./index-CHfBmvqU.js";import"./index-TfGwR3eh.js";import"./LetterTileBank-DFpV_Df3.js";import"./styles-Cu2jWhUp.js";import"./AnswerGameProvider-j9SzFBEY.js";import"./AudioFeedback-DxUgBcwr.js";import"./useDraggableTile-gYxM9xh_.js";import"./useGameTTS-Cytenh1k.js";import"./useSettings-CKCYoCUQ.js";import"./useRxDB-CJfQAwNk.js";import"./useRxQuery-Ek5MDQd7.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-CH04gWY9.js";import"./index-vwiy93c2.js";import"./filter-X5n9dgLb.js";import"./seen-words-joX9c3ry.js";import"./seeded-random-CRwG4LlI.js";import"./shuffle-CSdRC5Ox.js";import"./AnswerGame-jWQ_tVxV.js";import"./ProgressHUD-tf4ZwivV.js";import"./GameOverOverlay-Bpc9ddjh.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-CvaL5TQi.js";import"./SentenceWithGaps-B_OJetMw.js";import"./SlotRow-oIJaxyQC.js";import"./useRoundTTS-B4TKsgGl.js";import"./AudioButton-CGZkGE2H.js";import"./createLucideIcon-DwTMHjEY.js";import"./ImageQuestion-B7-X3h-H.js";import"./build-round-order-DvUpPM5V.js";const o={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},$={component:d,title:"Games/WordSpell/WordSpell",tags:["autodocs"],args:{config:o},decorators:[i,c]},r={},e={args:{config:{...o,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...o,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...o,tileBankMode:"distractors",distractorCount:3}}},a={args:{config:{...o,wrongTileBehavior:"lock-manual"}}},s={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
}`,...s.parameters?.docs?.source}}};const oo=["PictureMode","RecallMode","SentenceGapMode","WithDistractors","LockManualWrongTile","LibrarySourced"];export{s as LibrarySourced,a as LockManualWrongTile,r as PictureMode,e as RecallMode,t as SentenceGapMode,n as WithDistractors,oo as __namedExportsOrder,$ as default};
