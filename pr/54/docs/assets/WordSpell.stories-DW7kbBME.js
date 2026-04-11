import{w as q}from"./withDb-DaVzNHjw.js";import{c as U,w as Z}from"./withRouter-X25i_yyG.js";import{j as o,r as m}from"./iframe-oWEQ74uG.js";import{n as _}from"./index.browser-BY9c7rfI.js";import{L as Q}from"./LetterTileBank-DOXo5KsC.js";import{A as y}from"./AnswerGame-B7pbDyZS.js";import{G as V}from"./GameOverOverlay-DroTLTjA.js";import{S as $}from"./ScoreAnimation-6v-7RwLJ.js";import{S as F}from"./SentenceWithGaps-Ch4pWGtO.js";import{S as H,a as J}from"./SlotRow-fItr-G1C.js";import{a as K,u as X}from"./AnswerGameProvider-0Cyx5-wi.js";import{b as Y,u as ee,a as te}from"./build-round-order-DcZCLv8x.js";import{A as oe}from"./AudioButton-Be7C5MwR.js";import{u as se}from"./useGameTTS-FRV4Bf45.js";import{I as re}from"./ImageQuestion-DICp7ewf.js";import"./DbProvider-DlXAhyFL.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-Cv5-28l5.js";import"./index-C1VkwZ2e.js";import"./index-CexROuzl.js";import"./preload-helper-PPVm8Dsz.js";import"./useTouchDrag-BWezud-i.js";import"./useDraggableTile-gs2bidDq.js";import"./confetti.module-oQXWb4Lk.js";import"./AudioFeedback-cxEhBYIg.js";import"./game-event-bus-CVIPXPct.js";import"./GameRoundContext-z4ASo3Mg.js";import"./createLucideIcon-B8orJ-39.js";import"./useSettings-DmON4ymd.js";import"./useRxDB-D1iHOsEW.js";import"./useRxQuery-BxfbzSeZ.js";import"./SpeechOutput-By2uxF-i.js";import"./useTranslation-DcdI7xXf.js";const ne=e=>{for(let t=e.length-1;t>0;t--){const a=Math.floor(Math.random()*(t+1));[e[t],e[a]]=[e[a],e[t]]}},G=e=>{const t=e.map((s,l)=>({id:`z${l}`,index:l,expectedValue:s.word,placedTileId:null,isWrong:!1,isLocked:!1})),a=[...e.map(s=>s.word),...e.flatMap(s=>s.distractors??[])];return ne(a),{tiles:a.map(s=>({id:_(),label:s,value:s})),zones:t}},N=({emoji:e,prompt:t})=>{const{speakPrompt:a}=se();return o.jsx("button",{type:"button","aria-label":`${t} — tap to hear`,className:"rounded-xl p-2 focus-visible:outline-2 focus-visible:outline-offset-2",onClick:()=>a(t),children:o.jsx("span",{className:"block text-[7rem] leading-none select-none","aria-hidden":"true",children:e})})};N.__docgenInfo={description:"",methods:[],displayName:"EmojiQuestion",props:{emoji:{required:!0,tsType:{name:"string"},description:"One or more code points (e.g. a single emoji or a ZWJ sequence)."},prompt:{required:!0,tsType:{name:"string"},description:""}}};function ae(e,t){const a=e.trim();if(t==="word")return[a];if(t==="syllable"){const i=a.split(/[-\s]+/).filter(Boolean);return i.length>0?i:[a]}return[...a.toLowerCase()]}function O(e,t){const i=ae(e,t).map(r=>t==="letter"?r.toLowerCase():r.toUpperCase()),s=i.map((r,d)=>({id:`z${d}`,index:d,expectedValue:r,placedTileId:null,isWrong:!1,isLocked:!1}));return{tiles:[...i].toSorted((r,d)=>r.localeCompare(d)).map(r=>({id:_(),label:r,value:r})),zones:s}}const ie=({wordSpellConfig:e,roundOrder:t,onRestartSession:a})=>{const{phase:i,roundIndex:s,retryCount:l,zones:x}=K(),r=X(),{confettiReady:d,gameOverReady:c}=ee(),p=U(),g=m.useRef(0),h=t[s],n=h===void 0?void 0:e.rounds[h];te(n?.word??"");const I=()=>{p({to:"/$locale",params:{locale:"en"}})},L=()=>{a()};if(m.useEffect(()=>{if(i!=="round-complete"||!d)return;const v=++g.current,C=globalThis.setTimeout(()=>{if(g.current!==v)return;if(s>=t.length-1){r({type:"COMPLETE_GAME"});return}const A=t[s+1],f=A===void 0?void 0:e.rounds[A],W=f?.word.trim()??"";if(!W){r({type:"COMPLETE_GAME"});return}if(f?.gaps&&f.gaps.length>0){const{tiles:k,zones:E}=G(f.gaps);r({type:"ADVANCE_ROUND",tiles:k,zones:E})}else{const{tiles:k,zones:E}=O(W,e.tileUnit);r({type:"ADVANCE_ROUND",tiles:k,zones:E})}},750);return()=>{globalThis.clearTimeout(C)}},[i,d,s,r,t,e.rounds,e.tileUnit]),!n)return null;const D=e.mode!=="recall"&&!!n.emoji?.trim(),R=n.sceneImage??n.image,P=e.mode!=="recall"&&!!R;return o.jsxs(o.Fragment,{children:[o.jsxs("div",{className:"flex w-full max-w-2xl flex-col items-center justify-center gap-8 px-4 py-6",children:[o.jsxs(y.Question,{children:[e.mode==="sentence-gap"&&n.sentence?n.gaps&&n.gaps.length>0?o.jsx(F,{sentence:n.sentence,className:"max-w-md text-center text-foreground"}):o.jsx("p",{className:"max-w-md text-center text-lg text-foreground",children:n.sentence}):null,D?o.jsx(N,{emoji:n.emoji.trim(),prompt:n.word}):P?o.jsx(re,{src:R,prompt:n.word}):null,o.jsx(oe,{prompt:n.word})]}),o.jsx(y.Answer,{children:n.gaps&&n.gaps.length>0?null:o.jsx(H,{className:"gap-2",children:x.map((v,B)=>o.jsx(J,{index:B,className:"size-14 rounded-lg",children:({label:C})=>o.jsx("span",{className:"text-2xl font-bold",children:C})},v.id))})}),o.jsx(y.Choices,{children:o.jsx(Q,{})})]}),o.jsx($,{visible:d}),c?o.jsx(V,{retryCount:l,onPlayAgain:L,onHome:I}):null]})},z=({config:e,initialState:t,sessionId:a,seed:i})=>{const s=e.roundsInOrder===!0,[l,x]=m.useState(0),r=m.useMemo(()=>Y(e.rounds.length,s,i),[e.rounds.length,s,i,l]),d=r[0],c=d===void 0?void 0:e.rounds[d],p=c?.word.trim()?c.word:"",{tiles:g,zones:h}=m.useMemo(()=>p?c?.gaps&&c.gaps.length>0?G(c.gaps):O(p,e.tileUnit):{tiles:[],zones:[]},[p,e.tileUnit,c]),n=m.useMemo(()=>({gameId:e.gameId,inputMethod:e.inputMethod,wrongTileBehavior:e.wrongTileBehavior,tileBankMode:e.tileBankMode,distractorCount:e.distractorCount,totalRounds:e.rounds.length,roundsInOrder:e.roundsInOrder,ttsEnabled:e.ttsEnabled,touchKeyboardInputMode:"text",initialTiles:g,initialZones:h,slotInteraction:e.mode==="scramble"||e.mode==="sentence-gap"?"free-swap":"ordered"}),[e.gameId,e.inputMethod,e.wrongTileBehavior,e.tileBankMode,e.distractorCount,e.rounds.length,e.roundsInOrder,e.ttsEnabled,e.mode,g,h]);return c?o.jsx(y,{config:n,initialState:t,sessionId:a,children:o.jsx(ie,{wordSpellConfig:e,roundOrder:r,onRestartSession:()=>{x(I=>I+1)}})}):null};z.__docgenInfo={description:"",methods:[],displayName:"WordSpell",props:{config:{required:!0,tsType:{name:"WordSpellConfig"},description:""},initialState:{required:!1,tsType:{name:"AnswerGameDraftState"},description:""},sessionId:{required:!1,tsType:{name:"string"},description:""},seed:{required:!1,tsType:{name:"string"},description:""}}};const u={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},Ue={component:z,tags:["autodocs"],args:{config:u},decorators:[q,Z]},b={},w={args:{config:{...u,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},M={args:{config:{...u,mode:"scramble"}}},T={args:{config:{...u,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},j={args:{config:{...u,tileBankMode:"distractors",distractorCount:3}}},S={args:{config:{...u,wrongTileBehavior:"lock-manual"}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:"{}",...b.parameters?.docs?.source}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'recall',
      tileBankMode: 'distractors',
      distractorCount: 4,
      rounds: [{
        word: 'cat'
      }]
    }
  }
}`,...w.parameters?.docs?.source}}};M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'scramble'
    }
  }
}`,...M.parameters?.docs?.source}}};T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'sentence-gap',
      rounds: [{
        word: 'sat',
        image: 'https://placehold.co/160?text=scene',
        sentence: 'The cat ___ on the mat.'
      }]
    }
  }
}`,...T.parameters?.docs?.source}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      tileBankMode: 'distractors',
      distractorCount: 3
    }
  }
}`,...j.parameters?.docs?.source}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      wrongTileBehavior: 'lock-manual'
    }
  }
}`,...S.parameters?.docs?.source}}};const Ze=["PictureMode","RecallMode","ScrambleMode","SentenceGapMode","WithDistractors","LockManualWrongTile"];export{S as LockManualWrongTile,b as PictureMode,w as RecallMode,M as ScrambleMode,T as SentenceGapMode,j as WithDistractors,Ze as __namedExportsOrder,Ue as default};
