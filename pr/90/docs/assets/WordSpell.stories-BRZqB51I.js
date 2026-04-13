import{w as F}from"./withDb-Do3LP4JL.js";import{c as Z,w as Q}from"./withRouter-D479BB7o.js";import{r as m,j as a}from"./iframe-4iXsfuqF.js";import{n as G}from"./index.browser-BY9c7rfI.js";import{L as V}from"./LetterTileBank-DCbI292I.js";import{f as $}from"./filter-Bd5ZYMZU.js";import{A as C}from"./AnswerGame-tja2Q088.js";import{G as H}from"./GameOverOverlay-CXeR56Fb.js";import{S as J}from"./ScoreAnimation-DShuZpj7.js";import{S as K}from"./SentenceWithGaps-D523WVPc.js";import{S as X,a as Y}from"./SlotRow-C-gXib6o.js";import{a as ee,u as oe}from"./AnswerGameProvider-BEZkJQ1j.js";import{b as te,u as se,a as ne}from"./build-round-order-D_7NguBU.js";import{A as re}from"./AudioButton-8uX28suM.js";import{u as ae}from"./useGameTTS-CWsC7lfn.js";import{I as ie}from"./ImageQuestion-DRYgNcGJ.js";import"./DbProvider-cwnK4i0h.js";import"./Subject-VZNLZCXQ.js";import"./tslib.es6--Hu8dhvm.js";import"./index-CFAaUW5Y.js";import"./index-CREi3wBt.js";import"./index-BOXwUZEJ.js";import"./preload-helper-PPVm8Dsz.js";import"./useTouchDrag-D1q3GeBU.js";import"./useDraggableTile-Cn3kHG1j.js";import"./confetti.module-oQXWb4Lk.js";import"./AudioFeedback-cxEhBYIg.js";import"./game-event-bus-CVIPXPct.js";import"./GameRoundContext-Bwp7Wn33.js";import"./createLucideIcon-D0Fj1lo5.js";import"./useSettings-gNpCtdpO.js";import"./useRxDB-C3eviM2n.js";import"./useRxQuery-C_B0AlvH.js";import"./SpeechOutput-Dyw1q0Rq.js";import"./safe-get-voices-dEfMv828.js";import"./useTranslation-CKx7QIEv.js";import"./index-DxuxJ6Tq.js";const le=e=>{for(let t=e.length-1;t>0;t--){const n=Math.floor(Math.random()*(t+1));[e[t],e[n]]=[e[n],e[t]]}},z=e=>{const t=e.map((s,r)=>({id:`z${r}`,index:r,expectedValue:s.word,placedTileId:null,isWrong:!1,isLocked:!1})),n=[...e.map(s=>s.word),...e.flatMap(s=>s.distractors??[])];return le(n),{tiles:n.map(s=>({id:G(),label:s,value:s})),zones:t}},de={sh:"ʃ",ch:"tʃ",th_voiceless:"θ",th_voiced:"ð",ng:"ŋ",zh:"ʒ",oo_long:"uː",oo_short:"ʊ",schwa:"ə"};Object.fromEntries(Object.entries(de).map(([e,t])=>[t,e]));const ce=e=>({word:e.syllables?e.syllables.join("-"):e.word}),ue=e=>e.source?{rounds:[],isLoading:!0}:{rounds:e.rounds??[],isLoading:!1},me=e=>{const[t,n]=m.useState(()=>ue(e));return m.useEffect(()=>{if(e.rounds&&e.rounds.length>0){const r=e.rounds;n(o=>o.rounds===r&&!o.isLoading&&o.usedFallback===void 0?o:{rounds:r,isLoading:!1});return}const d=e.source;if(!d){n(r=>r.rounds.length===0&&!r.isLoading&&r.usedFallback===void 0?r:{rounds:[],isLoading:!1});return}const s={isCancelled:!1};return n(r=>r.isLoading?r:{...r,isLoading:!0}),(async()=>{const r=await $(d.filter);if(s.isCancelled)return;const o=d.limit??e.totalRounds,i=r.hits.slice(0,o).map(c=>ce(c));n({rounds:i,isLoading:!1,usedFallback:r.usedFallback})})(),()=>{s.isCancelled=!0}},[e.rounds,e.source,e.totalRounds]),t},D=({emoji:e,prompt:t})=>{const{speakPrompt:n}=ae();return a.jsx("button",{type:"button","aria-label":`${t} — tap to hear`,className:"rounded-xl p-2 focus-visible:outline-2 focus-visible:outline-offset-2",onClick:()=>n(t),children:a.jsx("span",{className:"block text-[7rem] leading-none select-none","aria-hidden":"true",children:e})})};D.__docgenInfo={description:"",methods:[],displayName:"EmojiQuestion",props:{emoji:{required:!0,tsType:{name:"string"},description:"One or more code points (e.g. a single emoji or a ZWJ sequence)."},prompt:{required:!0,tsType:{name:"string"},description:""}}};function pe(e,t){const n=e.trim();if(t==="word")return[n];if(t==="syllable"){const d=n.split(/[-\s]+/).filter(Boolean);return d.length>0?d:[n]}return[...n.toLowerCase()]}function P(e,t){const d=pe(e,t).map(i=>t==="letter"?i.toLowerCase():i.toUpperCase()),s=d.map((i,c)=>({id:`z${c}`,index:c,expectedValue:i,placedTileId:null,isWrong:!1,isLocked:!1}));return{tiles:[...d].toSorted((i,c)=>i.localeCompare(c)).map(i=>({id:G(),label:i,value:i})),zones:s}}const ge=({wordSpellConfig:e,roundOrder:t,onRestartSession:n})=>{const{phase:d,roundIndex:s,retryCount:r,zones:o}=ee(),i=oe(),{confettiReady:c,gameOverReady:I}=se(),h=Z(),f=m.useRef(0),u=m.useMemo(()=>e.rounds??[],[e.rounds]),p=t[s],l=p===void 0?void 0:u[p];ne(l?.word??"");const x=()=>{h({to:"/$locale",params:{locale:"en"}})},E=()=>{n()};if(m.useEffect(()=>{if(d!=="round-complete"||!c)return;const R=++f.current,L=globalThis.setTimeout(()=>{if(f.current!==R)return;if(s>=t.length-1){i({type:"COMPLETE_GAME"});return}const A=t[s+1],b=A===void 0?void 0:u[A],N=b?.word.trim()??"";if(!N){i({type:"COMPLETE_GAME"});return}if(b?.gaps&&b.gaps.length>0){const{tiles:B,zones:_}=z(b.gaps);i({type:"ADVANCE_ROUND",tiles:B,zones:_})}else{const{tiles:B,zones:_}=P(N,e.tileUnit);i({type:"ADVANCE_ROUND",tiles:B,zones:_})}},750);return()=>{globalThis.clearTimeout(L)}},[d,c,s,i,t,u,e.tileUnit]),!l)return null;const v=e.mode!=="recall"&&!!l.emoji?.trim(),O=l.sceneImage??l.image,U=e.mode!=="recall"&&!!O;return a.jsxs(a.Fragment,{children:[a.jsxs("div",{className:"flex w-full max-w-2xl flex-col items-center justify-center gap-8 px-4 py-6",children:[a.jsxs(C.Question,{children:[e.mode==="sentence-gap"&&l.sentence?l.gaps&&l.gaps.length>0?a.jsx(K,{sentence:l.sentence,className:"max-w-md text-center text-foreground"}):a.jsx("p",{className:"max-w-md text-center text-lg text-foreground",children:l.sentence}):null,v?a.jsx(D,{emoji:l.emoji.trim(),prompt:l.word}):U?a.jsx(ie,{src:O,prompt:l.word}):null,a.jsx(re,{prompt:l.word})]}),a.jsx(C.Answer,{children:l.gaps&&l.gaps.length>0?null:a.jsx(X,{className:"gap-2",children:o.map((R,W)=>a.jsx(Y,{index:W,className:"size-14 rounded-lg",children:({label:L})=>a.jsx("span",{className:"text-2xl font-bold",children:L})},R.id))})}),a.jsx(C.Choices,{children:a.jsx(V,{})})]}),a.jsx(J,{visible:c}),I?a.jsx(H,{retryCount:r,onPlayAgain:E,onHome:x}):null]})},q=({config:e,initialState:t,sessionId:n,seed:d})=>{const{rounds:s,isLoading:r}=me(e),o=m.useMemo(()=>({...e,rounds:s}),[e,s]),i=o.roundsInOrder===!0,[c,I]=m.useState(0),h=m.useMemo(()=>te(s.length,i,d),[s.length,i,d,c]),f=h[0],u=f===void 0?void 0:s[f],p=u?.word.trim()?u.word:"",{tiles:l,zones:x}=m.useMemo(()=>p?u?.gaps&&u.gaps.length>0?z(u.gaps):P(p,o.tileUnit):{tiles:[],zones:[]},[p,o.tileUnit,u]),E=m.useMemo(()=>({gameId:o.gameId,inputMethod:o.inputMethod,wrongTileBehavior:o.wrongTileBehavior,tileBankMode:o.tileBankMode,distractorCount:o.distractorCount,totalRounds:s.length,roundsInOrder:o.roundsInOrder,ttsEnabled:o.ttsEnabled,touchKeyboardInputMode:"text",initialTiles:l,initialZones:x,slotInteraction:o.mode==="scramble"||o.mode==="sentence-gap"?"free-swap":"ordered"}),[o.gameId,o.inputMethod,o.wrongTileBehavior,o.tileBankMode,o.distractorCount,s.length,o.roundsInOrder,o.ttsEnabled,o.mode,l,x]);return r?a.jsx("div",{role:"status",className:"flex min-h-[200px] w-full items-center justify-center text-foreground",children:"Loading words…"}):u?a.jsx(C,{config:E,initialState:c===0?t:void 0,sessionId:n,children:a.jsx(ge,{wordSpellConfig:o,roundOrder:h,onRestartSession:()=>{I(v=>v+1)}})},c):null};q.__docgenInfo={description:"",methods:[],displayName:"WordSpell",props:{config:{required:!0,tsType:{name:"WordSpellConfig"},description:""},initialState:{required:!1,tsType:{name:"AnswerGameDraftState"},description:""},sessionId:{required:!1,tsType:{name:"string"},description:""},seed:{required:!1,tsType:{name:"string"},description:""}}};const g={gameId:"word-spell-storybook",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:5,roundsInOrder:!0,ttsEnabled:!0,mode:"picture",tileUnit:"letter",rounds:[{word:"cat",image:"https://placehold.co/160?text=🐱"},{word:"dog",image:"https://placehold.co/160?text=🐶"}]},Ye={component:q,tags:["autodocs"],args:{config:g},decorators:[F,Q]},w={},M={args:{config:{...g,mode:"recall",tileBankMode:"distractors",distractorCount:4,rounds:[{word:"cat"}]}}},y={args:{config:{...g,mode:"scramble"}}},j={args:{config:{...g,mode:"sentence-gap",rounds:[{word:"sat",image:"https://placehold.co/160?text=scene",sentence:"The cat ___ on the mat."}]}}},S={args:{config:{...g,tileBankMode:"distractors",distractorCount:3}}},T={args:{config:{...g,wrongTileBehavior:"lock-manual"}}},k={args:{config:{gameId:"word-spell-library-sourced",component:"WordSpell",inputMethod:"drag",wrongTileBehavior:"lock-auto-eject",tileBankMode:"exact",totalRounds:4,roundsInOrder:!0,ttsEnabled:!0,mode:"recall",tileUnit:"letter",source:{type:"word-library",filter:{region:"aus",levels:[1,2],syllableCountEq:1}}}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:"{}",...w.parameters?.docs?.source}}};M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
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
}`,...M.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      mode: 'scramble'
    }
  }
}`,...y.parameters?.docs?.source}}};j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
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
}`,...j.parameters?.docs?.source}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      tileBankMode: 'distractors',
      distractorCount: 3
    }
  }
}`,...S.parameters?.docs?.source}}};T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      ...baseConfig,
      wrongTileBehavior: 'lock-manual'
    }
  }
}`,...T.parameters?.docs?.source}}};k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: {
    config: {
      gameId: 'word-spell-library-sourced',
      component: 'WordSpell',
      inputMethod: 'drag',
      wrongTileBehavior: 'lock-auto-eject',
      tileBankMode: 'exact',
      totalRounds: 4,
      roundsInOrder: true,
      ttsEnabled: true,
      mode: 'recall',
      tileUnit: 'letter',
      source: {
        type: 'word-library',
        filter: {
          region: 'aus',
          levels: [1, 2],
          syllableCountEq: 1
        }
      }
    }
  }
}`,...k.parameters?.docs?.source}}};const eo=["PictureMode","RecallMode","ScrambleMode","SentenceGapMode","WithDistractors","LockManualWrongTile","LibrarySourced"];export{k as LibrarySourced,T as LockManualWrongTile,w as PictureMode,M as RecallMode,y as ScrambleMode,j as SentenceGapMode,S as WithDistractors,eo as __namedExportsOrder,Ye as default};
