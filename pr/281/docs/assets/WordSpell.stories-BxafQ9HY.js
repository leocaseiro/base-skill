import{w as i}from"./withDb-CB8Jn6Qw.js";import{w as c}from"./withRouter-DRWkY3gW.js";import{W as d}from"./WordSpell-XQCCTQrJ.js";import"./iframe-CKWojryb.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-DzUCchDX.js";import"./import-wrapper-prod-DmL8akPq.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-18MsChr-.js";import"./index-dkFgZ21H.js";import"./index-H0jvLWhn.js";import"./index-Df6rvi_O.js";import"./LetterTileBank-Cga3WP-1.js";import"./styles-Cu2jWhUp.js";import"./AnswerGameProvider-CkbST85Q.js";import"./AudioFeedback-DxUgBcwr.js";import"./useDraggableTile-DtuJtn2H.js";import"./useGameTTS-BpeaCTYY.js";import"./useSettings-Cu7NESjl.js";import"./useRxDB-B9hrMmpI.js";import"./useRxQuery-CdA3BJMm.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-CbA3K0R8.js";import"./index-BSxAXZ4G.js";import"./filter-BwyJ2XWi.js";import"./seen-words-DcIHDtfq.js";import"./seeded-random-CRwG4LlI.js";import"./shuffle-CSdRC5Ox.js";import"./AnswerGame-Ey3xOB1J.js";import"./ProgressHUD-DtGLpvSf.js";import"./GameOverOverlay-OxJaNO8c.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-CmoDnMBk.js";import"./SentenceWithGaps-C8V3RRLN.js";import"./SlotRow-CFeuK9_h.js";import"./useRoundTTS-TJsEMOG3.js";import"./AudioButton-8Jo1iiL0.js";import"./volume-2-Gap4AzP1.js";import"./createLucideIcon-BdMkoeld.js";import"./ImageQuestion-CNXW1vSQ.js";import"./build-round-order-CT_3zTV1.js";const o={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},oo={component:d,title:"Games/WordSpell/WordSpell",tags:["autodocs"],args:{config:o},decorators:[i,c]},r={},e={args:{config:{...o,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...o,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...o,tileBankMode:"distractors",distractorCount:3}}},a={args:{config:{...o,wrongTileBehavior:"lock-manual"}}},s={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:"{}",...r.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
