import{w as i}from"./withDb-DAtjbp_h.js";import{w as c}from"./withRouter-BAMOBZH2.js";import{W as d}from"./WordSpell-DqkWk6Vl.js";import"./iframe-D9YK9eSW.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-By7l1Hto.js";import"./import-wrapper-prod-DHGKx1Gh.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-R58oE9OY.js";import"./index-BG93-DbC.js";import"./index-jdC0b6iO.js";import"./index-C40jFf_y.js";import"./index-BzaMgksV.js";import"./LetterTileBank-D9lSFgJg.js";import"./useDraggableTile-Kvhsh8hP.js";import"./AnswerGameProvider-ChveOu2P.js";import"./AudioFeedback-DxUgBcwr.js";import"./useGameTTS-ChcnokrU.js";import"./useSettings-BsZCJVLz.js";import"./useRxDB-CMUIl8Eu.js";import"./useRxQuery-D-gfhbS0.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-B6IvoxGs.js";import"./index-BAYK1oTe.js";import"./filter-YkLxCoYR.js";import"./seen-words-joX9c3ry.js";import"./seeded-random-CRwG4LlI.js";import"./AnswerGame-CaE2GRo9.js";import"./ProgressHUD-BghUJ-AM.js";import"./GameOverOverlay-CtqlGI29.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-0tat-Vsz.js";import"./SentenceWithGaps-D6S4mLZR.js";import"./SlotRow-CLtmDNk1.js";import"./build-round-order-BPtKjCet.js";import"./AudioButton-C9YOMtF7.js";import"./createLucideIcon-D4jsHOLN.js";import"./ImageQuestion-BwxSu3oG.js";const o={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},X={component:d,title:"Games/WordSpell/WordSpell",tags:["autodocs"],args:{config:o},decorators:[i,c]},r={},e={args:{config:{...o,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...o,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...o,tileBankMode:"distractors",distractorCount:3}}},a={args:{config:{...o,wrongTileBehavior:"lock-manual"}}},s={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
