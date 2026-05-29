import{w as i}from"./withDb-DFaH-WO1.js";import{w as c}from"./withRouter-qBDTefQo.js";import{W as d}from"./WordSpell-CnsBBopT.js";import"./iframe-DJm7UBnT.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-ii0l-pTT.js";import"./import-wrapper-prod-DLKzGee7.js";import"./Subject-dqPabvlm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-Cw-ffZwe.js";import"./useGameEngine-CcA_bR7j.js";import"./AnswerGameProvider-BtzmAPOU.js";import"./AudioFeedback--m-fHcTR.js";import"./useGameTTS-CsP4I1Sy.js";import"./useSettings-BF7ZVBFx.js";import"./useRxQuery-D45Q3vQw.js";import"./voices-BsnJG_W_.js";import"./SpeechOutput-f45Kz2kS.js";import"./synth-access-CUeUQ1FV.js";import"./LetterTileBank-BiKefcmT.js";import"./styles-Cu2jWhUp.js";import"./useDraggableTile-CVThVw1N.js";import"./filter-CDj9pxRV.js";import"./seen-words-DcIHDtfq.js";import"./seeded-random-CRwG4LlI.js";import"./shuffle-CSdRC5Ox.js";import"./AnswerGame-BLcTQEWL.js";import"./ProgressHUD-B1RnqPUs.js";import"./GameOverOverlay-BTuuIH-v.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-gEW6XmoT.js";import"./SentenceWithGaps-C9bjkNWY.js";import"./SlotRow-IRysP9cV.js";import"./AudioButton-DhQrStcQ.js";import"./volume-2-DH3YgIcR.js";import"./createLucideIcon-iVDoaMjK.js";import"./ImageQuestion-BGD7BvUW.js";import"./useRxDB-LAaa2X7a.js";import"./build-round-order-B1fTaIvN.js";const o={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},V={component:d,title:"Games/WordSpell/WordSpell",tags:["autodocs"],args:{config:o},decorators:[i,c]},r={},e={args:{config:{...o,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...o,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...o,tileBankMode:"distractors",distractorCount:3}}},a={args:{config:{...o,wrongTileBehavior:"lock-manual"}}},s={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
}`,...s.parameters?.docs?.source}}};const X=["PictureMode","RecallMode","SentenceGapMode","WithDistractors","LockManualWrongTile","LibrarySourced"];export{s as LibrarySourced,a as LockManualWrongTile,r as PictureMode,e as RecallMode,t as SentenceGapMode,n as WithDistractors,X as __namedExportsOrder,V as default};
