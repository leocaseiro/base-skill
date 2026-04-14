import{r as u,j as n}from"./iframe-BMebr7V9.js";import{w as oe}from"./withDb-BKY8BaXk.js";import{c as re,b as ae,w as ie}from"./withRouter-W7CmII39.js";import{b as X,c as V}from"./sort-numbers-level-generator-CE-KkRP3.js";import{S as ce}from"./SortNumbersTileBank-Cwnv8HOJ.js";import{A as O}from"./AnswerGame-CniKePXX.js";import{G as de}from"./GameOverOverlay-CRbhvK6l.js";import{L as le}from"./LevelCompleteOverlay-CW4pT2Av.js";import{S as me}from"./ScoreAnimation-CNvNFG7T.js";import{r as ue,S as pe,a as ge}from"./SlotRow-DfLZe7R8.js";import{g as fe}from"./tile-font-DQ9RrPM_.js";import{a as xe,u as ve,r as ye}from"./AnswerGameProvider-Ch4rRBco.js";import{u as Me,b as Se,a as be,c as ke}from"./build-round-order-C8X_u_ws.js";import{g as z}from"./game-event-bus-CVIPXPct.js";import{u as qe}from"./useTranslation-BoSKwFMW.js";import"./preload-helper-PPVm8Dsz.js";import"./DbProvider-DuxpqdBA.js";import"./index.browser-BY9c7rfI.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-DqC-Ri4L.js";import"./index-B11iPHRc.js";import"./index-g4Hhtgkf.js";import"./useTouchDrag-nAHxvR05.js";import"./useDraggableTile-CEsBTHY6.js";import"./useGameTTS-DHj2fXF0.js";import"./useSettings-BiOGC-YT.js";import"./useRxDB-DUvrUjny.js";import"./useRxQuery-DBpZj_Ip.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./confetti.module-oQXWb4Lk.js";import"./AudioFeedback-DxUgBcwr.js";import"./GameRoundContext-CPWw9HWE.js";import"./index-B4HfKb9R.js";const Le=({sortNumbersConfig:e,roundOrder:s,skin:o,onRestartSession:x})=>{const{t:i}=qe("games"),{phase:c,roundIndex:a,retryCount:p,zones:v,levelIndex:d}=xe(),r=ve(),{confettiReady:l,levelCompleteReady:y,gameOverReady:P}=be(),f=re(),{locale:Y}=ae({from:"/$locale"}),$=u.useRef(0),F=s[a],ee=F===void 0?void 0:e.rounds[F],W=e.direction==="ascending"?i("sort-numbers-ui.ascending-label"):i("sort-numbers-ui.descending-label");ke(W);const H=()=>{f({to:"/$locale",params:{locale:Y}})},U=()=>{x()},Z=()=>{const g=e.levelMode?.generateNextLevel;if(!g)return;const m=g(d);m?(r({type:"ADVANCE_LEVEL",tiles:m.tiles,zones:m.zones}),z().emit({type:"game:level-advance",gameId:e.gameId,sessionId:"",profileId:"",timestamp:Date.now(),roundIndex:0,levelIndex:d+1})):r({type:"COMPLETE_GAME"})},K=()=>{r({type:"COMPLETE_GAME"})};return u.useEffect(()=>{c==="game-over"&&z().emit({type:"game:end",gameId:e.gameId,sessionId:"",profileId:"",timestamp:Date.now(),roundIndex:a,finalScore:0,totalRounds:s.length,correctCount:0,durationMs:0,retryCount:p})},[c,e.gameId,a,s.length,p]),u.useEffect(()=>{if(c!=="round-complete"||!l)return;const g=++$.current,m=ue("roundAdvanceDelay",o,e.timing),M=globalThis.setTimeout(()=>{if($.current!==g)return;if(a>=s.length-1){r({type:"COMPLETE_GAME"});return}const Q=s[a+1],J=Q===void 0?void 0:e.rounds[Q];if(!J){r({type:"COMPLETE_GAME"});return}const ne=e.tileBankMode==="distractors"?{config:e.distractors,range:e.range}:void 0,{tiles:se,zones:te}=X(J.sequence,e.direction,ne);r({type:"ADVANCE_ROUND",tiles:se,zones:te}),z().emit({type:"game:round-advance",gameId:e.gameId,sessionId:"",profileId:"",timestamp:Date.now(),roundIndex:a+1})},m);return()=>{globalThis.clearTimeout(M)}},[c,l,a,r,s,o,e.gameId,e.rounds,e.direction,e.tileBankMode,e.distractors,e.range,e.timing]),ee?n.jsxs(n.Fragment,{children:[n.jsxs("div",{className:"flex w-full max-w-4xl flex-col items-center justify-center gap-8 px-4 py-6",children:[n.jsx(O.Question,{children:n.jsx("p",{className:"text-center text-lg font-semibold text-foreground",children:W})}),n.jsx(O.Answer,{children:n.jsx(pe,{className:"gap-2",children:v.map((g,m)=>n.jsx(ge,{index:m,skin:o,className:"size-14 rounded-lg",children:({label:M})=>n.jsx("span",{className:`${fe(M?.length??0,56)} font-bold tabular-nums`,children:M})},g.id))})}),n.jsx(O.Choices,{children:n.jsx(ce,{skin:o})})]}),o.RoundCompleteEffect?n.jsx(o.RoundCompleteEffect,{visible:l}):n.jsx(me,{visible:l}),y?o.LevelCompleteOverlay?n.jsx(o.LevelCompleteOverlay,{level:d+1,onNextLevel:Z,onDone:K}):n.jsx(le,{level:d+1,onNextLevel:Z,onDone:K}):null,P?o.CelebrationOverlay?n.jsx(o.CelebrationOverlay,{retryCount:p,onPlayAgain:U,onHome:H}):n.jsx(de,{retryCount:p,onPlayAgain:U,onHome:H}):null]}):null},_=({config:e,initialState:s,sessionId:o,seed:x})=>{const i=Me("sort-numbers",e.skin),c=e.roundsInOrder===!0,[a,p]=u.useState(0),v=u.useMemo(()=>Se(e.rounds.length,c,x),[e.rounds.length,c,x,a]),d=v[0],r=d===void 0?void 0:e.rounds[d],{tiles:l,zones:y}=u.useMemo(()=>{if(!r)return{tiles:[],zones:[]};const f=e.tileBankMode==="distractors"?{config:e.distractors,range:e.range}:void 0;return X(r.sequence,e.direction,f)},[r,e.direction,e.tileBankMode,e.distractors,e.range]),P=u.useMemo(()=>({gameId:e.gameId,inputMethod:e.inputMethod,wrongTileBehavior:e.wrongTileBehavior,tileBankMode:e.tileBankMode,totalRounds:e.rounds.length,roundsInOrder:e.roundsInOrder,ttsEnabled:e.ttsEnabled,touchKeyboardInputMode:"numeric",initialTiles:l,initialZones:y,slotInteraction:"free-swap",levelMode:e.levelMode}),[e.gameId,e.inputMethod,e.wrongTileBehavior,e.tileBankMode,e.rounds.length,e.roundsInOrder,e.ttsEnabled,e.levelMode,l,y]);return r?n.jsxs("div",{className:`game-container skin-${i.id}`,style:i.tokens,children:[i.SceneBackground?n.jsx(i.SceneBackground,{}):null,n.jsx(O,{config:P,initialState:a===0?s:void 0,sessionId:o,children:n.jsx(Le,{sortNumbersConfig:e,roundOrder:v,skin:i,onRestartSession:()=>{p(f=>f+1)}})},a)]}):null};_.__docgenInfo={description:"",methods:[],displayName:"SortNumbers",props:{config:{required:!0,tsType:{name:"SortNumbersConfig"},description:""},initialState:{required:!1,tsType:{name:"AnswerGameDraftState"},description:""},sessionId:{required:!1,tsType:{name:"string"},description:""},seed:{required:!1,tsType:{name:"string"},description:""}}};const he={id:"demo",name:"Demo Pink",tokens:{"--skin-tile-bg":"#ec4899","--skin-tile-text":"#fff","--skin-tile-radius":"50%","--skin-slot-bg":"#fdf2f8","--skin-slot-border":"#f472b6","--skin-slot-radius":"50%"},onCorrectPlace:(e,s)=>{console.log(`[demo skin] correct @ zone ${e}: ${s}`)},onWrongPlace:(e,s)=>{console.log(`[demo skin] wrong @ zone ${e}: ${s}`)}};ye("sort-numbers",he);const t={gameId:"sort-numbers",component:"SortNumbers",inputMethod:"drag",wrongTileBehavior:"lock-manual",tileBankMode:"exact",totalRounds:3,roundsInOrder:!1,ttsEnabled:!1,direction:"ascending",range:{min:2,max:20},quantity:4,skip:{mode:"consecutive"},distractors:{source:"random",count:2},rounds:[{sequence:[3,4,5,6]},{sequence:[7,8,9,10]},{sequence:[11,12,13,14]}]},dn={component:_,tags:["autodocs"],decorators:[oe,ie],args:{config:t,skinId:"classic"},argTypes:{skinId:{name:"Skin",control:"select",options:["classic","demo"],description:"Switch between the classic look and the Demo Pink skin."}},render:({config:e,skinId:s})=>n.jsx(_,{config:{...e,skin:s}})},S={},b={args:{config:{...t,skip:{mode:"by",step:3,start:"range-min"},rounds:[{sequence:[2,5,8,11]},{sequence:[2,5,8,11]},{sequence:[2,5,8,11]}]}}},k={args:{config:{...t,skip:{mode:"random"},rounds:[{sequence:[2,7,12,18]},{sequence:[3,6,11,15]},{sequence:[4,9,14,20]}]}}},q={args:{config:{...t,tileBankMode:"distractors",distractors:{source:"random",count:3}}}},L={args:{config:{...t,skip:{mode:"by",step:2,start:"range-min"},tileBankMode:"distractors",distractors:{source:"gaps-only",count:"all"},rounds:[{sequence:[2,4,6,8]},{sequence:[2,4,6,8]},{sequence:[2,4,6,8]}]}}},h={args:{config:{...t,tileBankMode:"distractors",distractors:{source:"full-range",count:4}}}},R={args:{config:{...t,configMode:"simple",direction:"ascending",quantity:5,skip:{mode:"by",step:2,start:2},range:{min:2,max:10},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[2,4,6,8,10]}]}}},I={args:{config:{...t,configMode:"simple",direction:"ascending",quantity:5,skip:{mode:"by",step:2,start:2},range:{min:2,max:10},tileBankMode:"distractors",distractors:{source:"gaps-only",count:"all"},totalRounds:1,rounds:[{sequence:[2,4,6,8,10]}]}}},w={args:{config:{...t,configMode:"simple",direction:"descending",quantity:5,skip:{mode:"by",step:2,start:2},range:{min:2,max:10},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[2,4,6,8,10]}]}}},B={args:{config:{...t,configMode:"advanced",skip:{mode:"by",step:2,start:3},range:{min:1,max:20},rounds:[{sequence:[3,5,7,9]},{sequence:[3,5,7,9]},{sequence:[3,5,7,9]}]}}},T={args:{config:{...t,configMode:"simple",direction:"ascending",quantity:5,skip:{mode:"by",step:2,start:2},range:{min:2,max:10},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[2,4,6,8,10]}],levelMode:{generateNextLevel:V({start:2,step:2,quantity:5,direction:"ascending"})}}}},D={args:{config:{...t,configMode:"simple",direction:"ascending",quantity:3,skip:{mode:"by",step:5,start:5},range:{min:5,max:15},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[5,10,15]}],levelMode:{maxLevels:3,generateNextLevel:V({start:5,step:5,quantity:3,direction:"ascending"})}}}},E={args:{config:{...t,configMode:"simple",direction:"descending",quantity:4,skip:{mode:"by",step:3,start:3},range:{min:3,max:12},tileBankMode:"exact",totalRounds:1,rounds:[{sequence:[3,6,9,12]}],levelMode:{generateNextLevel:V({start:3,step:3,quantity:4,direction:"descending"})}}}},N={...t,totalRounds:1,quantity:10,range:{min:1e3,max:1e4},distractors:{source:"random",count:0},rounds:[{sequence:[1e3,2e3,3e3,4e3,5e3,6e3,7e3,8e3,9e3,1e4]}]},C={args:{config:N}},j={args:{config:N},parameters:{viewport:{defaultViewport:"mobileLg"}}},A={args:{config:N},parameters:{viewport:{defaultViewport:"tabletPortrait"}}},G={args:{config:N},parameters:{viewport:{defaultViewport:"desktop"}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:"{}",...S.parameters?.docs?.source}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
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
}`,...b.parameters?.docs?.source}}};k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
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
}`,...R.parameters?.docs?.source}}};I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
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
}`,...I.parameters?.docs?.source}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
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
}`,...w.parameters?.docs?.source}}};B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
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
}`,...B.parameters?.docs?.source}}};T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
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
}`,...T.parameters?.docs?.source}}};D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
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
}`,...D.parameters?.docs?.source}}};E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
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
}`,...E.parameters?.docs?.source}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    config: tenSlotsLongLabelsConfig
  }
}`,...C.parameters?.docs?.source}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    config: tenSlotsLongLabelsConfig
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobileLg'
    }
  }
}`,...j.parameters?.docs?.source}}};A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  args: {
    config: tenSlotsLongLabelsConfig
  },
  parameters: {
    viewport: {
      defaultViewport: 'tabletPortrait'
    }
  }
}`,...A.parameters?.docs?.source}}};G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  args: {
    config: tenSlotsLongLabelsConfig
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop'
    }
  }
}`,...G.parameters?.docs?.source}}};const ln=["Consecutive","SkipByStepRangeMin","SkipRandom","DistractorsRandom","DistractorsGapsOnly","DistractorsFullRange","SimpleNoDistractors","SimpleWithDistractors","SimpleDescending","AdvancedWithFixedStart","LevelModeUnlimited","LevelModeCapped","LevelModeDescending","TenSlotsLongLabels","TenSlotsLongLabelsMobile","TenSlotsLongLabelsTabletPortrait","TenSlotsLongLabelsDesktop"];export{B as AdvancedWithFixedStart,S as Consecutive,h as DistractorsFullRange,L as DistractorsGapsOnly,q as DistractorsRandom,D as LevelModeCapped,E as LevelModeDescending,T as LevelModeUnlimited,w as SimpleDescending,R as SimpleNoDistractors,I as SimpleWithDistractors,b as SkipByStepRangeMin,k as SkipRandom,C as TenSlotsLongLabels,G as TenSlotsLongLabelsDesktop,j as TenSlotsLongLabelsMobile,A as TenSlotsLongLabelsTabletPortrait,ln as __namedExportsOrder,dn as default};
