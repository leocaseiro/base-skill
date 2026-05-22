import{w as i}from"./withDb-C-UQv6eD.js";import{w as c}from"./withRouter-krGHWgUL.js";import{W as p}from"./WordSpell-CLm2eXLq.js";import"./iframe-OZ5J_R0h.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-CuvKb-_0.js";import"./import-wrapper-prod-BghuaIMp.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-Bt9_6zw0.js";import"./index-DrXMuogA.js";import"./index-BHykasLq.js";import"./index-DfHMxAvr.js";import"./useGameEngine-BtDNpP1e.js";import"./AnswerGameProvider-Ymt29GmW.js";import"./AudioFeedback--m-fHcTR.js";import"./useGameTTS-Drzai2xi.js";import"./useSettings-CbC_odEU.js";import"./useRxQuery-shnYTBDq.js";import"./safe-get-voices-dEfMv828.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./alert-dialog-C1jLABiQ.js";import"./button-BmoWGMo2.js";import"./utils-BQHNewu7.js";import"./index-oeYWnyMa.js";import"./index-BPqPlZmN.js";import"./index-ChLiWUQ4.js";import"./index-xEglOifN.js";import"./index-Dt9XNzEF.js";import"./index-CQDJgBBL.js";import"./useTranslation-DqEAayLJ.js";import"./index-DMlz9kwd.js";import"./LetterTileBank-B5WG-34t.js";import"./styles-Cu2jWhUp.js";import"./useDraggableTile-fSg9cfCb.js";import"./filter-pR_vh0ca.js";import"./seen-words-DcIHDtfq.js";import"./seeded-random-CRwG4LlI.js";import"./shuffle-CSdRC5Ox.js";import"./AnswerGame-zHxKNI6w.js";import"./ProgressHUD-B4CKjDdj.js";import"./GameOverOverlay-CLlc_muA.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-L5wuWyPe.js";import"./SentenceWithGaps-DsquBoBQ.js";import"./SlotRow-mLNrR3fx.js";import"./AudioButton-B3NibQ9r.js";import"./volume-2-BebBWrXD.js";import"./createLucideIcon-DUnvs4qO.js";import"./ImageQuestion-CyxHk73W.js";import"./build-round-order-BNhhAC9g.js";const o={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},co={component:p,title:"Games/WordSpell/WordSpell",tags:["autodocs"],args:{config:o},decorators:[i,c]},r={},e={args:{config:{...o,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...o,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...o,tileBankMode:"distractors",distractorCount:3}}},a={args:{config:{...o,wrongTileBehavior:"lock-manual"}}},s={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
}`,...s.parameters?.docs?.source}}};const po=["PictureMode","RecallMode","SentenceGapMode","WithDistractors","LockManualWrongTile","LibrarySourced"];export{s as LibrarySourced,a as LockManualWrongTile,r as PictureMode,e as RecallMode,t as SentenceGapMode,n as WithDistractors,po as __namedExportsOrder,co as default};
