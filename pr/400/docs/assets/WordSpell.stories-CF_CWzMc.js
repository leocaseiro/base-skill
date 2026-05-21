import{w as i}from"./withDb-CRKNBdGJ.js";import{w as c}from"./withRouter-NtPs30NC.js";import{W as d}from"./WordSpell-CuwgLPNY.js";import"./iframe-BMq_Qhig.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-wYh7-5iY.js";import"./import-wrapper-prod-BcExgIXg.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-CdkWd9Lu.js";import"./index-nUZ7Cb2g.js";import"./index-JM3K_OYG.js";import"./index-DQzCn104.js";import"./useGameEngine-R1H8ZfcC.js";import"./AnswerGameProvider-jWlVDPvF.js";import"./AudioFeedback--m-fHcTR.js";import"./useGameTTS-CKJfvBxr.js";import"./useSettings-B6mgyiYB.js";import"./useRxQuery-DcpdC9uq.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-C4s_Is2K.js";import"./index-D8FomG49.js";import"./LetterTileBank-DGTDinVT.js";import"./styles-Cu2jWhUp.js";import"./useDraggableTile-DCvrEQoX.js";import"./filter-DGGV-X_Y.js";import"./seen-words-DcIHDtfq.js";import"./seeded-random-CRwG4LlI.js";import"./shuffle-CSdRC5Ox.js";import"./AnswerGame-AixRXgna.js";import"./ProgressHUD-CwbIgGhF.js";import"./GameOverOverlay-BOEbS6Td.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-Ch70FdwJ.js";import"./SentenceWithGaps-BEyHs_eS.js";import"./SlotRow-BDGh_KPp.js";import"./AudioButton-Dc4GUbn6.js";import"./volume-2-DdXAhfxb.js";import"./createLucideIcon-uNoiXiGS.js";import"./ImageQuestion-mEAKYQpX.js";import"./build-round-order-A3U0v3Fq.js";const o={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},$={component:d,title:"Games/WordSpell/WordSpell",tags:["autodocs"],args:{config:o},decorators:[i,c]},r={},e={args:{config:{...o,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...o,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...o,tileBankMode:"distractors",distractorCount:3}}},a={args:{config:{...o,wrongTileBehavior:"lock-manual"}}},s={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
