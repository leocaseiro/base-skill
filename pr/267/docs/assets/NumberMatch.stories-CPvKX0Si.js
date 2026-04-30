import{w as b}from"./withDb-h9GERZbd.js";import{w as T}from"./withRouter-DilvPTz5.js";import{N as S}from"./NumberMatch-C2mzYia_.js";import"./iframe-DLbYiQSB.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-BwrJJxVf.js";import"./import-wrapper-prod-qmdKVsEC.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-B8iUBYnp.js";import"./index-5Y00u9ZY.js";import"./index-C7Gh41vn.js";import"./DotGroupQuestion-C8Ap9KWn.js";import"./useGameTTS-B9ULMd67.js";import"./AnswerGameProvider-CoGDCrv-.js";import"./AudioFeedback-DxUgBcwr.js";import"./useSettings-Re05T1b5.js";import"./useRxDB-ClvXrfvt.js";import"./useRxQuery-DK7LMYI0.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-zP5ulaL-.js";import"./index-DkKF13o9.js";import"./NumeralTileBank-DZ2ingNM.js";import"./useDraggableTile-CYhZbeej.js";import"./tile-font-DQ9RrPM_.js";import"./AnswerGame-DMMx430O.js";import"./ProgressHUD-QDq7zEUv.js";import"./GameOverOverlay-CYQczvwk.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-uaEdJjfu.js";import"./SlotRow-Bhtj4jQS.js";import"./build-round-order-Cy_sFrKt.js";import"./seeded-random-CRwG4LlI.js";import"./AudioButton-D9BiP7dT.js";import"./createLucideIcon-DBe06pgQ.js";import"./TextQuestion-bA5JPtiY.js";const r={gameId:"number-match-storybook",component:"NumberMatch",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"numeral-to-group",tileStyle:"dots",range:{min:1,max:5},rounds:[{value:3},{value:1},{value:5}]},ar={component:S,title:"Games/NumberMatch/NumberMatch",tags:["autodocs"],args:{config:r},decorators:[b,T]},e={},o={args:{config:{...r,mode:"group-to-numeral"}}},a={args:{config:{...r,mode:"cardinal-number-to-text",tileStyle:"fingers"}}},t={args:{config:{...r,mode:"cardinal-text-to-number",tileStyle:"fingers"}}},n={args:{config:{...r,mode:"ordinal-number-to-text",tileStyle:"fingers"}}},s={args:{config:{...r,mode:"ordinal-text-to-number",tileStyle:"fingers"}}},i={args:{config:{...r,mode:"cardinal-to-ordinal",tileStyle:"fingers"}}},m={args:{config:{...r,mode:"ordinal-to-cardinal",tileStyle:"fingers"}}},c={args:{config:{...r,tileStyle:"dots"}}},l={args:{config:{...r,tileStyle:"objects",rounds:[{value:3,objectImage:"https://placehold.co/32?text=🍎"}]}}},f={...r,mode:"numeral-to-group",tileStyle:"dots",tileBankMode:"distractors",distractorCount:3,range:{min:1e4,max:99999},rounds:[{value:10002},{value:19467},{value:99999}]},p={args:{config:f}},u={args:{config:f},parameters:{viewport:{defaultViewport:"mobileLg"}}},d={args:{config:f},parameters:{viewport:{defaultViewport:"tabletPortrait"}}},g={args:{config:f},parameters:{viewport:{defaultViewport:"desktop"}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'group-to-numeral'
    }
  }
}`,...o.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'cardinal-number-to-text',
      tileStyle: 'fingers'
    }
  }
}`,...a.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'cardinal-text-to-number',
      tileStyle: 'fingers'
    }
  }
}`,...t.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'ordinal-number-to-text',
      tileStyle: 'fingers'
    }
  }
}`,...n.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'ordinal-text-to-number',
      tileStyle: 'fingers'
    }
  }
}`,...s.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'cardinal-to-ordinal',
      tileStyle: 'fingers'
    }
  }
}`,...i.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'ordinal-to-cardinal',
      tileStyle: 'fingers'
    }
  }
}`,...m.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      tileStyle: 'dots'
    }
  }
}`,...c.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      tileStyle: 'objects',
      rounds: [{
        value: 3,
        objectImage: 'https://placehold.co/32?text=🍎'
      }]
    }
  }
}`,...l.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    config: numeralToGroupLongLabelsConfig
  }
}`,...p.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    config: numeralToGroupLongLabelsConfig
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobileLg'
    }
  }
}`,...u.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    config: numeralToGroupLongLabelsConfig
  },
  parameters: {
    viewport: {
      defaultViewport: 'tabletPortrait'
    }
  }
}`,...d.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    config: numeralToGroupLongLabelsConfig
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop'
    }
  }
}`,...g.parameters?.docs?.source}}};const tr=["NumeralToGroup","GroupToNumeral","CardinalNumberToText","CardinalTextToNumber","OrdinalNumberToText","OrdinalTextToNumber","CardinalToOrdinal","OrdinalToCardinal","DotsStyle","ObjectsStyle","NumeralToGroupLongLabels","NumeralToGroupLongLabelsMobile","NumeralToGroupLongLabelsTabletPortrait","NumeralToGroupLongLabelsDesktop"];export{a as CardinalNumberToText,t as CardinalTextToNumber,i as CardinalToOrdinal,c as DotsStyle,o as GroupToNumeral,e as NumeralToGroup,p as NumeralToGroupLongLabels,g as NumeralToGroupLongLabelsDesktop,u as NumeralToGroupLongLabelsMobile,d as NumeralToGroupLongLabelsTabletPortrait,l as ObjectsStyle,n as OrdinalNumberToText,s as OrdinalTextToNumber,m as OrdinalToCardinal,tr as __namedExportsOrder,ar as default};
