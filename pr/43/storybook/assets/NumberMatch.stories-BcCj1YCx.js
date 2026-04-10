import{w as q}from"./withDb-DYma0W4Q.js";import{c as Q,b as V,w as H}from"./withRouter-Cyg0z-Nt.js";import{r as u,j as o}from"./iframe-CqmSs6WP.js";import{n as A}from"./index.browser-BY9c7rfI.js";import{D as Z,N as $}from"./NumeralTileBank-DDDng3Pp.js";import{A as w}from"./AnswerGame-DrY0jeVk.js";import{G as F}from"./GameOverOverlay-Ba6mlrte.js";import{S as U}from"./ScoreAnimation-Dp5XAT3q.js";import{S as J,a as K}from"./SlotRow-DmaljN9k.js";import{a as X,u as Y}from"./AnswerGameProvider-BDm98X0l.js";import{b as ee,u as te,a as oe}from"./build-round-order-BEPnafvv.js";import{A as re}from"./AudioButton-By7hvC4R.js";import{D as se}from"./DotGroupQuestion-xBuG_s8-.js";import{T as ne}from"./TextQuestion-DcK9TL2o.js";import"./DbProvider-B5sEp5j5.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-BVJ8x6to.js";import"./index-H8mH5EvO.js";import"./index-pTK7p3TG.js";import"./preload-helper-PPVm8Dsz.js";import"./useTouchDrag-DS8oPuOb.js";import"./useDraggableTile-B_3bfc_Y.js";import"./useGameTTS-DvWknNWW.js";import"./useSettings-FuFc0odM.js";import"./useRxDB-Cci03qda.js";import"./useRxQuery-Bcuko1gn.js";import"./SpeechOutput-By2uxF-i.js";import"./useTranslation-DhIsuRmd.js";import"./confetti.module-oQXWb4Lk.js";import"./AudioFeedback-cxEhBYIg.js";import"./game-event-bus-CVIPXPct.js";import"./GameRoundContext-Bk3PsdQl.js";import"./createLucideIcon-CAtLxysN.js";function C(e){for(let t=e.length-1;t>0;t--){const a=Math.floor(Math.random()*(t+1));[e[t],e[a]]=[e[a],e[t]]}}function ae(e,t,a,n){if(t<=0||a>n)return[];const r=[];for(let s=a;s<=n;s++)s!==e&&r.push(s);return r.length===0?[]:(C(r),r.slice(0,Math.min(t,r.length)))}function G(e,t){const a={id:A(),index:0,expectedValue:String(e),placedTileId:null,isWrong:!1,isLocked:!1},n=[e];if(t.tileBankMode==="distractors"){const s=ae(e,t.distractorCount??0,t.range.min,t.range.max);n.push(...s)}return C(n),{tiles:n.map(s=>({id:A(),label:String(s),value:String(s)})),zones:[a]}}const ie=({numberMatchConfig:e,roundOrder:t,onRestartSession:a})=>{const{phase:n,roundIndex:r,retryCount:s,zones:I}=X(),l=Y(),{confettiReady:d,gameOverReady:x}=te(),c=Q(),{locale:h}=V({from:"/$locale"}),p=u.useRef(0),f=t[r],i=f===void 0?void 0:e.rounds[f];oe(String(i?.value??""));const D=()=>{c({to:"/$locale",params:{locale:h}})},z=()=>{a()};if(u.useEffect(()=>{if(n!=="round-complete"||!d)return;const b=++p.current,g=globalThis.setTimeout(()=>{if(p.current!==b)return;if(r>=t.length-1){l({type:"COMPLETE_GAME"});return}const E=t[r+1],k=(E===void 0?void 0:e.rounds[E])?.value;if(k===void 0){l({type:"COMPLETE_GAME"});return}const{tiles:L,zones:W}=G(k,{tileBankMode:e.tileBankMode,distractorCount:e.distractorCount,range:e.range});l({type:"ADVANCE_ROUND",tiles:L,zones:W})},750);return()=>{globalThis.clearTimeout(g)}},[n,d,r,l,t,e.rounds,e.tileBankMode,e.distractorCount,e.range]),!i)return null;const R=e.tileStyle==="dots",_=R?"h-[136px] w-[72px] rounded-2xl":"size-20 rounded-2xl",P=e.mode==="numeral-to-group"||e.mode==="numeral-to-word"||e.mode==="word-to-numeral";return o.jsxs(o.Fragment,{children:[o.jsxs("div",{className:"flex w-full max-w-2xl flex-col items-center justify-center gap-8 px-4 py-6",children:[o.jsxs(w.Question,{children:[P?o.jsx(ne,{text:String(i.value)}):o.jsx(se,{count:i.value,prompt:String(i.value)}),o.jsx(re,{prompt:String(i.value)})]}),o.jsx(w.Answer,{children:o.jsx(J,{className:"gap-4",children:I.map((b,B)=>o.jsx(K,{index:B,className:_,children:({label:g})=>{if(!g)return null;const M=Number.parseInt(g,10);return R&&!Number.isNaN(M)?o.jsx(Z,{value:M}):o.jsx("span",{className:"text-3xl font-bold tabular-nums",children:g})}},b.id))})}),o.jsx(w.Choices,{children:o.jsx($,{tileStyle:e.tileStyle})})]}),o.jsx(U,{visible:d}),x?o.jsx(F,{retryCount:s,onPlayAgain:z,onHome:D}):null]})},O=({config:e,initialState:t,sessionId:a,seed:n})=>{const r=e.roundsInOrder===!0,[s,I]=u.useState(0),l=u.useMemo(()=>ee(e.rounds.length,r,n),[e.rounds.length,r,n,s]),d=l[0],x=d===void 0?void 0:e.rounds[d],c=x?.value,{tiles:h,zones:p}=u.useMemo(()=>c===void 0?{tiles:[],zones:[]}:G(c,{tileBankMode:e.tileBankMode,distractorCount:e.distractorCount,range:e.range}),[c,e.tileBankMode,e.distractorCount,e.range]),f=u.useMemo(()=>({gameId:e.gameId,inputMethod:e.inputMethod,wrongTileBehavior:e.wrongTileBehavior,tileBankMode:e.tileBankMode,distractorCount:e.distractorCount,totalRounds:e.rounds.length,roundsInOrder:e.roundsInOrder,ttsEnabled:e.ttsEnabled,initialTiles:h,initialZones:p,slotInteraction:"free-swap"}),[e.gameId,e.inputMethod,e.wrongTileBehavior,e.tileBankMode,e.distractorCount,e.rounds.length,e.roundsInOrder,e.ttsEnabled,h,p]);return x?o.jsx(w,{config:f,initialState:t,sessionId:a,children:o.jsx(ie,{numberMatchConfig:e,roundOrder:l,onRestartSession:()=>{I(i=>i+1)}})}):null};O.__docgenInfo={description:"",methods:[],displayName:"NumberMatch",props:{config:{required:!0,tsType:{name:"NumberMatchConfig"},description:""},initialState:{required:!1,tsType:{name:"AnswerGameDraftState"},description:""},sessionId:{required:!1,tsType:{name:"string"},description:""},seed:{required:!1,tsType:{name:"string"},description:""}}};const m={gameId:"number-match-storybook",component:"NumberMatch",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"numeral-to-group",tileStyle:"dots",range:{min:1,max:5},rounds:[{value:3},{value:1},{value:5}]},Qe={component:O,tags:["autodocs"],args:{config:m},decorators:[q,H]},S={},y={args:{config:{...m,mode:"group-to-numeral"}}},v={args:{config:{...m,mode:"numeral-to-word",tileStyle:"fingers"}}},T={args:{config:{...m,mode:"word-to-numeral",tileStyle:"objects"}}},j={args:{config:{...m,tileStyle:"dots"}}},N={args:{config:{...m,tileStyle:"objects",rounds:[{value:3,objectImage:"https://placehold.co/32?text=🍎"}]}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:"{}",...S.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'group-to-numeral'
    }
  }
}`,...y.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'numeral-to-word',
      tileStyle: 'fingers'
    }
  }
}`,...v.parameters?.docs?.source}}};T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'word-to-numeral',
      tileStyle: 'objects'
    }
  }
}`,...T.parameters?.docs?.source}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      tileStyle: 'dots'
    }
  }
}`,...j.parameters?.docs?.source}}};N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
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
}`,...N.parameters?.docs?.source}}};const Ve=["NumeralToGroup","GroupToNumeral","NumeralToWord","WordToNumeral","DotsStyle","ObjectsStyle"];export{j as DotsStyle,y as GroupToNumeral,S as NumeralToGroup,v as NumeralToWord,N as ObjectsStyle,T as WordToNumeral,Ve as __namedExportsOrder,Qe as default};
