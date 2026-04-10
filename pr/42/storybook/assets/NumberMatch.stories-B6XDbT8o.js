import{w as q}from"./withDb-n0Gxlya4.js";import{c as Q,b as V,w as F}from"./withRouter-DRoHxMxE.js";import{r as d,j as o}from"./iframe-CgOdpmuB.js";import{n as A}from"./index.browser-BY9c7rfI.js";import{D as H,a as Z,N as $}from"./NumeralTileBank-DrE-MWWR.js";import{A as R}from"./AnswerGame-4dRyl1IO.js";import{G as U}from"./GameOverOverlay-DfxnFxgF.js";import{S as J}from"./ScoreAnimation-Cm2vosVJ.js";import{S as K,a as X}from"./SlotRow-DO1r_St4.js";import{a as Y,u as ee}from"./AnswerGameProvider-BwY5YMK3.js";import{b as te,u as oe,a as re}from"./build-round-order-D80o2y0m.js";import{A as se}from"./AudioButton-z1ZFNW5k.js";import{D as ne}from"./DotGroupQuestion-Bz-Elq13.js";import{T as ae}from"./TextQuestion-BXgAne-v.js";import"./DbProvider-DhSdk5YZ.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-BDIUeRm5.js";import"./index-DNtfybZs.js";import"./index-CyrvxrKc.js";import"./preload-helper-PPVm8Dsz.js";import"./useTouchDrag-CUNBoJZs.js";import"./useDraggableTile-CJMCbpyn.js";import"./useGameTTS-BrfvdqQf.js";import"./useSettings-D19F5MS6.js";import"./useRxDB-DvxLejPd.js";import"./useRxQuery-BPfhVmFI.js";import"./SpeechOutput-By2uxF-i.js";import"./useTranslation-SECndJy5.js";import"./confetti.module-oQXWb4Lk.js";import"./AudioFeedback-cxEhBYIg.js";import"./game-event-bus-CVIPXPct.js";import"./GameRoundContext-BzF8STeT.js";import"./createLucideIcon-Dhryh4-K.js";function C(e){for(let t=e.length-1;t>0;t--){const a=Math.floor(Math.random()*(t+1));[e[t],e[a]]=[e[a],e[t]]}}function ie(e,t,a,n){if(t<=0||a>n)return[];const r=[];for(let s=a;s<=n;s++)s!==e&&r.push(s);return r.length===0?[]:(C(r),r.slice(0,Math.min(t,r.length)))}function D(e,t){const a={id:A(),index:0,expectedValue:String(e),placedTileId:null,isWrong:!1,isLocked:!1},n=[e];if(t.tileBankMode==="distractors"){const s=ie(e,t.distractorCount??0,t.range.min,t.range.max);n.push(...s)}return C(n),{tiles:n.map(s=>({id:A(),label:String(s),value:String(s)})),zones:[a]}}const le=({numberMatchConfig:e,roundOrder:t,onRestartSession:a})=>{const{phase:n,roundIndex:r,retryCount:s,zones:B,allTiles:f}=Y(),i=ee(),{confettiReady:l,gameOverReady:c}=oe(),S=Q(),{locale:v}=V({from:"/$locale"}),y=d.useRef(0),T=t[r],u=T===void 0?void 0:e.rounds[T];re(String(u?.value??""));const O=()=>{S({to:"/$locale",params:{locale:v}})},z=()=>{a()};if(d.useEffect(()=>{if(n!=="round-complete"||!l)return;const p=++y.current,x=globalThis.setTimeout(()=>{if(y.current!==p)return;if(r>=t.length-1){i({type:"COMPLETE_GAME"});return}const E=t[r+1],k=(E===void 0?void 0:e.rounds[E])?.value;if(k===void 0){i({type:"COMPLETE_GAME"});return}const{tiles:L,zones:W}=D(k,{tileBankMode:e.tileBankMode,distractorCount:e.distractorCount,range:e.range});i({type:"ADVANCE_ROUND",tiles:L,zones:W})},750);return()=>{globalThis.clearTimeout(x)}},[n,l,r,i,t,e.rounds,e.tileBankMode,e.distractorCount,e.range]),!u)return null;const _=f.every(p=>{const g=Number.parseInt(p.value,10);return!Number.isNaN(g)&&g<=6})?"size-20 rounded-2xl":"h-[72px] w-32 rounded-2xl",P=e.mode==="numeral-to-group"||e.mode==="numeral-to-word"||e.mode==="word-to-numeral";return o.jsxs(o.Fragment,{children:[o.jsxs("div",{className:"flex w-full max-w-2xl flex-col items-center justify-center gap-8 px-4 py-6",children:[o.jsxs(R.Question,{children:[P?o.jsx(ae,{text:String(u.value)}):o.jsx(ne,{count:u.value,prompt:String(u.value)}),o.jsx(se,{prompt:String(u.value)})]}),o.jsx(R.Answer,{children:o.jsx(K,{className:"gap-4",children:B.map((p,g)=>o.jsx(X,{index:g,className:_,children:({label:x})=>{if(!x)return null;const h=Number.parseInt(x,10);return e.tileStyle==="dots"&&!Number.isNaN(h)?h<=6?o.jsx(H,{value:h}):o.jsx(Z,{value:h}):o.jsx("span",{className:"text-3xl font-bold tabular-nums",children:x})}},p.id))})}),o.jsx(R.Choices,{children:o.jsx($,{tileStyle:e.tileStyle})})]}),o.jsx(J,{visible:l}),c?o.jsx(U,{retryCount:s,onPlayAgain:z,onHome:O}):null]})},G=({config:e,initialState:t,sessionId:a,seed:n})=>{const r=e.roundsInOrder===!0,[s,B]=d.useState(0),f=d.useMemo(()=>te(e.rounds.length,r,n),[e.rounds.length,r,n,s]),i=f[0],l=i===void 0?void 0:e.rounds[i],c=l?.value,{tiles:S,zones:v}=d.useMemo(()=>c===void 0?{tiles:[],zones:[]}:D(c,{tileBankMode:e.tileBankMode,distractorCount:e.distractorCount,range:e.range}),[c,e.tileBankMode,e.distractorCount,e.range]),y=d.useMemo(()=>({gameId:e.gameId,inputMethod:e.inputMethod,wrongTileBehavior:e.wrongTileBehavior,tileBankMode:e.tileBankMode,distractorCount:e.distractorCount,totalRounds:e.rounds.length,roundsInOrder:e.roundsInOrder,ttsEnabled:e.ttsEnabled,initialTiles:S,initialZones:v,slotInteraction:"free-swap"}),[e.gameId,e.inputMethod,e.wrongTileBehavior,e.tileBankMode,e.distractorCount,e.rounds.length,e.roundsInOrder,e.ttsEnabled,S,v]);return l?o.jsx(R,{config:y,initialState:t,sessionId:a,children:o.jsx(le,{numberMatchConfig:e,roundOrder:f,onRestartSession:()=>{B(T=>T+1)}})}):null};G.__docgenInfo={description:"",methods:[],displayName:"NumberMatch",props:{config:{required:!0,tsType:{name:"NumberMatchConfig"},description:""},initialState:{required:!1,tsType:{name:"AnswerGameDraftState"},description:""},sessionId:{required:!1,tsType:{name:"string"},description:""},seed:{required:!1,tsType:{name:"string"},description:""}}};const m={gameId:"number-match-storybook",component:"NumberMatch",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"numeral-to-group",tileStyle:"dots",range:{min:1,max:5},rounds:[{value:3},{value:1},{value:5}]},Fe={component:G,tags:["autodocs"],args:{config:m},decorators:[q,F]},N={},j={args:{config:{...m,mode:"group-to-numeral"}}},w={args:{config:{...m,mode:"numeral-to-word",tileStyle:"fingers"}}},b={args:{config:{...m,mode:"word-to-numeral",tileStyle:"objects"}}},I={args:{config:{...m,tileStyle:"dots"}}},M={args:{config:{...m,tileStyle:"objects",rounds:[{value:3,objectImage:"https://placehold.co/32?text=🍎"}]}}};N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:"{}",...N.parameters?.docs?.source}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'group-to-numeral'
    }
  }
}`,...j.parameters?.docs?.source}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'numeral-to-word',
      tileStyle: 'fingers'
    }
  }
}`,...w.parameters?.docs?.source}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'word-to-numeral',
      tileStyle: 'objects'
    }
  }
}`,...b.parameters?.docs?.source}}};I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      tileStyle: 'dots'
    }
  }
}`,...I.parameters?.docs?.source}}};M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
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
}`,...M.parameters?.docs?.source}}};const He=["NumeralToGroup","GroupToNumeral","NumeralToWord","WordToNumeral","DotsStyle","ObjectsStyle"];export{I as DotsStyle,j as GroupToNumeral,N as NumeralToGroup,w as NumeralToWord,M as ObjectsStyle,b as WordToNumeral,He as __namedExportsOrder,Fe as default};
