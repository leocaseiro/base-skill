import{w as i}from"./withDb-qr46djUl.js";import{w as c}from"./withRouter-pONSEPzS.js";import{W as d}from"./WordSpell-BtGNfi4Y.js";import"./iframe-CRLeYpkl.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-B2e7AQM7.js";import"./import-wrapper-prod-vh_h_zt5.js";import"./Subject-BNQQJNrB.js";import"./phoneme-codes-BoyU28CG.js";import"./index-Cm5HbUFB.js";import"./useGameEngine-zABeHYIZ.js";import"./AnswerGameProvider-D12DjQOT.js";import"./AudioFeedback--m-fHcTR.js";import"./useGameTTS-op_3qSD2.js";import"./useSettings-BevXgVKj.js";import"./useRxQuery-BbC-gc5b.js";import"./safe-get-voices-dEfMv828.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./synth-access-CUeUQ1FV.js";import"./voices-CJcKDBWI.js";import"./LetterTileBank-Ciild_uQ.js";import"./styles-Cu2jWhUp.js";import"./useDraggableTile-waNOhs1n.js";import"./filter-DtC8lm8W.js";import"./seen-words-DcIHDtfq.js";import"./seeded-random-CRwG4LlI.js";import"./shuffle-CSdRC5Ox.js";import"./AnswerGame-B0vV7Fmq.js";import"./ProgressHUD-C7boFXzv.js";import"./GameOverOverlay-IRJXdPr7.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-xlqIBz3r.js";import"./SentenceWithGaps-B4mfqwLe.js";import"./SlotRow-CaqCVNnf.js";import"./AudioButton-CxZZatOx.js";import"./volume-2-sNzf88pe.js";import"./createLucideIcon-DhF0RU6u.js";import"./ImageQuestion-iI-AmLyk.js";import"./build-round-order-Cw-UZNCt.js";const o={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},V={component:d,title:"Games/WordSpell/WordSpell",tags:["autodocs"],args:{config:o},decorators:[i,c]},r={},e={args:{config:{...o,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...o,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...o,tileBankMode:"distractors",distractorCount:3}}},a={args:{config:{...o,wrongTileBehavior:"lock-manual"}}},s={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
