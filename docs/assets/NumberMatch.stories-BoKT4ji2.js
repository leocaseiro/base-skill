import{w as de}from"./withDb-D0nbyF34.js";import{b as Y,c as ue,w as ce}from"./withRouter-CcvGE-Vn.js";import{r as x,j as o}from"./iframe-BgjgllhN.js";import{n as J}from"./index.browser-BY9c7rfI.js";import{t as ee,a as q,b as $,D as me}from"./DotGroupQuestion-CSMTiAPn.js";import{D as K,N as pe}from"./NumeralTileBank-CszbpkUI.js";import{A as D}from"./AnswerGame-67N1K9x1.js";import{G as ge}from"./GameOverOverlay-BX49qOSR.js";import{S as xe}from"./ScoreAnimation-DHXSpm52.js";import{S as fe,a as be}from"./SlotRow-CJ2ayRKV.js";import{g as X}from"./tile-font-DQ9RrPM_.js";import{a as Te,u as he}from"./AnswerGameProvider-BSnOXew7.js";import{b as Se,u as Ne,a as ye}from"./build-round-order-BxipLANc.js";import{A as ve}from"./AudioButton-DNzzeS2t.js";import{T as Ce}from"./TextQuestion-C9xuV4Kj.js";import"./DbProvider-KKyMVoO-.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-eD2TBT7S.js";import"./index-DWjezmd-.js";import"./index-DSh6Pizt.js";import"./preload-helper-PPVm8Dsz.js";import"./useGameTTS-DTmFMKGT.js";import"./useSettings-CXWYejPi.js";import"./useRxDB-BlAdu3jD.js";import"./useRxQuery-DYpjUjdy.js";import"./SpeechOutput-By2uxF-i.js";import"./useTranslation-KOdhK1je.js";import"./useTouchDrag-CuL_n-jl.js";import"./useDraggableTile-BDwOqiWq.js";import"./confetti.module-oQXWb4Lk.js";import"./AudioFeedback-cxEhBYIg.js";import"./game-event-bus-CVIPXPct.js";import"./GameRoundContext-CtjshTbL.js";import"./createLucideIcon-CwIGjr2A.js";const we=(e,r,t)=>{switch(r){case"cardinal-number-to-text":case"ordinal-to-cardinal":return $(e,t);case"ordinal-number-to-text":case"cardinal-to-ordinal":return q(e,t);case"ordinal-text-to-number":return ee(e,t);default:return String(e)}};function re(e){for(let r=e.length-1;r>0;r--){const t=Math.floor(Math.random()*(r+1));[e[r],e[t]]=[e[t],e[r]]}}function je(e,r,t,s){if(r<=0||t>s)return[];const n=[];for(let i=t;i<=s;i++)i!==e&&n.push(i);return n.length===0?[]:(re(n),n.slice(0,Math.min(r,n.length)))}function oe(e,r){const t={id:J(),index:0,expectedValue:String(e),placedTileId:null,isWrong:!1,isLocked:!1},s=[e];if(r.tileBankMode==="distractors"){const l=je(e,r.distractorCount??0,r.range.min,r.range.max);s.push(...l)}re(s);const n=r.mode??"numeral-to-group",i=r.locale??"en";return{tiles:s.map(l=>({id:J(),label:we(l,n,i),value:String(l)})),zones:[t]}}const Le=new Set(["cardinal-number-to-text","cardinal-text-to-number","ordinal-number-to-text","ordinal-text-to-number","cardinal-to-ordinal","ordinal-to-cardinal"]),Me=e=>Le.has(e),Ge=(e,r,t)=>{switch(r){case"cardinal-number-to-text":return String(e);case"cardinal-text-to-number":return $(e,t);case"ordinal-number-to-text":return ee(e,t);case"ordinal-text-to-number":return q(e,t);case"cardinal-to-ordinal":return $(e,t);case"ordinal-to-cardinal":return q(e,t);default:return String(e)}},Oe=({numberMatchConfig:e,roundOrder:r,onRestartSession:t})=>{const{phase:s,roundIndex:n,retryCount:i,zones:h}=Te(),l=he(),{confettiReady:m,gameOverReady:S}=Ne(),N=ue(),{locale:f}=Y({from:"/$locale"}),c=f==="pt-BR"?"pt-BR":"en",b=x.useRef(0),T=r[n],u=T===void 0?void 0:e.rounds[T];ye(String(u?.value??""));const P=()=>{N({to:"/$locale",params:{locale:f}})},ne=()=>{t()};if(x.useEffect(()=>{if(s!=="round-complete"||!m)return;const _=++b.current,a=globalThis.setTimeout(()=>{if(b.current!==_)return;if(n>=r.length-1){l({type:"COMPLETE_GAME"});return}const Z=r[n+1],U=(Z===void 0?void 0:e.rounds[Z])?.value;if(U===void 0){l({type:"COMPLETE_GAME"});return}const{tiles:ie,zones:le}=oe(U,{tileBankMode:e.tileBankMode,distractorCount:e.distractorCount,range:e.range,mode:e.mode,locale:c});l({type:"ADVANCE_ROUND",tiles:ie,zones:le})},750);return()=>{globalThis.clearTimeout(a)}},[s,m,n,l,r,e.rounds,e.tileBankMode,e.distractorCount,e.range,e.mode,c]),!u)return null;const{mode:p,tileStyle:W}=e,F=p==="numeral-to-group",V=F&&W==="dots",z=Me(p),ae=V?"h-[136px] w-[72px] rounded-2xl":z?"min-w-[80px] h-20 rounded-2xl px-2":"size-20 rounded-2xl",Q=Ge(u.value,p,c),se=p==="group-to-numeral"||p==="numeral-to-group"?String(u.value):Q;return o.jsxs(o.Fragment,{children:[o.jsxs("div",{className:"flex w-full max-w-4xl flex-col items-center justify-center gap-8 px-4 py-6",children:[o.jsxs(D.Question,{children:[p==="group-to-numeral"?o.jsx(me,{count:u.value,prompt:String(u.value)},`round-${n}`):o.jsx(Ce,{text:Q}),o.jsx(ve,{prompt:se})]}),o.jsx(D.Answer,{children:o.jsx(fe,{className:"gap-4",children:h.map((_,H)=>o.jsx(be,{index:H,className:ae,renderPreview:a=>{if(V){const g=Number.parseInt(a,10);if(!Number.isNaN(g))return o.jsx("div",{className:"opacity-50",children:o.jsx(K,{value:g})})}return z?o.jsx("span",{className:["block text-center font-bold leading-tight hyphens-auto break-words opacity-50",a.length>6?"text-sm":"text-xl"].join(" "),children:a}):o.jsx("span",{className:`${X(a.length,80)} font-bold tabular-nums opacity-50`,children:a})},children:({label:a})=>{if(!a)return null;if(V){const g=Number.parseInt(a,10);if(!Number.isNaN(g))return o.jsx(K,{value:g})}return z?o.jsx("span",{className:["block text-center font-bold leading-tight hyphens-auto break-words",a.length>6?"text-sm":"text-xl"].join(" "),children:a}):o.jsx("span",{className:`${X(a.length,80)} font-bold tabular-nums`,children:a})}},_.id))})}),o.jsx(D.Choices,{children:o.jsx(pe,{tileStyle:W,tilesShowGroup:F})})]}),o.jsx(xe,{visible:m}),S?o.jsx(ge,{retryCount:i,onPlayAgain:ne,onHome:P}):null]})},te=({config:e,initialState:r,sessionId:t,seed:s})=>{const n=e.roundsInOrder===!0,[i,h]=x.useState(0),{locale:l}=Y({from:"/$locale"}),m=l==="pt-BR"?"pt-BR":"en",S=x.useMemo(()=>Se(e.rounds.length,n,s),[e.rounds.length,n,s,i]),N=S[0],f=N===void 0?void 0:e.rounds[N],c=f?.value,{tiles:b,zones:T}=x.useMemo(()=>c===void 0?{tiles:[],zones:[]}:oe(c,{tileBankMode:e.tileBankMode,distractorCount:e.distractorCount,range:e.range,mode:e.mode,locale:m}),[c,e.tileBankMode,e.distractorCount,e.range,e.mode,m]),u=x.useMemo(()=>({gameId:e.gameId,inputMethod:e.inputMethod,wrongTileBehavior:e.wrongTileBehavior,tileBankMode:e.tileBankMode,distractorCount:e.distractorCount,totalRounds:e.rounds.length,roundsInOrder:e.roundsInOrder,ttsEnabled:e.ttsEnabled,initialTiles:b,initialZones:T,slotInteraction:"free-swap"}),[e.gameId,e.inputMethod,e.wrongTileBehavior,e.tileBankMode,e.distractorCount,e.rounds.length,e.roundsInOrder,e.ttsEnabled,b,T]);return f?o.jsx(D,{config:u,initialState:i===0?r:void 0,sessionId:t,children:o.jsx(Oe,{numberMatchConfig:e,roundOrder:S,onRestartSession:()=>{h(P=>P+1)}})},i):null};te.__docgenInfo={description:"",methods:[],displayName:"NumberMatch",props:{config:{required:!0,tsType:{name:"NumberMatchConfig"},description:""},initialState:{required:!1,tsType:{name:"AnswerGameDraftState"},description:""},sessionId:{required:!1,tsType:{name:"string"},description:""},seed:{required:!1,tsType:{name:"string"},description:""}}};const d={gameId:"number-match-storybook",component:"NumberMatch",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"numeral-to-group",tileStyle:"dots",range:{min:1,max:5},rounds:[{value:3},{value:1},{value:5}]},pr={component:te,tags:["autodocs"],args:{config:d},decorators:[de,ce]},y={},v={args:{config:{...d,mode:"group-to-numeral"}}},C={args:{config:{...d,mode:"cardinal-number-to-text",tileStyle:"fingers"}}},w={args:{config:{...d,mode:"cardinal-text-to-number",tileStyle:"fingers"}}},j={args:{config:{...d,mode:"ordinal-number-to-text",tileStyle:"fingers"}}},L={args:{config:{...d,mode:"ordinal-text-to-number",tileStyle:"fingers"}}},M={args:{config:{...d,mode:"cardinal-to-ordinal",tileStyle:"fingers"}}},G={args:{config:{...d,mode:"ordinal-to-cardinal",tileStyle:"fingers"}}},O={args:{config:{...d,tileStyle:"dots"}}},I={args:{config:{...d,tileStyle:"objects",rounds:[{value:3,objectImage:"https://placehold.co/32?text=🍎"}]}}},A={...d,mode:"numeral-to-group",tileStyle:"dots",tileBankMode:"distractors",distractorCount:3,range:{min:1e4,max:99999},rounds:[{value:10002},{value:19467},{value:99999}]},R={args:{config:A}},k={args:{config:A},parameters:{viewport:{defaultViewport:"mobileLg"}}},B={args:{config:A},parameters:{viewport:{defaultViewport:"tabletPortrait"}}},E={args:{config:A},parameters:{viewport:{defaultViewport:"desktop"}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:"{}",...y.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'group-to-numeral'
    }
  }
}`,...v.parameters?.docs?.source}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'cardinal-number-to-text',
      tileStyle: 'fingers'
    }
  }
}`,...C.parameters?.docs?.source}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'cardinal-text-to-number',
      tileStyle: 'fingers'
    }
  }
}`,...w.parameters?.docs?.source}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'ordinal-number-to-text',
      tileStyle: 'fingers'
    }
  }
}`,...j.parameters?.docs?.source}}};L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'ordinal-text-to-number',
      tileStyle: 'fingers'
    }
  }
}`,...L.parameters?.docs?.source}}};M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'cardinal-to-ordinal',
      tileStyle: 'fingers'
    }
  }
}`,...M.parameters?.docs?.source}}};G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'ordinal-to-cardinal',
      tileStyle: 'fingers'
    }
  }
}`,...G.parameters?.docs?.source}}};O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      tileStyle: 'dots'
    }
  }
}`,...O.parameters?.docs?.source}}};I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
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
}`,...I.parameters?.docs?.source}}};R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  args: {
    config: numeralToGroupLongLabelsConfig
  }
}`,...R.parameters?.docs?.source}}};k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: {
    config: numeralToGroupLongLabelsConfig
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobileLg'
    }
  }
}`,...k.parameters?.docs?.source}}};B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  args: {
    config: numeralToGroupLongLabelsConfig
  },
  parameters: {
    viewport: {
      defaultViewport: 'tabletPortrait'
    }
  }
}`,...B.parameters?.docs?.source}}};E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    config: numeralToGroupLongLabelsConfig
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop'
    }
  }
}`,...E.parameters?.docs?.source}}};const gr=["NumeralToGroup","GroupToNumeral","CardinalNumberToText","CardinalTextToNumber","OrdinalNumberToText","OrdinalTextToNumber","CardinalToOrdinal","OrdinalToCardinal","DotsStyle","ObjectsStyle","NumeralToGroupLongLabels","NumeralToGroupLongLabelsMobile","NumeralToGroupLongLabelsTabletPortrait","NumeralToGroupLongLabelsDesktop"];export{C as CardinalNumberToText,w as CardinalTextToNumber,M as CardinalToOrdinal,O as DotsStyle,v as GroupToNumeral,y as NumeralToGroup,R as NumeralToGroupLongLabels,E as NumeralToGroupLongLabelsDesktop,k as NumeralToGroupLongLabelsMobile,B as NumeralToGroupLongLabelsTabletPortrait,I as ObjectsStyle,j as OrdinalNumberToText,L as OrdinalTextToNumber,G as OrdinalToCardinal,gr as __namedExportsOrder,pr as default};
