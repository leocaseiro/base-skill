import{w as i}from"./withDb-Be8teYmS.js";import{w as c}from"./withRouter-DgiT7AyH.js";import{W as d}from"./WordSpell-Drs3yI2k.js";import"./iframe-ZJQNgW1v.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-Cx7GPgQ4.js";import"./import-wrapper-prod-BtR3jkei.js";import"./Subject-D6Z_5iK4.js";import"./phoneme-codes-BoyU28CG.js";import"./index-CMEc1cGt.js";import"./useGameEngine-BGWzAuOW.js";import"./AnswerGameProvider-BjtNxAbK.js";import"./AudioFeedback--m-fHcTR.js";import"./useGameTTS-CwEXSx0r.js";import"./useSettings-De5_Jm51.js";import"./useRxQuery-2FQ_ICBA.js";import"./safe-get-voices-dEfMv828.js";import"./SpeechOutput-BwPda79X.js";import"./synth-access-CUeUQ1FV.js";import"./voices-CJcKDBWI.js";import"./LetterTileBank-HXEOU4MK.js";import"./styles-Cu2jWhUp.js";import"./useDraggableTile-Ii1xxABr.js";import"./filter-BXxFQq64.js";import"./seen-words-DcIHDtfq.js";import"./seeded-random-CRwG4LlI.js";import"./shuffle-CSdRC5Ox.js";import"./AnswerGame-RvUNqqZJ.js";import"./ProgressHUD-nneWmgL6.js";import"./GameOverOverlay-Db1kVLdr.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-B9kAhRSG.js";import"./SentenceWithGaps-B1gaNyPw.js";import"./SlotRow-DpwG0xzD.js";import"./AudioButton-CXopLeKF.js";import"./volume-2-CgYnIfsA.js";import"./createLucideIcon-CmUZfgAu.js";import"./ImageQuestion-Dkc5Hfll.js";import"./useRxDB-DCaR-YHu.js";import"./build-round-order-B_Kx5hNk.js";const o={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},X={component:d,title:"Games/WordSpell/WordSpell",tags:["autodocs"],args:{config:o},decorators:[i,c]},r={},e={args:{config:{...o,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...o,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...o,tileBankMode:"distractors",distractorCount:3}}},a={args:{config:{...o,wrongTileBehavior:"lock-manual"}}},s={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
