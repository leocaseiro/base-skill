import{w as b}from"./withDb-CCxKurer.js";import{w as T}from"./withRouter-DGbDEhLQ.js";import{N as S}from"./NumberMatch-Dd7BInt2.js";import"./iframe-Dl-56X-q.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-BKlolqwm.js";import"./import-wrapper-prod-sGeRMdXS.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-CezpSy9m.js";import"./index-CI5IKCo_.js";import"./index-B2JTt-z9.js";import"./DotGroupQuestion-DRFgfYW8.js";import"./useGameTTS-CNtdQFkl.js";import"./AnswerGameProvider-Yb40b3pP.js";import"./AudioFeedback-DxUgBcwr.js";import"./useSettings-Ba7vm3Me.js";import"./useRxDB-r4W9AEHh.js";import"./useRxQuery-Dtk1JmUA.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-DIQ1qCK7.js";import"./index-B7apApJx.js";import"./NumeralTileBank-BGgLxHI5.js";import"./styles-Cu2jWhUp.js";import"./tile-font-DQ9RrPM_.js";import"./useDraggableTile-CF9s10Xe.js";import"./AnswerGame-BlPVlhx_.js";import"./ProgressHUD-CicsHIfi.js";import"./GameOverOverlay-CyOU8T1q.js";import"./confetti.module-oQXWb4Lk.js";import"./ScoreAnimation-63E6t9Ib.js";import"./SlotRow-CJc_AeuR.js";import"./useRoundTTS-C9KQC1v2.js";import"./AudioButton-tJZ3OxHW.js";import"./volume-2-BaOsSlH3.js";import"./createLucideIcon-DSd6sCUr.js";import"./TextQuestion-B-kngywX.js";import"./build-round-order-Bx9AKHik.js";import"./seeded-random-CRwG4LlI.js";const r={gameId:"number-match-storybook",component:"NumberMatch",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"numeral-to-group",tileStyle:"dots",range:{min:1,max:5},rounds:[{value:3},{value:1},{value:5}]},sr={component:S,title:"Games/NumberMatch/NumberMatch",tags:["autodocs"],args:{config:r},decorators:[b,T]},e={},o={args:{config:{...r,mode:"group-to-numeral"}}},a={args:{config:{...r,mode:"cardinal-number-to-text",tileStyle:"fingers"}}},t={args:{config:{...r,mode:"cardinal-text-to-number",tileStyle:"fingers"}}},n={args:{config:{...r,mode:"ordinal-number-to-text",tileStyle:"fingers"}}},s={args:{config:{...r,mode:"ordinal-text-to-number",tileStyle:"fingers"}}},i={args:{config:{...r,mode:"cardinal-to-ordinal",tileStyle:"fingers"}}},m={args:{config:{...r,mode:"ordinal-to-cardinal",tileStyle:"fingers"}}},c={args:{config:{...r,tileStyle:"dots"}}},l={args:{config:{...r,tileStyle:"objects",rounds:[{value:3,objectImage:"https://placehold.co/32?text=🍎"}]}}},f={...r,mode:"numeral-to-group",tileStyle:"dots",tileBankMode:"distractors",distractorCount:3,range:{min:1e4,max:99999},rounds:[{value:10002},{value:19467},{value:99999}]},p={args:{config:f}},u={args:{config:f},parameters:{viewport:{defaultViewport:"mobileLg"}}},d={args:{config:f},parameters:{viewport:{defaultViewport:"tabletPortrait"}}},g={args:{config:f},parameters:{viewport:{defaultViewport:"desktop"}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
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
}`,...g.parameters?.docs?.source}}};const ir=["NumeralToGroup","GroupToNumeral","CardinalNumberToText","CardinalTextToNumber","OrdinalNumberToText","OrdinalTextToNumber","CardinalToOrdinal","OrdinalToCardinal","DotsStyle","ObjectsStyle","NumeralToGroupLongLabels","NumeralToGroupLongLabelsMobile","NumeralToGroupLongLabelsTabletPortrait","NumeralToGroupLongLabelsDesktop"];export{a as CardinalNumberToText,t as CardinalTextToNumber,i as CardinalToOrdinal,c as DotsStyle,o as GroupToNumeral,e as NumeralToGroup,p as NumeralToGroupLongLabels,g as NumeralToGroupLongLabelsDesktop,u as NumeralToGroupLongLabelsMobile,d as NumeralToGroupLongLabelsTabletPortrait,l as ObjectsStyle,n as OrdinalNumberToText,s as OrdinalTextToNumber,m as OrdinalToCardinal,ir as __namedExportsOrder,sr as default};
