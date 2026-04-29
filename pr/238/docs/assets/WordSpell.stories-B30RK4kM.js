import{w as i}from"./withDb-BEmuPiyU.js";import{w as c}from"./withRouter-CVW0pWoi.js";import{W as d}from"./WordSpell-DDNN1LTm.js";import"./iframe-JOFpB_BS.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-C9TJYd4k.js";import"./import-wrapper-prod-v-KG9kRR.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-R58oE9OY.js";import"./index-DAH5EofU.js";import"./index-DHOo-nPp.js";import"./index-R0CQVwh1.js";import"./index-CqLGpwta.js";import"./LetterTileBank-BgzBuAfO.js";import"./useDraggableTile-CgbxpT0q.js";import"./AnswerGameProvider-B2MyEUUz.js";import"./AudioFeedback-DxUgBcwr.js";import"./useGameTTS-DCddLEP1.js";import"./useSettings-fOTnKDGt.js";import"./useRxDB-C0OujmSN.js";import"./useRxQuery-BOAy-8e_.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-DS62NUIr.js";import"./index-CRRpFToM.js";import"./filter-TYPQhBOf.js";import"./seen-words-joX9c3ry.js";import"./seeded-random-CRwG4LlI.js";import"./AnswerGame-MRKFrB0e.js";import"./ProgressHUD-C6I-PFNt.js";import"./GameOverOverlay-Ciq4uq1R.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-Czi6DD1R.js";import"./SentenceWithGaps-AaNSQRXs.js";import"./SlotRow-Bs9NSjcj.js";import"./build-round-order-dmohcUGl.js";import"./AudioButton-D918KPrK.js";import"./createLucideIcon-BbXcS_Ty.js";import"./ImageQuestion-C4f2vfJV.js";const o={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},X={component:d,tags:["autodocs"],args:{config:o},decorators:[i,c]},r={},e={args:{config:{...o,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...o,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...o,tileBankMode:"distractors",distractorCount:3}}},a={args:{config:{...o,wrongTileBehavior:"lock-manual"}}},s={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
}`,...s.parameters?.docs?.source}}};const Y=["PictureMode","RecallMode","SentenceGapMode","WithDistractors","LockManualWrongTile","LibrarySourced"];export{s as LibrarySourced,a as LockManualWrongTile,r as PictureMode,e as RecallMode,t as SentenceGapMode,n as WithDistractors,Y as __namedExportsOrder,X as default};
