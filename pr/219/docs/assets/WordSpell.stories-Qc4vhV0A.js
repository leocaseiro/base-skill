import{w as i}from"./withDb-D88lGhzr.js";import{w as c}from"./withRouter-BNBvNsuq.js";import{W as d}from"./WordSpell-DyE9eVXT.js";import"./iframe-wo7JtUpo.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-ByiZo7rS.js";import"./import-wrapper-prod-CE-_erUl.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-R58oE9OY.js";import"./index-DacR2e9K.js";import"./index-DDi4ehvf.js";import"./index-DwdL6NZv.js";import"./index-DYRucuFz.js";import"./LetterTileBank-D6ZQioh3.js";import"./useDraggableTile-DZNaVfKo.js";import"./AnswerGameProvider-CbfaeV06.js";import"./AudioFeedback-DxUgBcwr.js";import"./useGameTTS-iF0ZZj-g.js";import"./useSettings-DWcAGt5i.js";import"./useRxDB-WGz9oNgt.js";import"./useRxQuery-BtLqUi7x.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-D8Z7iY5B.js";import"./index-C1a4GNoa.js";import"./filter-RTuBL7yK.js";import"./seen-words-joX9c3ry.js";import"./seeded-random-CRwG4LlI.js";import"./AnswerGame-GczP1-ob.js";import"./ProgressHUD-dLixgxed.js";import"./GameOverOverlay-Df5_4Co9.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-CsNVaGHf.js";import"./SentenceWithGaps-D9NcBwTW.js";import"./SlotRow-BmeFoQcY.js";import"./build-round-order-CpK4ayS9.js";import"./AudioButton-DjDFcxIg.js";import"./createLucideIcon-DghRL_iF.js";import"./ImageQuestion-DnB5Wp3m.js";const o={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},X={component:d,tags:["autodocs"],args:{config:o},decorators:[i,c]},r={},e={args:{config:{...o,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...o,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...o,tileBankMode:"distractors",distractorCount:3}}},a={args:{config:{...o,wrongTileBehavior:"lock-manual"}}},s={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
