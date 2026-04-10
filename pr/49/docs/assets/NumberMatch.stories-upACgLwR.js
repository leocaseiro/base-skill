import{w as oe}from"./withDb-DTVP_IDt.js";import{b as H,c as ne,w as se}from"./withRouter-CQEnqSzx.js";import{r as x,j as r}from"./iframe-D3E2on1e.js";import{n as Q}from"./index.browser-BY9c7rfI.js";import{t as Z,a as z,b as P,D as ae}from"./DotGroupQuestion-rXGd7GVr.js";import{D as V,N as ie}from"./NumeralTileBank-Cd55jidy.js";import{A as E}from"./AnswerGame-CeMz4nXL.js";import{G as de}from"./GameOverOverlay-DD5F1FaF.js";import{S as le}from"./ScoreAnimation-Bam_CkGw.js";import{S as ue,a as ce}from"./SlotRow-DgboRdUI.js";import{a as me,u as pe}from"./AnswerGameProvider-HdEKte-P.js";import{b as ge,u as xe,a as fe}from"./build-round-order-B6xSOpNN.js";import{A as he}from"./AudioButton-CBL0mU9R.js";import{T as be}from"./TextQuestion-BjxAJMKq.js";import"./DbProvider-BX52Cuwf.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-CgHij0PC.js";import"./index-DxOaURgz.js";import"./index-DfSaqrFa.js";import"./preload-helper-PPVm8Dsz.js";import"./useGameTTS-COwATXae.js";import"./useSettings-vy9DZBNs.js";import"./useRxDB-DbMJKqeJ.js";import"./useRxQuery-DILFSkUg.js";import"./SpeechOutput-By2uxF-i.js";import"./useTranslation-CpZa6q_3.js";import"./useTouchDrag-VucG8xnx.js";import"./useDraggableTile-gAS2Qivx.js";import"./confetti.module-oQXWb4Lk.js";import"./AudioFeedback-cxEhBYIg.js";import"./game-event-bus-CVIPXPct.js";import"./GameRoundContext-TWIScEwh.js";import"./createLucideIcon-jK3dvFMe.js";const Se=(e,t,o)=>{switch(t){case"cardinal-number-to-text":case"ordinal-to-cardinal":return P(e,o);case"ordinal-number-to-text":case"cardinal-to-ordinal":return z(e,o);case"ordinal-text-to-number":return Z(e,o);default:return String(e)}};function U(e){for(let t=e.length-1;t>0;t--){const o=Math.floor(Math.random()*(t+1));[e[t],e[o]]=[e[o],e[t]]}}function Te(e,t,o,s){if(t<=0||o>s)return[];const n=[];for(let d=o;d<=s;d++)d!==e&&n.push(d);return n.length===0?[]:(U(n),n.slice(0,Math.min(t,n.length)))}function J(e,t){const o={id:Q(),index:0,expectedValue:String(e),placedTileId:null,isWrong:!1,isLocked:!1},s=[e];if(t.tileBankMode==="distractors"){const i=Te(e,t.distractorCount??0,t.range.min,t.range.max);s.push(...i)}U(s);const n=t.mode??"numeral-to-group",d=t.locale??"en";return{tiles:s.map(i=>({id:Q(),label:Se(i,n,d),value:String(i)})),zones:[o]}}const ye=new Set(["cardinal-number-to-text","cardinal-text-to-number","ordinal-number-to-text","ordinal-text-to-number","cardinal-to-ordinal","ordinal-to-cardinal"]),Ne=e=>ye.has(e),je=(e,t,o)=>{switch(t){case"cardinal-number-to-text":return String(e);case"cardinal-text-to-number":return P(e,o);case"ordinal-number-to-text":return Z(e,o);case"ordinal-text-to-number":return z(e,o);case"cardinal-to-ordinal":return P(e,o);case"ordinal-to-cardinal":return z(e,o);default:return String(e)}},Ce=({numberMatchConfig:e,roundOrder:t,onRestartSession:o})=>{const{phase:s,roundIndex:n,retryCount:d,zones:S}=me(),i=pe(),{confettiReady:m,gameOverReady:T}=xe(),y=ne(),{locale:f}=H({from:"/$locale"}),c=f==="pt-BR"?"pt-BR":"en",h=x.useRef(0),b=t[n],u=b===void 0?void 0:e.rounds[b];fe(String(u?.value??""));const k=()=>{y({to:"/$locale",params:{locale:f}})},X=()=>{o()};if(x.useEffect(()=>{if(s!=="round-complete"||!m)return;const D=++h.current,a=globalThis.setTimeout(()=>{if(h.current!==D)return;if(n>=t.length-1){i({type:"COMPLETE_GAME"});return}const $=t[n+1],F=($===void 0?void 0:e.rounds[$])?.value;if(F===void 0){i({type:"COMPLETE_GAME"});return}const{tiles:te,zones:re}=J(F,{tileBankMode:e.tileBankMode,distractorCount:e.distractorCount,range:e.range,mode:e.mode,locale:c});i({type:"ADVANCE_ROUND",tiles:te,zones:re})},750);return()=>{globalThis.clearTimeout(a)}},[s,m,n,i,t,e.rounds,e.tileBankMode,e.distractorCount,e.range,e.mode,c]),!u)return null;const{mode:p,tileStyle:_}=e,q=p==="numeral-to-group",G=q&&_==="dots",A=Ne(p),Y=G?"h-[136px] w-[72px] rounded-2xl":A?"min-w-[80px] h-20 rounded-2xl px-2":"size-20 rounded-2xl",W=je(u.value,p,c),ee=p==="group-to-numeral"||p==="numeral-to-group"?String(u.value):W;return r.jsxs(r.Fragment,{children:[r.jsxs("div",{className:"flex w-full max-w-2xl flex-col items-center justify-center gap-8 px-4 py-6",children:[r.jsxs(E.Question,{children:[p==="group-to-numeral"?r.jsx(ae,{count:u.value,prompt:String(u.value)},`round-${n}`):r.jsx(be,{text:W}),r.jsx(he,{prompt:ee})]}),r.jsx(E.Answer,{children:r.jsx(ue,{className:"gap-4",children:S.map((D,L)=>r.jsx(ce,{index:L,className:Y,renderPreview:a=>{if(G){const g=Number.parseInt(a,10);if(!Number.isNaN(g))return r.jsx("div",{className:"opacity-50",children:r.jsx(V,{value:g})})}return A?r.jsx("span",{className:["block text-center font-bold leading-tight hyphens-auto break-words opacity-50",a.length>6?"text-sm":"text-xl"].join(" "),children:a}):r.jsx("span",{className:"text-3xl font-bold tabular-nums opacity-50",children:a})},children:({label:a})=>{if(!a)return null;if(G){const g=Number.parseInt(a,10);if(!Number.isNaN(g))return r.jsx(V,{value:g})}return A?r.jsx("span",{className:["block text-center font-bold leading-tight hyphens-auto break-words",a.length>6?"text-sm":"text-xl"].join(" "),children:a}):r.jsx("span",{className:"text-3xl font-bold tabular-nums",children:a})}},D.id))})}),r.jsx(E.Choices,{children:r.jsx(ie,{tileStyle:_,tilesShowGroup:q})})]}),r.jsx(le,{visible:m}),T?r.jsx(de,{retryCount:d,onPlayAgain:X,onHome:k}):null]})},K=({config:e,initialState:t,sessionId:o,seed:s})=>{const n=e.roundsInOrder===!0,[d,S]=x.useState(0),{locale:i}=H({from:"/$locale"}),m=i==="pt-BR"?"pt-BR":"en",T=x.useMemo(()=>ge(e.rounds.length,n,s),[e.rounds.length,n,s,d]),y=T[0],f=y===void 0?void 0:e.rounds[y],c=f?.value,{tiles:h,zones:b}=x.useMemo(()=>c===void 0?{tiles:[],zones:[]}:J(c,{tileBankMode:e.tileBankMode,distractorCount:e.distractorCount,range:e.range,mode:e.mode,locale:m}),[c,e.tileBankMode,e.distractorCount,e.range,e.mode,m]),u=x.useMemo(()=>({gameId:e.gameId,inputMethod:e.inputMethod,wrongTileBehavior:e.wrongTileBehavior,tileBankMode:e.tileBankMode,distractorCount:e.distractorCount,totalRounds:e.rounds.length,roundsInOrder:e.roundsInOrder,ttsEnabled:e.ttsEnabled,initialTiles:h,initialZones:b,slotInteraction:"free-swap"}),[e.gameId,e.inputMethod,e.wrongTileBehavior,e.tileBankMode,e.distractorCount,e.rounds.length,e.roundsInOrder,e.ttsEnabled,h,b]);return f?r.jsx(E,{config:u,initialState:t,sessionId:o,children:r.jsx(Ce,{numberMatchConfig:e,roundOrder:T,onRestartSession:()=>{S(k=>k+1)}})}):null};K.__docgenInfo={description:"",methods:[],displayName:"NumberMatch",props:{config:{required:!0,tsType:{name:"NumberMatchConfig"},description:""},initialState:{required:!1,tsType:{name:"AnswerGameDraftState"},description:""},sessionId:{required:!1,tsType:{name:"string"},description:""},seed:{required:!1,tsType:{name:"string"},description:""}}};const l={gameId:"number-match-storybook",component:"NumberMatch",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"numeral-to-group",tileStyle:"dots",range:{min:1,max:5},rounds:[{value:3},{value:1},{value:5}]},at={component:K,tags:["autodocs"],args:{config:l},decorators:[oe,se]},N={},j={args:{config:{...l,mode:"group-to-numeral"}}},C={args:{config:{...l,mode:"cardinal-number-to-text",tileStyle:"fingers"}}},v={args:{config:{...l,mode:"cardinal-text-to-number",tileStyle:"fingers"}}},M={args:{config:{...l,mode:"ordinal-number-to-text",tileStyle:"fingers"}}},O={args:{config:{...l,mode:"ordinal-text-to-number",tileStyle:"fingers"}}},w={args:{config:{...l,mode:"cardinal-to-ordinal",tileStyle:"fingers"}}},I={args:{config:{...l,mode:"ordinal-to-cardinal",tileStyle:"fingers"}}},R={args:{config:{...l,tileStyle:"dots"}}},B={args:{config:{...l,tileStyle:"objects",rounds:[{value:3,objectImage:"https://placehold.co/32?text=🍎"}]}}};N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:"{}",...N.parameters?.docs?.source}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'group-to-numeral'
    }
  }
}`,...j.parameters?.docs?.source}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'cardinal-number-to-text',
      tileStyle: 'fingers'
    }
  }
}`,...C.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'cardinal-text-to-number',
      tileStyle: 'fingers'
    }
  }
}`,...v.parameters?.docs?.source}}};M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'ordinal-number-to-text',
      tileStyle: 'fingers'
    }
  }
}`,...M.parameters?.docs?.source}}};O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'ordinal-text-to-number',
      tileStyle: 'fingers'
    }
  }
}`,...O.parameters?.docs?.source}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'cardinal-to-ordinal',
      tileStyle: 'fingers'
    }
  }
}`,...w.parameters?.docs?.source}}};I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'ordinal-to-cardinal',
      tileStyle: 'fingers'
    }
  }
}`,...I.parameters?.docs?.source}}};R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      tileStyle: 'dots'
    }
  }
}`,...R.parameters?.docs?.source}}};B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
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
}`,...B.parameters?.docs?.source}}};const it=["NumeralToGroup","GroupToNumeral","CardinalNumberToText","CardinalTextToNumber","OrdinalNumberToText","OrdinalTextToNumber","CardinalToOrdinal","OrdinalToCardinal","DotsStyle","ObjectsStyle"];export{C as CardinalNumberToText,v as CardinalTextToNumber,w as CardinalToOrdinal,R as DotsStyle,j as GroupToNumeral,N as NumeralToGroup,B as ObjectsStyle,M as OrdinalNumberToText,O as OrdinalTextToNumber,I as OrdinalToCardinal,it as __namedExportsOrder,at as default};
