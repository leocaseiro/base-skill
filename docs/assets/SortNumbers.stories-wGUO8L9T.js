import{r as l,j as t}from"./iframe-BAoqjOVQ.js";import{w as oe}from"./withDb-C5-KQYKa.js";import{c as re,b as ae,w as ie}from"./withRouter-B8Zu3P_n.js";import{b as X,c as V}from"./sort-numbers-level-generator-CE-KkRP3.js";import{S as ce}from"./SortNumbersTileBank-ngNlvQNO.js";import{A as G}from"./AnswerGame-DhPlZiHa.js";import{G as de}from"./GameOverOverlay-OvXHw1KF.js";import{L as le}from"./LevelCompleteOverlay-ttkhEaMc.js";import{S as ue}from"./ScoreAnimation-DTbsoK1h.js";import{r as me,S as pe,a as ge}from"./SlotRow-BYUvktPw.js";import{g as fe}from"./tile-font-DQ9RrPM_.js";import{r as xe,a as be,u as ve,c as ye}from"./AnswerGameProvider-tDG7wQ0m.js";import{b as Se,u as Me,a as ke}from"./build-round-order-B9AU53h3.js";import{g as z}from"./game-event-bus-CVIPXPct.js";import{u as qe}from"./useTranslation-e-GpqRrS.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-hhl9YehD.js";import"./index.browser-BY9c7rfI.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-BB86JEnW.js";import"./index-D303dXLQ.js";import"./index-B6nj1tVQ.js";import"./useTouchDrag-B8_KTn6E.js";import"./useDraggableTile-Dib2-Bgp.js";import"./useGameTTS-BCcwj_d6.js";import"./useSettings-Ceo4RemM.js";import"./useRxDB-D413WzLW.js";import"./useRxQuery-CnRsN5F5.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./confetti.module-oQXWb4Lk.js";import"./AudioFeedback-DxUgBcwr.js";import"./GameRoundContext-CZwg0Gk-.js";import"./index-Cys2neXL.js";function Le(e,o){const s=l.useMemo(()=>xe(e,o),[e,o]);return l.useEffect(()=>{const a=z(),c=[a.subscribe("game:evaluate",n=>{n.type==="game:evaluate"&&n.gameId===e&&(n.correct?s.onCorrectPlace?.(n.zoneIndex,String(n.answer)):s.onWrongPlace?.(n.zoneIndex,String(n.answer)))}),a.subscribe("game:tile-ejected",n=>{n.type==="game:tile-ejected"&&n.gameId===e&&s.onTileEjected?.(n.zoneIndex)}),a.subscribe("game:drag-start",n=>{n.type==="game:drag-start"&&n.gameId===e&&s.onDragStart?.(n.tileId)}),a.subscribe("game:drag-over-zone",n=>{n.type==="game:drag-over-zone"&&n.gameId===e&&s.onDragOverZone?.(n.zoneIndex)}),a.subscribe("game:round-advance",n=>{n.type==="game:round-advance"&&n.gameId===e&&s.onRoundComplete?.(n.roundIndex)}),a.subscribe("game:level-advance",n=>{n.type==="game:level-advance"&&n.gameId===e&&s.onLevelComplete?.(n.levelIndex)}),a.subscribe("game:end",n=>{n.type==="game:end"&&n.gameId===e&&s.onGameOver?.(0)})];return()=>{for(const n of c)n()}},[s,e]),s}const he=({sortNumbersConfig:e,roundOrder:o,skin:s,onRestartSession:a})=>{const{t:c}=qe("games"),{phase:n,roundIndex:d,retryCount:x,zones:b,levelIndex:u}=be(),i=ve(),{confettiReady:m,levelCompleteReady:v,gameOverReady:P}=Me(),f=re(),{locale:Y}=ae({from:"/$locale"}),$=l.useRef(0),F=o[d],ee=F===void 0?void 0:e.rounds[F],W=e.direction==="ascending"?c("sort-numbers-ui.ascending-label"):c("sort-numbers-ui.descending-label");ke(W);const H=()=>{f({to:"/$locale",params:{locale:Y}})},U=()=>{a()},Z=()=>{const g=e.levelMode?.generateNextLevel;if(!g)return;const p=g(u);p?(i({type:"ADVANCE_LEVEL",tiles:p.tiles,zones:p.zones}),z().emit({type:"game:level-advance",gameId:e.gameId,sessionId:"",profileId:"",timestamp:Date.now(),roundIndex:0,levelIndex:u+1})):i({type:"COMPLETE_GAME"})},K=()=>{i({type:"COMPLETE_GAME"})};return l.useEffect(()=>{if(n!=="round-complete"||!m)return;const g=++$.current,p=me("roundAdvanceDelay",s,e.timing),y=globalThis.setTimeout(()=>{if($.current!==g)return;if(d>=o.length-1){i({type:"COMPLETE_GAME"});return}const Q=o[d+1],J=Q===void 0?void 0:e.rounds[Q];if(!J){i({type:"COMPLETE_GAME"});return}const ne=e.tileBankMode==="distractors"?{config:e.distractors,range:e.range}:void 0,{tiles:se,zones:te}=X(J.sequence,e.direction,ne);i({type:"ADVANCE_ROUND",tiles:se,zones:te}),z().emit({type:"game:round-advance",gameId:e.gameId,sessionId:"",profileId:"",timestamp:Date.now(),roundIndex:d+1})},p);return()=>{globalThis.clearTimeout(y)}},[n,m,d,i,o,s,e.gameId,e.rounds,e.direction,e.tileBankMode,e.distractors,e.range,e.timing]),ee?t.jsxs(t.Fragment,{children:[t.jsxs("div",{className:"flex w-full max-w-4xl flex-col items-center justify-center gap-8 px-4 py-6",children:[t.jsx(G.Question,{children:t.jsx("p",{className:"text-center text-lg font-semibold text-foreground",children:W})}),t.jsx(G.Answer,{children:t.jsx(pe,{className:"gap-2",children:b.map((g,p)=>t.jsx(ge,{index:p,skin:s,className:"size-14 rounded-lg",children:({label:y})=>t.jsx("span",{className:`${fe(y?.length??0,56)} font-bold tabular-nums`,children:y})},g.id))})}),t.jsx(G.Choices,{children:t.jsx(ce,{skin:s})})]}),s.RoundCompleteEffect?t.jsx(s.RoundCompleteEffect,{visible:m}):t.jsx(ue,{visible:m}),v?s.LevelCompleteOverlay?t.jsx(s.LevelCompleteOverlay,{level:u+1,onNextLevel:Z,onDone:K}):t.jsx(le,{level:u+1,onNextLevel:Z,onDone:K}):null,P?s.CelebrationOverlay?t.jsx(s.CelebrationOverlay,{retryCount:x,onPlayAgain:U,onHome:H}):t.jsx(de,{retryCount:x,onPlayAgain:U,onHome:H}):null]}):null},_=({config:e,initialState:o,sessionId:s,seed:a})=>{const c=Le("sort-numbers",e.skin),n=e.roundsInOrder===!0,[d,x]=l.useState(0),b=l.useMemo(()=>Se(e.rounds.length,n,a),[e.rounds.length,n,a,d]),u=b[0],i=u===void 0?void 0:e.rounds[u],{tiles:m,zones:v}=l.useMemo(()=>{if(!i)return{tiles:[],zones:[]};const f=e.tileBankMode==="distractors"?{config:e.distractors,range:e.range}:void 0;return X(i.sequence,e.direction,f)},[i,e.direction,e.tileBankMode,e.distractors,e.range]),P=l.useMemo(()=>({gameId:e.gameId,inputMethod:e.inputMethod,wrongTileBehavior:e.wrongTileBehavior,tileBankMode:e.tileBankMode,totalRounds:e.rounds.length,roundsInOrder:e.roundsInOrder,ttsEnabled:e.ttsEnabled,touchKeyboardInputMode:"numeric",initialTiles:m,initialZones:v,slotInteraction:"free-swap",levelMode:e.levelMode}),[e.gameId,e.inputMethod,e.wrongTileBehavior,e.tileBankMode,e.rounds.length,e.roundsInOrder,e.ttsEnabled,e.levelMode,m,v]);return i?t.jsxs("div",{className:`game-container skin-${c.id}`,style:c.tokens,children:[c.SceneBackground?t.jsx(c.SceneBackground,{}):null,t.jsx(G,{config:P,initialState:d===0?o:void 0,sessionId:s,children:t.jsx(he,{sortNumbersConfig:e,roundOrder:b,skin:c,onRestartSession:()=>{x(f=>f+1)}})},d)]}):null};_.__docgenInfo={description:"",methods:[],displayName:"SortNumbers",props:{config:{required:!0,tsType:{name:"SortNumbersConfig"},description:""},initialState:{required:!1,tsType:{name:"AnswerGameDraftState"},description:""},sessionId:{required:!1,tsType:{name:"string"},description:""},seed:{required:!1,tsType:{name:"string"},description:""}}};const Re={id:"demo",name:"Demo Pink",tokens:{"--skin-tile-bg":"#ec4899","--skin-tile-text":"#fff","--skin-tile-radius":"50%","--skin-slot-bg":"#fdf2f8","--skin-slot-border":"#f472b6","--skin-slot-radius":"50%"},onCorrectPlace:(e,o)=>{console.log(`[demo skin] correct @ zone ${e}: ${o}`)},onWrongPlace:(e,o)=>{console.log(`[demo skin] wrong @ zone ${e}: ${o}`)}};ye("sort-numbers",Re);const r={gameId:"sort-numbers",component:"SortNumbers",inputMethod:"drag",wrongTileBehavior:"lock-manual",tileBankMode:"exact",totalRounds:3,roundsInOrder:!1,ttsEnabled:!1,direction:"ascending",range:{min:2,max:20},quantity:4,skip:{mode:"consecutive"},distractors:{source:"random",count:2},rounds:[{sequence:[3,4,5,6]},{sequence:[7,8,9,10]},{sequence:[11,12,13,14]}]},ln={component:_,tags:["autodocs"],decorators:[oe,ie],args:{config:r,skinId:"classic"},argTypes:{skinId:{name:"Skin",control:"select",options:["classic","demo"],description:"Switch between the classic look and the Demo Pink skin."}},render:({config:e,skinId:o})=>t.jsx(_,{config:{...e,skin:o}})},S={},M={args:{config:{...r,skip:{mode:"by",step:3,start:"range-min"},rounds:[{sequence:[2,5,8,11]},{sequence:[2,5,8,11]},{sequence:[2,5,8,11]}]}}},k={args:{config:{...r,skip:{mode:"random"},rounds:[{sequence:[2,7,12,18]},{sequence:[3,6,11,15]},{sequence:[4,9,14,20]}]}}},q={args:{config:{...r,tileBankMode:"distractors",distractors:{source:"random",count:3}}}},L={args:{config:{...r,skip:{mode:"by",step:2,start:"range-min"},tileBankMode:"distractors",distractors:{source:"gaps-only",count:"all"},rounds:[{sequence:[2,4,6,8]},{sequence:[2,4,6,8]},{sequence:[2,4,6,8]}]}}},h={args:{config:{...r,tileBankMode:"distractors",distractors:{source:"full-range",count:4}}}},R={args:{config:{...r,configMode:"simple",direction:"ascending",quantity:5,skip:{mode:"by",step:2,start:2},range:{min:2,max:10},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[2,4,6,8,10]}]}}},w={args:{config:{...r,configMode:"simple",direction:"ascending",quantity:5,skip:{mode:"by",step:2,start:2},range:{min:2,max:10},tileBankMode:"distractors",distractors:{source:"gaps-only",count:"all"},totalRounds:1,rounds:[{sequence:[2,4,6,8,10]}]}}},I={args:{config:{...r,configMode:"simple",direction:"descending",quantity:5,skip:{mode:"by",step:2,start:2},range:{min:2,max:10},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[2,4,6,8,10]}]}}},T={args:{config:{...r,configMode:"advanced",skip:{mode:"by",step:2,start:3},range:{min:1,max:20},rounds:[{sequence:[3,5,7,9]},{sequence:[3,5,7,9]},{sequence:[3,5,7,9]}]}}},B={args:{config:{...r,configMode:"simple",direction:"ascending",quantity:5,skip:{mode:"by",step:2,start:2},range:{min:2,max:10},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[2,4,6,8,10]}],levelMode:{generateNextLevel:V({start:2,step:2,quantity:5,direction:"ascending"})}}}},C={args:{config:{...r,configMode:"simple",direction:"ascending",quantity:3,skip:{mode:"by",step:5,start:5},range:{min:5,max:15},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[5,10,15]}],levelMode:{maxLevels:3,generateNextLevel:V({start:5,step:5,quantity:3,direction:"ascending"})}}}},D={args:{config:{...r,configMode:"simple",direction:"descending",quantity:4,skip:{mode:"by",step:3,start:3},range:{min:3,max:12},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[3,6,9,12]}],levelMode:{generateNextLevel:V({start:3,step:3,quantity:4,direction:"descending"})}}}},N={...r,totalRounds:1,quantity:10,range:{min:1e3,max:1e4},distractors:{source:"random",count:0},rounds:[{sequence:[1e3,2e3,3e3,4e3,5e3,6e3,7e3,8e3,9e3,1e4]}]},E={args:{config:N}},j={args:{config:N},parameters:{viewport:{defaultViewport:"mobileLg"}}},O={args:{config:N},parameters:{viewport:{defaultViewport:"tabletPortrait"}}},A={args:{config:N},parameters:{viewport:{defaultViewport:"desktop"}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:"{}",...S.parameters?.docs?.source}}};M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
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
}`,...M.parameters?.docs?.source}}};k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
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
}`,...k.parameters?.docs?.source}}};q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
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
}`,...q.parameters?.docs?.source}}};L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
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
}`,...L.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
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
}`,...h.parameters?.docs?.source}}};R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
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
}`,...R.parameters?.docs?.source}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
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
}`,...w.parameters?.docs?.source}}};I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
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
}`,...I.parameters?.docs?.source}}};T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
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
}`,...T.parameters?.docs?.source}}};B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
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
}`,...B.parameters?.docs?.source}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
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
}`,...C.parameters?.docs?.source}}};D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
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
}`,...D.parameters?.docs?.source}}};E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    config: tenSlotsLongLabelsConfig
  }
}`,...E.parameters?.docs?.source}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    config: tenSlotsLongLabelsConfig
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobileLg'
    }
  }
}`,...j.parameters?.docs?.source}}};O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    config: tenSlotsLongLabelsConfig
  },
  parameters: {
    viewport: {
      defaultViewport: 'tabletPortrait'
    }
  }
}`,...O.parameters?.docs?.source}}};A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  args: {
    config: tenSlotsLongLabelsConfig
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop'
    }
  }
}`,...A.parameters?.docs?.source}}};const un=["Consecutive","SkipByStepRangeMin","SkipRandom","DistractorsRandom","DistractorsGapsOnly","DistractorsFullRange","SimpleNoDistractors","SimpleWithDistractors","SimpleDescending","AdvancedWithFixedStart","LevelModeUnlimited","LevelModeCapped","LevelModeDescending","TenSlotsLongLabels","TenSlotsLongLabelsMobile","TenSlotsLongLabelsTabletPortrait","TenSlotsLongLabelsDesktop"];export{T as AdvancedWithFixedStart,S as Consecutive,h as DistractorsFullRange,L as DistractorsGapsOnly,q as DistractorsRandom,C as LevelModeCapped,D as LevelModeDescending,B as LevelModeUnlimited,I as SimpleDescending,R as SimpleNoDistractors,w as SimpleWithDistractors,M as SkipByStepRangeMin,k as SkipRandom,E as TenSlotsLongLabels,A as TenSlotsLongLabelsDesktop,j as TenSlotsLongLabelsMobile,O as TenSlotsLongLabelsTabletPortrait,un as __namedExportsOrder,ln as default};
