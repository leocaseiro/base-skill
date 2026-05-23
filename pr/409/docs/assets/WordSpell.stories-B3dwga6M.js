import{w as i}from"./withDb-CN1i8sYY.js";import{w as c}from"./withRouter-CxcP8VTe.js";import{W as d}from"./WordSpell-DLvh9z3S.js";import"./iframe-BjsHPK0O.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-BbqFirJV.js";import"./import-wrapper-prod-CsmLB0se.js";import"./Subject-zuDILW9n.js";import"./phoneme-codes-BoyU28CG.js";import"./index-BEEWyV6B.js";import"./useGameEngine-DUXs3OpZ.js";import"./AnswerGameProvider-BohvF3Jg.js";import"./AudioFeedback--m-fHcTR.js";import"./useGameTTS-p3dRVyq3.js";import"./useSettings-DcCvriQ_.js";import"./useRxQuery-DFsmEgcH.js";import"./safe-get-voices-dEfMv828.js";import"./SpeechOutput-BwPda79X.js";import"./synth-access-CUeUQ1FV.js";import"./voices-CJcKDBWI.js";import"./LetterTileBank-BG7PPkf-.js";import"./styles-Cu2jWhUp.js";import"./useDraggableTile-C0UepIuX.js";import"./filter-CoVfCzFm.js";import"./seen-words-DcIHDtfq.js";import"./seeded-random-CRwG4LlI.js";import"./shuffle-CSdRC5Ox.js";import"./AnswerGame-BShojbtl.js";import"./ProgressHUD-C4j_zjEy.js";import"./GameOverOverlay-eOEqyenS.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-CqUIzqz8.js";import"./SentenceWithGaps-CpRO_EnU.js";import"./SlotRow-CRoygfUa.js";import"./AudioButton-BDpNU4J2.js";import"./volume-2-Ho4h1kQh.js";import"./createLucideIcon-DnNR98mX.js";import"./ImageQuestion-BEB6OrN1.js";import"./build-round-order-C6nhwgI5.js";const o={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},V={component:d,title:"Games/WordSpell/WordSpell",tags:["autodocs"],args:{config:o},decorators:[i,c]},r={},e={args:{config:{...o,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...o,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...o,tileBankMode:"distractors",distractorCount:3}}},a={args:{config:{...o,wrongTileBehavior:"lock-manual"}}},s={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
