import{w as i}from"./withDb-Bl3lfB8I.js";import{w as c}from"./withRouter-Btf4o6mY.js";import{W as d}from"./WordSpell-_jtlnlq0.js";import"./iframe-D5nHvxQ7.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-J4yE_CiV.js";import"./import-wrapper-prod-GZ0dXhr0.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-DdX-CrG1.js";import"./index-QMZjzbr-.js";import"./index-KiP_v2Mq.js";import"./index-DHtanlWf.js";import"./LetterTileBank-C4Xvmg7N.js";import"./useDraggableTile-C2i7gUGm.js";import"./AnswerGameProvider-KXVZlndN.js";import"./AudioFeedback-DxUgBcwr.js";import"./useGameTTS-Al3qKrYR.js";import"./useSettings-BeVN5vPB.js";import"./useRxDB-DURhetXZ.js";import"./useRxQuery-BYv9dUyB.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-CAnQt9DS.js";import"./index-C5JmEXEn.js";import"./filter-ckAEoBgD.js";import"./seen-words-joX9c3ry.js";import"./seeded-random-CRwG4LlI.js";import"./AnswerGame-C3Xd0duu.js";import"./ProgressHUD-CZyrTvgI.js";import"./GameOverOverlay-B_Zl7iGh.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-B6kSJ0rs.js";import"./SentenceWithGaps-rSWPO6mA.js";import"./SlotRow-D6bLOnXz.js";import"./build-round-order-BlNSJzRY.js";import"./AudioButton-CUeBMwFJ.js";import"./createLucideIcon-DXSF2Vvs.js";import"./ImageQuestion-D2xFlwnu.js";const o={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},X={component:d,title:"Games/WordSpell/WordSpell",tags:["autodocs"],args:{config:o},decorators:[i,c]},r={},e={args:{config:{...o,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...o,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...o,tileBankMode:"distractors",distractorCount:3}}},a={args:{config:{...o,wrongTileBehavior:"lock-manual"}}},s={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
