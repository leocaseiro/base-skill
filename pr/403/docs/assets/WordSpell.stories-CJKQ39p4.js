import{w as i}from"./withDb-Bt0brGQk.js";import{w as c}from"./withRouter-DoLiTwy9.js";import{W as d}from"./WordSpell-D1kWpuD9.js";import"./iframe-0-GSJzeg.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-BJC3qxgn.js";import"./import-wrapper-prod-DB10rr0d.js";import"./Subject-B092pkfK.js";import"./phoneme-codes-BoyU28CG.js";import"./index-BOkI02cs.js";import"./useGameEngine-BwPXv8Gh.js";import"./AnswerGameProvider-Cdb5PhPX.js";import"./AudioFeedback--m-fHcTR.js";import"./useGameTTS-DZ1NxqGq.js";import"./useSettings-D7958JlZ.js";import"./useRxQuery-D38pxxTt.js";import"./safe-get-voices-dEfMv828.js";import"./SpeechOutput-BwPda79X.js";import"./synth-access-CUeUQ1FV.js";import"./voices-CJcKDBWI.js";import"./LetterTileBank-DwsYnUyz.js";import"./styles-Cu2jWhUp.js";import"./useDraggableTile-DJ9Z1jCG.js";import"./filter-DnmbHJ2q.js";import"./seen-words-DcIHDtfq.js";import"./seeded-random-CRwG4LlI.js";import"./shuffle-CSdRC5Ox.js";import"./AnswerGame-B7I46QpZ.js";import"./ProgressHUD-DWFnMxcA.js";import"./GameOverOverlay-DZCPDdBY.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-B_dfzku1.js";import"./SentenceWithGaps-BR_LTXUK.js";import"./SlotRow-_Qzdr0db.js";import"./AudioButton-DKui_COM.js";import"./volume-2-BmI5322g.js";import"./createLucideIcon-CfamiaXJ.js";import"./ImageQuestion-D247c6eJ.js";import"./useRxDB-CbRJrFxv.js";import"./build-round-order-EQ8FDuNI.js";const o={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},X={component:d,title:"Games/WordSpell/WordSpell",tags:["autodocs"],args:{config:o},decorators:[i,c]},r={},e={args:{config:{...o,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...o,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...o,tileBankMode:"distractors",distractorCount:3}}},a={args:{config:{...o,wrongTileBehavior:"lock-manual"}}},s={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
