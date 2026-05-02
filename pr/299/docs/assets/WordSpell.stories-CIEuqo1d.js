import{w as i}from"./withDb-RVX47Eok.js";import{w as c}from"./withRouter-53T1QFHm.js";import{W as d}from"./WordSpell-D4Yj4v19.js";import"./iframe-Bhhn5tG8.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-DAqSQfDn.js";import"./import-wrapper-prod-BvhX8vWv.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-DEBZZLHx.js";import"./index-B0Xv8fd_.js";import"./index-BAp_y-RZ.js";import"./index-Sb1TplSD.js";import"./LetterTileBank-CKtIqXQn.js";import"./styles-Cu2jWhUp.js";import"./AnswerGameProvider-oShqj59j.js";import"./AudioFeedback-DxUgBcwr.js";import"./useDraggableTile-DJR0ApGB.js";import"./useGameTTS-DFl9y7EW.js";import"./useSettings-TlzTXwQ-.js";import"./useRxDB-BhjAwjKP.js";import"./useRxQuery-BfqrqOR1.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-Cmc1I1EB.js";import"./index-gbydw3MP.js";import"./filter-ZouEJie2.js";import"./seen-words-DcIHDtfq.js";import"./seeded-random-CRwG4LlI.js";import"./shuffle-CSdRC5Ox.js";import"./AnswerGame-BmVVYIJ1.js";import"./ProgressHUD-DUnkCLLI.js";import"./GameOverOverlay-c0BCBFmo.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-DObKWbqZ.js";import"./SentenceWithGaps-yqsGP_fA.js";import"./SlotRow-BLGViVI-.js";import"./useRoundTTS-fS7rI4hj.js";import"./AudioButton-Dd84nfe3.js";import"./volume-2-pKpc0TGD.js";import"./createLucideIcon-OERv1LsJ.js";import"./ImageQuestion-B8JKw6vl.js";import"./build-round-order-M8zewhie.js";const o={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},oo={component:d,title:"Games/WordSpell/WordSpell",tags:["autodocs"],args:{config:o},decorators:[i,c]},r={},e={args:{config:{...o,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...o,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...o,tileBankMode:"distractors",distractorCount:3}}},a={args:{config:{...o,wrongTileBehavior:"lock-manual"}}},s={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
