import{j as x}from"./iframe-CwyqRM9z.js";import{w as v}from"./withDb-8yZFpiv4.js";import{w as R}from"./withRouter-DwkPE-I0.js";import{S as M,c as S}from"./SortNumbers-D8-GSzeb.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-7gorh3PD.js";import"./import-wrapper-prod-CxCZGemI.js";import"./Subject-D3vFcUgp.js";import"./tslib.es6--Hu8dhvm.js";import"./phoneme-codes-BoyU28CG.js";import"./index-DkU4Rbkb.js";import"./index-BOPSXTrM.js";import"./index-wV1QFpLG.js";import"./shuffle-CSdRC5Ox.js";import"./useGameEngine-D_ngRr0e.js";import"./AnswerGameProvider-dPk7JTip.js";import"./AudioFeedback--m-fHcTR.js";import"./useGameTTS-ptLFT3sr.js";import"./useSettings-BvpnjzjC.js";import"./useRxQuery-C682jPkL.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-MplZKjLU.js";import"./index-D9hKDCka.js";import"./SortNumbersTileBank-CGA-_KtY.js";import"./styles-Cu2jWhUp.js";import"./tile-font-DQ9RrPM_.js";import"./useDraggableTile-DAom_lkc.js";import"./AnswerGame-7H-A7Pz-.js";import"./ProgressHUD-BFWYbi66.js";import"./GameOverOverlay-Cbgd7KVg.js";import"./confetti.module-oQXWb4Lk.js";import"./LevelCompleteOverlay-DKQsToAc.js";import"./ScoreAnimation-DVX9GmSp.js";import"./SlotRow-B-bL5Oos.js";import"./build-round-order-B4PvVGmg.js";import"./seeded-random-CRwG4LlI.js";const e={gameId:"sort-numbers",component:"SortNumbers",inputMethod:"drag",wrongTileBehavior:"lock-manual",tileBankMode:"exact",totalRounds:3,roundsInOrder:!1,ttsEnabled:!1,direction:"ascending",range:{min:2,max:20},quantity:4,skip:{mode:"consecutive"},distractors:{source:"random",count:2},rounds:[{sequence:[3,4,5,6]},{sequence:[7,8,9,10]},{sequence:[11,12,13,14]}]},de={component:M,title:"Games/SortNumbers/SortNumbers",tags:["autodocs"],decorators:[v,R],args:{config:e,skinId:"classic"},argTypes:{skinId:{name:"Skin",control:"select",options:["classic"],description:"Skin selector. Only `classic` ships in this PR; additional skins are added in follow-up PRs."}},render:({config:y,skinId:L})=>x.jsx(M,{config:{...y,skin:L}})},n={},s={args:{config:{...e,skip:{mode:"by",step:3,start:"range-min"},rounds:[{sequence:[2,5,8,11]},{sequence:[2,5,8,11]},{sequence:[2,5,8,11]}]}}},o={args:{config:{...e,skip:{mode:"random"},rounds:[{sequence:[2,7,12,18]},{sequence:[3,6,11,15]},{sequence:[4,9,14,20]}]}}},r={args:{config:{...e,tileBankMode:"distractors",distractors:{source:"random",count:3}}}},t={args:{config:{...e,skip:{mode:"by",step:2,start:"range-min"},tileBankMode:"distractors",distractors:{source:"gaps-only",count:"all"},rounds:[{sequence:[2,4,6,8]},{sequence:[2,4,6,8]},{sequence:[2,4,6,8]}]}}},a={args:{config:{...e,tileBankMode:"distractors",distractors:{source:"full-range",count:4}}}},i={args:{config:{...e,configMode:"simple",direction:"ascending",quantity:5,skip:{mode:"by",step:2,start:2},range:{min:2,max:10},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[2,4,6,8,10]}]}}},c={args:{config:{...e,configMode:"simple",direction:"ascending",quantity:5,skip:{mode:"by",step:2,start:2},range:{min:2,max:10},tileBankMode:"distractors",distractors:{source:"gaps-only",count:"all"},totalRounds:1,rounds:[{sequence:[2,4,6,8,10]}]}}},d={args:{config:{...e,configMode:"simple",direction:"descending",quantity:5,skip:{mode:"by",step:2,start:2},range:{min:2,max:10},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[2,4,6,8,10]}]}}},m={args:{config:{...e,configMode:"advanced",skip:{mode:"by",step:2,start:3},range:{min:1,max:20},rounds:[{sequence:[3,5,7,9]},{sequence:[3,5,7,9]},{sequence:[3,5,7,9]}]}}},p={args:{config:{...e,configMode:"simple",direction:"ascending",quantity:5,skip:{mode:"by",step:2,start:2},range:{min:2,max:10},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[2,4,6,8,10]}],levelMode:{generateNextLevel:S({start:2,step:2,quantity:5,direction:"ascending"})}}}},u={args:{config:{...e,configMode:"simple",direction:"ascending",quantity:3,skip:{mode:"by",step:5,start:5},range:{min:5,max:15},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[5,10,15]}],levelMode:{maxLevels:3,generateNextLevel:S({start:5,step:5,quantity:3,direction:"ascending"})}}}},g={args:{config:{...e,configMode:"simple",direction:"descending",quantity:4,skip:{mode:"by",step:3,start:3},range:{min:3,max:12},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[3,6,9,12]}],levelMode:{generateNextLevel:S({start:3,step:3,quantity:4,direction:"descending"})}}}},k={...e,totalRounds:1,quantity:10,range:{min:1e3,max:1e4},distractors:{source:"random",count:0},rounds:[{sequence:[1e3,2e3,3e3,4e3,5e3,6e3,7e3,8e3,9e3,1e4]}]},l={args:{config:k}},f={args:{config:k},parameters:{viewport:{defaultViewport:"mobileLg"}}},b={args:{config:k},parameters:{viewport:{defaultViewport:"tabletPortrait"}}},q={args:{config:k},parameters:{viewport:{defaultViewport:"desktop"}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:"{}",...n.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      skip: {
        mode: 'by',
        step: 3,
        start: 'range-min'
      },
      rounds: [{
        sequence: [2, 5, 8, 11]
      }, {
        sequence: [2, 5, 8, 11]
      }, {
        sequence: [2, 5, 8, 11]
      }]
    }
  }
}`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      skip: {
        mode: 'random'
      },
      rounds: [{
        sequence: [2, 7, 12, 18]
      }, {
        sequence: [3, 6, 11, 15]
      }, {
        sequence: [4, 9, 14, 20]
      }]
    }
  }
}`,...o.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      tileBankMode: 'distractors',
      distractors: {
        source: 'random',
        count: 3
      }
    }
  }
}`,...r.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      skip: {
        mode: 'by',
        step: 2,
        start: 'range-min'
      },
      tileBankMode: 'distractors',
      distractors: {
        source: 'gaps-only',
        count: 'all'
      },
      rounds: [{
        sequence: [2, 4, 6, 8]
      }, {
        sequence: [2, 4, 6, 8]
      }, {
        sequence: [2, 4, 6, 8]
      }]
    }
  }
}`,...t.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      tileBankMode: 'distractors',
      distractors: {
        source: 'full-range',
        count: 4
      }
    }
  }
}`,...a.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      configMode: 'simple',
      direction: 'ascending',
      quantity: 5,
      skip: {
        mode: 'by',
        step: 2,
        start: 2
      },
      range: {
        min: 2,
        max: 10
      },
      tileBankMode: 'exact',
      totalRounds: 1,
      rounds: [{
        sequence: [2, 4, 6, 8, 10]
      }]
    }
  }
}`,...i.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      configMode: 'simple',
      direction: 'ascending',
      quantity: 5,
      skip: {
        mode: 'by',
        step: 2,
        start: 2
      },
      range: {
        min: 2,
        max: 10
      },
      tileBankMode: 'distractors',
      distractors: {
        source: 'gaps-only',
        count: 'all'
      },
      totalRounds: 1,
      rounds: [{
        sequence: [2, 4, 6, 8, 10]
      }]
    }
  }
}`,...c.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      configMode: 'simple',
      direction: 'descending',
      quantity: 5,
      skip: {
        mode: 'by',
        step: 2,
        start: 2
      },
      range: {
        min: 2,
        max: 10
      },
      tileBankMode: 'exact',
      totalRounds: 1,
      rounds: [{
        sequence: [2, 4, 6, 8, 10]
      }]
    }
  }
}`,...d.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      configMode: 'advanced',
      skip: {
        mode: 'by',
        step: 2,
        start: 3
      },
      range: {
        min: 1,
        max: 20
      },
      rounds: [{
        sequence: [3, 5, 7, 9]
      }, {
        sequence: [3, 5, 7, 9]
      }, {
        sequence: [3, 5, 7, 9]
      }]
    }
  }
}`,...m.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      configMode: 'simple',
      direction: 'ascending',
      quantity: 5,
      skip: {
        mode: 'by',
        step: 2,
        start: 2
      },
      range: {
        min: 2,
        max: 10
      },
      tileBankMode: 'exact',
      totalRounds: 1,
      rounds: [{
        sequence: [2, 4, 6, 8, 10]
      }],
      levelMode: {
        generateNextLevel: createSortNumbersLevelGenerator({
          start: 2,
          step: 2,
          quantity: 5,
          direction: 'ascending'
        })
      }
    }
  }
}`,...p.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      configMode: 'simple',
      direction: 'ascending',
      quantity: 3,
      skip: {
        mode: 'by',
        step: 5,
        start: 5
      },
      range: {
        min: 5,
        max: 15
      },
      tileBankMode: 'exact',
      totalRounds: 1,
      rounds: [{
        sequence: [5, 10, 15]
      }],
      levelMode: {
        maxLevels: 3,
        generateNextLevel: createSortNumbersLevelGenerator({
          start: 5,
          step: 5,
          quantity: 3,
          direction: 'ascending'
        })
      }
    }
  }
}`,...u.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      configMode: 'simple',
      direction: 'descending',
      quantity: 4,
      skip: {
        mode: 'by',
        step: 3,
        start: 3
      },
      range: {
        min: 3,
        max: 12
      },
      tileBankMode: 'exact',
      totalRounds: 1,
      rounds: [{
        sequence: [3, 6, 9, 12]
      }],
      levelMode: {
        generateNextLevel: createSortNumbersLevelGenerator({
          start: 3,
          step: 3,
          quantity: 4,
          direction: 'descending'
        })
      }
    }
  }
}`,...g.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    config: tenSlotsLongLabelsConfig
  }
}`,...l.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    config: tenSlotsLongLabelsConfig
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobileLg'
    }
  }
}`,...f.parameters?.docs?.source}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    config: tenSlotsLongLabelsConfig
  },
  parameters: {
    viewport: {
      defaultViewport: 'tabletPortrait'
    }
  }
}`,...b.parameters?.docs?.source}}};q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  args: {
    config: tenSlotsLongLabelsConfig
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop'
    }
  }
}`,...q.parameters?.docs?.source}}};const me=["Consecutive","SkipByStepRangeMin","SkipRandom","DistractorsRandom","DistractorsGapsOnly","DistractorsFullRange","SimpleNoDistractors","SimpleWithDistractors","SimpleDescending","AdvancedWithFixedStart","LevelModeUnlimited","LevelModeCapped","LevelModeDescending","TenSlotsLongLabels","TenSlotsLongLabelsMobile","TenSlotsLongLabelsTabletPortrait","TenSlotsLongLabelsDesktop"];export{m as AdvancedWithFixedStart,n as Consecutive,a as DistractorsFullRange,t as DistractorsGapsOnly,r as DistractorsRandom,u as LevelModeCapped,g as LevelModeDescending,p as LevelModeUnlimited,d as SimpleDescending,i as SimpleNoDistractors,c as SimpleWithDistractors,s as SkipByStepRangeMin,o as SkipRandom,l as TenSlotsLongLabels,q as TenSlotsLongLabelsDesktop,f as TenSlotsLongLabelsMobile,b as TenSlotsLongLabelsTabletPortrait,me as __namedExportsOrder,de as default};
