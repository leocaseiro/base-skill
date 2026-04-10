import{w as J}from"./withDb-DXtIqzwa.js";import{c as X,b as Y,w as ee}from"./withRouter-C5EJ4Y3m.js";import{b as z,c as I}from"./sort-numbers-level-generator-CE-KkRP3.js";import{r as d,j as n}from"./iframe-25IKVtXB.js";import{S as ne}from"./SortNumbersTileBank-BIm0gjFN.js";import{A as T}from"./AnswerGame-DaRgdCtM.js";import{G as se}from"./GameOverOverlay-7_s_5MV0.js";import{L as te}from"./LevelCompleteOverlay-CoNiTZ60.js";import{S as oe}from"./ScoreAnimation-B-F3MGTQ.js";import{S as re,a as ae}from"./SlotRow-CGVYfNOi.js";import{a as ie,u as ce}from"./AnswerGameProvider-1EvJV_dj.js";import{b as de,u as le,a as ue}from"./build-round-order-brNc1yGY.js";import{u as me}from"./useTranslation-BTNaASY2.js";import"./DbProvider-BU8uiRPB.js";import"./index.browser-BY9c7rfI.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-dt9cItik.js";import"./index-D1EJ_8X8.js";import"./index-qh9AgpMR.js";import"./preload-helper-PPVm8Dsz.js";import"./useTouchDrag-D1ClrETj.js";import"./useDraggableTile-BSh-CK9U.js";import"./useGameTTS-CgtpUZIM.js";import"./useSettings-t9agCMGa.js";import"./useRxDB-zEFwqFJU.js";import"./useRxQuery-DHWWYRXl.js";import"./SpeechOutput-By2uxF-i.js";import"./confetti.module-oQXWb4Lk.js";import"./AudioFeedback-cxEhBYIg.js";import"./game-event-bus-CVIPXPct.js";import"./GameRoundContext-Da-8ExSv.js";const pe=({sortNumbersConfig:e,roundOrder:o,onRestartSession:D})=>{const{t:l}=me("games"),{phase:u,roundIndex:r,retryCount:C,zones:g,levelIndex:m}=ie(),t=ce(),{confettiReady:a,levelCompleteReady:x,gameOverReady:N}=le(),p=X(),{locale:F}=Y({from:"/$locale"}),j=d.useRef(0),w=o[r],W=w===void 0?void 0:e.rounds[w],G=e.direction==="ascending"?l("sort-numbers-ui.ascending-label"):l("sort-numbers-ui.descending-label");ue(G);const U=()=>{p({to:"/$locale",params:{locale:F}})},V=()=>{D()},H=()=>{const i=e.levelMode?.generateNextLevel;if(!i)return;const c=i(m);t(c?{type:"ADVANCE_LEVEL",tiles:c.tiles,zones:c.zones}:{type:"COMPLETE_GAME"})},Z=()=>{t({type:"COMPLETE_GAME"})};return d.useEffect(()=>{if(u!=="round-complete"||!a)return;const i=++j.current,A=globalThis.setTimeout(()=>{if(j.current!==i)return;if(r>=o.length-1){t({type:"COMPLETE_GAME"});return}const O=o[r+1],_=O===void 0?void 0:e.rounds[O];if(!_){t({type:"COMPLETE_GAME"});return}const $=e.tileBankMode==="distractors"?{config:e.distractors,range:e.range}:void 0,{tiles:K,zones:Q}=z(_.sequence,e.direction,$);t({type:"ADVANCE_ROUND",tiles:K,zones:Q})},750);return()=>{globalThis.clearTimeout(A)}},[u,a,r,t,o,e.rounds,e.direction,e.tileBankMode,e.distractors,e.range]),W?n.jsxs(n.Fragment,{children:[n.jsxs("div",{className:"flex w-full max-w-2xl flex-col items-center justify-center gap-8 px-4 py-6",children:[n.jsx(T.Question,{children:n.jsx("p",{className:"text-center text-lg font-semibold text-foreground",children:G})}),n.jsx(T.Answer,{children:n.jsx(re,{className:"gap-2",children:g.map((i,c)=>n.jsx(ae,{index:c,className:"size-14 rounded-lg",children:({label:A})=>n.jsx("span",{className:"text-2xl font-bold",children:A})},i.id))})}),n.jsx(T.Choices,{children:n.jsx(ne,{})})]}),n.jsx(oe,{visible:a}),x?n.jsx(te,{level:m+1,onNextLevel:H,onDone:Z}):null,N?n.jsx(se,{retryCount:C,onPlayAgain:V,onHome:U}):null]}):null},P=({config:e,initialState:o,sessionId:D,seed:l})=>{const u=e.roundsInOrder===!0,[r,C]=d.useState(0),g=d.useMemo(()=>de(e.rounds.length,u,l),[e.rounds.length,u,l,r]),m=g[0],t=m===void 0?void 0:e.rounds[m],{tiles:a,zones:x}=d.useMemo(()=>{if(!t)return{tiles:[],zones:[]};const p=e.tileBankMode==="distractors"?{config:e.distractors,range:e.range}:void 0;return z(t.sequence,e.direction,p)},[t,e.direction,e.tileBankMode,e.distractors,e.range]),N=d.useMemo(()=>({gameId:e.gameId,inputMethod:e.inputMethod,wrongTileBehavior:e.wrongTileBehavior,tileBankMode:e.tileBankMode,totalRounds:e.rounds.length,roundsInOrder:e.roundsInOrder,ttsEnabled:e.ttsEnabled,touchKeyboardInputMode:"numeric",initialTiles:a,initialZones:x,slotInteraction:"free-swap",levelMode:e.levelMode}),[e.gameId,e.inputMethod,e.wrongTileBehavior,e.tileBankMode,e.rounds.length,e.roundsInOrder,e.ttsEnabled,e.levelMode,a,x]);return t?n.jsx(T,{config:N,initialState:o,sessionId:D,children:n.jsx(pe,{sortNumbersConfig:e,roundOrder:g,onRestartSession:()=>{C(p=>p+1)}})}):null};P.__docgenInfo={description:"",methods:[],displayName:"SortNumbers",props:{config:{required:!0,tsType:{name:"SortNumbersConfig"},description:""},initialState:{required:!1,tsType:{name:"AnswerGameDraftState"},description:""},sessionId:{required:!1,tsType:{name:"string"},description:""},seed:{required:!1,tsType:{name:"string"},description:""}}};const s={gameId:"sort-numbers",component:"SortNumbers",inputMethod:"drag",wrongTileBehavior:"lock-manual",tileBankMode:"exact",totalRounds:3,roundsInOrder:!1,ttsEnabled:!1,direction:"ascending",range:{min:2,max:20},quantity:4,skip:{mode:"consecutive"},distractors:{source:"random",count:2},rounds:[{sequence:[3,4,5,6]},{sequence:[7,8,9,10]},{sequence:[11,12,13,14]}]},Ze={component:P,tags:["autodocs"],decorators:[J,ee],args:{config:s}},M={},y={args:{config:{...s,skip:{mode:"by",step:3,start:"range-min"},rounds:[{sequence:[2,5,8,11]},{sequence:[2,5,8,11]},{sequence:[2,5,8,11]}]}}},f={args:{config:{...s,skip:{mode:"random"},rounds:[{sequence:[2,7,12,18]},{sequence:[3,6,11,15]},{sequence:[4,9,14,20]}]}}},v={args:{config:{...s,tileBankMode:"distractors",distractors:{source:"random",count:3}}}},q={args:{config:{...s,skip:{mode:"by",step:2,start:"range-min"},tileBankMode:"distractors",distractors:{source:"gaps-only",count:"all"},rounds:[{sequence:[2,4,6,8]},{sequence:[2,4,6,8]},{sequence:[2,4,6,8]}]}}},k={args:{config:{...s,tileBankMode:"distractors",distractors:{source:"full-range",count:4}}}},b={args:{config:{...s,configMode:"simple",direction:"ascending",quantity:5,skip:{mode:"by",step:2,start:2},range:{min:2,max:10},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[2,4,6,8,10]}]}}},S={args:{config:{...s,configMode:"simple",direction:"ascending",quantity:5,skip:{mode:"by",step:2,start:2},range:{min:2,max:10},tileBankMode:"distractors",distractors:{source:"gaps-only",count:"all"},totalRounds:1,rounds:[{sequence:[2,4,6,8,10]}]}}},h={args:{config:{...s,configMode:"simple",direction:"descending",quantity:5,skip:{mode:"by",step:2,start:2},range:{min:2,max:10},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[2,4,6,8,10]}]}}},R={args:{config:{...s,configMode:"advanced",skip:{mode:"by",step:2,start:3},range:{min:1,max:20},rounds:[{sequence:[3,5,7,9]},{sequence:[3,5,7,9]},{sequence:[3,5,7,9]}]}}},L={args:{config:{...s,configMode:"simple",direction:"ascending",quantity:5,skip:{mode:"by",step:2,start:2},range:{min:2,max:10},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[2,4,6,8,10]}],levelMode:{generateNextLevel:I({start:2,step:2,quantity:5,direction:"ascending"})}}}},B={args:{config:{...s,configMode:"simple",direction:"ascending",quantity:3,skip:{mode:"by",step:5,start:5},range:{min:5,max:15},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[5,10,15]}],levelMode:{maxLevels:3,generateNextLevel:I({start:5,step:5,quantity:3,direction:"ascending"})}}}},E={args:{config:{...s,configMode:"simple",direction:"descending",quantity:4,skip:{mode:"by",step:3,start:3},range:{min:3,max:12},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[3,6,9,12]}],levelMode:{generateNextLevel:I({start:3,step:3,quantity:4,direction:"descending"})}}}};M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:"{}",...M.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
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
}`,...y.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
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
}`,...f.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
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
}`,...v.parameters?.docs?.source}}};q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
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
}`,...q.parameters?.docs?.source}}};k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
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
}`,...k.parameters?.docs?.source}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
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
}`,...b.parameters?.docs?.source}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
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
}`,...S.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
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
}`,...R.parameters?.docs?.source}}};L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
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
}`,...L.parameters?.docs?.source}}};B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
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
}`,...B.parameters?.docs?.source}}};E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
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
}`,...E.parameters?.docs?.source}}};const $e=["Consecutive","SkipByStepRangeMin","SkipRandom","DistractorsRandom","DistractorsGapsOnly","DistractorsFullRange","SimpleNoDistractors","SimpleWithDistractors","SimpleDescending","AdvancedWithFixedStart","LevelModeUnlimited","LevelModeCapped","LevelModeDescending"];export{R as AdvancedWithFixedStart,M as Consecutive,k as DistractorsFullRange,q as DistractorsGapsOnly,v as DistractorsRandom,B as LevelModeCapped,E as LevelModeDescending,L as LevelModeUnlimited,h as SimpleDescending,b as SimpleNoDistractors,S as SimpleWithDistractors,y as SkipByStepRangeMin,f as SkipRandom,$e as __namedExportsOrder,Ze as default};
