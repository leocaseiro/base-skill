import{w as te}from"./withDb-C9R7BESV.js";import{b as V,c as oe,w as ne}from"./withRouter-CM2bI2Nu.js";import{r as g,j as o}from"./iframe-BgNibaQ4.js";import{n as Q}from"./index.browser-BY9c7rfI.js";import{t as H,a as A,b as D,D as se}from"./DotGroupQuestion-DHgpqDpw.js";import{D as ae,N as ie}from"./NumeralTileBank-wJi--nyW.js";import{A as B}from"./AnswerGame-Cv1q5as7.js";import{G as de}from"./GameOverOverlay-CDHiqB3V.js";import{S as le}from"./ScoreAnimation-CcOiiSOT.js";import{S as ue,a as ce}from"./SlotRow-DKY0ZL5l.js";import{a as me,u as pe}from"./AnswerGameProvider-DaTPFlNj.js";import{b as ge,u as xe,a as fe}from"./build-round-order-CWKo-gEX.js";import{A as be}from"./AudioButton-BW8RRsM3.js";import{T as Se}from"./TextQuestion-DV1FkLg-.js";import"./DbProvider-C268Pavu.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-DAcGW7qE.js";import"./index-CoWe4v2v.js";import"./index-BaBJuAkd.js";import"./preload-helper-PPVm8Dsz.js";import"./useGameTTS--uBGt4ZU.js";import"./useSettings-ChNErJI5.js";import"./useRxDB-D11mG05K.js";import"./useRxQuery-BOi7Ukr8.js";import"./SpeechOutput-By2uxF-i.js";import"./useTranslation-D11V984a.js";import"./useTouchDrag-CxQuwMqk.js";import"./useDraggableTile-LB50jnwQ.js";import"./confetti.module-oQXWb4Lk.js";import"./AudioFeedback-cxEhBYIg.js";import"./game-event-bus-CVIPXPct.js";import"./GameRoundContext-DdFlq6JT.js";import"./createLucideIcon-BtLf2kqh.js";const he=(e,r,t)=>{switch(r){case"cardinal-number-to-text":case"ordinal-to-cardinal":return D(e,t);case"ordinal-number-to-text":case"cardinal-to-ordinal":return A(e,t);case"ordinal-text-to-number":return H(e,t);default:return String(e)}};function Z(e){for(let r=e.length-1;r>0;r--){const t=Math.floor(Math.random()*(r+1));[e[r],e[t]]=[e[t],e[r]]}}function Te(e,r,t,s){if(r<=0||t>s)return[];const n=[];for(let i=t;i<=s;i++)i!==e&&n.push(i);return n.length===0?[]:(Z(n),n.slice(0,Math.min(r,n.length)))}function U(e,r){const t={id:Q(),index:0,expectedValue:String(e),placedTileId:null,isWrong:!1,isLocked:!1},s=[e];if(r.tileBankMode==="distractors"){const a=Te(e,r.distractorCount??0,r.range.min,r.range.max);s.push(...a)}Z(s);const n=r.mode??"numeral-to-group",i=r.locale??"en";return{tiles:s.map(a=>({id:Q(),label:he(a,n,i),value:String(a)})),zones:[t]}}const ye=new Set(["cardinal-number-to-text","cardinal-text-to-number","ordinal-number-to-text","ordinal-text-to-number","cardinal-to-ordinal","ordinal-to-cardinal"]),Ne=e=>ye.has(e),je=(e,r,t)=>{switch(r){case"cardinal-number-to-text":return String(e);case"cardinal-text-to-number":return D(e,t);case"ordinal-number-to-text":return H(e,t);case"ordinal-text-to-number":return A(e,t);case"cardinal-to-ordinal":return D(e,t);case"ordinal-to-cardinal":return A(e,t);default:return String(e)}},Ce=({numberMatchConfig:e,roundOrder:r,onRestartSession:t})=>{const{phase:s,roundIndex:n,retryCount:i,zones:S}=me(),a=pe(),{confettiReady:m,gameOverReady:h}=xe(),T=oe(),{locale:x}=V({from:"/$locale"}),u=x==="pt-BR"?"pt-BR":"en",f=g.useRef(0),b=r[n],l=b===void 0?void 0:e.rounds[b];fe(String(l?.value??""));const E=()=>{T({to:"/$locale",params:{locale:x}})},K=()=>{t()};if(g.useEffect(()=>{if(s!=="round-complete"||!m)return;const G=++f.current,c=globalThis.setTimeout(()=>{if(f.current!==G)return;if(n>=r.length-1){a({type:"COMPLETE_GAME"});return}const $=r[n+1],F=($===void 0?void 0:e.rounds[$])?.value;if(F===void 0){a({type:"COMPLETE_GAME"});return}const{tiles:ee,zones:re}=U(F,{tileBankMode:e.tileBankMode,distractorCount:e.distractorCount,range:e.range,mode:e.mode,locale:u});a({type:"ADVANCE_ROUND",tiles:ee,zones:re})},750);return()=>{globalThis.clearTimeout(c)}},[s,m,n,a,r,e.rounds,e.tileBankMode,e.distractorCount,e.range,e.mode,u]),!l)return null;const{mode:p,tileStyle:z}=e,_=p==="numeral-to-group",L=_&&z==="dots",P=Ne(p),X=L?"h-[136px] w-[72px] rounded-2xl":P?"min-w-[80px] h-20 rounded-2xl px-2":"size-20 rounded-2xl",q=je(l.value,p,u),Y=p==="group-to-numeral"||p==="numeral-to-group"?String(l.value):q;return o.jsxs(o.Fragment,{children:[o.jsxs("div",{className:"flex w-full max-w-2xl flex-col items-center justify-center gap-8 px-4 py-6",children:[o.jsxs(B.Question,{children:[p==="group-to-numeral"?o.jsx(se,{count:l.value,prompt:String(l.value)},`round-${n}`):o.jsx(Se,{text:q}),o.jsx(be,{prompt:Y})]}),o.jsx(B.Answer,{children:o.jsx(ue,{className:"gap-4",children:S.map((G,W)=>o.jsx(ce,{index:W,className:X,children:({label:c})=>{if(!c)return null;if(L){const k=Number.parseInt(c,10);if(!Number.isNaN(k))return o.jsx(ae,{value:k})}return P?o.jsx("span",{className:["block text-center font-bold leading-tight hyphens-auto break-words",c.length>6?"text-sm":"text-xl"].join(" "),children:c}):o.jsx("span",{className:"text-3xl font-bold tabular-nums",children:c})}},G.id))})}),o.jsx(B.Choices,{children:o.jsx(ie,{tileStyle:z,tilesShowGroup:_})})]}),o.jsx(le,{visible:m}),h?o.jsx(de,{retryCount:i,onPlayAgain:K,onHome:E}):null]})},J=({config:e,initialState:r,sessionId:t,seed:s})=>{const n=e.roundsInOrder===!0,[i,S]=g.useState(0),{locale:a}=V({from:"/$locale"}),m=a==="pt-BR"?"pt-BR":"en",h=g.useMemo(()=>ge(e.rounds.length,n,s),[e.rounds.length,n,s,i]),T=h[0],x=T===void 0?void 0:e.rounds[T],u=x?.value,{tiles:f,zones:b}=g.useMemo(()=>u===void 0?{tiles:[],zones:[]}:U(u,{tileBankMode:e.tileBankMode,distractorCount:e.distractorCount,range:e.range,mode:e.mode,locale:m}),[u,e.tileBankMode,e.distractorCount,e.range,e.mode,m]),l=g.useMemo(()=>({gameId:e.gameId,inputMethod:e.inputMethod,wrongTileBehavior:e.wrongTileBehavior,tileBankMode:e.tileBankMode,distractorCount:e.distractorCount,totalRounds:e.rounds.length,roundsInOrder:e.roundsInOrder,ttsEnabled:e.ttsEnabled,initialTiles:f,initialZones:b,slotInteraction:"free-swap"}),[e.gameId,e.inputMethod,e.wrongTileBehavior,e.tileBankMode,e.distractorCount,e.rounds.length,e.roundsInOrder,e.ttsEnabled,f,b]);return x?o.jsx(B,{config:l,initialState:r,sessionId:t,children:o.jsx(Ce,{numberMatchConfig:e,roundOrder:h,onRestartSession:()=>{S(E=>E+1)}})}):null};J.__docgenInfo={description:"",methods:[],displayName:"NumberMatch",props:{config:{required:!0,tsType:{name:"NumberMatchConfig"},description:""},initialState:{required:!1,tsType:{name:"AnswerGameDraftState"},description:""},sessionId:{required:!1,tsType:{name:"string"},description:""},seed:{required:!1,tsType:{name:"string"},description:""}}};const d={gameId:"number-match-storybook",component:"NumberMatch",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"numeral-to-group",tileStyle:"dots",range:{min:1,max:5},rounds:[{value:3},{value:1},{value:5}]},ar={component:J,tags:["autodocs"],args:{config:d},decorators:[te,ne]},y={},N={args:{config:{...d,mode:"group-to-numeral"}}},j={args:{config:{...d,mode:"cardinal-number-to-text",tileStyle:"fingers"}}},C={args:{config:{...d,mode:"cardinal-text-to-number",tileStyle:"fingers"}}},v={args:{config:{...d,mode:"ordinal-number-to-text",tileStyle:"fingers"}}},M={args:{config:{...d,mode:"ordinal-text-to-number",tileStyle:"fingers"}}},w={args:{config:{...d,mode:"cardinal-to-ordinal",tileStyle:"fingers"}}},O={args:{config:{...d,mode:"ordinal-to-cardinal",tileStyle:"fingers"}}},R={args:{config:{...d,tileStyle:"dots"}}},I={args:{config:{...d,tileStyle:"objects",rounds:[{value:3,objectImage:"https://placehold.co/32?text=🍎"}]}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:"{}",...y.parameters?.docs?.source}}};N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'group-to-numeral'
    }
  }
}`,...N.parameters?.docs?.source}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'cardinal-number-to-text',
      tileStyle: 'fingers'
    }
  }
}`,...j.parameters?.docs?.source}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'cardinal-text-to-number',
      tileStyle: 'fingers'
    }
  }
}`,...C.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'ordinal-number-to-text',
      tileStyle: 'fingers'
    }
  }
}`,...v.parameters?.docs?.source}}};M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'ordinal-text-to-number',
      tileStyle: 'fingers'
    }
  }
}`,...M.parameters?.docs?.source}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'cardinal-to-ordinal',
      tileStyle: 'fingers'
    }
  }
}`,...w.parameters?.docs?.source}}};O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'ordinal-to-cardinal',
      tileStyle: 'fingers'
    }
  }
}`,...O.parameters?.docs?.source}}};R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      tileStyle: 'dots'
    }
  }
}`,...R.parameters?.docs?.source}}};I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
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
}`,...I.parameters?.docs?.source}}};const ir=["NumeralToGroup","GroupToNumeral","CardinalNumberToText","CardinalTextToNumber","OrdinalNumberToText","OrdinalTextToNumber","CardinalToOrdinal","OrdinalToCardinal","DotsStyle","ObjectsStyle"];export{j as CardinalNumberToText,C as CardinalTextToNumber,w as CardinalToOrdinal,R as DotsStyle,N as GroupToNumeral,y as NumeralToGroup,I as ObjectsStyle,v as OrdinalNumberToText,M as OrdinalTextToNumber,O as OrdinalToCardinal,ir as __namedExportsOrder,ar as default};
