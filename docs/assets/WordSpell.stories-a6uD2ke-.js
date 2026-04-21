import{w as i}from"./withDb-zNgcHOQy.js";import{w as d}from"./withRouter-DOA44UR1.js";import{W as m}from"./WordSpell-Bva9H1G-.js";import"./iframe-DHWYTY14.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-b9tdcsdZ.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./useNavigate-Bn8dap8r.js";import"./index-CgXnBekj.js";import"./index-D5xHRla3.js";import"./index-D27nWwse.js";import"./index-D_IKsdxf.js";import"./LetterTileBank-DiwXkkVv.js";import"./useTouchDrag-BL1NWDvc.js";import"./AnswerGameProvider-DK4kMSLo.js";import"./AudioFeedback-DxUgBcwr.js";import"./game-event-bus-CVIPXPct.js";import"./useDraggableTile-CO6Wcz8-.js";import"./useGameTTS-C8MKUVZ4.js";import"./useSettings-Ds9xmpUh.js";import"./useRxDB-BvrlX4Em.js";import"./useRxQuery-C14EXLrj.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-DXK-2lAF.js";import"./index-BVunHb9l.js";import"./filter-Bd5ZYMZU.js";import"./build-round-order-HVwi5R8f.js";import"./AnswerGame-YtI24_GP.js";import"./ProgressHUD-bd47Em81.js";import"./GameOverOverlay-DQe8QiiQ.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-C0dLN4ZT.js";import"./SentenceWithGaps-BlaAunC0.js";import"./SlotRow-B9Tk9JS1.js";import"./AudioButton-D1Ifm3xs.js";import"./createLucideIcon-DP0X2wSG.js";import"./ImageQuestion-BHQ1DGOg.js";const r={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},X={component:m,tags:["autodocs"],args:{config:r},decorators:[i,d]},o={},e={args:{config:{...r,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},t={args:{config:{...r,mode:"scramble"}}},a={args:{config:{...r,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},n={args:{config:{...r,tileBankMode:"distractors",distractorCount:3}}},s={args:{config:{...r,wrongTileBehavior:"lock-manual"}}},c={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:"{}",...o.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
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
      mode: 'scramble'
    }
  }
}`,...t.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
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
}`,...a.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      tileBankMode: 'distractors',
      distractorCount: 3
    }
  }
}`,...n.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      wrongTileBehavior: 'lock-manual'
    }
  }
}`,...s.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
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
}`,...c.parameters?.docs?.source}}};const Y=["PictureMode","RecallMode","ScrambleMode","SentenceGapMode","WithDistractors","LockManualWrongTile","LibrarySourced"];export{c as LibrarySourced,s as LockManualWrongTile,o as PictureMode,e as RecallMode,t as ScrambleMode,a as SentenceGapMode,n as WithDistractors,Y as __namedExportsOrder,X as default};
