import{w as i}from"./withDb-tcHwnAbZ.js";import{w as c}from"./withRouter-i2txH3_G.js";import{W as d}from"./WordSpell-BZImve0y.js";import"./iframe-BwIyFV8k.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-D4uxFma0.js";import"./import-wrapper-prod-qTDRhI1Z.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-DQZux3Wn.js";import"./index-Du8PeJiV.js";import"./index-6unAHvJv.js";import"./index-lSIBiPBv.js";import"./useGameEngine-BTvf5kH5.js";import"./AnswerGameProvider-A7ZCw7p4.js";import"./AudioFeedback--m-fHcTR.js";import"./useGameTTS-ChWQvKjE.js";import"./useSettings-DRvpoqqB.js";import"./useRxQuery-DwglD84i.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-CpZB28m4.js";import"./index-D67DG-KY.js";import"./LetterTileBank-ZXwELQZh.js";import"./styles-Cu2jWhUp.js";import"./useDraggableTile-CGAXaK0Z.js";import"./filter-CqfMOXxr.js";import"./seen-words-DcIHDtfq.js";import"./seeded-random-CRwG4LlI.js";import"./shuffle-CSdRC5Ox.js";import"./AnswerGame-IXeCsm5x.js";import"./ProgressHUD-DcTtNrCo.js";import"./GameOverOverlay-9zL-ZVyd.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-B6wzG7NP.js";import"./SentenceWithGaps-B-TV6f3b.js";import"./SlotRow--FZAV1n5.js";import"./AudioButton-sx99_jeg.js";import"./volume-2-o3bFOTJr.js";import"./createLucideIcon-Cs5NhWb3.js";import"./ImageQuestion-D3mxkcN2.js";import"./build-round-order-bxwM06HV.js";const o={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},$={component:d,title:"Games/WordSpell/WordSpell",tags:["autodocs"],args:{config:o},decorators:[i,c]},r={},e={args:{config:{...o,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...o,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...o,tileBankMode:"distractors",distractorCount:3}}},a={args:{config:{...o,wrongTileBehavior:"lock-manual"}}},s={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
