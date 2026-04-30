import{w as i}from"./withDb-sBJh7Nmw.js";import{w as c}from"./withRouter-BF5EtBAw.js";import{W as d}from"./WordSpell-BJxkkJvM.js";import"./iframe-Btf0MVG-.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-Ch0iyDbP.js";import"./import-wrapper-prod-B6jQ0Rzs.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-C-BMG_MK.js";import"./index-CH-GRBc_.js";import"./index-DNmi0W8B.js";import"./index-CrYWqST2.js";import"./LetterTileBank-vaz4UW-i.js";import"./useDraggableTile-L7gVNtCf.js";import"./AnswerGameProvider-BP61C48R.js";import"./AudioFeedback-DxUgBcwr.js";import"./useGameTTS-gfsGWOJw.js";import"./useSettings-_pgeIHmt.js";import"./useRxDB-B9hQj7EX.js";import"./useRxQuery-DP6AKXk4.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-DhsrNpUv.js";import"./index-iFqD3Cmd.js";import"./filter-CWxoUazn.js";import"./seen-words-joX9c3ry.js";import"./seeded-random-CRwG4LlI.js";import"./AnswerGame-Cslt5nhu.js";import"./ProgressHUD-Bw3k3mxf.js";import"./GameOverOverlay-CIDr6To2.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-COC8hEdo.js";import"./SentenceWithGaps-BAADmYoq.js";import"./SlotRow-BclZ59rx.js";import"./build-round-order-fi8cdsnC.js";import"./AudioButton-9FQBIp0U.js";import"./createLucideIcon-B-dE87Te.js";import"./ImageQuestion-BnF2gmBQ.js";const o={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},X={component:d,title:"Games/WordSpell/WordSpell",tags:["autodocs"],args:{config:o},decorators:[i,c]},r={},e={args:{config:{...o,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...o,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...o,tileBankMode:"distractors",distractorCount:3}}},a={args:{config:{...o,wrongTileBehavior:"lock-manual"}}},s={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
