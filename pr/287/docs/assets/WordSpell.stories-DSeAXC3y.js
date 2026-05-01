import{w as i}from"./withDb-DteAr5_d.js";import{w as c}from"./withRouter-CJwCnXym.js";import{W as d}from"./WordSpell-Cp83XJ0p.js";import"./iframe-Z-pVInAS.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-BmHX1n_t.js";import"./import-wrapper-prod-BsWpsTFP.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-BmZQsAg1.js";import"./index-CyvibL2P.js";import"./index-Btb_pLCn.js";import"./index-BuhLc9AM.js";import"./LetterTileBank-BCyaDZou.js";import"./styles-Cu2jWhUp.js";import"./AnswerGameProvider-BxVroeMK.js";import"./AudioFeedback-DxUgBcwr.js";import"./useDraggableTile-DGSr_Ofb.js";import"./useGameTTS-B1V4KQwI.js";import"./useSettings-CLVSxsjZ.js";import"./useRxDB-CNKwglp1.js";import"./useRxQuery-BDav282l.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-DzeCC3ek.js";import"./index-ClGlAUK1.js";import"./filter-Dkq6sRmB.js";import"./seen-words-DcIHDtfq.js";import"./seeded-random-CRwG4LlI.js";import"./shuffle-CSdRC5Ox.js";import"./AnswerGame-ukYdpAPu.js";import"./ProgressHUD-CZcnbH2K.js";import"./GameOverOverlay-Dqwz0djL.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-CI02fgPO.js";import"./SentenceWithGaps-FlEZjHJS.js";import"./SlotRow-1BHciADv.js";import"./useRoundTTS-CMM7V3Da.js";import"./AudioButton-BPCxiZol.js";import"./volume-2-CfojFGot.js";import"./createLucideIcon-Cd1aAz2C.js";import"./ImageQuestion-DFViH2Ew.js";import"./build-round-order-BNS14Zeg.js";const o={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},oo={component:d,title:"Games/WordSpell/WordSpell",tags:["autodocs"],args:{config:o},decorators:[i,c]},r={},e={args:{config:{...o,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...o,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...o,tileBankMode:"distractors",distractorCount:3}}},a={args:{config:{...o,wrongTileBehavior:"lock-manual"}}},s={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
