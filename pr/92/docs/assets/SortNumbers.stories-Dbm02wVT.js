import{w as se}from"./withDb-DPG4Nl82.js";import{c as te,b as oe,w as re}from"./withRouter-D2BK4LP5.js";import{b as U,c as P}from"./sort-numbers-level-generator-CE-KkRP3.js";import{r as d,j as n}from"./iframe-CIbd0DRj.js";import{S as ae}from"./SortNumbersTileBank-DW6YxrqW.js";import{A}from"./AnswerGame-B8XdgGeU.js";import{G as ie}from"./GameOverOverlay-D6yCVKe-.js";import{L as ce}from"./LevelCompleteOverlay-DkKnpuKJ.js";import{S as de}from"./ScoreAnimation-CZ6CxlEU.js";import{S as le,a as ue}from"./SlotRow-kimrmAkb.js";import{g as me}from"./tile-font-DQ9RrPM_.js";import{a as pe,u as ge}from"./AnswerGameProvider-BV9TQmLW.js";import{b as fe,u as xe,a as Me}from"./build-round-order-CxDzHoOn.js";import{u as be}from"./useTranslation-u5TskusP.js";import"./DbProvider-DZXsHL5Q.js";import"./index.browser-BY9c7rfI.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-TEGpDDeV.js";import"./index-DTWCw_1t.js";import"./index-C1wxFtZb.js";import"./preload-helper-PPVm8Dsz.js";import"./useTouchDrag-B-P6p5da.js";import"./useDraggableTile-BkeESRBN.js";import"./useGameTTS-DLutyqR3.js";import"./useSettings-DbgWBmRN.js";import"./useRxDB-BZbGYPMW.js";import"./useRxQuery-BIavCHDG.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./confetti.module-oQXWb4Lk.js";import"./AudioFeedback-cxEhBYIg.js";import"./game-event-bus-CVIPXPct.js";import"./GameRoundContext-DWb3BI4R.js";import"./index-Dt4Zscy_.js";const ve=({sortNumbersConfig:e,roundOrder:r,onRestartSession:j})=>{const{t:l}=be("games"),{phase:u,roundIndex:o,retryCount:G,zones:g,levelIndex:m}=pe(),t=ge(),{confettiReady:a,levelCompleteReady:f,gameOverReady:O}=xe(),p=te(),{locale:H}=oe({from:"/$locale"}),_=d.useRef(0),V=r[o],Z=V===void 0?void 0:e.rounds[V],z=e.direction==="ascending"?l("sort-numbers-ui.ascending-label"):l("sort-numbers-ui.descending-label");Me(z);const K=()=>{p({to:"/$locale",params:{locale:H}})},Q=()=>{j()},J=()=>{const i=e.levelMode?.generateNextLevel;if(!i)return;const c=i(m);t(c?{type:"ADVANCE_LEVEL",tiles:c.tiles,zones:c.zones}:{type:"COMPLETE_GAME"})},X=()=>{t({type:"COMPLETE_GAME"})};return d.useEffect(()=>{if(u!=="round-complete"||!a)return;const i=++_.current,x=globalThis.setTimeout(()=>{if(_.current!==i)return;if(o>=r.length-1){t({type:"COMPLETE_GAME"});return}const F=r[o+1],W=F===void 0?void 0:e.rounds[F];if(!W){t({type:"COMPLETE_GAME"});return}const Y=e.tileBankMode==="distractors"?{config:e.distractors,range:e.range}:void 0,{tiles:ee,zones:ne}=U(W.sequence,e.direction,Y);t({type:"ADVANCE_ROUND",tiles:ee,zones:ne})},750);return()=>{globalThis.clearTimeout(x)}},[u,a,o,t,r,e.rounds,e.direction,e.tileBankMode,e.distractors,e.range]),Z?n.jsxs(n.Fragment,{children:[n.jsxs("div",{className:"flex w-full max-w-4xl flex-col items-center justify-center gap-8 px-4 py-6",children:[n.jsx(A.Question,{children:n.jsx("p",{className:"text-center text-lg font-semibold text-foreground",children:z})}),n.jsx(A.Answer,{children:n.jsx(le,{className:"gap-2",children:g.map((i,c)=>n.jsx(ue,{index:c,className:"size-14 rounded-lg",children:({label:x})=>n.jsx("span",{className:`${me(x?.length??0,56)} font-bold tabular-nums`,children:x})},i.id))})}),n.jsx(A.Choices,{children:n.jsx(ae,{})})]}),n.jsx(de,{visible:a}),f?n.jsx(ce,{level:m+1,onNextLevel:J,onDone:X}):null,O?n.jsx(ie,{retryCount:G,onPlayAgain:Q,onHome:K}):null]}):null},$=({config:e,initialState:r,sessionId:j,seed:l})=>{const u=e.roundsInOrder===!0,[o,G]=d.useState(0),g=d.useMemo(()=>fe(e.rounds.length,u,l),[e.rounds.length,u,l,o]),m=g[0],t=m===void 0?void 0:e.rounds[m],{tiles:a,zones:f}=d.useMemo(()=>{if(!t)return{tiles:[],zones:[]};const p=e.tileBankMode==="distractors"?{config:e.distractors,range:e.range}:void 0;return U(t.sequence,e.direction,p)},[t,e.direction,e.tileBankMode,e.distractors,e.range]),O=d.useMemo(()=>({gameId:e.gameId,inputMethod:e.inputMethod,wrongTileBehavior:e.wrongTileBehavior,tileBankMode:e.tileBankMode,totalRounds:e.rounds.length,roundsInOrder:e.roundsInOrder,ttsEnabled:e.ttsEnabled,touchKeyboardInputMode:"numeric",initialTiles:a,initialZones:f,slotInteraction:"free-swap",levelMode:e.levelMode}),[e.gameId,e.inputMethod,e.wrongTileBehavior,e.tileBankMode,e.rounds.length,e.roundsInOrder,e.ttsEnabled,e.levelMode,a,f]);return t?n.jsx(A,{config:O,initialState:o===0?r:void 0,sessionId:j,children:n.jsx(ve,{sortNumbersConfig:e,roundOrder:g,onRestartSession:()=>{G(p=>p+1)}})},o):null};$.__docgenInfo={description:"",methods:[],displayName:"SortNumbers",props:{config:{required:!0,tsType:{name:"SortNumbersConfig"},description:""},initialState:{required:!1,tsType:{name:"AnswerGameDraftState"},description:""},sessionId:{required:!1,tsType:{name:"string"},description:""},seed:{required:!1,tsType:{name:"string"},description:""}}};const s={gameId:"sort-numbers",component:"SortNumbers",inputMethod:"drag",wrongTileBehavior:"lock-manual",tileBankMode:"exact",totalRounds:3,roundsInOrder:!1,ttsEnabled:!1,direction:"ascending",range:{min:2,max:20},quantity:4,skip:{mode:"consecutive"},distractors:{source:"random",count:2},rounds:[{sequence:[3,4,5,6]},{sequence:[7,8,9,10]},{sequence:[11,12,13,14]}]},sn={component:$,tags:["autodocs"],decorators:[se,re],args:{config:s}},M={},b={args:{config:{...s,skip:{mode:"by",step:3,start:"range-min"},rounds:[{sequence:[2,5,8,11]},{sequence:[2,5,8,11]},{sequence:[2,5,8,11]}]}}},v={args:{config:{...s,skip:{mode:"random"},rounds:[{sequence:[2,7,12,18]},{sequence:[3,6,11,15]},{sequence:[4,9,14,20]}]}}},y={args:{config:{...s,tileBankMode:"distractors",distractors:{source:"random",count:3}}}},S={args:{config:{...s,skip:{mode:"by",step:2,start:"range-min"},tileBankMode:"distractors",distractors:{source:"gaps-only",count:"all"},rounds:[{sequence:[2,4,6,8]},{sequence:[2,4,6,8]},{sequence:[2,4,6,8]}]}}},q={args:{config:{...s,tileBankMode:"distractors",distractors:{source:"full-range",count:4}}}},L={args:{config:{...s,configMode:"simple",direction:"ascending",quantity:5,skip:{mode:"by",step:2,start:2},range:{min:2,max:10},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[2,4,6,8,10]}]}}},k={args:{config:{...s,configMode:"simple",direction:"ascending",quantity:5,skip:{mode:"by",step:2,start:2},range:{min:2,max:10},tileBankMode:"distractors",distractors:{source:"gaps-only",count:"all"},totalRounds:1,rounds:[{sequence:[2,4,6,8,10]}]}}},h={args:{config:{...s,configMode:"simple",direction:"descending",quantity:5,skip:{mode:"by",step:2,start:2},range:{min:2,max:10},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[2,4,6,8,10]}]}}},R={args:{config:{...s,configMode:"advanced",skip:{mode:"by",step:2,start:3},range:{min:1,max:20},rounds:[{sequence:[3,5,7,9]},{sequence:[3,5,7,9]},{sequence:[3,5,7,9]}]}}},T={args:{config:{...s,configMode:"simple",direction:"ascending",quantity:5,skip:{mode:"by",step:2,start:2},range:{min:2,max:10},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[2,4,6,8,10]}],levelMode:{generateNextLevel:P({start:2,step:2,quantity:5,direction:"ascending"})}}}},B={args:{config:{...s,configMode:"simple",direction:"ascending",quantity:3,skip:{mode:"by",step:5,start:5},range:{min:5,max:15},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[5,10,15]}],levelMode:{maxLevels:3,generateNextLevel:P({start:5,step:5,quantity:3,direction:"ascending"})}}}},w={args:{config:{...s,configMode:"simple",direction:"descending",quantity:4,skip:{mode:"by",step:3,start:3},range:{min:3,max:12},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[3,6,9,12]}],levelMode:{generateNextLevel:P({start:3,step:3,quantity:4,direction:"descending"})}}}},I={...s,totalRounds:1,quantity:10,range:{min:1e3,max:1e4},distractors:{source:"random",count:0},rounds:[{sequence:[1e3,2e3,3e3,4e3,5e3,6e3,7e3,8e3,9e3,1e4]}]},C={args:{config:I}},E={args:{config:I},parameters:{viewport:{defaultViewport:"mobileLg"}}},D={args:{config:I},parameters:{viewport:{defaultViewport:"tabletPortrait"}}},N={args:{config:I},parameters:{viewport:{defaultViewport:"desktop"}}};M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:"{}",...M.parameters?.docs?.source}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
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
}`,...b.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
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
}`,...v.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
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
}`,...y.parameters?.docs?.source}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
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
}`,...S.parameters?.docs?.source}}};q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
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
}`,...q.parameters?.docs?.source}}};L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
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
}`,...L.parameters?.docs?.source}}};k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
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
}`,...k.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
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
}`,...h.parameters?.docs?.source}}};R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
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
}`,...R.parameters?.docs?.source}}};T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
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
}`,...T.parameters?.docs?.source}}};B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
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
}`,...B.parameters?.docs?.source}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
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
}`,...w.parameters?.docs?.source}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    config: tenSlotsLongLabelsConfig
  }
}`,...C.parameters?.docs?.source}}};E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    config: tenSlotsLongLabelsConfig
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobileLg'
    }
  }
}`,...E.parameters?.docs?.source}}};D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  args: {
    config: tenSlotsLongLabelsConfig
  },
  parameters: {
    viewport: {
      defaultViewport: 'tabletPortrait'
    }
  }
}`,...D.parameters?.docs?.source}}};N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  args: {
    config: tenSlotsLongLabelsConfig
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop'
    }
  }
}`,...N.parameters?.docs?.source}}};const tn=["Consecutive","SkipByStepRangeMin","SkipRandom","DistractorsRandom","DistractorsGapsOnly","DistractorsFullRange","SimpleNoDistractors","SimpleWithDistractors","SimpleDescending","AdvancedWithFixedStart","LevelModeUnlimited","LevelModeCapped","LevelModeDescending","TenSlotsLongLabels","TenSlotsLongLabelsMobile","TenSlotsLongLabelsTabletPortrait","TenSlotsLongLabelsDesktop"];export{R as AdvancedWithFixedStart,M as Consecutive,q as DistractorsFullRange,S as DistractorsGapsOnly,y as DistractorsRandom,B as LevelModeCapped,w as LevelModeDescending,T as LevelModeUnlimited,h as SimpleDescending,L as SimpleNoDistractors,k as SimpleWithDistractors,b as SkipByStepRangeMin,v as SkipRandom,C as TenSlotsLongLabels,N as TenSlotsLongLabelsDesktop,E as TenSlotsLongLabelsMobile,D as TenSlotsLongLabelsTabletPortrait,tn as __namedExportsOrder,sn as default};
